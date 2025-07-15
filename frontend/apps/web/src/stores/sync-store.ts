import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { OptimisticUpdate, SyncActions, SyncState } from "./types";

interface SyncStore extends SyncState, SyncActions {
	reset: () => void;
}

const initialState: SyncState = {
	isOnline: typeof window !== "undefined" ? navigator.onLine : false,
	lastSync: null,
	syncStatus: "idle",
	pendingChanges: 0,
	conflicts: [],
	electricClient: null,
};

export const useSyncStore = create<SyncStore>()(
	devtools(
		(set, get) => ({
			...initialState,

			// Initialize ElectricSQL client
			initializeSync: async () => {
				try {
					// TODO: Initialize ElectricSQL client
					// const { Electric } = await import('electric-sql');
					// const client = await Electric({
					//   database: 'claudia.db',
					//   migrations: [], // Add your migrations here
					// });

					set((state) => {
						// state.electricClient = client;
						state.syncStatus = "idle";
					});

					// Set up real-time sync listeners
					// client.subscribe('*', (table, record) => {
					//   // Handle real-time updates
					//   console.log('Real-time update:', table, record);
					// });
				} catch (_error) {
					set((state) => {
						state.syncStatus = "error";
					});
				}
			},

			// Perform manual sync
			sync: async () => {
				const { electricClient, isOnline } = get();

				if (!electricClient || !isOnline) {
					return;
				}

				set((state) => {
					state.syncStatus = "syncing";
				});

				try {
					// TODO: Implement actual sync logic
					// await electricClient.sync();

					set((state) => {
						state.lastSync = new Date();
						state.syncStatus = "idle";
						state.pendingChanges = 0;
					});
				} catch (_error) {
					set((state) => {
						state.syncStatus = "error";
					});
				}
			},

			// Resolve sync conflicts
			resolveConflict: async (conflictId, resolution) => {
				const { conflicts } = get();
				const conflict = conflicts.find((c) => c.id === conflictId);

				if (!conflict) return;

				try {
					let _resolvedValue;

					switch (resolution) {
						case "local":
							_resolvedValue = conflict.localValue;
							break;
						case "remote":
							_resolvedValue = conflict.remoteValue;
							break;
						case "merge":
							// TODO: Implement merge logic based on data type
							_resolvedValue = {
								...conflict.remoteValue,
								...conflict.localValue,
							};
							break;
					}

					// TODO: Apply resolution to database
					// await electricClient.update(conflict.table, conflict.recordId, resolvedValue);

					set((state) => {
						const conflictIndex = state.conflicts.findIndex(
							(c) => c.id === conflictId,
						);
						if (conflictIndex !== -1) {
							state.conflicts[conflictIndex].resolved = true;
						}
					});

					// Remove resolved conflict after a delay
					setTimeout(() => {
						set((state) => {
							state.conflicts = state.conflicts.filter(
								(c) => c.id !== conflictId,
							);
						});
					}, 2000);
				} catch (_error) {}
			},

			// Optimistic updates
			addOptimisticUpdate: (updateData) => {
				const optimisticUpdate: OptimisticUpdate = {
					id: `optimistic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
					timestamp: new Date(),
					status: "pending",
					...updateData,
				};

				set((state) => {
					state.pendingChanges += 1;
				});

				// Simulate optimistic update confirmation
				setTimeout(
					() => {
						get().confirmOptimisticUpdate(optimisticUpdate.id);
					},
					Math.random() * 2000 + 1000,
				); // 1-3 seconds
			},

			confirmOptimisticUpdate: (_id) => {
				set((state) => {
					state.pendingChanges = Math.max(0, state.pendingChanges - 1);
				});
			},

			revertOptimisticUpdate: (_id) => {
				set((state) => {
					state.pendingChanges = Math.max(0, state.pendingChanges - 1);
				});
			},

			// Network status
			setOnlineStatus: (isOnline) => {
				set((state) => {
					state.isOnline = isOnline;
				});

				// Auto-sync when coming back online
				if (isOnline && get().pendingChanges > 0) {
					get().sync();
				}
			},

			// Reset to initial state
			reset: () => {
				set(initialState);
			},
		}),
		{ name: "Sync Store" },
	),
);

// Set up network status listeners
if (typeof window !== "undefined") {
	window.addEventListener("online", () => {
		useSyncStore.getState().setOnlineStatus(true);
	});

	window.addEventListener("offline", () => {
		useSyncStore.getState().setOnlineStatus(false);
	});
}
