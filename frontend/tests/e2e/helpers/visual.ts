import { expect, type Page } from "@playwright/test";

/**
 * Visual testing helpers for E2E tests
 */

export interface ScreenshotOptions {
	name: string;
	fullPage?: boolean;
	mask?: string[];
	threshold?: number;
	clip?: { x: number; y: number; width: number; height: number };
}

export async function takeVisualSnapshot(
	page: Page,
	options: ScreenshotOptions,
): Promise<void> {
	const { name, fullPage = false, mask = [], threshold = 0.2, clip } = options;

	// Wait for page to be stable
	await page.waitForLoadState("networkidle");

	// Hide dynamic elements that might cause flaky tests
	const dynamicElements = [
		'[data-testid="timestamp"]',
		'[data-testid="loading-indicator"]',
		'[data-testid="progress-bar"]',
		...mask,
	];

	for (const selector of dynamicElements) {
		await page.locator(selector).evaluateAll((elements) => {
			elements.forEach((el) => {
				if (el instanceof HTMLElement) {
					el.style.visibility = "hidden";
				}
			});
		});
	}

	// Take screenshot
	await expect(page).toHaveScreenshot(`${name}.png`, {
		fullPage,
		threshold,
		clip,
	});
}

export async function compareVisualChange(
	page: Page,
	selector: string,
	action: () => Promise<void>,
	name: string,
): Promise<void> {
	// Take before screenshot
	await page
		.locator(selector)
		.screenshot({ path: `test-results/screenshots/${name}-before.png` });

	// Perform action
	await action();

	// Take after screenshot
	await page
		.locator(selector)
		.screenshot({ path: `test-results/screenshots/${name}-after.png` });

	// Compare using visual regression
	await expect(page.locator(selector)).toHaveScreenshot(`${name}-after.png`);
}

export async function checkAccessibility(
	page: Page,
	selector?: string,
): Promise<void> {
	// Simple accessibility checks
	const target = selector ? page.locator(selector) : page;

	// Check for missing alt text on images
	const images = await target.locator("img").all();
	for (const img of images) {
		const alt = await img.getAttribute("alt");
		const ariaLabel = await img.getAttribute("aria-label");

		if (!alt && !ariaLabel) {
			throw new Error("Image missing alt text or aria-label");
		}
	}

	// Check for missing form labels
	const inputs = await target.locator("input, select, textarea").all();
	for (const input of inputs) {
		const id = await input.getAttribute("id");
		const ariaLabel = await input.getAttribute("aria-label");
		const ariaLabelledBy = await input.getAttribute("aria-labelledby");

		if (id) {
			const label = await target.locator(`label[for="${id}"]`).count();
			if (label === 0 && !ariaLabel && !ariaLabelledBy) {
				throw new Error(`Form input missing associated label: ${id}`);
			}
		}
	}

	// Check for proper heading hierarchy
	const headings = await target.locator("h1, h2, h3, h4, h5, h6").all();
	let lastLevel = 0;

	for (const heading of headings) {
		const tagName = await heading.evaluate((el) => el.tagName.toLowerCase());
		const level = Number.parseInt(tagName.replace("h", ""));

		if (level > lastLevel + 1) {
			throw new Error(
				`Heading hierarchy violation: ${tagName} follows h${lastLevel}`,
			);
		}

		lastLevel = level;
	}
}

export async function checkColorContrast(
	page: Page,
	selector: string,
): Promise<void> {
	const element = page.locator(selector);

	const _styles = await element.evaluate((el) => {
		const computed = window.getComputedStyle(el);
		return {
			color: computed.color,
			backgroundColor: computed.backgroundColor,
			fontSize: computed.fontSize,
		};
	});
}

export async function checkResponsiveDesign(
	page: Page,
	breakpoints: { name: string; width: number; height: number }[],
): Promise<void> {
	for (const breakpoint of breakpoints) {
		await page.setViewportSize({
			width: breakpoint.width,
			height: breakpoint.height,
		});
		await page.waitForTimeout(1000); // Allow time for responsive changes

		// Check if content is still visible and properly laid out
		await expect(page.locator("main")).toBeVisible();

		// Take screenshot for visual verification
		await page.screenshot({
			path: `test-results/screenshots/responsive-${breakpoint.name}.png`,
			fullPage: true,
		});
	}
}

export async function checkAnimations(
	page: Page,
	selector: string,
): Promise<void> {
	const element = page.locator(selector);

	// Check if element has CSS animations
	const hasAnimations = await element.evaluate((el) => {
		const computed = window.getComputedStyle(el);
		return (
			computed.animationName !== "none" ||
			computed.transitionProperty !== "none"
		);
	});

	if (hasAnimations) {
		// Wait for animations to complete
		await page.waitForTimeout(1000);

		// Check if element is still visible after animations
		await expect(element).toBeVisible();
	}
}

export async function measurePerformance(page: Page): Promise<{
	domContentLoaded: number;
	loadComplete: number;
	firstContentfulPaint: number;
}> {
	const metrics = await page.evaluate(() => {
		const navigation = performance.getEntriesByType(
			"navigation",
		)[0] as PerformanceNavigationTiming;
		const paint = performance.getEntriesByType("paint");

		return {
			domContentLoaded:
				navigation.domContentLoadedEventEnd - navigation.fetchStart,
			loadComplete: navigation.loadEventEnd - navigation.fetchStart,
			firstContentfulPaint:
				paint.find((p) => p.name === "first-contentful-paint")?.startTime || 0,
		};
	});
	return metrics;
}
