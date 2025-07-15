import type { ElectricConfig } from "electric-sql";
import { electrify } from "electric-sql/browser";
import * as schema from "./schema";

// ElectricSQL configuration
export const electricConfig: ElectricConfig = {
	url: process.env.ELECTRIC_URL || "ws://localhost:5133",
	debug: process.env.NODE_ENV === "development",
	timeout: 10000,
};

// Initialize Electric client
let electric: any | null = null;

export async function initElectric(): Promise<any> {
	if (electric) return electric;
	// Initialize the Electric client
	electric = await electrify(
		{} as any, // Database placeholder
		schema as any,
		electricConfig,
	);

	// Set up sync subscriptions for all tables
	await setupSyncSubscriptions(electric);
	return electric;
}

// Set up sync subscriptions for real-time data
async function setupSyncSubscriptions(electric: any) {
	const { db } = electric;
	// Subscribe to users table
	await (db as any).users?.sync?.();

	// Subscribe to projects table
	await (db as any).projects?.sync?.();

	// Subscribe to agents table
	await (db as any).agents?.sync?.();

	// Subscribe to sessions table with shape filtering
	await (db as any).sessions?.sync?.({
		// Only sync active sessions
		where: { status: "active" },
	});

	// Subscribe to messages table with limits
	await (db as any).messages?.sync?.({
		// Only sync recent messages
		where: {
			createdAt: {
				gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
			},
		},
	});

	// Subscribe to memory table with user filtering
	await (db as any).memory?.sync?.({
		// Sync based on current user (to be set dynamically)
		where: { userId: getCurrentUserId() },
	});

	// Subscribe to sync events for monitoring
	await (db as any).syncEvents?.sync?.({
		where: {
			status: ["pending", "conflict"],
		},
	});
}

// Get current user ID (implement based on your auth system)
function getCurrentUserId(): string {
	// TODO: Implement based on your authentication system
	return process.env.CURRENT_USER_ID || "";
}

// Sync utilities
export class ElectricSyncManager {
	private electric: any | null = null;

	async initialize(): Promise<void> {
		this.electric = await initElectric();
	}

	async syncTable(
		tableName: string,
		shape?: Record<string, unknown>,
	): Promise<void> {
		if (!this.electric) throw new Error("Electric not initialized");

		const { db } = this.electric;
		const table = (db as Record<string, unknown>)[tableName];

		if (!table) {
			throw new Error(`Table ${tableName} not found`);
		}

		await (table as any).sync(shape);
	}

	async forceSyncAll(): Promise<void> {
		if (!this.electric) throw new Error("Electric not initialized");

		// Force sync all subscribed tables
		await setupSyncSubscriptions(this.electric);
	}

	async getConflicts(): Promise<unknown[]> {
		if (!this.electric) throw new Error("Electric not initialized");

		const { db } = this.electric;
		return await db.syncConflicts.findMany({
			where: { isResolved: false },
		});
	}

	async resolveConflict(
		conflictId: string,
		strategy: "local_wins" | "remote_wins" | "merge",
		resolvedData?: unknown,
	): Promise<void> {
		if (!this.electric) throw new Error("Electric not initialized");

		const { db } = this.electric;

		await db.syncConflicts.update({
			where: { id: conflictId },
			data: {
				resolutionStrategy: strategy,
				resolvedData,
				isResolved: true,
				resolvedAt: new Date(),
				resolvedBy: getCurrentUserId(),
			},
		});
	}

	async getSyncMetrics(): Promise<Record<string, unknown>> {
		if (!this.electric) throw new Error("Electric not initialized");

		const { db } = this.electric;

		const now = new Date();
		const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

		const metrics = await db.syncMetrics.findMany({
			where: {
				measuredAt: {
					gte: hourAgo,
				},
			},
			orderBy: { measuredAt: "desc" },
		});

		return {
			totalEvents: metrics.length,
			avgLatency:
				metrics
					.filter((m: any) => m.metricType === "sync_latency")
					.reduce((sum: number, m: any) => sum + m.value, 0) / metrics.length ||
				0,
			conflictRate:
				metrics
					.filter((m: any) => m.metricType === "conflict_rate")
					.reduce((sum: number, m: any) => sum + m.value, 0) / metrics.length ||
				0,
			lastSync: metrics[0]?.measuredAt || null,
		};
	}
}

// Export singleton instance
export const syncManager = new ElectricSyncManager();

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
