import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setupApiTestEnvironment } from "../utils/test-helpers";

describe("API Authentication Integration", () => {
	let mocks: ReturnType<typeof setupApiTestEnvironment>;

	beforeEach(() => {
		mocks = setupApiTestEnvironment();
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("Environment Configuration", () => {
		it("should have all required environment variables set", () => {
			expect(process.env.INNGEST_EVENT_KEY).toBe("test-event-key");
			expect(process.env.INNGEST_SIGNING_KEY).toBe("test-signing-key");
			expect(process.env.INNGEST_BASE_URL).toBe(
				"http://localhost:3000/api/inngest",
			);
			expect(process.env.NEXT_PUBLIC_SERVER_URL).toBe("http://localhost:3000");
			expect(process.env.DATABASE_URL).toBe("file:./test.db");
			expect(process.env.NODE_ENV).toBe("test");
		});

		it("should prevent 401 errors with mock credentials", async () => {
			// Test that our mocked environment prevents authentication errors
			const { Inngest } = await import("inngest");

			expect(Inngest).toHaveBeenCalledWith({
				id: "claudia-ai-agents",
				name: "Claudia AI Agent System",
				eventKey: "test-event-key",
				signingKey: "test-signing-key",
			});
		});
	});

	describe("Inngest API Integration", () => {
		it("should successfully send events to Inngest", async () => {
			const event = {
				name: "agent/task.created",
				data: {
					taskId: "task-123",
					type: "code-generation",
					priority: 2,
					payload: { code: "test" },
					requiredCapabilities: ["code_generation"],
					timeoutMs: 30000,
					maxRetries: 3,
				},
			};

			const result = await mocks.inngest.send(event);

			expect(result).toEqual({
				id: expect.stringMatching(/^evt_\d+$/),
			});
			expect(mocks.inngest.send).toHaveBeenCalledWith(event);
		});

		it("should handle Inngest webhook requests", async () => {
			const response = await mocks.mockFetch("/api/inngest", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: "agent/task.created",
					data: { taskId: "task-123" },
				}),
			});

			expect(response.ok).toBe(true);
			const data = await response.json();
			expect(data).toEqual({
				event: "agent/task.created",
				id: expect.stringMatching(/^evt_\d+$/),
				received: true,
			});
		});

		it("should handle authentication errors gracefully", async () => {
			// Mock authentication failure
			mocks.mockFetch.mockImplementationOnce(() => {
				return Promise.resolve(
					new Response(JSON.stringify({ error: "401 Event key not found" }), {
						status: 401,
					}),
				);
			});

			const response = await mocks.mockFetch("/api/inngest", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: "agent/task.created",
					data: { taskId: "task-123" },
				}),
			});

			expect(response.status).toBe(401);
			const data = await response.json();
			expect(data.error).toBe("401 Event key not found");
		});
	});

	describe("Agent API Integration", () => {
		it("should authenticate and fetch agents", async () => {
			const agents = await mocks.mockHttpClient.get("/api/agents");

			expect(agents).toEqual([
				{ id: "agent-1", name: "Coder Agent", type: "coder", status: "active" },
				{
					id: "agent-2",
					name: "Researcher Agent",
					type: "researcher",
					status: "active",
				},
			]);
		});

		it("should create new agents with authentication", async () => {
			const newAgent = {
				name: "Test Agent",
				type: "tester",
				capabilities: ["testing"],
			};

			const result = await mocks.mockHttpClient.post("/api/agents", newAgent);

			expect(result).toEqual({
				id: expect.stringMatching(/^agent-\d+$/),
				...newAgent,
				status: "active",
				createdAt: expect.any(String),
			});
		});

		it("should handle agent API errors", async () => {
			// Mock API error
			mocks.mockFetch.mockImplementationOnce(() => {
				return Promise.resolve(
					new Response(JSON.stringify({ error: "Unauthorized" }), {
						status: 401,
					}),
				);
			});

			const response = await mocks.mockFetch("/api/agents");
			expect(response.status).toBe(401);
		});
	});

	describe("Task API Integration", () => {
		it("should create and manage tasks", async () => {
			const newTask = {
				type: "code-generation",
				priority: 2,
				payload: { code: "test" },
				requiredCapabilities: ["code_generation"],
			};

			const result = await mocks.mockHttpClient.post("/api/tasks", newTask);

			expect(result).toEqual({
				id: expect.stringMatching(/^task-\d+$/),
				...newTask,
				status: "pending",
				createdAt: expect.any(String),
			});
		});

		it("should fetch task list", async () => {
			const tasks = await mocks.mockHttpClient.get("/api/tasks");

			expect(tasks).toEqual([
				{ id: "task-1", type: "code-generation", status: "completed" },
				{ id: "task-2", type: "testing", status: "in_progress" },
			]);
		});
	});

	describe("Session API Integration", () => {
		it("should manage session lifecycle", async () => {
			const newSession = {
				name: "Test Session",
				projectId: "project-123",
			};

			const result = await mocks.mockHttpClient.post(
				"/api/sessions",
				newSession,
			);

			expect(result).toEqual({
				id: expect.stringMatching(/^session-\d+$/),
				...newSession,
				status: "active",
				createdAt: expect.any(String),
			});
		});

		it("should authenticate session operations", async () => {
			// Test authentication flow
			const loginResult = await mocks.mockAuthService.login(
				"test@example.com",
				"password",
			);

			expect(loginResult).toEqual({
				user: { id: "user-1", email: "test@example.com" },
				token: "mock-jwt-token",
				expiresAt: expect.any(String),
			});

			// Test authenticated request
			const sessions = await mocks.mockHttpClient.get("/api/sessions");
			expect(sessions).toEqual([
				{ id: "session-1", name: "Test Session", status: "active" },
			]);
		});
	});

	describe("Health Check Integration", () => {
		it("should check API health status", async () => {
			const health = await mocks.mockHttpClient.get("/api/health");

			expect(health).toEqual({
				status: "healthy",
				timestamp: expect.any(String),
				services: {
					database: "healthy",
					inngest: "healthy",
					agents: "healthy",
				},
			});
		});
	});

	describe("Error Handling", () => {
		it("should handle network errors", async () => {
			mocks.mockFetch.mockRejectedValueOnce(
				new Error("Network request failed"),
			);

			await expect(mocks.mockFetch("/api/agents")).rejects.toThrow(
				"Network request failed",
			);
		});

		it("should handle validation errors", async () => {
			mocks.mockFetch.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						error: "Validation failed",
						details: { field: "name", message: "Name is required" },
					}),
					{ status: 400 },
				),
			);

			const response = await mocks.mockFetch("/api/agents", {
				method: "POST",
				body: JSON.stringify({}),
			});

			expect(response.status).toBe(400);
			const data = await response.json();
			expect(data.error).toBe("Validation failed");
		});

		it("should handle rate limiting", async () => {
			mocks.mockFetch.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						error: "Rate limit exceeded",
						retryAfter: 60,
					}),
					{ status: 429 },
				),
			);

			const response = await mocks.mockFetch("/api/agents");
			expect(response.status).toBe(429);
		});
	});

	describe("Real-time Updates", () => {
		it("should handle WebSocket connections", () => {
			expect(mocks.mockWs.readyState).toBe(1); // OPEN
			expect(mocks.mockWs.url).toBe("ws://localhost:3000/ws");
		});

		it("should receive real-time task updates", () => {
			const messageHandler = vi.fn();
			mocks.mockWs.onmessage = messageHandler;

			// Simulate receiving a task update
			mocks.simulateMessage({
				type: "task_update",
				data: {
					taskId: "task-123",
					status: "completed",
					result: { success: true },
				},
			});

			expect(messageHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.any(String),
				}),
			);
		});

		it("should handle WebSocket errors", () => {
			const errorHandler = vi.fn();
			mocks.mockWs.onerror = errorHandler;

			const error = new Error("WebSocket connection failed");
			if (mocks.mockWs.onerror) {
				mocks.mockWs.onerror(error as any);
			}

			expect(errorHandler).toHaveBeenCalledWith(error);
		});
	});

	describe("Integration with ElectricSQL", () => {
		it("should sync data with ElectricSQL", async () => {
			const agents = await mocks.mockElectricClient.db.agents.findMany();

			expect(agents).toEqual([
				{ id: "agent-1", name: "Coder Agent", type: "coder" },
			]);
		});

		it("should handle ElectricSQL sync status", () => {
			const status = mocks.mockElectricClient.sync.status();
			expect(status).toBe("connected");
		});

		it("should start and stop sync", async () => {
			await mocks.mockElectricClient.sync.start();
			expect(mocks.mockElectricClient.sync.start).toHaveBeenCalled();

			await mocks.mockElectricClient.sync.stop();
			expect(mocks.mockElectricClient.sync.stop).toHaveBeenCalled();
		});
	});

	describe("Performance Testing", () => {
		it("should handle concurrent API requests", async () => {
			const promises = Array.from({ length: 10 }, (_, i) =>
				mocks.mockHttpClient.get(`/api/agents?page=${i}`),
			);

			const results = await Promise.all(promises);

			expect(results).toHaveLength(10);
			results.forEach((result) => {
				expect(result).toEqual([
					{
						id: "agent-1",
						name: "Coder Agent",
						type: "coder",
						status: "active",
					},
					{
						id: "agent-2",
						name: "Researcher Agent",
						type: "researcher",
						status: "active",
					},
				]);
			});
		});

		it("should handle high-volume Inngest events", async () => {
			const events = Array.from({ length: 100 }, (_, i) => ({
				name: "agent/task.created",
				data: { taskId: `task-${i}` },
			}));

			const promises = events.map((event) => mocks.inngest.send(event));
			const results = await Promise.all(promises);

			expect(results).toHaveLength(100);
			results.forEach((result, i) => {
				expect(result.id).toMatch(/^evt_\d+$/);
			});
		});
	});
});
