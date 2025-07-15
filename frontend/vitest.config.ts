import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

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
			// Load test environment variables
			...require("dotenv").config({ path: "./apps/web/.env.test" }).parsed,
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
					branches: 50,
					functions: 50,
					lines: 50,
					statements: 50,
				},
				perFile: {
					branches: 40,
					functions: 40,
					lines: 40,
					statements: 40,
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
		},
	},
});
