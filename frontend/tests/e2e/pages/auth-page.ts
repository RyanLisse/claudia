import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./base-page";

export class AuthPage extends BasePage {
	readonly page: Page;
	
	// Login form
	readonly loginForm: Locator;
	readonly emailInput: Locator;
	readonly passwordInput: Locator;
	readonly loginButton: Locator;
	readonly rememberMeCheckbox: Locator;
	readonly forgotPasswordLink: Locator;
	readonly showPasswordButton: Locator;
	
	// Registration form
	readonly registrationForm: Locator;
	readonly registerButton: Locator;
	readonly nameInput: Locator;
	readonly confirmPasswordInput: Locator;
	readonly termsCheckbox: Locator;
	readonly privacyCheckbox: Locator;
	readonly newsletterCheckbox: Locator;
	
	// Social login
	readonly googleLoginButton: Locator;
	readonly githubLoginButton: Locator;
	readonly linkedinLoginButton: Locator;
	readonly microsoftLoginButton: Locator;
	
	// Forgot password
	readonly forgotPasswordForm: Locator;
	readonly resetEmailInput: Locator;
	readonly sendResetButton: Locator;
	readonly backToLoginButton: Locator;
	
	// Reset password
	readonly resetPasswordForm: Locator;
	readonly newPasswordInput: Locator;
	readonly confirmNewPasswordInput: Locator;
	readonly resetPasswordButton: Locator;
	
	// Two-factor authentication
	readonly twoFactorForm: Locator;
	readonly twoFactorCodeInput: Locator;
	readonly verifyCodeButton: Locator;
	readonly resendCodeButton: Locator;
	readonly backupCodeInput: Locator;
	readonly useBackupCodeButton: Locator;
	
	// Email verification
	readonly emailVerificationForm: Locator;
	readonly verificationCodeInput: Locator;
	readonly verifyEmailButton: Locator;
	readonly resendVerificationButton: Locator;
	
	// Profile setup
	readonly profileSetupForm: Locator;
	readonly avatarUpload: Locator;
	readonly bioInput: Locator;
	readonly roleSelect: Locator;
	readonly companyInput: Locator;
	readonly skillsInput: Locator;
	readonly finishSetupButton: Locator;
	
	// Account settings
	readonly accountSettingsForm: Locator;
	readonly currentPasswordInput: Locator;
	readonly changePasswordButton: Locator;
	readonly deleteAccountButton: Locator;
	readonly exportDataButton: Locator;
	readonly enableTwoFactorButton: Locator;
	readonly disableTwoFactorButton: Locator;
	
	// Navigation
	readonly switchToRegisterLink: Locator;
	readonly switchToLoginLink: Locator;
	readonly homeLink: Locator;
	readonly helpLink: Locator;
	readonly contactLink: Locator;
	
	// Error and success messages
	readonly validationErrors: Locator;
	readonly fieldError: (field: string) => Locator;
	readonly generalError: Locator;
	readonly successMessage: Locator;
	readonly warningMessage: Locator;
	
	// Loading states
	readonly loginLoading: Locator;
	readonly registerLoading: Locator;
	readonly resetLoading: Locator;
	readonly verificationLoading: Locator;
	
	// Security features
	readonly captchaContainer: Locator;
	readonly securityQuestionSelect: Locator;
	readonly securityAnswerInput: Locator;
	readonly deviceTrustCheckbox: Locator;
	readonly loginAttemptsWarning: Locator;
	readonly accountLockedMessage: Locator;
	
	constructor(page: Page) {
		super(page);
		this.page = page;
		
		// Login form
		this.loginForm = page.locator('[data-testid="login-form"]');
		this.emailInput = page.locator('[data-testid="email-input"]');
		this.passwordInput = page.locator('[data-testid="password-input"]');
		this.loginButton = page.locator('[data-testid="login-button"]');
		this.rememberMeCheckbox = page.locator('[data-testid="remember-me-checkbox"]');
		this.forgotPasswordLink = page.locator('[data-testid="forgot-password-link"]');
		this.showPasswordButton = page.locator('[data-testid="show-password-button"]');
		
		// Registration form
		this.registrationForm = page.locator('[data-testid="registration-form"]');
		this.registerButton = page.locator('[data-testid="register-button"]');
		this.nameInput = page.locator('[data-testid="name-input"]');
		this.confirmPasswordInput = page.locator('[data-testid="confirm-password-input"]');
		this.termsCheckbox = page.locator('[data-testid="terms-checkbox"]');
		this.privacyCheckbox = page.locator('[data-testid="privacy-checkbox"]');
		this.newsletterCheckbox = page.locator('[data-testid="newsletter-checkbox"]');
		
		// Social login
		this.googleLoginButton = page.locator('[data-testid="google-login-button"]');
		this.githubLoginButton = page.locator('[data-testid="github-login-button"]');
		this.linkedinLoginButton = page.locator('[data-testid="linkedin-login-button"]');
		this.microsoftLoginButton = page.locator('[data-testid="microsoft-login-button"]');
		
		// Forgot password
		this.forgotPasswordForm = page.locator('[data-testid="forgot-password-form"]');
		this.resetEmailInput = page.locator('[data-testid="reset-email-input"]');
		this.sendResetButton = page.locator('[data-testid="send-reset-button"]');
		this.backToLoginButton = page.locator('[data-testid="back-to-login-button"]');
		
		// Reset password
		this.resetPasswordForm = page.locator('[data-testid="reset-password-form"]');
		this.newPasswordInput = page.locator('[data-testid="new-password-input"]');
		this.confirmNewPasswordInput = page.locator('[data-testid="confirm-new-password-input"]');
		this.resetPasswordButton = page.locator('[data-testid="reset-password-button"]');
		
		// Two-factor authentication
		this.twoFactorForm = page.locator('[data-testid="two-factor-form"]');
		this.twoFactorCodeInput = page.locator('[data-testid="two-factor-code-input"]');
		this.verifyCodeButton = page.locator('[data-testid="verify-code-button"]');
		this.resendCodeButton = page.locator('[data-testid="resend-code-button"]');
		this.backupCodeInput = page.locator('[data-testid="backup-code-input"]');
		this.useBackupCodeButton = page.locator('[data-testid="use-backup-code-button"]');
		
		// Email verification
		this.emailVerificationForm = page.locator('[data-testid="email-verification-form"]');
		this.verificationCodeInput = page.locator('[data-testid="verification-code-input"]');
		this.verifyEmailButton = page.locator('[data-testid="verify-email-button"]');
		this.resendVerificationButton = page.locator('[data-testid="resend-verification-button"]');
		
		// Profile setup
		this.profileSetupForm = page.locator('[data-testid="profile-setup-form"]');
		this.avatarUpload = page.locator('[data-testid="avatar-upload"]');
		this.bioInput = page.locator('[data-testid="bio-input"]');
		this.roleSelect = page.locator('[data-testid="role-select"]');
		this.companyInput = page.locator('[data-testid="company-input"]');
		this.skillsInput = page.locator('[data-testid="skills-input"]');
		this.finishSetupButton = page.locator('[data-testid="finish-setup-button"]');
		
		// Account settings
		this.accountSettingsForm = page.locator('[data-testid="account-settings-form"]');
		this.currentPasswordInput = page.locator('[data-testid="current-password-input"]');
		this.changePasswordButton = page.locator('[data-testid="change-password-button"]');
		this.deleteAccountButton = page.locator('[data-testid="delete-account-button"]');
		this.exportDataButton = page.locator('[data-testid="export-data-button"]');
		this.enableTwoFactorButton = page.locator('[data-testid="enable-two-factor-button"]');
		this.disableTwoFactorButton = page.locator('[data-testid="disable-two-factor-button"]');
		
		// Navigation
		this.switchToRegisterLink = page.locator('[data-testid="switch-to-register-link"]');
		this.switchToLoginLink = page.locator('[data-testid="switch-to-login-link"]');
		this.homeLink = page.locator('[data-testid="home-link"]');
		this.helpLink = page.locator('[data-testid="help-link"]');
		this.contactLink = page.locator('[data-testid="contact-link"]');
		
		// Error and success messages
		this.validationErrors = page.locator('[data-testid="validation-errors"]');
		this.fieldError = (field: string) => page.locator(`[data-testid="field-error-${field}"]`);
		this.generalError = page.locator('[data-testid="general-error"]');
		this.successMessage = page.locator('[data-testid="success-message"]');
		this.warningMessage = page.locator('[data-testid="warning-message"]');
		
		// Loading states
		this.loginLoading = page.locator('[data-testid="login-loading"]');
		this.registerLoading = page.locator('[data-testid="register-loading"]');
		this.resetLoading = page.locator('[data-testid="reset-loading"]');
		this.verificationLoading = page.locator('[data-testid="verification-loading"]');
		
		// Security features
		this.captchaContainer = page.locator('[data-testid="captcha-container"]');
		this.securityQuestionSelect = page.locator('[data-testid="security-question-select"]');
		this.securityAnswerInput = page.locator('[data-testid="security-answer-input"]');
		this.deviceTrustCheckbox = page.locator('[data-testid="device-trust-checkbox"]');
		this.loginAttemptsWarning = page.locator('[data-testid="login-attempts-warning"]');
		this.accountLockedMessage = page.locator('[data-testid="account-locked-message"]');
	}
	
	async gotoLogin(): Promise<void> {
		await this.page.goto("/login");
		await this.waitForPageLoad();
		await this.loginForm.waitFor({ state: "visible" });
	}
	
	async gotoRegister(): Promise<void> {
		await this.page.goto("/register");
		await this.waitForPageLoad();
		await this.registrationForm.waitFor({ state: "visible" });
	}
	
	async login(email: string, password: string, rememberMe = false): Promise<void> {
		await this.gotoLogin();
		
		await this.emailInput.fill(email);
		await this.passwordInput.fill(password);
		
		if (rememberMe) {
			await this.rememberMeCheckbox.check();
		}
		
		await this.loginButton.click();
		await this.loginLoading.waitFor({ state: "visible" });
		await this.loginLoading.waitFor({ state: "hidden" });
	}
	
	async register(userData: {
		name: string;
		email: string;
		password: string;
		confirmPassword: string;
		acceptTerms?: boolean;
		acceptPrivacy?: boolean;
		subscribeNewsletter?: boolean;
	}): Promise<void> {
		await this.gotoRegister();
		
		await this.nameInput.fill(userData.name);
		await this.emailInput.fill(userData.email);
		await this.passwordInput.fill(userData.password);
		await this.confirmPasswordInput.fill(userData.confirmPassword);
		
		if (userData.acceptTerms) {
			await this.termsCheckbox.check();
		}
		
		if (userData.acceptPrivacy) {
			await this.privacyCheckbox.check();
		}
		
		if (userData.subscribeNewsletter) {
			await this.newsletterCheckbox.check();
		}
		
		await this.registerButton.click();
		await this.registerLoading.waitFor({ state: "visible" });
		await this.registerLoading.waitFor({ state: "hidden" });
	}
	
	async loginWithGoogle(): Promise<void> {
		await this.gotoLogin();
		await this.googleLoginButton.click();
		
		// Handle Google OAuth popup
		const popup = await this.page.waitForEvent("popup");
		await popup.waitForLoadState();
		
		// Fill Google credentials (mock)
		await popup.fill('[type="email"]', "test@example.com");
		await popup.click('[data-testid="next-button"]');
		await popup.fill('[type="password"]', "password123");
		await popup.click('[data-testid="signin-button"]');
		
		// Wait for popup to close
		await popup.waitForEvent("close");
	}
	
	async loginWithGithub(): Promise<void> {
		await this.gotoLogin();
		await this.githubLoginButton.click();
		
		// Handle GitHub OAuth popup
		const popup = await this.page.waitForEvent("popup");
		await popup.waitForLoadState();
		
		// Fill GitHub credentials (mock)
		await popup.fill('[name="login"]', "testuser");
		await popup.fill('[name="password"]', "password123");
		await popup.click('[type="submit"]');
		
		// Wait for popup to close
		await popup.waitForEvent("close");
	}
	
	async forgotPassword(email: string): Promise<void> {
		await this.gotoLogin();
		await this.forgotPasswordLink.click();
		await this.forgotPasswordForm.waitFor({ state: "visible" });
		
		await this.resetEmailInput.fill(email);
		await this.sendResetButton.click();
		await this.resetLoading.waitFor({ state: "visible" });
		await this.resetLoading.waitFor({ state: "hidden" });
	}
	
	async resetPassword(token: string, newPassword: string, confirmPassword: string): Promise<void> {
		await this.page.goto(`/reset-password?token=${token}`);
		await this.waitForPageLoad();
		await this.resetPasswordForm.waitFor({ state: "visible" });
		
		await this.newPasswordInput.fill(newPassword);
		await this.confirmNewPasswordInput.fill(confirmPassword);
		await this.resetPasswordButton.click();
		await this.resetLoading.waitFor({ state: "visible" });
		await this.resetLoading.waitFor({ state: "hidden" });
	}
	
	async verifyTwoFactorCode(code: string): Promise<void> {
		await this.twoFactorForm.waitFor({ state: "visible" });
		await this.twoFactorCodeInput.fill(code);
		await this.verifyCodeButton.click();
		await this.verificationLoading.waitFor({ state: "visible" });
		await this.verificationLoading.waitFor({ state: "hidden" });
	}
	
	async useTwoFactorBackupCode(backupCode: string): Promise<void> {
		await this.twoFactorForm.waitFor({ state: "visible" });
		await this.useBackupCodeButton.click();
		await this.backupCodeInput.fill(backupCode);
		await this.verifyCodeButton.click();
		await this.verificationLoading.waitFor({ state: "visible" });
		await this.verificationLoading.waitFor({ state: "hidden" });
	}
	
	async verifyEmail(code: string): Promise<void> {
		await this.emailVerificationForm.waitFor({ state: "visible" });
		await this.verificationCodeInput.fill(code);
		await this.verifyEmailButton.click();
		await this.verificationLoading.waitFor({ state: "visible" });
		await this.verificationLoading.waitFor({ state: "hidden" });
	}
	
	async resendVerificationCode(): Promise<void> {
		await this.resendVerificationButton.click();
		await this.verificationLoading.waitFor({ state: "visible" });
		await this.verificationLoading.waitFor({ state: "hidden" });
	}
	
	async completeProfileSetup(profileData: {
		avatar?: string;
		bio?: string;
		role?: string;
		company?: string;
		skills?: string[];
	}): Promise<void> {
		await this.profileSetupForm.waitFor({ state: "visible" });
		
		if (profileData.avatar) {
			await this.avatarUpload.setInputFiles(profileData.avatar);
		}
		
		if (profileData.bio) {
			await this.bioInput.fill(profileData.bio);
		}
		
		if (profileData.role) {
			await this.roleSelect.selectOption(profileData.role);
		}
		
		if (profileData.company) {
			await this.companyInput.fill(profileData.company);
		}
		
		if (profileData.skills) {
			await this.skillsInput.fill(profileData.skills.join(", "));
		}
		
		await this.finishSetupButton.click();
		await this.waitForPageLoad();
	}
	
	async changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Promise<void> {
		await this.currentPasswordInput.fill(currentPassword);
		await this.newPasswordInput.fill(newPassword);
		await this.confirmNewPasswordInput.fill(confirmPassword);
		await this.changePasswordButton.click();
		await this.waitForSuccess();
	}
	
	async enableTwoFactor(): Promise<string[]> {
		await this.enableTwoFactorButton.click();
		
		// Wait for QR code and backup codes to be generated
		await this.page.waitForSelector('[data-testid="qr-code"]');
		await this.page.waitForSelector('[data-testid="backup-codes"]');
		
		// Get backup codes
		const backupCodes = await this.page.locator('[data-testid="backup-code"]').allTextContents();
		
		// Verify setup with a test code
		await this.twoFactorCodeInput.fill("123456");
		await this.verifyCodeButton.click();
		await this.waitForSuccess();
		
		return backupCodes;
	}
	
	async disableTwoFactor(password: string): Promise<void> {
		await this.disableTwoFactorButton.click();
		await this.currentPasswordInput.fill(password);
		await this.confirmAction();
		await this.waitForSuccess();
	}
	
	async deleteAccount(password: string): Promise<void> {
		await this.deleteAccountButton.click();
		await this.currentPasswordInput.fill(password);
		await this.confirmAction();
		await this.waitForSuccess();
	}
	
	async exportAccountData(): Promise<string> {
		await this.exportDataButton.click();
		return await this.downloadFile('[data-testid="download-data-button"]');
	}
	
	async switchToRegister(): Promise<void> {
		await this.switchToRegisterLink.click();
		await this.registrationForm.waitFor({ state: "visible" });
	}
	
	async switchToLogin(): Promise<void> {
		await this.switchToLoginLink.click();
		await this.loginForm.waitFor({ state: "visible" });
	}
	
	async togglePasswordVisibility(): Promise<void> {
		await this.showPasswordButton.click();
	}
	
	async waitForLoginSuccess(): Promise<void> {
		await this.page.waitForURL("/dashboard", { timeout: 10000 });
	}
	
	async waitForRegistrationSuccess(): Promise<void> {
		await this.emailVerificationForm.waitFor({ state: "visible" });
	}
	
	async waitForPasswordResetSuccess(): Promise<void> {
		await this.successMessage.waitFor({ state: "visible" });
		await expect(this.successMessage).toContainText("Password reset email sent");
	}
	
	async waitForPasswordChangeSuccess(): Promise<void> {
		await this.successMessage.waitFor({ state: "visible" });
		await expect(this.successMessage).toContainText("Password changed successfully");
	}
	
	async verifyLoginError(expectedMessage: string): Promise<void> {
		await this.generalError.waitFor({ state: "visible" });
		await expect(this.generalError).toContainText(expectedMessage);
	}
	
	async verifyValidationError(field: string, expectedMessage: string): Promise<void> {
		await this.fieldError(field).waitFor({ state: "visible" });
		await expect(this.fieldError(field)).toContainText(expectedMessage);
	}
	
	async verifyFieldRequired(field: string): Promise<void> {
		const fieldInput = this.page.locator(`[data-testid="${field}-input"]`);
		await fieldInput.click();
		await fieldInput.blur();
		await this.verifyValidationError(field, "This field is required");
	}
	
	async verifyPasswordStrength(password: string): Promise<void> {
		await this.passwordInput.fill(password);
		const strengthIndicator = this.page.locator('[data-testid="password-strength"]');
		await strengthIndicator.waitFor({ state: "visible" });
		
		// Verify strength indicator shows appropriate level
		const strength = await strengthIndicator.textContent();
		expect(strength).toMatch(/Weak|Fair|Good|Strong/);
	}
	
	async verifyEmailFormat(email: string): Promise<void> {
		await this.emailInput.fill(email);
		await this.emailInput.blur();
		
		if (!email.includes("@")) {
			await this.verifyValidationError("email", "Please enter a valid email address");
		}
	}
	
	async verifyPasswordMatch(password: string, confirmPassword: string): Promise<void> {
		await this.passwordInput.fill(password);
		await this.confirmPasswordInput.fill(confirmPassword);
		await this.confirmPasswordInput.blur();
		
		if (password !== confirmPassword) {
			await this.verifyValidationError("confirm-password", "Passwords do not match");
		}
	}
	
	async verifyTermsAcceptance(): Promise<void> {
		await this.registerButton.click();
		await this.verifyValidationError("terms", "You must accept the terms and conditions");
	}
	
	async verifyRateLimiting(): Promise<void> {
		// Attempt multiple failed logins
		for (let i = 0; i < 5; i++) {
			await this.login("test@example.com", "wrongpassword");
			await this.verifyLoginError("Invalid credentials");
		}
		
		// Verify rate limiting message
		await this.loginAttemptsWarning.waitFor({ state: "visible" });
		await expect(this.loginAttemptsWarning).toContainText("Too many failed attempts");
	}
	
	async verifyAccountLockout(): Promise<void> {
		// This would be tested with appropriate test data
		await this.accountLockedMessage.waitFor({ state: "visible" });
		await expect(this.accountLockedMessage).toContainText("Account temporarily locked");
	}
	
	async verifyCaptchaChallenge(): Promise<void> {
		await this.captchaContainer.waitFor({ state: "visible" });
		// In a real test, this would verify CAPTCHA functionality
		expect(await this.captchaContainer.isVisible()).toBe(true);
	}
	
	async verifyDeviceTrust(): Promise<void> {
		await this.deviceTrustCheckbox.check();
		await this.loginButton.click();
		
		// Verify device trust token is stored
		const deviceToken = await this.getLocalStorage("device-trust-token");
		expect(deviceToken).toBeTruthy();
	}
	
	async verifySecurityQuestions(): Promise<void> {
		await this.securityQuestionSelect.selectOption("What is your mother's maiden name?");
		await this.securityAnswerInput.fill("TestAnswer");
		
		// Verify security question is saved
		await this.saveButton.click();
		await this.waitForSuccess();
	}
	
	async logout(): Promise<void> {
		await this.page.goto("/logout");
		await this.waitForPageLoad();
		await this.loginForm.waitFor({ state: "visible" });
	}
	
	async isLoggedIn(): Promise<boolean> {
		try {
			await this.page.waitForSelector('[data-testid="user-menu"]', { timeout: 5000 });
			return true;
		} catch {
			return false;
		}
	}
	
	async getCurrentUser(): Promise<string | null> {
		if (await this.isLoggedIn()) {
			return await this.page.locator('[data-testid="current-user-name"]').textContent();
		}
		return null;
	}
}