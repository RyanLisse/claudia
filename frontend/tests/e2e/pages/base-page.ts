import { Page, Locator, expect } from "@playwright/test";

export class BasePage {
	readonly page: Page;
	readonly loadingIndicator: Locator;
	readonly errorMessage: Locator;
	readonly successMessage: Locator;
	readonly notificationToast: Locator;
	readonly modalOverlay: Locator;
	readonly confirmDialog: Locator;
	readonly backButton: Locator;
	readonly saveButton: Locator;
	readonly cancelButton: Locator;
	readonly deleteButton: Locator;
	readonly refreshButton: Locator;
	
	constructor(page: Page) {
		this.page = page;
		this.loadingIndicator = page.locator('[data-testid="loading-indicator"]');
		this.errorMessage = page.locator('[data-testid="error-message"]');
		this.successMessage = page.locator('[data-testid="success-message"]');
		this.notificationToast = page.locator('[data-testid="notification-toast"]');
		this.modalOverlay = page.locator('[data-testid="modal-overlay"]');
		this.confirmDialog = page.locator('[data-testid="confirm-dialog"]');
		this.backButton = page.locator('[data-testid="back-button"]');
		this.saveButton = page.locator('[data-testid="save-button"]');
		this.cancelButton = page.locator('[data-testid="cancel-button"]');
		this.deleteButton = page.locator('[data-testid="delete-button"]');
		this.refreshButton = page.locator('[data-testid="refresh-button"]');
	}
	
	async waitForPageLoad(): Promise<void> {
		await this.page.waitForLoadState("networkidle");
		
		// Wait for loading indicator to disappear
		try {
			await this.loadingIndicator.waitFor({ state: "hidden", timeout: 10000 });
		} catch {
			// Loading indicator might not be present
		}
	}
	
	async waitForSuccess(): Promise<void> {
		await this.successMessage.waitFor({ state: "visible", timeout: 10000 });
	}
	
	async waitForError(): Promise<void> {
		await this.errorMessage.waitFor({ state: "visible", timeout: 10000 });
	}
	
	async dismissNotification(): Promise<void> {
		if (await this.notificationToast.isVisible()) {
			await this.notificationToast.click();
		}
	}
	
	async confirmAction(): Promise<void> {
		await this.confirmDialog.waitFor({ state: "visible" });
		await this.page.locator('[data-testid="confirm-yes-button"]').click();
		await this.confirmDialog.waitFor({ state: "hidden" });
	}
	
	async cancelAction(): Promise<void> {
		await this.confirmDialog.waitFor({ state: "visible" });
		await this.page.locator('[data-testid="confirm-no-button"]').click();
		await this.confirmDialog.waitFor({ state: "hidden" });
	}
	
	async refresh(): Promise<void> {
		await this.refreshButton.click();
		await this.waitForPageLoad();
	}
	
	async goBack(): Promise<void> {
		await this.backButton.click();
		await this.waitForPageLoad();
	}
	
	async takeScreenshot(name: string): Promise<void> {
		await this.page.screenshot({ 
			path: `test-results/screenshots/${name}.png`, 
			fullPage: true 
		});
	}
	
	async scrollToTop(): Promise<void> {
		await this.page.evaluate(() => window.scrollTo(0, 0));
	}
	
	async scrollToBottom(): Promise<void> {
		await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
	}
	
	async scrollToElement(selector: string): Promise<void> {
		await this.page.locator(selector).scrollIntoViewIfNeeded();
	}
	
	async waitForElement(selector: string, timeout = 10000): Promise<void> {
		await this.page.locator(selector).waitFor({ state: "visible", timeout });
	}
	
	async waitForElementHidden(selector: string, timeout = 10000): Promise<void> {
		await this.page.locator(selector).waitFor({ state: "hidden", timeout });
	}
	
	async waitForText(text: string, timeout = 10000): Promise<void> {
		await this.page.locator(`text=${text}`).waitFor({ state: "visible", timeout });
	}
	
	async waitForURL(url: string, timeout = 10000): Promise<void> {
		await this.page.waitForURL(url, { timeout });
	}
	
	async getTitle(): Promise<string> {
		return await this.page.title();
	}
	
	async getURL(): Promise<string> {
		return this.page.url();
	}
	
	async isElementVisible(selector: string): Promise<boolean> {
		try {
			await this.page.locator(selector).waitFor({ state: "visible", timeout: 1000 });
			return true;
		} catch {
			return false;
		}
	}
	
	async isElementEnabled(selector: string): Promise<boolean> {
		return await this.page.locator(selector).isEnabled();
	}
	
	async isElementChecked(selector: string): Promise<boolean> {
		return await this.page.locator(selector).isChecked();
	}
	
	async getText(selector: string): Promise<string> {
		return await this.page.locator(selector).textContent() || "";
	}
	
	async getValue(selector: string): Promise<string> {
		return await this.page.locator(selector).inputValue();
	}
	
	async clickElement(selector: string): Promise<void> {
		await this.page.locator(selector).click();
	}
	
	async doubleClickElement(selector: string): Promise<void> {
		await this.page.locator(selector).dblclick();
	}
	
	async rightClickElement(selector: string): Promise<void> {
		await this.page.locator(selector).click({ button: "right" });
	}
	
	async hoverElement(selector: string): Promise<void> {
		await this.page.locator(selector).hover();
	}
	
	async fillField(selector: string, value: string): Promise<void> {
		await this.page.locator(selector).fill(value);
	}
	
	async clearField(selector: string): Promise<void> {
		await this.page.locator(selector).clear();
	}
	
	async selectOption(selector: string, value: string): Promise<void> {
		await this.page.locator(selector).selectOption(value);
	}
	
	async checkCheckbox(selector: string): Promise<void> {
		await this.page.locator(selector).check();
	}
	
	async uncheckCheckbox(selector: string): Promise<void> {
		await this.page.locator(selector).uncheck();
	}
	
	async pressKey(key: string): Promise<void> {
		await this.page.keyboard.press(key);
	}
	
	async typeText(text: string): Promise<void> {
		await this.page.keyboard.type(text);
	}
	
	async dragAndDrop(sourceSelector: string, targetSelector: string): Promise<void> {
		await this.page.locator(sourceSelector).dragTo(this.page.locator(targetSelector));
	}
	
	async uploadFile(selector: string, filePath: string): Promise<void> {
		await this.page.locator(selector).setInputFiles(filePath);
	}
	
	async downloadFile(selector: string): Promise<string> {
		const downloadPromise = this.page.waitForEvent("download");
		await this.page.locator(selector).click();
		const download = await downloadPromise;
		const path = `test-results/downloads/${download.suggestedFilename()}`;
		await download.saveAs(path);
		return path;
	}
	
	async switchToFrame(selector: string): Promise<void> {
		const frame = await this.page.frame({ name: selector });
		if (frame) {
			// Switch context to frame
			await frame.waitForLoadState();
		}
	}
	
	async switchToMainFrame(): Promise<void> {
		// Switch back to main frame
		await this.page.waitForLoadState();
	}
	
	async openNewTab(url: string): Promise<Page> {
		const newPage = await this.page.context().newPage();
		await newPage.goto(url);
		return newPage;
	}
	
	async closeCurrentTab(): Promise<void> {
		await this.page.close();
	}
	
	async switchToTab(index: number): Promise<void> {
		const pages = this.page.context().pages();
		await pages[index].bringToFront();
	}
	
	async getElementCount(selector: string): Promise<number> {
		return await this.page.locator(selector).count();
	}
	
	async getElementsText(selector: string): Promise<string[]> {
		return await this.page.locator(selector).allTextContents();
	}
	
	async waitForAnimation(): Promise<void> {
		// Wait for CSS animations to complete
		await this.page.waitForTimeout(300);
	}
	
	async waitForRequest(url: string): Promise<void> {
		await this.page.waitForRequest(url);
	}
	
	async waitForResponse(url: string): Promise<void> {
		await this.page.waitForResponse(url);
	}
	
	async mockAPICall(url: string, response: any): Promise<void> {
		await this.page.route(url, route => {
			route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(response)
			});
		});
	}
	
	async interceptRequest(url: string): Promise<void> {
		await this.page.route(url, route => {
			route.abort();
		});
	}
	
	async evaluateScript(script: string): Promise<any> {
		return await this.page.evaluate(script);
	}
	
	async addScript(script: string): Promise<void> {
		await this.page.addInitScript(script);
	}
	
	async setCookie(name: string, value: string): Promise<void> {
		await this.page.context().addCookies([{
			name,
			value,
			url: this.page.url()
		}]);
	}
	
	async getCookie(name: string): Promise<string | undefined> {
		const cookies = await this.page.context().cookies();
		return cookies.find(cookie => cookie.name === name)?.value;
	}
	
	async clearCookies(): Promise<void> {
		await this.page.context().clearCookies();
	}
	
	async setLocalStorage(key: string, value: string): Promise<void> {
		await this.page.evaluate(({ key, value }) => {
			localStorage.setItem(key, value);
		}, { key, value });
	}
	
	async getLocalStorage(key: string): Promise<string | null> {
		return await this.page.evaluate((key) => {
			return localStorage.getItem(key);
		}, key);
	}
	
	async clearLocalStorage(): Promise<void> {
		await this.page.evaluate(() => {
			localStorage.clear();
		});
	}
	
	async setSessionStorage(key: string, value: string): Promise<void> {
		await this.page.evaluate(({ key, value }) => {
			sessionStorage.setItem(key, value);
		}, { key, value });
	}
	
	async getSessionStorage(key: string): Promise<string | null> {
		return await this.page.evaluate((key) => {
			return sessionStorage.getItem(key);
		}, key);
	}
	
	async clearSessionStorage(): Promise<void> {
		await this.page.evaluate(() => {
			sessionStorage.clear();
		});
	}
	
	async setViewport(width: number, height: number): Promise<void> {
		await this.page.setViewportSize({ width, height });
	}
	
	async getViewport(): Promise<{ width: number; height: number } | null> {
		return this.page.viewportSize();
	}
	
	async emulateDevice(device: string): Promise<void> {
		// This would require device definitions
		// For now, we'll use standard viewport sizes
		const deviceMap: Record<string, { width: number; height: number }> = {
			"mobile": { width: 375, height: 667 },
			"tablet": { width: 768, height: 1024 },
			"desktop": { width: 1280, height: 720 }
		};
		
		if (deviceMap[device]) {
			await this.setViewport(deviceMap[device].width, deviceMap[device].height);
		}
	}
	
	async enableDarkMode(): Promise<void> {
		await this.page.emulateMedia({ colorScheme: "dark" });
	}
	
	async enableLightMode(): Promise<void> {
		await this.page.emulateMedia({ colorScheme: "light" });
	}
	
	async disableJavaScript(): Promise<void> {
		await this.page.context().setExtraHTTPHeaders({
			"Content-Security-Policy": "script-src 'none'"
		});
	}
	
	async enableJavaScript(): Promise<void> {
		await this.page.context().setExtraHTTPHeaders({});
	}
	
	async simulateOffline(): Promise<void> {
		await this.page.context().setOffline(true);
	}
	
	async simulateOnline(): Promise<void> {
		await this.page.context().setOffline(false);
	}
	
	async slowNetworkConnection(): Promise<void> {
		// Simulate slow network
		await this.page.route("**/*", route => {
			setTimeout(() => {
				route.continue();
			}, 2000);
		});
	}
	
	async normalNetworkConnection(): Promise<void> {
		await this.page.unroute("**/*");
	}
	
	async verifyAccessibility(): Promise<void> {
		// Basic accessibility checks
		const hasHeadings = await this.page.locator("h1, h2, h3, h4, h5, h6").count() > 0;
		const hasSkipLinks = await this.page.locator('a[href="#main"], a[href="#content"]').count() > 0;
		const hasLandmarks = await this.page.locator('[role="main"], [role="navigation"], [role="banner"]').count() > 0;
		
		if (!hasHeadings) {
			console.warn("Accessibility: No heading elements found");
		}
		
		if (!hasSkipLinks) {
			console.warn("Accessibility: No skip links found");
		}
		
		if (!hasLandmarks) {
			console.warn("Accessibility: No landmark elements found");
		}
	}
	
	async verifyKeyboardNavigation(): Promise<void> {
		// Test basic keyboard navigation
		await this.page.keyboard.press("Tab");
		const focusedElement = await this.page.evaluate(() => document.activeElement?.tagName);
		
		if (!focusedElement || focusedElement === "BODY") {
			console.warn("Keyboard navigation: No focusable elements found");
		}
	}
	
	async verifyScreenReader(): Promise<void> {
		// Check for screen reader support
		const hasAriaLabels = await this.page.locator("[aria-label]").count() > 0;
		const hasAriaDescriptions = await this.page.locator("[aria-describedby]").count() > 0;
		const hasRoles = await this.page.locator("[role]").count() > 0;
		
		if (!hasAriaLabels && !hasAriaDescriptions && !hasRoles) {
			console.warn("Screen reader: No ARIA attributes found");
		}
	}
}