// Web-compatible API stub for non-Tauri environments
// This file provides the same API interface but returns mock data

/** Process type for tracking in ProcessRegistry */
export type ProcessType =
	| { AgentRun: { agent_id: number; agent_name: string } }
	| { ClaudeSession: { session_id: string } };

/** Information about a running process */
export interface ProcessInfo {
	run_id: number;
	process_type: ProcessType;
	pid: number;
	started_at: string;
	project_path: string;
	task: string;
	model: string;
}

/**
 * Represents a project in the ~/.claude/projects directory
 */
export interface Project {
	/** The project ID (derived from the directory name) */
	id: string;
	/** The original project path (decoded from the directory name) */
	path: string;
	/** List of session IDs (JSONL file names without extension) */
	sessions: string[];
	/** Unix timestamp when the project directory was created */
	created_at: number;
}

/**
 * Represents a session with its metadata
 */
export interface Session {
	/** The session ID (UUID) */
	id: string;
	/** The project ID this session belongs to */
	project_id: string;
	/** The project path */
	project_path: string;
	/** Optional todo data associated with this session */
	todo_data?: any;
	/** Unix timestamp when the session file was created */
	created_at: number;
	/** First user message content (if available) */
	first_message?: string;
	/** Timestamp of the first user message (if available) */
	first_message_at?: number;
}

/**
 * Claude version status information
 */
export interface ClaudeVersionStatus {
	is_installed: boolean;
	version?: string;
	output: string;
}

/**
 * CLAUDE.md file representation
 */
export interface ClaudeMdFile {
	/** The file path */
	path: string;
	/** The file content */
	content: string;
	/** Whether the file exists */
	exists: boolean;
}

/**
 * Running agent session information
 */
export interface RunningAgentSession {
	id?: number;
	status: string;
	agent_name?: string;
	project_path?: string;
	task?: string;
	model?: string;
	started_at?: string;
}

/**
 * Agent interface
 */
export interface Agent {
	id?: number;
	name: string;
	icon: string;
	description: string;
	system_prompt: string;
	default_task?: string;
	model: string;
	hooks?: string;
	created_at: string;
	updated_at: string;
}

/**
 * Agent run with metrics
 */
export interface AgentRunWithMetrics {
	id?: number;
	agent_id: number;
	agent_name: string;
	agent_icon: string;
	task: string;
	model: string;
	project_path: string;
	session_id: string;
	status: string;
	pid?: number;
	process_started_at?: string;
	created_at: string;
	completed_at?: string;
	output?: string;
}

/**
 * Web-compatible API client that returns mock data
 */
export const api = {
	/**
	 * List all projects in ~/.claude/projects
	 */
	async listProjects(): Promise<Project[]> {
		// Return sample projects for web deployment
		return [
			{
				id: "sample-project-1",
				path: "/Users/demo/projects/web-app",
				sessions: ["session-1", "session-2"],
				created_at: Date.now() - 86400000, // 1 day ago
			},
			{
				id: "sample-project-2",
				path: "/Users/demo/projects/api-server",
				sessions: ["session-3"],
				created_at: Date.now() - 172800000, // 2 days ago
			},
			{
				id: "sample-project-3",
				path: "/Users/demo/projects/mobile-app",
				sessions: [],
				created_at: Date.now() - 259200000, // 3 days ago
			},
		];
	},

	/**
	 * Get all projects (alias for listProjects)
	 */
	async getProjects(): Promise<Project[]> {
		return this.listProjects();
	},

	/**
	 * Get sessions for a specific project
	 */
	async getProjectSessions(projectId: string): Promise<Session[]> {
		// Return sample sessions for web deployment
		if (projectId === "sample-project-1") {
			return [
				{
					id: "session-1",
					project_id: projectId,
					project_path: "/Users/demo/projects/web-app",
					created_at: Date.now() - 3600000, // 1 hour ago
					first_message: "Help me build a responsive navigation component",
					first_message_at: Date.now() - 3600000,
				},
				{
					id: "session-2",
					project_id: projectId,
					project_path: "/Users/demo/projects/web-app",
					created_at: Date.now() - 7200000, // 2 hours ago
					first_message: "Implement dark mode toggle functionality",
					first_message_at: Date.now() - 7200000,
				},
			];
		}
		if (projectId === "sample-project-2") {
			return [
				{
					id: "session-3",
					project_id: projectId,
					project_path: "/Users/demo/projects/api-server",
					created_at: Date.now() - 10800000, // 3 hours ago
					first_message: "Create REST API endpoints for user authentication",
					first_message_at: Date.now() - 10800000,
				},
			];
		}
		return [];
	},

	/**
	 * Get a specific session
	 */
	async getSession(_sessionId: string): Promise<Session | null> {
		// Return null for web deployment
		return null;
	},

	/**
	 * Create a new session
	 */
	async createSession(projectPath: string, name?: string): Promise<Session> {
		// Return mock session for web deployment
		return {
			id: `session-${Date.now()}`,
			project_id: "mock-project",
			project_path: projectPath,
			created_at: Date.now(),
			first_message: name,
		};
	},

	/**
	 * Check Claude Code version and installation status
	 */
	async checkClaudeVersion(): Promise<ClaudeVersionStatus> {
		// Return mock status for web deployment
		return {
			is_installed: false,
			version: undefined,
			output: "Claude Code is not available in web deployment",
		};
	},

	/**
	 * Get session output for a specific session
	 */
	async getSessionOutput(_sessionId: number): Promise<string> {
		// Return empty string for web deployment
		return "";
	},

	/**
	 * List running agent sessions
	 */
	async listRunningAgentSessions(): Promise<RunningAgentSession[]> {
		// Return empty array for web deployment
		return [];
	},

	/**
	 * Read CLAUDE.md file from a project
	 */
	async readClaudeFile(projectPath: string): Promise<ClaudeMdFile> {
		// Return mock file for web deployment
		return {
			path: `${projectPath}/CLAUDE.md`,
			content: "",
			exists: false,
		};
	},

	/**
	 * Write CLAUDE.md file to a project
	 */
	async writeClaudeFile(
		_projectPath: string,
		_content: string,
	): Promise<void> {},

	// Agent API methods (web-compatible stubs)

	/**
	 * List all agents
	 */
	async listAgents(): Promise<Agent[]> {
		// Return sample agents for web deployment
		return [
			{
				id: 1,
				name: "Frontend Developer",
				icon: "bot",
				description: "Specialized in React, Next.js, and modern web development",
				system_prompt: "You are a senior frontend developer with expertise in React, Next.js, TypeScript, and modern web technologies. Help with component design, state management, and UI/UX best practices.",
				default_task: "Review and improve frontend code",
				model: "sonnet",
				created_at: new Date(Date.now() - 86400000).toISOString(),
				updated_at: new Date().toISOString(),
			},
			{
				id: 2,
				name: "API Developer",
				icon: "bot",
				description: "Expert in REST APIs, GraphQL, and backend architecture",
				system_prompt: "You are a backend developer skilled in API design, database optimization, and server architecture. Focus on creating scalable and secure backend solutions.",
				default_task: "Design and implement API endpoints",
				model: "sonnet",
				created_at: new Date(Date.now() - 172800000).toISOString(),
				updated_at: new Date().toISOString(),
			},
			{
				id: 3,
				name: "Code Reviewer",
				icon: "bot",
				description: "Focused on code quality, security, and best practices",
				system_prompt: "You are a code reviewer with a focus on security, performance, and maintainability. Provide constructive feedback and suggest improvements.",
				default_task: "Review code for quality and security",
				model: "sonnet",
				created_at: new Date(Date.now() - 259200000).toISOString(),
				updated_at: new Date().toISOString(),
			},
		];
	},

	/**
	 * Create a new agent
	 */
	async createAgent(
		name: string,
		icon: string,
		system_prompt: string,
		description?: string,
		model?: string,
		hooks?: string,
	): Promise<Agent> {
		// Return mock agent for web deployment
		return {
			id: Date.now(),
			name,
			icon,
			description: description || "",
			system_prompt,
			default_task: "Sample task",
			model: model || "sonnet",
			hooks,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		};
	},

	/**
	 * Update an existing agent
	 */
	async updateAgent(
		id: number,
		name: string,
		icon: string,
		system_prompt: string,
		description?: string,
		model?: string,
		hooks?: string,
	): Promise<Agent> {
		// Return mock updated agent for web deployment
		return {
			id,
			name,
			icon,
			description: description || "",
			system_prompt,
			default_task: "Sample task",
			model: model || "sonnet",
			hooks,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		};
	},

	/**
	 * Delete an agent
	 */
	async deleteAgent(_id: number): Promise<void> {
		// No-op for web deployment
	},

	/**
	 * Execute an agent
	 */
	async executeAgent(
		_agentId: number,
		_projectPath: string,
		_task: string,
		_model?: string,
	): Promise<number> {
		// Return mock run ID for web deployment
		return Date.now();
	},

	/**
	 * List agent runs
	 */
	async listAgentRuns(_agentId?: number): Promise<AgentRunWithMetrics[]> {
		// Return sample runs for web deployment
		return [
			{
				id: 1,
				agent_id: 1,
				agent_name: "Frontend Developer",
				agent_icon: "bot",
				task: "Review and improve React component structure",
				model: "sonnet",
				project_path: "/Users/demo/projects/web-app",
				session_id: "session-1",
				status: "completed",
				created_at: new Date(Date.now() - 3600000).toISOString(),
				completed_at: new Date(Date.now() - 3300000).toISOString(),
			},
			{
				id: 2,
				agent_id: 2,
				agent_name: "API Developer",
				agent_icon: "bot",
				task: "Design authentication API endpoints",
				model: "sonnet",
				project_path: "/Users/demo/projects/api-server",
				session_id: "session-3",
				status: "completed",
				created_at: new Date(Date.now() - 7200000).toISOString(),
				completed_at: new Date(Date.now() - 6900000).toISOString(),
			},
			{
				id: 3,
				agent_id: 3,
				agent_name: "Code Reviewer",
				agent_icon: "bot",
				task: "Security review of authentication module",
				model: "sonnet",
				project_path: "/Users/demo/projects/api-server",
				session_id: "session-4",
				status: "completed",
				created_at: new Date(Date.now() - 10800000).toISOString(),
				completed_at: new Date(Date.now() - 10500000).toISOString(),
			},
		];
	},
};
