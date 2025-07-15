import type { Page } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object Model for Dashboard Page
 */
export class DashboardPage extends BasePage {
	private readonly userMenu = '[data-testid="user-menu"]';
	private readonly logoutButton = '[data-testid="logout-button"]';
	private readonly projectsLink = '[data-testid="projects-link"]';
	private readonly agentsLink = '[data-testid="agents-link"]';
	private readonly settingsLink = '[data-testid="settings-link"]';
	private readonly newProjectButton = '[data-testid="new-project-button"]';
	private readonly projectsList = '[data-testid="projects-list"]';
	private readonly agentsList = '[data-testid="agents-list"]';
	private readonly searchInput = '[data-testid="search-input"]';
	private readonly notificationBell = '[data-testid="notification-bell"]';
	private readonly sidebar = '[data-testid="sidebar"]';
	private readonly mainContent = '[data-testid="main-content"]';
	private readonly breadcrumbs = '[data-testid="breadcrumbs"]';

	constructor(page: Page) {
		super(page, "/dashboard");
	}

	async logout(): Promise<void> {
		await this.clickElement(this.userMenu);
		await this.clickElement(this.logoutButton);
		await this.page.waitForURL("/login");
	}

	async navigateToProjects(): Promise<void> {
		await this.clickElement(this.projectsLink);
		await this.page.waitForURL("/projects");
	}

	async navigateToAgents(): Promise<void> {
		await this.clickElement(this.agentsLink);
		await this.page.waitForURL("/agents");
	}

	async navigateToSettings(): Promise<void> {
		await this.clickElement(this.settingsLink);
		await this.page.waitForURL("/settings");
	}

	async createNewProject(): Promise<void> {
		await this.clickElement(this.newProjectButton);
		await this.page.waitForURL("/projects/new");
	}

	async searchProjects(query: string): Promise<void> {
		await this.fillField(this.searchInput, query);
		await this.pressKey("Enter");
	}

	async getProjectCount(): Promise<number> {
		const projects = await this.page
			.locator('[data-testid="project-card"]')
			.all();
		return projects.length;
	}

	async getAgentCount(): Promise<number> {
		const agents = await this.page.locator('[data-testid="agent-card"]').all();
		return agents.length;
	}

	async getNotificationCount(): Promise<number> {
		const badge = await this.page.locator('[data-testid="notification-badge"]');
		if (await badge.isVisible()) {
			const count = await badge.textContent();
			return Number.parseInt(count || "0", 10);
		}
		return 0;
	}

	async openNotifications(): Promise<void> {
		await this.clickElement(this.notificationBell);
	}

	async expectDashboardVisible(): Promise<void> {
		await this.expectElementVisible(this.sidebar);
		await this.expectElementVisible(this.mainContent);
		await this.expectElementVisible(this.userMenu);
	}

	async expectUserMenuVisible(): Promise<void> {
		await this.expectElementVisible(this.userMenu);
	}

	async expectProjectsListVisible(): Promise<void> {
		await this.expectElementVisible(this.projectsList);
	}

	async expectAgentsListVisible(): Promise<void> {
		await this.expectElementVisible(this.agentsList);
	}

	async expectBreadcrumbsVisible(): Promise<void> {
		await this.expectElementVisible(this.breadcrumbs);
	}

	async expectSearchInputVisible(): Promise<void> {
		await this.expectElementVisible(this.searchInput);
	}

	async expectNewProjectButtonVisible(): Promise<void> {
		await this.expectElementVisible(this.newProjectButton);
	}

	async expectNewProjectButtonEnabled(): Promise<void> {
		await this.expectElementEnabled(this.newProjectButton);
	}

	async toggleSidebar(): Promise<void> {
		await this.clickElement('[data-testid="sidebar-toggle"]');
	}

	async isSidebarCollapsed(): Promise<boolean> {
		return (
			(await this.page
				.locator('[data-testid="sidebar"]')
				.getAttribute("data-collapsed")) === "true"
		);
	}

	async getCurrentPageTitle(): Promise<string> {
		return await this.getElementText('[data-testid="page-title"]');
	}

	async getBreadcrumbText(): Promise<string> {
		return await this.getElementText(this.breadcrumbs);
	}

	async waitForDashboardLoad(): Promise<void> {
		await this.waitForSelector(this.mainContent);
		await this.waitForSelector(this.userMenu);
		await this.waitForPageLoad();
	}
}
