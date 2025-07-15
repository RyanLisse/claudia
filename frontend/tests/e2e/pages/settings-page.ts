import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./base-page";

export class SettingsPage extends BasePage {
	readonly page: Page;
	
	// Main navigation
	readonly settingsContainer: Locator;
	readonly profileTab: Locator;
	readonly accountTab: Locator;
	readonly securityTab: Locator;
	readonly integrationsTab: Locator;
	readonly notificationsTab: Locator;
	readonly billingTab: Locator;
	readonly preferencesTab: Locator;
	readonly dataExportTab: Locator;
	
	// Profile settings
	readonly profileForm: Locator;
	readonly avatarUpload: Locator;
	readonly avatarPreview: Locator;
	readonly displayNameInput: Locator;
	readonly emailInput: Locator;
	readonly phoneInput: Locator;
	readonly bioInput: Locator;
	readonly companyInput: Locator;
	readonly jobTitleInput: Locator;
	readonly locationInput: Locator;
	readonly websiteInput: Locator;
	readonly socialLinksSection: Locator;
	readonly githubInput: Locator;
	readonly linkedinInput: Locator;
	readonly twitterInput: Locator;
	readonly saveProfileButton: Locator;
	readonly cancelProfileButton: Locator;
	readonly resetProfileButton: Locator;
	
	// Account settings
	readonly accountForm: Locator;
	readonly usernameInput: Locator;
	readonly timezoneSelect: Locator;
	readonly languageSelect: Locator;
	readonly dateFormatSelect: Locator;
	readonly timeFormatSelect: Locator;
	readonly accountTypeDisplay: Locator;
	readonly planUpgradeButton: Locator;
	readonly deleteAccountButton: Locator;
	readonly deactivateAccountButton: Locator;
	readonly closeAccountButton: Locator;
	readonly saveAccountButton: Locator;
	
	// Security settings
	readonly securityForm: Locator;
	readonly changePasswordButton: Locator;
	readonly currentPasswordInput: Locator;
	readonly newPasswordInput: Locator;
	readonly confirmPasswordInput: Locator;
	readonly passwordStrengthMeter: Locator;
	readonly twoFactorSection: Locator;
	readonly enableTwoFactorButton: Locator;
	readonly disableTwoFactorButton: Locator;
	readonly twoFactorStatus: Locator;
	readonly backupCodesButton: Locator;
	readonly regenerateCodesButton: Locator;
	readonly apiKeysSection: Locator;
	readonly createApiKeyButton: Locator;
	readonly apiKeysList: Locator;
	readonly revokeApiKeyButton: Locator;
	readonly sessionsSection: Locator;
	readonly activeSessionsList: Locator;
	readonly revokeSessionButton: Locator;
	readonly revokeAllSessionsButton: Locator;
	readonly loginHistorySection: Locator;
	readonly loginHistoryList: Locator;
	readonly deviceTrustSection: Locator;
	readonly trustedDevicesList: Locator;
	readonly removeTrustedDeviceButton: Locator;
	readonly auditLogSection: Locator;
	readonly auditLogList: Locator;
	readonly downloadAuditLogButton: Locator;
	
	// Integrations settings
	readonly integrationsForm: Locator;
	readonly availableIntegrations: Locator;
	readonly connectedIntegrations: Locator;
	readonly integrationCard: (name: string) => Locator;
	readonly connectButton: (integration: string) => Locator;
	readonly disconnectButton: (integration: string) => Locator;
	readonly configureButton: (integration: string) => Locator;
	readonly integrationStatus: (integration: string) => Locator;
	readonly webhookSection: Locator;
	readonly createWebhookButton: Locator;
	readonly webhooksList: Locator;
	readonly webhookUrlInput: Locator;
	readonly webhookEventsSelect: Locator;
	readonly webhookSecretInput: Locator;
	readonly testWebhookButton: Locator;
	readonly deleteWebhookButton: Locator;
	readonly oauthSection: Locator;
	readonly oauthAppsList: Locator;
	readonly createOauthAppButton: Locator;
	readonly revokeOauthAppButton: Locator;
	
	// Notifications settings
	readonly notificationsForm: Locator;
	readonly emailNotificationsSection: Locator;
	readonly pushNotificationsSection: Locator;
	readonly slackNotificationsSection: Locator;
	readonly discordNotificationsSection: Locator;
	readonly notificationToggle: (type: string) => Locator;
	readonly notificationFrequency: (type: string) => Locator;
	readonly quietHoursSection: Locator;
	readonly quietHoursToggle: Locator;
	readonly quietHoursStart: Locator;
	readonly quietHoursEnd: Locator;
	readonly notificationFilters: Locator;
	readonly filterKeywords: Locator;
	readonly filterProjects: Locator;
	readonly filterUsers: Locator;
	readonly testNotificationButton: Locator;
	readonly notificationPreview: Locator;
	readonly saveNotificationsButton: Locator;
	
	// Billing settings
	readonly billingForm: Locator;
	readonly currentPlanSection: Locator;
	readonly planName: Locator;
	readonly planPrice: Locator;
	readonly planFeatures: Locator;
	readonly changePlanButton: Locator;
	readonly cancelPlanButton: Locator;
	readonly paymentMethodSection: Locator;
	readonly paymentMethodsList: Locator;
	readonly addPaymentMethodButton: Locator;
	readonly removePaymentMethodButton: Locator;
	readonly defaultPaymentMethodButton: Locator;
	readonly billingHistorySection: Locator;
	readonly invoicesList: Locator;
	readonly downloadInvoiceButton: Locator;
	readonly usageSection: Locator;
	readonly usageChart: Locator;
	readonly usageMetrics: Locator;
	readonly usageLimits: Locator;
	readonly billingAddressSection: Locator;
	readonly billingAddressForm: Locator;
	readonly taxInfoSection: Locator;
	readonly taxIdInput: Locator;
	readonly vatNumberInput: Locator;
	
	// Preferences settings
	readonly preferencesForm: Locator;
	readonly themeSection: Locator;
	readonly themeToggle: Locator;
	readonly colorSchemeSelect: Locator;
	readonly fontSizeSelect: Locator;
	readonly compactModeToggle: Locator;
	readonly editorSection: Locator;
	readonly editorThemeSelect: Locator;
	readonly editorFontFamilySelect: Locator;
	readonly editorFontSizeSelect: Locator;
	readonly editorTabSizeSelect: Locator;
	readonly editorWordWrapToggle: Locator;
	readonly editorLineNumbersToggle: Locator;
	readonly editorMinimapToggle: Locator;
	readonly workspaceSection: Locator;
	readonly defaultProjectTemplateSelect: Locator;
	readonly autoSaveToggle: Locator;
	readonly autoSaveInterval: Locator;
	readonly backupSection: Locator;
	readonly autoBackupToggle: Locator;
	readonly backupFrequency: Locator;
	readonly backupRetention: Locator;
	readonly keyboardShortcutsSection: Locator;
	readonly shortcutsList: Locator;
	readonly customizeShortcutButton: Locator;
	readonly resetShortcutsButton: Locator;
	readonly savePreferencesButton: Locator;
	
	// Data export settings
	readonly dataExportForm: Locator;
	readonly exportSection: Locator;
	readonly exportFormatSelect: Locator;
	readonly exportRangeSelect: Locator;
	readonly exportIncludeSelect: Locator;
	readonly exportPasswordInput: Locator;
	readonly requestExportButton: Locator;
	readonly exportHistorySection: Locator;
	readonly exportHistoryList: Locator;
	readonly downloadExportButton: Locator;
	readonly deleteExportButton: Locator;
	readonly gdprSection: Locator;
	readonly dataPortabilityButton: Locator;
	readonly rightToErasureButton: Locator;
	readonly dataProcessingInfo: Locator;
	readonly privacyPolicyLink: Locator;
	readonly termsOfServiceLink: Locator;
	
	// Global elements
	readonly saveButton: Locator;
	readonly cancelButton: Locator;
	readonly resetButton: Locator;
	readonly successMessage: Locator;
	readonly errorMessage: Locator;
	readonly warningMessage: Locator;
	readonly confirmDialog: Locator;
	readonly confirmYesButton: Locator;
	readonly confirmNoButton: Locator;
	readonly loadingSpinner: Locator;
	readonly unsavedChangesWarning: Locator;
	
	constructor(page: Page) {
		super(page);
		this.page = page;
		
		// Main navigation
		this.settingsContainer = page.locator('[data-testid="settings-container"]');
		this.profileTab = page.locator('[data-testid="profile-tab"]');
		this.accountTab = page.locator('[data-testid="account-tab"]');
		this.securityTab = page.locator('[data-testid="security-tab"]');
		this.integrationsTab = page.locator('[data-testid="integrations-tab"]');
		this.notificationsTab = page.locator('[data-testid="notifications-tab"]');
		this.billingTab = page.locator('[data-testid="billing-tab"]');
		this.preferencesTab = page.locator('[data-testid="preferences-tab"]');
		this.dataExportTab = page.locator('[data-testid="data-export-tab"]');
		
		// Profile settings
		this.profileForm = page.locator('[data-testid="profile-form"]');
		this.avatarUpload = page.locator('[data-testid="avatar-upload"]');
		this.avatarPreview = page.locator('[data-testid="avatar-preview"]');
		this.displayNameInput = page.locator('[data-testid="display-name-input"]');
		this.emailInput = page.locator('[data-testid="email-input"]');
		this.phoneInput = page.locator('[data-testid="phone-input"]');
		this.bioInput = page.locator('[data-testid="bio-input"]');
		this.companyInput = page.locator('[data-testid="company-input"]');
		this.jobTitleInput = page.locator('[data-testid="job-title-input"]');
		this.locationInput = page.locator('[data-testid="location-input"]');
		this.websiteInput = page.locator('[data-testid="website-input"]');
		this.socialLinksSection = page.locator('[data-testid="social-links-section"]');
		this.githubInput = page.locator('[data-testid="github-input"]');
		this.linkedinInput = page.locator('[data-testid="linkedin-input"]');
		this.twitterInput = page.locator('[data-testid="twitter-input"]');
		this.saveProfileButton = page.locator('[data-testid="save-profile-button"]');
		this.cancelProfileButton = page.locator('[data-testid="cancel-profile-button"]');
		this.resetProfileButton = page.locator('[data-testid="reset-profile-button"]');
		
		// Account settings
		this.accountForm = page.locator('[data-testid="account-form"]');
		this.usernameInput = page.locator('[data-testid="username-input"]');
		this.timezoneSelect = page.locator('[data-testid="timezone-select"]');
		this.languageSelect = page.locator('[data-testid="language-select"]');
		this.dateFormatSelect = page.locator('[data-testid="date-format-select"]');
		this.timeFormatSelect = page.locator('[data-testid="time-format-select"]');
		this.accountTypeDisplay = page.locator('[data-testid="account-type-display"]');
		this.planUpgradeButton = page.locator('[data-testid="plan-upgrade-button"]');
		this.deleteAccountButton = page.locator('[data-testid="delete-account-button"]');
		this.deactivateAccountButton = page.locator('[data-testid="deactivate-account-button"]');
		this.closeAccountButton = page.locator('[data-testid="close-account-button"]');
		this.saveAccountButton = page.locator('[data-testid="save-account-button"]');
		
		// Security settings
		this.securityForm = page.locator('[data-testid="security-form"]');
		this.changePasswordButton = page.locator('[data-testid="change-password-button"]');
		this.currentPasswordInput = page.locator('[data-testid="current-password-input"]');
		this.newPasswordInput = page.locator('[data-testid="new-password-input"]');
		this.confirmPasswordInput = page.locator('[data-testid="confirm-password-input"]');
		this.passwordStrengthMeter = page.locator('[data-testid="password-strength-meter"]');
		this.twoFactorSection = page.locator('[data-testid="two-factor-section"]');
		this.enableTwoFactorButton = page.locator('[data-testid="enable-two-factor-button"]');
		this.disableTwoFactorButton = page.locator('[data-testid="disable-two-factor-button"]');
		this.twoFactorStatus = page.locator('[data-testid="two-factor-status"]');
		this.backupCodesButton = page.locator('[data-testid="backup-codes-button"]');
		this.regenerateCodesButton = page.locator('[data-testid="regenerate-codes-button"]');
		this.apiKeysSection = page.locator('[data-testid="api-keys-section"]');
		this.createApiKeyButton = page.locator('[data-testid="create-api-key-button"]');
		this.apiKeysList = page.locator('[data-testid="api-keys-list"]');
		this.revokeApiKeyButton = page.locator('[data-testid="revoke-api-key-button"]');
		this.sessionsSection = page.locator('[data-testid="sessions-section"]');
		this.activeSessionsList = page.locator('[data-testid="active-sessions-list"]');
		this.revokeSessionButton = page.locator('[data-testid="revoke-session-button"]');
		this.revokeAllSessionsButton = page.locator('[data-testid="revoke-all-sessions-button"]');
		this.loginHistorySection = page.locator('[data-testid="login-history-section"]');
		this.loginHistoryList = page.locator('[data-testid="login-history-list"]');
		this.deviceTrustSection = page.locator('[data-testid="device-trust-section"]');
		this.trustedDevicesList = page.locator('[data-testid="trusted-devices-list"]');
		this.removeTrustedDeviceButton = page.locator('[data-testid="remove-trusted-device-button"]');
		this.auditLogSection = page.locator('[data-testid="audit-log-section"]');
		this.auditLogList = page.locator('[data-testid="audit-log-list"]');
		this.downloadAuditLogButton = page.locator('[data-testid="download-audit-log-button"]');
		
		// Integrations settings
		this.integrationsForm = page.locator('[data-testid="integrations-form"]');
		this.availableIntegrations = page.locator('[data-testid="available-integrations"]');
		this.connectedIntegrations = page.locator('[data-testid="connected-integrations"]');
		this.integrationCard = (name: string) => page.locator(`[data-testid="integration-card-${name}"]`);
		this.connectButton = (integration: string) => page.locator(`[data-testid="connect-${integration}-button"]`);
		this.disconnectButton = (integration: string) => page.locator(`[data-testid="disconnect-${integration}-button"]`);
		this.configureButton = (integration: string) => page.locator(`[data-testid="configure-${integration}-button"]`);
		this.integrationStatus = (integration: string) => page.locator(`[data-testid="${integration}-status"]`);
		this.webhookSection = page.locator('[data-testid="webhook-section"]');
		this.createWebhookButton = page.locator('[data-testid="create-webhook-button"]');
		this.webhooksList = page.locator('[data-testid="webhooks-list"]');
		this.webhookUrlInput = page.locator('[data-testid="webhook-url-input"]');
		this.webhookEventsSelect = page.locator('[data-testid="webhook-events-select"]');
		this.webhookSecretInput = page.locator('[data-testid="webhook-secret-input"]');
		this.testWebhookButton = page.locator('[data-testid="test-webhook-button"]');
		this.deleteWebhookButton = page.locator('[data-testid="delete-webhook-button"]');
		this.oauthSection = page.locator('[data-testid="oauth-section"]');
		this.oauthAppsList = page.locator('[data-testid="oauth-apps-list"]');
		this.createOauthAppButton = page.locator('[data-testid="create-oauth-app-button"]');
		this.revokeOauthAppButton = page.locator('[data-testid="revoke-oauth-app-button"]');
		
		// Notifications settings
		this.notificationsForm = page.locator('[data-testid="notifications-form"]');
		this.emailNotificationsSection = page.locator('[data-testid="email-notifications-section"]');
		this.pushNotificationsSection = page.locator('[data-testid="push-notifications-section"]');
		this.slackNotificationsSection = page.locator('[data-testid="slack-notifications-section"]');
		this.discordNotificationsSection = page.locator('[data-testid="discord-notifications-section"]');
		this.notificationToggle = (type: string) => page.locator(`[data-testid="${type}-notification-toggle"]`);
		this.notificationFrequency = (type: string) => page.locator(`[data-testid="${type}-notification-frequency"]`);
		this.quietHoursSection = page.locator('[data-testid="quiet-hours-section"]');
		this.quietHoursToggle = page.locator('[data-testid="quiet-hours-toggle"]');
		this.quietHoursStart = page.locator('[data-testid="quiet-hours-start"]');
		this.quietHoursEnd = page.locator('[data-testid="quiet-hours-end"]');
		this.notificationFilters = page.locator('[data-testid="notification-filters"]');
		this.filterKeywords = page.locator('[data-testid="filter-keywords"]');
		this.filterProjects = page.locator('[data-testid="filter-projects"]');
		this.filterUsers = page.locator('[data-testid="filter-users"]');
		this.testNotificationButton = page.locator('[data-testid="test-notification-button"]');
		this.notificationPreview = page.locator('[data-testid="notification-preview"]');
		this.saveNotificationsButton = page.locator('[data-testid="save-notifications-button"]');
		
		// Billing settings
		this.billingForm = page.locator('[data-testid="billing-form"]');
		this.currentPlanSection = page.locator('[data-testid="current-plan-section"]');
		this.planName = page.locator('[data-testid="plan-name"]');
		this.planPrice = page.locator('[data-testid="plan-price"]');
		this.planFeatures = page.locator('[data-testid="plan-features"]');
		this.changePlanButton = page.locator('[data-testid="change-plan-button"]');
		this.cancelPlanButton = page.locator('[data-testid="cancel-plan-button"]');
		this.paymentMethodSection = page.locator('[data-testid="payment-method-section"]');
		this.paymentMethodsList = page.locator('[data-testid="payment-methods-list"]');
		this.addPaymentMethodButton = page.locator('[data-testid="add-payment-method-button"]');
		this.removePaymentMethodButton = page.locator('[data-testid="remove-payment-method-button"]');
		this.defaultPaymentMethodButton = page.locator('[data-testid="default-payment-method-button"]');
		this.billingHistorySection = page.locator('[data-testid="billing-history-section"]');
		this.invoicesList = page.locator('[data-testid="invoices-list"]');
		this.downloadInvoiceButton = page.locator('[data-testid="download-invoice-button"]');
		this.usageSection = page.locator('[data-testid="usage-section"]');
		this.usageChart = page.locator('[data-testid="usage-chart"]');
		this.usageMetrics = page.locator('[data-testid="usage-metrics"]');
		this.usageLimits = page.locator('[data-testid="usage-limits"]');
		this.billingAddressSection = page.locator('[data-testid="billing-address-section"]');
		this.billingAddressForm = page.locator('[data-testid="billing-address-form"]');
		this.taxInfoSection = page.locator('[data-testid="tax-info-section"]');
		this.taxIdInput = page.locator('[data-testid="tax-id-input"]');
		this.vatNumberInput = page.locator('[data-testid="vat-number-input"]');
		
		// Preferences settings
		this.preferencesForm = page.locator('[data-testid="preferences-form"]');
		this.themeSection = page.locator('[data-testid="theme-section"]');
		this.themeToggle = page.locator('[data-testid="theme-toggle"]');
		this.colorSchemeSelect = page.locator('[data-testid="color-scheme-select"]');
		this.fontSizeSelect = page.locator('[data-testid="font-size-select"]');
		this.compactModeToggle = page.locator('[data-testid="compact-mode-toggle"]');
		this.editorSection = page.locator('[data-testid="editor-section"]');
		this.editorThemeSelect = page.locator('[data-testid="editor-theme-select"]');
		this.editorFontFamilySelect = page.locator('[data-testid="editor-font-family-select"]');
		this.editorFontSizeSelect = page.locator('[data-testid="editor-font-size-select"]');
		this.editorTabSizeSelect = page.locator('[data-testid="editor-tab-size-select"]');
		this.editorWordWrapToggle = page.locator('[data-testid="editor-word-wrap-toggle"]');
		this.editorLineNumbersToggle = page.locator('[data-testid="editor-line-numbers-toggle"]');
		this.editorMinimapToggle = page.locator('[data-testid="editor-minimap-toggle"]');
		this.workspaceSection = page.locator('[data-testid="workspace-section"]');
		this.defaultProjectTemplateSelect = page.locator('[data-testid="default-project-template-select"]');
		this.autoSaveToggle = page.locator('[data-testid="auto-save-toggle"]');
		this.autoSaveInterval = page.locator('[data-testid="auto-save-interval"]');
		this.backupSection = page.locator('[data-testid="backup-section"]');
		this.autoBackupToggle = page.locator('[data-testid="auto-backup-toggle"]');
		this.backupFrequency = page.locator('[data-testid="backup-frequency"]');
		this.backupRetention = page.locator('[data-testid="backup-retention"]');
		this.keyboardShortcutsSection = page.locator('[data-testid="keyboard-shortcuts-section"]');
		this.shortcutsList = page.locator('[data-testid="shortcuts-list"]');
		this.customizeShortcutButton = page.locator('[data-testid="customize-shortcut-button"]');
		this.resetShortcutsButton = page.locator('[data-testid="reset-shortcuts-button"]');
		this.savePreferencesButton = page.locator('[data-testid="save-preferences-button"]');
		
		// Data export settings
		this.dataExportForm = page.locator('[data-testid="data-export-form"]');
		this.exportSection = page.locator('[data-testid="export-section"]');
		this.exportFormatSelect = page.locator('[data-testid="export-format-select"]');
		this.exportRangeSelect = page.locator('[data-testid="export-range-select"]');
		this.exportIncludeSelect = page.locator('[data-testid="export-include-select"]');
		this.exportPasswordInput = page.locator('[data-testid="export-password-input"]');
		this.requestExportButton = page.locator('[data-testid="request-export-button"]');
		this.exportHistorySection = page.locator('[data-testid="export-history-section"]');
		this.exportHistoryList = page.locator('[data-testid="export-history-list"]');
		this.downloadExportButton = page.locator('[data-testid="download-export-button"]');
		this.deleteExportButton = page.locator('[data-testid="delete-export-button"]');
		this.gdprSection = page.locator('[data-testid="gdpr-section"]');
		this.dataPortabilityButton = page.locator('[data-testid="data-portability-button"]');
		this.rightToErasureButton = page.locator('[data-testid="right-to-erasure-button"]');
		this.dataProcessingInfo = page.locator('[data-testid="data-processing-info"]');
		this.privacyPolicyLink = page.locator('[data-testid="privacy-policy-link"]');
		this.termsOfServiceLink = page.locator('[data-testid="terms-of-service-link"]');
		
		// Global elements
		this.saveButton = page.locator('[data-testid="save-button"]');
		this.cancelButton = page.locator('[data-testid="cancel-button"]');
		this.resetButton = page.locator('[data-testid="reset-button"]');
		this.successMessage = page.locator('[data-testid="success-message"]');
		this.errorMessage = page.locator('[data-testid="error-message"]');
		this.warningMessage = page.locator('[data-testid="warning-message"]');
		this.confirmDialog = page.locator('[data-testid="confirm-dialog"]');
		this.confirmYesButton = page.locator('[data-testid="confirm-yes-button"]');
		this.confirmNoButton = page.locator('[data-testid="confirm-no-button"]');
		this.loadingSpinner = page.locator('[data-testid="loading-spinner"]');
		this.unsavedChangesWarning = page.locator('[data-testid="unsaved-changes-warning"]');
	}
	
	async gotoSettings(tab?: string): Promise<void> {
		await this.page.goto("/settings");
		await this.waitForPageLoad();
		await this.settingsContainer.waitFor({ state: "visible" });
		
		if (tab) {
			await this.navigateToTab(tab);
		}
	}
	
	async navigateToTab(tabName: string): Promise<void> {
		const tabs = {
			profile: this.profileTab,
			account: this.accountTab,
			security: this.securityTab,
			integrations: this.integrationsTab,
			notifications: this.notificationsTab,
			billing: this.billingTab,
			preferences: this.preferencesTab,
			"data-export": this.dataExportTab,
		};
		
		const tab = tabs[tabName as keyof typeof tabs];
		if (tab) {
			await tab.click();
			await this.waitForPageLoad();
		}
	}
	
	// Profile settings methods
	async updateProfile(profileData: {
		displayName?: string;
		email?: string;
		phone?: string;
		bio?: string;
		company?: string;
		jobTitle?: string;
		location?: string;
		website?: string;
		github?: string;
		linkedin?: string;
		twitter?: string;
		avatar?: string;
	}): Promise<void> {
		await this.navigateToTab("profile");
		
		if (profileData.avatar) {
			await this.avatarUpload.setInputFiles(profileData.avatar);
		}
		
		if (profileData.displayName) {
			await this.displayNameInput.fill(profileData.displayName);
		}
		
		if (profileData.email) {
			await this.emailInput.fill(profileData.email);
		}
		
		if (profileData.phone) {
			await this.phoneInput.fill(profileData.phone);
		}
		
		if (profileData.bio) {
			await this.bioInput.fill(profileData.bio);
		}
		
		if (profileData.company) {
			await this.companyInput.fill(profileData.company);
		}
		
		if (profileData.jobTitle) {
			await this.jobTitleInput.fill(profileData.jobTitle);
		}
		
		if (profileData.location) {
			await this.locationInput.fill(profileData.location);
		}
		
		if (profileData.website) {
			await this.websiteInput.fill(profileData.website);
		}
		
		if (profileData.github) {
			await this.githubInput.fill(profileData.github);
		}
		
		if (profileData.linkedin) {
			await this.linkedinInput.fill(profileData.linkedin);
		}
		
		if (profileData.twitter) {
			await this.twitterInput.fill(profileData.twitter);
		}
		
		await this.saveProfileButton.click();
		await this.waitForSuccess();
	}
	
	// Account settings methods
	async updateAccount(accountData: {
		username?: string;
		timezone?: string;
		language?: string;
		dateFormat?: string;
		timeFormat?: string;
	}): Promise<void> {
		await this.navigateToTab("account");
		
		if (accountData.username) {
			await this.usernameInput.fill(accountData.username);
		}
		
		if (accountData.timezone) {
			await this.timezoneSelect.selectOption(accountData.timezone);
		}
		
		if (accountData.language) {
			await this.languageSelect.selectOption(accountData.language);
		}
		
		if (accountData.dateFormat) {
			await this.dateFormatSelect.selectOption(accountData.dateFormat);
		}
		
		if (accountData.timeFormat) {
			await this.timeFormatSelect.selectOption(accountData.timeFormat);
		}
		
		await this.saveAccountButton.click();
		await this.waitForSuccess();
	}
	
	// Security settings methods
	async changePassword(currentPassword: string, newPassword: string): Promise<void> {
		await this.navigateToTab("security");
		await this.changePasswordButton.click();
		
		await this.currentPasswordInput.fill(currentPassword);
		await this.newPasswordInput.fill(newPassword);
		await this.confirmPasswordInput.fill(newPassword);
		
		await this.saveButton.click();
		await this.waitForSuccess();
	}
	
	async enableTwoFactor(): Promise<string[]> {
		await this.navigateToTab("security");
		await this.enableTwoFactorButton.click();
		
		// Wait for setup process
		await this.page.waitForSelector('[data-testid="qr-code"]');
		await this.page.waitForSelector('[data-testid="backup-codes"]');
		
		const backupCodes = await this.page.locator('[data-testid="backup-code"]').allTextContents();
		
		// Complete setup with test code
		await this.page.fill('[data-testid="verification-code-input"]', "123456");
		await this.page.click('[data-testid="verify-setup-button"]');
		await this.waitForSuccess();
		
		return backupCodes;
	}
	
	async disableTwoFactor(): Promise<void> {
		await this.navigateToTab("security");
		await this.disableTwoFactorButton.click();
		await this.confirmAction();
		await this.waitForSuccess();
	}
	
	async createApiKey(name: string, permissions: string[]): Promise<string> {
		await this.navigateToTab("security");
		await this.createApiKeyButton.click();
		
		await this.page.fill('[data-testid="api-key-name-input"]', name);
		
		for (const permission of permissions) {
			await this.page.check(`[data-testid="permission-${permission}"]`);
		}
		
		await this.page.click('[data-testid="create-key-button"]');
		
		const apiKey = await this.page.locator('[data-testid="generated-api-key"]').textContent();
		await this.page.click('[data-testid="copy-api-key-button"]');
		
		return apiKey || "";
	}
	
	async revokeApiKey(keyId: string): Promise<void> {
		await this.navigateToTab("security");
		await this.page.locator(`[data-testid="revoke-key-${keyId}"]`).click();
		await this.confirmAction();
		await this.waitForSuccess();
	}
	
	async revokeAllSessions(): Promise<void> {
		await this.navigateToTab("security");
		await this.revokeAllSessionsButton.click();
		await this.confirmAction();
		await this.waitForSuccess();
	}
	
	// Integration settings methods
	async connectIntegration(integrationName: string, credentials?: Record<string, string>): Promise<void> {
		await this.navigateToTab("integrations");
		await this.connectButton(integrationName).click();
		
		if (credentials) {
			for (const [field, value] of Object.entries(credentials)) {
				await this.page.fill(`[data-testid="${field}-input"]`, value);
			}
		}
		
		await this.page.click('[data-testid="connect-integration-button"]');
		await this.waitForSuccess();
	}
	
	async disconnectIntegration(integrationName: string): Promise<void> {
		await this.navigateToTab("integrations");
		await this.disconnectButton(integrationName).click();
		await this.confirmAction();
		await this.waitForSuccess();
	}
	
	async createWebhook(webhookData: {
		url: string;
		events: string[];
		secret?: string;
	}): Promise<void> {
		await this.navigateToTab("integrations");
		await this.createWebhookButton.click();
		
		await this.webhookUrlInput.fill(webhookData.url);
		
		if (webhookData.secret) {
			await this.webhookSecretInput.fill(webhookData.secret);
		}
		
		for (const event of webhookData.events) {
			await this.page.check(`[data-testid="webhook-event-${event}"]`);
		}
		
		await this.page.click('[data-testid="create-webhook-submit-button"]');
		await this.waitForSuccess();
	}
	
	async testWebhook(webhookId: string): Promise<void> {
		await this.navigateToTab("integrations");
		await this.page.locator(`[data-testid="test-webhook-${webhookId}"]`).click();
		await this.waitForSuccess();
	}
	
	// Notification settings methods
	async updateNotifications(notificationSettings: {
		email?: boolean;
		push?: boolean;
		slack?: boolean;
		discord?: boolean;
		quietHours?: {
			enabled: boolean;
			start?: string;
			end?: string;
		};
	}): Promise<void> {
		await this.navigateToTab("notifications");
		
		if (notificationSettings.email !== undefined) {
			await this.toggleNotification("email", notificationSettings.email);
		}
		
		if (notificationSettings.push !== undefined) {
			await this.toggleNotification("push", notificationSettings.push);
		}
		
		if (notificationSettings.slack !== undefined) {
			await this.toggleNotification("slack", notificationSettings.slack);
		}
		
		if (notificationSettings.discord !== undefined) {
			await this.toggleNotification("discord", notificationSettings.discord);
		}
		
		if (notificationSettings.quietHours) {
			if (notificationSettings.quietHours.enabled) {
				await this.quietHoursToggle.check();
				
				if (notificationSettings.quietHours.start) {
					await this.quietHoursStart.fill(notificationSettings.quietHours.start);
				}
				
				if (notificationSettings.quietHours.end) {
					await this.quietHoursEnd.fill(notificationSettings.quietHours.end);
				}
			} else {
				await this.quietHoursToggle.uncheck();
			}
		}
		
		await this.saveNotificationsButton.click();
		await this.waitForSuccess();
	}
	
	async testNotification(type: string): Promise<void> {
		await this.navigateToTab("notifications");
		await this.page.locator(`[data-testid="test-${type}-notification"]`).click();
		await this.waitForSuccess();
	}
	
	// Billing settings methods
	async changePlan(planName: string): Promise<void> {
		await this.navigateToTab("billing");
		await this.changePlanButton.click();
		
		await this.page.locator(`[data-testid="select-plan-${planName}"]`).click();
		await this.page.click('[data-testid="confirm-plan-change-button"]');
		await this.waitForSuccess();
	}
	
	async addPaymentMethod(paymentData: {
		cardNumber: string;
		expiryDate: string;
		cvv: string;
		name: string;
		billingAddress: {
			street: string;
			city: string;
			state: string;
			zip: string;
			country: string;
		};
	}): Promise<void> {
		await this.navigateToTab("billing");
		await this.addPaymentMethodButton.click();
		
		await this.page.fill('[data-testid="card-number-input"]', paymentData.cardNumber);
		await this.page.fill('[data-testid="expiry-date-input"]', paymentData.expiryDate);
		await this.page.fill('[data-testid="cvv-input"]', paymentData.cvv);
		await this.page.fill('[data-testid="cardholder-name-input"]', paymentData.name);
		
		// Fill billing address
		await this.page.fill('[data-testid="billing-street-input"]', paymentData.billingAddress.street);
		await this.page.fill('[data-testid="billing-city-input"]', paymentData.billingAddress.city);
		await this.page.fill('[data-testid="billing-state-input"]', paymentData.billingAddress.state);
		await this.page.fill('[data-testid="billing-zip-input"]', paymentData.billingAddress.zip);
		await this.page.selectOption('[data-testid="billing-country-select"]', paymentData.billingAddress.country);
		
		await this.page.click('[data-testid="add-payment-method-submit-button"]');
		await this.waitForSuccess();
	}
	
	async downloadInvoice(invoiceId: string): Promise<string> {
		await this.navigateToTab("billing");
		const downloadPromise = this.page.waitForEvent('download');
		await this.page.locator(`[data-testid="download-invoice-${invoiceId}"]`).click();
		const download = await downloadPromise;
		return download.suggestedFilename();
	}
	
	// Preferences settings methods
	async updatePreferences(preferences: {
		theme?: "light" | "dark" | "system";
		colorScheme?: string;
		fontSize?: string;
		compactMode?: boolean;
		editor?: {
			theme?: string;
			fontFamily?: string;
			fontSize?: string;
			tabSize?: string;
			wordWrap?: boolean;
			lineNumbers?: boolean;
			minimap?: boolean;
		};
		autoSave?: boolean;
		autoSaveInterval?: number;
	}): Promise<void> {
		await this.navigateToTab("preferences");
		
		if (preferences.theme) {
			await this.page.selectOption('[data-testid="theme-select"]', preferences.theme);
		}
		
		if (preferences.colorScheme) {
			await this.colorSchemeSelect.selectOption(preferences.colorScheme);
		}
		
		if (preferences.fontSize) {
			await this.fontSizeSelect.selectOption(preferences.fontSize);
		}
		
		if (preferences.compactMode !== undefined) {
			await this.toggleSetting("compact-mode", preferences.compactMode);
		}
		
		if (preferences.editor) {
			const { editor } = preferences;
			
			if (editor.theme) {
				await this.editorThemeSelect.selectOption(editor.theme);
			}
			
			if (editor.fontFamily) {
				await this.editorFontFamilySelect.selectOption(editor.fontFamily);
			}
			
			if (editor.fontSize) {
				await this.editorFontSizeSelect.selectOption(editor.fontSize);
			}
			
			if (editor.tabSize) {
				await this.editorTabSizeSelect.selectOption(editor.tabSize);
			}
			
			if (editor.wordWrap !== undefined) {
				await this.toggleSetting("editor-word-wrap", editor.wordWrap);
			}
			
			if (editor.lineNumbers !== undefined) {
				await this.toggleSetting("editor-line-numbers", editor.lineNumbers);
			}
			
			if (editor.minimap !== undefined) {
				await this.toggleSetting("editor-minimap", editor.minimap);
			}
		}
		
		if (preferences.autoSave !== undefined) {
			await this.toggleSetting("auto-save", preferences.autoSave);
		}
		
		if (preferences.autoSaveInterval) {
			await this.page.fill('[data-testid="auto-save-interval-input"]', preferences.autoSaveInterval.toString());
		}
		
		await this.savePreferencesButton.click();
		await this.waitForSuccess();
	}
	
	async customizeKeyboardShortcut(action: string, shortcut: string): Promise<void> {
		await this.navigateToTab("preferences");
		await this.page.locator(`[data-testid="customize-shortcut-${action}"]`).click();
		await this.page.fill('[data-testid="shortcut-input"]', shortcut);
		await this.page.click('[data-testid="save-shortcut-button"]');
		await this.waitForSuccess();
	}
	
	async resetKeyboardShortcuts(): Promise<void> {
		await this.navigateToTab("preferences");
		await this.resetShortcutsButton.click();
		await this.confirmAction();
		await this.waitForSuccess();
	}
	
	// Data export methods
	async requestDataExport(exportOptions: {
		format: "json" | "csv" | "xml";
		range: "all" | "last-30-days" | "last-year";
		include: string[];
		password?: string;
	}): Promise<void> {
		await this.navigateToTab("data-export");
		
		await this.exportFormatSelect.selectOption(exportOptions.format);
		await this.exportRangeSelect.selectOption(exportOptions.range);
		
		for (const item of exportOptions.include) {
			await this.page.check(`[data-testid="include-${item}"]`);
		}
		
		if (exportOptions.password) {
			await this.exportPasswordInput.fill(exportOptions.password);
		}
		
		await this.requestExportButton.click();
		await this.waitForSuccess();
	}
	
	async downloadExport(exportId: string): Promise<string> {
		await this.navigateToTab("data-export");
		const downloadPromise = this.page.waitForEvent('download');
		await this.page.locator(`[data-testid="download-export-${exportId}"]`).click();
		const download = await downloadPromise;
		return download.suggestedFilename();
	}
	
	async deleteExport(exportId: string): Promise<void> {
		await this.navigateToTab("data-export");
		await this.page.locator(`[data-testid="delete-export-${exportId}"]`).click();
		await this.confirmAction();
		await this.waitForSuccess();
	}
	
	async requestDataPortability(): Promise<void> {
		await this.navigateToTab("data-export");
		await this.dataPortabilityButton.click();
		await this.confirmAction();
		await this.waitForSuccess();
	}
	
	async requestDataErasure(): Promise<void> {
		await this.navigateToTab("data-export");
		await this.rightToErasureButton.click();
		await this.confirmAction();
		await this.waitForSuccess();
	}
	
	// Utility methods
	async deleteAccount(password: string): Promise<void> {
		await this.navigateToTab("account");
		await this.deleteAccountButton.click();
		await this.page.fill('[data-testid="confirm-password-input"]', password);
		await this.page.check('[data-testid="confirm-deletion-checkbox"]');
		await this.confirmAction();
		await this.waitForSuccess();
	}
	
	async deactivateAccount(): Promise<void> {
		await this.navigateToTab("account");
		await this.deactivateAccountButton.click();
		await this.confirmAction();
		await this.waitForSuccess();
	}
	
	async verifyUnsavedChanges(): Promise<boolean> {
		return await this.unsavedChangesWarning.isVisible();
	}
	
	async discardChanges(): Promise<void> {
		await this.cancelButton.click();
		if (await this.confirmDialog.isVisible()) {
			await this.confirmYesButton.click();
		}
	}
	
	async saveChanges(): Promise<void> {
		await this.saveButton.click();
		await this.waitForSuccess();
	}
	
	private async toggleNotification(type: string, enabled: boolean): Promise<void> {
		const toggle = this.notificationToggle(type);
		if (enabled) {
			await toggle.check();
		} else {
			await toggle.uncheck();
		}
	}
	
	private async toggleSetting(setting: string, enabled: boolean): Promise<void> {
		const toggle = this.page.locator(`[data-testid="${setting}-toggle"]`);
		if (enabled) {
			await toggle.check();
		} else {
			await toggle.uncheck();
		}
	}
	
	private async confirmAction(): Promise<void> {
		await this.confirmDialog.waitFor({ state: "visible" });
		await this.confirmYesButton.click();
	}
	
	private async waitForSuccess(): Promise<void> {
		await this.successMessage.waitFor({ state: "visible" });
	}
}