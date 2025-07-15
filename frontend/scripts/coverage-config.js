#!/usr/bin/env node

/**
 * Coverage Configuration and Reporting Helper
 *
 * This script provides utilities for coverage configuration and reporting:
 * - Validates coverage configuration
 * - Generates coverage reports
 * - Provides coverage statistics
 * - Manages coverage thresholds
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

class CoverageManager {
	constructor() {
		this.rootDir = process.cwd();
		this.coverageDir = path.join(this.rootDir, "coverage");
		this.vitestConfigPath = path.join(this.rootDir, "vitest.config.ts");
		this.packageJsonPath = path.join(this.rootDir, "package.json");
	}

	/**
	 * Check if coverage directory exists
	 */
	checkCoverageDir() {
		return fs.existsSync(this.coverageDir);
	}

	/**
	 * Get coverage reports
	 */
	getCoverageReports() {
		if (!this.checkCoverageDir()) {
			console.log(
				"❌ No coverage directory found. Run tests with coverage first.",
			);
			return null;
		}

		const reports = {
			html: path.join(this.coverageDir, "index.html"),
			json: path.join(this.coverageDir, "coverage-summary.json"),
			jsonFinal: path.join(this.coverageDir, "coverage-final.json"),
			lcov: path.join(this.coverageDir, "lcov.info"),
			clover: path.join(this.coverageDir, "clover.xml"),
		};

		const availableReports = {};
		for (const [type, filePath] of Object.entries(reports)) {
			if (fs.existsSync(filePath)) {
				availableReports[type] = filePath;
			}
		}

		return availableReports;
	}

	/**
	 * Generate coverage report
	 */
	async generateCoverage() {
		console.log("📊 Generating coverage report...");

		try {
			// Run tests with coverage
			execSync("npm run test:coverage", {
				stdio: "inherit",
				cwd: this.rootDir,
				timeout: 60000, // 1 minute timeout
			});

			console.log("✅ Coverage report generated successfully!");

			// Show available reports
			const reports = this.getCoverageReports();
			if (reports) {
				console.log("\n📋 Available coverage reports:");
				Object.entries(reports).forEach(([type, filePath]) => {
					console.log(`  ${type.toUpperCase()}: ${filePath}`);
				});
			}

			return true;
		} catch (error) {
			console.error("❌ Failed to generate coverage report:", error.message);
			return false;
		}
	}

	/**
	 * Get coverage summary
	 */
	getCoverageSummary() {
		const jsonReport = path.join(this.coverageDir, "coverage-summary.json");
		const finalReport = path.join(this.coverageDir, "coverage-final.json");

		// Try coverage-summary.json first, then coverage-final.json
		let reportPath = jsonReport;
		if (!fs.existsSync(jsonReport) && fs.existsSync(finalReport)) {
			reportPath = finalReport;
		}

		if (!fs.existsSync(reportPath)) {
			console.log(
				"❌ No coverage summary found. Run tests with coverage first.",
			);
			return null;
		}

		try {
			const data = JSON.parse(fs.readFileSync(reportPath, "utf8"));
			return data;
		} catch (error) {
			console.error("❌ Failed to parse coverage summary:", error.message);
			return null;
		}
	}

	/**
	 * Display coverage statistics
	 */
	displayCoverageStats() {
		const summary = this.getCoverageSummary();

		if (!summary) {
			return;
		}

		console.log("\n📊 Coverage Statistics:");
		console.log("========================");

		if (summary.total) {
			const { total } = summary;
			console.log(
				`Lines:      ${total.lines.pct}% (${total.lines.covered}/${total.lines.total})`,
			);
			console.log(
				`Functions:  ${total.functions.pct}% (${total.functions.covered}/${total.functions.total})`,
			);
			console.log(
				`Branches:   ${total.branches.pct}% (${total.branches.covered}/${total.branches.total})`,
			);
			console.log(
				`Statements: ${total.statements.pct}% (${total.statements.covered}/${total.statements.total})`,
			);
		}

		// Show per-file coverage (top 10 files)
		const fileEntries = Object.entries(summary)
			.filter(([key]) => key !== "total")
			.sort(([, a], [, b]) => b.lines.pct - a.lines.pct)
			.slice(0, 10);

		if (fileEntries.length > 0) {
			console.log("\n🔍 Top Files by Coverage:");
			console.log("=========================");
			fileEntries.forEach(([filePath, stats]) => {
				const shortPath = filePath.replace(this.rootDir, "");
				console.log(`${shortPath}: ${stats.lines.pct}%`);
			});
		}
	}

	/**
	 * Validate coverage configuration
	 */
	validateConfig() {
		console.log("🔍 Validating coverage configuration...");

		const issues = [];

		// Check if vitest config exists
		if (!fs.existsSync(this.vitestConfigPath)) {
			issues.push("vitest.config.ts not found");
		}

		// Check package.json for coverage scripts
		if (fs.existsSync(this.packageJsonPath)) {
			const packageJson = JSON.parse(
				fs.readFileSync(this.packageJsonPath, "utf8"),
			);
			if (!packageJson.scripts?.["test:coverage"]) {
				issues.push("test:coverage script not found in package.json");
			}
		}

		// Check for coverage dependencies
		if (fs.existsSync(this.packageJsonPath)) {
			const packageJson = JSON.parse(
				fs.readFileSync(this.packageJsonPath, "utf8"),
			);
			const deps = {
				...packageJson.dependencies,
				...packageJson.devDependencies,
			};

			if (!deps["@vitest/coverage-v8"]) {
				issues.push("@vitest/coverage-v8 not found in dependencies");
			}
		}

		if (issues.length === 0) {
			console.log("✅ Coverage configuration is valid!");
			return true;
		}
		console.log("❌ Coverage configuration issues found:");
		issues.forEach((issue) => console.log(`  - ${issue}`));
		return false;
	}

	/**
	 * Set coverage thresholds
	 */
	setThresholds(thresholds) {
		console.log("⚙️  Setting coverage thresholds...");

		try {
			let configContent = fs.readFileSync(this.vitestConfigPath, "utf8");

			// Update thresholds in config
			const newThresholds = `
        thresholds: {
          global: {
            branches: ${thresholds.branches || 50},
            functions: ${thresholds.functions || 50},
            lines: ${thresholds.lines || 50},
            statements: ${thresholds.statements || 50},
          },
          perFile: {
            branches: ${thresholds.perFile?.branches || 40},
            functions: ${thresholds.perFile?.functions || 40},
            lines: ${thresholds.perFile?.lines || 40},
            statements: ${thresholds.perFile?.statements || 40},
          },
        },`;

			// Replace existing thresholds
			configContent = configContent.replace(
				/thresholds:\s*{[^}]*},/gs,
				newThresholds,
			);

			fs.writeFileSync(this.vitestConfigPath, configContent);
			console.log("✅ Coverage thresholds updated successfully!");

			return true;
		} catch (error) {
			console.error("❌ Failed to update coverage thresholds:", error.message);
			return false;
		}
	}

	/**
	 * Open coverage report in browser
	 */
	openCoverageReport() {
		const htmlReport = path.join(this.coverageDir, "index.html");

		if (!fs.existsSync(htmlReport)) {
			console.log(
				"❌ HTML coverage report not found. Run tests with coverage first.",
			);
			return false;
		}

		try {
			const opener =
				process.platform === "darwin"
					? "open"
					: process.platform === "win32"
						? "start"
						: "xdg-open";

			execSync(`${opener} ${htmlReport}`, { stdio: "ignore" });
			console.log("🌐 Coverage report opened in browser!");
			return true;
		} catch (error) {
			console.error("❌ Failed to open coverage report:", error.message);
			return false;
		}
	}

	/**
	 * Run all coverage checks
	 */
	async runAll() {
		console.log("🚀 Running comprehensive coverage check...\n");

		// Validate configuration
		const isValid = this.validateConfig();
		if (!isValid) {
			console.log("\n❌ Please fix configuration issues before proceeding.");
			return false;
		}

		// Generate coverage
		const generated = await this.generateCoverage();
		if (!generated) {
			console.log("\n❌ Failed to generate coverage. Check test failures.");
			return false;
		}

		// Display statistics
		this.displayCoverageStats();

		// Show available reports
		const reports = this.getCoverageReports();
		if (reports) {
			console.log("\n📋 Coverage reports available:");
			Object.entries(reports).forEach(([type, filePath]) => {
				console.log(`  ${type.toUpperCase()}: ${filePath}`);
			});
		}

		console.log("\n✅ Coverage check completed successfully!");
		return true;
	}
}

// CLI handling
if (require.main === module) {
	const manager = new CoverageManager();
	const command = process.argv[2];

	switch (command) {
		case "generate":
			manager.generateCoverage();
			break;
		case "stats":
			manager.displayCoverageStats();
			break;
		case "validate":
			manager.validateConfig();
			break;
		case "open":
			manager.openCoverageReport();
			break;
		case "set-thresholds": {
			const thresholds = JSON.parse(process.argv[3] || "{}");
			manager.setThresholds(thresholds);
			break;
		}
		case "all":
		default:
			manager.runAll();
			break;
	}
}

module.exports = CoverageManager;
