import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRealtimeData, useGlobalSync } from '@/hooks/use-real-time-sync';
import { electricSync } from '@/../../apps/server/src/db/electric';
import { z } from 'zod';
import { ReactNode } from 'react';

// Test schemas
const projectSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string(),
	user_id: z.string(),
	created_at: z.string(),
	updated_at: z.string(),
});

const messageSchema = z.object({
	id: z.string(),
	content: z.string(),
	role: z.enum(['user', 'assistant']),
	session_id: z.string(),
	created_at: z.string(),
});

// Performance test utilities
class PerformanceTracker {
	private metrics: Map<string, number[]> = new Map();

	startTiming(operation: string): () => void {
		const start = performance.now();
		return () => {
			const end = performance.now();
			const duration = end - start;
			
			if (!this.metrics.has(operation)) {
				this.metrics.set(operation, []);
			}
			this.metrics.get(operation)!.push(duration);
		};
	}

	getAverageTime(operation: string): number {
		const times = this.metrics.get(operation) || [];
		return times.reduce((sum, time) => sum + time, 0) / times.length;
	}

	getMedianTime(operation: string): number {
		const times = this.metrics.get(operation) || [];
		const sorted = times.slice().sort((a, b) => a - b);
		const middle = Math.floor(sorted.length / 2);
		return sorted.length % 2 === 0 
			? (sorted[middle - 1] + sorted[middle]) / 2 
			: sorted[middle];
	}

	getP95Time(operation: string): number {
		const times = this.metrics.get(operation) || [];
		const sorted = times.slice().sort((a, b) => a - b);
		const index = Math.floor(sorted.length * 0.95);
		return sorted[index] || 0;
	}

	reset(): void {
		this.metrics.clear();
	}
}

// Mock ElectricSQL client with performance tracking
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

// Test wrapper
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

describe('Sync Performance Tests', () => {
	let performanceTracker: PerformanceTracker;
	let mockStream: any;

	beforeAll(() => {
		global.fetch = vi.fn();
		global.performance = {
			now: () => Date.now(),
		} as any;
	});

	beforeEach(() => {
		performanceTracker = new PerformanceTracker();
		vi.clearAllMocks();

		mockStream = {
			subscribe: vi.fn(),
			unsubscribe: vi.fn(),
		};

		vi.mocked(electricSync.initialize).mockResolvedValue(undefined);
		vi.mocked(electricSync.syncShape).mockResolvedValue(mockStream);
		vi.mocked(electricSync.getSyncMetrics).mockResolvedValue({
			totalEvents: 0,
			avgLatency: 50,
			conflictRate: 0,
			lastSync: new Date().toISOString(),
		});
	});

	describe('Sync Latency Requirements', () => {
		it('should achieve initial sync under 100ms', async () => {
			const endTiming = performanceTracker.startTiming('initial_sync');
			
			let subscriptionCallback: any;
			mockStream.subscribe.mockImplementation((callback: any) => {
				subscriptionCallback = callback;
				// Simulate immediate response
				setTimeout(() => callback([
					{ id: '1', name: 'Test Project', description: 'Test', user_id: 'user1', created_at: '2023-01-01', updated_at: '2023-01-01' }
				]), 10);
				return vi.fn();
			});

			const { result } = renderHook(
				() => useRealtimeData({
					table: 'projects',
					queryKey: ['projects'],
					schema: projectSchema,
				}),
				{ wrapper: createWrapper() }
			);

			await waitFor(() => {
				expect(result.current.data).toHaveLength(1);
			});

			endTiming();
			
			expect(result.current.syncLatency).toBeLessThan(100);
			expect(performanceTracker.getAverageTime('initial_sync')).toBeLessThan(100);
		});

		it('should handle rapid updates under 50ms each', async () => {
			let subscriptionCallback: any;
			mockStream.subscribe.mockImplementation((callback: any) => {
				subscriptionCallback = callback;
				return vi.fn();
			});

			const { result } = renderHook(
				() => useRealtimeData({
					table: 'projects',
					queryKey: ['projects'],
					schema: projectSchema,
				}),
				{ wrapper: createWrapper() }
			);

			await waitFor(() => {
				expect(mockStream.subscribe).toHaveBeenCalled();
			});

			// Simulate 10 rapid updates
			const updates = Array.from({ length: 10 }, (_, i) => ({
				id: '1',
				name: `Project ${i}`,
				description: `Description ${i}`,
				user_id: 'user1',
				created_at: '2023-01-01',
				updated_at: new Date().toISOString(),
			}));

			for (const update of updates) {
				const endTiming = performanceTracker.startTiming('update_processing');
				
				act(() => {
					subscriptionCallback([update]);
				});

				await waitFor(() => {
					expect(result.current.data[0].name).toBe(update.name);
				});

				endTiming();
			}

			const avgUpdateTime = performanceTracker.getAverageTime('update_processing');
			const p95UpdateTime = performanceTracker.getP95Time('update_processing');

			expect(avgUpdateTime).toBeLessThan(50);
			expect(p95UpdateTime).toBeLessThan(100);
		});

		it('should handle concurrent subscriptions efficiently', async () => {
			const endTiming = performanceTracker.startTiming('concurrent_subscriptions');

			// Mock multiple streams
			const streams = Array.from({ length: 5 }, () => ({
				subscribe: vi.fn((callback) => {
					setTimeout(() => callback([]), 20);
					return vi.fn();
				}),
				unsubscribe: vi.fn(),
			}));

			vi.mocked(electricSync.syncShape).mockImplementation(async (table) => {
				const index = ['projects', 'agents', 'sessions', 'messages', 'memory'].indexOf(table);
				return streams[index] || mockStream;
			});

			const { result } = renderHook(
				() => useGlobalSync('user123'),
				{ wrapper: createWrapper() }
			);

			await waitFor(() => {
				expect(result.current.isOnline).toBe(true);
			});

			endTiming();

			const concurrentTime = performanceTracker.getAverageTime('concurrent_subscriptions');
			expect(concurrentTime).toBeLessThan(500); // Should handle 5 concurrent subscriptions under 500ms
		});
	});

	describe('Memory Usage and Cleanup', () => {
		it('should cleanup subscriptions properly', async () => {
			const unsubscribeMock = vi.fn();
			mockStream.subscribe.mockReturnValue(unsubscribeMock);

			const { result, unmount } = renderHook(
				() => useRealtimeData({
					table: 'projects',
					queryKey: ['projects'],
					schema: projectSchema,
				}),
				{ wrapper: createWrapper() }
			);

			await waitFor(() => {
				expect(result.current.isSubscribed).toBe(true);
			});

			// Unmount should cleanup subscriptions
			unmount();
			expect(unsubscribeMock).toHaveBeenCalled();
		});

		it('should handle memory pressure with large datasets', async () => {
			const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
				id: `project-${i}`,
				name: `Project ${i}`,
				description: `Description for project ${i}`,
				user_id: 'user1',
				created_at: '2023-01-01',
				updated_at: '2023-01-01',
			}));

			let subscriptionCallback: any;
			mockStream.subscribe.mockImplementation((callback: any) => {
				subscriptionCallback = callback;
				return vi.fn();
			});

			const { result } = renderHook(
				() => useRealtimeData({
					table: 'projects',
					queryKey: ['projects'],
					schema: projectSchema,
				}),
				{ wrapper: createWrapper() }
			);

			await waitFor(() => {
				expect(mockStream.subscribe).toHaveBeenCalled();
			});

			const endTiming = performanceTracker.startTiming('large_dataset_processing');

			act(() => {
				subscriptionCallback(largeDataset);
			});

			await waitFor(() => {
				expect(result.current.data).toHaveLength(1000);
			});

			endTiming();

			const processingTime = performanceTracker.getAverageTime('large_dataset_processing');
			expect(processingTime).toBeLessThan(1000); // Should handle 1000 records under 1 second
		});
	});

	describe('Batch Operations Performance', () => {
		it('should batch multiple mutations efficiently', async () => {
			vi.mocked(global.fetch).mockImplementation(() => 
				Promise.resolve({
					ok: true,
					json: () => Promise.resolve({ success: true }),
				} as Response)
			);

			const { result } = renderHook(
				() => useRealtimeData({
					table: 'projects',
					queryKey: ['projects'],
					schema: projectSchema,
				}),
				{ wrapper: createWrapper() }
			);

			// Simulate multiple concurrent mutations
			const mutations = Array.from({ length: 10 }, (_, i) => ({
				id: `project-${i}`,
				name: `Updated Project ${i}`,
				description: `Updated description ${i}`,
			}));

			const endTiming = performanceTracker.startTiming('batch_mutations');

			await Promise.all(
				mutations.map(mutation => 
					act(async () => {
						await result.current.mutateAsync(mutation);
					})
				)
			);

			endTiming();

			const batchTime = performanceTracker.getAverageTime('batch_mutations');
			expect(batchTime).toBeLessThan(2000); // Should handle 10 mutations under 2 seconds
		});

		it('should handle optimistic updates without performance degradation', async () => {
			const initialData = Array.from({ length: 100 }, (_, i) => ({
				id: `project-${i}`,
				name: `Project ${i}`,
				description: `Description ${i}`,
				user_id: 'user1',
				created_at: '2023-01-01',
				updated_at: '2023-01-01',
			}));

			let subscriptionCallback: any;
			mockStream.subscribe.mockImplementation((callback: any) => {
				subscriptionCallback = callback;
				return vi.fn();
			});

			const { result } = renderHook(
				() => useRealtimeData({
					table: 'projects',
					queryKey: ['projects'],
					schema: projectSchema,
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
				expect(result.current.data).toHaveLength(100);
			});

			// Perform optimistic update
			const endTiming = performanceTracker.startTiming('optimistic_update');

			act(() => {
				result.current.mutate({
					id: 'project-50',
					name: 'Optimistically Updated Project',
					description: 'Updated description',
				});
			});

			await waitFor(() => {
				expect(result.current.data[50].name).toBe('Optimistically Updated Project');
			});

			endTiming();

			const optimisticTime = performanceTracker.getAverageTime('optimistic_update');
			expect(optimisticTime).toBeLessThan(50); // Optimistic updates should be very fast
		});
	});

	describe('Network Conditions Performance', () => {
		it('should handle slow network conditions gracefully', async () => {
			// Simulate slow network
			let subscriptionCallback: any;
			mockStream.subscribe.mockImplementation((callback: any) => {
				subscriptionCallback = callback;
				// Simulate 500ms delay
				setTimeout(() => {
					callback([{
						id: '1',
						name: 'Test Project',
						description: 'Test',
						user_id: 'user1',
						created_at: '2023-01-01',
						updated_at: '2023-01-01',
					}]);
				}, 500);
				return vi.fn();
			});

			const { result } = renderHook(
				() => useRealtimeData({
					table: 'projects',
					queryKey: ['projects'],
					schema: projectSchema,
				}),
				{ wrapper: createWrapper() }
			);

			const endTiming = performanceTracker.startTiming('slow_network');

			await waitFor(() => {
				expect(result.current.data).toHaveLength(1);
			}, { timeout: 1000 });

			endTiming();

			const networkTime = performanceTracker.getAverageTime('slow_network');
			expect(networkTime).toBeGreaterThan(500); // Should reflect network delay
			expect(networkTime).toBeLessThan(1000); // But not timeout
		});

		it('should recover from network interruptions quickly', async () => {
			let subscriptionCallback: any;
			let isNetworkUp = true;

			mockStream.subscribe.mockImplementation((callback: any) => {
				subscriptionCallback = callback;
				return vi.fn();
			});

			const { result } = renderHook(
				() => useRealtimeData({
					table: 'projects',
					queryKey: ['projects'],
					schema: projectSchema,
				}),
				{ wrapper: createWrapper() }
			);

			await waitFor(() => {
				expect(mockStream.subscribe).toHaveBeenCalled();
			});

			// Simulate network interruption
			isNetworkUp = false;

			// Simulate network recovery
			const endTiming = performanceTracker.startTiming('network_recovery');
			
			setTimeout(() => {
				isNetworkUp = true;
				subscriptionCallback([{
					id: '1',
					name: 'Recovered Project',
					description: 'After network recovery',
					user_id: 'user1',
					created_at: '2023-01-01',
					updated_at: '2023-01-01',
				}]);
			}, 100);

			await waitFor(() => {
				expect(result.current.data).toHaveLength(1);
			});

			endTiming();

			const recoveryTime = performanceTracker.getAverageTime('network_recovery');
			expect(recoveryTime).toBeLessThan(500); // Should recover quickly
		});
	});

	describe('Stress Testing', () => {
		it('should handle high-frequency updates', async () => {
			let subscriptionCallback: any;
			mockStream.subscribe.mockImplementation((callback: any) => {
				subscriptionCallback = callback;
				return vi.fn();
			});

			const { result } = renderHook(
				() => useRealtimeData({
					table: 'messages',
					queryKey: ['messages'],
					schema: messageSchema,
				}),
				{ wrapper: createWrapper() }
			);

			await waitFor(() => {
				expect(mockStream.subscribe).toHaveBeenCalled();
			});

			// Simulate high-frequency updates (100 updates per second)
			const endTiming = performanceTracker.startTiming('high_frequency_updates');
			
			for (let i = 0; i < 100; i++) {
				act(() => {
					subscriptionCallback([{
						id: `msg-${i}`,
						content: `Message ${i}`,
						role: 'user' as const,
						session_id: 'session1',
						created_at: new Date().toISOString(),
					}]);
				});
				
				// Small delay to simulate rapid updates
				await new Promise(resolve => setTimeout(resolve, 10));
			}

			endTiming();

			const highFreqTime = performanceTracker.getAverageTime('high_frequency_updates');
			expect(highFreqTime).toBeLessThan(5000); // Should handle 100 updates under 5 seconds
		});

		it('should maintain performance under load', async () => {
			// Test with multiple concurrent hooks
			const hooks = Array.from({ length: 10 }, (_, i) => 
				renderHook(
					() => useRealtimeData({
						table: 'projects',
						queryKey: ['projects', i.toString()],
						schema: projectSchema,
					}),
					{ wrapper: createWrapper() }
				)
			);

			const endTiming = performanceTracker.startTiming('concurrent_hooks');

			// Wait for all hooks to initialize
			await Promise.all(
				hooks.map(({ result }) => 
					waitFor(() => {
						expect(result.current.isOnline).toBe(true);
					})
				)
			);

			endTiming();

			const concurrentTime = performanceTracker.getAverageTime('concurrent_hooks');
			expect(concurrentTime).toBeLessThan(1000); // Should handle 10 concurrent hooks under 1 second

			// Cleanup
			hooks.forEach(({ unmount }) => unmount());
		});
	});

	describe('Performance Regression Detection', () => {
		it('should detect performance regressions', async () => {
			const baselineLatency = 50; // Expected baseline
			const regressionThreshold = 2.0; // 2x slowdown is a regression

			let subscriptionCallback: any;
			mockStream.subscribe.mockImplementation((callback: any) => {
				subscriptionCallback = callback;
				// Simulate variable latency
				setTimeout(() => {
					callback([{
						id: '1',
						name: 'Test Project',
						description: 'Test',
						user_id: 'user1',
						created_at: '2023-01-01',
						updated_at: '2023-01-01',
					}]);
				}, Math.random() * 100 + 10);
				return vi.fn();
			});

			// Run multiple iterations to get stable metrics
			for (let i = 0; i < 10; i++) {
				const { result, unmount } = renderHook(
					() => useRealtimeData({
						table: 'projects',
						queryKey: ['projects', i.toString()],
						schema: projectSchema,
					}),
					{ wrapper: createWrapper() }
				);

				const endTiming = performanceTracker.startTiming('regression_test');

				await waitFor(() => {
					expect(result.current.data).toHaveLength(1);
				});

				endTiming();
				unmount();
			}

			const avgLatency = performanceTracker.getAverageTime('regression_test');
			const p95Latency = performanceTracker.getP95Time('regression_test');

			// Check for regressions
			expect(avgLatency).toBeLessThan(baselineLatency * regressionThreshold);
			expect(p95Latency).toBeLessThan(baselineLatency * regressionThreshold * 1.5);
		});
	});
});