"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGlobalSync, useSyncStatus, useConflictResolution } from '@/hooks/use-real-time-sync';
import { electricSync } from '@/../../apps/server/src/db/electric';
import { 
	Activity, 
	Wifi, 
	WifiOff, 
	Clock, 
	AlertTriangle, 
	CheckCircle, 
	XCircle, 
	Zap,
	Database,
	Users,
	MessageSquare,
	Brain,
	RefreshCw
} from 'lucide-react';

interface SyncMetrics {
	totalEvents: number;
	avgLatency: number;
	conflictRate: number;
	lastSync: string | null;
	bandwidth: number;
	errors: number;
}

export function SyncMonitoringDashboard() {
	const globalSync = useGlobalSync();
	const syncStatus = useSyncStatus();
	const { conflicts, resolveConflict, isResolving } = useConflictResolution();
	
	const [metrics, setMetrics] = useState<SyncMetrics>({
		totalEvents: 0,
		avgLatency: 0,
		conflictRate: 0,
		lastSync: null,
		bandwidth: 0,
		errors: 0,
	});
	
	const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
	const [selectedConflict, setSelectedConflict] = useState<string | null>(null);

	// Fetch real-time metrics
	const fetchMetrics = useCallback(async () => {
		setIsLoadingMetrics(true);
		try {
			const syncMetrics = await electricSync.getSyncMetrics();
			setMetrics(syncMetrics as SyncMetrics);
		} catch (error) {
			console.error('Failed to fetch sync metrics:', error);
		} finally {
			setIsLoadingMetrics(false);
		}
	}, []);

	// Auto-refresh metrics every 5 seconds
	useEffect(() => {
		fetchMetrics();
		const interval = setInterval(fetchMetrics, 5000);
		return () => clearInterval(interval);
	}, [fetchMetrics]);

	// Connection quality indicator
	const getConnectionStatusColor = (quality: string) => {
		switch (quality) {
			case 'excellent': return 'bg-green-500';
			case 'good': return 'bg-blue-500';
			case 'poor': return 'bg-yellow-500';
			case 'offline': return 'bg-red-500';
			default: return 'bg-gray-500';
		}
	};

	// Latency indicator
	const getLatencyColor = (latency: number) => {
		if (latency < 50) return 'text-green-600';
		if (latency < 100) return 'text-blue-600';
		if (latency < 200) return 'text-yellow-600';
		return 'text-red-600';
	};

	// Format timestamp
	const formatTime = (timestamp: string | null) => {
		if (!timestamp) return 'Never';
		return new Date(timestamp).toLocaleTimeString();
	};

	// Handle conflict resolution
	const handleConflictResolution = async (conflictId: string, resolution: 'local' | 'remote' | 'merge') => {
		await resolveConflict(conflictId, resolution);
		setSelectedConflict(null);
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-3xl font-bold tracking-tight">Real-time Sync Monitor</h2>
					<p className="text-muted-foreground">
						Monitor ElectricSQL synchronization performance and resolve conflicts
					</p>
				</div>
				<Button 
					onClick={fetchMetrics} 
					disabled={isLoadingMetrics}
					variant="outline"
					size="sm"
				>
					<RefreshCw className={`h-4 w-4 mr-2 ${isLoadingMetrics ? 'animate-spin' : ''}`} />
					Refresh
				</Button>
			</div>

			{/* Connection Status */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						{syncStatus.isOnline ? (
							<Wifi className="h-5 w-5 text-green-600" />
						) : (
							<WifiOff className="h-5 w-5 text-red-600" />
						)}
						Connection Status
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-2">
							<div className={`w-3 h-3 rounded-full ${getConnectionStatusColor(syncStatus.connectionQuality)}`} />
							<span className="capitalize">{syncStatus.connectionQuality}</span>
						</div>
						<Badge variant={syncStatus.isOnline ? "default" : "destructive"}>
							{syncStatus.isOnline ? 'Online' : 'Offline'}
						</Badge>
						<span className="text-sm text-muted-foreground">
							Last sync: {formatTime(syncStatus.lastSync)}
						</span>
					</div>
				</CardContent>
			</Card>

			{/* Metrics Overview */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Average Latency</CardTitle>
						<Clock className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className={`text-2xl font-bold ${getLatencyColor(globalSync.performanceMetrics.avgLatency)}`}>
							{globalSync.performanceMetrics.avgLatency.toFixed(0)}ms
						</div>
						<Progress 
							value={Math.min(globalSync.performanceMetrics.avgLatency / 2, 100)} 
							className="mt-2"
						/>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
						<Activity className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{globalSync.performanceMetrics.totalSubscriptions}/3
						</div>
						<Progress 
							value={(globalSync.performanceMetrics.totalSubscriptions / 3) * 100} 
							className="mt-2"
						/>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Pending Changes</CardTitle>
						<Zap className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{syncStatus.pendingChanges}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							Optimistic updates
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Conflicts</CardTitle>
						<AlertTriangle className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-red-600">
							{conflicts.length}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							Needs resolution
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Detailed Monitoring */}
			<Tabs defaultValue="subscriptions" className="space-y-4">
				<TabsList>
					<TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
					<TabsTrigger value="conflicts">Conflicts</TabsTrigger>
					<TabsTrigger value="metrics">Metrics</TabsTrigger>
				</TabsList>

				<TabsContent value="subscriptions" className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{/* Projects Subscription */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Database className="h-4 w-4" />
									Projects
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<span className="text-sm">Status</span>
										{globalSync.subscriptions.projects.isSubscribed ? (
											<CheckCircle className="h-4 w-4 text-green-600" />
										) : (
											<XCircle className="h-4 w-4 text-red-600" />
										)}
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm">Latency</span>
										<span className={`text-sm ${getLatencyColor(globalSync.subscriptions.projects.latency)}`}>
											{globalSync.subscriptions.projects.latency.toFixed(0)}ms
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm">Errors</span>
										<span className="text-sm">
											{globalSync.subscriptions.projects.error ? 'Yes' : 'No'}
										</span>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Agents Subscription */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Users className="h-4 w-4" />
									Agents
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<span className="text-sm">Status</span>
										{globalSync.subscriptions.agents.isSubscribed ? (
											<CheckCircle className="h-4 w-4 text-green-600" />
										) : (
											<XCircle className="h-4 w-4 text-red-600" />
										)}
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm">Latency</span>
										<span className={`text-sm ${getLatencyColor(globalSync.subscriptions.agents.latency)}`}>
											{globalSync.subscriptions.agents.latency.toFixed(0)}ms
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm">Errors</span>
										<span className="text-sm">
											{globalSync.subscriptions.agents.error ? 'Yes' : 'No'}
										</span>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Sessions Subscription */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<MessageSquare className="h-4 w-4" />
									Sessions
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<span className="text-sm">Status</span>
										{globalSync.subscriptions.sessions.isSubscribed ? (
											<CheckCircle className="h-4 w-4 text-green-600" />
										) : (
											<XCircle className="h-4 w-4 text-red-600" />
										)}
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm">Latency</span>
										<span className={`text-sm ${getLatencyColor(globalSync.subscriptions.sessions.latency)}`}>
											{globalSync.subscriptions.sessions.latency.toFixed(0)}ms
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm">Errors</span>
										<span className="text-sm">
											{globalSync.subscriptions.sessions.error ? 'Yes' : 'No'}
										</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="conflicts" className="space-y-4">
					{conflicts.length === 0 ? (
						<Card>
							<CardContent className="pt-6">
								<div className="text-center">
									<CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
									<h3 className="text-lg font-semibold">No Conflicts</h3>
									<p className="text-muted-foreground">All data is synchronized successfully</p>
								</div>
							</CardContent>
						</Card>
					) : (
						<div className="space-y-4">
							{conflicts.map((conflict) => (
								<Card key={conflict.id}>
									<CardHeader>
										<CardTitle className="flex items-center justify-between">
											<span>Conflict in {conflict.table}</span>
											<Badge variant="destructive">
												{conflict.conflictType || 'Unknown'}
											</Badge>
										</CardTitle>
										<CardDescription>
											Record ID: {conflict.recordId}
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="space-y-4">
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div>
													<h4 className="font-semibold mb-2">Local Version</h4>
													<pre className="bg-muted p-3 rounded text-sm overflow-auto">
														{JSON.stringify(conflict.localValue, null, 2)}
													</pre>
												</div>
												<div>
													<h4 className="font-semibold mb-2">Remote Version</h4>
													<pre className="bg-muted p-3 rounded text-sm overflow-auto">
														{JSON.stringify(conflict.remoteValue, null, 2)}
													</pre>
												</div>
											</div>
											<div className="flex gap-2">
												<Button
													size="sm"
													onClick={() => handleConflictResolution(conflict.id, 'local')}
													disabled={isResolving}
												>
													Use Local
												</Button>
												<Button
													size="sm"
													onClick={() => handleConflictResolution(conflict.id, 'remote')}
													disabled={isResolving}
												>
													Use Remote
												</Button>
												<Button
													size="sm"
													variant="outline"
													onClick={() => handleConflictResolution(conflict.id, 'merge')}
													disabled={isResolving}
												>
													Merge
												</Button>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</TabsContent>

				<TabsContent value="metrics" className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<Card>
							<CardHeader>
								<CardTitle>Performance Metrics</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<span>Total Events</span>
										<span className="font-semibold">{metrics.totalEvents}</span>
									</div>
									<div className="flex items-center justify-between">
										<span>Average Latency</span>
										<span className={`font-semibold ${getLatencyColor(metrics.avgLatency)}`}>
											{metrics.avgLatency.toFixed(0)}ms
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span>Conflict Rate</span>
										<span className="font-semibold">{(metrics.conflictRate * 100).toFixed(1)}%</span>
									</div>
									<div className="flex items-center justify-between">
										<span>Bandwidth Usage</span>
										<span className="font-semibold">{metrics.bandwidth} KB/s</span>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>System Health</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<span>Connection Quality</span>
										<Badge variant={syncStatus.connectionQuality === 'excellent' ? 'default' : 'secondary'}>
											{syncStatus.connectionQuality}
										</Badge>
									</div>
									<div className="flex items-center justify-between">
										<span>Sync Status</span>
										<Badge variant={syncStatus.syncStatus === 'idle' ? 'default' : 'secondary'}>
											{syncStatus.syncStatus}
										</Badge>
									</div>
									<div className="flex items-center justify-between">
										<span>Error Count</span>
										<span className="font-semibold">{metrics.errors}</span>
									</div>
									<div className="flex items-center justify-between">
										<span>Last Sync</span>
										<span className="font-semibold">{formatTime(metrics.lastSync)}</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>
			</Tabs>

			{/* Alerts */}
			{globalSync.performanceMetrics.avgLatency > 200 && (
				<Alert>
					<AlertTriangle className="h-4 w-4" />
					<AlertDescription>
						High sync latency detected ({globalSync.performanceMetrics.avgLatency.toFixed(0)}ms). 
						Check your network connection.
					</AlertDescription>
				</Alert>
			)}

			{!globalSync.isFullySynced && (
				<Alert>
					<AlertTriangle className="h-4 w-4" />
					<AlertDescription>
						Some subscriptions are not active. Real-time updates may be delayed.
					</AlertDescription>
				</Alert>
			)}
		</div>
	);
}