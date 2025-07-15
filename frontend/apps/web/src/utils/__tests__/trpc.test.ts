import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { queryClient, trpc } from "../trpc";

// Mock external dependencies
vi.mock("@tanstack/react-query", () => {
	const mockQueryCache = {
		onError: vi.fn(),
	};
	const mockQueryClient = {
		invalidateQueries: vi.fn(),
	};

	return {
		QueryClient: vi.fn().mockImplementation((options) => {
			const client = { ...mockQueryClient };
			if (options?.queryCache) {
				client.queryCache = options.queryCache;
			}
			return client;
		}),
		QueryCache: vi.fn().mockImplementation((options) => {
			const cache = { ...mockQueryCache };
			if (options?.onError) {
				cache.onError = options.onError;
			}
			return cache;
		}),
	};
});

vi.mock("@trpc/client", () => ({
	createTRPCClient: vi.fn(),
	httpBatchLink: vi.fn(),
}));

vi.mock("@trpc/tanstack-react-query", () => ({
	createTRPCOptionsProxy: vi.fn(),
}));

vi.mock("sonner", () => ({
	toast: {
		error: vi.fn(),
	},
}));

// Mock environment variable
const originalEnv = process.env;

describe("trpc utilities", () => {
	const mockQueryClient = {
		invalidateQueries: vi.fn(),
	};

	const mockQueryCache = {
		constructor: vi.fn(),
		onError: vi.fn(),
	};

	const mockTrpcClient = {
		query: vi.fn(),
		mutation: vi.fn(),
	};

	const mockTrpcProxy = {
		useQuery: vi.fn(),
		useMutation: vi.fn(),
	};

	beforeEach(async () => {
		vi.clearAllMocks();
		process.env = { ...originalEnv };

		// Set up mocks - import the mocked modules
		const trpcClient = await vi.importMock("@trpc/client") as any;
		const trpcReactQuery = await vi.importMock("@trpc/tanstack-react-query") as any;

		trpcClient.httpBatchLink.mockReturnValue("mocked-batch-link");
		trpcClient.createTRPCClient.mockReturnValue(mockTrpcClient);
		trpcReactQuery.createTRPCOptionsProxy.mockReturnValue(mockTrpcProxy);
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	describe("queryClient", () => {
		it("should create QueryClient with QueryCache", () => {
			// Import the module to trigger the initialization
			const { QueryClient, QueryCache } = require("@tanstack/react-query");

			expect(QueryCache).toHaveBeenCalledWith({
				onError: expect.any(Function),
			});

			expect(QueryClient).toHaveBeenCalledWith({
				queryCache: expect.any(Object),
			});
		});

		it("should handle query cache errors", () => {
			const { QueryCache } = require("@tanstack/react-query");
			const { toast } = require("sonner");

			// Get the onError function from the QueryCache call
			const onErrorFn = QueryCache.mock.calls[0][0].onError;

			const mockError = new Error("Test error message");
			onErrorFn(mockError);

			expect(toast.error).toHaveBeenCalledWith("Test error message", {
				action: {
					label: "retry",
					onClick: expect.any(Function),
				},
			});
		});

		it("should invalidate queries when retry action is clicked", () => {
			const { QueryCache } = require("@tanstack/react-query");
			const { toast } = require("sonner");

			// Get the onError function from the QueryCache call
			const onErrorFn = QueryCache.mock.calls[0][0].onError;

			const mockError = new Error("Test error");
			onErrorFn(mockError);

			// Get the onClick function from the toast.error call
			const onClickFn = toast.error.mock.calls[0][1].action.onClick;
			onClickFn();

			expect(mockQueryClient.invalidateQueries).toHaveBeenCalled();
		});

		it("should handle errors with different message types", () => {
			const { QueryCache } = require("@tanstack/react-query");
			const { toast } = require("sonner");

			const onErrorFn = QueryCache.mock.calls[0][0].onError;

			// Test with string message
			const errorWithString = { message: "String error message" };
			onErrorFn(errorWithString);

			expect(toast.error).toHaveBeenCalledWith(
				"String error message",
				expect.any(Object),
			);

			// Test with undefined message
			const errorWithoutMessage = {};
			onErrorFn(errorWithoutMessage);

			expect(toast.error).toHaveBeenCalledWith(undefined, expect.any(Object));
		});
	});

	describe("trpcClient", () => {
		it("should create TRPC client with correct configuration", () => {
			process.env.NEXT_PUBLIC_SERVER_URL = "https://api.example.com";

			// Re-import to trigger client creation with new env
			delete require.cache[require.resolve("../trpc")];
			require("../trpc");

			const { createTRPCClient, httpBatchLink } = require("@trpc/client");

			expect(httpBatchLink).toHaveBeenCalledWith({
				url: "https://api.example.com/trpc",
			});

			expect(createTRPCClient).toHaveBeenCalledWith({
				links: ["mocked-batch-link"],
			});
		});

		it("should handle missing environment variable", () => {
			process.env.NEXT_PUBLIC_SERVER_URL = undefined;

			// Re-import to trigger client creation without env
			delete require.cache[require.resolve("../trpc")];
			require("../trpc");

			const { httpBatchLink } = require("@trpc/client");

			expect(httpBatchLink).toHaveBeenCalledWith({
				url: "undefined/trpc",
			});
		});

		it("should handle empty environment variable", () => {
			process.env.NEXT_PUBLIC_SERVER_URL = "";

			// Re-import to trigger client creation with empty env
			delete require.cache[require.resolve("../trpc")];
			require("../trpc");

			const { httpBatchLink } = require("@trpc/client");

			expect(httpBatchLink).toHaveBeenCalledWith({
				url: "/trpc",
			});
		});
	});

	describe("trpc proxy", () => {
		it("should create TRPC options proxy with correct configuration", () => {
			const { createTRPCOptionsProxy } = require("@trpc/tanstack-react-query");

			expect(createTRPCOptionsProxy).toHaveBeenCalledWith({
				client: mockTrpcClient,
				queryClient: expect.any(Object),
			});
		});

		it("should return the proxy object", () => {
			expect(trpc).toBe(mockTrpcProxy);
		});

		it("should have expected proxy methods", () => {
			expect(trpc.useQuery).toBeDefined();
			expect(trpc.useMutation).toBeDefined();
		});
	});

	describe("integration", () => {
		it("should use the same queryClient instance across components", () => {
			const { createTRPCOptionsProxy } = require("@trpc/tanstack-react-query");

			// Verify the same queryClient is used in both QueryClient creation and TRPC proxy
			const proxyConfig = createTRPCOptionsProxy.mock.calls[0][0];
			const queryClientFromProxy = proxyConfig.queryClient;

			// Both should reference the same queryClient instance
			expect(queryClientFromProxy).toBe(queryClient);
		});

		it("should properly connect client and proxy", () => {
			const { createTRPCOptionsProxy } = require("@trpc/tanstack-react-query");

			const proxyConfig = createTRPCOptionsProxy.mock.calls[0][0];

			expect(proxyConfig.client).toBe(mockTrpcClient);
			expect(proxyConfig.queryClient).toBeDefined();
		});

		it("should handle different server URL formats", () => {
			const testUrls = [
				"http://localhost:3000",
				"https://api.production.com",
				"https://staging-api.example.com:8080",
				"http://127.0.0.1:4000",
			];

			testUrls.forEach((url) => {
				process.env.NEXT_PUBLIC_SERVER_URL = url;

				// Clear the module cache and re-import
				delete require.cache[require.resolve("../trpc")];
				const { httpBatchLink } = require("@trpc/client");
				httpBatchLink.mockClear();

				require("../trpc");

				expect(httpBatchLink).toHaveBeenCalledWith({
					url: `${url}/trpc`,
				});
			});
		});
	});

	describe("error handling edge cases", () => {
		it("should handle null error message", () => {
			const { QueryCache } = require("@tanstack/react-query");
			const { toast } = require("sonner");

			const onErrorFn = QueryCache.mock.calls[0][0].onError;

			const errorWithNullMessage = { message: null };
			onErrorFn(errorWithNullMessage);

			expect(toast.error).toHaveBeenCalledWith(null, expect.any(Object));
		});

		it("should handle error without message property", () => {
			const { QueryCache } = require("@tanstack/react-query");
			const { toast } = require("sonner");

			const onErrorFn = QueryCache.mock.calls[0][0].onError;

			const errorWithoutMessage = { code: "ERROR_CODE" };
			onErrorFn(errorWithoutMessage);

			expect(toast.error).toHaveBeenCalledWith(undefined, expect.any(Object));
		});

		it("should handle error retry multiple times", () => {
			const { QueryCache } = require("@tanstack/react-query");
			const { toast } = require("sonner");

			const onErrorFn = QueryCache.mock.calls[0][0].onError;

			const mockError = new Error("Test error");
			onErrorFn(mockError);

			const onClickFn = toast.error.mock.calls[0][1].action.onClick;

			// Multiple retries
			onClickFn();
			onClickFn();
			onClickFn();

			expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(3);
		});
	});

	describe("module exports", () => {
		it("should export queryClient", () => {
			expect(queryClient).toBeDefined();
			expect(typeof queryClient).toBe("object");
		});

		it("should export trpc proxy", () => {
			expect(trpc).toBeDefined();
			expect(typeof trpc).toBe("object");
		});

		it("should have queryClient with expected methods", () => {
			expect(queryClient.invalidateQueries).toBeDefined();
			expect(typeof queryClient.invalidateQueries).toBe("function");
		});
	});
});
