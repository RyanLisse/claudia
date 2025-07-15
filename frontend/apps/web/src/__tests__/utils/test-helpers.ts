import { type RenderOptions, render } from "@testing-library/react";
import React, { type ReactElement } from "react";
import { vi } from "vitest";

// Mock providers for testing
export const createMockProvider = (props: any = {}) => {
	return ({ children }: { children: React.ReactNode }) =>
		React.createElement(
			"div",
			{ "data-testid": "mock-provider", ...props },
			children,
		);
};

// Custom render function with providers
export const renderWithProviders = (
	ui: ReactElement,
	options?: Omit<RenderOptions, "wrapper">,
) => {
	const AllTheProviders = createMockProvider();

	return render(ui, { wrapper: AllTheProviders, ...options });
};

// Mock Tauri invoke with custom responses
export const mockTauriInvoke = (responses: Record<string, any>) => {
	// Create a mock function for Tauri invoke
	const mockInvoke = vi.fn((command: string, args?: any) => {
		if (responses[command]) {
			if (typeof responses[command] === "function") {
				return Promise.resolve(responses[command](args));
			}
			return Promise.resolve(responses[command]);
		}
		return Promise.reject(new Error(`Mock not found for command: ${command}`));
	});

	// Mock the entire module
	vi.doMock("@tauri-apps/api/core", () => ({
		invoke: mockInvoke,
	}));

	return mockInvoke;
};

// Helper to get the mocked invoke function for direct use
export const getMockedInvoke = async () => {
	const { invoke } = await import("@tauri-apps/api/core");
	return vi.mocked(invoke);
};

// Test data factories
export const createMockSession = (overrides: any = {}) => ({
	id:
		overrides.id ||
		`test-session-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
	name: "Test Session",
	status: "active",
	createdAt: new Date().toISOString(),
	messages: [],
	...overrides,
});

export const createMockAgent = (overrides: any = {}) => ({
	id: "test-agent-1",
	name: "Test Agent",
	type: "researcher",
	status: "active",
	capabilities: ["research", "analysis"],
	...overrides,
});

export const createMockProject = (overrides: any = {}) => ({
	id: "test-project-1",
	name: "Test Project",
	path: "/test/path",
	type: "javascript",
	...overrides,
});

// Async testing utilities
export const waitForElement = async (
	getElement: () => Element | null,
	timeout = 5000,
): Promise<Element> => {
	const start = Date.now();

	while (Date.now() - start < timeout) {
		const element = getElement();
		if (element) return element;
		await new Promise((resolve) => setTimeout(resolve, 10));
	}

	throw new Error("Element not found within timeout");
};

// Event simulation helpers
export const simulateKeyPress = (element: Element, key: string) => {
	const event = new KeyboardEvent("keydown", { key });
	element.dispatchEvent(event);
};

export const simulateFileUpload = (input: HTMLInputElement, file: File) => {
	const dt = new DataTransfer();
	dt.items.add(file);
	input.files = dt.files;

	const event = new Event("change", { bubbles: true });
	input.dispatchEvent(event);
};

// Performance testing utilities
export const measurePerformance = async (fn: () => Promise<void> | void) => {
	const start = performance.now();
	await fn();
	const end = performance.now();
	return end - start;
};

// Database testing utilities (for integration tests)
export const createTestDatabase = () => {
	const data: any[] = [];

	return {
		insert: vi.fn((item: any) => {
			data.push(item);
			return item;
		}),
		update: vi.fn((updateData: any) => {
			const index = data.findIndex((item) => item.id === updateData.id);
			if (index >= 0) {
				data[index] = { ...data[index], ...updateData };
				return data[index];
			}
			return updateData;
		}),
		delete: vi.fn((id: string) => {
			const index = data.findIndex((item) => item.id === id);
			if (index >= 0) {
				data.splice(index, 1);
				return true;
			}
			return false;
		}),
		select: vi.fn(() => [...data]),
		clear: vi.fn(() => {
			data.length = 0;
		}),
		data, // for direct access in tests
	};
};

// API testing utilities
export const createMockResponse = (data: any, status = 200) => ({
	ok: status >= 200 && status < 300,
	status,
	json: () => Promise.resolve(data),
	text: () => Promise.resolve(JSON.stringify(data)),
});

// Enhanced API utilities - import from dedicated mocks
import {
	expectApiCall,
	setupApiMocks,
	waitForApiCall,
} from "../mocks/api-services";
import { setupInngestMocks } from "../mocks/inngest";

// Re-export for convenience
export { setupApiMocks, expectApiCall, waitForApiCall, setupInngestMocks };

// Environment setup for API tests
export const setupApiTestEnvironment = () => {
	// Set up all required environment variables
	process.env.INNGEST_EVENT_KEY = "test-event-key";
	process.env.INNGEST_SIGNING_KEY = "test-signing-key";
	process.env.INNGEST_BASE_URL = "http://localhost:3000/api/inngest";
	process.env.NEXT_PUBLIC_SERVER_URL = "http://localhost:3000";
	process.env.DATABASE_URL = "file:./test.db";
	process.env.NODE_ENV = "test";

	// Mock all external services
	const apiMocks = setupApiMocks();
	const inngestMocks = setupInngestMocks();

	return {
		...apiMocks,
		...inngestMocks,
	};
};

// Component testing utilities
export const getByTestId = (container: Element, testId: string) => {
	const element = container.querySelector(`[data-testid="${testId}"]`);
	if (!element) {
		throw new Error(`Element with data-testid="${testId}" not found`);
	}
	return element;
};

// Error boundary testing
export const triggerError = (component: any, error: Error) => {
	const spy = vi.spyOn(console, "error").mockImplementation(() => {});
	try {
		throw error;
	} finally {
		spy.mockRestore();
	}
};

export * from "@testing-library/react";
export { vi };
