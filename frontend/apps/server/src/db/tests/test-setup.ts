// Mock database for testing
const mockDb = {
	users: new Map(),
	projects: new Map(),
	agents: new Map(),
	sessions: new Map(),
	messages: new Map(),
	memory: new Map(),
	syncEvents: new Map(),
	syncConflicts: new Map(),
	syncMetrics: new Map(),
};

// Mock repository implementations
export class MockUserRepository {
	async create(data: any) {
		const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		const user = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
		mockDb.users.set(id, user);
		return user;
	}

	async findById(id: string) {
		return mockDb.users.get(id) || null;
	}

	async findByEmail(email: string) {
		for (const user of mockDb.users.values()) {
			if (user.email === email) return user;
		}
		return null;
	}

	async findActive() {
		return Array.from(mockDb.users.values()).filter((user) => user.isActive);
	}

	async updatePreferences(id: string, preferences: any) {
		const user = mockDb.users.get(id);
		if (!user) throw new Error(`User ${id} not found`);

		user.preferences = { ...user.preferences, ...preferences };
		user.updatedAt = new Date();
		mockDb.users.set(id, user);
		return user;
	}
}

export class MockProjectRepository {
	async create(data: any) {
		const id = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		const project = {
			id,
			...data,
			totalSessions: 0,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		mockDb.projects.set(id, project);
		return project;
	}

	async findById(id: string) {
		return mockDb.projects.get(id) || null;
	}

	async findByOwner(ownerId: string) {
		return Array.from(mockDb.projects.values()).filter(
			(project) => project.ownerId === ownerId,
		);
	}

	async search(query: string) {
		return Array.from(mockDb.projects.values()).filter(
			(project) =>
				project.name.includes(query) || project.description?.includes(query),
		);
	}

	async incrementSessions(id: string) {
		const project = mockDb.projects.get(id);
		if (!project) throw new Error(`Project ${id} not found`);

		project.totalSessions = (project.totalSessions || 0) + 1;
		project.updatedAt = new Date();
		mockDb.projects.set(id, project);
		return project;
	}
}

export class MockAgentRepository {
	async create(data: any) {
		const id = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		const agent = {
			id,
			...data,
			totalRuns: 0,
			successfulRuns: 0,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		mockDb.agents.set(id, agent);
		return agent;
	}

	async findById(id: string) {
		return mockDb.agents.get(id) || null;
	}

	async findByType(type: string) {
		return Array.from(mockDb.agents.values()).filter(
			(agent) => agent.type === type,
		);
	}

	async updateLastRun(id: string, successful: boolean, duration: number) {
		const agent = mockDb.agents.get(id);
		if (!agent) throw new Error(`Agent ${id} not found`);

		agent.totalRuns = (agent.totalRuns || 0) + 1;
		if (successful) {
			agent.successfulRuns = (agent.successfulRuns || 0) + 1;
		}
		agent.averageRunTime = duration;
		agent.lastRunAt = new Date();
		agent.updatedAt = new Date();
		mockDb.agents.set(id, agent);
		return agent;
	}

	async updateMetrics(id: string, metrics: any) {
		const agent = mockDb.agents.get(id);
		if (!agent) throw new Error(`Agent ${id} not found`);

		agent.metrics = { ...agent.metrics, ...metrics };
		agent.updatedAt = new Date();
		mockDb.agents.set(id, agent);
		return agent;
	}
}

export class MockSessionRepository {
	async create(data: any) {
		const id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		const session = {
			id,
			...data,
			status: "active",
			totalTokens: 0,
			totalCost: 0,
			createdAt: new Date(),
			updatedAt: new Date(),
			endedAt: null,
		};
		mockDb.sessions.set(id, session);
		return session;
	}

	async findById(id: string) {
		return mockDb.sessions.get(id) || null;
	}

	async findByUser(userId: string) {
		return Array.from(mockDb.sessions.values()).filter(
			(session) => session.userId === userId,
		);
	}

	async updateTokenUsage(id: string, tokens: number, cost: number) {
		const session = mockDb.sessions.get(id);
		if (!session) throw new Error(`Session ${id} not found`);

		session.totalTokens = (session.totalTokens || 0) + tokens;
		session.totalCost = (session.totalCost || 0) + cost;
		session.updatedAt = new Date();
		mockDb.sessions.set(id, session);
		return session;
	}

	async endSession(id: string) {
		const session = mockDb.sessions.get(id);
		if (!session) throw new Error(`Session ${id} not found`);

		const endTime = new Date();
		session.status = "completed";
		session.endedAt = endTime;
		session.duration = endTime.getTime() - session.createdAt.getTime();
		session.updatedAt = endTime;
		mockDb.sessions.set(id, session);
		return session;
	}
}

export class MockMessageRepository {
	async create(data: any) {
		const id = `message_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		const message = {
			id,
			...data,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		mockDb.messages.set(id, message);
		return message;
	}

	async findById(id: string) {
		return mockDb.messages.get(id) || null;
	}

	async findBySession(sessionId: string) {
		return Array.from(mockDb.messages.values())
			.filter((message) => message.sessionId === sessionId)
			.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
	}

	async getSessionStats(sessionId: string) {
		const messages = Array.from(mockDb.messages.values()).filter(
			(message) => message.sessionId === sessionId,
		);

		const stats = {
			totalMessages: messages.length,
			totalTokens: messages.reduce((sum, msg) => sum + (msg.tokens || 0), 0),
			totalCost: messages.reduce((sum, msg) => sum + (msg.cost || 0), 0),
			messagesByRole: {
				user: messages.filter((msg) => msg.role === "user").length,
				assistant: messages.filter((msg) => msg.role === "assistant").length,
				system: messages.filter((msg) => msg.role === "system").length,
			},
		};

		return stats;
	}
}

export class MockMemoryRepository {
	async create(data: any) {
		const id = `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		const memory = {
			id,
			...data,
			frequency: 1,
			createdAt: new Date(),
			updatedAt: new Date(),
			lastAccessedAt: new Date(),
		};
		mockDb.memory.set(id, memory);
		return memory;
	}

	async findById(id: string) {
		return mockDb.memory.get(id) || null;
	}

	async findByKey(key: string) {
		for (const memory of mockDb.memory.values()) {
			if (memory.key === key) return memory;
		}
		return null;
	}

	async findByType(type: string, userId: string) {
		return Array.from(mockDb.memory.values()).filter(
			(memory) => memory.type === type && memory.userId === userId,
		);
	}

	async updateAccess(id: string) {
		const memory = mockDb.memory.get(id);
		if (!memory) throw new Error(`Memory ${id} not found`);

		memory.frequency = (memory.frequency || 0) + 1;
		memory.lastAccessedAt = new Date();
		memory.updatedAt = new Date();
		mockDb.memory.set(id, memory);
		return memory;
	}

	async search(query: string, userId: string) {
		return Array.from(mockDb.memory.values()).filter(
			(memory) =>
				memory.userId === userId &&
				(memory.summary?.includes(query) || memory.key?.includes(query)),
		);
	}
}

// Test setup functions
export async function setupTestDatabase() {
	// Clear all mock data
	Object.values(mockDb).forEach((map) => map.clear());
	return { testDb: mockDb, testSql: null };
}

export async function cleanupTestDatabase() {
	// Clear all mock data
	Object.values(mockDb).forEach((map) => map.clear());
}

export async function clearAllTables() {
	// Clear all mock data
	Object.values(mockDb).forEach((map) => map.clear());
}

export function createTestRepositories() {
	return {
		userRepository: new MockUserRepository(),
		projectRepository: new MockProjectRepository(),
		agentRepository: new MockAgentRepository(),
		sessionRepository: new MockSessionRepository(),
		messageRepository: new MockMessageRepository(),
		memoryRepository: new MockMemoryRepository(),
	};
}

export function getTestDb() {
	return mockDb;
}

export function getTestSql() {
	return null;
}

// Test data factories
export const testDataFactory = {
	createUser: (overrides: any = {}) => ({
		email: `test-${Date.now()}@example.com`,
		name: "Test User",
		isActive: true,
		preferences: {
			theme: "light",
			language: "en",
			timezone: "UTC",
		},
		...overrides,
	}),

	createProject: (ownerId: string, overrides: any = {}) => ({
		name: `Test Project ${Date.now()}`,
		path: `/test/project/${Date.now()}`,
		ownerId,
		description: "Test project description",
		...overrides,
	}),

	createAgent: (createdBy: string, overrides: any = {}) => ({
		name: `Test Agent ${Date.now()}`,
		type: "coder",
		config: {
			model: "gpt-4",
			temperature: 0.7,
			maxTokens: 4000,
			systemPrompt: "You are a helpful coding assistant",
			tools: ["code_editor", "terminal"],
			capabilities: ["coding", "debugging"],
			constraints: ["no_network_access"],
			hooks: {
				preTask: [],
				postTask: [],
				onError: [],
			},
		},
		metrics: {
			tokensUsed: 0,
			avgResponseTime: 0,
			userRating: 0,
			errorRate: 0,
		},
		createdBy,
		...overrides,
	}),

	createSession: (userId: string, overrides: any = {}) => ({
		title: `Test Session ${Date.now()}`,
		userId,
		...overrides,
	}),

	createMessage: (
		sessionId: string,
		sequenceNumber: number,
		overrides: any = {},
	) => ({
		sessionId,
		role: "user",
		content: "Test message content",
		sequenceNumber,
		tokens: 0,
		cost: 0,
		...overrides,
	}),

	createMemory: (overrides: any = {}) => ({
		key: `test-memory-${Date.now()}`,
		type: "user_preference",
		content: { test: "data" },
		summary: "Test memory summary",
		...overrides,
	}),
};
