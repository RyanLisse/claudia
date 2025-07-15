import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useSyncStore } from "@/stores";

interface RealtimeSyncConfig {
	table: string;
	queryKey: string[];
	enabled?: boolean;
}

export function useRealtimeSync({
	table,
	queryKey,
	enabled = true,
}: RealtimeSyncConfig) {
	const _queryClient = useQueryClient();
	const { electricClient, isOnline } = useSyncStore();
	const subscriptionRef = useRef<any>(null);

	useEffect(() => {
		if (!enabled || !electricClient || !isOnline) {
			return;
		}

		// Set up real-time subscription
		const setupSubscription = async () => {
			try {
			} catch (_error) {}
		};

		setupSubscription();

		return () => {
			// Clean up subscription
			if (subscriptionRef.current) {
				// subscriptionRef.current.unsubscribe();
				subscriptionRef.current = null;
			}
		};
	}, [enabled, electricClient, isOnline]);

	return {
		isSubscribed: !!subscriptionRef.current,
		isOnline,
	};
}

// Specific hooks for different data types
export function useProjectsSync() {
	return useRealtimeSync({
		table: "projects",
		queryKey: ["projects"],
	});
}

export function useAgentsSync() {
	return useRealtimeSync({
		table: "agents",
		queryKey: ["agents"],
	});
}

export function useSessionsSync() {
	return useRealtimeSync({
		table: "sessions",
		queryKey: ["sessions"],
	});
}

// Hook to sync all data
export function useGlobalSync() {
	const projects = useProjectsSync();
	const agents = useAgentsSync();
	const sessions = useSessionsSync();

	return {
		isFullySynced:
			projects.isSubscribed && agents.isSubscribed && sessions.isSubscribed,
		isOnline: projects.isOnline,
		subscriptions: {
			projects: projects.isSubscribed,
			agents: agents.isSubscribed,
			sessions: sessions.isSubscribed,
		},
	};
}
