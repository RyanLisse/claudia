/**
 * Mock API services for integration testing
 */
import { vi } from "vitest";

// Mock fetch responses
export const createMockResponse = (
	data: any,
	status = 200,
	headers: Record<string, string> = {},
) => {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			"Content-Type": "application/json",
			...headers,
		},
	});
};

// Mock API endpoints
export const createMockApiEndpoints = () => ({
	// Agent endpoints
	"/api/agents": {
		GET: () =>
			createMockResponse([
				{ id: "agent-1", name: "Coder Agent", type: "coder", status: "active" },
				{
					id: "agent-2",
					name: "Researcher Agent",
					type: "researcher",
					status: "active",
				},
			]),
		POST: (data: any) =>
			createMockResponse({
				id: `agent-${Date.now()}`,
				...data,
				status: "active",
				createdAt: new Date().toISOString(),
			}),
	},

	// Task endpoints
	"/api/tasks": {
		GET: () =>
			createMockResponse([
				{ id: "task-1", type: "code-generation", status: "completed" },
				{ id: "task-2", type: "testing", status: "in_progress" },
			]),
		POST: (data: any) =>
			createMockResponse({
				id: `task-${Date.now()}`,
				...data,
				status: "pending",
				createdAt: new Date().toISOString(),
			}),
	},

	// Inngest endpoints
	"/api/inngest": {
		GET: () => createMockResponse({ message: "Inngest webhook endpoint" }),
		POST: (data: any) =>
			createMockResponse({
				event: data.name,
				id: `evt_${Date.now()}`,
				received: true,
			}),
		PUT: (data: any) =>
			createMockResponse({
				event: data.name,
				id: `evt_${Date.now()}`,
				received: true,
			}),
	},

	// Session endpoints
	"/api/sessions": {
		GET: () =>
			createMockResponse([
				{ id: "session-1", name: "Test Session", status: "active" },
			]),
		POST: (data: any) =>
			createMockResponse({
				id: `session-${Date.now()}`,
				...data,
				status: "active",
				createdAt: new Date().toISOString(),
			}),
	},

	// Health check endpoints
	"/api/health": {
		GET: () =>
			createMockResponse({
				status: "healthy",
				timestamp: new Date().toISOString(),
				services: {
					database: "healthy",
					inngest: "healthy",
					agents: "healthy",
				},
			}),
	},
});

// Mock fetch implementation
export const createMockFetch = (endpoints = createMockApiEndpoints()) => {
	return vi
		.fn()
		.mockImplementation(
			async (url: string | Request, options: RequestInit = {}) => {
				const urlString = typeof url === "string" ? url : url.url;
				const method = options.method || "GET";
				const body = options.body
					? JSON.parse(options.body as string)
					: undefined;

				// Remove base URL and query params for endpoint matching
				const pathname = new URL(urlString, "http://localhost").pathname;

				const endpoint = endpoints[pathname];
				if (!endpoint) {
					return createMockResponse(
						{ error: `Endpoint not found: ${pathname}` },
						404,
					);
				}

				const handler = endpoint[method as keyof typeof endpoint];
				if (!handler) {
					return createMockResponse(
						{ error: `Method not allowed: ${method}` },
						405,
					);
				}

				return handler(body);
			},
		);
};

// Mock HTTP client
export const createMockHttpClient = () => {
	const mockFetch = createMockFetch();

	return {
		get: vi.fn().mockImplementation(async (url: string) => {
			const response = await mockFetch(url);
			return response.json();
		}),
		post: vi.fn().mockImplementation(async (url: string, data: any) => {
			const response = await mockFetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});
			return response.json();
		}),
		put: vi.fn().mockImplementation(async (url: string, data: any) => {
			const response = await mockFetch(url, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});
			return response.json();
		}),
		delete: vi.fn().mockImplementation(async (url: string) => {
			const response = await mockFetch(url, { method: "DELETE" });
			return response.json();
		}),
	};
};

// Mock WebSocket for real-time updates
export const createMockWebSocket = () => {
	const mockWs = {
		send: vi.fn(),
		close: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
		readyState: 1, // OPEN
		url: "ws://localhost:3000/ws",
		protocol: "",
		bufferedAmount: 0,
		extensions: "",
		binaryType: "blob" as BinaryType,
		onopen: null,
		onclose: null,
		onerror: null,
		onmessage: null,
		CONNECTING: 0,
		OPEN: 1,
		CLOSING: 2,
		CLOSED: 3,
	};

	// Helper to simulate receiving messages
	const simulateMessage = (data: any) => {
		const event = new MessageEvent("message", {
			data: JSON.stringify(data),
		});
		if (mockWs.onmessage) {
			mockWs.onmessage(event);
		}
	};

	return { mockWs, simulateMessage };
};

// Mock authentication service
export const createMockAuthService = () => ({
	login: vi.fn().mockResolvedValue({
		user: { id: "user-1", email: "test@example.com" },
		token: "mock-jwt-token",
		expiresAt: new Date(Date.now() + 3600000).toISOString(),
	}),
	logout: vi.fn().mockResolvedValue(true),
	refreshToken: vi.fn().mockResolvedValue({
		token: "refreshed-jwt-token",
		expiresAt: new Date(Date.now() + 3600000).toISOString(),
	}),
	getCurrentUser: vi.fn().mockResolvedValue({
		id: "user-1",
		email: "test@example.com",
		name: "Test User",
	}),
	isAuthenticated: vi.fn().mockReturnValue(true),
});

// Mock tRPC client
export const createMockTrpcClient = () => ({
	agents: {
		list: vi.fn().mockResolvedValue([
			{ id: "agent-1", name: "Coder Agent", type: "coder" },
			{ id: "agent-2", name: "Researcher Agent", type: "researcher" },
		]),
		create: vi.fn().mockImplementation(async (data: any) => ({
			id: `agent-${Date.now()}`,
			...data,
			status: "active",
			createdAt: new Date().toISOString(),
		})),
		update: vi.fn().mockImplementation(async (data: any) => ({
			...data,
			updatedAt: new Date().toISOString(),
		})),
		delete: vi.fn().mockResolvedValue(true),
	},
	tasks: {
		list: vi.fn().mockResolvedValue([
			{ id: "task-1", type: "code-generation", status: "completed" },
			{ id: "task-2", type: "testing", status: "in_progress" },
		]),
		create: vi.fn().mockImplementation(async (data: any) => ({
			id: `task-${Date.now()}`,
			...data,
			status: "pending",
			createdAt: new Date().toISOString(),
		})),
		update: vi.fn().mockImplementation(async (data: any) => ({
			...data,
			updatedAt: new Date().toISOString(),
		})),
		cancel: vi.fn().mockResolvedValue(true),
	},
	sessions: {
		list: vi
			.fn()
			.mockResolvedValue([
				{ id: "session-1", name: "Test Session", status: "active" },
			]),
		create: vi.fn().mockImplementation(async (data: any) => ({
			id: `session-${Date.now()}`,
			...data,
			status: "active",
			createdAt: new Date().toISOString(),
		})),
		update: vi.fn().mockImplementation(async (data: any) => ({
			...data,
			updatedAt: new Date().toISOString(),
		})),
		delete: vi.fn().mockResolvedValue(true),
	},
});

// Mock Electric SQL client
export const createMockElectricClient = () => ({
	db: {
		agents: {
			findMany: vi
				.fn()
				.mockResolvedValue([
					{ id: "agent-1", name: "Coder Agent", type: "coder" },
				]),
			create: vi.fn().mockImplementation(async (data: any) => ({
				id: `agent-${Date.now()}`,
				...data.data,
				createdAt: new Date().toISOString(),
			})),
			update: vi.fn().mockImplementation(async (data: any) => ({
				...data.data,
				updatedAt: new Date().toISOString(),
			})),
			delete: vi.fn().mockResolvedValue(true),
		},
		tasks: {
			findMany: vi
				.fn()
				.mockResolvedValue([
					{ id: "task-1", type: "code-generation", status: "completed" },
				]),
			create: vi.fn().mockImplementation(async (data: any) => ({
				id: `task-${Date.now()}`,
				...data.data,
				createdAt: new Date().toISOString(),
			})),
			update: vi.fn().mockImplementation(async (data: any) => ({
				...data.data,
				updatedAt: new Date().toISOString(),
			})),
			delete: vi.fn().mockResolvedValue(true),
		},
		sessions: {
			findMany: vi
				.fn()
				.mockResolvedValue([
					{ id: "session-1", name: "Test Session", status: "active" },
				]),
			create: vi.fn().mockImplementation(async (data: any) => ({
				id: `session-${Date.now()}`,
				...data.data,
				createdAt: new Date().toISOString(),
			})),
			update: vi.fn().mockImplementation(async (data: any) => ({
				...data.data,
				updatedAt: new Date().toISOString(),
			})),
			delete: vi.fn().mockResolvedValue(true),
		},
	},
	sync: {
		start: vi.fn().mockResolvedValue(true),
		stop: vi.fn().mockResolvedValue(true),
		status: vi.fn().mockReturnValue("connected"),
	},
});

// Mock error scenarios
export const createMockErrorScenarios = () => ({
	networkError: () => {
		throw new Error("Network request failed");
	},
	authError: () => createMockResponse({ error: "Unauthorized" }, 401),
	validationError: () =>
		createMockResponse(
			{
				error: "Validation failed",
				details: { field: "name", message: "Name is required" },
			},
			400,
		),
	serverError: () =>
		createMockResponse({ error: "Internal server error" }, 500),
	rateLimitError: () =>
		createMockResponse(
			{
				error: "Rate limit exceeded",
				retryAfter: 60,
			},
			429,
		),
});

// Setup function for API mocks
export const setupApiMocks = () => {
	const mockFetch = createMockFetch();
	const mockHttpClient = createMockHttpClient();
	const mockAuthService = createMockAuthService();
	const mockTrpcClient = createMockTrpcClient();
	const mockElectricClient = createMockElectricClient();
	const { mockWs, simulateMessage } = createMockWebSocket();

	// Mock global fetch
	global.fetch = mockFetch;

	// Mock WebSocket
	global.WebSocket = vi.fn().mockImplementation(() => mockWs);

	return {
		mockFetch,
		mockHttpClient,
		mockAuthService,
		mockTrpcClient,
		mockElectricClient,
		mockWs,
		simulateMessage,
		errorScenarios: createMockErrorScenarios(),
	};
};

// Test utilities
export const waitForApiCall = async (mockFn: any, timeout = 5000) => {
	const start = Date.now();
	while (Date.now() - start < timeout) {
		if (mockFn.mock.calls.length > 0) {
			return mockFn.mock.calls[0];
		}
		await new Promise((resolve) => setTimeout(resolve, 10));
	}
	throw new Error(`API call not made within ${timeout}ms`);
};

export const expectApiCall = (
	mockFn: any,
	expectedUrl: string,
	expectedData?: any,
) => {
	expect(mockFn).toHaveBeenCalled();
	const [url, options] = mockFn.mock.calls[0];
	expect(url).toBe(expectedUrl);
	if (expectedData) {
		expect(JSON.parse(options.body)).toEqual(expectedData);
	}
};
