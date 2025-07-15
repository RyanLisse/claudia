import { Page, expect } from "@playwright/test";
import { PerformanceMonitor } from "./performance-monitor";

export interface VisualTestConfig {
	threshold?: number;
	maxDiffPixels?: number;
	animations?: 'disabled' | 'allow' | 'wait';
	clip?: {
		x: number;
		y: number;
		width: number;
		height: number;
	};
	fullPage?: boolean;
	mask?: string[];
	omitBackground?: boolean;
	timeout?: number;
	mode?: 'light' | 'dark' | 'both';
	devices?: string[];
	viewports?: Array<{
		width: number;
		height: number;
		name: string;
	}>;
}

export interface VisualTestResult {
	testName: string;
	passed: boolean;
	diffPixels?: number;
	diffRatio?: number;
	actualPath?: string;
	expectedPath?: string;
	diffPath?: string;
	error?: string;
	metadata: {
		viewport: { width: number; height: number };
		devicePixelRatio: number;
		userAgent: string;
		timestamp: Date;
		duration: number;
	};
}

export interface VisualTestSuite {
	name: string;
	results: VisualTestResult[];
	summary: {
		total: number;
		passed: number;
		failed: number;
		passRate: number;
		duration: number;
	};
}

export class VisualTester {
	private page: Page;
	private performanceMonitor: PerformanceMonitor;
	private config: Required<VisualTestConfig>;
	private results: VisualTestResult[] = [];
	private suiteStartTime: number = 0;

	constructor(page: Page, config: VisualTestConfig = {}) {
		this.page = page;
		this.performanceMonitor = new PerformanceMonitor(page);
		this.config = {
			threshold: config.threshold ?? 0.2,
			maxDiffPixels: config.maxDiffPixels ?? 1000,
			animations: config.animations ?? 'disabled',
			clip: config.clip ?? undefined,
			fullPage: config.fullPage ?? false,
			mask: config.mask ?? [],
			omitBackground: config.omitBackground ?? false,
			timeout: config.timeout ?? 30000,
			mode: config.mode ?? 'light',
			devices: config.devices ?? ['desktop'],
			viewports: config.viewports ?? [
				{ width: 1920, height: 1080, name: 'desktop' },
				{ width: 1024, height: 768, name: 'tablet' },
				{ width: 375, height: 667, name: 'mobile' }
			]
		};
	}

	async startSuite(name: string): Promise<void> {
		this.suiteStartTime = Date.now();
		this.results = [];
		
		// Setup common visual testing configurations
		await this.setupVisualTesting();
		
		console.log(`Starting visual test suite: ${name}`);
	}

	async endSuite(name: string): Promise<VisualTestSuite> {
		const duration = Date.now() - this.suiteStartTime;
		const passed = this.results.filter(r => r.passed).length;
		const failed = this.results.length - passed;
		
		const suite: VisualTestSuite = {
			name,
			results: [...this.results],
			summary: {
				total: this.results.length,
				passed,
				failed,
				passRate: this.results.length > 0 ? (passed / this.results.length) * 100 : 0,
				duration
			}
		};

		console.log(`Visual test suite completed: ${name}`);
		console.log(`Results: ${passed}/${this.results.length} passed (${suite.summary.passRate.toFixed(1)}%)`);
		
		return suite;
	}

	async compareScreenshot(
		testName: string,
		options: Partial<VisualTestConfig> = {}
	): Promise<VisualTestResult> {
		const startTime = Date.now();
		const testConfig = { ...this.config, ...options };
		
		try {
			await this.preparePageForScreenshot(testConfig);
			
			const metadata = await this.collectMetadata();
			
			// Take screenshot and compare
			const screenshotOptions = {
				threshold: testConfig.threshold,
				maxDiffPixels: testConfig.maxDiffPixels,
				animations: testConfig.animations,
				clip: testConfig.clip,
				fullPage: testConfig.fullPage,
				mask: testConfig.mask.map(selector => this.page.locator(selector)),
				omitBackground: testConfig.omitBackground,
				timeout: testConfig.timeout
			};

			// Perform visual comparison
			await expect(this.page).toHaveScreenshot(`${testName}.png`, screenshotOptions);
			
			const result: VisualTestResult = {
				testName,
				passed: true,
				metadata: {
					...metadata,
					duration: Date.now() - startTime
				}
			};
			
			this.results.push(result);
			return result;
			
		} catch (error) {
			const metadata = await this.collectMetadata();
			const result: VisualTestResult = {
				testName,
				passed: false,
				error: error instanceof Error ? error.message : String(error),
				metadata: {
					...metadata,
					duration: Date.now() - startTime
				}
			};
			
			this.results.push(result);
			return result;
		}
	}

	async compareElement(
		testName: string,
		selector: string,
		options: Partial<VisualTestConfig> = {}
	): Promise<VisualTestResult> {
		const startTime = Date.now();
		const testConfig = { ...this.config, ...options };
		
		try {
			await this.preparePageForScreenshot(testConfig);
			
			const element = this.page.locator(selector);
			await element.waitFor({ state: 'visible' });
			
			const metadata = await this.collectMetadata();
			
			// Take element screenshot and compare
			const screenshotOptions = {
				threshold: testConfig.threshold,
				maxDiffPixels: testConfig.maxDiffPixels,
				animations: testConfig.animations,
				mask: testConfig.mask.map(maskSelector => this.page.locator(maskSelector)),
				omitBackground: testConfig.omitBackground,
				timeout: testConfig.timeout
			};

			await expect(element).toHaveScreenshot(`${testName}-element.png`, screenshotOptions);
			
			const result: VisualTestResult = {
				testName: `${testName}-element`,
				passed: true,
				metadata: {
					...metadata,
					duration: Date.now() - startTime
				}
			};
			
			this.results.push(result);
			return result;
			
		} catch (error) {
			const metadata = await this.collectMetadata();
			const result: VisualTestResult = {
				testName: `${testName}-element`,
				passed: false,
				error: error instanceof Error ? error.message : String(error),
				metadata: {
					...metadata,
					duration: Date.now() - startTime
				}
			};
			
			this.results.push(result);
			return result;
		}
	}

	async compareResponsiveScreenshots(
		testName: string,
		options: Partial<VisualTestConfig> = {}
	): Promise<VisualTestResult[]> {
		const results: VisualTestResult[] = [];
		const testConfig = { ...this.config, ...options };
		
		for (const viewport of testConfig.viewports) {
			await this.page.setViewportSize({
				width: viewport.width,
				height: viewport.height
			});
			
			// Wait for responsive changes to take effect
			await this.page.waitForTimeout(500);
			
			const result = await this.compareScreenshot(
				`${testName}-${viewport.name}`,
				options
			);
			
			results.push(result);
		}
		
		return results;
	}

	async compareComponentStates(
		testName: string,
		selector: string,
		states: Array<{
			name: string;
			setup: () => Promise<void>;
		}>,
		options: Partial<VisualTestConfig> = {}
	): Promise<VisualTestResult[]> {
		const results: VisualTestResult[] = [];
		
		for (const state of states) {
			// Setup the component state
			await state.setup();
			
			// Wait for state change to complete
			await this.page.waitForTimeout(300);
			
			const result = await this.compareElement(
				`${testName}-${state.name}`,
				selector,
				options
			);
			
			results.push(result);
		}
		
		return results;
	}

	async compareInteractionStates(
		testName: string,
		selector: string,
		interactions: Array<{
			name: string;
			action: () => Promise<void>;
		}>,
		options: Partial<VisualTestConfig> = {}
	): Promise<VisualTestResult[]> {
		const results: VisualTestResult[] = [];
		
		for (const interaction of interactions) {
			// Perform the interaction
			await interaction.action();
			
			// Wait for interaction effects to complete
			await this.page.waitForTimeout(300);
			
			const result = await this.compareElement(
				`${testName}-${interaction.name}`,
				selector,
				options
			);
			
			results.push(result);
		}
		
		return results;
	}

	async compareThemes(
		testName: string,
		themes: Array<{
			name: string;
			className: string;
		}>,
		options: Partial<VisualTestConfig> = {}
	): Promise<VisualTestResult[]> {
		const results: VisualTestResult[] = [];
		
		for (const theme of themes) {
			// Apply theme
			await this.page.evaluate((className) => {
				document.documentElement.className = className;
			}, theme.className);
			
			// Wait for theme to apply
			await this.page.waitForTimeout(500);
			
			const result = await this.compareScreenshot(
				`${testName}-${theme.name}`,
				options
			);
			
			results.push(result);
		}
		
		return results;
	}

	async compareLoadingStates(
		testName: string,
		selector: string,
		options: Partial<VisualTestConfig> = {}
	): Promise<VisualTestResult[]> {
		const results: VisualTestResult[] = [];
		
		// Test different loading states
		const loadingStates = [
			{
				name: 'loading',
				setup: async () => {
					await this.page.evaluate((sel) => {
						const element = document.querySelector(sel);
						if (element) {
							element.classList.add('loading');
						}
					}, selector);
				}
			},
			{
				name: 'loaded',
				setup: async () => {
					await this.page.evaluate((sel) => {
						const element = document.querySelector(sel);
						if (element) {
							element.classList.remove('loading');
						}
					}, selector);
				}
			},
			{
				name: 'error',
				setup: async () => {
					await this.page.evaluate((sel) => {
						const element = document.querySelector(sel);
						if (element) {
							element.classList.add('error');
						}
					}, selector);
				}
			}
		];
		
		for (const state of loadingStates) {
			await state.setup();
			await this.page.waitForTimeout(200);
			
			const result = await this.compareElement(
				`${testName}-${state.name}`,
				selector,
				options
			);
			
			results.push(result);
		}
		
		return results;
	}

	async compareFormStates(
		testName: string,
		formSelector: string,
		options: Partial<VisualTestConfig> = {}
	): Promise<VisualTestResult[]> {
		const results: VisualTestResult[] = [];
		
		const formStates = [
			{
				name: 'empty',
				setup: async () => {
					await this.page.evaluate((sel) => {
						const form = document.querySelector(sel) as HTMLFormElement;
						if (form) {
							form.reset();
						}
					}, formSelector);
				}
			},
			{
				name: 'filled',
				setup: async () => {
					const inputs = this.page.locator(`${formSelector} input`);
					const count = await inputs.count();
					
					for (let i = 0; i < count; i++) {
						const input = inputs.nth(i);
						const type = await input.getAttribute('type');
						
						if (type === 'text' || type === 'email') {
							await input.fill('test@example.com');
						} else if (type === 'password') {
							await input.fill('password123');
						} else if (type === 'number') {
							await input.fill('123');
						}
					}
				}
			},
			{
				name: 'validation-error',
				setup: async () => {
					// Add validation error classes
					await this.page.evaluate((sel) => {
						const inputs = document.querySelectorAll(`${sel} input`);
						inputs.forEach(input => {
							input.classList.add('error');
						});
					}, formSelector);
				}
			}
		];
		
		for (const state of formStates) {
			await state.setup();
			await this.page.waitForTimeout(300);
			
			const result = await this.compareElement(
				`${testName}-${state.name}`,
				formSelector,
				options
			);
			
			results.push(result);
		}
		
		return results;
	}

	async generateVisualReport(): Promise<string> {
		const totalTests = this.results.length;
		const passedTests = this.results.filter(r => r.passed).length;
		const failedTests = totalTests - passedTests;
		const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
		
		let report = '# Visual Testing Report\n\n';
		
		report += '## Summary\n';
		report += `- **Total Tests**: ${totalTests}\n`;
		report += `- **Passed**: ${passedTests}\n`;
		report += `- **Failed**: ${failedTests}\n`;
		report += `- **Pass Rate**: ${passRate.toFixed(1)}%\n\n`;
		
		if (failedTests > 0) {
			report += '## Failed Tests\n';
			this.results
				.filter(r => !r.passed)
				.forEach(result => {
					report += `### ${result.testName}\n`;
					report += `- **Error**: ${result.error}\n`;
					report += `- **Duration**: ${result.metadata.duration}ms\n`;
					report += `- **Viewport**: ${result.metadata.viewport.width}x${result.metadata.viewport.height}\n`;
					if (result.diffPixels) {
						report += `- **Diff Pixels**: ${result.diffPixels}\n`;
					}
					if (result.diffRatio) {
						report += `- **Diff Ratio**: ${result.diffRatio.toFixed(3)}\n`;
					}
					report += '\n';
				});
		}
		
		report += '## Test Details\n';
		this.results.forEach(result => {
			const status = result.passed ? '✅' : '❌';
			report += `${status} **${result.testName}** (${result.metadata.duration}ms)\n`;
		});
		
		return report;
	}

	private async setupVisualTesting(): Promise<void> {
		// Disable animations if configured
		if (this.config.animations === 'disabled') {
			await this.page.addStyleTag({
				content: `
					*, *::before, *::after {
						animation-duration: 0s !important;
						animation-delay: 0s !important;
						transition-duration: 0s !important;
						transition-delay: 0s !important;
					}
				`
			});
		}
		
		// Set up consistent fonts
		await this.page.addStyleTag({
			content: `
				* {
					font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
				}
			`
		});
		
		// Hide scrollbars for consistent screenshots
		await this.page.addStyleTag({
			content: `
				::-webkit-scrollbar {
					display: none !important;
				}
				* {
					scrollbar-width: none !important;
				}
			`
		});
	}

	private async preparePageForScreenshot(config: Required<VisualTestConfig>): Promise<void> {
		// Wait for page to be ready
		await this.page.waitForLoadState('networkidle');
		
		// Wait for animations to complete if configured
		if (config.animations === 'wait') {
			await this.page.waitForTimeout(1000);
		}
		
		// Ensure fonts are loaded
		await this.page.waitForFunction(() => document.fonts.ready);
		
		// Wait for images to load
		await this.page.waitForFunction(() => {
			const images = Array.from(document.images);
			return images.every(img => img.complete);
		});
	}

	private async collectMetadata(): Promise<VisualTestResult['metadata']> {
		const viewport = this.page.viewportSize() || { width: 1920, height: 1080 };
		const userAgent = await this.page.evaluate(() => navigator.userAgent);
		
		return {
			viewport,
			devicePixelRatio: await this.page.evaluate(() => window.devicePixelRatio),
			userAgent,
			timestamp: new Date(),
			duration: 0 // Will be set by caller
		};
	}

	getResults(): VisualTestResult[] {
		return [...this.results];
	}

	clearResults(): void {
		this.results = [];
	}

	updateConfig(config: Partial<VisualTestConfig>): void {
		this.config = { ...this.config, ...config };
	}
}

// Helper functions for common visual testing scenarios
export async function testComponentVisuals(
	page: Page,
	selector: string,
	testName: string,
	options: Partial<VisualTestConfig> = {}
): Promise<VisualTestResult> {
	const tester = new VisualTester(page, options);
	await tester.startSuite(testName);
	
	const result = await tester.compareElement(testName, selector, options);
	await tester.endSuite(testName);
	
	return result;
}

export async function testPageVisuals(
	page: Page,
	testName: string,
	options: Partial<VisualTestConfig> = {}
): Promise<VisualTestResult> {
	const tester = new VisualTester(page, options);
	await tester.startSuite(testName);
	
	const result = await tester.compareScreenshot(testName, options);
	await tester.endSuite(testName);
	
	return result;
}

export async function testResponsiveVisuals(
	page: Page,
	testName: string,
	options: Partial<VisualTestConfig> = {}
): Promise<VisualTestResult[]> {
	const tester = new VisualTester(page, options);
	await tester.startSuite(testName);
	
	const results = await tester.compareResponsiveScreenshots(testName, options);
	await tester.endSuite(testName);
	
	return results;
}