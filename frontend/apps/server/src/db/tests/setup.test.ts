import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cleanupTestDatabase, setupTestDatabase } from "./setup";

describe("Database Setup", () => {
	beforeAll(async () => {});

	afterAll(async () => {
		await cleanupTestDatabase();
	});

	it("should connect to Neon database successfully", async () => {
		const result = await setupTestDatabase();

		expect(result).toBeDefined();
		expect(result.testDb).toBeDefined();
		expect(result.testSql).toBeDefined();
	});

	it("should have required tables after setup", async () => {
		const { testSql } = await setupTestDatabase();

		// Check that messages table exists
		const tables = await testSql.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'messages'
    `);

		expect(tables.length).toBeGreaterThan(0);
		expect(tables[0].table_name).toBe("messages");
	});
});
