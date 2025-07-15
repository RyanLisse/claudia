import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	useCreateProjectMutation,
	useOptimisticMutation,
} from "@/hooks/use-optimistic-mutations";
import { useSyncStore } from "@/stores";

// Mock dependencies
vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

// Mock the entire stores module
vi.mock("@/stores", () => ({
	useSyncStore: vi.fn(),
	useAppStore: vi.fn(),
	useUIStore: vi.fn(),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

// Test wrapper with QueryClient
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

describe("useOptimisticMutation", () => {
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
		vi.mocked(useSyncStore).mockReturnValue(mockSyncStore);
	});

	afterEach(() => {
		vi.clearAllTimers();
	});

	it("should perform optimistic update and confirm on success", async () => {
		const mockData = { id: "1", name: "Test Project" };
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => mockData,
		});

		const wrapper = createWrapper();
		const { result } = renderHook(
			() =>
				useOptimisticMutation({
					mutationKey: ["test"],
					mutationFn: async (data: any) => {
						const response = await fetch("/api/test", {
							method: "POST",
							body: JSON.stringify(data),
						});
						return response.json();
					},
					queryKey: ["test-data"],
					optimisticUpdateFn: (oldData: any[], newData: any) => [
						...oldData,
						newData,
					],
					successMessage: "Success!",
				}),
			{ wrapper },
		);

		// Trigger mutation
		result.current.mutate({ name: "Test Project" });

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		// Verify optimistic update was added
		expect(mockSyncStore.addOptimisticUpdate).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "update",
				table: "test-data",
				data: { name: "Test Project" },
			}),
		);

		// Verify optimistic update was confirmed
		expect(mockSyncStore.confirmOptimisticUpdate).toHaveBeenCalled();

		// Verify success toast
		expect(toast.success).toHaveBeenCalledWith("Success!");
	});

	it("should revert optimistic update on error", async () => {
		mockFetch.mockRejectedValueOnce(new Error("Network error"));

		const wrapper = createWrapper();
		const { result } = renderHook(
			() =>
				useOptimisticMutation({
					mutationKey: ["test"],
					mutationFn: async (data: any) => {
						const response = await fetch("/api/test", {
							method: "POST",
							body: JSON.stringify(data),
						});
						if (!response.ok) throw new Error("Request failed");
						return response.json();
					},
					queryKey: ["test-data"],
					optimisticUpdateFn: (oldData: any[], newData: any) => [
						...oldData,
						newData,
					],
					errorMessage: "Operation failed",
				}),
			{ wrapper },
		);

		// Trigger mutation
		result.current.mutate({ name: "Test Project" });

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		// Verify optimistic update was reverted
		expect(mockSyncStore.revertOptimisticUpdate).toHaveBeenCalled();

		// Verify error toast
		expect(toast.error).toHaveBeenCalledWith(
			"Operation failed",
			expect.any(Object),
		);
	});

	it("should handle mutation without optimistic update function", async () => {
		const mockData = { id: "1", name: "Test Project" };
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => mockData,
		});

		const wrapper = createWrapper();
		const { result } = renderHook(
			() =>
				useOptimisticMutation({
					mutationKey: ["test"],
					mutationFn: async (data: any) => {
						const response = await fetch("/api/test", {
							method: "POST",
							body: JSON.stringify(data),
						});
						return response.json();
					},
					queryKey: ["test-data"],
					// No optimisticUpdateFn provided
				}),
			{ wrapper },
		);

		// Trigger mutation
		result.current.mutate({ name: "Test Project" });

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		// Should still track optimistic update
		expect(mockSyncStore.addOptimisticUpdate).toHaveBeenCalled();
		expect(mockSyncStore.confirmOptimisticUpdate).toHaveBeenCalled();
	});
});

describe("useCreateProjectMutation", () => {
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
		vi.mocked(useSyncStore).mockReturnValue(mockSyncStore);
	});

	it("should create project with optimistic update", async () => {
		const newProject = {
			name: "New Project",
			description: "Test project",
			type: "web" as const,
			path: "/test/path",
		};

		const createdProject = {
			id: "123",
			...newProject,
			status: "active",
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => createdProject,
		});

		const wrapper = createWrapper();
		const { result } = renderHook(() => useCreateProjectMutation(), {
			wrapper,
		});

		// Trigger mutation
		result.current.mutate(newProject);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		// Verify API call
		expect(mockFetch).toHaveBeenCalledWith("/api/projects", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(newProject),
		});

		// Verify optimistic update tracking
		expect(mockSyncStore.addOptimisticUpdate).toHaveBeenCalled();
		expect(mockSyncStore.confirmOptimisticUpdate).toHaveBeenCalled();

		// Verify success message
		expect(toast.success).toHaveBeenCalledWith("Project created successfully");
	});

	it("should handle project creation failure", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 400,
		});

		const wrapper = createWrapper();
		const { result } = renderHook(() => useCreateProjectMutation(), {
			wrapper,
		});

		// Trigger mutation
		result.current.mutate({
			name: "Failed Project",
			type: "web",
			path: "/test",
		});

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		// Verify error handling
		expect(mockSyncStore.revertOptimisticUpdate).toHaveBeenCalled();
		expect(toast.error).toHaveBeenCalledWith(
			"Failed to create project",
			expect.any(Object),
		);
	});

	it("should generate temporary ID for optimistic update", async () => {
		const newProject = {
			name: "Temp ID Project",
			type: "web" as const,
			path: "/test",
		};

		// Mock Date.now for consistent temp ID
		const mockNow = 1234567890;
		vi.spyOn(Date, "now").mockReturnValue(mockNow);

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ id: "real-id", ...newProject }),
		});

		const wrapper = createWrapper();
		const { result } = renderHook(() => useCreateProjectMutation(), {
			wrapper,
		});

		// Trigger mutation
		result.current.mutate(newProject);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		// Verify temp ID was generated
		expect(mockSyncStore.addOptimisticUpdate).toHaveBeenCalledWith(
			expect.objectContaining({
				data: newProject,
			}),
		);
	});
});
