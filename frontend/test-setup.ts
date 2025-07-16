import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import React from "react";
import { afterEach, vi, beforeAll } from "vitest";

// Make React available globally for JSX
global.React = React;

// Ensure DOM environment is properly set up
beforeAll(() => {
  // Ensure document and window are available
  if (typeof document === 'undefined') {
    throw new Error('DOM environment not available. Check vitest config environment setting.');
  }

  // Set up basic DOM structure
  if (!document.body) {
    document.documentElement.appendChild(document.createElement('body'));
  }

  // Ensure proper DOM APIs are available
  if (!document.createElement) {
    throw new Error('document.createElement not available');
  }
});

// Comprehensive DOM cleanup after each test
afterEach(() => {
	// Standard React Testing Library cleanup
	cleanup();
	
	// Aggressive DOM cleanup to prevent test isolation issues
	if (typeof document !== 'undefined') {
		// Remove all elements from document.body
		document.body.innerHTML = '';
		
		// Clear any remaining elements from document.head (except meta tags)
		const headElements = document.head.querySelectorAll('style, link[rel="stylesheet"], script');
		headElements.forEach(element => {
			if (element.parentNode) {
				element.parentNode.removeChild(element);
			}
		});
		
		// Reset document title
		document.title = '';
		
		// Clear any custom attributes from html and body
		document.documentElement.removeAttribute('data-testid');
		document.body.removeAttribute('data-testid');
		
		// Clear any inline styles
		document.documentElement.removeAttribute('style');
		document.body.removeAttribute('style');
		
		// Reset any modified classes
		document.documentElement.className = '';
		document.body.className = '';
		
		// Clear any event listeners by cloning and replacing elements
		const newBody = document.body.cloneNode(false);
		document.body.parentNode?.replaceChild(newBody, document.body);
		
		// Clear any remaining role attributes or aria attributes
		const allElements = document.querySelectorAll('*');
		allElements.forEach(element => {
			// Remove all aria-* attributes
			Array.from(element.attributes).forEach(attr => {
				if (attr.name.startsWith('aria-') || attr.name === 'role') {
					element.removeAttribute(attr.name);
				}
			});
		});
		
		// Force DOM mutation observer cleanup
		if (typeof window !== 'undefined' && window.MutationObserver) {
			// Create a temporary observer to trigger cleanup
			const observer = new MutationObserver(() => {});
			observer.observe(document.body, { childList: true, subtree: true });
			observer.disconnect();
		}
	}
	
	// Clear any global state or caches
	if (typeof window !== 'undefined') {
		// Clear localStorage and sessionStorage
		try {
			window.localStorage.clear();
			window.sessionStorage.clear();
		} catch (e) {
			// Ignore errors if storage is not available
		}
		
		// Clear any custom properties on window
		Object.keys(window).forEach(key => {
			if (key.startsWith('__test_') || key.startsWith('__mock_')) {
				delete (window as any)[key];
			}
		});
		
		// Clear any timers that might be running
		const highestTimeoutId = setTimeout(() => {}, 0);
		for (let i = 0; i < highestTimeoutId; i++) {
			clearTimeout(i);
		}
		
		const highestIntervalId = setInterval(() => {}, 1000);
		for (let i = 0; i < highestIntervalId; i++) {
			clearInterval(i);
		}
	}
	
	// Force garbage collection of any remaining references
	if (typeof global !== 'undefined' && global.gc) {
		global.gc();
	}
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

// Mock Tauri API with comprehensive mocking
vi.mock("@tauri-apps/api/core", () => ({
	invoke: vi.fn().mockImplementation((command: string, args?: any) => {
		// Provide realistic mock responses based on command
		switch (command) {
			case "list_projects":
				return Promise.resolve([]);
			case "get_project_sessions":
				return Promise.resolve([]);
			case "check_claude_version":
				return Promise.resolve({ is_installed: false, version: null, output: "Mock version" });
			case "get_session_output":
				return Promise.resolve("");
			case "list_running_agent_sessions":
				return Promise.resolve([]);
			case "read_claude_file":
				return Promise.resolve(null);
			case "write_claude_file":
				return Promise.resolve(null);
			default:
				return Promise.resolve(null);
		}
	}),
}));

// Mock Tauri dialog API
vi.mock("@tauri-apps/api/dialog", () => ({
	open: vi.fn(),
	save: vi.fn(),
	message: vi.fn(),
	ask: vi.fn(),
	confirm: vi.fn(),
}));

// Mock Tauri filesystem API
vi.mock("@tauri-apps/api/fs", () => ({
	readTextFile: vi.fn(),
	writeTextFile: vi.fn(),
	exists: vi.fn(),
	createDir: vi.fn(),
	removeFile: vi.fn(),
	removeDir: vi.fn(),
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
process.env.DATABASE_URL =
	"postgresql://neondb_owner:npg_ZLh0TfgD4iQK@ep-holy-credit-a2zuvwf4-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require";
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
