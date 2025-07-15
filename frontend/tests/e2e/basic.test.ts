import { expect, test } from "@playwright/test";

/**
 * Basic E2E test without server dependency
 */

test.describe("Basic E2E Tests", () => {
	test("should verify test configuration", async ({ page }) => {
		// Navigate to a simple page
		await page.goto("https://example.com");

		// Verify page loads
		await expect(page).toHaveTitle(/Example Domain/);

		// Verify basic page content
		await expect(page.locator("h1")).toContainText("Example Domain");

		// Take screenshot
		await page.screenshot({ path: "test-results/screenshots/basic-test.png" });
	});

	test("should handle viewport changes", async ({ page }) => {
		// Test desktop viewport
		await page.setViewportSize({ width: 1280, height: 720 });
		await page.goto("https://example.com");

		// Verify content is visible
		await expect(page.locator("h1")).toBeVisible();

		// Test mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });
		await page.reload();

		// Content should still be visible
		await expect(page.locator("h1")).toBeVisible();
	});

	test("should handle basic interactions", async ({ page }) => {
		await page.goto("https://example.com");

		// Test keyboard navigation
		await page.keyboard.press("Tab");

		// Test page scrolling
		await page.evaluate(() => window.scrollTo(0, 100));

		// Test back/forward navigation
		await page.goBack();
		await page.goForward();

		// Verify page is still accessible
		await expect(page.locator("h1")).toBeVisible();
	});
});
