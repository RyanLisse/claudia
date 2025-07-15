// Common store types
export interface StoreSlice<_T> {
	reset: () => void;
}

// UI State Types
export interface UIState {
	theme: "light" | "dark" | "system";
	sidebarOpen: boolean;
	modals: {
		settings: boolean;
		profile: boolean;
		help: boolean;
	};
	notifications: Notification[];
	loading: Record<string, boolean>;
}

export interface Notification {
	id: string;
	type: "info" | "success" | "warning" | "error";
	title: string;
	message?: string;
	duration?: number;
	actions?: NotificationAction[];
}

export interface NotificationAction {
	label: string;
	action: () => void;
	variant?: "default" | "destructive";
}

// Auth State Types
export interface AuthState {
	user: User | null;
	session: Session | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	permissions: string[];
}

export interface User {
	id: string;
	email: string;
	name: string;
	avatar?: string;
	role: "admin" | "user" | "guest";
	preferences: UserPreferences;
}

export interface Session {
	id: string;
	userId: string;
	expiresAt: Date;
	refreshToken: string;
}

export interface UserPreferences {
	theme: "light" | "dark" | "system";
	language: string;
	notifications: boolean;
	emailUpdates: boolean;
}

// App State Types
export interface AppState {
	currentProject: Project | null;
	projects: Project[];
	agents: Agent[];
	sessions: AgentSession[];
	activeSession: string | null;
	workspaceSettings: WorkspaceSettings;
}

export interface Project {
	id: string;
	name: string;
	description?: string;
	path: string;
	type: "web" | "mobile" | "api" | "desktop";
	status: "active" | "archived" | "draft";
	createdAt: Date;
	updatedAt: Date;
	settings: ProjectSettings;
}

export interface Agent {
	id: string;
	name: string;
	type: "coordinator" | "researcher" | "coder" | "analyst" | "tester";
	status: "active" | "idle" | "busy" | "error";
	capabilities: string[];
	performance: AgentPerformance;
}

export interface AgentSession {
	id: string;
	agentId: string;
	projectId: string;
	status: "running" | "completed" | "failed" | "cancelled";
	startedAt: Date;
	completedAt?: Date;
	logs: SessionLog[];
	metrics: SessionMetrics;
}

export interface AgentPerformance {
	tasksCompleted: number;
	averageTime: number;
	successRate: number;
	lastActive: Date;
}

export interface SessionLog {
	id: string;
	timestamp: Date;
	level: "info" | "warn" | "error" | "debug";
	message: string;
	data?: any;
}

export interface SessionMetrics {
	duration: number;
	tasksCompleted: number;
	linesOfCode: number;
	filesModified: number;
	testsPassed: number;
	testsFailed: number;
}

export interface WorkspaceSettings {
	autoSave: boolean;
	autoFormat: boolean;
	gitIntegration: boolean;
	aiAssistance: boolean;
	collaborationMode: boolean;
}

export interface ProjectSettings {
	framework: string;
	language: string;
	buildTool: string;
	testFramework: string;
	linting: boolean;
	formatting: boolean;
	environmentVariables: Record<string, string>;
}

// Sync State Types
export interface SyncState {
	isOnline: boolean;
	lastSync: Date | null;
	syncStatus: "idle" | "syncing" | "error" | "conflict";
	pendingChanges: number;
	conflicts: SyncConflict[];
	electricClient: any; // ElectricSQL client instance
}

export interface SyncConflict {
	id: string;
	table: string;
	recordId: string;
	localValue: any;
	remoteValue: any;
	timestamp: Date;
	resolved: boolean;
}

// Optimistic Update Types
export interface OptimisticUpdate {
	id: string;
	type: "create" | "update" | "delete";
	table: string;
	recordId: string;
	data: any;
	timestamp: Date;
	status: "pending" | "confirmed" | "failed";
}

// Store Actions Types
export interface UIActions {
	setTheme: (theme: UIState["theme"]) => void;
	toggleSidebar: () => void;
	openModal: (modal: keyof UIState["modals"]) => void;
	closeModal: (modal: keyof UIState["modals"]) => void;
	addNotification: (notification: Omit<Notification, "id">) => void;
	removeNotification: (id: string) => void;
	setLoading: (key: string, loading: boolean) => void;
}

export interface AuthActions {
	login: (credentials: LoginCredentials) => Promise<void>;
	logout: () => Promise<void>;
	refreshSession: () => Promise<void>;
	updateUser: (updates: Partial<User>) => Promise<void>;
	updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
}

export interface LoginCredentials {
	email: string;
	password: string;
	rememberMe?: boolean;
}

export interface AppActions {
	setCurrentProject: (project: Project | null) => void;
	addProject: (
		project: Omit<Project, "id" | "createdAt" | "updatedAt">,
	) => Promise<void>;
	updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
	deleteProject: (id: string) => Promise<void>;
	addAgent: (agent: Omit<Agent, "id">) => void;
	updateAgent: (id: string, updates: Partial<Agent>) => void;
	removeAgent: (id: string) => void;
	startSession: (agentId: string, projectId: string) => Promise<string>;
	stopSession: (sessionId: string) => Promise<void>;
	setActiveSession: (sessionId: string | null) => void;
	updateWorkspaceSettings: (settings: Partial<WorkspaceSettings>) => void;
}

export interface SyncActions {
	initializeSync: () => Promise<void>;
	sync: () => Promise<void>;
	resolveConflict: (
		conflictId: string,
		resolution: "local" | "remote" | "merge",
	) => Promise<void>;
	addOptimisticUpdate: (
		update: Omit<OptimisticUpdate, "id" | "timestamp" | "status">,
	) => void;
	confirmOptimisticUpdate: (id: string) => void;
	revertOptimisticUpdate: (id: string) => void;
	setOnlineStatus: (isOnline: boolean) => void;
}
