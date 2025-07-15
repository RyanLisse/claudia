import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
	agentRepository,
	memoryRepository,
	messageRepository,
	projectRepository,
	sessionRepository,
	userRepository,
} from "../repositories";
import {
	cleanupTestDatabase,
	clearAllTables,
	setupTestDatabase,
	testDataFactory,
} from "./setup";

describe("Database Repositories", () => {
	beforeAll(async () => {
		await setupTestDatabase();
	});

	afterAll(async () => {
		await cleanupTestDatabase();
	});

	beforeEach(async () => {
		await clearAllTables();
	});

	describe("UserRepository", () => {
		it("should create and find a user", async () => {
			const userData = testDataFactory.createUser({
				email: "test@example.com",
				name: "Test User",
			});

			const user = await userRepository.create(userData);
			expect(user.id).toBeDefined();
			expect(user.email).toBe("test@example.com");
			expect(user.name).toBe("Test User");

			const foundUser = await userRepository.findById(user.id);
			expect(foundUser).toEqual(user);
		});

		it("should find user by email", async () => {
			const userData = testDataFactory.createUser({
				email: "findme@example.com",
			});

			const user = await userRepository.create(userData);
			const foundUser = await userRepository.findByEmail("findme@example.com");

			expect(foundUser?.id).toBe(user.id);
		});

		it("should update user preferences", async () => {
			const user = await userRepository.create(testDataFactory.createUser());

			const newPreferences = {
				theme: "dark" as const,
				language: "es",
			};

			const updatedUser = await userRepository.updatePreferences(
				user.id,
				newPreferences,
			);

			expect(updatedUser.preferences?.theme).toBe("dark");
			expect(updatedUser.preferences?.language).toBe("es");
			expect(updatedUser.preferences?.timezone).toBe("UTC"); // Should preserve existing
		});

		it("should find active users", async () => {
			await userRepository.create(
				testDataFactory.createUser({ isActive: true }),
			);
			await userRepository.create(
				testDataFactory.createUser({ isActive: false }),
			);

			const activeUsers = await userRepository.findActive();
			expect(activeUsers).toHaveLength(1);
			expect(activeUsers[0].isActive).toBe(true);
		});
	});

	describe("ProjectRepository", () => {
		let testUser: any;

		beforeEach(async () => {
			testUser = await userRepository.create(testDataFactory.createUser());
		});

		it("should create and find a project", async () => {
			const projectData = testDataFactory.createProject(testUser.id, {
				name: "Test Project",
				path: "/test/path",
			});

			const project = await projectRepository.create(projectData);
			expect(project.id).toBeDefined();
			expect(project.name).toBe("Test Project");
			expect(project.ownerId).toBe(testUser.id);

			const foundProject = await projectRepository.findById(project.id);
			expect(foundProject).toEqual(project);
		});

		it("should find projects by owner", async () => {
			const project1 = await projectRepository.create(
				testDataFactory.createProject(testUser.id),
			);
			const project2 = await projectRepository.create(
				testDataFactory.createProject(testUser.id),
			);

			const otherUser = await userRepository.create(
				testDataFactory.createUser(),
			);
			await projectRepository.create(
				testDataFactory.createProject(otherUser.id),
			);

			const userProjects = await projectRepository.findByOwner(testUser.id);
			expect(userProjects).toHaveLength(2);
			expect(userProjects.map((p) => p.id)).toContain(project1.id);
			expect(userProjects.map((p) => p.id)).toContain(project2.id);
		});

		it("should search projects", async () => {
			await projectRepository.create(
				testDataFactory.createProject(testUser.id, {
					name: "React App",
					description: "A React application",
				}),
			);

			await projectRepository.create(
				testDataFactory.createProject(testUser.id, {
					name: "Vue App",
					description: "A Vue.js application",
				}),
			);

			const reactProjects = await projectRepository.search("React");
			expect(reactProjects).toHaveLength(1);
			expect(reactProjects[0].name).toBe("React App");
		});

		it("should increment session count", async () => {
			const project = await projectRepository.create(
				testDataFactory.createProject(testUser.id),
			);
			expect(project.totalSessions).toBe(0);

			await projectRepository.incrementSessions(project.id);

			const updatedProject = await projectRepository.findById(project.id);
			expect(updatedProject?.totalSessions).toBe(1);
		});
	});

	describe("AgentRepository", () => {
		let testUser: any;
		let testProject: any;

		beforeEach(async () => {
			testUser = await userRepository.create(testDataFactory.createUser());
			testProject = await projectRepository.create(
				testDataFactory.createProject(testUser.id),
			);
		});

		it("should create and find an agent", async () => {
			const agentData = testDataFactory.createAgent(testUser.id, {
				name: "Test Coder",
				type: "coder",
				projectId: testProject.id,
			});

			const agent = await agentRepository.create(agentData);
			expect(agent.id).toBeDefined();
			expect(agent.name).toBe("Test Coder");
			expect(agent.type).toBe("coder");
			expect(agent.createdBy).toBe(testUser.id);

			const foundAgent = await agentRepository.findById(agent.id);
			expect(foundAgent).toEqual(agent);
		});

		it("should find agents by type", async () => {
			await agentRepository.create(
				testDataFactory.createAgent(testUser.id, { type: "coder" }),
			);
			await agentRepository.create(
				testDataFactory.createAgent(testUser.id, { type: "coder" }),
			);
			await agentRepository.create(
				testDataFactory.createAgent(testUser.id, { type: "researcher" }),
			);

			const coderAgents = await agentRepository.findByType("coder");
			expect(coderAgents).toHaveLength(2);
			coderAgents.forEach((agent) => {
				expect(agent.type).toBe("coder");
			});
		});

		it("should update agent run statistics", async () => {
			const agent = await agentRepository.create(
				testDataFactory.createAgent(testUser.id),
			);
			expect(agent.totalRuns).toBe(0);
			expect(agent.successfulRuns).toBe(0);

			await agentRepository.updateLastRun(agent.id, true, 1500);

			const updatedAgent = await agentRepository.findById(agent.id);
			expect(updatedAgent?.totalRuns).toBe(1);
			expect(updatedAgent?.successfulRuns).toBe(1);
			expect(updatedAgent?.averageRunTime).toBe(1500);
			expect(updatedAgent?.lastRunAt).toBeDefined();
		});

		it("should update agent metrics", async () => {
			const agent = await agentRepository.create(
				testDataFactory.createAgent(testUser.id),
			);

			const newMetrics = {
				tokensUsed: 5000,
				avgResponseTime: 2500,
				userRating: 4.5,
			};

			const updatedAgent = await agentRepository.updateMetrics(
				agent.id,
				newMetrics,
			);

			expect(updatedAgent.metrics?.tokensUsed).toBe(5000);
			expect(updatedAgent.metrics?.avgResponseTime).toBe(2500);
			expect(updatedAgent.metrics?.userRating).toBe(4.5);
			expect(updatedAgent.metrics?.errorRate).toBe(0); // Should preserve existing
		});
	});

	describe("SessionRepository", () => {
		let testUser: any;
		let testProject: any;
		let testAgent: any;

		beforeEach(async () => {
			testUser = await userRepository.create(testDataFactory.createUser());
			testProject = await projectRepository.create(
				testDataFactory.createProject(testUser.id),
			);
			testAgent = await agentRepository.create(
				testDataFactory.createAgent(testUser.id),
			);
		});

		it("should create and find a session", async () => {
			const sessionData = testDataFactory.createSession(testUser.id, {
				title: "Test Session",
				projectId: testProject.id,
				agentId: testAgent.id,
			});

			const session = await sessionRepository.create(sessionData);
			expect(session.id).toBeDefined();
			expect(session.title).toBe("Test Session");
			expect(session.userId).toBe(testUser.id);
			expect(session.projectId).toBe(testProject.id);

			const foundSession = await sessionRepository.findById(session.id);
			expect(foundSession).toEqual(session);
		});

		it("should find sessions by user", async () => {
			const session1 = await sessionRepository.create(
				testDataFactory.createSession(testUser.id),
			);
			const session2 = await sessionRepository.create(
				testDataFactory.createSession(testUser.id),
			);

			const otherUser = await userRepository.create(
				testDataFactory.createUser(),
			);
			await sessionRepository.create(
				testDataFactory.createSession(otherUser.id),
			);

			const userSessions = await sessionRepository.findByUser(testUser.id);
			expect(userSessions).toHaveLength(2);
			expect(userSessions.map((s) => s.id)).toContain(session1.id);
			expect(userSessions.map((s) => s.id)).toContain(session2.id);
		});

		it("should update token usage", async () => {
			const session = await sessionRepository.create(
				testDataFactory.createSession(testUser.id),
			);
			expect(session.totalTokens).toBe(0);
			expect(session.totalCost).toBe(0);

			await sessionRepository.updateTokenUsage(session.id, 1000, 50);
			await sessionRepository.updateTokenUsage(session.id, 500, 25);

			const updatedSession = await sessionRepository.findById(session.id);
			expect(updatedSession?.totalTokens).toBe(1500);
			expect(updatedSession?.totalCost).toBe(75);
		});

		it("should end session with duration", async () => {
			const session = await sessionRepository.create(
				testDataFactory.createSession(testUser.id),
			);
			expect(session.status).toBe("active");
			expect(session.endedAt).toBeNull();

			// Wait a bit to ensure duration is measurable
			await new Promise((resolve) => setTimeout(resolve, 10));

			const endedSession = await sessionRepository.endSession(session.id);
			expect(endedSession.status).toBe("completed");
			expect(endedSession.endedAt).toBeDefined();
			expect(endedSession.duration).toBeGreaterThan(0);
		});
	});

	describe("MessageRepository", () => {
		let testUser: any;
		let testSession: any;

		beforeEach(async () => {
			testUser = await userRepository.create(testDataFactory.createUser());
			testSession = await sessionRepository.create(
				testDataFactory.createSession(testUser.id),
			);
		});

		it("should create and find messages", async () => {
			const messageData = testDataFactory.createMessage(testSession.id, 1, {
				role: "user",
				content: "Hello, world!",
			});

			const message = await messageRepository.create(messageData);
			expect(message.id).toBeDefined();
			expect(message.content).toBe("Hello, world!");
			expect(message.sessionId).toBe(testSession.id);
			expect(message.sequenceNumber).toBe(1);

			const foundMessage = await messageRepository.findById(message.id);
			expect(foundMessage).toEqual(message);
		});

		it("should find messages by session", async () => {
			const message1 = await messageRepository.create(
				testDataFactory.createMessage(testSession.id, 1),
			);
			const message2 = await messageRepository.create(
				testDataFactory.createMessage(testSession.id, 2),
			);

			const otherUser = await userRepository.create(
				testDataFactory.createUser(),
			);
			const otherSession = await sessionRepository.create(
				testDataFactory.createSession(otherUser.id),
			);
			await messageRepository.create(
				testDataFactory.createMessage(otherSession.id, 1),
			);

			const sessionMessages = await messageRepository.findBySession(
				testSession.id,
			);
			expect(sessionMessages).toHaveLength(2);
			expect(sessionMessages.map((m) => m.id)).toContain(message1.id);
			expect(sessionMessages.map((m) => m.id)).toContain(message2.id);
		});

		it("should get session statistics", async () => {
			await messageRepository.create(
				testDataFactory.createMessage(testSession.id, 1, {
					role: "user",
					tokens: 100,
					cost: 5,
				}),
			);

			await messageRepository.create(
				testDataFactory.createMessage(testSession.id, 2, {
					role: "assistant",
					tokens: 200,
					cost: 10,
				}),
			);

			await messageRepository.create(
				testDataFactory.createMessage(testSession.id, 3, {
					role: "user",
					tokens: 50,
					cost: 3,
				}),
			);

			const stats = await messageRepository.getSessionStats(testSession.id);

			expect(stats.totalMessages).toBe(3);
			expect(stats.totalTokens).toBe(350);
			expect(stats.totalCost).toBe(18);
			expect(stats.messagesByRole.user).toBe(2);
			expect(stats.messagesByRole.assistant).toBe(1);
		});
	});

	describe("MemoryRepository", () => {
		let testUser: any;
		let _testProject: any;

		beforeEach(async () => {
			testUser = await userRepository.create(testDataFactory.createUser());
			_testProject = await projectRepository.create(
				testDataFactory.createProject(testUser.id),
			);
		});

		it("should create and find memory", async () => {
			const memoryData = testDataFactory.createMemory({
				key: "user_preference_theme",
				type: "user_preference",
				content: { theme: "dark", language: "en" },
				userId: testUser.id,
			});

			const memory = await memoryRepository.create(memoryData);
			expect(memory.id).toBeDefined();
			expect(memory.key).toBe("user_preference_theme");
			expect(memory.content).toEqual({ theme: "dark", language: "en" });

			const foundMemory = await memoryRepository.findById(memory.id);
			expect(foundMemory).toEqual(memory);
		});

		it("should find memory by key", async () => {
			const memory = await memoryRepository.create(
				testDataFactory.createMemory({
					key: "unique_key_123",
					userId: testUser.id,
				}),
			);

			const foundMemory = await memoryRepository.findByKey("unique_key_123");
			expect(foundMemory?.id).toBe(memory.id);
		});

		it("should find memory by type and user", async () => {
			await memoryRepository.create(
				testDataFactory.createMemory({
					type: "user_preference",
					userId: testUser.id,
				}),
			);

			await memoryRepository.create(
				testDataFactory.createMemory({
					type: "user_preference",
					userId: testUser.id,
				}),
			);

			await memoryRepository.create(
				testDataFactory.createMemory({
					type: "session_context",
					userId: testUser.id,
				}),
			);

			const preferences = await memoryRepository.findByType(
				"user_preference",
				testUser.id,
			);
			expect(preferences).toHaveLength(2);
			preferences.forEach((pref) => {
				expect(pref.type).toBe("user_preference");
				expect(pref.userId).toBe(testUser.id);
			});
		});

		it("should update memory access tracking", async () => {
			const memory = await memoryRepository.create(
				testDataFactory.createMemory({
					userId: testUser.id,
				}),
			);

			expect(memory.frequency).toBe(1);
			const originalAccessTime = memory.lastAccessedAt;

			// Wait a bit to ensure timestamp difference
			await new Promise((resolve) => setTimeout(resolve, 10));

			await memoryRepository.updateAccess(memory.id);

			const updatedMemory = await memoryRepository.findById(memory.id);
			expect(updatedMemory?.frequency).toBe(2);
			expect(updatedMemory?.lastAccessedAt?.getTime()).toBeGreaterThan(
				originalAccessTime?.getTime() || 0,
			);
		});

		it("should search memory content", async () => {
			await memoryRepository.create(
				testDataFactory.createMemory({
					key: "search_test_1",
					summary: "This contains the word elephant",
					userId: testUser.id,
				}),
			);

			await memoryRepository.create(
				testDataFactory.createMemory({
					key: "search_test_2",
					summary: "This contains the word tiger",
					userId: testUser.id,
				}),
			);

			const results = await memoryRepository.search("elephant", testUser.id);
			expect(results).toHaveLength(1);
			expect(results[0].summary).toContain("elephant");
		});
	});
});
