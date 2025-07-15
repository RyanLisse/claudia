import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Base page class with common functionality
 */
export abstract class BasePage {
	protected page: Page;
	protected url: string;

	constructor(page: Page, url: string) {
		this.page = page;
		this.url = url;
	}

	async goto(): Promise<void> {
		await this.page.goto(this.url);
		await this.waitForPageLoad();
	}

	async waitForPageLoad(): Promise<void> {
		await this.page.waitForLoadState("networkidle");
		await this.page.waitForLoadState("domcontentloaded");
	}

	async getTitle(): Promise<string> {
		return await this.page.title();
	}

	async getCurrentUrl(): Promise<string> {
		return this.page.url();
	}

	async takeScreenshot(name: string): Promise<void> {
		await this.page.screenshot({
			path: `test-results/screenshots/${name}.png`,
		});
	}

	async waitForSelector(selector: string, timeout = 10000): Promise<Locator> {
		return await this.page.waitForSelector(selector, { timeout });
	}

	async waitForText(text: string, timeout = 10000): Promise<Locator> {
		return await this.page.waitForSelector(`text=${text}`, { timeout });
	}

	async clickElement(selector: string): Promise<void> {
		await this.page.click(selector);
	}

	async fillField(selector: string, value: string): Promise<void> {
		await this.page.fill(selector, value);
	}

	async selectOption(selector: string, value: string): Promise<void> {
		await this.page.selectOption(selector, value);
	}

	async isElementVisible(selector: string): Promise<boolean> {
		try {
			await this.page.waitForSelector(selector, { timeout: 5000 });
			return await this.page.isVisible(selector);
		} catch {
			return false;
		}
	}

	async isElementEnabled(selector: string): Promise<boolean> {
		return await this.page.isEnabled(selector);
	}

	async getElementText(selector: string): Promise<string> {
		return (await this.page.textContent(selector)) || "";
	}

	async getElementAttribute(
		selector: string,
		attribute: string,
	): Promise<string> {
		return (await this.page.getAttribute(selector, attribute)) || "";
	}

	async waitForResponse(urlPattern: string): Promise<void> {
		await this.page.waitForResponse(urlPattern);
	}

	async waitForRequest(urlPattern: string): Promise<void> {
		await this.page.waitForRequest(urlPattern);
	}

	async scrollToElement(selector: string): Promise<void> {
		await this.page.locator(selector).scrollIntoViewIfNeeded();
	}

	async dragAndDrop(source: string, target: string): Promise<void> {
		await this.page.dragAndDrop(source, target);
	}

	async uploadFile(selector: string, filePath: string): Promise<void> {
		await this.page.setInputFiles(selector, filePath);
	}

	async pressKey(key: string): Promise<void> {
		await this.page.keyboard.press(key);
	}

	async typeText(text: string): Promise<void> {
		await this.page.keyboard.type(text);
	}

	async hover(selector: string): Promise<void> {
		await this.page.hover(selector);
	}

	async rightClick(selector: string): Promise<void> {
		await this.page.click(selector, { button: "right" });
	}

	async doubleClick(selector: string): Promise<void> {
		await this.page.dblclick(selector);
	}

	async expectElementVisible(selector: string): Promise<void> {
		await expect(this.page.locator(selector)).toBeVisible();
	}

	async expectElementHidden(selector: string): Promise<void> {
		await expect(this.page.locator(selector)).toBeHidden();
	}

	async expectElementEnabled(selector: string): Promise<void> {
		await expect(this.page.locator(selector)).toBeEnabled();
	}

	async expectElementDisabled(selector: string): Promise<void> {
		await expect(this.page.locator(selector)).toBeDisabled();
	}

	async expectElementText(selector: string, text: string): Promise<void> {
		await expect(this.page.locator(selector)).toContainText(text);
	}

	async expectElementValue(selector: string, value: string): Promise<void> {
		await expect(this.page.locator(selector)).toHaveValue(value);
	}

	async expectUrl(url: string): Promise<void> {
		await expect(this.page).toHaveURL(url);
	}

	async expectTitle(title: string): Promise<void> {
		await expect(this.page).toHaveTitle(title);
	}
}
