import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { vi } from "vitest";
import * as schema from "../schema";

// Mock database for tests
const sqlite = new Database(":memory:");
export const db = drizzle(sqlite, { schema });

// Mock Electric SQL to prevent wa-sqlite import issues
vi.mock("electric-sql", () => ({
	electrify: vi.fn().mockResolvedValue({
		db: {
			users: {
				findMany: vi.fn().mockResolvedValue([]),
				create: vi.fn().mockResolvedValue({ id: 1, name: "Test User" }),
				update: vi.fn().mockResolvedValue({ id: 1, name: "Updated User" }),
				delete: vi.fn().mockResolvedValue({ count: 1 }),
			},
			projects: {
				findMany: vi.fn().mockResolvedValue([]),
				create: vi.fn().mockResolvedValue({ id: 1, name: "Test Project" }),
				update: vi.fn().mockResolvedValue({ id: 1, name: "Updated Project" }),
				delete: vi.fn().mockResolvedValue({ count: 1 }),
			},
			agents: {
				findMany: vi.fn().mockResolvedValue([]),
				create: vi.fn().mockResolvedValue({ id: 1, name: "Test Agent" }),
				update: vi.fn().mockResolvedValue({ id: 1, name: "Updated Agent" }),
				delete: vi.fn().mockResolvedValue({ count: 1 }),
			},
			sessions: {
				findMany: vi.fn().mockResolvedValue([]),
				create: vi.fn().mockResolvedValue({ id: 1, title: "Test Session" }),
				update: vi.fn().mockResolvedValue({ id: 1, title: "Updated Session" }),
				delete: vi.fn().mockResolvedValue({ count: 1 }),
			},
			messages: {
				findMany: vi.fn().mockResolvedValue([]),
				create: vi.fn().mockResolvedValue({ id: 1, content: "Test Message" }),
				update: vi
					.fn()
					.mockResolvedValue({ id: 1, content: "Updated Message" }),
				delete: vi.fn().mockResolvedValue({ count: 1 }),
			},
			memory: {
				findMany: vi.fn().mockResolvedValue([]),
				create: vi.fn().mockResolvedValue({ id: 1, key: "test-key" }),
				update: vi.fn().mockResolvedValue({ id: 1, key: "updated-key" }),
				delete: vi.fn().mockResolvedValue({ count: 1 }),
			},
			sync: {
				findMany: vi.fn().mockResolvedValue([]),
				create: vi.fn().mockResolvedValue({ id: 1, table: "test-table" }),
				update: vi.fn().mockResolvedValue({ id: 1, table: "updated-table" }),
				delete: vi.fn().mockResolvedValue({ count: 1 }),
			},
		},
		sync: {
			start: vi.fn().mockResolvedValue(undefined),
			stop: vi.fn().mockResolvedValue(undefined),
			syncTable: vi.fn().mockResolvedValue(undefined),
		},
		connect: vi.fn().mockResolvedValue(undefined),
		disconnect: vi.fn().mockResolvedValue(undefined),
	}),
	Electric: vi.fn().mockImplementation(() => ({
		db: {
			users: {
				findMany: vi.fn().mockResolvedValue([]),
				create: vi.fn().mockResolvedValue({ id: 1, name: "Test User" }),
				update: vi.fn().mockResolvedValue({ id: 1, name: "Updated User" }),
				delete: vi.fn().mockResolvedValue({ count: 1 }),
			},
		},
		sync: {
			start: vi.fn().mockResolvedValue(undefined),
			stop: vi.fn().mockResolvedValue(undefined),
		},
		connect: vi.fn().mockResolvedValue(undefined),
		disconnect: vi.fn().mockResolvedValue(undefined),
	})),
}));

// Mock wa-sqlite to prevent import errors
vi.mock("wa-sqlite", () => ({
	default: vi.fn().mockResolvedValue({
		open: vi.fn().mockResolvedValue({
			exec: vi.fn().mockResolvedValue(undefined),
			prepare: vi.fn().mockResolvedValue({
				run: vi.fn().mockResolvedValue(undefined),
				all: vi.fn().mockResolvedValue([]),
				get: vi.fn().mockResolvedValue(undefined),
				finalize: vi.fn().mockResolvedValue(undefined),
			}),
			close: vi.fn().mockResolvedValue(undefined),
		}),
	}),
}));

// Mock bun:test to prevent externalization issues
vi.mock("bun:test", () => ({
	test: vi.fn(),
	describe: vi.fn(),
	it: vi.fn(),
	expect: vi.fn(),
	beforeEach: vi.fn(),
	afterEach: vi.fn(),
	beforeAll: vi.fn(),
	afterAll: vi.fn(),
}));

// Mock environment variables
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "file:./test.db";
process.env.ELECTRIC_URL = "http://localhost:5133";
process.env.ELECTRIC_DATABASE_URL =
	"postgresql://postgres:password@localhost:5432/test";

// Clear mocks before each test
vi.clearAllMocks();

// Mock console to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
console.error = (...args) => {
	if (args[0]?.includes?.("wa-sqlite") || args[0]?.includes?.("electric-sql"))
		return;
	originalConsoleError.call(console, ...args);
};
console.warn = (...args) => {
	if (args[0]?.includes?.("wa-sqlite") || args[0]?.includes?.("electric-sql"))
		return;
	originalConsoleWarn.call(console, ...args);
};
