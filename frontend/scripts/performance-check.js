#!/usr/bin/env node
/**
 * Performance Check Script
 * Monitors bundle sizes, build times, and performance metrics
 */

import { execSync } from "node:child_process";
import { readdirSync, statSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import performanceConfig from "../performance.config.js";

class PerformanceChecker {
	constructor() {
		this.results = {
			timestamp: new Date().toISOString(),
			buildPerformance: {},
			bundleAnalysis: {},
			coreWebVitals: {},
			recommendations: [],
		};
	}

	async runCheck() {
		await this.checkBuildTimes();
		await this.analyzeBundleSizes();
		await this.checkTypeScriptPerformance();
		await this.generateReport();
		return this.results;
	}

	async checkBuildTimes() {
		const buildCommands = [
			{ name: "typecheck", command: "bun run check-types", timeout: 30000 },
			{ name: "lint", command: "bun run check", timeout: 20000 },
			{ name: "test", command: "bun test --run", timeout: 60000 },
		];

		for (const { name, command, timeout } of buildCommands) {
			try {
				const startTime = Date.now();
				execSync(command, {
					stdio: "pipe",
					timeout,
					cwd: process.cwd(),
				});
				const duration = Date.now() - startTime;

				this.results.buildPerformance[name] = {
					duration,
					status: "success",
					withinThreshold: duration < timeout,
				};
			} catch (error) {
				this.results.buildPerformance[name] = {
					status: "failed",
					error: error.message,
				};
			}
		}
	}

	async analyzeBundleSizes() {
		const apps = ["web", "server"];

		for (const app of apps) {
			const appPath = join("apps", app);
			const distPath = join(appPath, "dist");

			try {
				const bundleInfo = this.analyzeBundleDirectory(distPath);
				this.results.bundleAnalysis[app] = bundleInfo;

				// Check against thresholds
				const thresholds = performanceConfig.bundleSizeThresholds;
				const mainBundle = bundleInfo.files.find(
					(f) => f.name.includes("main") || f.name.includes("index"),
				);

				if (mainBundle && mainBundle.size > thresholds.main) {
					this.results.recommendations.push({
						type: "bundle-size",
						app,
						message: `Main bundle (${this.formatBytes(mainBundle.size)}) exceeds threshold (${this.formatBytes(thresholds.main)})`,
						severity: "warning",
					});
				}
			} catch (_error) {
				// Ignore errors reading individual files
			}
		}
	}

	analyzeBundleDirectory(dirPath) {
		const files = [];
		let totalSize = 0;

		try {
			const entries = readdirSync(dirPath, { withFileTypes: true });

			for (const entry of entries) {
				if (entry.isFile()) {
					const filePath = join(dirPath, entry.name);
					const stats = statSync(filePath);
					const ext = extname(entry.name);

					// Only analyze relevant files
					if ([".js", ".mjs", ".css", ".wasm"].includes(ext)) {
						files.push({
							name: entry.name,
							size: stats.size,
							type: ext.slice(1),
						});
						totalSize += stats.size;
					}
				}
			}
		} catch (error) {
			throw new Error(`Could not read directory ${dirPath}: ${error.message}`);
		}

		return {
			totalSize,
			files: files.sort((a, b) => b.size - a.size),
			breakdown: this.categorizeFiles(files),
		};
	}

	categorizeFiles(files) {
		const breakdown = {
			javascript: 0,
			css: 0,
			wasm: 0,
			other: 0,
		};

		for (const file of files) {
			switch (file.type) {
				case "js":
				case "mjs":
					breakdown.javascript += file.size;
					break;
				case "css":
					breakdown.css += file.size;
					break;
				case "wasm":
					breakdown.wasm += file.size;
					break;
				default:
					breakdown.other += file.size;
			}
		}

		return breakdown;
	}

	async checkTypeScriptPerformance() {
		try {
			const startTime = Date.now();
			execSync("bun run check-types --listFiles", {
				stdio: "pipe",
				timeout: 30000,
			});
			const duration = Date.now() - startTime;

			this.results.buildPerformance.typescript = {
				duration,
				status: "success",
				withinThreshold:
					duration < performanceConfig.buildPerformance.maxTypeCheckTime,
			};
		} catch (error) {
			this.results.buildPerformance.typescript = {
				status: "failed",
				error: error.message,
			};
		}
	}

	formatBytes(bytes) {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
	}

	async generateReport() {
		const reportPath = "performance-report.json";
		writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

		if (this.results.recommendations.length > 0) {
			for (const _rec of this.results.recommendations) {
				// Process recommendation (implementation needed)
			}
		}
	}
}

// Run check if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	const checker = new PerformanceChecker();
	checker
		.runCheck()
		.then((results) => {
			const hasWarnings = results.recommendations.some(
				(r) => r.severity === "warning",
			);
			process.exit(hasWarnings ? 1 : 0);
		})
		.catch(() => {
			process.exit(1);
		});
}

export default PerformanceChecker;
