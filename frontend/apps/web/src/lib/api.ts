// Only import Tauri when running in Tauri context
let invoke: any;
if (typeof window !== "undefined" && "__TAURI__" in window) {
  import("@tauri-apps/api/core").then((module) => {
    invoke = module.invoke;
  });
} else {
  // Mock invoke for non-Tauri environments (e.g., Vercel deployment)
  invoke = async () => {
    throw new Error("Tauri API not available in web deployment");
  };
}

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
 * API client for interacting with Tauri backend
 */
export const api = {
  /**
   * List all projects in ~/.claude/projects
   */
  async listProjects(): Promise<Project[]> {
    return await invoke("list_projects");
  },

  /**
   * Get sessions for a specific project
   */
  async getProjectSessions(projectId: string): Promise<Session[]> {
    return await invoke("get_project_sessions", { projectId });
  },

  /**
   * Check Claude Code version and installation status
   */
  async checkClaudeVersion(): Promise<ClaudeVersionStatus> {
    return await invoke("check_claude_version");
  },

  /**
   * Get session output for a specific session
   */
  async getSessionOutput(sessionId: number): Promise<string> {
    return await invoke("get_session_output", { sessionId });
  },

  /**
   * List running agent sessions
   */
  async listRunningAgentSessions(): Promise<RunningAgentSession[]> {
    return await invoke("list_running_agent_sessions");
  },

  /**
   * Read CLAUDE.md file from a project
   */
  async readClaudeFile(projectPath: string): Promise<ClaudeMdFile> {
    return await invoke("read_claude_file", { projectPath });
  },

  /**
   * Write CLAUDE.md file to a project
   */
  async writeClaudeFile(projectPath: string, content: string): Promise<void> {
    return await invoke("write_claude_file", { projectPath, content });
  },
};