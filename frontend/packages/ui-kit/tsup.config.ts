import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["cjs", "esm"],
	dts: true,
	splitting: false,
	sourcemap: true,
	clean: true,
	external: ["react", "react-dom"],
	treeshake: true,
	minify: false, // Disable minification to avoid esbuild service issues
	bundle: true,
	target: "es2020",
	platform: "browser",
	keepNames: true,
	outExtension({ format }) {
		return {
			js: format === "esm" ? ".mjs" : ".js",
		};
	},
	esbuildOptions(options) {
		options.banner = {
			js: '"use client"',
		};
		// Increase timeout and reduce concurrency to avoid EPIPE errors
		options.logLimit = 10;
	},
});
