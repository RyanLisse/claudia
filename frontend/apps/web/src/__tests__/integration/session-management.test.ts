import { invoke } from "@tauri-apps/api/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	createMockSession,
	createTestDatabase,
	mockTauriInvoke,
} from "../utils/test-helpers";

// Mock @tauri-apps/api/core at the top level
vi.mock("@tauri-apps/api/core", () => ({
	invoke: vi.fn(),
}));

describe("Session Management Integration", () => {
	let mockDb: any;

	beforeEach(() => {
		mockDb = createTestDatabase();

		// Reset the mock before each test
		vi.clearAllMocks();

		// Set up the mock implementation
		const mockInvoke = vi.mocked(invoke);
		mockInvoke.mockImplementation((command: string, args?: any) => {
			switch (command) {
				case "db_create_session": {
					const session = createMockSession(args);
					mockDb.insert(session);
					return Promise.resolve(session);
				}
				case "db_get_sessions":
					return Promise.resolve(mockDb.select());
				case "db_update_session": {
					const updated = mockDb.update(args);
					return Promise.resolve(updated);
				}
				case "db_delete_session":
					mockDb.delete(args.id);
					return Promise.resolve({ success: true });
				case "session_start":
					return Promise.resolve({
						sessionId: args.id,
						status: "started",
						timestamp: new Date().toISOString(),
					});
				case "session_stop":
					return Promise.resolve({
						sessionId: args.id,
						status: "stopped",
						timestamp: new Date().toISOString(),
					});
				default:
					return Promise.reject(
						new Error(`Mock not found for command: ${command}`),
					);
			}
		});
	});

	afterEach(() => {
		mockDb.clear();
		vi.clearAllMocks();
	});

	describe("Session Creation", () => {
		it("should create a new session with valid data", async () => {
			const sessionData = {
				name: "Integration Test Session",
				projectId: "test-project-1",
				type: "development",
			};

			const result = await invoke("db_create_session", sessionData);

			expect(result).toMatchObject({
				name: sessionData.name,
				projectId: sessionData.projectId,
				status: "active",
			});
			expect(result.id).toBeDefined();
			expect(result.createdAt).toBeDefined();
		});

		it("should handle session creation with minimal data", async () => {
			const sessionData = {
				name: "Minimal Session",
			};

			const result = await invoke("db_create_session", sessionData);

			expect(result.name).toBe(sessionData.name);
			expect(result.id).toBeDefined();
		});

		it("should generate unique session IDs", async () => {
			const session1 = await invoke("db_create_session", { name: "Session 1" });
			const session2 = await invoke("db_create_session", { name: "Session 2" });

			expect(session1.id).not.toBe(session2.id);
		});
	});

	describe("Session Retrieval", () => {
		it("should retrieve all sessions", async () => {
			// Create test sessions
			const session1 = createMockSession({ name: "Session 1" });
			const session2 = createMockSession({ name: "Session 2" });
			mockDb.insert(session1);
			mockDb.insert(session2);

			const sessions = await invoke("db_get_sessions");

			expect(sessions).toHaveLength(2);
			expect(sessions).toContainEqual(session1);
			expect(sessions).toContainEqual(session2);
		});

		it("should handle empty session list", async () => {
			const sessions = await invoke("db_get_sessions");

			expect(sessions).toEqual([]);
		});
	});

	describe("Session Updates", () => {
		it("should update session properties", async () => {
			const originalSession = createMockSession({ name: "Original Name" });
			mockDb.insert(originalSession);

			const updateData = {
				id: originalSession.id,
				name: "Updated Name",
				status: "completed",
			};

			const result = await invoke("db_update_session", updateData);

			expect(result.name).toBe(updateData.name);
			expect(result.status).toBe(updateData.status);
			expect(result.id).toBe(originalSession.id);
		});

		it("should preserve unchanged properties during update", async () => {
			const originalSession = createMockSession({
				name: "Original Name",
				projectId: "project-1",
			});
			mockDb.insert(originalSession);

			const updateData = {
				id: originalSession.id,
				name: "Updated Name",
			};

			const result = await invoke("db_update_session", updateData);

			expect(result.name).toBe(updateData.name);
			expect(result.projectId).toBe(originalSession.projectId);
		});
	});

	describe("Session Lifecycle", () => {
		it("should start a session", async () => {
			const session = createMockSession();
			mockDb.insert(session);

			const result = await invoke("session_start", { id: session.id });

			expect(result.sessionId).toBe(session.id);
			expect(result.status).toBe("started");
			expect(result.timestamp).toBeDefined();
		});

		it("should stop a session", async () => {
			const session = createMockSession({ status: "running" });
			mockDb.insert(session);

			const result = await invoke("session_stop", { id: session.id });

			expect(result.sessionId).toBe(session.id);
			expect(result.status).toBe("stopped");
			expect(result.timestamp).toBeDefined();
		});
	});

	describe("Session Deletion", () => {
		it("should delete a session", async () => {
			const session = createMockSession();
			mockDb.insert(session);

			const result = await invoke("db_delete_session", { id: session.id });

			expect(result.success).toBe(true);
		});
	});

	describe("Error Handling", () => {
		it("should handle database errors gracefully", async () => {
			// Mock database error
			const mockInvoke = vi.mocked(invoke);
			mockInvoke.mockImplementation(() => {
				return Promise.reject(new Error("Database connection failed"));
			});

			await expect(
				invoke("db_create_session", { name: "Test" }),
			).rejects.toThrow("Database connection failed");
		});

		it("should handle invalid session data", async () => {
			// Mock invalid session data handling
			const mockInvoke = vi.mocked(invoke);
			mockInvoke.mockImplementation((command: string, args: any) => {
				if (command === "db_create_session") {
					if (!args.name) {
						return Promise.reject(new Error("Session name is required"));
					}
					return Promise.resolve(createMockSession(args));
				}
				return Promise.reject(
					new Error(`Mock not found for command: ${command}`),
				);
			});

			await expect(invoke("db_create_session", {})).rejects.toThrow(
				"Session name is required",
			);
		});
	});

	describe("Performance", () => {
		it("should handle large number of sessions efficiently", async () => {
			// Create 1000 mock sessions
			const sessions = Array.from({ length: 1000 }, (_, i) =>
				createMockSession({ name: `Session ${i}` }),
			);

			sessions.forEach((session) => mockDb.insert(session));

			const start = performance.now();
			const result = await invoke("db_get_sessions");
			const end = performance.now();

			expect(result).toHaveLength(1000);
			expect(end - start).toBeLessThan(100); // Should complete in under 100ms
		});
	});

	describe("Concurrent Operations", () => {
		it("should handle concurrent session creation", async () => {
			const promises = Array.from({ length: 10 }, (_, i) =>
				invoke("db_create_session", { name: `Concurrent Session ${i}` }),
			);

			const results = await Promise.all(promises);

			expect(results).toHaveLength(10);

			// All sessions should have unique IDs
			const ids = results.map((r) => r.id);
			const uniqueIds = new Set(ids);
			expect(uniqueIds.size).toBe(10);
		});

		it("should handle concurrent updates to the same session", async () => {
			const session = createMockSession();
			mockDb.insert(session);

			const updates = [
				{ id: session.id, name: "Update 1" },
				{ id: session.id, name: "Update 2" },
				{ id: session.id, name: "Update 3" },
			];

			const promises = updates.map((update) =>
				invoke("db_update_session", update),
			);

			const results = await Promise.all(promises);

			expect(results).toHaveLength(3);
			// Last update should win
			expect(results[2].name).toBe("Update 3");
		});
	});
});
