import { defineConfig, devices } from "@playwright/test";
import path from "path";

/**
 * Enhanced Playwright Configuration for E2E Testing with Stagehand
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
	testDir: "./tests/e2e",
	outputDir: "test-results/",
	
	/* Run tests in files in parallel */
	fullyParallel: true,
	
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !!process.env.CI,
	
	/* Retry on CI only */
	retries: process.env.CI ? 2 : 0,
	
	/* Opt out of parallel tests on CI. */
	workers: process.env.CI ? 1 : undefined,
	
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: [
		["html", { open: "never", outputFolder: "playwright-report" }],
		["json", { outputFile: "test-results/results.json" }],
		["junit", { outputFile: "test-results/results.xml" }],
		["line"],
		["allure-playwright"],
		["github"]
	],
	
	/* Global setup/teardown */
	globalSetup: require.resolve("./tests/e2e/fixtures/global-setup"),
	globalTeardown: require.resolve("./tests/e2e/fixtures/global-teardown"),
	
	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		/* Base URL to use in actions like `await page.goto('/')`. */
		baseURL: process.env.BASE_URL || "http://localhost:3001",
		
		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: "on-first-retry",
		
		/* Take screenshot on failures */
		screenshot: "only-on-failure",
		
		/* Record video on failures */
		video: "retain-on-failure",
		
		/* Timeout for each action */
		actionTimeout: 15 * 1000,
		
		/* Timeout for navigation */
		navigationTimeout: 30 * 1000,
		
		/* Ignore HTTPS errors */
		ignoreHTTPSErrors: true,
		
		/* Accept downloads */
		acceptDownloads: true,
		
		/* Locale */
		locale: "en-US",
		
		/* Timezone */
		timezoneId: "America/New_York",
		
		/* Viewport */
		viewport: { width: 1280, height: 720 },
		
		/* User agent */
		userAgent: "Mozilla/5.0 (compatible; E2E-Test-Bot/1.0; +https://github.com/claudia-ai/claudia)",
		
		/* Extra headers */
		extraHTTPHeaders: {
			"X-Test-Mode": "e2e"
		},
		
		/* Storage state for authenticated tests */
		storageState: process.env.STORAGE_STATE || undefined,
		
		/* Permissions */
		permissions: ["clipboard-read", "clipboard-write"]
	},
	
	/* Configure projects for major browsers */
	projects: [
		// Setup project for authentication
		{
			name: "setup",
			testMatch: /.*\.setup\.ts/,
			use: {
				...devices["Desktop Chrome"],
				channel: "chrome"
			}
		},
		
		// Desktop browsers
		{
			name: "chromium",
			dependencies: ["setup"],
			use: {
				...devices["Desktop Chrome"],
				channel: "chrome"
			}
		},
		{
			name: "firefox",
			dependencies: ["setup"],
			use: {
				...devices["Desktop Firefox"]
			}
		},
		{
			name: "webkit",
			dependencies: ["setup"],
			use: {
				...devices["Desktop Safari"]
			}
		},
		{
			name: "microsoft-edge",
			dependencies: ["setup"],
			use: {
				...devices["Desktop Edge"],
				channel: "msedge"
			}
		},
		
		// Mobile browsers
		{
			name: "mobile-chrome",
			dependencies: ["setup"],
			use: {
				...devices["Pixel 5"]
			}
		},
		{
			name: "mobile-safari",
			dependencies: ["setup"],
			use: {
				...devices["iPhone 12"]
			}
		},
		{
			name: "mobile-firefox",
			dependencies: ["setup"],
			use: {
				...devices["Pixel 5"],
				channel: "firefox"
			}
		},
		
		// Tablet browsers
		{
			name: "tablet-chrome",
			dependencies: ["setup"],
			use: {
				...devices["iPad Pro"],
				channel: "chrome"
			}
		},
		{
			name: "tablet-safari",
			dependencies: ["setup"],
			use: {
				...devices["iPad Pro"]
			}
		},
		
		// High DPI displays
		{
			name: "high-dpi",
			dependencies: ["setup"],
			use: {
				...devices["Desktop Chrome"],
				deviceScaleFactor: 2,
				viewport: { width: 1920, height: 1080 }
			}
		},
		
		// Performance testing
		{
			name: "performance",
			dependencies: ["setup"],
			testMatch: /.*\.performance\.spec\.ts/,
			use: {
				...devices["Desktop Chrome"],
				channel: "chrome"
			}
		},
		
		// Accessibility testing
		{
			name: "accessibility",
			dependencies: ["setup"],
			testMatch: /.*\.accessibility\.spec\.ts/,
			use: {
				...devices["Desktop Chrome"],
				channel: "chrome"
			}
		},
		
		// Visual regression testing
		{
			name: "visual-regression",
			dependencies: ["setup"],
			testMatch: /.*\.visual\.spec\.ts/,
			use: {
				...devices["Desktop Chrome"],
				channel: "chrome"
			}
		},
		
		// API testing
		{
			name: "api",
			testMatch: /.*\.api\.spec\.ts/,
			use: {
				baseURL: process.env.API_BASE_URL || "http://localhost:3000"
			}
		}
	],
	
	/* Run your local dev server before starting the tests */
	webServer: [
		{
			command: "bun run dev:server",
			url: "http://localhost:3000/health",
			port: 3000,
			reuseExistingServer: !process.env.CI,
			timeout: 120 * 1000,
			stdout: "ignore",
			stderr: "pipe"
		},
		{
			command: "bun run dev:web",
			url: "http://localhost:3001",
			port: 3001,
			reuseExistingServer: !process.env.CI,
			timeout: 120 * 1000,
			stdout: "ignore",
			stderr: "pipe"
		}
	],
	
	/* Global timeout for the entire test run */
	globalTimeout: 20 * 60 * 1000, // 20 minutes
	
	/* Timeout for each test */
	timeout: 60 * 1000, // 60 seconds
	
	/* Expect timeout */
	expect: {
		timeout: 10 * 1000,
		toHaveScreenshot: { 
			mode: "css",
			animations: "disabled",
			threshold: 0.3
		},
		toMatchSnapshot: { 
			threshold: 0.3,
			animations: "disabled"
		}
	},
	
	/* Test metadata */
	metadata: {
		testType: "e2e",
		framework: "playwright",
		ai: "stagehand",
		version: "1.0.0"
	}
});