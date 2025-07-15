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

// Mock localStorage
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

// Mock TRPC client
vi.mock("@/utils/trpc", () => ({
	api: {
		useQuery: vi.fn(),
		useMutation: vi.fn(),
		useUtils: vi.fn(),
	},
}));

// Mock Zustand stores
vi.mock("@/stores/auth-store", () => ({
	useAuthStore: vi.fn(() => ({
		user: null,
		login: vi.fn(),
		logout: vi.fn(),
		isAuthenticated: false,
	})),
}));

vi.mock("@/stores/ui-store", () => ({
	useUIStore: vi.fn(() => ({
		theme: "light",
		toggleTheme: vi.fn(),
		sidebarOpen: false,
		setSidebarOpen: vi.fn(),
	})),
}));

vi.mock("@/stores/sync-store", () => ({
	useSyncStore: vi.fn(() => ({
		addOptimisticUpdate: vi.fn(),
		confirmOptimisticUpdate: vi.fn(),
		revertOptimisticUpdate: vi.fn(),
		syncData: vi.fn(),
		isOnline: true,
		optimisticUpdates: [],
		pendingUpdates: [],
		syncStatus: "idle",
		lastSyncTime: null,
		retryCount: 0,
		maxRetries: 3,
		clearOptimisticUpdates: vi.fn(),
		resetSync: vi.fn(),
		getOptimisticUpdate: vi.fn(),
		hasOptimisticUpdate: vi.fn(),
	})),
}));

// Mock React Query
vi.mock("@tanstack/react-query", () => ({
	useQuery: vi.fn(),
	useMutation: vi.fn(),
	useQueryClient: vi.fn(() => ({
		invalidateQueries: vi.fn(),
		setQueryData: vi.fn(),
		getQueryData: vi.fn(),
	})),
	QueryClient: vi.fn(),
	QueryClientProvider: ({ children }: { children: React.ReactNode }) =>
		children,
}));

// Mock Inngest client for testing
vi.mock("inngest", () => ({
	Inngest: vi.fn().mockImplementation(() => ({
		createFunction: vi.fn(),
		send: vi.fn(),
	})),
}));

// Mock environment variables for API services
process.env.NEXT_PUBLIC_SERVER_URL = "http://localhost:3000";
process.env.DATABASE_URL = "file:./test.db";
process.env.INNGEST_EVENT_KEY = "test-event-key";
process.env.INNGEST_SIGNING_KEY = "test-signing-key";
process.env.INNGEST_BASE_URL = "http://localhost:3000/api/inngest";

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

// Mock Electric SQL and wa-sqlite to prevent import errors
vi.mock("electric-sql", () => ({
	electrify: vi.fn(),
	Electric: vi.fn(),
}));

vi.mock("wa-sqlite", () => ({
	default: vi.fn(),
}));

// Mock Next.js dynamic imports
vi.mock("next/dynamic", () => ({
	default: (fn: any) => fn(),
}));

// Mock Next.js themes
vi.mock("next-themes", () => ({
	useTheme: () => ({
		theme: "light",
		setTheme: vi.fn(),
		resolvedTheme: "light",
	}),
	ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));
