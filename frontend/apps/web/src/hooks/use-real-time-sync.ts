import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSyncStore } from '@/stores';

interface RealtimeSyncConfig {
  table: string;
  queryKey: string[];
  enabled?: boolean;
}

export function useRealtimeSync({ table, queryKey, enabled = true }: RealtimeSyncConfig) {
  const queryClient = useQueryClient();
  const { electricClient, isOnline } = useSyncStore();
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (!enabled || !electricClient || !isOnline) {
      return;
    }

    // Set up real-time subscription
    const setupSubscription = async () => {
      try {
        // TODO: Replace with actual ElectricSQL subscription
        // subscriptionRef.current = electricClient.subscribe(table, (record: any, operation: string) => {
        //   console.log('Real-time update:', { table, record, operation });
        //   
        //   // Update the query cache based on the operation
        //   queryClient.setQueryData(queryKey, (oldData: any) => {
        //     if (!oldData) return oldData;
        //     
        //     switch (operation) {
        //       case 'INSERT':
        //         return Array.isArray(oldData) 
        //           ? [...oldData, record]
        //           : record;
        //       
        //       case 'UPDATE':
        //         return Array.isArray(oldData)
        //           ? oldData.map((item: any) => 
        //               item.id === record.id ? { ...item, ...record } : item
        //             )
        //           : { ...oldData, ...record };
        //       
        //       case 'DELETE':
        //         return Array.isArray(oldData)
        //           ? oldData.filter((item: any) => item.id !== record.id)
        //           : null;
        //       
        //       default:
        //         return oldData;
        //     }
        //   });
        //   
        //   // Optionally trigger a background refetch to ensure consistency
        //   queryClient.invalidateQueries({ queryKey, refetchType: 'none' });
        // });

        console.log(`Subscribed to real-time updates for table: ${table}`);
      } catch (error) {
        console.error('Failed to set up real-time subscription:', error);
      }
    };

    setupSubscription();

    return () => {
      // Clean up subscription
      if (subscriptionRef.current) {
        // subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
        console.log(`Unsubscribed from real-time updates for table: ${table}`);
      }
    };
  }, [table, queryKey, enabled, electricClient, isOnline, queryClient]);

  return {
    isSubscribed: !!subscriptionRef.current,
    isOnline,
  };
}

// Specific hooks for different data types
export function useProjectsSync() {
  return useRealtimeSync({
    table: 'projects',
    queryKey: ['projects'],
  });
}

export function useAgentsSync() {
  return useRealtimeSync({
    table: 'agents',
    queryKey: ['agents'],
  });
}

export function useSessionsSync() {
  return useRealtimeSync({
    table: 'sessions',
    queryKey: ['sessions'],
  });
}

// Hook to sync all data
export function useGlobalSync() {
  const projects = useProjectsSync();
  const agents = useAgentsSync();
  const sessions = useSessionsSync();

  return {
    isFullySynced: projects.isSubscribed && agents.isSubscribed && sessions.isSubscribed,
    isOnline: projects.isOnline,
    subscriptions: {
      projects: projects.isSubscribed,
      agents: agents.isSubscribed,
      sessions: sessions.isSubscribed,
    },
  };
}