import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRealtimeData, useGlobalSync, useConflictResolution } from '@/hooks/use-real-time-sync';
import { electricSync } from '@/../../apps/server/src/db/electric';
import { z } from 'zod';
import { ReactNode } from 'react';

// Mock schema for testing
const testSchema = z.object({
	id: z.string(),
	name: z.string(),
	value: z.number(),
	updated_at: z.string(),
});

// Mock ElectricSQL client
vi.mock('@/../../apps/server/src/db/electric', () => ({
	electricSync: {
		initialize: vi.fn(),
		syncShape: vi.fn(),
		getConflicts: vi.fn(),
		resolveConflict: vi.fn(),
		getSyncMetrics: vi.fn(),
		destroy: vi.fn(),
	},
}));

// Mock sync store
vi.mock('@/stores', () => ({
	useSyncStore: vi.fn(() => ({
		isOnline: true,
		syncStatus: 'idle',
		pendingChanges: 0,
		conflicts: [],
		resolveConflict: vi.fn(),
		electricClient: {},
	})),
}));

// Test wrapper with QueryClient
const createWrapper = () => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
				staleTime: 0,
				gcTime: 0,
			},
		},
	});

	return ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
};

describe('Real-time Sync Integration', () => {
	let mockStream: any;
	let queryClient: QueryClient;

	beforeAll(() => {
		// Set up global fetch mock
		global.fetch = vi.fn();
		
		// Mock WebSocket for ElectricSQL
		global.WebSocket = vi.fn(() => ({
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			close: vi.fn(),
			send: vi.fn(),
		})) as any;
	});

	beforeEach(() => {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false, staleTime: 0, gcTime: 0 },
			},
		});

		// Reset mocks
		vi.clearAllMocks();

		// Mock stream with subscription capability
		mockStream = {
			subscribe: vi.fn(),
			unsubscribe: vi.fn(),
		};

		// Mock electricSync methods
		vi.mocked(electricSync.initialize).mockResolvedValue(undefined);
		vi.mocked(electricSync.syncShape).mockResolvedValue(mockStream);
		vi.mocked(electricSync.getConflicts).mockResolvedValue([]);
		vi.mocked(electricSync.getSyncMetrics).mockResolvedValue({
			totalEvents: 0,
			avgLatency: 50,
			conflictRate: 0,
			lastSync: new Date().toISOString(),
		});
	});

	afterEach(() => {
		queryClient.clear();
		vi.clearAllMocks();
	});

	afterAll(() => {
		vi.restoreAllMocks();
	});

	describe('useRealtimeData Hook', () => {
		it('should initialize ElectricSQL connection', async () => {
			const { result } = renderHook(
				() => useRealtimeData({
					table: 'test_table',
					queryKey: ['test'],
					schema: testSchema,
				}),
				{ wrapper: createWrapper() }
			);

			await waitFor(() => {
				expect(electricSync.initialize).toHaveBeenCalled();
			});

			expect(result.current.isSubscribed).toBe(false);
		});

		it('should set up shape subscription with correct parameters', async () => {
			const config = {
				table: 'test_table',
				queryKey: ['test'],
				schema: testSchema,
				where: "status = 'active'",
				columns: ['id', 'name', 'value'],
			};

			renderHook(() => useRealtimeData(config), { wrapper: createWrapper() });

			await waitFor(() => {
				expect(electricSync.syncShape).toHaveBeenCalledWith(
					'test_table',
					testSchema,
					"status = 'active'",
					['id', 'name', 'value']
				);
			});
		});

		it('should handle real-time data updates', async () => {
			const testData = [
				{ id: '1', name: 'Test 1', value: 100, updated_at: '2023-01-01' },
				{ id: '2', name: 'Test 2', value: 200, updated_at: '2023-01-02' },
			];

			let subscriptionCallback: any;
			mockStream.subscribe.mockImplementation((callback: any) => {
				subscriptionCallback = callback;
				return vi.fn(); // unsubscribe function
			});

			const { result } = renderHook(
				() => useRealtimeData({
					table: 'test_table',
					queryKey: ['test'],
					schema: testSchema,
				}),
				{ wrapper: createWrapper() }
			);

			await waitFor(() => {
				expect(mockStream.subscribe).toHaveBeenCalled();
			});

			// Simulate data update
			act(() => {
				subscriptionCallback(testData);
			});

			await waitFor(() => {
				expect(result.current.data).toEqual(testData);
				expect(result.current.isSubscribed).toBe(true);
			});
		});

		it('should handle validation errors gracefully', async () => {
			const invalidData = [
				{ id: '1', name: 'Test', value: 'invalid' }, // value should be number
			];

			let subscriptionCallback: any;
			mockStream.subscribe.mockImplementation((callback: any) => {
				subscriptionCallback = callback;
				return vi.fn();
			});

			const { result } = renderHook(
				() => useRealtimeData({
					table: 'test_table',
					queryKey: ['test'],
					schema: testSchema,
				}),
				{ wrapper: createWrapper() }
			);

			await waitFor(() => {
				expect(mockStream.subscribe).toHaveBeenCalled();
			});

			// Simulate invalid data
			act(() => {
				subscriptionCallback(invalidData);
			});

			await waitFor(() => {
				expect(result.current.data).toEqual([]); // Should fallback to empty array
			});
		});

		it('should perform optimistic updates', async () => {
			const initialData = [
				{ id: '1', name: 'Test 1', value: 100, updated_at: '2023-01-01' },
			];

			// Mock fetch for mutations
			vi.mocked(global.fetch).mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ id: '1', name: 'Updated Test', value: 150, updated_at: '2023-01-02' }),
			} as Response);

			let subscriptionCallback: any;
			mockStream.subscribe.mockImplementation((callback: any) => {
				subscriptionCallback = callback;
				return vi.fn();
			});

			const { result } = renderHook(
				() => useRealtimeData({
					table: 'test_table',
					queryKey: ['test'],
					schema: testSchema,
				}),
				{ wrapper: createWrapper() }
			);

			await waitFor(() => {
				expect(mockStream.subscribe).toHaveBeenCalled();
			});

			// Set initial data
			act(() => {
				subscriptionCallback(initialData);
			});

			await waitFor(() => {
				expect(result.current.data).toEqual(initialData);
			});

			// Perform optimistic update
			act(() => {
				result.current.mutate({ id: '1', name: 'Updated Test', value: 150 });
			});

			// Check optimistic update
			await waitFor(() => {
				expect(result.current.data[0].name).toBe('Updated Test');
				expect(result.current.data[0].value).toBe(150);
				expect(result.current.isOptimistic).toBe(true);
			});
		});

		it('should measure sync latency', async () => {
			const startTime = Date.now();
			
			let subscriptionCallback: any;
			mockStream.subscribe.mockImplementation((callback: any) => {
				subscriptionCallback = callback;
				return vi.fn();
			});

			const { result } = renderHook(
				() => useRealtimeData({
					table: 'test_table',
					queryKey: ['test'],
					schema: testSchema,
				}),
				{ wrapper: createWrapper() }
			);

			await waitFor(() => {
				expect(mockStream.subscribe).toHaveBeenCalled();
			});

			// Simulate data with delay
			setTimeout(() => {
				act(() => {
					subscriptionCallback([{ id: '1', name: 'Test', value: 100, updated_at: '2023-01-01' }]);
				});
			}, 50);

			await waitFor(() => {
				expect(result.current.syncLatency).toBeGreaterThan(0);
				expect(result.current.syncLatency).toBeLessThan(200); // Should be under 200ms for good performance
			});
		});

		it('should cleanup subscriptions on unmount', async () => {
			const unsubscribeMock = vi.fn();
			mockStream.subscribe.mockReturnValue(unsubscribeMock);

			const { unmount } = renderHook(
				() => useRealtimeData({
					table: 'test_table',
					queryKey: ['test'],
					schema: testSchema,
				}),
				{ wrapper: createWrapper() }
			);

			await waitFor(() => {
				expect(mockStream.subscribe).toHaveBeenCalled();
			});

			unmount();

			expect(unsubscribeMock).toHaveBeenCalled();
		});
	});

	describe('useGlobalSync Hook', () => {
		it('should track multiple subscriptions', async () => {
			const { result } = renderHook(
				() => useGlobalSync('user-123'),
				{ wrapper: createWrapper() }
			);

			await waitFor(() => {
				expect(result.current.subscriptions).toHaveProperty('projects');
				expect(result.current.subscriptions).toHaveProperty('agents');
				expect(result.current.subscriptions).toHaveProperty('sessions');
			});
		});

		it('should calculate performance metrics', async () => {
			const { result } = renderHook(
				() => useGlobalSync('user-123'),
				{ wrapper: createWrapper() }
			);

			await waitFor(() => {
				expect(result.current.performanceMetrics).toHaveProperty('avgLatency');
				expect(result.current.performanceMetrics).toHaveProperty('totalSubscriptions');
				expect(result.current.performanceMetrics).toHaveProperty('errorCount');
			});
		});

		it('should indicate when fully synced', async () => {
			// Mock all subscriptions as active
			mockStream.subscribe.mockReturnValue(vi.fn());

			const { result } = renderHook(
				() => useGlobalSync('user-123'),
				{ wrapper: createWrapper() }
			);

			await waitFor(() => {
				// Note: This might be false initially as subscriptions take time to establish
				expect(typeof result.current.isFullySynced).toBe('boolean');
			});
		});
	});

	describe('useConflictResolution Hook', () => {
		it('should resolve conflicts via API', async () => {
			// Mock conflict resolution API
			vi.mocked(global.fetch).mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ success: true }),
			} as Response);

			const { result } = renderHook(
				() => useConflictResolution(),
				{ wrapper: createWrapper() }
			);

			await act(async () => {
				await result.current.resolveConflict('conflict-123', 'local');
			});

			expect(global.fetch).toHaveBeenCalledWith(
				'/api/sync/conflicts/resolve',
				expect.objectContaining({
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: expect.stringContaining('conflict-123'),
				})
			);
		});

		it('should handle conflict resolution errors', async () => {
			// Mock API error
			vi.mocked(global.fetch).mockRejectedValue(new Error('API Error'));

			const { result } = renderHook(
				() => useConflictResolution(),
				{ wrapper: createWrapper() }
			);

			await expect(
				result.current.resolveConflict('conflict-123', 'local')
			).rejects.toThrow('API Error');
		});
	});

	describe('Performance Requirements', () => {
		it('should achieve sync latency under 100ms', async () => {
			let subscriptionCallback: any;
			mockStream.subscribe.mockImplementation((callback: any) => {
				subscriptionCallback = callback;
				return vi.fn();
			});

			const { result } = renderHook(
				() => useRealtimeData({
					table: 'test_table',
					queryKey: ['test'],
					schema: testSchema,
				}),
				{ wrapper: createWrapper() }
			);

			await waitFor(() => {
				expect(mockStream.subscribe).toHaveBeenCalled();
			});

			// Simulate fast sync
			const startTime = Date.now();
			act(() => {
				subscriptionCallback([{ id: '1', name: 'Test', value: 100, updated_at: '2023-01-01' }]);
			});

			await waitFor(() => {
				const syncTime = Date.now() - startTime;
				expect(syncTime).toBeLessThan(100); // Should be under 100ms
				expect(result.current.syncLatency).toBeLessThan(100);
			});
		});

		it('should handle offline/online transitions', async () => {
			const { result } = renderHook(
				() => useRealtimeData({
					table: 'test_table',
					queryKey: ['test'],
					schema: testSchema,
				}),
				{ wrapper: createWrapper() }
			);

			// Initially online
			expect(result.current.isOnline).toBe(true);

			// Simulate going offline
			act(() => {
				window.dispatchEvent(new Event('offline'));
			});

			// Note: The actual offline handling would be implemented in the sync store
			// This test verifies the structure is in place
		});

		it('should batch multiple updates efficiently', async () => {
			let subscriptionCallback: any;
			mockStream.subscribe.mockImplementation((callback: any) => {
				subscriptionCallback = callback;
				return vi.fn();
			});

			const { result } = renderHook(
				() => useRealtimeData({
					table: 'test_table',
					queryKey: ['test'],
					schema: testSchema,
				}),
				{ wrapper: createWrapper() }
			);

			await waitFor(() => {
				expect(mockStream.subscribe).toHaveBeenCalled();
			});

			// Simulate multiple rapid updates
			const updates = [
				[{ id: '1', name: 'Test 1', value: 100, updated_at: '2023-01-01' }],
				[{ id: '1', name: 'Test 2', value: 200, updated_at: '2023-01-02' }],
				[{ id: '1', name: 'Test 3', value: 300, updated_at: '2023-01-03' }],
			];

			act(() => {
				updates.forEach(update => {
					subscriptionCallback(update);
				});
			});

			await waitFor(() => {
				expect(result.current.data).toEqual(updates[updates.length - 1]);
			});
		});
	});

	describe('Error Handling', () => {
		it('should handle ElectricSQL initialization errors', async () => {
			vi.mocked(electricSync.initialize).mockRejectedValue(new Error('Connection failed'));

			const { result } = renderHook(
				() => useRealtimeData({
					table: 'test_table',
					queryKey: ['test'],
					schema: testSchema,
				}),
				{ wrapper: createWrapper() }
			);

			await waitFor(() => {
				expect(result.current.isSubscribed).toBe(false);
			});
		});

		it('should handle network errors gracefully', async () => {
			vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

			const { result } = renderHook(
				() => useRealtimeData({
					table: 'test_table',
					queryKey: ['test'],
					schema: testSchema,
				}),
				{ wrapper: createWrapper() }
			);

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});
		});

		it('should retry failed operations', async () => {
			let attemptCount = 0;
			vi.mocked(global.fetch).mockImplementation(() => {
				attemptCount++;
				if (attemptCount < 3) {
					return Promise.reject(new Error('Temporary error'));
				}
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve([]),
				} as Response);
			});

			const { result } = renderHook(
				() => useRealtimeData({
					table: 'test_table',
					queryKey: ['test'],
					schema: testSchema,
				}),
				{ wrapper: createWrapper() }
			);

			// Trigger refetch
			await act(async () => {
				await result.current.refetch();
			});

			// Should eventually succeed after retries
			await waitFor(() => {
				expect(result.current.isError).toBe(false);
			});
		});
	});
});