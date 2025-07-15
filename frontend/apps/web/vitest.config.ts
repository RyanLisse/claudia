import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: ["./src/__tests__/utils/test-setup.ts"],
		include: [
			"src/**/*.{test,spec}.{js,ts,jsx,tsx}",
			"src/__tests__/**/*.{test,spec}.{js,ts,jsx,tsx}",
		],
		exclude: [
			"node_modules/**",
			"dist/**",
			"build/**",
			".next/**",
			"out/**",
			"coverage/**",
		],
		pool: "forks",
		poolOptions: {
			forks: {
				singleFork: false,
				maxForks: 3,
				minForks: 1,
			},
		},
		testTimeout: 5000,
		hookTimeout: 5000,
		teardownTimeout: 2000,
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
				".next/**",
				"out/**",
				"**/*.d.ts",
				"**/*.config.*",
				"**/coverage/**",
				"**/*.test.*",
				"**/*.spec.*",
				"**/__tests__/**",
				"**/*.stories.*",
				"**/middleware.*",
				"**/layout.*",
				"**/loading.*",
				"**/error.*",
				"**/not-found.*",
				"**/globals.css",
				"**/index.css",
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
		// Fix for bun:test externalization
		deps: {
			optimizer: {
				web: {
					include: ["vitest-canvas-mock"],
					exclude: ["wa-sqlite", "electric-sql", "bun:test"],
				},
			},
		},
		// Mock problematic modules
		server: {
			deps: {
				external: ["wa-sqlite", "electric-sql", "bun:test"],
			},
		},
	},
	resolve: {
		alias: {
			"@": resolve(__dirname, "./src"),
			"@/components": resolve(__dirname, "./src/components"),
			"@/lib": resolve(__dirname, "./src/lib"),
			"@/types": resolve(__dirname, "./src/types"),
			"@/utils": resolve(__dirname, "./src/utils"),
			"@/hooks": resolve(__dirname, "./src/hooks"),
			"@/stores": resolve(__dirname, "./src/stores"),
		},
	},
	// Fix for Next.js and React imports
	define: {
		"process.env.NODE_ENV": JSON.stringify("test"),
	},
	// Externalize problematic dependencies
	optimizeDeps: {
		exclude: ["wa-sqlite", "electric-sql"],
	},
	// CSS processing configuration
	css: {
		postcss: {
			plugins: [],
		},
	},
});
