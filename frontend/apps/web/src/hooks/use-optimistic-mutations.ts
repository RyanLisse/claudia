import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSyncStore } from '@/stores';
import { toast } from 'sonner';

interface OptimisticMutationConfig<TData, TVariables> {
  mutationKey: string[];
  mutationFn: (variables: TVariables) => Promise<TData>;
  queryKey: string[];
  optimisticUpdateFn?: (oldData: any, variables: TVariables) => any;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables, context?: any) => void;
  errorMessage?: string;
  successMessage?: string;
}

export function useOptimisticMutation<TData = unknown, TVariables = unknown>({
  mutationKey,
  mutationFn,
  queryKey,
  optimisticUpdateFn,
  onSuccess,
  onError,
  errorMessage = 'Operation failed',
  successMessage,
}: OptimisticMutationConfig<TData, TVariables>) {
  const queryClient = useQueryClient();
  const { addOptimisticUpdate, confirmOptimisticUpdate, revertOptimisticUpdate } = useSyncStore();

  return useMutation({
    mutationKey,
    mutationFn,
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistically update the cache
      if (optimisticUpdateFn && previousData) {
        const optimisticData = optimisticUpdateFn(previousData, variables);
        queryClient.setQueryData(queryKey, optimisticData);
      }

      // Track optimistic update
      const updateId = `${mutationKey.join('-')}-${Date.now()}`;
      addOptimisticUpdate({
        type: 'update',
        table: queryKey[0] || 'unknown',
        recordId: updateId,
        data: variables,
      });

      return { previousData, updateId };
    },
    onSuccess: (data, variables, context) => {
      // Confirm optimistic update
      if (context?.updateId) {
        confirmOptimisticUpdate(context.updateId);
      }

      // Show success message
      if (successMessage) {
        toast.success(successMessage);
      }

      // Call custom onSuccess handler
      onSuccess?.(data, variables);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error, variables, context) => {
      // Revert optimistic update
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }

      if (context?.updateId) {
        revertOptimisticUpdate(context.updateId);
      }

      // Show error message
      toast.error(errorMessage, {
        description: error.message,
        action: {
          label: 'Retry',
          onClick: () => {
            // Retry the mutation
            // This would need to be implemented based on the specific use case
          },
        },
      });

      // Call custom onError handler
      onError?.(error, variables, context);
    },
  });
}

// Project-specific optimistic mutations
export function useCreateProjectMutation() {
  return useOptimisticMutation({
    mutationKey: ['projects', 'create'],
    mutationFn: async (projectData: any) => {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create project');
      }
      
      return response.json();
    },
    queryKey: ['projects'],
    optimisticUpdateFn: (oldData: any[], variables) => [
      ...oldData,
      {
        id: `temp-${Date.now()}`,
        ...variables,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    successMessage: 'Project created successfully',
    errorMessage: 'Failed to create project',
  });
}

export function useUpdateProjectMutation() {
  return useOptimisticMutation({
    mutationKey: ['projects', 'update'],
    mutationFn: async ({ id, ...updates }: any) => {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update project');
      }
      
      return response.json();
    },
    queryKey: ['projects'],
    optimisticUpdateFn: (oldData: any[], variables) =>
      oldData.map((project) =>
        project.id === variables.id
          ? { ...project, ...variables, updatedAt: new Date() }
          : project
      ),
    successMessage: 'Project updated successfully',
    errorMessage: 'Failed to update project',
  });
}

export function useDeleteProjectMutation() {
  return useOptimisticMutation({
    mutationKey: ['projects', 'delete'],
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete project');
      }
      
      return { id };
    },
    queryKey: ['projects'],
    optimisticUpdateFn: (oldData: any[], id: string) =>
      oldData.filter((project) => project.id !== id),
    successMessage: 'Project deleted successfully',
    errorMessage: 'Failed to delete project',
  });
}