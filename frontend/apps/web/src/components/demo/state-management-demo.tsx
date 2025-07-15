"use client";

import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
	useCreateProjectMutation,
	useUpdateProjectMutation,
} from "@/hooks/use-optimistic-mutations";
import { useGlobalSync } from "@/hooks/use-real-time-sync";
import { useAppStore, useAuthStore, useSyncStore, useUIStore } from "@/stores";

export function StateManagementDemo() {
	// Store hooks
	const {
		theme,
		sidebarOpen,
		notifications,
		loading,
		setTheme,
		toggleSidebar,
		addNotification,
		setLoading,
	} = useUIStore();

	const {
		currentProject,
		projects,
		agents,
		workspaceSettings,
		setCurrentProject,
		updateWorkspaceSettings,
	} = useAppStore();

	const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();

	const { isOnline, lastSync, syncStatus, pendingChanges, conflicts } =
		useSyncStore();

	// Mutation hooks
	const createProjectMutation = useCreateProjectMutation();
	const updateProjectMutation = useUpdateProjectMutation();

	// Real-time sync hook
	const { isFullySynced, subscriptions } = useGlobalSync();

	// Demo actions
	const handleCreateDemoProject = () => {
		createProjectMutation.mutate({
			name: `Demo Project ${Date.now()}`,
			description: "A demo project created with optimistic updates",
			type: "web",
			path: "/demo/path",
		});
	};

	const handleUpdateCurrentProject = () => {
		if (currentProject) {
			updateProjectMutation.mutate({
				id: currentProject.id,
				name: `${currentProject.name} (Updated)`,
				updatedAt: new Date(),
			});
		}
	};

	const handleAddNotification = () => {
		addNotification({
			type: "info",
			title: "Demo Notification",
			message: "This notification was added using Zustand!",
			duration: 3000,
		});
	};

	const handleToggleLoading = () => {
		const key = "demoLoading";
		const isLoading = loading[key];
		setLoading(key, !isLoading);

		if (!isLoading) {
			setTimeout(() => setLoading(key, false), 2000);
		}
	};

	const getSyncStatusColor = (status: string) => {
		switch (status) {
			case "idle":
				return "bg-green-500";
			case "syncing":
				return "bg-blue-500";
			case "error":
				return "bg-red-500";
			case "conflict":
				return "bg-yellow-500";
			default:
				return "bg-gray-500";
		}
	};

	return (
		<div className="space-y-6 p-6">
			<div className="text-center">
				<h1 className="font-bold text-3xl">Frontend State Management Demo</h1>
				<p className="mt-2 text-muted-foreground">
					TanStack Query + Zustand + ElectricSQL Integration
				</p>
			</div>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{/* UI Store Demo */}
				<Card>
					<CardHeader>
						<CardTitle>UI Store</CardTitle>
						<CardDescription>
							Theme, sidebar, notifications, loading states
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center justify-between">
							<span>Theme: {theme}</span>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
							>
								Toggle
							</Button>
						</div>

						<div className="flex items-center justify-between">
							<span>Sidebar: {sidebarOpen ? "Open" : "Closed"}</span>
							<Switch checked={sidebarOpen} onCheckedChange={toggleSidebar} />
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<span>Notifications ({notifications.length})</span>
								<Button size="sm" onClick={handleAddNotification}>
									Add
								</Button>
							</div>
							{notifications.slice(0, 2).map((notification) => (
								<Badge
									key={notification.id}
									variant="secondary"
									className="text-xs"
								>
									{notification.title}
								</Badge>
							))}
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<span>Loading States</span>
								<Button size="sm" onClick={handleToggleLoading}>
									Demo
								</Button>
							</div>
							{Object.entries(loading).map(([key, value]) => (
								<div key={key} className="flex items-center space-x-2">
									<Badge variant={value ? "default" : "secondary"}>
										{key}: {value ? "Loading..." : "Idle"}
									</Badge>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* App Store Demo */}
				<Card>
					<CardHeader>
						<CardTitle>App Store</CardTitle>
						<CardDescription>
							Projects, agents, workspace settings
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<span>Projects ({projects.length})</span>
								<Button
									size="sm"
									onClick={handleCreateDemoProject}
									disabled={createProjectMutation.isPending}
								>
									{createProjectMutation.isPending ? "Creating..." : "Create"}
								</Button>
							</div>

							{currentProject && (
								<div className="space-y-2">
									<Badge variant="outline">
										Current: {currentProject.name}
									</Badge>
									<Button
										size="sm"
										variant="secondary"
										onClick={handleUpdateCurrentProject}
										disabled={updateProjectMutation.isPending}
									>
										Update Current
									</Button>
								</div>
							)}
						</div>

						<div className="space-y-2">
							<span>Agents ({agents.length})</span>
							{agents.slice(0, 3).map((agent) => (
								<Badge key={agent.id} variant="secondary">
									{agent.name} ({agent.status})
								</Badge>
							))}
						</div>

						<div className="space-y-2">
							<span>Workspace Settings</span>
							<div className="grid grid-cols-2 gap-2 text-xs">
								<div className="flex items-center space-x-1">
									<Switch
										checked={workspaceSettings.autoSave}
										onCheckedChange={(checked) =>
											updateWorkspaceSettings({ autoSave: checked })
										}
										size="sm"
									/>
									<span>Auto-save</span>
								</div>
								<div className="flex items-center space-x-1">
									<Switch
										checked={workspaceSettings.gitIntegration}
										onCheckedChange={(checked) =>
											updateWorkspaceSettings({ gitIntegration: checked })
										}
										size="sm"
									/>
									<span>Git</span>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Auth Store Demo */}
				<Card>
					<CardHeader>
						<CardTitle>Auth Store</CardTitle>
						<CardDescription>User authentication and session</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<div className="flex items-center space-x-2">
								<Badge variant={isAuthenticated ? "default" : "secondary"}>
									{isAuthenticated ? "Authenticated" : "Not Authenticated"}
								</Badge>
								{authLoading && <Badge variant="outline">Loading...</Badge>}
							</div>

							{user && (
								<div className="space-y-1">
									<p className="font-medium text-sm">{user.name}</p>
									<p className="text-muted-foreground text-xs">{user.email}</p>
									<Badge variant="outline" className="text-xs">
										{user.role}
									</Badge>
								</div>
							)}
						</div>

						{user && (
							<div className="space-y-2">
								<span className="font-medium text-sm">Preferences</span>
								<div className="grid grid-cols-2 gap-1 text-xs">
									<span>Theme: {user.preferences.theme}</span>
									<span>Lang: {user.preferences.language}</span>
									<span>
										Notifications:{" "}
										{user.preferences.notifications ? "On" : "Off"}
									</span>
									<span>
										Email: {user.preferences.emailUpdates ? "On" : "Off"}
									</span>
								</div>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Sync Store Demo */}
				<Card>
					<CardHeader>
						<CardTitle>Sync Store</CardTitle>
						<CardDescription>Real-time sync and ElectricSQL</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<div className="flex items-center space-x-2">
								<div
									className={`h-3 w-3 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`}
								/>
								<span>{isOnline ? "Online" : "Offline"}</span>
							</div>

							<div className="flex items-center space-x-2">
								<div
									className={`h-3 w-3 rounded-full ${getSyncStatusColor(syncStatus)}`}
								/>
								<span>Sync: {syncStatus}</span>
							</div>

							{lastSync && (
								<p className="text-muted-foreground text-xs">
									Last sync: {lastSync.toLocaleTimeString()}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<div className="flex justify-between">
								<span>Pending Changes</span>
								<Badge variant="outline">{pendingChanges}</Badge>
							</div>

							{pendingChanges > 0 && (
								<Progress value={(pendingChanges / 10) * 100} className="h-2" />
							)}
						</div>

						{conflicts.length > 0 && (
							<div className="space-y-2">
								<span className="font-medium text-sm text-yellow-600">
									Conflicts ({conflicts.length})
								</span>
								{conflicts.slice(0, 2).map((conflict) => (
									<Badge
										key={conflict.id}
										variant="destructive"
										className="text-xs"
									>
										{conflict.table}
									</Badge>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Real-time Sync Demo */}
				<Card>
					<CardHeader>
						<CardTitle>Real-time Sync</CardTitle>
						<CardDescription>Live subscriptions and updates</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<div className="flex items-center space-x-2">
								<div
									className={`h-3 w-3 rounded-full ${isFullySynced ? "bg-green-500" : "bg-yellow-500"}`}
								/>
								<span>{isFullySynced ? "Fully Synced" : "Partial Sync"}</span>
							</div>
						</div>

						<div className="space-y-2">
							<span className="font-medium text-sm">Subscriptions</span>
							<div className="grid grid-cols-2 gap-1 text-xs">
								{Object.entries(subscriptions).map(([table, active]) => (
									<div key={table} className="flex items-center space-x-1">
										<div
											className={`h-2 w-2 rounded-full ${active ? "bg-green-500" : "bg-gray-300"}`}
										/>
										<span>{table}</span>
									</div>
								))}
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Query Integration Demo */}
				<Card>
					<CardHeader>
						<CardTitle>Query Integration</CardTitle>
						<CardDescription>
							TanStack Query with optimistic updates
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<span className="font-medium text-sm">Active Mutations</span>
							<div className="space-y-1">
								{createProjectMutation.isPending && (
									<Badge variant="default" className="text-xs">
										Creating project...
									</Badge>
								)}
								{updateProjectMutation.isPending && (
									<Badge variant="default" className="text-xs">
										Updating project...
									</Badge>
								)}
								{!createProjectMutation.isPending &&
									!updateProjectMutation.isPending && (
										<Badge variant="secondary" className="text-xs">
											No active mutations
										</Badge>
									)}
							</div>
						</div>

						<div className="space-y-2">
							<span className="font-medium text-sm">Query Cache</span>
							<div className="text-muted-foreground text-xs">
								Projects cached: {projects.length}
							</div>
						</div>

						<Button
							size="sm"
							variant="outline"
							onClick={() => {
								toast.info(
									"This demo showcases the integration of TanStack Query, Zustand, and ElectricSQL for optimal frontend state management!",
								);
							}}
						>
							About Integration
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
