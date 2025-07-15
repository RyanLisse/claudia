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
