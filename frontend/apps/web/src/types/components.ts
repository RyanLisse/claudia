// Comprehensive TypeScript types for frontend components
// Centralized type definitions for better maintainability

export interface User {
	id: string;
	name: string;
	email: string;
	avatar?: string;
	role: "admin" | "user" | "agent";
	lastActive: Date;
	preferences: UserPreferences;
}

export interface UserPreferences {
	theme: "light" | "dark" | "system";
	language: string;
	notifications: boolean;
	autoSave: boolean;
	defaultModel: string;
}

export interface Project {
	id: string;
	name: string;
	path: string;
	description?: string;
	sessions: Session[];
	created_at: number;
	updated_at: number;
	tags: string[];
	settings: ProjectSettings;
}

export interface ProjectSettings {
	model: string;
	temperature: number;
	maxTokens: number;
	hooks: HooksConfiguration;
	collaborators: string[];
}

export interface Session {
	id: string;
	project_id: string;
	project_path: string;
	name?: string;
	messages: ChatMessage[];
	todo_data?: TodoData;
	created_at: number;
	updated_at: number;
	first_message?: string;
	message_timestamp?: string;
	metadata: SessionMetadata;
}

export interface SessionMetadata {
	model: string;
	totalTokens: number;
	totalCost: number;
	messageCount: number;
	duration: number;
	status: "active" | "completed" | "archived";
}

export interface ChatMessage {
	id: string;
	role: "user" | "assistant" | "system";
	content: string;
	timestamp: Date;
	attachments?: Attachment[];
	metadata?: MessageMetadata;
	reactions?: Reaction[];
}

export interface MessageMetadata {
	model?: string;
	tokens?: number;
	processing_time?: number;
	temperature?: number;
	cost?: number;
	confidence?: number;
}

export interface Attachment {
	id: string;
	name: string;
	type: string;
	size: number;
	url?: string;
	thumbnail?: string;
	metadata?: Record<string, any>;
}

export interface Reaction {
	id: string;
	emoji: string;
	userId: string;
	timestamp: Date;
}

export interface TodoData {
	id: string;
	title: string;
	items: TodoItem[];
	created_at: Date;
	updated_at: Date;
	status: "active" | "completed" | "archived";
}

export interface TodoItem {
	id: string;
	content: string;
	completed: boolean;
	priority: "low" | "medium" | "high" | "critical";
	assignee?: string;
	due_date?: Date;
	tags: string[];
	subtasks: TodoSubtask[];
}

export interface TodoSubtask {
	id: string;
	content: string;
	completed: boolean;
}

export interface Agent {
	id: string;
	name: string;
	type: AgentType;
	status: AgentStatus;
	capabilities: string[];
	currentTask?: AgentTask;
	performance: AgentPerformance;
	configuration: AgentConfiguration;
	lastActivity: Date;
	uptime: number;
	version: string;
}

export type AgentType =
	| "coder"
	| "researcher"
	| "analyst"
	| "coordinator"
	| "tester"
	| "reviewer"
	| "optimizer"
	| "monitor"
	| "specialist";

export type AgentStatus =
	| "active"
	| "idle"
	| "busy"
	| "error"
	| "offline"
	| "paused"
	| "initializing"
	| "terminating";

export interface AgentTask {
	id: string;
	type: string;
	description: string;
	priority: number;
	progress: number;
	startTime: Date;
	estimatedDuration?: number;
	dependencies: string[];
	metadata: Record<string, any>;
}

export interface AgentPerformance {
	tasksCompleted: number;
	successRate: number;
	avgResponseTime: number;
	cpuUsage: number;
	memoryUsage: number;
	throughput: number;
	errorRate: number;
	uptime: number;
}

export interface AgentConfiguration {
	model: string;
	temperature: number;
	maxTokens: number;
	systemPrompt: string;
	tools: string[];
	rateLimits: RateLimits;
	security: SecuritySettings;
}

export interface RateLimits {
	requestsPerMinute: number;
	tokensPerMinute: number;
	concurrentTasks: number;
}

export interface SecuritySettings {
	allowFileAccess: boolean;
	allowNetworkAccess: boolean;
	sandboxed: boolean;
	trustedDomains: string[];
}

export interface SwarmMetrics {
	totalAgents: number;
	activeAgents: number;
	idleAgents: number;
	busyAgents: number;
	errorAgents: number;
	totalTasks: number;
	completedTasks: number;
	pendingTasks: number;
	avgPerformance: number;
	networkLatency: number;
	coordinationEfficiency: number;
	resourceUtilization: ResourceUtilization;
}

export interface ResourceUtilization {
	cpu: number;
	memory: number;
	network: number;
	storage: number;
}

export interface ProcessInfo {
	run_id: number;
	process_type: ProcessType;
	pid: number;
	started_at: string;
	project_path: string;
	task: string;
	model: string;
	status: "running" | "completed" | "failed" | "killed";
	resource_usage: ResourceUsage;
}

export interface ResourceUsage {
	cpu_percent: number;
	memory_mb: number;
	disk_io_mb: number;
	network_io_mb: number;
}

export type ProcessType =
	| { AgentRun: { agent_id: number; agent_name: string } }
	| { ClaudeSession: { session_id: string } }
	| { SwarmCoordination: { swarm_id: string } };

export interface ClaudeVersionStatus {
	is_installed: boolean;
	version?: string;
	output: string;
	path?: string;
	last_checked: Date;
}

export interface ClaudeMdFile {
	relative_path: string;
	absolute_path: string;
	size: number;
	modified: number;
	content?: string;
	encoding: string;
}

export interface FileEntry {
	name: string;
	path: string;
	is_directory: boolean;
	size: number;
	extension?: string;
	modified: number;
	permissions: string;
}

export interface HooksConfiguration {
	preTask: Hook[];
	postTask: Hook[];
	preEdit: Hook[];
	postEdit: Hook[];
	onError: Hook[];
	onComplete: Hook[];
}

export interface Hook {
	id: string;
	name: string;
	command: string;
	args: string[];
	enabled: boolean;
	timeout: number;
	retries: number;
	condition?: string;
}

export interface UsageMetrics {
	totalTokens: number;
	inputTokens: number;
	outputTokens: number;
	totalCost: number;
	sessionsCount: number;
	avgTokensPerSession: number;
	lastUsed?: Date;
	periodStart: Date;
	periodEnd: Date;
	breakdown: UsageBreakdown;
}

export interface UsageBreakdown {
	byModel: Record<string, ModelUsage>;
	byProject: Record<string, ProjectUsage>;
	byDay: DailyUsage[];
}

export interface ModelUsage {
	tokens: number;
	cost: number;
	requests: number;
}

export interface ProjectUsage {
	tokens: number;
	cost: number;
	sessions: number;
}

export interface DailyUsage {
	date: string;
	tokens: number;
	cost: number;
	sessions: number;
}

export interface ApiResponse<T = any> {
	success: boolean;
	data?: T;
	error?: string;
	metadata?: ResponseMetadata;
}

export interface ResponseMetadata {
	timestamp: Date;
	version: string;
	requestId: string;
	duration: number;
}

export interface PaginationParams {
	page: number;
	limit: number;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
	filters?: Record<string, any>;
}

export interface PaginatedResponse<T> {
	items: T[];
	total: number;
	page: number;
	limit: number;
	pages: number;
	hasNext: boolean;
	hasPrev: boolean;
}

// Component Props Types
export interface BaseComponentProps {
	className?: string;
	children?: React.ReactNode;
	id?: string;
	testId?: string;
}

export interface LoadingProps {
	loading?: boolean;
	loadingText?: string;
	skeleton?: boolean;
}

export interface ErrorProps {
	error?: string | Error;
	onRetry?: () => void;
	showDetails?: boolean;
}

export interface ActionProps {
	onAction?: (action: string, data?: any) => void;
	disabled?: boolean;
	permissions?: string[];
}

// UI State Types
export interface UIState {
	theme: "light" | "dark" | "system";
	sidebar: {
		collapsed: boolean;
		width: number;
	};
	modals: {
		[key: string]: boolean;
	};
	notifications: Notification[];
	loading: {
		[key: string]: boolean;
	};
}

export interface Notification {
	id: string;
	type: "info" | "success" | "warning" | "error";
	title: string;
	message: string;
	timestamp: Date;
	duration?: number;
	actions?: NotificationAction[];
}

export interface NotificationAction {
	label: string;
	action: () => void;
	style?: "primary" | "secondary" | "destructive";
}

// Form Types
export interface FormField {
	name: string;
	label: string;
	type:
		| "text"
		| "email"
		| "password"
		| "number"
		| "select"
		| "textarea"
		| "checkbox"
		| "radio";
	required?: boolean;
	placeholder?: string;
	options?: FormOption[];
	validation?: ValidationRule[];
}

export interface FormOption {
	value: string;
	label: string;
	disabled?: boolean;
}

export interface ValidationRule {
	type: "required" | "email" | "min" | "max" | "pattern";
	value?: any;
	message: string;
}

// Search and Filter Types
export interface SearchConfig {
	placeholder: string;
	fields: string[];
	fuzzy?: boolean;
	caseSensitive?: boolean;
	minLength?: number;
}

export interface FilterConfig {
	field: string;
	type: "text" | "select" | "date" | "range" | "boolean";
	label: string;
	options?: FilterOption[];
}

export interface FilterOption {
	value: any;
	label: string;
	count?: number;
}

// Connection and Sync Types
export interface ConnectionStatus {
	connected: boolean;
	lastSeen?: Date;
	latency?: number;
	quality: "excellent" | "good" | "fair" | "poor" | "offline";
	retryCount: number;
}

export interface SyncStatus {
	syncing: boolean;
	lastSync?: Date;
	pendingChanges: number;
	conflicts: SyncConflict[];
}

export interface SyncConflict {
	id: string;
	type: "content" | "metadata" | "structure";
	path: string;
	localValue: any;
	remoteValue: any;
	timestamp: Date;
}
