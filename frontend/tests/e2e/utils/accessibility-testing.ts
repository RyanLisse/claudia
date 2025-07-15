import { Page } from "@playwright/test";
import { injectAxe, checkA11y, getViolations, configureAxe } from "axe-playwright";

export interface AccessibilityRule {
	id: string;
	impact: 'minor' | 'moderate' | 'serious' | 'critical';
	description: string;
	help: string;
	helpUrl: string;
	tags: string[];
}

export interface AccessibilityViolation {
	id: string;
	impact: 'minor' | 'moderate' | 'serious' | 'critical';
	description: string;
	help: string;
	helpUrl: string;
	tags: string[];
	nodes: Array<{
		target: string[];
		html: string;
		impact: string;
		any: Array<{
			id: string;
			data: any;
			message: string;
		}>;
		all: Array<{
			id: string;
			data: any;
			message: string;
		}>;
		none: Array<{
			id: string;
			data: any;
			message: string;
		}>;
	}>;
}

export interface AccessibilityTestResult {
	testName: string;
	passed: boolean;
	violations: AccessibilityViolation[];
	violationCount: number;
	criticalCount: number;
	seriousCount: number;
	moderateCount: number;
	minorCount: number;
	score: number; // 0-100 accessibility score
	timestamp: Date;
	duration: number;
	url?: string;
	metadata: {
		viewport: { width: number; height: number };
		userAgent: string;
		rules: {
			total: number;
			enabled: number;
			disabled: number;
		};
	};
}

export interface AccessibilityTestConfig {
	includeTags?: string[];
	excludeTags?: string[];
	rules?: Record<string, { enabled: boolean }>;
	runOnly?: string[];
	reporter?: 'v1' | 'v2' | 'raw';
	resultTypes?: Array<'violations' | 'incomplete' | 'passes' | 'inapplicable'>;
	selectors?: boolean;
	ancestry?: boolean;
	xpath?: boolean;
	absolutePaths?: boolean;
	timeout?: number;
	ignoreSelectors?: string[];
	thresholds?: {
		critical?: number;
		serious?: number;
		moderate?: number;
		minor?: number;
	};
}

export interface KeyboardNavigationTest {
	element: string;
	expectedFocus: string;
	key: string;
	description: string;
}

export interface ColorContrastTest {
	selector: string;
	description: string;
	expectedRatio: number;
	level: 'AA' | 'AAA';
}

export interface AriaTest {
	selector: string;
	attribute: string;
	expectedValue?: string;
	description: string;
}

export class AccessibilityTester {
	private page: Page;
	private config: AccessibilityTestConfig;
	private results: AccessibilityTestResult[] = [];
	
	constructor(page: Page, config: AccessibilityTestConfig = {}) {
		this.page = page;
		this.config = {
			includeTags: config.includeTags || ['wcag2a', 'wcag2aa', 'wcag21aa'],
			excludeTags: config.excludeTags || [],
			rules: config.rules || {},
			runOnly: config.runOnly || [],
			reporter: config.reporter || 'v2',
			resultTypes: config.resultTypes || ['violations'],
			selectors: config.selectors ?? true,
			ancestry: config.ancestry ?? true,
			xpath: config.xpath ?? false,
			absolutePaths: config.absolutePaths ?? false,
			timeout: config.timeout || 10000,
			ignoreSelectors: config.ignoreSelectors || [],
			thresholds: config.thresholds || {
				critical: 0,
				serious: 0,
				moderate: 5,
				minor: 10
			}
		};
	}

	async initialize(): Promise<void> {
		try {
			await injectAxe(this.page);
			
			// Configure axe-core
			await configureAxe(this.page, {
				tags: this.config.includeTags,
				rules: this.config.rules,
				reporter: this.config.reporter
			});
			
			console.log('Accessibility testing initialized');
		} catch (error) {
			console.error('Failed to initialize accessibility testing:', error);
			throw error;
		}
	}

	async testPage(testName: string, options: Partial<AccessibilityTestConfig> = {}): Promise<AccessibilityTestResult> {
		const startTime = Date.now();
		const testConfig = { ...this.config, ...options };
		
		try {
			await this.page.waitForLoadState('networkidle');
			
			// Get violations
			const violations = await getViolations(this.page, null, {
				tags: testConfig.includeTags,
				rules: testConfig.rules,
				runOnly: testConfig.runOnly?.length ? { type: 'rule', values: testConfig.runOnly } : undefined,
				resultTypes: testConfig.resultTypes,
				selectors: testConfig.selectors,
				ancestry: testConfig.ancestry,
				xpath: testConfig.xpath,
				absolutePaths: testConfig.absolutePaths
			});
			
			// Filter out ignored selectors
			const filteredViolations = this.filterViolations(violations, testConfig.ignoreSelectors || []);
			
			// Calculate violation counts
			const violationCounts = this.calculateViolationCounts(filteredViolations);
			
			// Calculate accessibility score
			const score = this.calculateAccessibilityScore(violationCounts);
			
			// Check if test passes based on thresholds
			const passed = this.checkThresholds(violationCounts, testConfig.thresholds);
			
			const metadata = await this.collectMetadata();
			
			const result: AccessibilityTestResult = {
				testName,
				passed,
				violations: filteredViolations,
				violationCount: filteredViolations.length,
				criticalCount: violationCounts.critical,
				seriousCount: violationCounts.serious,
				moderateCount: violationCounts.moderate,
				minorCount: violationCounts.minor,
				score,
				timestamp: new Date(),
				duration: Date.now() - startTime,
				url: this.page.url(),
				metadata
			};
			
			this.results.push(result);
			return result;
			
		} catch (error) {
			const metadata = await this.collectMetadata();
			const result: AccessibilityTestResult = {
				testName,
				passed: false,
				violations: [],
				violationCount: 0,
				criticalCount: 0,
				seriousCount: 0,
				moderateCount: 0,
				minorCount: 0,
				score: 0,
				timestamp: new Date(),
				duration: Date.now() - startTime,
				url: this.page.url(),
				metadata
			};
			
			this.results.push(result);
			throw error;
		}
	}

	async testElement(
		testName: string,
		selector: string,
		options: Partial<AccessibilityTestConfig> = {}
	): Promise<AccessibilityTestResult> {
		const startTime = Date.now();
		const testConfig = { ...this.config, ...options };
		
		try {
			await this.page.locator(selector).waitFor({ state: 'visible' });
			
			// Test specific element
			const violations = await getViolations(this.page, selector, {
				tags: testConfig.includeTags,
				rules: testConfig.rules,
				runOnly: testConfig.runOnly?.length ? { type: 'rule', values: testConfig.runOnly } : undefined,
				resultTypes: testConfig.resultTypes,
				selectors: testConfig.selectors,
				ancestry: testConfig.ancestry,
				xpath: testConfig.xpath,
				absolutePaths: testConfig.absolutePaths
			});
			
			const filteredViolations = this.filterViolations(violations, testConfig.ignoreSelectors || []);
			const violationCounts = this.calculateViolationCounts(filteredViolations);
			const score = this.calculateAccessibilityScore(violationCounts);
			const passed = this.checkThresholds(violationCounts, testConfig.thresholds);
			
			const metadata = await this.collectMetadata();
			
			const result: AccessibilityTestResult = {
				testName: `${testName}-element`,
				passed,
				violations: filteredViolations,
				violationCount: filteredViolations.length,
				criticalCount: violationCounts.critical,
				seriousCount: violationCounts.serious,
				moderateCount: violationCounts.moderate,
				minorCount: violationCounts.minor,
				score,
				timestamp: new Date(),
				duration: Date.now() - startTime,
				url: this.page.url(),
				metadata
			};
			
			this.results.push(result);
			return result;
			
		} catch (error) {
			const metadata = await this.collectMetadata();
			const result: AccessibilityTestResult = {
				testName: `${testName}-element`,
				passed: false,
				violations: [],
				violationCount: 0,
				criticalCount: 0,
				seriousCount: 0,
				moderateCount: 0,
				minorCount: 0,
				score: 0,
				timestamp: new Date(),
				duration: Date.now() - startTime,
				url: this.page.url(),
				metadata
			};
			
			this.results.push(result);
			throw error;
		}
	}

	async testKeyboardNavigation(
		testName: string,
		tests: KeyboardNavigationTest[]
	): Promise<{ passed: boolean; results: Array<{ test: KeyboardNavigationTest; passed: boolean; error?: string }> }> {
		const results: Array<{ test: KeyboardNavigationTest; passed: boolean; error?: string }> = [];
		
		for (const test of tests) {
			try {
				// Focus on the element
				await this.page.locator(test.element).focus();
				
				// Press the key
				await this.page.keyboard.press(test.key);
				
				// Wait for focus to change
				await this.page.waitForTimeout(100);
				
				// Check if the expected element is focused
				const focusedElement = await this.page.evaluate(() => {
					const activeElement = document.activeElement;
					return activeElement ? activeElement.tagName.toLowerCase() + (activeElement.id ? '#' + activeElement.id : '') + (activeElement.className ? '.' + activeElement.className.split(' ').join('.') : '') : null;
				});
				
				const expectedFocused = await this.page.locator(test.expectedFocus).count() > 0;
				const actualFocused = focusedElement?.includes(test.expectedFocus.replace(/^\./, '').replace(/^#/, ''));
				
				results.push({
					test,
					passed: Boolean(expectedFocused && actualFocused),
					error: expectedFocused && actualFocused ? undefined : `Expected ${test.expectedFocus} to be focused, but ${focusedElement || 'no element'} was focused`
				});
				
			} catch (error) {
				results.push({
					test,
					passed: false,
					error: error instanceof Error ? error.message : String(error)
				});
			}
		}
		
		const allPassed = results.every(result => result.passed);
		console.log(`Keyboard navigation test ${testName}: ${allPassed ? 'PASSED' : 'FAILED'}`);
		
		return { passed: allPassed, results };
	}

	async testColorContrast(
		testName: string,
		tests: ColorContrastTest[]
	): Promise<{ passed: boolean; results: Array<{ test: ColorContrastTest; passed: boolean; actualRatio?: number; error?: string }> }> {
		const results: Array<{ test: ColorContrastTest; passed: boolean; actualRatio?: number; error?: string }> = [];
		
		for (const test of tests) {
			try {
				const element = this.page.locator(test.selector);
				await element.waitFor({ state: 'visible' });
				
				// Get computed styles
				const styles = await element.evaluate((el) => {
					const computed = window.getComputedStyle(el);
					return {
						color: computed.color,
						backgroundColor: computed.backgroundColor,
						fontSize: computed.fontSize
					};
				});
				
				// Calculate contrast ratio (simplified implementation)
				const contrastRatio = await this.calculateContrastRatio(styles.color, styles.backgroundColor);
				
				const passed = contrastRatio >= test.expectedRatio;
				
				results.push({
					test,
					passed,
					actualRatio: contrastRatio,
					error: passed ? undefined : `Contrast ratio ${contrastRatio.toFixed(2)} is below required ${test.expectedRatio} for ${test.level} compliance`
				});
				
			} catch (error) {
				results.push({
					test,
					passed: false,
					error: error instanceof Error ? error.message : String(error)
				});
			}
		}
		
		const allPassed = results.every(result => result.passed);
		console.log(`Color contrast test ${testName}: ${allPassed ? 'PASSED' : 'FAILED'}`);
		
		return { passed: allPassed, results };
	}

	async testAriaAttributes(
		testName: string,
		tests: AriaTest[]
	): Promise<{ passed: boolean; results: Array<{ test: AriaTest; passed: boolean; actualValue?: string; error?: string }> }> {
		const results: Array<{ test: AriaTest; passed: boolean; actualValue?: string; error?: string }> = [];
		
		for (const test of tests) {
			try {
				const element = this.page.locator(test.selector);
				await element.waitFor({ state: 'visible' });
				
				const actualValue = await element.getAttribute(test.attribute);
				
				let passed = true;
				let error: string | undefined;
				
				if (test.expectedValue !== undefined) {
					passed = actualValue === test.expectedValue;
					error = passed ? undefined : `Expected ${test.attribute}="${test.expectedValue}" but got "${actualValue}"`;
				} else {
					passed = actualValue !== null;
					error = passed ? undefined : `Expected ${test.attribute} to be present but it was not found`;
				}
				
				results.push({
					test,
					passed,
					actualValue: actualValue || undefined,
					error
				});
				
			} catch (error) {
				results.push({
					test,
					passed: false,
					error: error instanceof Error ? error.message : String(error)
				});
			}
		}
		
		const allPassed = results.every(result => result.passed);
		console.log(`ARIA attributes test ${testName}: ${allPassed ? 'PASSED' : 'FAILED'}`);
		
		return { passed: allPassed, results };
	}

	async testScreenReaderCompatibility(testName: string, selector: string): Promise<{
		passed: boolean;
		accessibleName?: string;
		role?: string;
		description?: string;
		error?: string;
	}> {
		try {
			const element = this.page.locator(selector);
			await element.waitFor({ state: 'visible' });
			
			const accessibilityInfo = await element.evaluate((el) => {
				const accessibleName = el.getAttribute('aria-label') || 
					el.getAttribute('aria-labelledby') || 
					(el as HTMLElement).innerText || 
					el.getAttribute('alt') || 
					el.getAttribute('title');
				
				const role = el.getAttribute('role') || el.tagName.toLowerCase();
				const description = el.getAttribute('aria-describedby') || el.getAttribute('aria-description');
				
				return {
					accessibleName,
					role,
					description,
					hasTabIndex: el.hasAttribute('tabindex'),
					tabIndex: el.getAttribute('tabindex'),
					isVisible: el.offsetParent !== null
				};
			});
			
			const hasAccessibleName = Boolean(accessibilityInfo.accessibleName);
			const hasValidRole = Boolean(accessibilityInfo.role);
			const passed = hasAccessibleName && hasValidRole;
			
			console.log(`Screen reader compatibility test ${testName}: ${passed ? 'PASSED' : 'FAILED'}`);
			
			return {
				passed,
				accessibleName: accessibilityInfo.accessibleName || undefined,
				role: accessibilityInfo.role || undefined,
				description: accessibilityInfo.description || undefined,
				error: passed ? undefined : 'Element lacks accessible name or valid role'
			};
			
		} catch (error) {
			return {
				passed: false,
				error: error instanceof Error ? error.message : String(error)
			};
		}
	}

	async generateReport(): Promise<string> {
		const totalTests = this.results.length;
		const passedTests = this.results.filter(r => r.passed).length;
		const failedTests = totalTests - passedTests;
		const averageScore = totalTests > 0 ? this.results.reduce((sum, r) => sum + r.score, 0) / totalTests : 0;
		
		const totalViolations = this.results.reduce((sum, r) => sum + r.violationCount, 0);
		const totalCritical = this.results.reduce((sum, r) => sum + r.criticalCount, 0);
		const totalSerious = this.results.reduce((sum, r) => sum + r.seriousCount, 0);
		const totalModerate = this.results.reduce((sum, r) => sum + r.moderateCount, 0);
		const totalMinor = this.results.reduce((sum, r) => sum + r.minorCount, 0);
		
		let report = '# Accessibility Testing Report\n\n';
		
		report += '## Summary\n';
		report += `- **Total Tests**: ${totalTests}\n`;
		report += `- **Passed**: ${passedTests}\n`;
		report += `- **Failed**: ${failedTests}\n`;
		report += `- **Average Score**: ${averageScore.toFixed(1)}/100\n`;
		report += `- **Total Violations**: ${totalViolations}\n\n`;
		
		report += '## Violation Breakdown\n';
		report += `- **Critical**: ${totalCritical}\n`;
		report += `- **Serious**: ${totalSerious}\n`;
		report += `- **Moderate**: ${totalModerate}\n`;
		report += `- **Minor**: ${totalMinor}\n\n`;
		
		if (failedTests > 0) {
			report += '## Failed Tests\n';
			this.results
				.filter(r => !r.passed)
				.forEach(result => {
					report += `### ${result.testName}\n`;
					report += `- **Score**: ${result.score}/100\n`;
					report += `- **Violations**: ${result.violationCount}\n`;
					report += `- **Critical**: ${result.criticalCount}\n`;
					report += `- **Serious**: ${result.seriousCount}\n`;
					report += `- **Moderate**: ${result.moderateCount}\n`;
					report += `- **Minor**: ${result.minorCount}\n`;
					report += `- **Duration**: ${result.duration}ms\n`;
					
					if (result.violations.length > 0) {
						report += '\n**Violations:**\n';
						result.violations.forEach(violation => {
							report += `- **${violation.id}** (${violation.impact}): ${violation.description}\n`;
							report += `  - Help: ${violation.help}\n`;
							report += `  - Nodes: ${violation.nodes.length}\n`;
						});
					}
					report += '\n';
				});
		}
		
		report += '## All Test Results\n';
		this.results.forEach(result => {
			const status = result.passed ? '✅' : '❌';
			report += `${status} **${result.testName}** - Score: ${result.score}/100 (${result.violationCount} violations)\n`;
		});
		
		return report;
	}

	private filterViolations(violations: any[], ignoreSelectors: string[]): AccessibilityViolation[] {
		return violations.filter(violation => {
			return !violation.nodes.some((node: any) => {
				return ignoreSelectors.some(selector => {
					return node.target.some((target: string) => target.includes(selector));
				});
			});
		});
	}

	private calculateViolationCounts(violations: AccessibilityViolation[]): {
		critical: number;
		serious: number;
		moderate: number;
		minor: number;
	} {
		return violations.reduce((counts, violation) => {
			counts[violation.impact]++;
			return counts;
		}, { critical: 0, serious: 0, moderate: 0, minor: 0 });
	}

	private calculateAccessibilityScore(violationCounts: {
		critical: number;
		serious: number;
		moderate: number;
		minor: number;
	}): number {
		// Scoring system: deduct points based on violation severity
		let score = 100;
		
		score -= violationCounts.critical * 25;  // Critical violations: -25 points each
		score -= violationCounts.serious * 15;   // Serious violations: -15 points each
		score -= violationCounts.moderate * 5;   // Moderate violations: -5 points each
		score -= violationCounts.minor * 1;     // Minor violations: -1 point each
		
		return Math.max(0, Math.min(100, score));
	}

	private checkThresholds(
		violationCounts: { critical: number; serious: number; moderate: number; minor: number },
		thresholds: { critical?: number; serious?: number; moderate?: number; minor?: number } = {}
	): boolean {
		return (
			violationCounts.critical <= (thresholds.critical ?? 0) &&
			violationCounts.serious <= (thresholds.serious ?? 0) &&
			violationCounts.moderate <= (thresholds.moderate ?? 5) &&
			violationCounts.minor <= (thresholds.minor ?? 10)
		);
	}

	private async collectMetadata(): Promise<AccessibilityTestResult['metadata']> {
		const viewport = this.page.viewportSize() || { width: 1920, height: 1080 };
		const userAgent = await this.page.evaluate(() => navigator.userAgent);
		
		// Get axe rules information
		const rulesInfo = await this.page.evaluate(() => {
			if (typeof (window as any).axe !== 'undefined') {
				const rules = (window as any).axe.getRules();
				const enabled = rules.filter((rule: any) => rule.enabled).length;
				return {
					total: rules.length,
					enabled,
					disabled: rules.length - enabled
				};
			}
			return { total: 0, enabled: 0, disabled: 0 };
		});
		
		return {
			viewport,
			userAgent,
			rules: rulesInfo
		};
	}

	private async calculateContrastRatio(color: string, backgroundColor: string): Promise<number> {
		// Simplified contrast ratio calculation
		// In a real implementation, you'd want to use a proper color contrast library
		return await this.page.evaluate((fg, bg) => {
			// This is a simplified implementation
			// You should use a proper color contrast calculation library
			const rgb1 = this.parseRgb(fg);
			const rgb2 = this.parseRgb(bg);
			
			if (!rgb1 || !rgb2) return 1;
			
			const l1 = this.getLuminance(rgb1);
			const l2 = this.getLuminance(rgb2);
			
			const lighter = Math.max(l1, l2);
			const darker = Math.min(l1, l2);
			
			return (lighter + 0.05) / (darker + 0.05);
		}, color, backgroundColor);
	}

	getResults(): AccessibilityTestResult[] {
		return [...this.results];
	}

	clearResults(): void {
		this.results = [];
	}

	updateConfig(config: Partial<AccessibilityTestConfig>): void {
		this.config = { ...this.config, ...config };
	}
}

// Helper functions for common accessibility testing scenarios
export async function testPageAccessibility(
	page: Page,
	testName: string,
	options: Partial<AccessibilityTestConfig> = {}
): Promise<AccessibilityTestResult> {
	const tester = new AccessibilityTester(page, options);
	await tester.initialize();
	
	return await tester.testPage(testName, options);
}

export async function testComponentAccessibility(
	page: Page,
	selector: string,
	testName: string,
	options: Partial<AccessibilityTestConfig> = {}
): Promise<AccessibilityTestResult> {
	const tester = new AccessibilityTester(page, options);
	await tester.initialize();
	
	return await tester.testElement(testName, selector, options);
}