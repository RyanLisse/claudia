import { test as base, expect, Page, Browser, BrowserContext } from "@playwright/test";
import { AuthPage } from "../pages/auth-page";
import { DashboardPage } from "../pages/dashboard-page";
import { AgentsPage } from "../pages/agents-page";
import { ProjectsPage } from "../pages/projects-page";
import { SettingsPage } from "../pages/settings-page";
import { StagehandAI } from "../../../utils/stagehand-ai";
import { PerformanceMonitor } from "../utils/performance-monitor";
import { VisualTesting } from "../utils/visual-testing";
import { AccessibilityTesting } from "../utils/accessibility-testing";
import { TestDataManager } from "../utils/test-data-manager";

export interface TestFixtures {
	// Page objects
	authPage: AuthPage;
	dashboardPage: DashboardPage;
	agentsPage: AgentsPage;
	projectsPage: ProjectsPage;
	settingsPage: SettingsPage;
	
	// AI and testing utilities
	stagehandAI: StagehandAI;
	performanceMonitor: PerformanceMonitor;
	visualTesting: VisualTesting;
	accessibilityTesting: AccessibilityTesting;
	testDataManager: TestDataManager;
	
	// Enhanced page with AI capabilities
	aiPage: Page;
	
	// Authenticated context
	authenticatedContext: BrowserContext;
	authenticatedPage: Page;
	
	// Admin context
	adminContext: BrowserContext;
	adminPage: Page;
	
	// Performance context
	performanceContext: BrowserContext;
	performancePage: Page;
	
	// Visual testing context
	visualContext: BrowserContext;
	visualPage: Page;
	
	// API context
	apiContext: BrowserContext;
}

export const test = base.extend<TestFixtures>({
	// Page objects
	authPage: async ({ page }, use) => {
		const authPage = new AuthPage(page);
		await use(authPage);
	},
	
	dashboardPage: async ({ page }, use) => {
		const dashboardPage = new DashboardPage(page);
		await use(dashboardPage);
	},
	
	agentsPage: async ({ page }, use) => {
		const agentsPage = new AgentsPage(page);
		await use(agentsPage);
	},
	
	projectsPage: async ({ page }, use) => {
		const projectsPage = new ProjectsPage(page);
		await use(projectsPage);
	},
	
	settingsPage: async ({ page }, use) => {
		const settingsPage = new SettingsPage(page);
		await use(settingsPage);
	},
	
	// AI and testing utilities
	stagehandAI: async ({ page }, use) => {
		const stagehandAI = new StagehandAI(page);
		await use(stagehandAI);
		await stagehandAI.cleanup();
	},
	
	performanceMonitor: async ({ page }, use) => {
		const performanceMonitor = new PerformanceMonitor(page);
		await use(performanceMonitor);
	},
	
	visualTesting: async ({ page }, use) => {
		const visualTesting = new VisualTesting(page);
		await use(visualTesting);
	},
	
	accessibilityTesting: async ({ page }, use) => {
		const accessibilityTesting = new AccessibilityTesting(page);
		await use(accessibilityTesting);
	},
	
	testDataManager: async ({ page }, use) => {
		const testDataManager = new TestDataManager(page);
		await use(testDataManager);
		await testDataManager.cleanup();
	},
	
	// Enhanced page with AI capabilities
	aiPage: async ({ page }, use) => {
		// Add AI-specific headers and configuration
		await page.setExtraHTTPHeaders({
			"X-AI-Test-Mode": "true",
			"X-Test-Agent": "stagehand-ai"
		});
		
		// Enable console logging for AI debugging
		page.on("console", (msg) => {
			if (msg.type() === "error") {
				console.error(`AI Page Error: ${msg.text()}`);
			}
		});
		
		await use(page);
	},
	
	// Authenticated context
	authenticatedContext: async ({ browser }, use) => {
		const context = await browser.newContext({
			storageState: process.env.STORAGE_STATE || undefined,
			permissions: ["clipboard-read", "clipboard-write", "notifications"]
		});
		
		await use(context);
		await context.close();
	},
	
	authenticatedPage: async ({ authenticatedContext }, use) => {
		const page = await authenticatedContext.newPage();
		await use(page);
		await page.close();
	},
	
	// Admin context
	adminContext: async ({ browser }, use) => {
		const context = await browser.newContext({
			storageState: process.env.ADMIN_STORAGE_STATE || undefined,
			permissions: ["clipboard-read", "clipboard-write", "notifications"]
		});
		
		await use(context);
		await context.close();
	},
	
	adminPage: async ({ adminContext }, use) => {
		const page = await adminContext.newPage();
		await use(page);
		await page.close();
	},
	
	// Performance context
	performanceContext: async ({ browser }, use) => {
		const context = await browser.newContext({
			// Performance-optimized settings
			viewport: { width: 1280, height: 720 },
			ignoreHTTPSErrors: true,
			// Disable images and CSS for performance testing
			...process.env.PERFORMANCE_MODE === "network" && {
				offline: false,
				// Mock slow network conditions
				connectionType: "slow-2g"
			}
		});
		
		await use(context);
		await context.close();
	},
	
	performancePage: async ({ performanceContext }, use) => {
		const page = await performanceContext.newPage();
		
		// Start performance monitoring
		await page.goto("about:blank");
		await page.evaluate(() => {
			// @ts-ignore
			window.performance.mark("test-start");
		});
		
		await use(page);
		await page.close();
	},
	
	// Visual testing context
	visualContext: async ({ browser }, use) => {
		const context = await browser.newContext({
			viewport: { width: 1280, height: 720 },
			deviceScaleFactor: 1,
			colorScheme: "light",
			reducedMotion: "reduce"
		});
		
		await use(context);
		await context.close();
	},
	
	visualPage: async ({ visualContext }, use) => {
		const page = await visualContext.newPage();
		
		// Disable animations for consistent screenshots
		await page.addInitScript(() => {
			// @ts-ignore
			document.addEventListener("DOMContentLoaded", () => {
				const style = document.createElement("style");
				style.textContent = `
					*, *::before, *::after {
						animation-duration: 0.001ms !important;
						animation-delay: 0ms !important;
						transition-duration: 0.001ms !important;
						transition-delay: 0ms !important;
					}
				`;
				document.head.appendChild(style);
			});
		});
		
		await use(page);
		await page.close();
	},
	
	// API context
	apiContext: async ({ browser }, use) => {
		const context = await browser.newContext({
			baseURL: process.env.API_BASE_URL || "http://localhost:3000"
		});
		
		await use(context);
		await context.close();
	}
});

// Test utilities
export const testUtils = {
	/**
	 * Wait for API response
	 */
	async waitForAPIResponse(page: Page, url: string, timeout = 30000): Promise<any> {
		const responsePromise = page.waitForResponse(
			response => response.url().includes(url) && response.status() === 200,
			{ timeout }
		);
		
		const response = await responsePromise;
		return await response.json();
	},
	
	/**
	 * Mock API response
	 */
	async mockAPIResponse(page: Page, url: string, mockData: any): Promise<void> {
		await page.route(`**/${url}`, route => {
			route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(mockData)
			});
		});
	},
	
	/**
	 * Wait for element to be stable
	 */
	async waitForElementStable(page: Page, selector: string, timeout = 10000): Promise<void> {
		const element = page.locator(selector);
		await element.waitFor({ state: "visible", timeout });
		
		// Wait for element to stop moving
		let lastBox = await element.boundingBox();
		let attempts = 0;
		
		while (attempts < 10) {
			await page.waitForTimeout(100);
			const currentBox = await element.boundingBox();
			
			if (lastBox && currentBox && 
				lastBox.x === currentBox.x && 
				lastBox.y === currentBox.y &&
				lastBox.width === currentBox.width &&
				lastBox.height === currentBox.height) {
				break;
			}
			
			lastBox = currentBox;
			attempts++;
		}
	},
	
	/**
	 * Generate test data
	 */
	generateTestData: {
		user: () => ({
			name: `Test User ${Date.now()}`,
			email: `test.user.${Date.now()}@example.com`,
			password: "TestPassword123!"
		}),
		project: () => ({
			name: `Test Project ${Date.now()}`,
			description: `AI-generated test project created at ${new Date().toISOString()}`,
			type: "web-app"
		}),
		agent: () => ({
			name: `Test Agent ${Date.now()}`,
			type: "coder",
			capabilities: ["TypeScript", "React", "Node.js"],
			description: "AI-powered coding assistant for testing purposes"
		}),
		task: () => ({
			title: `Test Task ${Date.now()}`,
			description: "Create a simple React component with TypeScript",
			priority: "medium",
			type: "code-generation"
		})
	},
	
	/**
	 * Clear test data
	 */
	async clearTestData(page: Page): Promise<void> {
		// Clear local storage
		await page.evaluate(() => {
			localStorage.clear();
			sessionStorage.clear();
		});
		
		// Clear cookies
		await page.context().clearCookies();
		
		// Clear IndexedDB
		await page.evaluate(() => {
			if (window.indexedDB) {
				// @ts-ignore
				window.indexedDB.databases().then(databases => {
					databases.forEach(db => {
						if (db.name) {
							window.indexedDB.deleteDatabase(db.name);
						}
					});
				});
			}
		});
	},
	
	/**
	 * Wait for network idle
	 */
	async waitForNetworkIdle(page: Page, timeout = 30000): Promise<void> {
		await page.waitForLoadState("networkidle", { timeout });
	},
	
	/**
	 * Take performance snapshot
	 */
	async takePerformanceSnapshot(page: Page, name: string): Promise<any> {
		const metrics = await page.evaluate(() => {
			const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
			const paint = performance.getEntriesByType("paint");
			
			return {
				navigation: {
					domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
					loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
					firstByte: navigation.responseStart - navigation.requestStart,
					domInteractive: navigation.domInteractive - navigation.fetchStart
				},
				paint: paint.reduce((acc, entry) => {
					acc[entry.name] = entry.startTime;
					return acc;
				}, {} as Record<string, number>),
				memory: (performance as any).memory ? {
					usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
					totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
					jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
				} : null
			};
		});
		
		console.log(`Performance snapshot "${name}":`, metrics);
		return metrics;
	}
};

export { expect } from "@playwright/test";