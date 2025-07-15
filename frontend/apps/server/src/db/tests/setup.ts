import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "../schema";

// Test database configuration
const TEST_DATABASE_URL =
	process.env.TEST_DATABASE_URL ||
	"postgresql://test:test@localhost:5432/claudia_test";

let testDb: ReturnType<typeof drizzle>;
let testSql: postgres.Sql;

export async function setupTestDatabase() {
	// Create connection to test database
	testSql = postgres(TEST_DATABASE_URL, {
		max: 1,
		onnotice: () => {
			/* Suppress notices in tests */
		}, // Suppress notices in tests
	});

	testDb = drizzle(testSql, { schema });

	// Run migrations
	await migrate(testDb, { migrationsFolder: "./src/db/migrations" });

	return { testDb, testSql };
}

export async function cleanupTestDatabase() {
	if (testSql) {
		await testSql.end();
	}
}

export async function clearAllTables() {
	if (!testDb) return;

	// Clear tables in reverse dependency order
	await testDb.delete(schema.messages);
	await testDb.delete(schema.memory);
	await testDb.delete(schema.sessions);
	await testDb.delete(schema.agents);
	await testDb.delete(schema.projects);
	await testDb.delete(schema.users);
	await testDb.delete(schema.syncEvents);
	await testDb.delete(schema.syncConflicts);
	await testDb.delete(schema.syncMetrics);
}

export function getTestDb() {
	return testDb;
}

export function getTestSql() {
	return testSql;
}

// Test data factories
export const testDataFactory = {
	createUser: (overrides: Partial<schema.NewUser> = {}): schema.NewUser => ({
		email: `test-${Date.now()}@example.com`,
		name: "Test User",
		...overrides,
	}),

	createProject: (
		ownerId: string,
		overrides: Partial<schema.NewProject> = {},
	): schema.NewProject => ({
		name: `Test Project ${Date.now()}`,
		path: `/test/project/${Date.now()}`,
		ownerId,
		...overrides,
	}),

	createAgent: (
		createdBy: string,
		overrides: Partial<schema.NewAgent> = {},
	): schema.NewAgent => ({
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
		createdBy,
		...overrides,
	}),

	createSession: (
		userId: string,
		overrides: Partial<schema.NewSession> = {},
	): schema.NewSession => ({
		title: `Test Session ${Date.now()}`,
		userId,
		...overrides,
	}),

	createMessage: (
		sessionId: string,
		sequenceNumber: number,
		overrides: Partial<schema.NewMessage> = {},
	): schema.NewMessage => ({
		sessionId,
		role: "user",
		content: "Test message content",
		sequenceNumber,
		...overrides,
	}),

	createMemory: (
		overrides: Partial<schema.NewMemory> = {},
	): schema.NewMemory => ({
		key: `test-memory-${Date.now()}`,
		type: "user_preference",
		content: { test: "data" },
		...overrides,
	}),
};

// Test utilities
export class TestTimer {
	private startTime = 0;

	start(): void {
		this.startTime = Date.now();
	}

	stop(): number {
		return Date.now() - this.startTime;
	}
}

export async function waitFor(
	condition: () => Promise<boolean>,
	timeoutMs = 5000,
): Promise<void> {
	const startTime = Date.now();

	while (Date.now() - startTime < timeoutMs) {
		if (await condition()) {
			return;
		}
		await new Promise((resolve) => setTimeout(resolve, 100));
	}

	throw new Error(`Timeout waiting for condition after ${timeoutMs}ms`);
}

export function createMockSyncEvent(
	tableName: string,
	recordId: string,
	operation: "insert" | "update" | "delete",
) {
	return {
		eventType: operation,
		tableName,
		recordId,
		operation,
		syncVersion: `test_${Date.now()}`,
		clientId: "test-client",
		status: "pending" as const,
		newData: operation !== "delete" ? { id: recordId, test: "data" } : null,
		oldData: operation !== "insert" ? { id: recordId, test: "old_data" } : null,
	};
}
