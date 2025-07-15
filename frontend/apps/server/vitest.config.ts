import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		setupFiles: ["./src/db/tests/test-setup.ts"],
		include: [
			"src/**/*.{test,spec}.{js,ts}",
			"src/**/tests/**/*.{test,spec}.{js,ts}",
		],
		exclude: ["node_modules/**", "dist/**", "build/**", "coverage/**"],
		pool: "forks",
		poolOptions: {
			forks: {
				singleFork: false,
				maxForks: 2,
				minForks: 1,
			},
		},
		testTimeout: 8000,
		hookTimeout: 8000,
		teardownTimeout: 3000,
		passWithNoTests: true,
		// Performance optimizations
		reporter: ["default"],
		logLevel: "error",
		cache: {
			dir: "./.vitest/cache",
		},
		sequence: {
			concurrent: true,
			shuffle: false,
		},
		isolate: true,
		coverage: {
			provider: "v8",
			reporter: ["text", "text-summary", "json", "html"],
			reportsDirectory: "./coverage",
			exclude: [
				"node_modules/**",
				"dist/**",
				"build/**",
				"**/*.d.ts",
				"**/*.config.*",
				"**/coverage/**",
				"**/*.test.*",
				"**/*.spec.*",
				"**/tests/**",
				"**/migrations/**",
				"**/schema/**",
			],
			thresholds: {
				global: {
					branches: 60,
					functions: 60,
					lines: 60,
					statements: 60,
				},
			},
		},
		// Fix for problematic external dependencies
		deps: {
			optimizer: {
				ssr: {
					include: ["drizzle-orm"],
					exclude: ["wa-sqlite", "electric-sql", "bun:test"],
				},
			},
		},
		server: {
			deps: {
				external: ["wa-sqlite", "electric-sql"],
			},
		},
	},
	resolve: {
		alias: {
			"@": resolve(__dirname, "./src"),
			"@/db": resolve(__dirname, "./src/db"),
			"@/lib": resolve(__dirname, "./src/lib"),
			"@/routers": resolve(__dirname, "./src/routers"),
		},
	},
	// Fix for Node.js imports
	define: {
		"process.env.NODE_ENV": JSON.stringify("test"),
	},
	// Externalize problematic dependencies
	optimizeDeps: {
		exclude: ["wa-sqlite", "electric-sql"],
	},
});
