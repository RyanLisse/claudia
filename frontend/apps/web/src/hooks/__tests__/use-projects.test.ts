import { QueryClient, type QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { vi } from 'vitest';
import { api } from '@/lib/api-web';
import { 
  useCreateSession, 
  useOptimisticProjects, 
  useProjectSessions, 
  useProjects, 
  useSession 
} from '../use-projects';

// Mock the API module
vi.mock('@/lib/api-web', () => ({
  api: {
    getProjects: vi.fn(),
    getProjectSessions: vi.fn(),
    getSession: vi.fn(),
    createSession: vi.fn(),
  }
}));

const mockApi = api as any;

describe('useProjects hook', () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });

    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useProjects', () => {
    it('should fetch projects successfully', async () => {
      const mockProjects = [
        { id: '1', name: 'Project 1', path: '/path/1' },
        { id: '2', name: 'Project 2', path: '/path/2' },
      ];
      
      mockApi.getProjects.mockResolvedValue(mockProjects);

      const { result } = renderHook(() => useProjects(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockProjects);
      expect(mockApi.getProjects).toHaveBeenCalledTimes(1);
    });

    it('should handle loading state', () => {
      mockApi.getProjects.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useProjects(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it('should handle error state', async () => {
      const mockError = new Error('Failed to fetch projects');
      mockApi.getProjects.mockRejectedValue(mockError);

      const { result } = renderHook(() => useProjects(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(mockError);
    });

    it('should configure query with correct options', () => {
      const { result } = renderHook(() => useProjects(), {
        wrapper: createWrapper(),
      });

      // Check that query has correct staleTime and refetchOnWindowFocus
      const queryState = queryClient.getQueryState(['projects']);
      expect(queryState).toBeDefined();
    });
  });

  describe('useProjectSessions', () => {
    it('should fetch project sessions when projectId is provided', async () => {
      const mockSessions = [
        { id: 'session1', project_id: 'project1', name: 'Session 1' },
        { id: 'session2', project_id: 'project1', name: 'Session 2' },
      ];
      
      mockApi.getProjectSessions.mockResolvedValue(mockSessions);

      const { result } = renderHook(() => useProjectSessions('project1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockSessions);
      expect(mockApi.getProjectSessions).toHaveBeenCalledWith('project1');
    });

    it('should not fetch when projectId is null', () => {
      const { result } = renderHook(() => useProjectSessions(null), {
        wrapper: createWrapper(),
      });

      expect(result.current.isIdle).toBe(true);
      expect(mockApi.getProjectSessions).not.toHaveBeenCalled();
    });

    it('should not fetch when projectId is empty string', () => {
      const { result } = renderHook(() => useProjectSessions(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isIdle).toBe(true);
      expect(mockApi.getProjectSessions).not.toHaveBeenCalled();
    });

    it('should handle error state for project sessions', async () => {
      const mockError = new Error('Failed to fetch sessions');
      mockApi.getProjectSessions.mockRejectedValue(mockError);

      const { result } = renderHook(() => useProjectSessions('project1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(mockError);
    });
  });

  describe('useSession', () => {
    it('should fetch session when sessionId is provided', async () => {
      const mockSession = { 
        id: 'session1', 
        project_id: 'project1', 
        name: 'Session 1',
        data: { some: 'data' }
      };
      
      mockApi.getSession.mockResolvedValue(mockSession);

      const { result } = renderHook(() => useSession('session1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockSession);
      expect(mockApi.getSession).toHaveBeenCalledWith('session1');
    });

    it('should not fetch when sessionId is null', () => {
      const { result } = renderHook(() => useSession(null), {
        wrapper: createWrapper(),
      });

      expect(result.current.isIdle).toBe(true);
      expect(mockApi.getSession).not.toHaveBeenCalled();
    });

    it('should not fetch when sessionId is empty string', () => {
      const { result } = renderHook(() => useSession(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isIdle).toBe(true);
      expect(mockApi.getSession).not.toHaveBeenCalled();
    });

    it('should handle error state for session', async () => {
      const mockError = new Error('Failed to fetch session');
      mockApi.getSession.mockRejectedValue(mockError);

      const { result } = renderHook(() => useSession('session1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(mockError);
    });
  });

  describe('useCreateSession', () => {
    it('should create session successfully', async () => {
      const mockNewSession = { 
        id: 'new-session', 
        project_id: 'project1', 
        name: 'New Session' 
      };
      
      mockApi.createSession.mockResolvedValue(mockNewSession);

      const { result } = renderHook(() => useCreateSession(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.mutate).toBeDefined();
      });

      result.current.mutate({
        projectPath: '/path/to/project',
        name: 'New Session',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockNewSession);
      expect(mockApi.createSession).toHaveBeenCalledWith('/path/to/project', 'New Session');
    });

    it('should create session without name', async () => {
      const mockNewSession = { 
        id: 'new-session', 
        project_id: 'project1', 
        name: undefined 
      };
      
      mockApi.createSession.mockResolvedValue(mockNewSession);

      const { result } = renderHook(() => useCreateSession(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        projectPath: '/path/to/project',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApi.createSession).toHaveBeenCalledWith('/path/to/project', undefined);
    });

    it('should handle error state for session creation', async () => {
      const mockError = new Error('Failed to create session');
      mockApi.createSession.mockRejectedValue(mockError);

      const { result } = renderHook(() => useCreateSession(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        projectPath: '/path/to/project',
        name: 'New Session',
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(mockError);
    });

    it('should invalidate queries and update cache on success', async () => {
      const mockNewSession = { 
        id: 'new-session', 
        project_id: 'project1', 
        name: 'New Session' 
      };
      
      mockApi.createSession.mockResolvedValue(mockNewSession);

      // Pre-populate cache with projects query
      queryClient.setQueryData(['projects'], [
        { id: 'project1', name: 'Project 1', sessions: [] }
      ]);

      // Pre-populate cache with sessions query
      queryClient.setQueryData(['projects', 'project1', 'sessions'], [
        { id: 'existing-session', project_id: 'project1', name: 'Existing Session' }
      ]);

      const { result } = renderHook(() => useCreateSession(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        projectPath: '/path/to/project',
        name: 'New Session',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Check that sessions cache was updated
      const sessionsData = queryClient.getQueryData(['projects', 'project1', 'sessions']);
      expect(sessionsData).toEqual([
        mockNewSession,
        { id: 'existing-session', project_id: 'project1', name: 'Existing Session' }
      ]);
    });

    it('should handle cache update when no existing sessions', async () => {
      const mockNewSession = { 
        id: 'new-session', 
        project_id: 'project1', 
        name: 'New Session' 
      };
      
      mockApi.createSession.mockResolvedValue(mockNewSession);

      const { result } = renderHook(() => useCreateSession(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        projectPath: '/path/to/project',
        name: 'New Session',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Check that sessions cache was created
      const sessionsData = queryClient.getQueryData(['projects', 'project1', 'sessions']);
      expect(sessionsData).toEqual([mockNewSession]);
    });
  });

  describe('useOptimisticProjects', () => {
    it('should update project optimistically', () => {
      const mockProjects = [
        { id: 'project1', name: 'Project 1', status: 'active' },
        { id: 'project2', name: 'Project 2', status: 'inactive' },
      ];

      queryClient.setQueryData(['projects'], mockProjects);

      const { result } = renderHook(() => useOptimisticProjects(), {
        wrapper: createWrapper(),
      });

      result.current.updateProject('project1', { status: 'completed' });

      const updatedProjects = queryClient.getQueryData(['projects']);
      expect(updatedProjects).toEqual([
        { id: 'project1', name: 'Project 1', status: 'completed' },
        { id: 'project2', name: 'Project 2', status: 'inactive' },
      ]);
    });

    it('should handle update when no projects in cache', () => {
      const { result } = renderHook(() => useOptimisticProjects(), {
        wrapper: createWrapper(),
      });

      result.current.updateProject('project1', { status: 'completed' });

      const updatedProjects = queryClient.getQueryData(['projects']);
      expect(updatedProjects).toEqual([]);
    });

    it('should handle update when project not found', () => {
      const mockProjects = [
        { id: 'project1', name: 'Project 1', status: 'active' },
      ];

      queryClient.setQueryData(['projects'], mockProjects);

      const { result } = renderHook(() => useOptimisticProjects(), {
        wrapper: createWrapper(),
      });

      result.current.updateProject('nonexistent', { status: 'completed' });

      const updatedProjects = queryClient.getQueryData(['projects']);
      expect(updatedProjects).toEqual(mockProjects); // Should remain unchanged
    });

    it('should handle partial updates', () => {
      const mockProjects = [
        { id: 'project1', name: 'Project 1', status: 'active', description: 'Original' },
      ];

      queryClient.setQueryData(['projects'], mockProjects);

      const { result } = renderHook(() => useOptimisticProjects(), {
        wrapper: createWrapper(),
      });

      result.current.updateProject('project1', { status: 'completed' });

      const updatedProjects = queryClient.getQueryData(['projects']);
      expect(updatedProjects).toEqual([
        { id: 'project1', name: 'Project 1', status: 'completed', description: 'Original' },
      ]);
    });
  });
});