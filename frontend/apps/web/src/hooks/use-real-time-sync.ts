import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useSyncStore } from '@/stores';
import { electricSync } from '@/../../apps/server/src/db/electric';
import { z } from 'zod';

interface RealtimeSyncConfig<T extends z.ZodType> {
	table: string;
	queryKey: string[];
	schema: T;
	where?: string;
	columns?: string[];
	enabled?: boolean;
}

export function useRealtimeData<T extends z.ZodType>(
	config: RealtimeSyncConfig<T>
) {
	const { table, queryKey, schema, where, columns, enabled = true } = config;
	const queryClient = useQueryClient();
	const { isOnline } = useSyncStore();
	const [electricData, setElectricData] = useState<z.infer<T>[]>([]);
	const [isSubscribed, setIsSubscribed] = useState(false);
	const [syncLatency, setSyncLatency] = useState<number>(0);
	const subscriptionRef = useRef<(() => void) | null>(null);

	// Set up Electric subscription
	useEffect(() => {
		if (!enabled || !isOnline) {
			return;
		}

		const setupSubscription = async () => {
			try {
				await electricSync.initialize();
				const syncStart = Date.now();
				
				const stream = await electricSync.syncShape(table, schema, where, columns);
				
				const unsubscribe = stream.subscribe((data: z.infer<T>[]) => {
					const latency = Date.now() - syncStart;
					setSyncLatency(latency);
					setElectricData(data);
					
					// Update TanStack Query cache
					queryClient.setQueryData([...queryKey, where], data);
				});
				
				subscriptionRef.current = unsubscribe;
				setIsSubscribed(true);
			} catch (error) {
				console.error(`Failed to setup subscription for ${table}:`, error);
				setIsSubscribed(false);
			}
		};

		setupSubscription();

		return () => {
			if (subscriptionRef.current) {
				subscriptionRef.current();
				subscriptionRef.current = null;
			}
			setIsSubscribed(false);
		};
	}, [enabled, isOnline, table, where, JSON.stringify(columns)]);

	// TanStack Query for fallback and caching
	const query = useQuery({
		queryKey: [...queryKey, where],
		queryFn: async (): Promise<z.infer<T>[]> => {
			const response = await fetch(`/api/${table}${where ? `?where=${encodeURIComponent(where)}` : ''}`);
			if (!response.ok) {
				throw new Error(`Failed to fetch ${table}`);
			}
			const data = await response.json();
			return z.array(schema).parse(data);
		},
		initialData: electricData.length > 0 ? electricData : undefined,
		staleTime: isSubscribed ? Infinity : 30000, // Let Electric handle updates when subscribed
		enabled: enabled,
	});

	// Optimistic updates with conflict resolution
	const mutation = useMutation({
		mutationFn: async (updates: Partial<z.infer<T>> & { id: string }) => {
			const response = await fetch(`/api/${table}/${updates.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updates),
			});
			
			if (!response.ok) {
				throw new Error(`Failed to update ${table}`);
			}
			
			return response.json();
		},
		onMutate: async (updates) => {
			await queryClient.cancelQueries({ queryKey: [...queryKey, where] });
			const previous = queryClient.getQueryData([...queryKey, where]);
			
			// Optimistic update
			queryClient.setQueryData([...queryKey, where], (old: z.infer<T>[]) => {
				if (!old) return [];
				return old.map(item => 
					(item as any).id === updates.id ? { ...item, ...updates } : item
				);
			});
			
			return { previous };
		},
		onError: (err, updates, context) => {
			if (context?.previous) {
				queryClient.setQueryData([...queryKey, where], context.previous);
			}
		},
		onSuccess: (data) => {
			// Update cache with server response
			queryClient.setQueryData([...queryKey, where], (old: z.infer<T>[]) => {
				if (!old) return [data];
				return old.map(item => 
					(item as any).id === data.id ? data : item
				);
			});
		}
	});

	return {
		data: query.data ?? electricData ?? [],
		isLoading: query.isLoading,
		isError: query.isError,
		error: query.error,
		mutate: mutation.mutate,
		mutateAsync: mutation.mutateAsync,
		isOptimistic: mutation.isPending,
		isSubscribed,
		isOnline,
		syncLatency,
		refetch: query.refetch,
	};
}

// Schema imports for type safety
import { 
	selectProjectSchema,
	selectAgentSchema,
	selectSessionSchema,
	selectMessageSchema,
	selectMemorySchema
} from '@/../../apps/server/src/db/schema';

// Specific hooks for different data types with full type safety
export function useProjectsSync(userId?: string) {
	return useRealtimeData({
		table: 'projects',
		queryKey: ['projects'],
		schema: selectProjectSchema,
		where: userId ? `user_id = '${userId}' AND deleted_at IS NULL` : 'deleted_at IS NULL',
		columns: ['id', 'name', 'description', 'user_id', 'created_at', 'updated_at'],
	});
}

export function useAgentsSync(userId?: string) {
	return useRealtimeData({
		table: 'agents',
		queryKey: ['agents'],
		schema: selectAgentSchema,
		where: userId ? `user_id = '${userId}' AND is_active = true` : 'is_active = true',
		columns: ['id', 'name', 'description', 'config', 'user_id', 'created_at', 'updated_at'],
	});
}

export function useSessionsSync(userId?: string, status?: string) {
	const whereClause = [
		userId ? `user_id = '${userId}'` : null,
		status ? `status = '${status}'` : "status IN ('active', 'paused')",
		"created_at > NOW() - INTERVAL '7 days'"
	].filter(Boolean).join(' AND ');

	return useRealtimeData({
		table: 'ai_sessions',
		queryKey: ['sessions', userId, status],
		schema: selectSessionSchema,
		where: whereClause,
		columns: ['id', 'name', 'agent_id', 'user_id', 'status', 'created_at', 'updated_at'],
	});
}

export function useMessagesSync(sessionId: string) {
	return useRealtimeData({
		table: 'messages',
		queryKey: ['messages', sessionId],
		schema: selectMessageSchema,
		where: `session_id = '${sessionId}' AND created_at > NOW() - INTERVAL '24 hours'`,
		columns: ['id', 'content', 'role', 'session_id', 'created_at'],
	});
}

export function useMemorySync(sessionId: string) {
	return useRealtimeData({
		table: 'memory',
		queryKey: ['memory', sessionId],
		schema: selectMemorySchema,
		where: `session_id = '${sessionId}'`,
		columns: ['id', 'content', 'type', 'session_id', 'created_at'],
	});
}

// Hook to sync all data with performance monitoring
export function useGlobalSync(userId?: string) {
	const projects = useProjectsSync(userId);
	const agents = useAgentsSync(userId);
	const sessions = useSessionsSync(userId);

	const [performanceMetrics, setPerformanceMetrics] = useState({
		avgLatency: 0,
		totalSubscriptions: 0,
		errorCount: 0,
	});

	useEffect(() => {
		const latencies = [projects.syncLatency, agents.syncLatency, sessions.syncLatency];
		const errors = [projects.isError, agents.isError, sessions.isError];
		
		setPerformanceMetrics({
			avgLatency: latencies.reduce((sum, l) => sum + l, 0) / latencies.length,
			totalSubscriptions: [projects.isSubscribed, agents.isSubscribed, sessions.isSubscribed].filter(Boolean).length,
			errorCount: errors.filter(Boolean).length,
		});
	}, [projects.syncLatency, agents.syncLatency, sessions.syncLatency, projects.isError, agents.isError, sessions.isError]);

	return {
		isFullySynced: projects.isSubscribed && agents.isSubscribed && sessions.isSubscribed,
		isOnline: projects.isOnline,
		performanceMetrics,
		subscriptions: {
			projects: { isSubscribed: projects.isSubscribed, latency: projects.syncLatency, error: projects.isError },
			agents: { isSubscribed: agents.isSubscribed, latency: agents.syncLatency, error: agents.isError },
			sessions: { isSubscribed: sessions.isSubscribed, latency: sessions.syncLatency, error: sessions.isError },
		},
	};
}

// Advanced sync utilities
export function useSyncStatus() {
	const { isOnline, syncStatus, pendingChanges, lastSync } = useSyncStore();
	const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'offline'>('offline');

	useEffect(() => {
		if (!isOnline) {
			setConnectionQuality('offline');
			return;
		}

		// Measure connection quality based on sync performance
		const measureQuality = async () => {
			const start = Date.now();
			try {
				await fetch('/api/health', { method: 'HEAD' });
				const latency = Date.now() - start;
				
				if (latency < 100) setConnectionQuality('excellent');
				else if (latency < 300) setConnectionQuality('good');
				else setConnectionQuality('poor');
			} catch {
				setConnectionQuality('offline');
			}
		};

		const interval = setInterval(measureQuality, 5000);
		measureQuality();

		return () => clearInterval(interval);
	}, [isOnline]);

	return {
		isOnline,
		syncStatus,
		pendingChanges,
		lastSync,
		connectionQuality,
	};
}

// Conflict resolution hook
export function useConflictResolution() {
	const { conflicts, resolveConflict } = useSyncStore();
	const [isResolving, setIsResolving] = useState(false);

	const resolveConflictHandler = useCallback(async (
		conflictId: string,
		resolution: 'local' | 'remote' | 'merge'
	) => {
		setIsResolving(true);
		try {
			await resolveConflict(conflictId, resolution);
		} finally {
			setIsResolving(false);
		}
	}, [resolveConflict]);

	return {
		conflicts,
		resolveConflict: resolveConflictHandler,
		isResolving,
	};
}
