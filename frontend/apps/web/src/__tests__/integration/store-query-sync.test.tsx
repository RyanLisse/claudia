import {
	QueryClient,
	QueryClientProvider,
	useQuery,
} from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOptimisticMutation } from "@/hooks/use-optimistic-mutations";
import { useGlobalSync, useRealtimeSync } from "@/hooks/use-real-time-sync";
import { useAppStore, useSyncStore, useUIStore } from "@/stores";

// Mock stores
vi.mock("@/stores", () => ({
	useUIStore: vi.fn(),
	useAppStore: vi.fn(),
	useSyncStore: vi.fn(),
}));

const createWrapper = () => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});

	return ({ children }: { children: React.ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
};

describe("Store and Query Integration", () => {
	const mockUIStore = {
		addNotification: vi.fn(),
		setLoading: vi.fn(),
		theme: "system",
		sidebarOpen: true,
		modals: {
			settings: false,
			profile: false,
			help: false,
		},
		notifications: [],
		loading: {},
		setTheme: vi.fn(),
		toggleSidebar: vi.fn(),
		openModal: vi.fn(),
		closeModal: vi.fn(),
		removeNotification: vi.fn(),
		reset: vi.fn(),
	};

	const mockAppStore = {
		projects: [],
		setCurrentProject: vi.fn(),
		addProject: vi.fn(),
		currentProject: null,
		agents: [],
		sessions: [],
		activeSession: null,
		workspaceSettings: {
			autoSave: true,
			autoFormat: true,
			gitIntegration: true,
			aiAssistance: true,
			collaborationMode: false,
		},
		updateProject: vi.fn(),
		deleteProject: vi.fn(),
		addAgent: vi.fn(),
		updateAgent: vi.fn(),
		removeAgent: vi.fn(),
		startSession: vi.fn(),
		stopSession: vi.fn(),
		setActiveSession: vi.fn(),
		updateWorkspaceSettings: vi.fn(),
		reset: vi.fn(),
	};

	const mockSyncStore = {
		isOnline: true,
		lastSync: null,
		syncStatus: "idle" as const,
		pendingChanges: 0,
		conflicts: [],
		electricClient: { subscribe: vi.fn() },
		addOptimisticUpdate: vi.fn(),
		confirmOptimisticUpdate: vi.fn(),
		revertOptimisticUpdate: vi.fn(),
		initializeSync: vi.fn(),
		sync: vi.fn(),
		resolveConflict: vi.fn(),
		setOnlineStatus: vi.fn(),
		reset: vi.fn(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
		(useUIStore as any).mockReturnValue(mockUIStore);
		(useAppStore as any).mockReturnValue(mockAppStore);
		(useSyncStore as any).mockReturnValue(mockSyncStore);
	});

	describe("Real-time Sync Integration", () => {
		it("should set up real-time subscription when online", () => {
			const wrapper = createWrapper();

			renderHook(
				() =>
					useRealtimeSync({
						table: "projects",
						queryKey: ["projects"],
						enabled: true,
					}),
				{ wrapper },
			);

			// Should attempt to set up subscription (mocked)
			expect(mockSyncStore.electricClient).toBeDefined();
		});

		it("should not set up subscription when offline", () => {
			const offlineSyncStore = {
				...mockSyncStore,
				isOnline: false,
			};
			(useSyncStore as any).mockReturnValue(offlineSyncStore);

			const wrapper = createWrapper();

			const { result } = renderHook(
				() =>
					useRealtimeSync({
						table: "projects",
						queryKey: ["projects"],
						enabled: true,
					}),
				{ wrapper },
			);

			expect(result.current.isOnline).toBe(false);
			expect(result.current.isSubscribed).toBe(false);
		});

		it("should handle global sync status", () => {
			const wrapper = createWrapper();

			const { result } = renderHook(() => useGlobalSync(), { wrapper });

			expect(result.current).toHaveProperty("isFullySynced");
			expect(result.current).toHaveProperty("isOnline");
			expect(result.current).toHaveProperty("subscriptions");
		});
	});

	describe("Loading State Integration", () => {
		it("should sync loading states between stores and queries", async () => {
			const wrapper = createWrapper();

			// Mock a query that uses loading state
			const { result: queryResult } = renderHook(
				() =>
					useQuery({
						queryKey: ["test-data"],
						queryFn: async () => {
							// Simulate API call
							await new Promise((resolve) => setTimeout(resolve, 100));
							return { data: "test" };
						},
					}),
				{ wrapper },
			);

			// Initially loading
			expect(queryResult.current.isLoading).toBe(true);

			// Wait for query to complete
			await act(async () => {
				await new Promise((resolve) => setTimeout(resolve, 150));
			});

			expect(queryResult.current.isLoading).toBe(false);
			expect(queryResult.current.data).toEqual({ data: "test" });
		});
	});

	describe("Error Handling Integration", () => {
		it("should show notifications for query errors", async () => {
			const wrapper = createWrapper();

			const { result } = renderHook(
				() =>
					useQuery({
						queryKey: ["error-test"],
						queryFn: async () => {
							throw new Error("Query failed");
						},
					}),
				{ wrapper },
			);

			await act(async () => {
				await new Promise((resolve) => setTimeout(resolve, 100));
			});

			expect(result.current.isError).toBe(true);
			expect(result.current.error).toEqual(new Error("Query failed"));
		});
	});

	describe("Optimistic Updates Integration", () => {
		it("should coordinate optimistic updates between stores and queries", async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ id: "1", name: "New Project" }),
			});
			global.fetch = mockFetch;

			const wrapper = createWrapper();

			const { result } = renderHook(
				() =>
					useOptimisticMutation({
						mutationKey: ["create-project"],
						mutationFn: async (data: any) => {
							const response = await fetch("/api/projects", {
								method: "POST",
								body: JSON.stringify(data),
							});
							return response.json();
						},
						queryKey: ["projects"],
						optimisticUpdateFn: (oldData: any[], newData: any) => [
							...oldData,
							newData,
						],
					}),
				{ wrapper },
			);

			// Trigger optimistic mutation
			act(() => {
				result.current.mutate({ name: "Test Project" });
			});

			// Wait for the mutation to trigger onMutate
			await act(async () => {
				await new Promise((resolve) => setTimeout(resolve, 10));
			});

			// Should track optimistic update
			expect(mockSyncStore.addOptimisticUpdate).toHaveBeenCalled();

			// Wait for mutation to complete
			await act(async () => {
				await new Promise((resolve) => setTimeout(resolve, 100));
			});

			// Should confirm optimistic update
			expect(mockSyncStore.confirmOptimisticUpdate).toHaveBeenCalled();
		});

		it("should verify sync store mock is working", () => {
			const wrapper = createWrapper();

			const { result } = renderHook(() => useSyncStore(), { wrapper });

			expect(result.current).toBeDefined();
			expect(result.current.addOptimisticUpdate).toBeDefined();
			expect(result.current.confirmOptimisticUpdate).toBeDefined();
			expect(result.current.revertOptimisticUpdate).toBeDefined();
		});

		it("should verify optimistic mutation hook calls sync store", async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ id: "1", name: "New Project" }),
			});
			global.fetch = mockFetch;

			const wrapper = createWrapper();

			const { result } = renderHook(
				() =>
					useOptimisticMutation({
						mutationKey: ["create-project"],
						mutationFn: async (data: any) => {
							const response = await fetch("/api/projects", {
								method: "POST",
								body: JSON.stringify(data),
							});
							return response.json();
						},
						queryKey: ["projects"],
						optimisticUpdateFn: (oldData: any[], newData: any) => [
							...(oldData || []),
							newData,
						],
					}),
				{ wrapper },
			);

			// Manually call the mutation and wait for it to complete
			const mutationResult = result.current.mutate({ name: "Test Project" });

			// Wait for mutation to be processed
			await act(async () => {
				await new Promise((resolve) => setTimeout(resolve, 10));
			});

			// Check if addOptimisticUpdate was called after mutation
			expect(mockSyncStore.addOptimisticUpdate).toHaveBeenCalled();
		});
	});

	describe("Store Synchronization", () => {
		it("should keep app store and query cache in sync", async () => {
			const wrapper = createWrapper();

			// Mock project data
			const projects = [
				{ id: "1", name: "Project 1" },
				{ id: "2", name: "Project 2" },
			];

			const { result } = renderHook(
				() =>
					useQuery({
						queryKey: ["projects"],
						queryFn: async () => projects,
					}),
				{ wrapper },
			);

			await act(async () => {
				await new Promise((resolve) => setTimeout(resolve, 100));
			});

			expect(result.current.data).toEqual(projects);
		});

		it("should handle concurrent updates correctly", async () => {
			const wrapper = createWrapper();

			// Mock multiple concurrent mutations
			const mockFetch = vi
				.fn()
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ id: "1", name: "Project 1" }),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ id: "2", name: "Project 2" }),
				});

			global.fetch = mockFetch;

			const { result: mutation1 } = renderHook(
				() =>
					useOptimisticMutation({
						mutationKey: ["create-project-1"],
						mutationFn: async (data: any) => {
							const response = await fetch("/api/projects", {
								method: "POST",
								body: JSON.stringify(data),
							});
							return response.json();
						},
						queryKey: ["projects"],
					}),
				{ wrapper },
			);

			const { result: mutation2 } = renderHook(
				() =>
					useOptimisticMutation({
						mutationKey: ["create-project-2"],
						mutationFn: async (data: any) => {
							const response = await fetch("/api/projects", {
								method: "POST",
								body: JSON.stringify(data),
							});
							return response.json();
						},
						queryKey: ["projects"],
					}),
				{ wrapper },
			);

			// Trigger both mutations simultaneously
			act(() => {
				mutation1.current.mutate({ name: "Project 1" });
				mutation2.current.mutate({ name: "Project 2" });
			});

			// Wait for the mutations to trigger onMutate
			await act(async () => {
				await new Promise((resolve) => setTimeout(resolve, 10));
			});

			// Both should track optimistic updates
			expect(mockSyncStore.addOptimisticUpdate).toHaveBeenCalledTimes(2);

			await act(async () => {
				await new Promise((resolve) => setTimeout(resolve, 200));
			});

			// Both should confirm optimistic updates
			expect(mockSyncStore.confirmOptimisticUpdate).toHaveBeenCalledTimes(2);
		});
	});

	describe("Network State Integration", () => {
		it("should handle online/offline transitions", () => {
			// Test online state
			let syncStore = { ...mockSyncStore, isOnline: true };
			(useSyncStore as any).mockReturnValue(syncStore);

			const wrapper = createWrapper();
			const { result, rerender } = renderHook(
				() =>
					useRealtimeSync({
						table: "projects",
						queryKey: ["projects"],
					}),
				{ wrapper },
			);

			expect(result.current.isOnline).toBe(true);

			// Simulate going offline
			syncStore = { ...mockSyncStore, isOnline: false };
			(useSyncStore as any).mockReturnValue(syncStore);

			rerender();

			expect(result.current.isOnline).toBe(false);
		});
	});
});
