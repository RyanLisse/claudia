import { and, eq, gte, ilike, or } from "drizzle-orm";
import {
	type Agent,
	agents,
	type Memory,
	type Message,
	memory,
	messages,
	type NewAgent,
	type NewMemory,
	type NewMessage,
	type NewProject,
	type NewSession,
	type NewUser,
	type Project,
	projects,
	type Session,
	sessions,
	type User,
	users,
} from "../schema";
import { BaseRepository } from "./base";

export class UserRepository extends BaseRepository<User, NewUser> {
	protected tableName = "users";
	protected table = users;

	async findByEmail(email: string): Promise<User | null> {
		const result = await this.findMany(eq(users.email, email), 1);
		return result[0] || null;
	}

	async findActive(): Promise<User[]> {
		return this.findMany(eq(users.isActive, true));
	}

	async updateLastActive(id: string): Promise<void> {
		await this.update(id, { lastActiveAt: new Date() });
	}

	async updatePreferences(
		id: string,
		preferences: Partial<User["preferences"]>,
	): Promise<User> {
		const user = await this.findById(id);
		if (!user) throw new Error("User not found");

		const updatedPreferences = { ...user.preferences, ...preferences };
		return this.update(id, { preferences: updatedPreferences });
	}
}

export class ProjectRepository extends BaseRepository<Project, NewProject> {
	protected tableName = "projects";
	protected table = projects;

	async findByOwner(ownerId: string): Promise<Project[]> {
		return this.findMany(eq(projects.ownerId, ownerId));
	}

	async findByCollaborator(_userId: string): Promise<Project[]> {
		// Note: This would need a proper JSONB query in production
		return this.findMany();
	}

	async findActive(): Promise<Project[]> {
		return this.findMany(
			and(eq(projects.status, "active"), eq(projects.isArchived, false)),
		);
	}

	async search(query: string, userId?: string): Promise<Project[]> {
		const conditions = [
			ilike(projects.name, `%${query}%`),
			ilike(projects.description, `%${query}%`),
		];

		if (userId) {
			conditions.push(eq(projects.ownerId, userId));
		}

		return this.findMany(or(...conditions));
	}

	async updateLastBuild(id: string): Promise<void> {
		await this.update(id, { lastBuildAt: new Date() });
	}

	async incrementSessions(id: string): Promise<void> {
		const project = await this.findById(id);
		if (project) {
			await this.update(id, { totalSessions: project.totalSessions + 1 });
		}
	}
}

export class AgentRepository extends BaseRepository<Agent, NewAgent> {
	protected tableName = "agents";
	protected table = agents;

	async findByType(type: string): Promise<Agent[]> {
		return this.findMany(eq(agents.type, type));
	}

	async findByProject(projectId: string): Promise<Agent[]> {
		return this.findMany(eq(agents.projectId, projectId));
	}

	async findByCreator(createdBy: string): Promise<Agent[]> {
		return this.findMany(eq(agents.createdBy, createdBy));
	}

	async findActive(): Promise<Agent[]> {
		return this.findMany(
			and(eq(agents.isActive, true), eq(agents.status, "active")),
		);
	}

	async findPublic(): Promise<Agent[]> {
		return this.findMany(
			and(eq(agents.isPublic, true), eq(agents.isActive, true)),
		);
	}

	async updateStatus(id: string, status: string): Promise<Agent> {
		return this.update(id, { status });
	}

	async updateLastRun(
		id: string,
		success: boolean,
		runTime: number,
	): Promise<void> {
		const agent = await this.findById(id);
		if (!agent) return;

		const totalRuns = agent.totalRuns + 1;
		const successfulRuns = success
			? agent.successfulRuns + 1
			: agent.successfulRuns;
		const averageRunTime = Math.round(
			(agent.averageRunTime * agent.totalRuns + runTime) / totalRuns,
		);

		await this.update(id, {
			totalRuns,
			successfulRuns,
			averageRunTime,
			lastRunAt: new Date(),
		});
	}

	async updateMetrics(
		id: string,
		metrics: Partial<Agent["metrics"]>,
	): Promise<Agent> {
		const agent = await this.findById(id);
		if (!agent) throw new Error("Agent not found");

		const updatedMetrics = { ...agent.metrics, ...metrics };
		return this.update(id, { metrics: updatedMetrics });
	}
}

export class SessionRepository extends BaseRepository<Session, NewSession> {
	protected tableName = "sessions";
	protected table = sessions;

	async findByUser(userId: string, limit?: number): Promise<Session[]> {
		return this.findMany(eq(sessions.userId, userId), limit);
	}

	async findByProject(projectId: string): Promise<Session[]> {
		return this.findMany(eq(sessions.projectId, projectId));
	}

	async findByAgent(agentId: string): Promise<Session[]> {
		return this.findMany(eq(sessions.agentId, agentId));
	}

	async findActive(): Promise<Session[]> {
		return this.findMany(eq(sessions.status, "active"));
	}

	async findRecent(userId?: string, days = 7): Promise<Session[]> {
		const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

		const conditions = [gte(sessions.createdAt, since)];
		if (userId) {
			conditions.push(eq(sessions.userId, userId));
		}

		return this.findMany(and(...conditions));
	}

	async updateActivity(id: string): Promise<void> {
		await this.update(id, { lastActivityAt: new Date() });
	}

	async updateTokenUsage(
		id: string,
		tokens: number,
		cost: number,
	): Promise<void> {
		const session = await this.findById(id);
		if (session) {
			await this.update(id, {
				totalTokens: session.totalTokens + tokens,
				totalCost: session.totalCost + cost,
			});
		}
	}

	async endSession(id: string): Promise<Session> {
		const session = await this.findById(id);
		if (!session) throw new Error("Session not found");

		const duration = Date.now() - session.startedAt.getTime();

		return this.update(id, {
			status: "completed",
			endedAt: new Date(),
			duration,
		});
	}
}

export class MessageRepository extends BaseRepository<Message, NewMessage> {
	protected tableName = "messages";
	protected table = messages;

	async findBySession(sessionId: string, limit?: number): Promise<Message[]> {
		const query = this.findMany(eq(messages.sessionId, sessionId), limit);

		// Order by sequence number
		return query;
	}

	async findByRole(sessionId: string, role: string): Promise<Message[]> {
		return this.findMany(
			and(eq(messages.sessionId, sessionId), eq(messages.role, role)),
		);
	}

	async getLastMessage(sessionId: string): Promise<Message | null> {
		const result = await this.findMany(eq(messages.sessionId, sessionId), 1);

		return result[0] || null;
	}

	async getMessageThread(
		sessionId: string,
		parentMessageId?: string,
	): Promise<Message[]> {
		if (parentMessageId) {
			return this.findMany(eq(messages.parentMessageId, parentMessageId));
		}

		return this.findBySession(sessionId);
	}

	async getSessionStats(sessionId: string): Promise<{
		totalMessages: number;
		totalTokens: number;
		totalCost: number;
		messagesByRole: Record<string, number>;
	}> {
		const messages = await this.findBySession(sessionId);

		const stats = {
			totalMessages: messages.length,
			totalTokens: messages.reduce((sum, m) => sum + (m.tokens || 0), 0),
			totalCost: messages.reduce((sum, m) => sum + (m.cost || 0), 0),
			messagesByRole: {} as Record<string, number>,
		};

		messages.forEach((message) => {
			stats.messagesByRole[message.role] =
				(stats.messagesByRole[message.role] || 0) + 1;
		});

		return stats;
	}
}

export class MemoryRepository extends BaseRepository<Memory, NewMemory> {
	protected tableName = "memory";
	protected table = memory;

	async findByKey(key: string): Promise<Memory | null> {
		const result = await this.findMany(eq(memory.key, key), 1);
		return result[0] || null;
	}

	async findByType(type: string, userId?: string): Promise<Memory[]> {
		const conditions = [eq(memory.type, type)];
		if (userId) {
			conditions.push(eq(memory.userId, userId));
		}

		return this.findMany(and(...conditions));
	}

	async findByUser(userId: string): Promise<Memory[]> {
		return this.findMany(eq(memory.userId, userId));
	}

	async findByProject(projectId: string): Promise<Memory[]> {
		return this.findMany(eq(memory.projectId, projectId));
	}

	async findBySession(sessionId: string): Promise<Memory[]> {
		return this.findMany(eq(memory.sessionId, sessionId));
	}

	async findByTags(_tags: string[], userId?: string): Promise<Memory[]> {
		// Note: This would need proper JSONB array query in production
		const conditions = [];
		if (userId) {
			conditions.push(eq(memory.userId, userId));
		}

		return this.findMany(
			conditions.length > 0 ? and(...conditions) : undefined,
		);
	}

	async findByImportance(
		minImportance: number,
		userId?: string,
	): Promise<Memory[]> {
		const conditions = [gte(memory.importance, minImportance)];
		if (userId) {
			conditions.push(eq(memory.userId, userId));
		}

		return this.findMany(and(...conditions));
	}

	async updateAccess(id: string): Promise<void> {
		const mem = await this.findById(id);
		if (mem) {
			await this.update(id, {
				frequency: mem.frequency + 1,
				lastAccessedAt: new Date(),
			});
		}
	}

	async search(query: string, userId?: string): Promise<Memory[]> {
		const conditions = [
			or(ilike(memory.key, `%${query}%`), ilike(memory.summary, `%${query}%`)),
		];

		if (userId) {
			conditions.push(eq(memory.userId, userId));
		}

		return this.findMany(and(...conditions));
	}

	async cleanupExpired(): Promise<number> {
		const _now = new Date();
		// This would need a proper delete query in production
		return 0; // Placeholder
	}
}

// Export repository instances
export const userRepository = new UserRepository();
export const projectRepository = new ProjectRepository();
export const agentRepository = new AgentRepository();
export const sessionRepository = new SessionRepository();
export const messageRepository = new MessageRepository();
export const memoryRepository = new MemoryRepository();
