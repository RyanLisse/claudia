import type { Page } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object Model for Login Page
 */
export class LoginPage extends BasePage {
	private readonly emailInput = '[data-testid="email-input"]';
	private readonly passwordInput = '[data-testid="password-input"]';
	private readonly loginButton = '[data-testid="login-button"]';
	private readonly registerLink = '[data-testid="register-link"]';
	private readonly forgotPasswordLink = '[data-testid="forgot-password-link"]';
	private readonly errorMessage = '[data-testid="error-message"]';
	private readonly successMessage = '[data-testid="success-message"]';

	constructor(page: Page) {
		super(page, "/login");
	}

	async login(email: string, password: string): Promise<void> {
		await this.fillField(this.emailInput, email);
		await this.fillField(this.passwordInput, password);
		await this.clickElement(this.loginButton);
	}

	async clickRegisterLink(): Promise<void> {
		await this.clickElement(this.registerLink);
	}

	async clickForgotPasswordLink(): Promise<void> {
		await this.clickElement(this.forgotPasswordLink);
	}

	async getErrorMessage(): Promise<string> {
		return await this.getElementText(this.errorMessage);
	}

	async getSuccessMessage(): Promise<string> {
		return await this.getElementText(this.successMessage);
	}

	async isLoginButtonEnabled(): Promise<boolean> {
		return await this.isElementEnabled(this.loginButton);
	}

	async isLoginButtonVisible(): Promise<boolean> {
		return await this.isElementVisible(this.loginButton);
	}

	async waitForLoginSuccess(): Promise<void> {
		await this.waitForResponse("**/api/auth/login");
		await this.page.waitForURL("/dashboard");
	}

	async waitForLoginError(): Promise<void> {
		await this.waitForSelector(this.errorMessage);
	}

	async expectLoginFormVisible(): Promise<void> {
		await this.expectElementVisible(this.emailInput);
		await this.expectElementVisible(this.passwordInput);
		await this.expectElementVisible(this.loginButton);
	}

	async expectLoginSuccess(): Promise<void> {
		await this.expectUrl("/dashboard");
	}

	async expectLoginError(errorText: string): Promise<void> {
		await this.expectElementVisible(this.errorMessage);
		await this.expectElementText(this.errorMessage, errorText);
	}

	async clearForm(): Promise<void> {
		await this.fillField(this.emailInput, "");
		await this.fillField(this.passwordInput, "");
	}

	async submitForm(): Promise<void> {
		await this.clickElement(this.loginButton);
	}
}
