/**
 * Mock API implementation for testing
 */
import { vi } from "vitest";
import type {
	Project,
	Session,
	Agent,
	AgentRun,
	AgentRunWithMetrics,
	ClaudeSettings,
	ClaudeVersionStatus,
	UsageStats,
	ClaudeMdFile,
	FileEntry,
	ClaudeInstallation,
	MCPServer,
	SlashCommand,
	HooksConfiguration,
} from "../../lib/api";

export const createMockProject = (overrides: Partial<Project> = {}): Project => ({
	id: "test-project",
	path: "/test/path",
	sessions: ["session-1", "session-2"],
	created_at: Date.now(),
	...overrides,
});

export const createMockSession = (overrides: Partial<Session> = {}): Session => ({
	id: "test-session",
	project_id: "test-project",
	project_path: "/test/path",
	created_at: Date.now(),
	first_message: "Test message",
	...overrides,
});

export const createMockAgent = (overrides: Partial<Agent> = {}): Agent => ({
	id: 1,
	name: "Test Agent",
	icon: "🤖",
	system_prompt: "Test system prompt",
	default_task: "Test task",
	model: "sonnet",
	created_at: "2023-01-01T00:00:00Z",
	updated_at: "2023-01-01T00:00:00Z",
	...overrides,
});

export const createMockAgentRun = (
	overrides: Partial<AgentRunWithMetrics> = {}
): AgentRunWithMetrics => ({
	id: 1,
	agent_id: 1,
	agent_name: "Test Agent",
	agent_icon: "🤖",
	task: "Test task",
	model: "sonnet",
	project_path: "/test/path",
	session_id: "test-session",
	status: "completed",
	created_at: "2023-01-01T00:00:00Z",
	completed_at: "2023-01-01T00:00:01Z",
	metrics: {
		duration_ms: 1000,
		total_tokens: 100,
		cost_usd: 0.01,
		message_count: 5,
	},
	...overrides,
});

export const createMockUsageStats = (
	overrides: Partial<UsageStats> = {}
): UsageStats => ({
	total_cost: 10.5,
	total_tokens: 1000,
	total_input_tokens: 600,
	total_output_tokens: 400,
	total_cache_creation_tokens: 0,
	total_cache_read_tokens: 0,
	total_sessions: 5,
	by_model: [
		{
			model: "sonnet",
			total_cost: 10.5,
			total_tokens: 1000,
			input_tokens: 600,
			output_tokens: 400,
			cache_creation_tokens: 0,
			cache_read_tokens: 0,
			session_count: 5,
		},
	],
	by_date: [
		{
			date: "2023-01-01",
			total_cost: 10.5,
			total_tokens: 1000,
			models_used: ["sonnet"],
		},
	],
	by_project: [
		{
			project_path: "/test/path",
			project_name: "Test Project",
			total_cost: 10.5,
			total_tokens: 1000,
			session_count: 5,
			last_used: "2023-01-01T00:00:00Z",
		},
	],
	...overrides,
});

// Mock API implementation
export const mockApi = {
	listProjects: vi.fn().mockResolvedValue([createMockProject()]),
	getProjectSessions: vi.fn().mockResolvedValue([createMockSession()]),
	fetchGitHubAgents: vi.fn().mockResolvedValue([]),
	fetchGitHubAgentContent: vi.fn().mockResolvedValue({
		version: 1,
		exported_at: "2023-01-01T00:00:00Z",
		agent: createMockAgent(),
	}),
	importAgentFromGitHub: vi.fn().mockResolvedValue(createMockAgent()),
	getClaudeSettings: vi.fn().mockResolvedValue({}),
	openNewSession: vi.fn().mockResolvedValue("session-id"),
	getSystemPrompt: vi.fn().mockResolvedValue("Test system prompt"),
	checkClaudeVersion: vi.fn().mockResolvedValue({
		is_installed: true,
		version: "1.0.0",
		output: "Claude Code 1.0.0",
	}),
	saveSystemPrompt: vi.fn().mockResolvedValue("Saved successfully"),
	saveClaudeSettings: vi.fn().mockResolvedValue("Saved successfully"),
	findClaudeMdFiles: vi.fn().mockResolvedValue([]),
	readClaudeMdFile: vi.fn().mockResolvedValue("Test content"),
	saveClaudeMdFile: vi.fn().mockResolvedValue("Saved successfully"),
	listAgents: vi.fn().mockResolvedValue([createMockAgent()]),
	createAgent: vi.fn().mockResolvedValue(createMockAgent()),
	updateAgent: vi.fn().mockResolvedValue(createMockAgent()),
	deleteAgent: vi.fn().mockResolvedValue(undefined),
	getAgent: vi.fn().mockResolvedValue(createMockAgent()),
	exportAgent: vi.fn().mockResolvedValue(JSON.stringify(createMockAgent())),
	importAgent: vi.fn().mockResolvedValue(createMockAgent()),
	importAgentFromFile: vi.fn().mockResolvedValue(createMockAgent()),
	executeAgent: vi.fn().mockResolvedValue(1),
	listAgentRuns: vi.fn().mockResolvedValue([createMockAgentRun()]),
	getAgentRun: vi.fn().mockResolvedValue(createMockAgentRun()),
	getAgentRunWithRealTimeMetrics: vi.fn().mockResolvedValue(createMockAgentRun()),
	listRunningAgentSessions: vi.fn().mockResolvedValue([]),
	killAgentSession: vi.fn().mockResolvedValue(true),
	getSessionStatus: vi.fn().mockResolvedValue("completed"),
	cleanupFinishedProcesses: vi.fn().mockResolvedValue([]),
	getSessionOutput: vi.fn().mockResolvedValue("Test output"),
	getLiveSessionOutput: vi.fn().mockResolvedValue("Test live output"),
	streamSessionOutput: vi.fn().mockResolvedValue(undefined),
	loadSessionHistory: vi.fn().mockResolvedValue([]),
	loadAgentSessionHistory: vi.fn().mockResolvedValue([]),
	executeClaudeCode: vi.fn().mockResolvedValue(undefined),
	continueClaudeCode: vi.fn().mockResolvedValue(undefined),
	resumeClaudeCode: vi.fn().mockResolvedValue(undefined),
	cancelClaudeExecution: vi.fn().mockResolvedValue(undefined),
	listRunningClaudeSessions: vi.fn().mockResolvedValue([]),
	getClaudeSessionOutput: vi.fn().mockResolvedValue("Test output"),
	listDirectoryContents: vi.fn().mockResolvedValue([]),
	searchFiles: vi.fn().mockResolvedValue([]),
	getUsageStats: vi.fn().mockResolvedValue(createMockUsageStats()),
	getUsageByDateRange: vi.fn().mockResolvedValue(createMockUsageStats()),
	getSessionStats: vi.fn().mockResolvedValue([]),
	getUsageDetails: vi.fn().mockResolvedValue([]),
	// Add more mock methods as needed
};

// Export mock types
export type MockApi = typeof mockApi;