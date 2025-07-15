import type { Page } from "@playwright/test";

/**
 * Database helper functions for E2E tests
 */

export async function clearDatabase(page: Page) {
	// Clear all test data from the database
	await page.evaluate(() => {
		// Clear localStorage
		localStorage.clear();

		// Clear sessionStorage
		sessionStorage.clear();

		// Clear IndexedDB if used
		if (typeof window !== "undefined" && window.indexedDB) {
			const databases = ["test-db", "app-db", "user-db"];
			databases.forEach(async (dbName) => {
				try {
					const deleteReq = window.indexedDB.deleteDatabase(dbName);
					deleteReq.onsuccess = () =>
						console.log(`Deleted database: ${dbName}`);
				} catch (error) {
					console.warn(`Failed to delete database ${dbName}:`, error);
				}
			});
		}
	});
}

export async function seedTestData(page: Page) {
	// Seed the database with test data
	await page.evaluate(() => {
		// Add any test data seeding logic here
		const testData = {
			users: [
				{ id: 1, email: "admin@test.com", role: "admin" },
				{ id: 2, email: "user@test.com", role: "user" },
			],
			projects: [
				{ id: 1, name: "Test Project", userId: 1 },
				{ id: 2, name: "Demo Project", userId: 2 },
			],
		};

		// Store in localStorage for quick access
		localStorage.setItem("test-data", JSON.stringify(testData));
	});
}

export async function resetDatabase(page: Page) {
	await clearDatabase(page);
	await seedTestData(page);
}

export async function createTestProject(
	page: Page,
	projectData: {
		name: string;
		description?: string;
		type?: string;
	},
) {
	await page.goto("/projects/new");
	await page.fill('[data-testid="project-name-input"]', projectData.name);

	if (projectData.description) {
		await page.fill(
			'[data-testid="project-description-input"]',
			projectData.description,
		);
	}

	if (projectData.type) {
		await page.selectOption(
			'[data-testid="project-type-select"]',
			projectData.type,
		);
	}

	await page.click('[data-testid="create-project-button"]');

	// Wait for project creation
	await page.waitForURL("/projects/*");
}

export async function deleteTestProject(page: Page, projectName: string) {
	await page.goto("/projects");

	// Find and delete the project
	const projectCard = page.locator(
		`[data-testid="project-card"]:has-text("${projectName}")`,
	);
	await projectCard.locator('[data-testid="project-menu-button"]').click();
	await page.click('[data-testid="delete-project-button"]');

	// Confirm deletion
	await page.click('[data-testid="confirm-delete-button"]');

	// Wait for deletion to complete
	await page.waitForResponse("**/api/projects/delete");
}

export async function getTestData(page: Page, key: string): Promise<any> {
	return await page.evaluate((key) => {
		const testData = localStorage.getItem("test-data");
		if (!testData) return null;

		const data = JSON.parse(testData);
		return data[key] || null;
	}, key);
}
