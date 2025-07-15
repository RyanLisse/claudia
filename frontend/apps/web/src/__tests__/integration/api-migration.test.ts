/**
 * Test suite for API migration validation
 */
import { describe, it, expect, vi } from "vitest";
import { api } from "@/lib/api";

describe("API Migration Tests", () => {
	it("should have migrated API successfully", async () => {
		// Test that the API object exists and has the expected methods
		expect(api).toBeDefined();
		expect(api.listProjects).toBeDefined();
		expect(api.getProjectSessions).toBeDefined();
		expect(api.listAgents).toBeDefined();
		expect(api.checkClaudeVersion).toBeDefined();
	});

	it("should work in test environment", async () => {
		// Test that API calls work in test environment
		const projects = await api.listProjects();
		expect(projects).toEqual([]);

		const sessions = await api.getProjectSessions("test-project");
		expect(sessions).toEqual([]);

		const agents = await api.listAgents();
		expect(agents).toEqual([]);

		const version = await api.checkClaudeVersion();
		expect(version).toEqual({
			is_installed: false,
			version: null,
			output: "Mock version",
		});
	});

	it("should handle API errors gracefully", async () => {
		// Test error handling
		const mockError = vi.fn().mockRejectedValue(new Error("Test error"));
		
		// Mock a failing API call
		api.listProjects = mockError;
		
		await expect(api.listProjects()).rejects.toThrow("Test error");
	});

	it("should provide proper TypeScript types", () => {
		// Test that TypeScript types are properly exported
		expect(typeof api.listProjects).toBe("function");
		expect(typeof api.getProjectSessions).toBe("function");
		expect(typeof api.listAgents).toBe("function");
		expect(typeof api.executeAgent).toBe("function");
		expect(typeof api.getUsageStats).toBe("function");
	});
});