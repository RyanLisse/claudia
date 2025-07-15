import { and, count, desc, eq, gte } from "drizzle-orm";
import { db } from "./index";
import { syncConflicts, syncEvents, syncMetrics } from "./schema/sync";

export interface SyncStatus {
	isOnline: boolean;
	lastSync: Date | null;
	pendingEvents: number;
	conflicts: number;
	latency: number;
	bandwidth: number;
}

export interface SyncHealth {
	status: "healthy" | "warning" | "critical";
	score: number; // 0-100
	issues: string[];
	recommendations: string[];
}

export class SyncMonitor {
	private monitoringInterval: NodeJS.Timeout | null = null;
	private subscribers: ((status: SyncStatus) => void)[] = [];

	async startMonitoring(intervalMs = 5000): Promise<void> {
		if (this.monitoringInterval) {
			clearInterval(this.monitoringInterval);
		}

		this.monitoringInterval = setInterval(async () => {
			try {
				const status = await this.getSyncStatus();
				this.notifySubscribers(status);
			} catch (_error) {
				// Ignore monitoring errors
			}
		}, intervalMs);
	}

	stopMonitoring(): void {
		if (this.monitoringInterval) {
			clearInterval(this.monitoringInterval);
			this.monitoringInterval = null;
		}
	}

	subscribe(callback: (status: SyncStatus) => void): () => void {
		this.subscribers.push(callback);
		return () => {
			const index = this.subscribers.indexOf(callback);
			if (index > -1) {
				this.subscribers.splice(index, 1);
			}
		};
	}

	private notifySubscribers(status: SyncStatus): void {
		this.subscribers.forEach((callback) => {
			try {
				callback(status);
			} catch (_error) {
				// Ignore monitoring errors
			}
		});
	}

	async getSyncStatus(): Promise<SyncStatus> {
		const now = new Date();
		const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

		// Get pending events count
		const pendingEventsResult = await db
			.select({ count: count() })
			.from(syncEvents)
			.where(eq(syncEvents.status, "pending"));
		const pendingEvents = pendingEventsResult[0]?.count || 0;

		// Get unresolved conflicts count
		const conflictsResult = await db
			.select({ count: count() })
			.from(syncConflicts)
			.where(eq(syncConflicts.isResolved, false));
		const conflicts = conflictsResult[0]?.count || 0;

		// Get last sync time
		const lastSyncResult = await db
			.select({ appliedAt: syncEvents.appliedAt })
			.from(syncEvents)
			.where(eq(syncEvents.status, "applied"))
			.orderBy(desc(syncEvents.appliedAt))
			.limit(1);
		const lastSync = lastSyncResult[0]?.appliedAt || null;

		// Get recent metrics
		const latencyMetrics = await db
			.select({ value: syncMetrics.value })
			.from(syncMetrics)
			.where(
				and(
					eq(syncMetrics.metricType, "sync_latency"),
					gte(syncMetrics.measuredAt, fiveMinutesAgo),
				),
			);
		const latency =
			latencyMetrics.length > 0
				? latencyMetrics.reduce((sum, m) => sum + m.value, 0) /
					latencyMetrics.length
				: 0;

		const bandwidthMetrics = await db
			.select({ value: syncMetrics.value })
			.from(syncMetrics)
			.where(
				and(
					eq(syncMetrics.metricType, "bandwidth_usage"),
					gte(syncMetrics.measuredAt, fiveMinutesAgo),
				),
			);
		const bandwidth =
			bandwidthMetrics.length > 0
				? bandwidthMetrics.reduce((sum, m) => sum + m.value, 0) /
					bandwidthMetrics.length
				: 0;

		// Determine if online based on recent activity
		const isOnline = lastSync && now.getTime() - lastSync.getTime() < 30000; // 30 seconds

		return {
			isOnline: Boolean(isOnline),
			lastSync,
			pendingEvents,
			conflicts,
			latency,
			bandwidth,
		};
	}

	async getSyncHealth(): Promise<SyncHealth> {
		const status = await this.getSyncStatus();
		const issues: string[] = [];
		const recommendations: string[] = [];
		let score = 100;

		// Check connectivity
		if (!status.isOnline) {
			score -= 50;
			issues.push("Sync service is offline");
			recommendations.push(
				"Check network connectivity and ElectricSQL service",
			);
		}

		// Check pending events
		if (status.pendingEvents > 100) {
			score -= 20;
			issues.push(
				`High number of pending sync events (${status.pendingEvents})`,
			);
			recommendations.push("Consider optimizing sync batch size or frequency");
		} else if (status.pendingEvents > 50) {
			score -= 10;
			issues.push(
				`Moderate number of pending sync events (${status.pendingEvents})`,
			);
		}

		// Check conflicts
		if (status.conflicts > 10) {
			score -= 30;
			issues.push(`High number of unresolved conflicts (${status.conflicts})`);
			recommendations.push("Review and resolve sync conflicts manually");
		} else if (status.conflicts > 0) {
			score -= 15;
			issues.push(`Unresolved conflicts detected (${status.conflicts})`);
			recommendations.push("Monitor conflict resolution strategies");
		}

		// Check latency
		if (status.latency > 5000) {
			// 5 seconds
			score -= 20;
			issues.push(`High sync latency (${Math.round(status.latency)}ms)`);
			recommendations.push("Check network performance and server load");
		} else if (status.latency > 2000) {
			// 2 seconds
			score -= 10;
			issues.push(`Elevated sync latency (${Math.round(status.latency)}ms)`);
		}

		// Check bandwidth usage
		if (status.bandwidth > 1000000) {
			// 1MB
			score -= 10;
			issues.push(
				`High bandwidth usage (${Math.round(status.bandwidth / 1024)}KB)`,
			);
			recommendations.push("Consider optimizing sync payload size");
		}

		// Determine overall health status
		let healthStatus: "healthy" | "warning" | "critical";
		if (score >= 80) {
			healthStatus = "healthy";
		} else if (score >= 60) {
			healthStatus = "warning";
		} else {
			healthStatus = "critical";
		}

		return {
			status: healthStatus,
			score: Math.max(0, score),
			issues,
			recommendations,
		};
	}

	async recordMetric(
		type: string,
		value: number,
		metadata?: unknown,
	): Promise<void> {
		const clientId = process.env.CLIENT_ID || "server";

		await db.insert(syncMetrics).values({
			clientId,
			metricType: type,
			value,
			unit: this.getUnitForMetric(type),
			metadata,
			measuredAt: new Date(),
		});
	}

	private getUnitForMetric(type: string): string {
		switch (type) {
			case "sync_latency":
				return "ms";
			case "bandwidth_usage":
				return "bytes";
			case "conflict_rate":
				return "percentage";
			case "event_count":
				return "count";
			default:
				return "unit";
		}
	}

	async getDetailedMetrics(hours = 24): Promise<unknown> {
		const since = new Date(Date.now() - hours * 60 * 60 * 1000);

		const metrics = await db
			.select()
			.from(syncMetrics)
			.where(gte(syncMetrics.measuredAt, since))
			.orderBy(desc(syncMetrics.measuredAt));

		// Group by metric type
		const grouped = metrics.reduce(
			(acc, metric) => {
				if (!acc[metric.metricType]) {
					acc[metric.metricType] = [];
				}
				acc[metric.metricType].push(metric);
				return acc;
			},
			{} as Record<string, typeof metrics>,
		);

		// Calculate statistics for each metric type
		const stats = Object.entries(grouped).map(([type, values]) => {
			const nums = values.map((v) => v.value);
			return {
				type,
				count: nums.length,
				avg: nums.reduce((sum, n) => sum + n, 0) / nums.length,
				min: Math.min(...nums),
				max: Math.max(...nums),
				latest: values[0]?.value || 0,
				unit: values[0]?.unit || "unit",
			};
		});

		return {
			timeRange: { since, until: new Date() },
			metrics: stats,
			raw: metrics,
		};
	}

	async cleanupOldData(days = 30): Promise<void> {
		const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

		// Clean up old sync events
		await db
			.delete(syncEvents)
			.where(
				and(
					eq(syncEvents.status, "applied"),
					gte(syncEvents.createdAt, cutoff),
				),
			);

		// Clean up old metrics
		await db.delete(syncMetrics).where(gte(syncMetrics.measuredAt, cutoff));
	}
}

export const syncMonitor = new SyncMonitor();
