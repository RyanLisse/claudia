// Agent Types and Enums for TDD Implementation
// This file defines the core types and enums used by the BaseAgent class
// Compatible with the existing agent system

export enum AgentCapability {
	CODE_ANALYSIS = "code_analysis",
	CODE_GENERATION = "code_generation",
	TESTING = "testing",
	DOCUMENTATION = "documentation",
	SECURITY_AUDIT = "security_audit",
	PERFORMANCE_OPTIMIZATION = "performance_optimization",
	DATABASE_OPERATIONS = "database_operations",
	API_INTEGRATION = "api_integration",
	UI_UX_DESIGN = "ui_ux_design",
	DEPLOYMENT = "deployment",
	// Additional capabilities for TDD tests
	ANALYSIS = "analysis",
	RESEARCH = "research",
	COORDINATION = "coordination",
	REVIEW = "review",
	OPTIMIZATION = "optimization",
	DEBUGGING = "debugging",
	ARCHITECTURE = "architecture",
	MACHINE_LEARNING = "machine-learning",
	DATA_PROCESSING = "data-processing",
	QUANTUM_COMPUTING = "quantum-computing",
	TYPE_SAFETY_ENHANCEMENT = "type-safety-enhancement",
}

export enum Priority {
	LOW = 1,
	NORMAL = 2,
	HIGH = 3,
	CRITICAL = 4,
}

export type AgentType =
	| "coder"
	| "researcher"
	| "analyst"
	| "coordinator"
	| "tester"
	| "reviewer"
	| "architect"
	| "optimizer"
	| "debugger";

export type AgentStatus = "idle" | "busy" | "error" | "offline";

export interface Task {
	id: string;
	type: string;
	description: string;
	priority: Priority;
	requiredCapabilities: AgentCapability[];
	context?: Record<string, unknown>;
	requiresCoordination?: boolean;
	collaborators?: string[];
}

export interface TaskResult {
	success: boolean;
	result?: string;
	error?: string;
	artifacts?: string[];
	metrics?: {
		executionTime: number;
		linesOfCode?: number;
		testCoverage?: number;
		[key: string]: unknown;
	};
	attemptCount?: number;
}

export interface AgentConfig {
	id: string;
	name: string;
	type: AgentType;
	capabilities: AgentCapability[];
	maxConcurrentTasks?: number;
}

export interface AgentMetrics {
	totalTasksExecuted: number;
	averageExecutionTime: number;
	lastExecutionTime: number;
	successRate: number;
}

export interface Message {
	from: string;
	to?: string;
	type: string;
	content: string;
	taskContext?: Task;
	timestamp?: number;
}

export interface CollaborationPlan {
	myRole: string;
	dependencies: string[];
}

export interface CoordinationResult {
	success: boolean;
	collaborationPlan: CollaborationPlan;
}

export interface Feedback {
	taskId: string;
	rating: number;
	comments: string;
	suggestions: string[];
}

export interface LearningResult {
	learningApplied: boolean;
	adaptationsMade: number;
}

export interface PerformanceData {
	successRate: number;
	averageQuality: number;
	commonIssues: string[];
	strongPoints: string[];
}

export interface CapabilityAdaptation {
	capabilitiesUpdated: boolean;
	newCapabilities: AgentCapability[];
	improvedCapabilities: AgentCapability[];
}

export interface AgentState {
	id: string;
	status: AgentStatus;
	metrics: AgentMetrics;
	lastStateUpdate: number;
}

export interface HealthStatus {
	status: "healthy" | "degraded" | "unhealthy";
	memoryUsage: number;
	taskQueueSize: number;
	lastActivityTime: number;
}

export interface ResourceCleanupResult {
	cleaned: boolean;
	resourcesFreed?: number;
	cleanupTime?: number;
}

export interface MessageResult {
	success: boolean;
	messageId: string;
	deliveryTime?: number;
}

export interface MessageResponse {
	acknowledged: boolean;
	response: string;
	processedAt?: number;
}

// Type guards for runtime type checking
export function isValidTask(obj: unknown): obj is Task {
	return (
		typeof obj === "object" &&
		obj !== null &&
		"id" in obj &&
		"type" in obj &&
		"description" in obj &&
		"priority" in obj &&
		"requiredCapabilities" in obj &&
		typeof (obj as Task).id === "string" &&
		typeof (obj as Task).type === "string" &&
		typeof (obj as Task).description === "string" &&
		Object.values(Priority).includes((obj as Task).priority) &&
		Array.isArray((obj as Task).requiredCapabilities) &&
		(obj as Task).requiredCapabilities.every((cap) =>
			Object.values(AgentCapability).includes(cap),
		)
	);
}

export function isValidAgentConfig(obj: unknown): obj is AgentConfig {
	return (
		typeof obj === "object" &&
		obj !== null &&
		"id" in obj &&
		"name" in obj &&
		"type" in obj &&
		"capabilities" in obj &&
		typeof (obj as AgentConfig).id === "string" &&
		typeof (obj as AgentConfig).name === "string" &&
		typeof (obj as AgentConfig).type === "string" &&
		Array.isArray((obj as AgentConfig).capabilities) &&
		(obj as AgentConfig).capabilities.every((cap) =>
			Object.values(AgentCapability).includes(cap),
		)
	);
}

// Helper functions for working with capabilities
export function hasCapability(
	agentCapabilities: AgentCapability[],
	requiredCapability: AgentCapability,
): boolean {
	return agentCapabilities.includes(requiredCapability);
}

export function hasAllCapabilities(
	agentCapabilities: AgentCapability[],
	requiredCapabilities: AgentCapability[],
): boolean {
	return requiredCapabilities.every((cap) => agentCapabilities.includes(cap));
}

export function capabilityToString(capability: AgentCapability): string {
	return capability.toString();
}

export function stringToCapability(str: string): AgentCapability | null {
	const capability = Object.values(AgentCapability).find((cap) => cap === str);
	return capability || null;
}

// Priority utility functions
export function priorityToNumber(priority: Priority): number {
	switch (priority) {
		case Priority.LOW:
			return 1;
		case Priority.MEDIUM:
			return 2;
		case Priority.HIGH:
			return 3;
		case Priority.CRITICAL:
			return 4;
		default:
			return 0;
	}
}

export function comparePriorities(a: Priority, b: Priority): number {
	return priorityToNumber(b) - priorityToNumber(a); // Higher priority first
}

// Default configurations
export const DEFAULT_AGENT_CONFIG: Partial<AgentConfig> = {
	maxConcurrentTasks: 1,
};

export const DEFAULT_AGENT_METRICS: AgentMetrics = {
	totalTasksExecuted: 0,
	averageExecutionTime: 0,
	lastExecutionTime: 0,
	successRate: 1.0,
};

// Common capability sets for different agent types
export const CODER_CAPABILITIES: AgentCapability[] = [
	AgentCapability.CODE_GENERATION,
	AgentCapability.TESTING,
	AgentCapability.DEBUGGING,
	AgentCapability.OPTIMIZATION,
];

export const RESEARCHER_CAPABILITIES: AgentCapability[] = [
	AgentCapability.RESEARCH,
	AgentCapability.ANALYSIS,
	AgentCapability.DOCUMENTATION,
];

export const ANALYST_CAPABILITIES: AgentCapability[] = [
	AgentCapability.ANALYSIS,
	AgentCapability.DATA_PROCESSING,
	AgentCapability.RESEARCH,
	AgentCapability.OPTIMIZATION,
];

export const COORDINATOR_CAPABILITIES: AgentCapability[] = [
	AgentCapability.COORDINATION,
	AgentCapability.REVIEW,
	AgentCapability.ANALYSIS,
];

export const TESTER_CAPABILITIES: AgentCapability[] = [
	AgentCapability.TESTING,
	AgentCapability.DEBUGGING,
	AgentCapability.ANALYSIS,
];

export const REVIEWER_CAPABILITIES: AgentCapability[] = [
	AgentCapability.REVIEW,
	AgentCapability.ANALYSIS,
	AgentCapability.DOCUMENTATION,
];

export const ARCHITECT_CAPABILITIES: AgentCapability[] = [
	AgentCapability.ARCHITECTURE,
	AgentCapability.ANALYSIS,
	AgentCapability.COORDINATION,
	AgentCapability.DOCUMENTATION,
];
