import { expect, test } from "@playwright/test";

/**
 * Smoke tests to verify basic application functionality
 */

test.describe("Smoke Tests", () => {
	test.beforeEach(async ({ page }) => {
		// Set up any necessary test data or state
		await page.goto("/");
	});

	test("should load the home page", async ({ page }) => {
		await page.goto("/");

		// Check if page loads successfully
		await expect(page).toHaveTitle(/Claudia/);

		// Check if main content is visible
		await expect(page.locator("main")).toBeVisible();

		// Take screenshot for visual verification
		await page.screenshot({ path: "test-results/screenshots/homepage.png" });
	});

	test("should navigate to dashboard", async ({ page }) => {
		await page.goto("/dashboard");

		// Check if dashboard loads
		await expect(page).toHaveURL(/.*dashboard/);

		// Check if main dashboard elements are present
		await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
		await expect(page.locator('[data-testid="main-content"]')).toBeVisible();

		// Take screenshot
		await page.screenshot({ path: "test-results/screenshots/dashboard.png" });
	});

	test("should navigate to projects page", async ({ page }) => {
		await page.goto("/projects");

		// Check if projects page loads
		await expect(page).toHaveURL(/.*projects/);

		// Check if projects list is visible
		await expect(page.locator('[data-testid="projects-list"]')).toBeVisible();

		// Take screenshot
		await page.screenshot({ path: "test-results/screenshots/projects.png" });
	});

	test("should navigate to agents page", async ({ page }) => {
		await page.goto("/agents");

		// Check if agents page loads
		await expect(page).toHaveURL(/.*agents/);

		// Check if agents list is visible
		await expect(page.locator('[data-testid="agents-list"]')).toBeVisible();

		// Take screenshot
		await page.screenshot({ path: "test-results/screenshots/agents.png" });
	});

	test("should handle 404 page", async ({ page }) => {
		await page.goto("/non-existent-page");

		// Check if 404 page is shown
		await expect(page.locator("text=404")).toBeVisible();

		// Take screenshot
		await page.screenshot({ path: "test-results/screenshots/404.png" });
	});

	test("should load CSS and JavaScript resources", async ({ page }) => {
		const responses: string[] = [];

		// Track all responses
		page.on("response", (response) => {
			responses.push(response.url());
		});

		await page.goto("/");

		// Wait for page to fully load
		await page.waitForLoadState("networkidle");

		// Check if CSS files are loaded
		const cssLoaded = responses.some((url) => url.includes(".css"));
		expect(cssLoaded).toBe(true);

		// Check if JavaScript files are loaded
		const jsLoaded = responses.some((url) => url.includes(".js"));
		expect(jsLoaded).toBe(true);

		// Check if no 404 responses for resources
		const failedRequests = responses.filter((url) => {
			return page.url().includes("404") || url.includes("error");
		});
		expect(failedRequests.length).toBe(0);
	});

	test("should be responsive on mobile", async ({ page }) => {
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });

		await page.goto("/");

		// Check if page is responsive
		await expect(page.locator("main")).toBeVisible();

		// Check if mobile menu is available
		const mobileMenu = page.locator('[data-testid="mobile-menu"]');
		if (await mobileMenu.isVisible()) {
			await mobileMenu.click();
			await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
		}

		// Take screenshot
		await page.screenshot({ path: "test-results/screenshots/mobile.png" });
	});

	test("should handle theme switching", async ({ page }) => {
		await page.goto("/");

		// Find theme toggle button
		const themeToggle = page.locator('[data-testid="theme-toggle"]');

		if (await themeToggle.isVisible()) {
			// Click theme toggle
			await themeToggle.click();

			// Check if theme changes
			const html = page.locator("html");
			const currentTheme = await html.getAttribute("data-theme");

			// Toggle again
			await themeToggle.click();

			// Check if theme changed back
			const newTheme = await html.getAttribute("data-theme");
			expect(newTheme).not.toBe(currentTheme);
		}

		// Take screenshot
		await page.screenshot({ path: "test-results/screenshots/theme.png" });
	});

	test("should handle browser navigation", async ({ page }) => {
		await page.goto("/");

		// Navigate to different pages
		await page.goto("/dashboard");
		await page.goto("/projects");
		await page.goto("/agents");

		// Test back button
		await page.goBack();
		await expect(page).toHaveURL(/.*projects/);

		// Test forward button
		await page.goForward();
		await expect(page).toHaveURL(/.*agents/);

		// Test refresh
		await page.reload();
		await expect(page).toHaveURL(/.*agents/);
	});

	test("should load within reasonable time", async ({ page }) => {
		const startTime = Date.now();

		await page.goto("/");
		await page.waitForLoadState("networkidle");

		const loadTime = Date.now() - startTime;

		// Page should load within 5 seconds
		expect(loadTime).toBeLessThan(5000);
	});
});
