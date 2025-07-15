/**
 * Test data fixtures for E2E tests
 */

export const testUsers = {
	admin: {
		email: "admin@test.com",
		password: "admin123",
		name: "Admin User",
	},
	user: {
		email: "user@test.com",
		password: "user123",
		name: "Test User",
	},
} as const;

export const testProjects = {
	basic: {
		name: "Test Project",
		description: "A test project for E2E testing",
		type: "web",
	},
	advanced: {
		name: "Advanced Project",
		description: "An advanced project with complex features",
		type: "api",
	},
} as const;

export const testAgents = {
	researcher: {
		name: "Research Agent",
		type: "researcher",
		description: "Agent for research tasks",
	},
	coder: {
		name: "Coding Agent",
		type: "coder",
		description: "Agent for coding tasks",
	},
} as const;

export const testMessages = {
	simple: "Hello, this is a test message",
	complex:
		"This is a more complex message with multiple lines\nand special characters: !@#$%^&*()",
	longText:
		"This is a very long message that should test the limits of the message input field and ensure that it handles long text properly without breaking the UI or causing any issues with the backend processing.",
} as const;

export const apiEndpoints = {
	auth: {
		login: "/api/auth/login",
		logout: "/api/auth/logout",
		register: "/api/auth/register",
	},
	projects: {
		create: "/api/projects/create",
		list: "/api/projects/list",
		delete: "/api/projects/delete",
	},
	agents: {
		create: "/api/agents/create",
		list: "/api/agents/list",
		delete: "/api/agents/delete",
	},
} as const;
