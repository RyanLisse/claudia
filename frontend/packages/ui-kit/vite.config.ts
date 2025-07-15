import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
	plugins: [
		react(),
		dts({
			insertTypesEntry: true,
			exclude: ["stories/**/*", "tests/**/*", "**/*.test.*", "**/*.stories.*"],
		}),
	],
	build: {
		lib: {
			entry: resolve(__dirname, "src/index.ts"),
			name: "ClaudiaUIKit",
			formats: ["es", "cjs"],
			fileName: (format) => `index.${format === "es" ? "mjs" : "js"}`,
		},
		rollupOptions: {
			external: ["react", "react-dom"],
			output: {
				globals: {
					react: "React",
					"react-dom": "ReactDOM",
				},
				banner: '"use client";',
			},
		},
		target: "es2020",
		sourcemap: true,
		emptyOutDir: true,
	},
	resolve: {
		alias: {
			"@": resolve(__dirname, "src"),
		},
	},
	esbuild: {
		target: "es2020",
		keepNames: true,
		format: "esm",
	},
});
