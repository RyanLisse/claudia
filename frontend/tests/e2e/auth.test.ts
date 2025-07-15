import { expect, test } from "@playwright/test";
import { testUsers } from "./fixtures/test-data";
import { clearDatabase, seedTestData } from "./helpers/db";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";

/**
 * Authentication E2E tests
 */

test.describe("Authentication", () => {
	let loginPage: LoginPage;
	let dashboardPage: DashboardPage;

	test.beforeEach(async ({ page }) => {
		loginPage = new LoginPage(page);
		dashboardPage = new DashboardPage(page);

		// Clear and seed database
		await clearDatabase(page);
		await seedTestData(page);
	});

	test("should login with valid credentials", async ({ page }) => {
		await loginPage.goto();
		await loginPage.expectLoginFormVisible();

		await loginPage.login(testUsers.user.email, testUsers.user.password);
		await loginPage.waitForLoginSuccess();

		await dashboardPage.expectDashboardVisible();
		await dashboardPage.expectUserMenuVisible();
	});

	test("should show error with invalid credentials", async ({ page }) => {
		await loginPage.goto();

		await loginPage.login("invalid@email.com", "wrongpassword");
		await loginPage.waitForLoginError();

		await loginPage.expectLoginError("Invalid credentials");
	});

	test("should validate email format", async ({ page }) => {
		await loginPage.goto();

		await loginPage.login("invalid-email", testUsers.user.password);

		// Check for client-side validation
		const emailInput = page.locator('[data-testid="email-input"]');
		const validationMessage = await emailInput.evaluate(
			(el: HTMLInputElement) => el.validationMessage,
		);
		expect(validationMessage).toContain("email");
	});

	test("should require password", async ({ page }) => {
		await loginPage.goto();

		await loginPage.fillField(
			'[data-testid="email-input"]',
			testUsers.user.email,
		);
		await loginPage.submitForm();

		// Check for required field validation
		const passwordInput = page.locator('[data-testid="password-input"]');
		const validationMessage = await passwordInput.evaluate(
			(el: HTMLInputElement) => el.validationMessage,
		);
		expect(validationMessage).toContain("required");
	});

	test("should logout successfully", async ({ page }) => {
		// First login
		await loginPage.goto();
		await loginPage.login(testUsers.user.email, testUsers.user.password);
		await loginPage.waitForLoginSuccess();

		// Then logout
		await dashboardPage.logout();
		await loginPage.expectUrl("/login");
	});

	test("should redirect to login when accessing protected route", async ({
		page,
	}) => {
		await page.goto("/dashboard");

		// Should redirect to login
		await expect(page).toHaveURL(/.*login/);
		await loginPage.expectLoginFormVisible();
	});

	test("should maintain session on page refresh", async ({ page }) => {
		// Login first
		await loginPage.goto();
		await loginPage.login(testUsers.user.email, testUsers.user.password);
		await loginPage.waitForLoginSuccess();

		// Refresh page
		await page.reload();
		await page.waitForLoadState("networkidle");

		// Should still be logged in
		await dashboardPage.expectDashboardVisible();
	});

	test("should handle concurrent login attempts", async ({ page, context }) => {
		// Create second page for concurrent test
		const page2 = await context.newPage();
		const loginPage2 = new LoginPage(page2);

		// Start login on both pages simultaneously
		await Promise.all([loginPage.goto(), loginPage2.goto()]);

		await Promise.all([
			loginPage.login(testUsers.user.email, testUsers.user.password),
			loginPage2.login(testUsers.user.email, testUsers.user.password),
		]);

		// Both should succeed
		await Promise.all([
			loginPage.waitForLoginSuccess(),
			loginPage2.waitForLoginSuccess(),
		]);

		await page2.close();
	});

	test("should handle network errors gracefully", async ({ page }) => {
		await loginPage.goto();

		// Simulate network failure
		await page.route("**/api/auth/login", (route) => {
			route.abort("failed");
		});

		await loginPage.login(testUsers.user.email, testUsers.user.password);

		// Should show network error
		await loginPage.expectLoginError("Network error");
	});

	test("should clear form on page reload", async ({ page }) => {
		await loginPage.goto();

		// Fill form
		await loginPage.fillField(
			'[data-testid="email-input"]',
			testUsers.user.email,
		);
		await loginPage.fillField(
			'[data-testid="password-input"]',
			testUsers.user.password,
		);

		// Reload page
		await page.reload();

		// Form should be cleared
		await expect(page.locator('[data-testid="email-input"]')).toHaveValue("");
		await expect(page.locator('[data-testid="password-input"]')).toHaveValue(
			"",
		);
	});

	test("should handle multiple logout attempts", async ({ page }) => {
		// Login first
		await loginPage.goto();
		await loginPage.login(testUsers.user.email, testUsers.user.password);
		await loginPage.waitForLoginSuccess();

		// Logout multiple times
		await dashboardPage.logout();
		await loginPage.expectUrl("/login");

		// Try to logout again (should not cause error)
		await page.goto("/dashboard");
		await loginPage.expectUrl("/login");
	});

	test("should handle password visibility toggle", async ({ page }) => {
		await loginPage.goto();

		const passwordInput = page.locator('[data-testid="password-input"]');
		const toggleButton = page.locator('[data-testid="password-toggle"]');

		if (await toggleButton.isVisible()) {
			// Initially should be password type
			await expect(passwordInput).toHaveAttribute("type", "password");

			// Click toggle
			await toggleButton.click();
			await expect(passwordInput).toHaveAttribute("type", "text");

			// Click toggle again
			await toggleButton.click();
			await expect(passwordInput).toHaveAttribute("type", "password");
		}
	});

	test("should remember login state across browser sessions", async ({
		page,
		context,
	}) => {
		// Login and check "Remember me" if available
		await loginPage.goto();

		const rememberCheckbox = page.locator('[data-testid="remember-me"]');
		if (await rememberCheckbox.isVisible()) {
			await rememberCheckbox.check();
		}

		await loginPage.login(testUsers.user.email, testUsers.user.password);
		await loginPage.waitForLoginSuccess();

		// Close and reopen browser
		await context.close();
		const newContext = await page.context().browser()?.newContext();
		if (newContext) {
			const newPage = await newContext.newPage();
			await newPage.goto("/dashboard");

			// Should still be logged in if remember me was checked
			if (await rememberCheckbox.isVisible()) {
				await expect(newPage).toHaveURL(/.*dashboard/);
			}

			await newContext.close();
		}
	});
});
