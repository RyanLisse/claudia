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

// Mock Tauri API with proper implementations
vi.mock("@tauri-apps/api/core", () => ({
	invoke: vi.fn().mockImplementation(async (command: string, args?: any) => {
		// Return mock data based on command
		switch (command) {
			case "list_projects":
				return [];
			case "get_project_sessions":
				return [];
			case "list_agents":
				return [];
			case "list_running_sessions":
				return [];
			case "check_claude_version":
				return { is_installed: false, version: null, output: "Mock version" };
			case "get_session_output":
				return "";
			case "list_agent_runs":
				return [];
			case "get_agent_run":
				return {
					id: 1,
					agent_id: 1,
					agent_name: "Test Agent",
					agent_icon: "🤖",
					task: "Test task",
					model: "sonnet",
					project_path: "/test/path",
					session_id: "test-session",
					status: "completed",
					created_at: "2023-01-01T00:00:00Z",
				};
			case "execute_agent":
				return 1;
			case "get_claude_settings":
				return { data: {} };
			case "get_usage_stats":
				return {
					total_cost: 0,
					total_tokens: 0,
					total_input_tokens: 0,
					total_output_tokens: 0,
					total_cache_creation_tokens: 0,
					total_cache_read_tokens: 0,
					total_sessions: 0,
					by_model: [],
					by_date: [],
					by_project: [],
				};
			default:
				console.warn(`Unhandled mock API call: ${command}`);
				return null;
		}
	}),
}));

// Mock the API module directly for better test support
vi.mock("@/lib/api", () => {
	return {
		api: {
			listProjects: vi.fn().mockResolvedValue([]),
			getProjectSessions: vi.fn().mockResolvedValue([]),
			listAgents: vi.fn().mockResolvedValue([]),
			listRunningAgentSessions: vi.fn().mockResolvedValue([]),
			checkClaudeVersion: vi.fn().mockResolvedValue({
				is_installed: false,
				version: null,
				output: "Mock version",
			}),
			getSessionOutput: vi.fn().mockResolvedValue(""),
			listAgentRuns: vi.fn().mockResolvedValue([]),
			getAgentRun: vi.fn().mockResolvedValue({
				id: 1,
				agent_id: 1,
				agent_name: "Test Agent",
				agent_icon: "🤖",
				task: "Test task",
				model: "sonnet",
				project_path: "/test/path",
				session_id: "test-session",
				status: "completed",
				created_at: "2023-01-01T00:00:00Z",
			}),
			executeAgent: vi.fn().mockResolvedValue(1),
			getClaudeSettings: vi.fn().mockResolvedValue({}),
			getUsageStats: vi.fn().mockResolvedValue({
				total_cost: 0,
				total_tokens: 0,
				total_input_tokens: 0,
				total_output_tokens: 0,
				total_cache_creation_tokens: 0,
				total_cache_read_tokens: 0,
				total_sessions: 0,
				by_model: [],
				by_date: [],
				by_project: [],
			}),
		},
	};
});

// Mock the web API module
vi.mock("@/lib/api-web", () => {
	return {
		api: {
			listProjects: vi.fn().mockResolvedValue([
				{
					id: "test-project-1",
					path: "/test/path",
					sessions: ["session-1", "session-2"],
					created_at: Date.now() - 86400000,
				},
			]),
			getProjects: vi.fn().mockResolvedValue([
				{
					id: "test-project-1",
					path: "/test/path",
					sessions: ["session-1", "session-2"],
					created_at: Date.now() - 86400000,
				},
			]),
			getProjectSessions: vi.fn().mockResolvedValue([
				{
					id: "session-1",
					project_id: "test-project-1",
					project_path: "/test/path",
					created_at: Date.now() - 3600000,
					first_message: "Test message",
					first_message_at: Date.now() - 3600000,
				},
			]),
			getSession: vi.fn().mockResolvedValue(null),
			createSession: vi.fn().mockResolvedValue({
				id: "new-session",
				project_id: "test-project-1",
				project_path: "/test/path",
				created_at: Date.now(),
			}),
			checkClaudeVersion: vi.fn().mockResolvedValue({
				is_installed: false,
				version: null,
				output: "Mock version",
			}),
			getSessionOutput: vi.fn().mockResolvedValue(""),
			listRunningAgentSessions: vi.fn().mockResolvedValue([]),
			listAgents: vi.fn().mockResolvedValue([]),
			createAgent: vi.fn().mockResolvedValue({
				id: 1,
				name: "Test Agent",
				icon: "🤖",
				description: "Test description",
				system_prompt: "Test prompt",
				model: "sonnet",
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			}),
			updateAgent: vi.fn().mockResolvedValue({
				id: 1,
				name: "Test Agent",
				icon: "🤖",
				description: "Test description",
				system_prompt: "Test prompt",
				model: "sonnet",
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			}),
			deleteAgent: vi.fn().mockResolvedValue(undefined),
			executeAgent: vi.fn().mockResolvedValue(1),
			listAgentRuns: vi.fn().mockResolvedValue([]),
			readClaudeFile: vi.fn().mockResolvedValue({
				path: "/test/path/CLAUDE.md",
				content: "",
				exists: false,
			}),
			writeClaudeFile: vi.fn().mockResolvedValue(undefined),
		},
	};
});

// Mock React Query hooks specifically
vi.mock("@/hooks/use-projects", () => ({
	useProjects: vi.fn(() => ({
		data: [
			{
				id: "test-project-1",
				path: "/test/path",
				sessions: ["session-1", "session-2"],
				created_at: Date.now() - 86400000,
			},
		],
		isLoading: false,
		error: null,
		refetch: vi.fn(),
		isFetching: false,
		isError: false,
		isSuccess: true,
	})),
	useProjectSessions: vi.fn(() => ({
		data: [
			{
				id: "session-1",
				project_id: "test-project-1",
				project_path: "/test/path",
				created_at: Date.now() - 3600000,
				first_message: "Test message",
				first_message_at: Date.now() - 3600000,
			},
		],
		isLoading: false,
		error: null,
		refetch: vi.fn(),
		isFetching: false,
		isError: false,
		isSuccess: true,
	})),
	useSession: vi.fn(() => ({
		data: null,
		isLoading: false,
		error: null,
		refetch: vi.fn(),
		isFetching: false,
		isError: false,
		isSuccess: true,
	})),
	useCreateSession: vi.fn(() => ({
		mutate: vi.fn(),
		mutateAsync: vi.fn(),
		isLoading: false,
		isError: false,
		isSuccess: false,
		error: null,
		data: null,
		reset: vi.fn(),
	})),
	useOptimisticProjects: vi.fn(() => ({
		updateProject: vi.fn(),
	})),
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
	useQuery: vi.fn(() => ({
		data: [],
		isLoading: false,
		error: null,
		refetch: vi.fn(),
		isFetching: false,
		isError: false,
		isSuccess: true,
	})),
	useMutation: vi.fn(() => ({
		mutate: vi.fn(),
		mutateAsync: vi.fn(),
		isLoading: false,
		isError: false,
		isSuccess: false,
		error: null,
		data: null,
		reset: vi.fn(),
	})),
	useQueryClient: vi.fn(() => ({
		invalidateQueries: vi.fn(),
		setQueryData: vi.fn(),
		getQueryData: vi.fn(),
		prefetchQuery: vi.fn(),
		fetchQuery: vi.fn(),
		getQueryCache: vi.fn(),
		getMutationCache: vi.fn(),
		clear: vi.fn(),
		resetQueries: vi.fn(),
		cancelQueries: vi.fn(),
		removeQueries: vi.fn(),
		refetchQueries: vi.fn(),
		isFetching: vi.fn(),
		isMutating: vi.fn(),
	})),
	QueryClient: vi.fn().mockImplementation(() => ({
		invalidateQueries: vi.fn(),
		setQueryData: vi.fn(),
		getQueryData: vi.fn(),
		prefetchQuery: vi.fn(),
		fetchQuery: vi.fn(),
		getQueryCache: vi.fn(),
		getMutationCache: vi.fn(),
		clear: vi.fn(),
		resetQueries: vi.fn(),
		cancelQueries: vi.fn(),
		removeQueries: vi.fn(),
		refetchQueries: vi.fn(),
		isFetching: vi.fn(),
		isMutating: vi.fn(),
		mount: vi.fn(),
		unmount: vi.fn(),
		defaultOptions: {
			queries: {
				retry: false,
				staleTime: 0,
				refetchOnWindowFocus: false,
			},
		},
	})),
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
process.env.DATABASE_URL =
	"postgresql://neondb_owner:npg_ZLh0TfgD4iQK@ep-holy-credit-a2zuvwf4-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require";
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
