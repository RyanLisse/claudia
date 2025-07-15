import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
import { defineConfig } from "vitest/config";

// Load test environment variables
dotenv.config({ path: "./apps/web/.env.test" });

export default defineConfig({
	plugins: [react()],
	test: {
		globals: true,
		testTimeout: 5000,
		hookTimeout: 5000,
		teardownTimeout: 2000,
		silent: false,
		passWithNoTests: true,
		// Performance optimizations
		reporter: ["default", "json"],
		logLevel: "error",
		cache: {
			dir: "./.vitest/cache",
		},
		watch: {
			ignore: [
				"**/node_modules/**",
				"**/dist/**",
				"**/build/**",
				"**/.next/**",
			],
		},
		forceRerunTriggers: ["**/vitest.config.*", "**/test-setup.*"],
		sequence: {
			concurrent: true,
			shuffle: false,
		},
		isolate: true,
		pool: "forks",
		poolOptions: {
			forks: {
				singleFork: false,
				maxForks: 4,
				minForks: 2,
			},
		},
		poolMatchGlobs: [
			["**/*.integration.test.*", "forks"],
			["**/*.e2e.test.*", "forks"],
			["**/*.unit.test.*", "threads"],
			["**/*.spec.*", "threads"],
		],
		environment: "jsdom",
		setupFiles: ["./test-setup.ts"],
		env: {
			// Test environment variables are already loaded above
			NODE_ENV: "test",
			...process.env,
		},
		coverage: {
			provider: "v8",
			reporter: ["text", "text-summary", "json", "html", "lcov", "clover"],
			reportsDirectory: "coverage",
			exclude: [
				"node_modules/**",
				"dist/**",
				"build/**",
				"**/*.d.ts",
				"**/*.config.*",
				"**/coverage/**",
				"**/.next/**",
				"**/out/**",
				"**/*.test.*",
				"**/*.spec.*",
				"**/__tests__/**",
				"**/tests/**",
				"**/*.stories.*",
				"**/tailwind.config.*",
				"**/postcss.config.*",
				"**/middleware.*",
				"**/layout.*",
				"**/loading.*",
				"**/error.*",
				"**/not-found.*",
				"**/global-error.*",
				"**/instrumentation.*",
				"**/constants/**",
				"**/types/**",
				"**/schemas/**",
				"**/scripts/**",
				"**/mocks/**",
				"**/fixtures/**",
				"**/test-utils/**",
				"**/migrations/**",
				"**/seed/**",
				"**/prisma/**",
				"**/db/schema/**",
				"**/db/migrations/**",
				"**/env.*",
				"**/index.ts",
				"**/main.ts",
				"**/main.tsx",
				"**/app.tsx",
				"**/_app.tsx",
				"**/_document.tsx",
				"**/root.tsx",
				"**/setup.*",
				"**/polyfills.*",
				"**/reportWebVitals.*",
			],
			include: [
				"apps/**/src/**/*.{js,ts,jsx,tsx}",
				"packages/**/src/**/*.{js,ts,jsx,tsx}",
				"!apps/**/src/**/*.{test,spec}.*",
				"!packages/**/src/**/*.{test,spec}.*",
				"!apps/**/src/**/__tests__/**",
				"!packages/**/src/**/__tests__/**",
				"!apps/**/src/**/tests/**",
				"!packages/**/src/**/tests/**",
			],
			thresholds: {
				global: {
					branches: 80,
					functions: 80,
					lines: 80,
					statements: 80,
				},
				perFile: {
					branches: 70,
					functions: 70,
					lines: 70,
					statements: 70,
				},
			},
		},
		include: [
			"apps/**/src/**/*.{test,spec}.{js,ts,jsx,tsx}",
			"packages/**/src/**/*.{test,spec}.{js,ts,jsx,tsx}",
			"apps/**/__tests__/**/*.{test,spec}.{js,ts,jsx,tsx}",
			"packages/**/__tests__/**/*.{test,spec}.{js,ts,jsx,tsx}",
			"apps/**/tests/**/*.{test,spec}.{js,ts,jsx,tsx}",
			"packages/**/tests/**/*.{test,spec}.{js,ts,jsx,tsx}",
		],
		exclude: ["node_modules/**", "dist/**", "build/**", ".next/**", "out/**"],
		// Fix for problematic external dependencies
		deps: {
			optimizer: {
				web: {
					include: ["vitest-canvas-mock", "react", "react-dom"],
					exclude: ["wa-sqlite", "electric-sql", "bun:test"],
				},
			},
			inline: [/virtual:/, /\.stories\./],
			external: ["wa-sqlite", "electric-sql", "bun:test"],
		},
		server: {
			deps: {
				external: ["wa-sqlite", "electric-sql", "bun:test"],
			},
		},
	},
	resolve: {
		alias: {
			"@": resolve(__dirname, "./apps/web/src"),
			"@/server": resolve(__dirname, "./apps/server/src"),
			"@db": resolve(__dirname, "./apps/server/src/db"),
			"@ui": resolve(__dirname, "./packages/ui-kit/src"),
		},
	},
});
