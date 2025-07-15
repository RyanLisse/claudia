import type React from "react";
import type { AgentMetrics, SwarmMetrics } from "@/types/agent-dashboard";

interface AgentDashboardProps {
	agents: AgentMetrics[];
	swarmMetrics: SwarmMetrics;
	onAgentAction?: (
		agentId: string,
		action: "start" | "pause" | "stop" | "configure",
	) => void;
	className?: string;
}

/**
 * Mock AgentDashboard component for testing
 */
export const AgentDashboard: React.FC<AgentDashboardProps> = ({
	agents,
	swarmMetrics,
	onAgentAction,
	className,
}) => {
	const formatUptime = (seconds: number): string => {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		if (hours > 0) return `${hours}h ${minutes}m`;
		return `${minutes}m`;
	};

	const getStatusIcon = (status: AgentMetrics["status"]) => {
		switch (status) {
			case "active":
				return <div data-testid="check-circle-icon">CheckCircle</div>;
			case "busy":
				return <div data-testid="activity-icon">Activity</div>;
			case "idle":
				return <div data-testid="pause-icon">Pause</div>;
			case "error":
				return <div data-testid="alert-circle-icon">AlertCircle</div>;
			case "offline":
				return <div data-testid="stop-icon">Stop</div>;
		}
	};

	const getTypeIcon = (type: AgentMetrics["type"]) => {
		switch (type) {
			case "coder":
				return <div data-testid="cpu-icon">Cpu</div>;
			case "researcher":
				return <div data-testid="brain-icon">Brain</div>;
			case "analyst":
				return <div data-testid="trending-up-icon">TrendingUp</div>;
			case "coordinator":
				return <div data-testid="network-icon">Network</div>;
			default:
				return <div data-testid="bot-icon">Bot</div>;
		}
	};

	return (
		<div className={className}>
			{/* Swarm Overview */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
				<div>
					<div className="flex items-center justify-between">
						<div>
							<p className="text-muted-foreground text-sm">Total Agents</p>
							<p className="font-bold text-2xl">{swarmMetrics.totalAgents}</p>
						</div>
						<div data-testid="bot-icon">Bot</div>
					</div>
				</div>

				<div>
					<div className="flex items-center justify-between">
						<div>
							<p className="text-muted-foreground text-sm">Active Agents</p>
							<p className="font-bold text-2xl text-green-600">
								{swarmMetrics.activeAgents}
							</p>
						</div>
						<div data-testid="activity-icon">Activity</div>
					</div>
				</div>

				<div>
					<div className="flex items-center justify-between">
						<div>
							<p className="text-muted-foreground text-sm">Tasks Completed</p>
							<p className="font-bold text-2xl">
								{swarmMetrics.completedTasks}
							</p>
						</div>
						<div data-testid="check-circle-icon">CheckCircle</div>
					</div>
				</div>

				<div>
					<div className="flex items-center justify-between">
						<div>
							<p className="text-muted-foreground text-sm">Efficiency</p>
							<p className="font-bold text-2xl">
								{swarmMetrics.coordinationEfficiency}%
							</p>
						</div>
						<div data-testid="zap-icon">Zap</div>
					</div>
				</div>
			</div>

			{/* Agent Grid */}
			<div className="space-y-4">
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{agents.map((agent) => (
						<div key={agent.id} className="cursor-pointer">
							<div className="pb-3">
								<div className="flex items-start justify-between">
									<div className="flex items-center gap-2">
										{getTypeIcon(agent.type)}
										<div>
											<div className="text-base">{agent.name}</div>
											<p className="text-muted-foreground text-sm capitalize">
												{agent.type}
											</p>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<div />
										{getStatusIcon(agent.status)}
									</div>
								</div>
							</div>

							<div className="space-y-4">
								{/* Current Task */}
								{agent.currentTask && (
									<div>
										<p className="mb-1 text-muted-foreground text-xs">
											Current Task
										</p>
										<p className="truncate text-sm">{agent.currentTask}</p>
									</div>
								)}

								{/* Performance Metrics */}
								<div className="space-y-2">
									<div className="flex justify-between text-xs">
										<span>CPU</span>
										<span>{agent.performance.cpuUsage}%</span>
									</div>
									<div
										data-testid="progress"
										data-value={agent.performance.cpuUsage}
									>
										Progress: {agent.performance.cpuUsage}%
									</div>

									<div className="flex justify-between text-xs">
										<span>Memory</span>
										<span>{agent.performance.memoryUsage}%</span>
									</div>
									<div
										data-testid="progress"
										data-value={agent.performance.memoryUsage}
									>
										Progress: {agent.performance.memoryUsage}%
									</div>
								</div>

								{/* Stats */}
								<div className="grid grid-cols-2 gap-2 text-xs">
									<div>
										<p className="text-muted-foreground">Tasks</p>
										<p className="font-medium">
											{agent.performance.tasksCompleted}
										</p>
									</div>
									<div>
										<p className="text-muted-foreground">Success Rate</p>
										<p className="font-medium">
											{agent.performance.successRate}%
										</p>
									</div>
									<div>
										<p className="text-muted-foreground">Uptime</p>
										<p className="font-medium">{formatUptime(agent.uptime)}</p>
									</div>
									<div>
										<p className="text-muted-foreground">Last Active</p>
										<p className="font-medium">
											{/* Mock last activity formatting */}
											{agent.lastActivity.toISOString().includes("10:00")
												? "Just now"
												: "30m ago"}
										</p>
									</div>
								</div>

								{/* Capabilities */}
								<div>
									<p className="mb-2 text-muted-foreground text-xs">
										Capabilities
									</p>
									<div className="flex flex-wrap gap-1">
										{agent.capabilities.slice(0, 3).map((capability) => (
											<span key={capability} className="text-xs">
												{capability}
											</span>
										))}
										{agent.capabilities.length > 3 && (
											<span className="text-xs">
												+{agent.capabilities.length - 3}
											</span>
										)}
									</div>
								</div>

								{/* Action Buttons */}
								<div className="flex gap-2">
									<button
										onClick={(e) => {
											e.stopPropagation();
											onAgentAction?.(
												agent.id,
												agent.status === "active" ? "pause" : "start",
											);
										}}
										className="flex-1"
									>
										{agent.status === "active" ? (
											<>
												<div data-testid="pause-icon">Pause</div>
												Pause
											</>
										) : (
											<>
												<div data-testid="play-icon">Play</div>
												Start
											</>
										)}
									</button>
									<button
										onClick={(e) => {
											e.stopPropagation();
											onAgentAction?.(agent.id, "configure");
										}}
									>
										<div data-testid="settings-icon">Settings</div>
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};
