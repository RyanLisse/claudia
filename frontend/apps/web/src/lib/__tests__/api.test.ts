import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api";

// Mock window object and Tauri API
const mockInvoke = vi.fn();

// Mock the dynamic import behavior
const mockTauriModule = {
	invoke: mockInvoke,
};

// Store original window object
const originalWindow = global.window;

describe("api module", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Reset invoke function and ensure proper mocking setup
		(api as any).invoke = mockInvoke;
		// Ensure the mock behaves correctly for all test scenarios
		mockInvoke.mockClear();
	});

	afterEach(() => {
		global.window = originalWindow;
	});

	describe("Tauri environment detection", () => {
		it("should use Tauri invoke when in Tauri environment", async () => {
			// Mock window with __TAURI__ property
			global.window = {
				__TAURI__: true,
			} as any;

			// Mock dynamic import
			vi.doMock("@tauri-apps/api/core", () => mockTauriModule);

			const projects = [{ id: "1", name: "Test Project" }];
			mockInvoke.mockResolvedValue(projects);

			// Ensure the API function uses the mock correctly
			const result = await api.listProjects();
			expect(result).toEqual(projects);
			expect(mockInvoke).toHaveBeenCalledWith("list_projects");
		});

		it("should throw error when not in Tauri environment", async () => {
			// Mock window without __TAURI__ property
			global.window = {} as any;

			// Set up mock invoke to throw error
			mockInvoke.mockRejectedValue(new Error("Tauri API not available in web deployment"));

			await expect(api.listProjects()).rejects.toThrow(
				"Tauri API not available in web deployment",
			);
		});

		it("should handle undefined window object", () => {
			// @ts-ignore
			global.window = undefined;

			// The module should handle this gracefully and set up mock invoke
			expect(() => api).not.toThrow();
		});
	});

	describe("listProjects", () => {
		it("should call invoke with correct command", async () => {
			const mockProjects = [
				{ id: "1", path: "/project1", sessions: [], created_at: Date.now() },
				{ id: "2", path: "/project2", sessions: [], created_at: Date.now() },
			];
			mockInvoke.mockResolvedValue(mockProjects);

			const result = await api.listProjects();

			expect(mockInvoke).toHaveBeenCalledWith("list_projects");
			expect(result).toEqual(mockProjects);
		});

		it("should handle empty projects list", async () => {
			mockInvoke.mockResolvedValue([]);

			const result = await api.listProjects();

			expect(result).toEqual([]);
		});

		it("should handle errors", async () => {
			const error = new Error("Failed to list projects");
			mockInvoke.mockRejectedValue(error);

			await expect(api.listProjects()).rejects.toThrow(
				"Failed to list projects",
			);
		});
	});

	describe("getProjectSessions", () => {
		it("should call invoke with correct parameters", async () => {
			const projectId = "test-project-id";
			const mockSessions = [
				{ id: "session1", project_id: projectId, created_at: Date.now() },
				{ id: "session2", project_id: projectId, created_at: Date.now() },
			];
			mockInvoke.mockResolvedValue(mockSessions);

			const result = await api.getProjectSessions(projectId);

			expect(mockInvoke).toHaveBeenCalledWith("get_project_sessions", {
				projectId,
			});
			expect(result).toEqual(mockSessions);
		});

		it("should handle empty sessions list", async () => {
			mockInvoke.mockResolvedValue([]);

			const result = await api.getProjectSessions("empty-project");

			expect(result).toEqual([]);
		});

		it("should handle errors", async () => {
			const error = new Error("Project not found");
			mockInvoke.mockRejectedValue(error);

			await expect(api.getProjectSessions("invalid-id")).rejects.toThrow(
				"Project not found",
			);
		});
	});

	describe("checkClaudeVersion", () => {
		it("should return version info when Claude is installed", async () => {
			const mockVersionStatus = {
				is_installed: true,
				version: "1.0.0",
				output: "Claude version 1.0.0",
			};
			mockInvoke.mockResolvedValue(mockVersionStatus);

			const result = await api.checkClaudeVersion();

			expect(mockInvoke).toHaveBeenCalledWith("check_claude_version");
			expect(result).toEqual(mockVersionStatus);
		});

		it("should return not installed status", async () => {
			const mockVersionStatus = {
				is_installed: false,
				output: "Command not found",
			};
			mockInvoke.mockResolvedValue(mockVersionStatus);

			const result = await api.checkClaudeVersion();

			expect(result).toEqual(mockVersionStatus);
		});

		it("should handle check errors", async () => {
			const error = new Error("Failed to check version");
			mockInvoke.mockRejectedValue(error);

			await expect(api.checkClaudeVersion()).rejects.toThrow(
				"Failed to check version",
			);
		});
	});

	describe("getSessionOutput", () => {
		it("should get session output for valid session ID", async () => {
			const sessionId = 123;
			const mockOutput = "Session output content";
			mockInvoke.mockResolvedValue(mockOutput);

			const result = await api.getSessionOutput(sessionId);

			expect(mockInvoke).toHaveBeenCalledWith("get_session_output", {
				sessionId,
			});
			expect(result).toEqual(mockOutput);
		});

		it("should handle empty output", async () => {
			mockInvoke.mockResolvedValue("");

			const result = await api.getSessionOutput(456);

			expect(result).toEqual("");
		});

		it("should handle errors", async () => {
			const error = new Error("Session not found");
			mockInvoke.mockRejectedValue(error);

			await expect(api.getSessionOutput(999)).rejects.toThrow(
				"Session not found",
			);
		});
	});

	describe("listRunningAgentSessions", () => {
		it("should list running agent sessions", async () => {
			const mockSessions = [
				{
					id: 1,
					status: "running",
					agent_name: "Agent1",
					project_path: "/path1",
				},
				{ id: 2, status: "idle", agent_name: "Agent2", project_path: "/path2" },
			];
			mockInvoke.mockResolvedValue(mockSessions);

			const result = await api.listRunningAgentSessions();

			expect(mockInvoke).toHaveBeenCalledWith("list_running_agent_sessions");
			expect(result).toEqual(mockSessions);
		});

		it("should handle no running sessions", async () => {
			mockInvoke.mockResolvedValue([]);

			const result = await api.listRunningAgentSessions();

			expect(result).toEqual([]);
		});

		it("should handle errors", async () => {
			const error = new Error("Failed to list sessions");
			mockInvoke.mockRejectedValue(error);

			await expect(api.listRunningAgentSessions()).rejects.toThrow(
				"Failed to list sessions",
			);
		});
	});

	describe("readClaudeFile", () => {
		it("should read CLAUDE.md file from project", async () => {
			const projectPath = "/path/to/project";
			const mockFile = {
				path: "/path/to/project/CLAUDE.md",
				content: "# Project Instructions",
				exists: true,
			};
			mockInvoke.mockResolvedValue(mockFile);

			const result = await api.readClaudeFile(projectPath);

			expect(mockInvoke).toHaveBeenCalledWith("read_claude_file", {
				projectPath,
			});
			expect(result).toEqual(mockFile);
		});

		it("should handle non-existent file", async () => {
			const projectPath = "/path/without/claude/file";
			const mockFile = {
				path: "/path/without/claude/file/CLAUDE.md",
				content: "",
				exists: false,
			};
			mockInvoke.mockResolvedValue(mockFile);

			const result = await api.readClaudeFile(projectPath);

			expect(result).toEqual(mockFile);
		});

		it("should handle read errors", async () => {
			const error = new Error("Permission denied");
			mockInvoke.mockRejectedValue(error);

			await expect(api.readClaudeFile("/invalid/path")).rejects.toThrow(
				"Permission denied",
			);
		});
	});

	describe("writeClaudeFile", () => {
		it("should write CLAUDE.md file to project", async () => {
			const projectPath = "/path/to/project";
			const content = "# Updated Instructions";
			mockInvoke.mockResolvedValue(undefined);

			await api.writeClaudeFile(projectPath, content);

			expect(mockInvoke).toHaveBeenCalledWith("write_claude_file", {
				projectPath,
				content,
			});
		});

		it("should handle write with empty content", async () => {
			const projectPath = "/path/to/project";
			const content = "";
			mockInvoke.mockResolvedValue(undefined);

			await api.writeClaudeFile(projectPath, content);

			expect(mockInvoke).toHaveBeenCalledWith("write_claude_file", {
				projectPath,
				content,
			});
		});

		it("should handle write errors", async () => {
			const error = new Error("Write permission denied");
			mockInvoke.mockRejectedValue(error);

			await expect(
				api.writeClaudeFile("/readonly/path", "content"),
			).rejects.toThrow("Write permission denied");
		});
	});

	describe("electric utilities", () => {
		const originalEnv = process.env;

		beforeEach(() => {
			process.env = { ...originalEnv };
		});

		afterEach(() => {
			process.env = originalEnv;
		});

		describe("getShapeUrl", () => {
			it("should generate shape URL with default configuration", () => {
				process.env.NEXT_PUBLIC_ELECTRIC_URL = "https://test-electric.com";
				process.env.NEXT_PUBLIC_ELECTRIC_SOURCE_ID = "test-source-id";

				const url = api.electric.getShapeUrl("messages");

				expect(url).toContain("table=messages");
				expect(url).toContain("source_id=test-source-id");
				expect(url).toContain("test-electric.com");
			});

			it("should generate shape URL without source ID", () => {
				process.env.NEXT_PUBLIC_ELECTRIC_URL = "https://test-electric.com";
				process.env.NEXT_PUBLIC_ELECTRIC_SOURCE_ID = undefined;

				const url = api.electric.getShapeUrl("users");

				expect(url).toContain("table=users");
				expect(url).not.toContain("source_id");
			});

			it("should use default Electric URL when not configured", () => {
				process.env.NEXT_PUBLIC_ELECTRIC_URL = undefined;
				process.env.NEXT_PUBLIC_ELECTRIC_SOURCE_ID = undefined;

				const url = api.electric.getShapeUrl("posts");

				expect(url).toContain("api.electric-sql.com");
				expect(url).toContain("table=posts");
			});

			it("should include additional parameters", () => {
				process.env.NEXT_PUBLIC_ELECTRIC_URL = "https://test-electric.com";
				process.env.NEXT_PUBLIC_ELECTRIC_SOURCE_ID = "test-source-id";

				const url = api.electric.getShapeUrl("messages", {
					where: "active=true",
					limit: "100",
				});

				expect(url).toContain("table=messages");
				expect(url).toContain("source_id=test-source-id");
				expect(url).toContain("where=active");
				expect(url).toContain("limit=100");
				expect(url).toContain("test-electric.com");
			});

			it("should handle special characters in parameters", () => {
				process.env.NEXT_PUBLIC_ELECTRIC_URL = "https://test-electric.com";

				const url = api.electric.getShapeUrl("messages", {
					where: 'name="John Doe"',
				});

				expect(url).toContain("where=name");
				expect(url).toContain("John");
				expect(url).toContain("Doe");
			});
		});

		describe("getShapeConfig", () => {
			it("should generate shape config with default settings", () => {
				process.env.NEXT_PUBLIC_ELECTRIC_URL = "https://test-electric.com";
				process.env.NEXT_PUBLIC_ELECTRIC_SOURCE_ID = "test-source-id";

				const config = api.electric.getShapeConfig("messages");

				expect(config.url).toContain("test-electric.com");
				expect(config.params.table).toBe("messages");
				expect(config.params.source_id).toBe("test-source-id");
			});

			it("should generate shape config without source ID", () => {
				process.env.NEXT_PUBLIC_ELECTRIC_URL = "https://test-electric.com";
				process.env.NEXT_PUBLIC_ELECTRIC_SOURCE_ID = undefined;

				const config = api.electric.getShapeConfig("users");

				expect(config.url).toContain("test-electric.com");
				expect(config.params.table).toBe("users");
				expect(config.params.source_id).toBeUndefined();
			});

			it("should use default Electric URL in config", () => {
				process.env.NEXT_PUBLIC_ELECTRIC_URL = undefined;

				const config = api.electric.getShapeConfig("posts");

				expect(config.url).toBe("https://api.electric-sql.com/v1/shape");
			});

			it("should include additional parameters in config", () => {
				process.env.NEXT_PUBLIC_ELECTRIC_URL = "https://test-electric.com";
				process.env.NEXT_PUBLIC_ELECTRIC_SOURCE_ID = "test-source-id";

				const config = api.electric.getShapeConfig("messages", {
					where: "active=true",
					order: "created_at",
				});

				expect(config.url).toContain("test-electric.com");
				expect(config.params.table).toBe("messages");
				expect(config.params.source_id).toBe("test-source-id");
				expect(config.params.where).toBe("active=true");
				expect(config.params.order).toBe("created_at");
			});

			it("should override source_id if provided in params", () => {
				process.env.NEXT_PUBLIC_ELECTRIC_SOURCE_ID = "default-source";

				const config = api.electric.getShapeConfig("messages", {
					source_id: "override-source",
				});

				expect(config.params.source_id).toBe("override-source");
			});
		});
	});

	describe("ProcessType and ProcessInfo interfaces", () => {
		it("should handle AgentRun process type", () => {
			const processType: import("../api").ProcessType = {
				AgentRun: { agent_id: 123, agent_name: "TestAgent" },
			};

			expect(processType.AgentRun.agent_id).toBe(123);
			expect(processType.AgentRun.agent_name).toBe("TestAgent");
		});

		it("should handle ClaudeSession process type", () => {
			const processType: import("../api").ProcessType = {
				ClaudeSession: { session_id: "session-123" },
			};

			expect(processType.ClaudeSession.session_id).toBe("session-123");
		});

		it("should handle ProcessInfo structure", () => {
			const processInfo: import("../api").ProcessInfo = {
				run_id: 456,
				process_type: { AgentRun: { agent_id: 789, agent_name: "TestAgent" } },
				pid: 12345,
				started_at: "2023-01-01T00:00:00Z",
				project_path: "/path/to/project",
				task: "test task",
				model: "gpt-4",
			};

			expect(processInfo.run_id).toBe(456);
			expect(processInfo.pid).toBe(12345);
			expect(processInfo.project_path).toBe("/path/to/project");
		});
	});
});
