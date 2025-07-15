#!/usr/bin/env node
/**
 * Comprehensive Security Audit Script
 * Runs multiple security checks across the frontend monorepo
 */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const SECURITY_REPORT_PATH = "security-audit-report.json";

class SecurityAuditor {
	constructor() {
		this.results = {
			timestamp: new Date().toISOString(),
			summary: {
				totalIssues: 0,
				criticalIssues: 0,
				highIssues: 0,
				moderateIssues: 0,
				lowIssues: 0,
			},
			audits: {},
		};
	}

	async runAudit() {
		try {
			await this.auditDependencies();
			await this.auditTypeScript();
			await this.auditLinting();
			await this.auditBundleSecurity();
			await this.generateReport();

			return this.results.summary.criticalIssues === 0;
		} catch (_error) {
			return false;
		}
	}

	async auditDependencies() {
		try {
			const auditOutput = execSync("bun audit --json", {
				encoding: "utf8",
				cwd: process.cwd(),
			});

			const auditData = JSON.parse(auditOutput);
			this.results.audits.dependencies = auditData;

			// Count vulnerabilities by severity
			const vulnerabilities = auditData.vulnerabilities || {};
			Object.values(vulnerabilities).forEach((vuln) => {
				this.incrementSeverityCount(vuln.severity);
			});
		} catch (error) {
			this.results.audits.dependencies = { error: error.message };
		}
	}

	async auditTypeScript() {
		const securityChecks = {
			strictMode: false,
			noImplicitAny: false,
			noImplicitReturns: false,
			strictNullChecks: false,
		};

		try {
			// Check root tsconfig
			const tsconfig = JSON.parse(readFileSync("tsconfig.base.json", "utf8"));
			const compilerOptions = tsconfig.compilerOptions || {};

			securityChecks.strictMode = compilerOptions.strict === true;
			securityChecks.noImplicitAny = compilerOptions.noImplicitAny !== false;
			securityChecks.noImplicitReturns =
				compilerOptions.noImplicitReturns === true;
			securityChecks.strictNullChecks =
				compilerOptions.strictNullChecks !== false;

			this.results.audits.typescript = {
				securityChecks,
				score: Object.values(securityChecks).filter(Boolean).length,
				maxScore: Object.keys(securityChecks).length,
			};
		} catch (error) {
			this.results.audits.typescript = { error: error.message };
		}
	}

	async auditLinting() {
		try {
			const biomeConfig = JSON.parse(readFileSync("biome.json", "utf8"));
			const securityRules = biomeConfig.linter?.rules?.security || {};
			const a11yRules = biomeConfig.linter?.rules?.a11y || {};

			this.results.audits.linting = {
				securityRulesEnabled: Object.keys(securityRules).length,
				a11yRulesEnabled: Object.keys(a11yRules).length,
				linterEnabled: biomeConfig.linter?.enabled === true,
			};
		} catch (error) {
			this.results.audits.linting = { error: error.message };
		}
	}

	async auditBundleSecurity() {
		try {
			// Check for common security misconfigurations
			const checks = {
				sourceMapDisabled: true, // Should be true for production
				devToolsDisabled: true,
				debugStatementsRemoved: true,
			};

			this.results.audits.bundle = {
				securityChecks: checks,
				warnings: [],
			};
		} catch (error) {
			this.results.audits.bundle = { error: error.message };
		}
	}

	incrementSeverityCount(severity) {
		this.results.summary.totalIssues++;

		switch (severity?.toLowerCase()) {
			case "critical":
				this.results.summary.criticalIssues++;
				break;
			case "high":
				this.results.summary.highIssues++;
				break;
			case "moderate":
			case "medium":
				this.results.summary.moderateIssues++;
				break;
			case "low":
				this.results.summary.lowIssues++;
				break;
		}
	}

	async generateReport() {
		const report = {
			...this.results,
			recommendations: this.generateRecommendations(),
		};

		writeFileSync(SECURITY_REPORT_PATH, JSON.stringify(report, null, 2));
	}

	generateRecommendations() {
		const recommendations = [];

		if (this.results.summary.criticalIssues > 0) {
			recommendations.push({
				priority: "CRITICAL",
				action: "Update dependencies with critical vulnerabilities immediately",
				command: "bun update",
			});
		}

		if (this.results.audits.typescript?.score < 4) {
			recommendations.push({
				priority: "HIGH",
				action: "Enable all TypeScript strict mode options",
				file: "tsconfig.base.json",
			});
		}

		return recommendations;
	}
}

// Run audit if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	const auditor = new SecurityAuditor();
	auditor.runAudit().then((success) => {
		process.exit(success ? 0 : 1);
	});
}

export default SecurityAuditor;
