// ElectricSQL client types - adapting for current package version
type ElectricClientConfig = {
	url: string;
	headers?: Record<string, string>;
	timeout?: number;
};

// Mock ElectricClient for now - will be replaced with actual implementation
export class ElectricClient {
	constructor(private config: ElectricClientConfig) {}
	
	async stream(params: {
		table: string;
		columns?: string[];
		where?: string;
	}) {
		// Mock implementation - replace with actual ElectricSQL client
		return {
			subscribe: (callback: (data: any) => void) => {
				// Mock subscription
				setTimeout(() => callback([]), 1000);
				return () => {}; // unsubscribe
			},
			unsubscribe: () => {},
		};
	}
}

export type ShapeStream<T> = {
	subscribe: (callback: (data: T[]) => void) => () => void;
	unsubscribe: () => void;
};
import { z } from 'zod';
import * as schema from "./schema";

// ElectricSQL configuration
export const electricConfig = {
	url: process.env.ELECTRIC_URL || "ws://localhost:5133",
	debug: process.env.NODE_ENV === "development",
	timeout: 10000,
	headers: {
		'Authorization': `Bearer ${process.env.ELECTRIC_TOKEN || 'dev-token'}`,
		'Content-Type': 'application/json',
	},
};

// Initialize Electric client
let electric: ElectricClient | null = null;

export async function initElectric(): Promise<ElectricClient> {
	if (electric) return electric;
	
	// Initialize the Electric client
	electric = new ElectricClient({
		url: electricConfig.url,
		headers: electricConfig.headers,
		timeout: electricConfig.timeout,
	});

	// Set up sync subscriptions for all tables
	await setupSyncSubscriptions(electric);
	return electric;
}

// Set up sync subscriptions for real-time data
async function setupSyncSubscriptions(electric: ElectricClient) {
	// Set up shape subscriptions for each table
	const shapes = {
		users: await electric.stream({
			table: 'users',
			columns: ['id', 'email', 'name', 'created_at', 'updated_at'],
			where: 'created_at > NOW() - INTERVAL \'30 days\'',
		}),

		projects: await electric.stream({
			table: 'projects',
			columns: ['id', 'name', 'description', 'user_id', 'created_at', 'updated_at'],
			where: 'deleted_at IS NULL',
		}),

		agents: await electric.stream({
			table: 'agents',
			columns: ['id', 'name', 'description', 'config', 'user_id', 'created_at', 'updated_at'],
			where: 'is_active = true',
		}),

		sessions: await electric.stream({
			table: 'ai_sessions',
			columns: ['id', 'name', 'agent_id', 'user_id', 'status', 'created_at', 'updated_at'],
			where: 'status IN (\'active\', \'paused\') AND created_at > NOW() - INTERVAL \'7 days\'',
		}),

		messages: await electric.stream({
			table: 'messages',
			columns: ['id', 'content', 'role', 'session_id', 'created_at'],
			where: 'created_at > NOW() - INTERVAL \'24 hours\'',
		}),

		memory: await electric.stream({
			table: 'memory',
			columns: ['id', 'content', 'type', 'session_id', 'created_at'],
			where: `user_id = '${getCurrentUserId()}'`,
		}),

		syncEvents: await electric.stream({
			table: 'sync_events',
			columns: ['id', 'event_type', 'table_name', 'record_id', 'status', 'created_at'],
			where: 'status IN (\'pending\', \'conflict\') AND created_at > NOW() - INTERVAL \'1 hour\'',
		}),
	};

	// Store shapes for later use
	(electric as any)._shapes = shapes;
	return shapes;
}

// Get current user ID (implement based on your auth system)
function getCurrentUserId(): string {
	// TODO: Implement based on your authentication system
	return process.env.CURRENT_USER_ID || "";
}

// Modern ElectricSQL sync manager with shape streaming
export class ElectricSync {
	private client: ElectricClient | null = null;
	private shapes: Map<string, ShapeStream<any>> = new Map();
	private subscriptions: Map<string, (() => void)[]> = new Map();

	constructor(private baseUrl: string) {}

	async initialize(): Promise<void> {
		this.client = await initElectric();
	}

	async syncShape<T extends z.ZodType>(
		table: string,
		schema: T,
		where?: string,
		columns?: string[]
	): Promise<ShapeStream<z.infer<T>>> {
		if (!this.client) throw new Error("Electric client not initialized");

		const shapeKey = `${table}:${where || 'all'}`;
		
		if (this.shapes.has(shapeKey)) {
			return this.shapes.get(shapeKey)!;
		}

		const stream = await this.client.stream({
			table,
			where,
			columns: columns || Object.keys((schema as any).shape || {}),
		});

		// Create typed stream with validation
		const typedStream = {
			...stream,
			subscribe: (callback: (data: z.infer<T>[]) => void) => {
				return stream.subscribe((rawData: any) => {
					try {
						const validated = z.array(schema).parse(rawData);
						callback(validated);
					} catch (error) {
						console.error(`Validation error for ${table}:`, error);
						callback([]);
					}
				});
			},
			unsubscribe: stream.unsubscribe,
		};

		this.shapes.set(shapeKey, typedStream);
		return typedStream;
	}

	async forceSyncAll(): Promise<void> {
		if (!this.client) throw new Error("Electric client not initialized");

		// Re-initialize all shapes
		await setupSyncSubscriptions(this.client);
	}

	async getConflicts(): Promise<unknown[]> {
		if (!this.client) throw new Error("Electric client not initialized");

		// Get conflicts from sync_conflicts table
		const conflictsStream = await this.client.stream({
			table: 'sync_conflicts',
			where: 'is_resolved = false',
			columns: ['id', 'table_name', 'record_id', 'conflict_type', 'local_data', 'remote_data', 'created_at']
		});

		return new Promise((resolve) => {
			const unsubscribe = conflictsStream.subscribe((data: any) => {
				unsubscribe();
				resolve(data);
			});
		});
	}

	async resolveConflict(
		conflictId: string,
		strategy: "local_wins" | "remote_wins" | "merge",
		resolvedData?: unknown,
	): Promise<void> {
		if (!this.client) throw new Error("Electric client not initialized");

		// Update conflict resolution in database
		const response = await fetch('/api/sync/conflicts/resolve', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				conflictId,
				strategy,
				resolvedData,
				resolvedBy: getCurrentUserId(),
			}),
		});

		if (!response.ok) {
			throw new Error(`Failed to resolve conflict: ${response.statusText}`);
		}
	}

	async getSyncMetrics(): Promise<Record<string, unknown>> {
		if (!this.client) throw new Error("Electric client not initialized");

		const metricsStream = await this.client.stream({
			table: 'sync_metrics',
			where: 'measured_at > NOW() - INTERVAL \'1 hour\'',
			columns: ['metric_type', 'value', 'unit', 'measured_at']
		});

		return new Promise((resolve) => {
			const unsubscribe = metricsStream.subscribe((metrics: any[]) => {
				unsubscribe();
				
				const latencyMetrics = metrics.filter(m => m.metric_type === 'sync_latency');
				const conflictMetrics = metrics.filter(m => m.metric_type === 'conflict_rate');
				
				resolve({
					totalEvents: metrics.length,
					avgLatency: latencyMetrics.reduce((sum, m) => sum + m.value, 0) / latencyMetrics.length || 0,
					conflictRate: conflictMetrics.reduce((sum, m) => sum + m.value, 0) / conflictMetrics.length || 0,
					lastSync: metrics[0]?.measured_at || null,
				});
			});
		});
	}

	// Add subscription management
	subscribeToTable(table: string, callback: (data: any) => void): () => void {
		if (!this.subscriptions.has(table)) {
			this.subscriptions.set(table, []);
		}

		const callbacks = this.subscriptions.get(table)!;
		callbacks.push(callback);

		return () => {
			const index = callbacks.indexOf(callback);
			if (index > -1) {
				callbacks.splice(index, 1);
			}
		};
	}

	// Cleanup
	destroy(): void {
		for (const [, shape] of this.shapes) {
			if (shape.unsubscribe) {
				shape.unsubscribe();
			}
		}
		this.shapes.clear();
		this.subscriptions.clear();
	}
}

// Export singleton instance
export const electricSync = new ElectricSync(
	process.env.ELECTRIC_URL || 'ws://localhost:5133'
);

// Export syncManager for compatibility
export const syncManager = electricSync;

// Utility functions for conflict resolution
export const ConflictResolver = {
	localWins(conflict: Record<string, unknown>): unknown {
		return conflict.localData;
	},

	remoteWins(conflict: Record<string, unknown>): unknown {
		return conflict.remoteData;
	},

	merge(conflict: Record<string, unknown>): unknown {
		// Implement 3-way merge logic
		const local = conflict.localData as Record<string, unknown>;
		const remote = conflict.remoteData as Record<string, unknown>;
		const base = conflict.baseData as Record<string, unknown>;

		// Simple merge strategy - prefer non-null values
		const merged = { ...base };

		Object.keys(local).forEach((key) => {
			if (local[key] !== base[key] && remote[key] === base[key]) {
				merged[key] = local[key]; // Local change only
			} else if (remote[key] !== base[key] && local[key] === base[key]) {
				merged[key] = remote[key]; // Remote change only
			} else if (local[key] !== remote[key]) {
				// Conflict - prefer local by default
				merged[key] = local[key];
			}
		});

		return merged;
	},

	async autoResolve(conflict: Record<string, unknown>): Promise<unknown> {
		switch ((conflict as any).conflictType) {
			case "concurrent_update": {
				// Use timestamp-based resolution
				const localData = (conflict as any).localData as Record<string, any>;
				const remoteData = (conflict as any).remoteData as Record<string, any>;
				if (localData.updatedAt > remoteData.updatedAt) {
					return ConflictResolver.localWins(conflict);
				}
				return ConflictResolver.remoteWins(conflict);
			}

			case "delete_update":
				// Prefer deletion
				return null;

			case "unique_violation":
				// Use merge strategy
				return ConflictResolver.merge(conflict);

			default:
				return ConflictResolver.merge(conflict);
		}
	},
};

export { electric };
