import { test as base, type Page } from "@playwright/test";

/**
 * Server helper functions for E2E tests
 */

export async function waitForServer(
	page: Page,
	url: string,
	timeout = 30000,
): Promise<boolean> {
	const start = Date.now();

	while (Date.now() - start < timeout) {
		try {
			await page.goto(url);
			return true;
		} catch (error) {
			// Server not ready yet, wait and retry
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}

	return false;
}

export async function checkServerHealth(
	page: Page,
	baseUrl: string,
): Promise<boolean> {
	try {
		const response = await page.goto(`${baseUrl}/health`);
		return response?.status() === 200;
	} catch {
		return false;
	}
}

export async function setupTestServer(
	page: Page,
	baseUrl: string,
): Promise<void> {
	// Wait for server to be ready
	const serverReady = await waitForServer(page, baseUrl);

	if (!serverReady) {
		throw new Error(`Server not ready at ${baseUrl}`);
	}

	// Clear any existing test data
	await page.evaluate(() => {
		localStorage.clear();
		sessionStorage.clear();
	});

	// Set up test environment
	await page.addInitScript(() => {
		// Add test mode flag
		(window as any).TEST_MODE = true;

		// Mock console.error to suppress React warnings in tests
		const originalError = console.error;
		console.error = (...args) => {
			// Suppress React warnings that don't affect tests
			if (args[0]?.includes?.("Warning:")) return;
			originalError.apply(console, args);
		};
	});
}

export async function mockApiResponse(
	page: Page,
	url: string,
	response: any,
): Promise<void> {
	await page.route(url, (route) => {
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify(response),
		});
	});
}

export async function mockApiError(
	page: Page,
	url: string,
	status = 500,
	message = "Internal Server Error",
): Promise<void> {
	await page.route(url, (route) => {
		route.fulfill({
			status,
			contentType: "application/json",
			body: JSON.stringify({ error: message }),
		});
	});
}

export async function interceptRequests(
	page: Page,
	callback: (url: string) => void,
): Promise<void> {
	page.on("request", (request) => {
		callback(request.url());
	});
}

export async function getNetworkActivity(page: Page): Promise<{
	requests: string[];
	responses: string[];
	errors: string[];
}> {
	const requests: string[] = [];
	const responses: string[] = [];
	const errors: string[] = [];

	page.on("request", (request) => {
		requests.push(request.url());
	});

	page.on("response", (response) => {
		responses.push(response.url());
	});

	page.on("requestfailed", (request) => {
		errors.push(request.url());
	});

	return { requests, responses, errors };
}

export async function skipIfServerNotRunning(
	page: Page,
	baseUrl: string,
): Promise<void> {
	const serverRunning = await waitForServer(page, baseUrl, 5000);

	if (!serverRunning) {
		base.skip();
	}
}
