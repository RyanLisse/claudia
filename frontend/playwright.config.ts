import { defineConfig, devices } from "@playwright/test";

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
	testDir: "./tests/e2e",

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
		["html", { open: "never" }],
		["json", { outputFile: "test-results/results.json" }],
		["junit", { outputFile: "test-results/results.xml" }],
		["line"],
	],

	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		/* Base URL to use in actions like `await page.goto('/')`. */
		baseURL: "http://localhost:3001",

		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: "on-first-retry",

		/* Take screenshot on failures */
		screenshot: "only-on-failure",

		/* Record video on failures */
		video: "retain-on-failure",

		/* Timeout for each action */
		actionTimeout: 10 * 1000,

		/* Timeout for navigation */
		navigationTimeout: 30 * 1000,
	},

	/* Configure projects for major browsers */
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
		{
			name: "firefox",
			use: { ...devices["Desktop Firefox"] },
		},
		{
			name: "webkit",
			use: { ...devices["Desktop Safari"] },
		},

		/* Test against mobile viewports. */
		{
			name: "Mobile Chrome",
			use: { ...devices["Pixel 5"] },
		},
		{
			name: "Mobile Safari",
			use: { ...devices["iPhone 12"] },
		},

		/* Test against branded browsers. */
		{
			name: "Microsoft Edge",
			use: { ...devices["Desktop Edge"], channel: "msedge" },
		},
		{
			name: "Google Chrome",
			use: { ...devices["Desktop Chrome"], channel: "chrome" },
		},
	],

	/* Run your local dev server before starting the tests */
	webServer: [
		{
			command: "bun run dev:server",
			port: 3000,
			reuseExistingServer: !process.env.CI,
			timeout: 120 * 1000,
		},
		{
			command: "bun run dev:web",
			port: 3001,
			reuseExistingServer: !process.env.CI,
			timeout: 120 * 1000,
		},
	],

	/* Folder for test artifacts such as screenshots, videos, traces, etc. */
	outputDir: "test-results/",

	/* Global timeout for the entire test run */
	globalTimeout: 10 * 60 * 1000, // 10 minutes

	/* Timeout for each test */
	timeout: 30 * 1000,

	/* Expect timeout */
	expect: {
		timeout: 5 * 1000,
	},
});
