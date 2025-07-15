import type { Page } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object Model for Projects Page
 */
export class ProjectsPage extends BasePage {
	private readonly createProjectButton =
		'[data-testid="create-project-button"]';
	private readonly projectsList = '[data-testid="projects-list"]';
	private readonly projectCard = '[data-testid="project-card"]';
	private readonly projectName = '[data-testid="project-name"]';
	private readonly projectDescription = '[data-testid="project-description"]';
	private readonly projectActions = '[data-testid="project-actions"]';
	private readonly editProjectButton = '[data-testid="edit-project-button"]';
	private readonly deleteProjectButton =
		'[data-testid="delete-project-button"]';
	private readonly searchInput = '[data-testid="search-input"]';
	private readonly filterDropdown = '[data-testid="filter-dropdown"]';
	private readonly sortDropdown = '[data-testid="sort-dropdown"]';
	private readonly emptyState = '[data-testid="empty-state"]';
	private readonly loadingSpinner = '[data-testid="loading-spinner"]';

	constructor(page: Page) {
		super(page, "/projects");
	}

	async createProject(): Promise<void> {
		await this.clickElement(this.createProjectButton);
		await this.page.waitForURL("/projects/new");
	}

	async searchProjects(query: string): Promise<void> {
		await this.fillField(this.searchInput, query);
		await this.pressKey("Enter");
		await this.waitForPageLoad();
	}

	async filterProjects(filter: string): Promise<void> {
		await this.clickElement(this.filterDropdown);
		await this.clickElement(`[data-testid="filter-${filter}"]`);
		await this.waitForPageLoad();
	}

	async sortProjects(sort: string): Promise<void> {
		await this.clickElement(this.sortDropdown);
		await this.clickElement(`[data-testid="sort-${sort}"]`);
		await this.waitForPageLoad();
	}

	async getProjectCards(): Promise<any[]> {
		const cards = await this.page.locator(this.projectCard).all();
		const projects = [];

		for (const card of cards) {
			const name = await card.locator(this.projectName).textContent();
			const description = await card
				.locator(this.projectDescription)
				.textContent();
			projects.push({ name, description });
		}

		return projects;
	}

	async getProjectCount(): Promise<number> {
		const cards = await this.page.locator(this.projectCard).all();
		return cards.length;
	}

	async openProject(projectName: string): Promise<void> {
		await this.clickElement(`${this.projectCard}:has-text("${projectName}")`);
		await this.waitForPageLoad();
	}

	async editProject(projectName: string): Promise<void> {
		const projectCard = this.page.locator(
			`${this.projectCard}:has-text("${projectName}")`,
		);
		await projectCard.locator(this.editProjectButton).click();
		await this.page.waitForURL("**/edit");
	}

	async deleteProject(projectName: string): Promise<void> {
		const projectCard = this.page.locator(
			`${this.projectCard}:has-text("${projectName}")`,
		);
		await projectCard.locator(this.deleteProjectButton).click();

		// Confirm deletion in modal
		await this.clickElement('[data-testid="confirm-delete-button"]');
		await this.waitForResponse("**/api/projects/delete");
	}

	async waitForProjectsLoad(): Promise<void> {
		await this.waitForSelector(this.projectsList);
		await this.waitForPageLoad();
	}

	async isEmptyStateVisible(): Promise<boolean> {
		return await this.isElementVisible(this.emptyState);
	}

	async isLoadingSpinnerVisible(): Promise<boolean> {
		return await this.isElementVisible(this.loadingSpinner);
	}

	async expectProjectsPageVisible(): Promise<void> {
		await this.expectElementVisible(this.createProjectButton);
		await this.expectElementVisible(this.projectsList);
		await this.expectElementVisible(this.searchInput);
	}

	async expectProjectExists(projectName: string): Promise<void> {
		await this.expectElementVisible(
			`${this.projectCard}:has-text("${projectName}")`,
		);
	}

	async expectProjectNotExists(projectName: string): Promise<void> {
		await this.expectElementHidden(
			`${this.projectCard}:has-text("${projectName}")`,
		);
	}

	async expectEmptyState(): Promise<void> {
		await this.expectElementVisible(this.emptyState);
	}

	async expectCreateProjectButtonEnabled(): Promise<void> {
		await this.expectElementEnabled(this.createProjectButton);
	}

	async expectSearchInputVisible(): Promise<void> {
		await this.expectElementVisible(this.searchInput);
	}

	async expectFilterDropdownVisible(): Promise<void> {
		await this.expectElementVisible(this.filterDropdown);
	}

	async expectSortDropdownVisible(): Promise<void> {
		await this.expectElementVisible(this.sortDropdown);
	}

	async getSearchInputValue(): Promise<string> {
		return await this.page.locator(this.searchInput).inputValue();
	}

	async clearSearch(): Promise<void> {
		await this.fillField(this.searchInput, "");
		await this.pressKey("Enter");
		await this.waitForPageLoad();
	}

	async selectProject(projectName: string): Promise<void> {
		await this.clickElement(
			`${this.projectCard}:has-text("${projectName}") input[type="checkbox"]`,
		);
	}

	async selectAllProjects(): Promise<void> {
		await this.clickElement('[data-testid="select-all-projects"]');
	}

	async bulkDeleteProjects(): Promise<void> {
		await this.clickElement('[data-testid="bulk-delete-button"]');
		await this.clickElement('[data-testid="confirm-bulk-delete-button"]');
		await this.waitForResponse("**/api/projects/bulk-delete");
	}

	async getSelectedProjectCount(): Promise<number> {
		const selectedCards = await this.page
			.locator(`${this.projectCard} input[type="checkbox"]:checked`)
			.all();
		return selectedCards.length;
	}
}
