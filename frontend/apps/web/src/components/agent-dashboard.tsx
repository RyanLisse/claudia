"use client";

import { motion } from "framer-motion";
import {
	Activity,
	AlertCircle,
	Bot,
	Brain,
	CheckCircle,
	Cpu,
	Network,
	Pause,
	Play,
	Settings,
	Stop,
	TrendingUp,
	Zap,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export interface AgentMetrics {
	id: string;
	name: string;
	type:
		| "coder"
		| "researcher"
		| "analyst"
		| "coordinator"
		| "tester"
		| "reviewer";
	status: "active" | "idle" | "busy" | "error" | "offline";
	currentTask?: string;
	performance: {
		tasksCompleted: number;
		successRate: number;
		avgResponseTime: number;
		cpuUsage: number;
		memoryUsage: number;
	};
	capabilities: string[];
	lastActivity: Date;
	uptime: number;
	connectionQuality: "excellent" | "good" | "fair" | "poor";
}

export interface SwarmMetrics {
	totalAgents: number;
	activeAgents: number;
	totalTasks: number;
	completedTasks: number;
	avgPerformance: number;
	networkLatency: number;
	coordinationEfficiency: number;
}

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
 * Comprehensive agent dashboard with real-time monitoring
 *
 * @example
 * <AgentDashboard
 *   agents={agentList}
 *   swarmMetrics={swarmData}
 *   onAgentAction={(id, action) => handleAgentAction(id, action)}
 * />
 */
export const AgentDashboard: React.FC<AgentDashboardProps> = ({
	agents,
	swarmMetrics,
	onAgentAction,
	className,
}) => {
	const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

	const getStatusIcon = (status: AgentMetrics["status"]) => {
		switch (status) {
			case "active":
				return <CheckCircle className="h-4 w-4 text-green-500" />;
			case "busy":
				return <Activity className="h-4 w-4 animate-pulse text-blue-500" />;
			case "idle":
				return <Pause className="h-4 w-4 text-yellow-500" />;
			case "error":
				return <AlertCircle className="h-4 w-4 text-red-500" />;
			case "offline":
				return <Stop className="h-4 w-4 text-gray-500" />;
		}
	};

	const getStatusColor = (status: AgentMetrics["status"]) => {
		switch (status) {
			case "active":
				return "bg-green-500";
			case "busy":
				return "bg-blue-500";
			case "idle":
				return "bg-yellow-500";
			case "error":
				return "bg-red-500";
			case "offline":
				return "bg-gray-500";
		}
	};

	const getTypeIcon = (type: AgentMetrics["type"]) => {
		switch (type) {
			case "coder":
				return <Cpu className="h-4 w-4" />;
			case "researcher":
				return <Brain className="h-4 w-4" />;
			case "analyst":
				return <TrendingUp className="h-4 w-4" />;
			case "coordinator":
				return <Network className="h-4 w-4" />;
			default:
				return <Bot className="h-4 w-4" />;
		}
	};

	const formatUptime = (seconds: number): string => {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		if (hours > 0) return `${hours}h ${minutes}m`;
		return `${minutes}m`;
	};

	const formatLastActivity = (date: Date): string => {
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (days > 0) return `${days}d ago`;
		if (hours > 0) return `${hours}h ago`;
		if (minutes > 0) return `${minutes}m ago`;
		return "Just now";
	};

	return (
		<div className={cn("space-y-6", className)}>
			{/* Swarm Overview */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-muted-foreground text-sm">Total Agents</p>
								<p className="font-bold text-2xl">{swarmMetrics.totalAgents}</p>
							</div>
							<Bot className="h-8 w-8 text-primary" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-muted-foreground text-sm">Active Agents</p>
								<p className="font-bold text-2xl text-green-600">
									{swarmMetrics.activeAgents}
								</p>
							</div>
							<Activity className="h-8 w-8 text-green-600" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-muted-foreground text-sm">Tasks Completed</p>
								<p className="font-bold text-2xl">
									{swarmMetrics.completedTasks}
								</p>
							</div>
							<CheckCircle className="h-8 w-8 text-blue-600" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-muted-foreground text-sm">Efficiency</p>
								<p className="font-bold text-2xl">
									{swarmMetrics.coordinationEfficiency}%
								</p>
							</div>
							<Zap className="h-8 w-8 text-yellow-600" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Agent Grid */}
			<Tabs defaultValue="grid" className="space-y-4">
				<TabsList>
					<TabsTrigger value="grid">Agent Grid</TabsTrigger>
					<TabsTrigger value="performance">Performance</TabsTrigger>
					<TabsTrigger value="network">Network</TabsTrigger>
				</TabsList>

				<TabsContent value="grid" className="space-y-4">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						{agents.map((agent, index) => (
							<motion.div
								key={agent.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.1 }}
							>
								<Card
									className={cn(
										"cursor-pointer transition-all hover:shadow-lg",
										selectedAgent === agent.id && "ring-2 ring-primary",
									)}
									onClick={() => setSelectedAgent(agent.id)}
								>
									<CardHeader className="pb-3">
										<div className="flex items-start justify-between">
											<div className="flex items-center gap-2">
												{getTypeIcon(agent.type)}
												<div>
													<CardTitle className="text-base">
														{agent.name}
													</CardTitle>
													<p className="text-muted-foreground text-sm capitalize">
														{agent.type}
													</p>
												</div>
											</div>
											<div className="flex items-center gap-2">
												<div
													className={cn(
														"h-2 w-2 rounded-full",
														getStatusColor(agent.status),
													)}
												/>
												{getStatusIcon(agent.status)}
											</div>
										</div>
									</CardHeader>

									<CardContent className="space-y-4">
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
											<Progress
												value={agent.performance.cpuUsage}
												className="h-1"
											/>

											<div className="flex justify-between text-xs">
												<span>Memory</span>
												<span>{agent.performance.memoryUsage}%</span>
											</div>
											<Progress
												value={agent.performance.memoryUsage}
												className="h-1"
											/>
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
												<p className="font-medium">
													{formatUptime(agent.uptime)}
												</p>
											</div>
											<div>
												<p className="text-muted-foreground">Last Active</p>
												<p className="font-medium">
													{formatLastActivity(agent.lastActivity)}
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
													<Badge
														key={capability}
														variant="secondary"
														className="text-xs"
													>
														{capability}
													</Badge>
												))}
												{agent.capabilities.length > 3 && (
													<Badge variant="outline" className="text-xs">
														+{agent.capabilities.length - 3}
													</Badge>
												)}
											</div>
										</div>

										{/* Action Buttons */}
										<div className="flex gap-2">
											<Button
												variant="outline"
												size="sm"
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
														<Pause className="mr-1 h-3 w-3" />
														Pause
													</>
												) : (
													<>
														<Play className="mr-1 h-3 w-3" />
														Start
													</>
												)}
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={(e) => {
													e.stopPropagation();
													onAgentAction?.(agent.id, "configure");
												}}
											>
												<Settings className="h-3 w-3" />
											</Button>
										</div>
									</CardContent>
								</Card>
							</motion.div>
						))}
					</div>
				</TabsContent>

				<TabsContent value="performance" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Performance Metrics</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{agents.map((agent) => (
									<div
										key={agent.id}
										className="flex items-center justify-between rounded-lg border p-3"
									>
										<div className="flex items-center gap-3">
											{getTypeIcon(agent.type)}
											<div>
												<p className="font-medium">{agent.name}</p>
												<p className="text-muted-foreground text-sm">
													{agent.type}
												</p>
											</div>
										</div>
										<div className="flex items-center gap-4 text-sm">
											<div className="text-center">
												<p className="font-medium">
													{agent.performance.tasksCompleted}
												</p>
												<p className="text-muted-foreground">Tasks</p>
											</div>
											<div className="text-center">
												<p className="font-medium">
													{agent.performance.successRate}%
												</p>
												<p className="text-muted-foreground">Success</p>
											</div>
											<div className="text-center">
												<p className="font-medium">
													{agent.performance.avgResponseTime}ms
												</p>
												<p className="text-muted-foreground">Avg Response</p>
											</div>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="network" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Network Status</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div>
									<p className="mb-2 text-muted-foreground text-sm">
										Network Latency
									</p>
									<p className="font-bold text-2xl">
										{swarmMetrics.networkLatency}ms
									</p>
								</div>
								<div>
									<p className="mb-2 text-muted-foreground text-sm">
										Coordination Efficiency
									</p>
									<p className="font-bold text-2xl">
										{swarmMetrics.coordinationEfficiency}%
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
};
