import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./base-page";

export class DashboardPage extends BasePage {
	readonly page: Page;
	
	// Main dashboard layout
	readonly dashboardContainer: Locator;
	readonly headerSection: Locator;
	readonly sidebarSection: Locator;
	readonly mainContent: Locator;
	readonly footerSection: Locator;
	
	// Header elements
	readonly welcomeMessage: Locator;
	readonly userAvatar: Locator;
	readonly userDropdown: Locator;
	readonly notificationsBell: Locator;
	readonly notificationsBadge: Locator;
	readonly notificationsPanel: Locator;
	readonly searchBar: Locator;
	readonly searchResults: Locator;
	readonly globalSearch: Locator;
	readonly breadcrumbNav: Locator;
	
	// Sidebar navigation
	readonly sidebarToggle: Locator;
	readonly dashboardNavLink: Locator;
	readonly agentsNavLink: Locator;
	readonly projectsNavLink: Locator;
	readonly tasksNavLink: Locator;
	readonly settingsNavLink: Locator;
	readonly helpNavLink: Locator;
	readonly logoutNavLink: Locator;
	readonly sidebarCollapsed: Locator;
	readonly sidebarExpanded: Locator;
	
	// Dashboard overview section
	readonly overviewSection: Locator;
	readonly statsCards: Locator;
	readonly totalAgentsCard: Locator;
	readonly activeAgentsCard: Locator;
	readonly completedTasksCard: Locator;
	readonly runningTasksCard: Locator;
	readonly failedTasksCard: Locator;
	readonly systemStatusCard: Locator;
	readonly performanceCard: Locator;
	readonly usageCard: Locator;
	
	// Quick actions section
	readonly quickActionsSection: Locator;
	readonly createAgentButton: Locator;
	readonly createProjectButton: Locator;
	readonly runTaskButton: Locator;
	readonly importDataButton: Locator;
	readonly exportDataButton: Locator;
	readonly viewReportsButton: Locator;
	readonly systemHealthButton: Locator;
	readonly backupButton: Locator;
	
	// Recent activity section
	readonly recentActivitySection: Locator;
	readonly activityFeed: Locator;
	readonly activityItem: (index: number) => Locator;
	readonly activityTimestamp: (index: number) => Locator;
	readonly activityType: (index: number) => Locator;
	readonly activityDescription: (index: number) => Locator;
	readonly activityUser: (index: number) => Locator;
	readonly activityStatus: (index: number) => Locator;
	readonly viewAllActivitiesButton: Locator;
	readonly activityFilterDropdown: Locator;
	readonly activitySearch: Locator;
	
	// Active agents section
	readonly activeAgentsSection: Locator;
	readonly agentsList: Locator;
	readonly agentCard: (agentId: string) => Locator;
	readonly agentName: (agentId: string) => Locator;
	readonly agentStatus: (agentId: string) => Locator;
	readonly agentType: (agentId: string) => Locator;
	readonly agentTasks: (agentId: string) => Locator;
	readonly agentPerformance: (agentId: string) => Locator;
	readonly agentControls: (agentId: string) => Locator;
	readonly startAgentButton: (agentId: string) => Locator;
	readonly stopAgentButton: (agentId: string) => Locator;
	readonly restartAgentButton: (agentId: string) => Locator;
	readonly configureAgentButton: (agentId: string) => Locator;
	readonly deleteAgentButton: (agentId: string) => Locator;
	readonly viewAgentDetailsButton: (agentId: string) => Locator;
	
	// Running tasks section
	readonly runningTasksSection: Locator;
	readonly tasksList: Locator;
	readonly taskItem: (taskId: string) => Locator;
	readonly taskTitle: (taskId: string) => Locator;
	readonly taskStatus: (taskId: string) => Locator;
	readonly taskProgress: (taskId: string) => Locator;
	readonly taskAgent: (taskId: string) => Locator;
	readonly taskDuration: (taskId: string) => Locator;
	readonly taskPriority: (taskId: string) => Locator;
	readonly taskControls: (taskId: string) => Locator;
	readonly pauseTaskButton: (taskId: string) => Locator;
	readonly resumeTaskButton: (taskId: string) => Locator;
	readonly cancelTaskButton: (taskId: string) => Locator;
	readonly viewTaskDetailsButton: (taskId: string) => Locator;
	readonly taskProgressBar: (taskId: string) => Locator;
	
	// System monitoring section
	readonly systemMonitoringSection: Locator;
	readonly systemHealthIndicator: Locator;
	readonly cpuUsageChart: Locator;
	readonly memoryUsageChart: Locator;
	readonly diskUsageChart: Locator;
	readonly networkUsageChart: Locator;
	readonly errorRateChart: Locator;
	readonly responseTimeChart: Locator;
	readonly throughputChart: Locator;
	readonly systemAlertsPanel: Locator;
	readonly alertItem: (index: number) => Locator;
	readonly alertLevel: (index: number) => Locator;
	readonly alertMessage: (index: number) => Locator;
	readonly alertTimestamp: (index: number) => Locator;
	readonly dismissAlertButton: (index: number) => Locator;
	
	// Charts and analytics
	readonly analyticsSection: Locator;
	readonly performanceChart: Locator;
	readonly usageChart: Locator;
	readonly trendChart: Locator;
	readonly chartTimeRange: Locator;
	readonly chartFilters: Locator;
	readonly chartExportButton: Locator;
	readonly chartRefreshButton: Locator;
	readonly chartFullscreenButton: Locator;
	readonly chartDatePicker: Locator;
	readonly chartMetricSelector: Locator;
	
	// Widgets and customization
	readonly widgetsContainer: Locator;
	readonly widget: (widgetId: string) => Locator;
	readonly widgetHeader: (widgetId: string) => Locator;
	readonly widgetContent: (widgetId: string) => Locator;
	readonly widgetControls: (widgetId: string) => Locator;
	readonly widgetSettings: (widgetId: string) => Locator;
	readonly widgetMinimize: (widgetId: string) => Locator;
	readonly widgetMaximize: (widgetId: string) => Locator;
	readonly widgetClose: (widgetId: string) => Locator;
	readonly widgetRefresh: (widgetId: string) => Locator;
	readonly addWidgetButton: Locator;
	readonly widgetLibrary: Locator;
	readonly customizeLayoutButton: Locator;
	readonly resetLayoutButton: Locator;
	readonly saveLayoutButton: Locator;
	
	// Modals and dialogs
	readonly createAgentModal: Locator;
	readonly createProjectModal: Locator;
	readonly taskDetailsModal: Locator;
	readonly agentDetailsModal: Locator;
	readonly systemHealthModal: Locator;
	readonly confirmationModal: Locator;
	readonly errorModal: Locator;
	readonly successModal: Locator;
	readonly loadingModal: Locator;
	readonly modalCloseButton: Locator;
	readonly modalCancelButton: Locator;
	readonly modalConfirmButton: Locator;
	readonly modalOverlay: Locator;
	
	// Real-time updates
	readonly realTimeIndicator: Locator;
	readonly connectionStatus: Locator;
	readonly lastUpdated: Locator;
	readonly liveDataToggle: Locator;
	readonly refreshButton: Locator;
	readonly autoRefreshToggle: Locator;
	readonly refreshInterval: Locator;
	
	// Responsive elements
	readonly mobileMenuToggle: Locator;
	readonly mobileDrawer: Locator;
	readonly tabletView: Locator;
	readonly desktopView: Locator;
	readonly responsiveGrid: Locator;
	
	constructor(page: Page) {
		super(page);
		this.page = page;
		
		// Main dashboard layout
		this.dashboardContainer = page.locator('[data-testid="dashboard-container"]');
		this.headerSection = page.locator('[data-testid="dashboard-header"]');
		this.sidebarSection = page.locator('[data-testid="dashboard-sidebar"]');
		this.mainContent = page.locator('[data-testid="dashboard-main-content"]');
		this.footerSection = page.locator('[data-testid="dashboard-footer"]');
		
		// Header elements
		this.welcomeMessage = page.locator('[data-testid="welcome-message"]');
		this.userAvatar = page.locator('[data-testid="user-avatar"]');
		this.userDropdown = page.locator('[data-testid="user-dropdown"]');
		this.notificationsBell = page.locator('[data-testid="notifications-bell"]');
		this.notificationsBadge = page.locator('[data-testid="notifications-badge"]');
		this.notificationsPanel = page.locator('[data-testid="notifications-panel"]');
		this.searchBar = page.locator('[data-testid="search-bar"]');
		this.searchResults = page.locator('[data-testid="search-results"]');
		this.globalSearch = page.locator('[data-testid="global-search"]');
		this.breadcrumbNav = page.locator('[data-testid="breadcrumb-nav"]');
		
		// Sidebar navigation
		this.sidebarToggle = page.locator('[data-testid="sidebar-toggle"]');
		this.dashboardNavLink = page.locator('[data-testid="nav-dashboard"]');
		this.agentsNavLink = page.locator('[data-testid="nav-agents"]');
		this.projectsNavLink = page.locator('[data-testid="nav-projects"]');
		this.tasksNavLink = page.locator('[data-testid="nav-tasks"]');
		this.settingsNavLink = page.locator('[data-testid="nav-settings"]');
		this.helpNavLink = page.locator('[data-testid="nav-help"]');
		this.logoutNavLink = page.locator('[data-testid="nav-logout"]');
		this.sidebarCollapsed = page.locator('[data-testid="sidebar-collapsed"]');
		this.sidebarExpanded = page.locator('[data-testid="sidebar-expanded"]');
		
		// Dashboard overview section
		this.overviewSection = page.locator('[data-testid="overview-section"]');
		this.statsCards = page.locator('[data-testid="stats-cards"]');
		this.totalAgentsCard = page.locator('[data-testid="total-agents-card"]');
		this.activeAgentsCard = page.locator('[data-testid="active-agents-card"]');
		this.completedTasksCard = page.locator('[data-testid="completed-tasks-card"]');
		this.runningTasksCard = page.locator('[data-testid="running-tasks-card"]');
		this.failedTasksCard = page.locator('[data-testid="failed-tasks-card"]');
		this.systemStatusCard = page.locator('[data-testid="system-status-card"]');
		this.performanceCard = page.locator('[data-testid="performance-card"]');
		this.usageCard = page.locator('[data-testid="usage-card"]');
		
		// Quick actions section
		this.quickActionsSection = page.locator('[data-testid="quick-actions-section"]');
		this.createAgentButton = page.locator('[data-testid="create-agent-button"]');
		this.createProjectButton = page.locator('[data-testid="create-project-button"]');
		this.runTaskButton = page.locator('[data-testid="run-task-button"]');
		this.importDataButton = page.locator('[data-testid="import-data-button"]');
		this.exportDataButton = page.locator('[data-testid="export-data-button"]');
		this.viewReportsButton = page.locator('[data-testid="view-reports-button"]');
		this.systemHealthButton = page.locator('[data-testid="system-health-button"]');
		this.backupButton = page.locator('[data-testid="backup-button"]');
		
		// Recent activity section
		this.recentActivitySection = page.locator('[data-testid="recent-activity-section"]');
		this.activityFeed = page.locator('[data-testid="activity-feed"]');
		this.activityItem = (index: number) => page.locator(`[data-testid="activity-item-${index}"]`);
		this.activityTimestamp = (index: number) => page.locator(`[data-testid="activity-timestamp-${index}"]`);
		this.activityType = (index: number) => page.locator(`[data-testid="activity-type-${index}"]`);
		this.activityDescription = (index: number) => page.locator(`[data-testid="activity-description-${index}"]`);
		this.activityUser = (index: number) => page.locator(`[data-testid="activity-user-${index}"]`);
		this.activityStatus = (index: number) => page.locator(`[data-testid="activity-status-${index}"]`);
		this.viewAllActivitiesButton = page.locator('[data-testid="view-all-activities-button"]');
		this.activityFilterDropdown = page.locator('[data-testid="activity-filter-dropdown"]');
		this.activitySearch = page.locator('[data-testid="activity-search"]');
		
		// Active agents section
		this.activeAgentsSection = page.locator('[data-testid="active-agents-section"]');
		this.agentsList = page.locator('[data-testid="agents-list"]');
		this.agentCard = (agentId: string) => page.locator(`[data-testid="agent-card-${agentId}"]`);
		this.agentName = (agentId: string) => page.locator(`[data-testid="agent-name-${agentId}"]`);
		this.agentStatus = (agentId: string) => page.locator(`[data-testid="agent-status-${agentId}"]`);
		this.agentType = (agentId: string) => page.locator(`[data-testid="agent-type-${agentId}"]`);
		this.agentTasks = (agentId: string) => page.locator(`[data-testid="agent-tasks-${agentId}"]`);
		this.agentPerformance = (agentId: string) => page.locator(`[data-testid="agent-performance-${agentId}"]`);
		this.agentControls = (agentId: string) => page.locator(`[data-testid="agent-controls-${agentId}"]`);
		this.startAgentButton = (agentId: string) => page.locator(`[data-testid="start-agent-${agentId}"]`);
		this.stopAgentButton = (agentId: string) => page.locator(`[data-testid="stop-agent-${agentId}"]`);
		this.restartAgentButton = (agentId: string) => page.locator(`[data-testid="restart-agent-${agentId}"]`);
		this.configureAgentButton = (agentId: string) => page.locator(`[data-testid="configure-agent-${agentId}"]`);
		this.deleteAgentButton = (agentId: string) => page.locator(`[data-testid="delete-agent-${agentId}"]`);
		this.viewAgentDetailsButton = (agentId: string) => page.locator(`[data-testid="view-agent-details-${agentId}"]`);
		
		// Running tasks section
		this.runningTasksSection = page.locator('[data-testid="running-tasks-section"]');
		this.tasksList = page.locator('[data-testid="tasks-list"]');
		this.taskItem = (taskId: string) => page.locator(`[data-testid="task-item-${taskId}"]`);
		this.taskTitle = (taskId: string) => page.locator(`[data-testid="task-title-${taskId}"]`);
		this.taskStatus = (taskId: string) => page.locator(`[data-testid="task-status-${taskId}"]`);
		this.taskProgress = (taskId: string) => page.locator(`[data-testid="task-progress-${taskId}"]`);
		this.taskAgent = (taskId: string) => page.locator(`[data-testid="task-agent-${taskId}"]`);
		this.taskDuration = (taskId: string) => page.locator(`[data-testid="task-duration-${taskId}"]`);
		this.taskPriority = (taskId: string) => page.locator(`[data-testid="task-priority-${taskId}"]`);
		this.taskControls = (taskId: string) => page.locator(`[data-testid="task-controls-${taskId}"]`);
		this.pauseTaskButton = (taskId: string) => page.locator(`[data-testid="pause-task-${taskId}"]`);
		this.resumeTaskButton = (taskId: string) => page.locator(`[data-testid="resume-task-${taskId}"]`);
		this.cancelTaskButton = (taskId: string) => page.locator(`[data-testid="cancel-task-${taskId}"]`);
		this.viewTaskDetailsButton = (taskId: string) => page.locator(`[data-testid="view-task-details-${taskId}"]`);
		this.taskProgressBar = (taskId: string) => page.locator(`[data-testid="task-progress-bar-${taskId}"]`);
		
		// System monitoring section
		this.systemMonitoringSection = page.locator('[data-testid="system-monitoring-section"]');
		this.systemHealthIndicator = page.locator('[data-testid="system-health-indicator"]');
		this.cpuUsageChart = page.locator('[data-testid="cpu-usage-chart"]');
		this.memoryUsageChart = page.locator('[data-testid="memory-usage-chart"]');
		this.diskUsageChart = page.locator('[data-testid="disk-usage-chart"]');
		this.networkUsageChart = page.locator('[data-testid="network-usage-chart"]');
		this.errorRateChart = page.locator('[data-testid="error-rate-chart"]');
		this.responseTimeChart = page.locator('[data-testid="response-time-chart"]');
		this.throughputChart = page.locator('[data-testid="throughput-chart"]');
		this.systemAlertsPanel = page.locator('[data-testid="system-alerts-panel"]');
		this.alertItem = (index: number) => page.locator(`[data-testid="alert-item-${index}"]`);
		this.alertLevel = (index: number) => page.locator(`[data-testid="alert-level-${index}"]`);
		this.alertMessage = (index: number) => page.locator(`[data-testid="alert-message-${index}"]`);
		this.alertTimestamp = (index: number) => page.locator(`[data-testid="alert-timestamp-${index}"]`);
		this.dismissAlertButton = (index: number) => page.locator(`[data-testid="dismiss-alert-${index}"]`);
		
		// Charts and analytics
		this.analyticsSection = page.locator('[data-testid="analytics-section"]');
		this.performanceChart = page.locator('[data-testid="performance-chart"]');
		this.usageChart = page.locator('[data-testid="usage-chart"]');
		this.trendChart = page.locator('[data-testid="trend-chart"]');
		this.chartTimeRange = page.locator('[data-testid="chart-time-range"]');
		this.chartFilters = page.locator('[data-testid="chart-filters"]');
		this.chartExportButton = page.locator('[data-testid="chart-export-button"]');
		this.chartRefreshButton = page.locator('[data-testid="chart-refresh-button"]');
		this.chartFullscreenButton = page.locator('[data-testid="chart-fullscreen-button"]');
		this.chartDatePicker = page.locator('[data-testid="chart-date-picker"]');
		this.chartMetricSelector = page.locator('[data-testid="chart-metric-selector"]');
		
		// Widgets and customization
		this.widgetsContainer = page.locator('[data-testid="widgets-container"]');
		this.widget = (widgetId: string) => page.locator(`[data-testid="widget-${widgetId}"]`);
		this.widgetHeader = (widgetId: string) => page.locator(`[data-testid="widget-header-${widgetId}"]`);
		this.widgetContent = (widgetId: string) => page.locator(`[data-testid="widget-content-${widgetId}"]`);
		this.widgetControls = (widgetId: string) => page.locator(`[data-testid="widget-controls-${widgetId}"]`);
		this.widgetSettings = (widgetId: string) => page.locator(`[data-testid="widget-settings-${widgetId}"]`);
		this.widgetMinimize = (widgetId: string) => page.locator(`[data-testid="widget-minimize-${widgetId}"]`);
		this.widgetMaximize = (widgetId: string) => page.locator(`[data-testid="widget-maximize-${widgetId}"]`);
		this.widgetClose = (widgetId: string) => page.locator(`[data-testid="widget-close-${widgetId}"]`);
		this.widgetRefresh = (widgetId: string) => page.locator(`[data-testid="widget-refresh-${widgetId}"]`);
		this.addWidgetButton = page.locator('[data-testid="add-widget-button"]');
		this.widgetLibrary = page.locator('[data-testid="widget-library"]');
		this.customizeLayoutButton = page.locator('[data-testid="customize-layout-button"]');
		this.resetLayoutButton = page.locator('[data-testid="reset-layout-button"]');
		this.saveLayoutButton = page.locator('[data-testid="save-layout-button"]');
		
		// Modals and dialogs
		this.createAgentModal = page.locator('[data-testid="create-agent-modal"]');
		this.createProjectModal = page.locator('[data-testid="create-project-modal"]');
		this.taskDetailsModal = page.locator('[data-testid="task-details-modal"]');
		this.agentDetailsModal = page.locator('[data-testid="agent-details-modal"]');
		this.systemHealthModal = page.locator('[data-testid="system-health-modal"]');
		this.confirmationModal = page.locator('[data-testid="confirmation-modal"]');
		this.errorModal = page.locator('[data-testid="error-modal"]');
		this.successModal = page.locator('[data-testid="success-modal"]');
		this.loadingModal = page.locator('[data-testid="loading-modal"]');
		this.modalCloseButton = page.locator('[data-testid="modal-close-button"]');
		this.modalCancelButton = page.locator('[data-testid="modal-cancel-button"]');
		this.modalConfirmButton = page.locator('[data-testid="modal-confirm-button"]');
		this.modalOverlay = page.locator('[data-testid="modal-overlay"]');
		
		// Real-time updates
		this.realTimeIndicator = page.locator('[data-testid="real-time-indicator"]');
		this.connectionStatus = page.locator('[data-testid="connection-status"]');
		this.lastUpdated = page.locator('[data-testid="last-updated"]');
		this.liveDataToggle = page.locator('[data-testid="live-data-toggle"]');
		this.refreshButton = page.locator('[data-testid="refresh-button"]');
		this.autoRefreshToggle = page.locator('[data-testid="auto-refresh-toggle"]');
		this.refreshInterval = page.locator('[data-testid="refresh-interval"]');
		
		// Responsive elements
		this.mobileMenuToggle = page.locator('[data-testid="mobile-menu-toggle"]');
		this.mobileDrawer = page.locator('[data-testid="mobile-drawer"]');
		this.tabletView = page.locator('[data-testid="tablet-view"]');
		this.desktopView = page.locator('[data-testid="desktop-view"]');
		this.responsiveGrid = page.locator('[data-testid="responsive-grid"]');
	}
	
	// Navigation methods
	async navigateTo(): Promise<void> {
		await this.page.goto('/dashboard');
		await this.waitForLoadComplete();
	}
	
	async navigateToSection(section: 'agents' | 'projects' | 'tasks' | 'settings' | 'help'): Promise<void> {
		const linkMap = {
			agents: this.agentsNavLink,
			projects: this.projectsNavLink,
			tasks: this.tasksNavLink,
			settings: this.settingsNavLink,
			help: this.helpNavLink
		};
		
		await linkMap[section].click();
		await this.waitForLoadComplete();
	}
	
	async toggleSidebar(): Promise<void> {
		await this.sidebarToggle.click();
		await this.page.waitForTimeout(300); // Wait for animation
	}
	
	async openUserDropdown(): Promise<void> {
		await this.userAvatar.click();
		await expect(this.userDropdown).toBeVisible();
	}
	
	async openNotifications(): Promise<void> {
		await this.notificationsBell.click();
		await expect(this.notificationsPanel).toBeVisible();
	}
	
	async performGlobalSearch(query: string): Promise<void> {
		await this.searchBar.fill(query);
		await this.searchBar.press('Enter');
		await expect(this.searchResults).toBeVisible();
	}
	
	// Dashboard overview methods
	async getStatsCardValue(card: 'totalAgents' | 'activeAgents' | 'completedTasks' | 'runningTasks' | 'failedTasks'): Promise<string> {
		const cardMap = {
			totalAgents: this.totalAgentsCard,
			activeAgents: this.activeAgentsCard,
			completedTasks: this.completedTasksCard,
			runningTasks: this.runningTasksCard,
			failedTasks: this.failedTasksCard
		};
		
		const valueElement = cardMap[card].locator('[data-testid="card-value"]');
		return await valueElement.textContent() || '0';
	}
	
	async waitForStatsUpdate(): Promise<void> {
		await this.page.waitForFunction(() => {
			const indicator = document.querySelector('[data-testid="real-time-indicator"]');
			return indicator && indicator.textContent?.includes('Updated');
		});
	}
	
	// Quick actions methods
	async createNewAgent(): Promise<void> {
		await this.createAgentButton.click();
		await expect(this.createAgentModal).toBeVisible();
	}
	
	async createNewProject(): Promise<void> {
		await this.createProjectButton.click();
		await expect(this.createProjectModal).toBeVisible();
	}
	
	async runNewTask(): Promise<void> {
		await this.runTaskButton.click();
		await this.waitForLoadComplete();
	}
	
	async exportData(): Promise<void> {
		await this.exportDataButton.click();
		await this.waitForLoadComplete();
	}
	
	async viewSystemHealth(): Promise<void> {
		await this.systemHealthButton.click();
		await expect(this.systemHealthModal).toBeVisible();
	}
	
	// Agent management methods
	async getAgentStatus(agentId: string): Promise<string> {
		const statusElement = this.agentStatus(agentId);
		return await statusElement.textContent() || 'unknown';
	}
	
	async startAgent(agentId: string): Promise<void> {
		await this.startAgentButton(agentId).click();
		await this.waitForAgentStatusChange(agentId, 'running');
	}
	
	async stopAgent(agentId: string): Promise<void> {
		await this.stopAgentButton(agentId).click();
		await this.waitForAgentStatusChange(agentId, 'stopped');
	}
	
	async restartAgent(agentId: string): Promise<void> {
		await this.restartAgentButton(agentId).click();
		await this.waitForAgentStatusChange(agentId, 'running');
	}
	
	async configureAgent(agentId: string): Promise<void> {
		await this.configureAgentButton(agentId).click();
		await this.waitForLoadComplete();
	}
	
	async deleteAgent(agentId: string): Promise<void> {
		await this.deleteAgentButton(agentId).click();
		await expect(this.confirmationModal).toBeVisible();
		await this.modalConfirmButton.click();
		await this.waitForLoadComplete();
	}
	
	async viewAgentDetails(agentId: string): Promise<void> {
		await this.viewAgentDetailsButton(agentId).click();
		await expect(this.agentDetailsModal).toBeVisible();
	}
	
	private async waitForAgentStatusChange(agentId: string, expectedStatus: string): Promise<void> {
		await this.page.waitForFunction(
			({ agentId, expectedStatus }) => {
				const statusElement = document.querySelector(`[data-testid="agent-status-${agentId}"]`);
				return statusElement && statusElement.textContent?.toLowerCase().includes(expectedStatus);
			},
			{ agentId, expectedStatus },
			{ timeout: 10000 }
		);
	}
	
	// Task management methods
	async getTaskStatus(taskId: string): Promise<string> {
		const statusElement = this.taskStatus(taskId);
		return await statusElement.textContent() || 'unknown';
	}
	
	async getTaskProgress(taskId: string): Promise<number> {
		const progressElement = this.taskProgress(taskId);
		const progressText = await progressElement.textContent();
		return parseInt(progressText?.replace('%', '') || '0');
	}
	
	async pauseTask(taskId: string): Promise<void> {
		await this.pauseTaskButton(taskId).click();
		await this.waitForTaskStatusChange(taskId, 'paused');
	}
	
	async resumeTask(taskId: string): Promise<void> {
		await this.resumeTaskButton(taskId).click();
		await this.waitForTaskStatusChange(taskId, 'running');
	}
	
	async cancelTask(taskId: string): Promise<void> {
		await this.cancelTaskButton(taskId).click();
		await expect(this.confirmationModal).toBeVisible();
		await this.modalConfirmButton.click();
		await this.waitForTaskStatusChange(taskId, 'cancelled');
	}
	
	async viewTaskDetails(taskId: string): Promise<void> {
		await this.viewTaskDetailsButton(taskId).click();
		await expect(this.taskDetailsModal).toBeVisible();
	}
	
	private async waitForTaskStatusChange(taskId: string, expectedStatus: string): Promise<void> {
		await this.page.waitForFunction(
			({ taskId, expectedStatus }) => {
				const statusElement = document.querySelector(`[data-testid="task-status-${taskId}"]`);
				return statusElement && statusElement.textContent?.toLowerCase().includes(expectedStatus);
			},
			{ taskId, expectedStatus },
			{ timeout: 10000 }
		);
	}
	
	// Activity feed methods
	async getActivityCount(): Promise<number> {
		const activities = await this.activityFeed.locator('[data-testid^="activity-item-"]').count();
		return activities;
	}
	
	async getActivityDetails(index: number): Promise<{
		timestamp: string;
		type: string;
		description: string;
		user: string;
		status: string;
	}> {
		return {
			timestamp: await this.activityTimestamp(index).textContent() || '',
			type: await this.activityType(index).textContent() || '',
			description: await this.activityDescription(index).textContent() || '',
			user: await this.activityUser(index).textContent() || '',
			status: await this.activityStatus(index).textContent() || ''
		};
	}
	
	async filterActivity(filter: string): Promise<void> {
		await this.activityFilterDropdown.click();
		await this.page.locator(`[data-testid="filter-${filter}"]`).click();
		await this.waitForLoadComplete();
	}
	
	async searchActivity(query: string): Promise<void> {
		await this.activitySearch.fill(query);
		await this.activitySearch.press('Enter');
		await this.waitForLoadComplete();
	}
	
	async viewAllActivities(): Promise<void> {
		await this.viewAllActivitiesButton.click();
		await this.waitForLoadComplete();
	}
	
	// System monitoring methods
	async getSystemHealthStatus(): Promise<string> {
		const healthText = await this.systemHealthIndicator.textContent();
		return healthText || 'unknown';
	}
	
	async getSystemMetrics(): Promise<{
		cpu: string;
		memory: string;
		disk: string;
		network: string;
	}> {
		const cpuText = await this.cpuUsageChart.getAttribute('data-value');
		const memoryText = await this.memoryUsageChart.getAttribute('data-value');
		const diskText = await this.diskUsageChart.getAttribute('data-value');
		const networkText = await this.networkUsageChart.getAttribute('data-value');
		
		return {
			cpu: cpuText || '0',
			memory: memoryText || '0',
			disk: diskText || '0',
			network: networkText || '0'
		};
	}
	
	async getAlertsCount(): Promise<number> {
		const alerts = await this.systemAlertsPanel.locator('[data-testid^="alert-item-"]').count();
		return alerts;
	}
	
	async dismissAlert(index: number): Promise<void> {
		await this.dismissAlertButton(index).click();
		await this.waitForLoadComplete();
	}
	
	// Charts and analytics methods
	async switchChartTimeRange(range: '1h' | '24h' | '7d' | '30d'): Promise<void> {
		await this.chartTimeRange.click();
		await this.page.locator(`[data-testid="time-range-${range}"]`).click();
		await this.waitForLoadComplete();
	}
	
	async exportChart(): Promise<void> {
		await this.chartExportButton.click();
		await this.waitForLoadComplete();
	}
	
	async refreshChart(): Promise<void> {
		await this.chartRefreshButton.click();
		await this.waitForLoadComplete();
	}
	
	async toggleChartFullscreen(): Promise<void> {
		await this.chartFullscreenButton.click();
		await this.page.waitForTimeout(300);
	}
	
	// Widget management methods
	async addWidget(widgetType: string): Promise<void> {
		await this.addWidgetButton.click();
		await expect(this.widgetLibrary).toBeVisible();
		await this.page.locator(`[data-testid="widget-type-${widgetType}"]`).click();
		await this.waitForLoadComplete();
	}
	
	async configureWidget(widgetId: string): Promise<void> {
		await this.widgetSettings(widgetId).click();
		await this.waitForLoadComplete();
	}
	
	async minimizeWidget(widgetId: string): Promise<void> {
		await this.widgetMinimize(widgetId).click();
		await this.page.waitForTimeout(300);
	}
	
	async maximizeWidget(widgetId: string): Promise<void> {
		await this.widgetMaximize(widgetId).click();
		await this.page.waitForTimeout(300);
	}
	
	async closeWidget(widgetId: string): Promise<void> {
		await this.widgetClose(widgetId).click();
		await this.page.waitForTimeout(300);
	}
	
	async refreshWidget(widgetId: string): Promise<void> {
		await this.widgetRefresh(widgetId).click();
		await this.waitForLoadComplete();
	}
	
	async customizeLayout(): Promise<void> {
		await this.customizeLayoutButton.click();
		await this.waitForLoadComplete();
	}
	
	async resetLayout(): Promise<void> {
		await this.resetLayoutButton.click();
		await expect(this.confirmationModal).toBeVisible();
		await this.modalConfirmButton.click();
		await this.waitForLoadComplete();
	}
	
	async saveLayout(): Promise<void> {
		await this.saveLayoutButton.click();
		await this.waitForLoadComplete();
	}
	
	// Real-time updates methods
	async toggleLiveData(): Promise<void> {
		await this.liveDataToggle.click();
		await this.page.waitForTimeout(300);
	}
	
	async refreshData(): Promise<void> {
		await this.refreshButton.click();
		await this.waitForLoadComplete();
	}
	
	async toggleAutoRefresh(): Promise<void> {
		await this.autoRefreshToggle.click();
		await this.page.waitForTimeout(300);
	}
	
	async setRefreshInterval(interval: '5s' | '10s' | '30s' | '1m' | '5m'): Promise<void> {
		await this.refreshInterval.click();
		await this.page.locator(`[data-testid="interval-${interval}"]`).click();
		await this.waitForLoadComplete();
	}
	
	// Modal management methods
	async closeModal(): Promise<void> {
		await this.modalCloseButton.click();
		await this.page.waitForTimeout(300);
	}
	
	async cancelModalAction(): Promise<void> {
		await this.modalCancelButton.click();
		await this.page.waitForTimeout(300);
	}
	
	async confirmModalAction(): Promise<void> {
		await this.modalConfirmButton.click();
		await this.waitForLoadComplete();
	}
	
	// Responsive design methods
	async toggleMobileMenu(): Promise<void> {
		await this.mobileMenuToggle.click();
		await expect(this.mobileDrawer).toBeVisible();
	}
	
	async waitForResponsiveLayout(): Promise<void> {
		await this.page.waitForFunction(() => {
			const grid = document.querySelector('[data-testid="responsive-grid"]');
			return grid && grid.offsetWidth > 0;
		});
	}
	
	// Utility methods
	async waitForLoadComplete(): Promise<void> {
		await this.page.waitForLoadState('networkidle');
		await this.page.waitForFunction(() => {
			const loadingElements = document.querySelectorAll('[data-testid*="loading"]');
			return loadingElements.length === 0;
		});
	}
	
	async waitForDataRefresh(): Promise<void> {
		await this.page.waitForFunction(() => {
			const timestamp = document.querySelector('[data-testid="last-updated"]');
			return timestamp && timestamp.textContent?.includes('Just now');
		});
	}
	
	async validateDashboardState(): Promise<void> {
		await expect(this.dashboardContainer).toBeVisible();
		await expect(this.headerSection).toBeVisible();
		await expect(this.sidebarSection).toBeVisible();
		await expect(this.mainContent).toBeVisible();
		await expect(this.overviewSection).toBeVisible();
	}
	
	async logout(): Promise<void> {
		await this.openUserDropdown();
		await this.logoutNavLink.click();
		await this.page.waitForURL('**/login');
	}
}