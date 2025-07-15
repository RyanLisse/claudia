import { expect, type Page } from "@playwright/test";
import { testUsers } from "../fixtures/test-data";

/**
 * Authentication helper functions for E2E tests
 */

export async function loginUser(
	page: Page,
	userType: "admin" | "user" = "user",
) {
	const user = testUsers[userType];

	await page.goto("/login");
	await page.fill('[data-testid="email-input"]', user.email);
	await page.fill('[data-testid="password-input"]', user.password);
	await page.click('[data-testid="login-button"]');

	// Wait for redirect to dashboard
	await page.waitForURL("/dashboard");

	// Verify user is logged in
	await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
}

export async function logoutUser(page: Page) {
	await page.click('[data-testid="user-menu"]');
	await page.click('[data-testid="logout-button"]');

	// Wait for redirect to login page
	await page.waitForURL("/login");
}

export async function setupAuthenticatedUser(
	page: Page,
	userType: "admin" | "user" = "user",
) {
	await loginUser(page, userType);

	// Wait for page to fully load
	await page.waitForLoadState("networkidle");
}

export async function createTestUser(
	page: Page,
	userData: typeof testUsers.user,
) {
	await page.goto("/register");
	await page.fill('[data-testid="name-input"]', userData.name);
	await page.fill('[data-testid="email-input"]', userData.email);
	await page.fill('[data-testid="password-input"]', userData.password);
	await page.fill('[data-testid="confirm-password-input"]', userData.password);
	await page.click('[data-testid="register-button"]');

	// Wait for registration success
	await page.waitForURL("/dashboard");
}

export async function isUserLoggedIn(page: Page): Promise<boolean> {
	try {
		await page.waitForSelector('[data-testid="user-menu"]', { timeout: 5000 });
		return true;
	} catch {
		return false;
	}
}
