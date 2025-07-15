import { expect, test } from "@playwright/test";
import { testProjects } from "./fixtures/test-data";
import { loginUser } from "./helpers/auth";
import { clearDatabase, createTestProject, seedTestData } from "./helpers/db";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { ProjectsPage } from "./pages/ProjectsPage";

/**
 * Projects E2E tests
 */

test.describe("Projects", () => {
	let loginPage: LoginPage;
	let dashboardPage: DashboardPage;
	let projectsPage: ProjectsPage;

	test.beforeEach(async ({ page }) => {
		loginPage = new LoginPage(page);
		dashboardPage = new DashboardPage(page);
		projectsPage = new ProjectsPage(page);

		// Clear and seed database
		await clearDatabase(page);
		await seedTestData(page);

		// Login user
		await loginUser(page);
	});

	test("should display projects page", async ({ page }) => {
		await projectsPage.goto();
		await projectsPage.expectProjectsPageVisible();

		// Check if all main elements are present
		await projectsPage.expectCreateProjectButtonEnabled();
		await projectsPage.expectSearchInputVisible();
		await projectsPage.expectFilterDropdownVisible();
		await projectsPage.expectSortDropdownVisible();
	});

	test("should create new project", async ({ page }) => {
		await projectsPage.goto();
		await projectsPage.createProject();

		// Should navigate to new project page
		await expect(page).toHaveURL(/.*projects\/new/);

		// Fill project form
		await page.fill(
			'[data-testid="project-name-input"]',
			testProjects.basic.name,
		);
		await page.fill(
			'[data-testid="project-description-input"]',
			testProjects.basic.description,
		);
		await page.selectOption(
			'[data-testid="project-type-select"]',
			testProjects.basic.type,
		);

		// Submit form
		await page.click('[data-testid="create-project-button"]');

		// Should redirect to project page
		await expect(page).toHaveURL(/.*projects\/\d+/);

		// Verify project was created
		await projectsPage.goto();
		await projectsPage.expectProjectExists(testProjects.basic.name);
	});

	test("should search projects", async ({ page }) => {
		// Create test project first
		await createTestProject(page, testProjects.basic);

		await projectsPage.goto();
		await projectsPage.waitForProjectsLoad();

		// Search for project
		await projectsPage.searchProjects(testProjects.basic.name);

		// Should show only matching projects
		await projectsPage.expectProjectExists(testProjects.basic.name);

		// Clear search
		await projectsPage.clearSearch();

		// Should show all projects again
		const projectCount = await projectsPage.getProjectCount();
		expect(projectCount).toBeGreaterThan(0);
	});

	test("should filter projects", async ({ page }) => {
		// Create projects of different types
		await createTestProject(page, testProjects.basic);
		await createTestProject(page, testProjects.advanced);

		await projectsPage.goto();
		await projectsPage.waitForProjectsLoad();

		// Filter by type
		await projectsPage.filterProjects("web");

		// Should show only web projects
		await projectsPage.expectProjectExists(testProjects.basic.name);
	});

	test("should sort projects", async ({ page }) => {
		// Create multiple projects
		await createTestProject(page, testProjects.basic);
		await createTestProject(page, testProjects.advanced);

		await projectsPage.goto();
		await projectsPage.waitForProjectsLoad();

		// Sort by name
		await projectsPage.sortProjects("name");

		const projects = await projectsPage.getProjectCards();

		// Verify sorting
		const sortedProjects = [...projects].sort((a, b) =>
			a.name.localeCompare(b.name),
		);
		expect(projects).toEqual(sortedProjects);
	});

	test("should edit project", async ({ page }) => {
		await createTestProject(page, testProjects.basic);

		await projectsPage.goto();
		await projectsPage.waitForProjectsLoad();

		// Edit project
		await projectsPage.editProject(testProjects.basic.name);

		// Should navigate to edit page
		await expect(page).toHaveURL(/.*projects\/\d+\/edit/);

		// Update project name
		const newName = "Updated Project Name";
		await page.fill('[data-testid="project-name-input"]', newName);
		await page.click('[data-testid="save-project-button"]');

		// Should redirect back to projects
		await expect(page).toHaveURL(/.*projects/);

		// Verify project was updated
		await projectsPage.expectProjectExists(newName);
		await projectsPage.expectProjectNotExists(testProjects.basic.name);
	});

	test("should delete project", async ({ page }) => {
		await createTestProject(page, testProjects.basic);

		await projectsPage.goto();
		await projectsPage.waitForProjectsLoad();

		// Delete project
		await projectsPage.deleteProject(testProjects.basic.name);

		// Project should be removed
		await projectsPage.expectProjectNotExists(testProjects.basic.name);
	});

	test("should handle empty projects list", async ({ page }) => {
		await projectsPage.goto();
		await projectsPage.waitForProjectsLoad();

		// If no projects exist, should show empty state
		const projectCount = await projectsPage.getProjectCount();
		if (projectCount === 0) {
			await projectsPage.expectEmptyState();
		}
	});

	test("should handle project loading states", async ({ page }) => {
		await projectsPage.goto();

		// Check if loading spinner appears
		const isLoading = await projectsPage.isLoadingSpinnerVisible();
		if (isLoading) {
			// Wait for loading to complete
			await page.waitForSelector('[data-testid="loading-spinner"]', {
				state: "hidden",
			});
		}

		await projectsPage.waitForProjectsLoad();
		await projectsPage.expectProjectsPageVisible();
	});

	test("should navigate to project details", async ({ page }) => {
		await createTestProject(page, testProjects.basic);

		await projectsPage.goto();
		await projectsPage.waitForProjectsLoad();

		// Open project
		await projectsPage.openProject(testProjects.basic.name);

		// Should navigate to project details
		await expect(page).toHaveURL(/.*projects\/\d+/);

		// Verify project details page
		await expect(page.locator('[data-testid="project-title"]')).toContainText(
			testProjects.basic.name,
		);
	});

	test("should handle bulk operations", async ({ page }) => {
		// Create multiple projects
		await createTestProject(page, testProjects.basic);
		await createTestProject(page, testProjects.advanced);

		await projectsPage.goto();
		await projectsPage.waitForProjectsLoad();

		// Select projects
		await projectsPage.selectProject(testProjects.basic.name);
		await projectsPage.selectProject(testProjects.advanced.name);

		const selectedCount = await projectsPage.getSelectedProjectCount();
		expect(selectedCount).toBe(2);

		// Bulk delete
		await projectsPage.bulkDeleteProjects();

		// Projects should be removed
		await projectsPage.expectProjectNotExists(testProjects.basic.name);
		await projectsPage.expectProjectNotExists(testProjects.advanced.name);
	});

	test("should handle project validation", async ({ page }) => {
		await projectsPage.goto();
		await projectsPage.createProject();

		// Try to create project without name
		await page.click('[data-testid="create-project-button"]');

		// Should show validation error
		await expect(page.locator('[data-testid="name-error"]')).toContainText(
			"required",
		);
	});

	test("should handle project duplication", async ({ page }) => {
		await createTestProject(page, testProjects.basic);

		await projectsPage.goto();
		await projectsPage.waitForProjectsLoad();

		// Try to create project with same name
		await projectsPage.createProject();
		await page.fill(
			'[data-testid="project-name-input"]',
			testProjects.basic.name,
		);
		await page.click('[data-testid="create-project-button"]');

		// Should show duplication error
		await expect(page.locator('[data-testid="error-message"]')).toContainText(
			"already exists",
		);
	});

	test("should handle project permissions", async ({ page }) => {
		await createTestProject(page, testProjects.basic);

		await projectsPage.goto();
		await projectsPage.waitForProjectsLoad();

		// Check if edit/delete buttons are visible for owned projects
		const projectCard = page.locator(
			`[data-testid="project-card"]:has-text("${testProjects.basic.name}")`,
		);

		await expect(
			projectCard.locator('[data-testid="edit-project-button"]'),
		).toBeVisible();
		await expect(
			projectCard.locator('[data-testid="delete-project-button"]'),
		).toBeVisible();
	});

	test("should handle project search with no results", async ({ page }) => {
		await projectsPage.goto();
		await projectsPage.waitForProjectsLoad();

		// Search for non-existent project
		await projectsPage.searchProjects("NonExistentProject123");

		// Should show no results message
		await expect(page.locator('[data-testid="no-results"]')).toContainText(
			"No projects found",
		);
	});

	test("should handle project export", async ({ page }) => {
		await createTestProject(page, testProjects.basic);

		await projectsPage.goto();
		await projectsPage.waitForProjectsLoad();

		// Export project
		const projectCard = page.locator(
			`[data-testid="project-card"]:has-text("${testProjects.basic.name}")`,
		);
		await projectCard.locator('[data-testid="export-project-button"]').click();

		// Should trigger download
		const downloadPromise = page.waitForEvent("download");
		await page.click('[data-testid="confirm-export-button"]');
		const download = await downloadPromise;

		expect(download.suggestedFilename()).toContain(testProjects.basic.name);
	});
});
