import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	test: {
		environment: "jsdom",
		setupFiles: ["./tests/setup.ts"],
		globals: true,
		css: false,
		testTimeout: 3000,
		hookTimeout: 3000,
		teardownTimeout: 1000,
		silent: false,
		passWithNoTests: true,
		// Performance optimizations
		reporter: ["default"],
		logLevel: "error",
		cache: {
			dir: "./.vitest/cache",
		},
		sequence: {
			concurrent: false,
			shuffle: false,
		},
		isolate: true,
		pool: "forks",
		poolOptions: {
			forks: {
				singleFork: false,
				maxForks: 1,
				minForks: 1,
			},
		},
		coverage: {
			provider: "v8",
			reporter: ["text", "text-summary", "json", "html", "lcov", "clover"],
			reportsDirectory: "coverage",
			include: ["src/**/*.{js,ts,jsx,tsx}"],
			exclude: [
				"node_modules/**",
				"dist/**",
				"build/**",
				"**/*.d.ts",
				"**/*.config.*",
				"**/coverage/**",
				"**/*.test.*",
				"**/*.spec.*",
				"**/__tests__/**",
				"**/tests/**",
				"**/*.stories.*",
				"**/types/**",
				"**/constants/**",
				"**/utils/index.ts",
				"**/index.ts",
				"**/setup.*",
			],
			thresholds: {
				global: {
					branches: 40,
					functions: 40,
					lines: 40,
					statements: 40,
				},
				perFile: {
					branches: 30,
					functions: 30,
					lines: 30,
					statements: 30,
				},
			},
		},
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"@/ui-kit": path.resolve(__dirname, "./src"),
			react: path.resolve(__dirname, "../../node_modules/react"),
			"react-dom": path.resolve(__dirname, "../../node_modules/react-dom"),
		},
		dedupe: ["react", "react-dom"],
	},
});
