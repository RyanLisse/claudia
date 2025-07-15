import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import React from "react";
import { afterEach, vi } from "vitest";

// Make React available globally for JSX
global.React = React;

// Cleanup DOM after each test
afterEach(() => {
	cleanup();
});

// Mock Next.js router
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
		prefetch: vi.fn(),
		back: vi.fn(),
		forward: vi.fn(),
		refresh: vi.fn(),
	}),
	useSearchParams: () => new URLSearchParams(),
	usePathname: () => "/",
}));

// Mock Next.js image component
vi.mock("next/image", () => ({
	default: (props: any) => {
		// eslint-disable-next-line @next/next/no-img-element
		return React.createElement("img", props);
	},
}));

// Mock environment variables
process.env.NODE_ENV = "test";

// Setup global test environment
Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: vi.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(), // deprecated
		removeListener: vi.fn(), // deprecated
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage only if it doesn't exist
if (!window.localStorage) {
	Object.defineProperty(window, "localStorage", {
		value: {
			getItem: vi.fn(),
			setItem: vi.fn(),
			removeItem: vi.fn(),
			clear: vi.fn(),
		},
		writable: true,
	});
}

// Mock sessionStorage
Object.defineProperty(window, "sessionStorage", {
	value: {
		getItem: vi.fn(),
		setItem: vi.fn(),
		removeItem: vi.fn(),
		clear: vi.fn(),
	},
	writable: true,
});

// Mock URL constructor
global.URL =
	global.URL ||
	vi.fn().mockImplementation((url) => ({
		href: url,
		origin: "http://localhost",
		pathname: "/",
		searchParams: new URLSearchParams(),
	}));

// Mock performance
global.performance = global.performance || {
	now: vi.fn(() => Date.now()),
};

// Mock WebSocket
global.WebSocket = vi.fn().mockImplementation(() => ({
	send: vi.fn(),
	close: vi.fn(),
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
	readyState: 1,
}));

// Mock Tauri API
vi.mock("@tauri-apps/api/core", () => ({
	invoke: vi.fn(),
}));

// Mock Inngest client for testing
vi.mock("inngest", () => ({
	Inngest: vi.fn().mockImplementation(() => ({
		createFunction: vi.fn(),
		send: vi.fn(),
	})),
}));

// Mock Inngest API - prevent 401 errors in tests
process.env.INNGEST_EVENT_KEY = "test-event-key";
process.env.INNGEST_SIGNING_KEY = "test-signing-key";
process.env.INNGEST_BASE_URL = "http://localhost:3000/api/inngest";

// Mock environment variables for API services
process.env.NEXT_PUBLIC_SERVER_URL = "http://localhost:3000";
process.env.DATABASE_URL = "file:./test.db";
process.env.AGENT_MAX_AGENTS = "10";
process.env.AGENT_TASK_QUEUE_SIZE = "100";
process.env.AGENT_HEARTBEAT_INTERVAL_MS = "30000";
process.env.AGENT_TASK_TIMEOUT_MS = "300000";
process.env.ENABLE_MONITORING = "false";
process.env.ENABLE_PERFORMANCE_METRICS = "false";
process.env.ENABLE_SECURITY_SCANNING = "false";
process.env.LOG_LEVEL = "error";
process.env.DEBUG_AGENTS = "false";

// Suppress console warnings in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
console.error = (...args) => {
	if (args[0]?.includes?.("Warning:")) return;
	originalConsoleError.call(console, ...args);
};
console.warn = (...args) => {
	if (args[0]?.includes?.("Warning:")) return;
	originalConsoleWarn.call(console, ...args);
};
