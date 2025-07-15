import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./base-page";

export class ProjectsPage extends BasePage {
	readonly page: Page;
	
	// Main projects layout
	readonly projectsContainer: Locator;
	readonly headerSection: Locator;
	readonly sidebarSection: Locator;
	readonly mainContent: Locator;
	readonly footerSection: Locator;
	
	// Page header
	readonly pageTitle: Locator;
	readonly pageDescription: Locator;
	readonly breadcrumbNav: Locator;
	readonly headerActions: Locator;
	readonly createProjectButton: Locator;
	readonly importProjectButton: Locator;
	readonly exportProjectsButton: Locator;
	readonly bulkActionsButton: Locator;
	readonly searchProjects: Locator;
	readonly filterDropdown: Locator;
	readonly sortDropdown: Locator;
	readonly viewToggle: Locator;
	readonly refreshButton: Locator;
	
	// Project filters and controls
	readonly filtersSection: Locator;
	readonly statusFilter: Locator;
	readonly typeFilter: Locator;
	readonly ownerFilter: Locator;
	readonly dateFilter: Locator;
	readonly tagsFilter: Locator;
	readonly activeFilter: Locator;
	readonly clearFiltersButton: Locator;
	readonly saveFiltersButton: Locator;
	readonly filterPresets: Locator;
	readonly advancedFilters: Locator;
	readonly quickFilters: Locator;
	
	// Project listing view
	readonly projectsList: Locator;
	readonly projectsGrid: Locator;
	readonly projectsTable: Locator;
	readonly listViewButton: Locator;
	readonly gridViewButton: Locator;
	readonly tableViewButton: Locator;
	readonly itemsPerPageSelect: Locator;
	readonly paginationControls: Locator;
	readonly prevPageButton: Locator;
	readonly nextPageButton: Locator;
	readonly pageNumbers: Locator;
	readonly totalCount: Locator;
	
	// Project card/item elements
	readonly projectCard: (projectId: string) => Locator;
	readonly projectTitle: (projectId: string) => Locator;
	readonly projectDescription: (projectId: string) => Locator;
	readonly projectStatus: (projectId: string) => Locator;
	readonly projectType: (projectId: string) => Locator;
	readonly projectOwner: (projectId: string) => Locator;
	readonly projectTags: (projectId: string) => Locator;
	readonly projectCreatedDate: (projectId: string) => Locator;
	readonly projectUpdatedDate: (projectId: string) => Locator;
	readonly projectProgress: (projectId: string) => Locator;
	readonly projectStats: (projectId: string) => Locator;
	readonly projectThumbnail: (projectId: string) => Locator;
	readonly projectFavorite: (projectId: string) => Locator;
	readonly projectArchived: (projectId: string) => Locator;
	
	// Project actions
	readonly projectActions: (projectId: string) => Locator;
	readonly projectActionMenu: (projectId: string) => Locator;
	readonly viewProjectButton: (projectId: string) => Locator;
	readonly editProjectButton: (projectId: string) => Locator;
	readonly duplicateProjectButton: (projectId: string) => Locator;
	readonly archiveProjectButton: (projectId: string) => Locator;
	readonly deleteProjectButton: (projectId: string) => Locator;
	readonly shareProjectButton: (projectId: string) => Locator;
	readonly exportProjectButton: (projectId: string) => Locator;
	readonly favoriteProjectButton: (projectId: string) => Locator;
	readonly projectSettingsButton: (projectId: string) => Locator;
	readonly projectHistoryButton: (projectId: string) => Locator;
	
	// Project details panel
	readonly projectDetailsPanel: Locator;
	readonly detailsPanelHeader: Locator;
	readonly detailsPanelContent: Locator;
	readonly detailsPanelFooter: Locator;
	readonly closePanelButton: Locator;
	readonly projectDetailsTabs: Locator;
	readonly overviewTab: Locator;
	readonly agentsTab: Locator;
	readonly tasksTab: Locator;
	readonly filesTab: Locator;
	readonly settingsTab: Locator;
	readonly historyTab: Locator;
	readonly collaboratorsTab: Locator;
	readonly analyticsTab: Locator;
	
	// Project creation modal
	readonly createProjectModal: Locator;
	readonly createModalHeader: Locator;
	readonly createModalContent: Locator;
	readonly createModalFooter: Locator;
	readonly projectNameInput: Locator;
	readonly projectDescriptionInput: Locator;
	readonly projectTypeSelect: Locator;
	readonly projectTemplateSelect: Locator;
	readonly projectVisibilitySelect: Locator;
	readonly projectTagsInput: Locator;
	readonly projectOwnerSelect: Locator;
	readonly projectDeadlineInput: Locator;
	readonly projectBudgetInput: Locator;
	readonly projectPrioritySelect: Locator;
	readonly createProjectSubmitButton: Locator;
	readonly createProjectCancelButton: Locator;
	readonly createProjectResetButton: Locator;
	
	// Project templates
	readonly templatesSection: Locator;
	readonly templatesList: Locator;
	readonly templateCard: (templateId: string) => Locator;
	readonly templateTitle: (templateId: string) => Locator;
	readonly templateDescription: (templateId: string) => Locator;
	readonly templatePreview: (templateId: string) => Locator;
	readonly useTemplateButton: (templateId: string) => Locator;
	readonly customTemplateButton: Locator;
	readonly importTemplateButton: Locator;
	readonly manageTemplatesButton: Locator;
	
	// Bulk operations
	readonly bulkOperationsPanel: Locator;
	readonly selectAllCheckbox: Locator;
	readonly selectedItemsCount: Locator;
	readonly bulkDeleteButton: Locator;
	readonly bulkArchiveButton: Locator;
	readonly bulkExportButton: Locator;
	readonly bulkShareButton: Locator;
	readonly bulkTagsButton: Locator;
	readonly bulkMoveButton: Locator;
	readonly bulkCancelButton: Locator;
	readonly projectCheckbox: (projectId: string) => Locator;
	
	// Project import/export
	readonly importModal: Locator;
	readonly importFileInput: Locator;
	readonly importFormatSelect: Locator;
	readonly importOptionsPanel: Locator;
	readonly importPreviewPanel: Locator;
	readonly importSubmitButton: Locator;
	readonly importCancelButton: Locator;
	readonly exportModal: Locator;
	readonly exportFormatSelect: Locator;
	readonly exportOptionsPanel: Locator;
	readonly exportPreviewPanel: Locator;
	readonly exportSubmitButton: Locator;
	readonly exportCancelButton: Locator;
	
	// Project sharing
	readonly shareModal: Locator;
	readonly shareLink: Locator;
	readonly copyLinkButton: Locator;
	readonly shareEmailInput: Locator;
	readonly sharePermissionsSelect: Locator;
	readonly shareMessageInput: Locator;
	readonly sendShareButton: Locator;
	readonly shareHistoryPanel: Locator;
	readonly revokeShareButton: Locator;
	readonly shareSettingsButton: Locator;
	
	// Project analytics
	readonly analyticsPanel: Locator;
	readonly analyticsCharts: Locator;
	readonly projectMetrics: Locator;
	readonly taskCompletionChart: Locator;
	readonly agentPerformanceChart: Locator;
	readonly timelineChart: Locator;
	readonly budgetChart: Locator;
	readonly collaborationChart: Locator;
	readonly metricsCards: Locator;
	readonly analyticsFilters: Locator;
	readonly analyticsExportButton: Locator;
	
	// Project collaboration
	readonly collaboratorsPanel: Locator;
	readonly collaboratorsList: Locator;
	readonly collaboratorCard: (userId: string) => Locator;
	readonly collaboratorAvatar: (userId: string) => Locator;
	readonly collaboratorName: (userId: string) => Locator;
	readonly collaboratorRole: (userId: string) => Locator;
	readonly collaboratorStatus: (userId: string) => Locator;
	readonly collaboratorActions: (userId: string) => Locator;
	readonly inviteCollaboratorButton: Locator;
	readonly managePermissionsButton: Locator;
	readonly collaboratorSettingsButton: Locator;
	
	// Project history
	readonly historyPanel: Locator;
	readonly historyTimeline: Locator;
	readonly historyItem: (index: number) => Locator;
	readonly historyTimestamp: (index: number) => Locator;
	readonly historyUser: (index: number) => Locator;
	readonly historyAction: (index: number) => Locator;
	readonly historyDetails: (index: number) => Locator;
	readonly historyFilter: Locator;
	readonly historySearch: Locator;
	readonly historyExportButton: Locator;
	
	// Project settings
	readonly settingsPanel: Locator;
	readonly generalSettings: Locator;
	readonly accessSettings: Locator;
	readonly integrationSettings: Locator;
	readonly notificationSettings: Locator;
	readonly advancedSettings: Locator;
	readonly dangerZoneSettings: Locator;
	readonly saveSettingsButton: Locator;
	readonly resetSettingsButton: Locator;
	readonly settingsApplyButton: Locator;
	
	// Loading and error states
	readonly loadingSpinner: Locator;
	readonly loadingOverlay: Locator;
	readonly errorMessage: Locator;
	readonly errorRetryButton: Locator;
	readonly emptyState: Locator;
	readonly emptyStateMessage: Locator;
	readonly emptyStateAction: Locator;
	readonly noResultsMessage: Locator;
	readonly networkErrorMessage: Locator;
	
	// Notifications and alerts
	readonly notificationToast: Locator;
	readonly successMessage: Locator;
	readonly errorAlert: Locator;
	readonly warningAlert: Locator;
	readonly infoAlert: Locator;
	readonly alertCloseButton: Locator;
	readonly confirmationDialog: Locator;
	readonly confirmButton: Locator;
	readonly cancelButton: Locator;
	
	// Responsive elements
	readonly mobileMenu: Locator;
	readonly mobileMenuToggle: Locator;
	readonly mobileFilters: Locator;
	readonly mobileSearch: Locator;
	readonly mobileActions: Locator;
	readonly tabletView: Locator;
	readonly desktopView: Locator;
	readonly responsiveGrid: Locator;
	
	constructor(page: Page) {
		super(page);
		this.page = page;
		
		// Main projects layout
		this.projectsContainer = page.locator('[data-testid="projects-container"]');
		this.headerSection = page.locator('[data-testid="projects-header"]');
		this.sidebarSection = page.locator('[data-testid="projects-sidebar"]');
		this.mainContent = page.locator('[data-testid="projects-main-content"]');
		this.footerSection = page.locator('[data-testid="projects-footer"]');
		
		// Page header
		this.pageTitle = page.locator('[data-testid="projects-page-title"]');
		this.pageDescription = page.locator('[data-testid="projects-page-description"]');
		this.breadcrumbNav = page.locator('[data-testid="projects-breadcrumb"]');
		this.headerActions = page.locator('[data-testid="projects-header-actions"]');
		this.createProjectButton = page.locator('[data-testid="create-project-button"]');
		this.importProjectButton = page.locator('[data-testid="import-project-button"]');
		this.exportProjectsButton = page.locator('[data-testid="export-projects-button"]');
		this.bulkActionsButton = page.locator('[data-testid="bulk-actions-button"]');
		this.searchProjects = page.locator('[data-testid="search-projects"]');
		this.filterDropdown = page.locator('[data-testid="filter-dropdown"]');
		this.sortDropdown = page.locator('[data-testid="sort-dropdown"]');
		this.viewToggle = page.locator('[data-testid="view-toggle"]');
		this.refreshButton = page.locator('[data-testid="refresh-button"]');
		
		// Project filters and controls
		this.filtersSection = page.locator('[data-testid="projects-filters"]');
		this.statusFilter = page.locator('[data-testid="status-filter"]');
		this.typeFilter = page.locator('[data-testid="type-filter"]');
		this.ownerFilter = page.locator('[data-testid="owner-filter"]');
		this.dateFilter = page.locator('[data-testid="date-filter"]');
		this.tagsFilter = page.locator('[data-testid="tags-filter"]');
		this.activeFilter = page.locator('[data-testid="active-filter"]');
		this.clearFiltersButton = page.locator('[data-testid="clear-filters-button"]');
		this.saveFiltersButton = page.locator('[data-testid="save-filters-button"]');
		this.filterPresets = page.locator('[data-testid="filter-presets"]');
		this.advancedFilters = page.locator('[data-testid="advanced-filters"]');
		this.quickFilters = page.locator('[data-testid="quick-filters"]');
		
		// Project listing view
		this.projectsList = page.locator('[data-testid="projects-list"]');
		this.projectsGrid = page.locator('[data-testid="projects-grid"]');
		this.projectsTable = page.locator('[data-testid="projects-table"]');
		this.listViewButton = page.locator('[data-testid="list-view-button"]');
		this.gridViewButton = page.locator('[data-testid="grid-view-button"]');
		this.tableViewButton = page.locator('[data-testid="table-view-button"]');
		this.itemsPerPageSelect = page.locator('[data-testid="items-per-page-select"]');
		this.paginationControls = page.locator('[data-testid="pagination-controls"]');
		this.prevPageButton = page.locator('[data-testid="prev-page-button"]');
		this.nextPageButton = page.locator('[data-testid="next-page-button"]');
		this.pageNumbers = page.locator('[data-testid="page-numbers"]');
		this.totalCount = page.locator('[data-testid="total-count"]');
		
		// Project card/item elements
		this.projectCard = (projectId: string) => page.locator(`[data-testid="project-card-${projectId}"]`);
		this.projectTitle = (projectId: string) => page.locator(`[data-testid="project-title-${projectId}"]`);
		this.projectDescription = (projectId: string) => page.locator(`[data-testid="project-description-${projectId}"]`);
		this.projectStatus = (projectId: string) => page.locator(`[data-testid="project-status-${projectId}"]`);
		this.projectType = (projectId: string) => page.locator(`[data-testid="project-type-${projectId}"]`);
		this.projectOwner = (projectId: string) => page.locator(`[data-testid="project-owner-${projectId}"]`);
		this.projectTags = (projectId: string) => page.locator(`[data-testid="project-tags-${projectId}"]`);
		this.projectCreatedDate = (projectId: string) => page.locator(`[data-testid="project-created-date-${projectId}"]`);
		this.projectUpdatedDate = (projectId: string) => page.locator(`[data-testid="project-updated-date-${projectId}"]`);
		this.projectProgress = (projectId: string) => page.locator(`[data-testid="project-progress-${projectId}"]`);
		this.projectStats = (projectId: string) => page.locator(`[data-testid="project-stats-${projectId}"]`);
		this.projectThumbnail = (projectId: string) => page.locator(`[data-testid="project-thumbnail-${projectId}"]`);
		this.projectFavorite = (projectId: string) => page.locator(`[data-testid="project-favorite-${projectId}"]`);
		this.projectArchived = (projectId: string) => page.locator(`[data-testid="project-archived-${projectId}"]`);
		
		// Project actions
		this.projectActions = (projectId: string) => page.locator(`[data-testid="project-actions-${projectId}"]`);
		this.projectActionMenu = (projectId: string) => page.locator(`[data-testid="project-action-menu-${projectId}"]`);
		this.viewProjectButton = (projectId: string) => page.locator(`[data-testid="view-project-${projectId}"]`);
		this.editProjectButton = (projectId: string) => page.locator(`[data-testid="edit-project-${projectId}"]`);
		this.duplicateProjectButton = (projectId: string) => page.locator(`[data-testid="duplicate-project-${projectId}"]`);
		this.archiveProjectButton = (projectId: string) => page.locator(`[data-testid="archive-project-${projectId}"]`);
		this.deleteProjectButton = (projectId: string) => page.locator(`[data-testid="delete-project-${projectId}"]`);
		this.shareProjectButton = (projectId: string) => page.locator(`[data-testid="share-project-${projectId}"]`);
		this.exportProjectButton = (projectId: string) => page.locator(`[data-testid="export-project-${projectId}"]`);
		this.favoriteProjectButton = (projectId: string) => page.locator(`[data-testid="favorite-project-${projectId}"]`);
		this.projectSettingsButton = (projectId: string) => page.locator(`[data-testid="project-settings-${projectId}"]`);
		this.projectHistoryButton = (projectId: string) => page.locator(`[data-testid="project-history-${projectId}"]`);
		
		// Project details panel
		this.projectDetailsPanel = page.locator('[data-testid="project-details-panel"]');
		this.detailsPanelHeader = page.locator('[data-testid="details-panel-header"]');
		this.detailsPanelContent = page.locator('[data-testid="details-panel-content"]');
		this.detailsPanelFooter = page.locator('[data-testid="details-panel-footer"]');
		this.closePanelButton = page.locator('[data-testid="close-panel-button"]');
		this.projectDetailsTabs = page.locator('[data-testid="project-details-tabs"]');
		this.overviewTab = page.locator('[data-testid="overview-tab"]');
		this.agentsTab = page.locator('[data-testid="agents-tab"]');
		this.tasksTab = page.locator('[data-testid="tasks-tab"]');
		this.filesTab = page.locator('[data-testid="files-tab"]');
		this.settingsTab = page.locator('[data-testid="settings-tab"]');
		this.historyTab = page.locator('[data-testid="history-tab"]');
		this.collaboratorsTab = page.locator('[data-testid="collaborators-tab"]');
		this.analyticsTab = page.locator('[data-testid="analytics-tab"]');
		
		// Project creation modal
		this.createProjectModal = page.locator('[data-testid="create-project-modal"]');
		this.createModalHeader = page.locator('[data-testid="create-modal-header"]');
		this.createModalContent = page.locator('[data-testid="create-modal-content"]');
		this.createModalFooter = page.locator('[data-testid="create-modal-footer"]');
		this.projectNameInput = page.locator('[data-testid="project-name-input"]');
		this.projectDescriptionInput = page.locator('[data-testid="project-description-input"]');
		this.projectTypeSelect = page.locator('[data-testid="project-type-select"]');
		this.projectTemplateSelect = page.locator('[data-testid="project-template-select"]');
		this.projectVisibilitySelect = page.locator('[data-testid="project-visibility-select"]');
		this.projectTagsInput = page.locator('[data-testid="project-tags-input"]');
		this.projectOwnerSelect = page.locator('[data-testid="project-owner-select"]');
		this.projectDeadlineInput = page.locator('[data-testid="project-deadline-input"]');
		this.projectBudgetInput = page.locator('[data-testid="project-budget-input"]');
		this.projectPrioritySelect = page.locator('[data-testid="project-priority-select"]');
		this.createProjectSubmitButton = page.locator('[data-testid="create-project-submit"]');
		this.createProjectCancelButton = page.locator('[data-testid="create-project-cancel"]');
		this.createProjectResetButton = page.locator('[data-testid="create-project-reset"]');
		
		// Project templates
		this.templatesSection = page.locator('[data-testid="templates-section"]');
		this.templatesList = page.locator('[data-testid="templates-list"]');
		this.templateCard = (templateId: string) => page.locator(`[data-testid="template-card-${templateId}"]`);
		this.templateTitle = (templateId: string) => page.locator(`[data-testid="template-title-${templateId}"]`);
		this.templateDescription = (templateId: string) => page.locator(`[data-testid="template-description-${templateId}"]`);
		this.templatePreview = (templateId: string) => page.locator(`[data-testid="template-preview-${templateId}"]`);
		this.useTemplateButton = (templateId: string) => page.locator(`[data-testid="use-template-${templateId}"]`);
		this.customTemplateButton = page.locator('[data-testid="custom-template-button"]');
		this.importTemplateButton = page.locator('[data-testid="import-template-button"]');
		this.manageTemplatesButton = page.locator('[data-testid="manage-templates-button"]');
		
		// Bulk operations
		this.bulkOperationsPanel = page.locator('[data-testid="bulk-operations-panel"]');
		this.selectAllCheckbox = page.locator('[data-testid="select-all-checkbox"]');
		this.selectedItemsCount = page.locator('[data-testid="selected-items-count"]');
		this.bulkDeleteButton = page.locator('[data-testid="bulk-delete-button"]');
		this.bulkArchiveButton = page.locator('[data-testid="bulk-archive-button"]');
		this.bulkExportButton = page.locator('[data-testid="bulk-export-button"]');
		this.bulkShareButton = page.locator('[data-testid="bulk-share-button"]');
		this.bulkTagsButton = page.locator('[data-testid="bulk-tags-button"]');
		this.bulkMoveButton = page.locator('[data-testid="bulk-move-button"]');
		this.bulkCancelButton = page.locator('[data-testid="bulk-cancel-button"]');
		this.projectCheckbox = (projectId: string) => page.locator(`[data-testid="project-checkbox-${projectId}"]`);
		
		// Project import/export
		this.importModal = page.locator('[data-testid="import-modal"]');
		this.importFileInput = page.locator('[data-testid="import-file-input"]');
		this.importFormatSelect = page.locator('[data-testid="import-format-select"]');
		this.importOptionsPanel = page.locator('[data-testid="import-options-panel"]');
		this.importPreviewPanel = page.locator('[data-testid="import-preview-panel"]');
		this.importSubmitButton = page.locator('[data-testid="import-submit-button"]');
		this.importCancelButton = page.locator('[data-testid="import-cancel-button"]');
		this.exportModal = page.locator('[data-testid="export-modal"]');
		this.exportFormatSelect = page.locator('[data-testid="export-format-select"]');
		this.exportOptionsPanel = page.locator('[data-testid="export-options-panel"]');
		this.exportPreviewPanel = page.locator('[data-testid="export-preview-panel"]');
		this.exportSubmitButton = page.locator('[data-testid="export-submit-button"]');
		this.exportCancelButton = page.locator('[data-testid="export-cancel-button"]');
		
		// Project sharing
		this.shareModal = page.locator('[data-testid="share-modal"]');
		this.shareLink = page.locator('[data-testid="share-link"]');
		this.copyLinkButton = page.locator('[data-testid="copy-link-button"]');
		this.shareEmailInput = page.locator('[data-testid="share-email-input"]');
		this.sharePermissionsSelect = page.locator('[data-testid="share-permissions-select"]');
		this.shareMessageInput = page.locator('[data-testid="share-message-input"]');
		this.sendShareButton = page.locator('[data-testid="send-share-button"]');
		this.shareHistoryPanel = page.locator('[data-testid="share-history-panel"]');
		this.revokeShareButton = page.locator('[data-testid="revoke-share-button"]');
		this.shareSettingsButton = page.locator('[data-testid="share-settings-button"]');
		
		// Project analytics
		this.analyticsPanel = page.locator('[data-testid="analytics-panel"]');
		this.analyticsCharts = page.locator('[data-testid="analytics-charts"]');
		this.projectMetrics = page.locator('[data-testid="project-metrics"]');
		this.taskCompletionChart = page.locator('[data-testid="task-completion-chart"]');
		this.agentPerformanceChart = page.locator('[data-testid="agent-performance-chart"]');
		this.timelineChart = page.locator('[data-testid="timeline-chart"]');
		this.budgetChart = page.locator('[data-testid="budget-chart"]');
		this.collaborationChart = page.locator('[data-testid="collaboration-chart"]');
		this.metricsCards = page.locator('[data-testid="metrics-cards"]');
		this.analyticsFilters = page.locator('[data-testid="analytics-filters"]');
		this.analyticsExportButton = page.locator('[data-testid="analytics-export-button"]');
		
		// Project collaboration
		this.collaboratorsPanel = page.locator('[data-testid="collaborators-panel"]');
		this.collaboratorsList = page.locator('[data-testid="collaborators-list"]');
		this.collaboratorCard = (userId: string) => page.locator(`[data-testid="collaborator-card-${userId}"]`);
		this.collaboratorAvatar = (userId: string) => page.locator(`[data-testid="collaborator-avatar-${userId}"]`);
		this.collaboratorName = (userId: string) => page.locator(`[data-testid="collaborator-name-${userId}"]`);
		this.collaboratorRole = (userId: string) => page.locator(`[data-testid="collaborator-role-${userId}"]`);
		this.collaboratorStatus = (userId: string) => page.locator(`[data-testid="collaborator-status-${userId}"]`);
		this.collaboratorActions = (userId: string) => page.locator(`[data-testid="collaborator-actions-${userId}"]`);
		this.inviteCollaboratorButton = page.locator('[data-testid="invite-collaborator-button"]');
		this.managePermissionsButton = page.locator('[data-testid="manage-permissions-button"]');
		this.collaboratorSettingsButton = page.locator('[data-testid="collaborator-settings-button"]');
		
		// Project history
		this.historyPanel = page.locator('[data-testid="history-panel"]');
		this.historyTimeline = page.locator('[data-testid="history-timeline"]');
		this.historyItem = (index: number) => page.locator(`[data-testid="history-item-${index}"]`);
		this.historyTimestamp = (index: number) => page.locator(`[data-testid="history-timestamp-${index}"]`);
		this.historyUser = (index: number) => page.locator(`[data-testid="history-user-${index}"]`);
		this.historyAction = (index: number) => page.locator(`[data-testid="history-action-${index}"]`);
		this.historyDetails = (index: number) => page.locator(`[data-testid="history-details-${index}"]`);
		this.historyFilter = page.locator('[data-testid="history-filter"]');
		this.historySearch = page.locator('[data-testid="history-search"]');
		this.historyExportButton = page.locator('[data-testid="history-export-button"]');
		
		// Project settings
		this.settingsPanel = page.locator('[data-testid="settings-panel"]');
		this.generalSettings = page.locator('[data-testid="general-settings"]');
		this.accessSettings = page.locator('[data-testid="access-settings"]');
		this.integrationSettings = page.locator('[data-testid="integration-settings"]');
		this.notificationSettings = page.locator('[data-testid="notification-settings"]');
		this.advancedSettings = page.locator('[data-testid="advanced-settings"]');
		this.dangerZoneSettings = page.locator('[data-testid="danger-zone-settings"]');
		this.saveSettingsButton = page.locator('[data-testid="save-settings-button"]');
		this.resetSettingsButton = page.locator('[data-testid="reset-settings-button"]');
		this.settingsApplyButton = page.locator('[data-testid="settings-apply-button"]');
		
		// Loading and error states
		this.loadingSpinner = page.locator('[data-testid="loading-spinner"]');
		this.loadingOverlay = page.locator('[data-testid="loading-overlay"]');
		this.errorMessage = page.locator('[data-testid="error-message"]');
		this.errorRetryButton = page.locator('[data-testid="error-retry-button"]');
		this.emptyState = page.locator('[data-testid="empty-state"]');
		this.emptyStateMessage = page.locator('[data-testid="empty-state-message"]');
		this.emptyStateAction = page.locator('[data-testid="empty-state-action"]');
		this.noResultsMessage = page.locator('[data-testid="no-results-message"]');
		this.networkErrorMessage = page.locator('[data-testid="network-error-message"]');
		
		// Notifications and alerts
		this.notificationToast = page.locator('[data-testid="notification-toast"]');
		this.successMessage = page.locator('[data-testid="success-message"]');
		this.errorAlert = page.locator('[data-testid="error-alert"]');
		this.warningAlert = page.locator('[data-testid="warning-alert"]');
		this.infoAlert = page.locator('[data-testid="info-alert"]');
		this.alertCloseButton = page.locator('[data-testid="alert-close-button"]');
		this.confirmationDialog = page.locator('[data-testid="confirmation-dialog"]');
		this.confirmButton = page.locator('[data-testid="confirm-button"]');
		this.cancelButton = page.locator('[data-testid="cancel-button"]');
		
		// Responsive elements
		this.mobileMenu = page.locator('[data-testid="mobile-menu"]');
		this.mobileMenuToggle = page.locator('[data-testid="mobile-menu-toggle"]');
		this.mobileFilters = page.locator('[data-testid="mobile-filters"]');
		this.mobileSearch = page.locator('[data-testid="mobile-search"]');
		this.mobileActions = page.locator('[data-testid="mobile-actions"]');
		this.tabletView = page.locator('[data-testid="tablet-view"]');
		this.desktopView = page.locator('[data-testid="desktop-view"]');
		this.responsiveGrid = page.locator('[data-testid="responsive-grid"]');
	}
	
	// Navigation methods
	async navigateTo(): Promise<void> {
		await this.page.goto('/projects');
		await this.waitForPageLoad();
	}
	
	async waitForPageLoad(): Promise<void> {
		await this.projectsContainer.waitFor();
		await this.pageTitle.waitFor();
	}
	
	// Project creation methods
	async createProject(projectData: {
		name: string;
		description?: string;
		type?: string;
		template?: string;
		visibility?: string;
		tags?: string[];
		owner?: string;
		deadline?: string;
		budget?: number;
		priority?: string;
	}): Promise<void> {
		await this.createProjectButton.click();
		await this.createProjectModal.waitFor();
		
		await this.projectNameInput.fill(projectData.name);
		
		if (projectData.description) {
			await this.projectDescriptionInput.fill(projectData.description);
		}
		
		if (projectData.type) {
			await this.projectTypeSelect.selectOption(projectData.type);
		}
		
		if (projectData.template) {
			await this.projectTemplateSelect.selectOption(projectData.template);
		}
		
		if (projectData.visibility) {
			await this.projectVisibilitySelect.selectOption(projectData.visibility);
		}
		
		if (projectData.tags) {
			const tagsString = projectData.tags.join(',');
			await this.projectTagsInput.fill(tagsString);
		}
		
		if (projectData.owner) {
			await this.projectOwnerSelect.selectOption(projectData.owner);
		}
		
		if (projectData.deadline) {
			await this.projectDeadlineInput.fill(projectData.deadline);
		}
		
		if (projectData.budget) {
			await this.projectBudgetInput.fill(projectData.budget.toString());
		}
		
		if (projectData.priority) {
			await this.projectPrioritySelect.selectOption(projectData.priority);
		}
		
		await this.createProjectSubmitButton.click();
		await this.createProjectModal.waitFor({ state: 'hidden' });
	}
	
	async cancelProjectCreation(): Promise<void> {
		await this.createProjectCancelButton.click();
		await this.createProjectModal.waitFor({ state: 'hidden' });
	}
	
	// Project search and filtering
	async searchProjects(query: string): Promise<void> {
		await this.searchProjects.fill(query);
		await this.searchProjects.press('Enter');
		await this.waitForResults();
	}
	
	async clearSearch(): Promise<void> {
		await this.searchProjects.clear();
		await this.searchProjects.press('Enter');
		await this.waitForResults();
	}
	
	async applyStatusFilter(status: string): Promise<void> {
		await this.statusFilter.selectOption(status);
		await this.waitForResults();
	}
	
	async applyTypeFilter(type: string): Promise<void> {
		await this.typeFilter.selectOption(type);
		await this.waitForResults();
	}
	
	async applyOwnerFilter(owner: string): Promise<void> {
		await this.ownerFilter.selectOption(owner);
		await this.waitForResults();
	}
	
	async applyTagsFilter(tags: string[]): Promise<void> {
		for (const tag of tags) {
			await this.tagsFilter.selectOption(tag);
		}
		await this.waitForResults();
	}
	
	async clearAllFilters(): Promise<void> {
		await this.clearFiltersButton.click();
		await this.waitForResults();
	}
	
	async saveCurrentFilters(name: string): Promise<void> {
		await this.saveFiltersButton.click();
		// Assuming a modal or inline editor appears
		await this.page.fill('[data-testid="filter-preset-name"]', name);
		await this.page.click('[data-testid="save-preset-button"]');
	}
	
	// Project viewing and interaction
	async viewProject(projectId: string): Promise<void> {
		await this.viewProjectButton(projectId).click();
		await this.page.waitForURL(`/projects/${projectId}`);
	}
	
	async editProject(projectId: string): Promise<void> {
		await this.editProjectButton(projectId).click();
		await this.page.waitForURL(`/projects/${projectId}/edit`);
	}
	
	async duplicateProject(projectId: string): Promise<void> {
		await this.duplicateProjectButton(projectId).click();
		await this.confirmationDialog.waitFor();
		await this.confirmButton.click();
		await this.waitForResults();
	}
	
	async archiveProject(projectId: string): Promise<void> {
		await this.archiveProjectButton(projectId).click();
		await this.confirmationDialog.waitFor();
		await this.confirmButton.click();
		await this.waitForResults();
	}
	
	async deleteProject(projectId: string): Promise<void> {
		await this.deleteProjectButton(projectId).click();
		await this.confirmationDialog.waitFor();
		await this.confirmButton.click();
		await this.waitForResults();
	}
	
	async favoriteProject(projectId: string): Promise<void> {
		await this.favoriteProjectButton(projectId).click();
		await this.waitForResults();
	}
	
	async shareProject(projectId: string, email: string, permissions: string): Promise<void> {
		await this.shareProjectButton(projectId).click();
		await this.shareModal.waitFor();
		
		await this.shareEmailInput.fill(email);
		await this.sharePermissionsSelect.selectOption(permissions);
		await this.sendShareButton.click();
		
		await this.shareModal.waitFor({ state: 'hidden' });
	}
	
	// Project details panel
	async openProjectDetails(projectId: string): Promise<void> {
		await this.projectCard(projectId).click();
		await this.projectDetailsPanel.waitFor();
	}
	
	async closeProjectDetails(): Promise<void> {
		await this.closePanelButton.click();
		await this.projectDetailsPanel.waitFor({ state: 'hidden' });
	}
	
	async switchToDetailsTab(tabName: string): Promise<void> {
		const tab = this.page.locator(`[data-testid="${tabName}-tab"]`);
		await tab.click();
		await this.page.waitForTimeout(500); // Wait for tab content to load
	}
	
	// View management
	async switchToListView(): Promise<void> {
		await this.listViewButton.click();
		await this.projectsList.waitFor();
	}
	
	async switchToGridView(): Promise<void> {
		await this.gridViewButton.click();
		await this.projectsGrid.waitFor();
	}
	
	async switchToTableView(): Promise<void> {
		await this.tableViewButton.click();
		await this.projectsTable.waitFor();
	}
	
	async sortProjects(sortBy: string): Promise<void> {
		await this.sortDropdown.selectOption(sortBy);
		await this.waitForResults();
	}
	
	async changeItemsPerPage(count: number): Promise<void> {
		await this.itemsPerPageSelect.selectOption(count.toString());
		await this.waitForResults();
	}
	
	// Pagination
	async goToNextPage(): Promise<void> {
		await this.nextPageButton.click();
		await this.waitForResults();
	}
	
	async goToPrevPage(): Promise<void> {
		await this.prevPageButton.click();
		await this.waitForResults();
	}
	
	async goToPage(pageNumber: number): Promise<void> {
		const pageButton = this.page.locator(`[data-testid="page-${pageNumber}"]`);
		await pageButton.click();
		await this.waitForResults();
	}
	
	// Bulk operations
	async selectProject(projectId: string): Promise<void> {
		await this.projectCheckbox(projectId).check();
	}
	
	async deselectProject(projectId: string): Promise<void> {
		await this.projectCheckbox(projectId).uncheck();
	}
	
	async selectAllProjects(): Promise<void> {
		await this.selectAllCheckbox.check();
	}
	
	async deselectAllProjects(): Promise<void> {
		await this.selectAllCheckbox.uncheck();
	}
	
	async bulkDeleteProjects(): Promise<void> {
		await this.bulkDeleteButton.click();
		await this.confirmationDialog.waitFor();
		await this.confirmButton.click();
		await this.waitForResults();
	}
	
	async bulkArchiveProjects(): Promise<void> {
		await this.bulkArchiveButton.click();
		await this.confirmationDialog.waitFor();
		await this.confirmButton.click();
		await this.waitForResults();
	}
	
	async bulkExportProjects(): Promise<void> {
		await this.bulkExportButton.click();
		await this.exportModal.waitFor();
		await this.exportSubmitButton.click();
		await this.exportModal.waitFor({ state: 'hidden' });
	}
	
	// Import/Export
	async importProjects(filePath: string, format: string): Promise<void> {
		await this.importProjectButton.click();
		await this.importModal.waitFor();
		
		await this.importFileInput.setInputFiles(filePath);
		await this.importFormatSelect.selectOption(format);
		await this.importSubmitButton.click();
		
		await this.importModal.waitFor({ state: 'hidden' });
		await this.waitForResults();
	}
	
	async exportProjects(format: string): Promise<void> {
		await this.exportProjectsButton.click();
		await this.exportModal.waitFor();
		
		await this.exportFormatSelect.selectOption(format);
		await this.exportSubmitButton.click();
		
		await this.exportModal.waitFor({ state: 'hidden' });
	}
	
	// Template management
	async useTemplate(templateId: string): Promise<void> {
		await this.useTemplateButton(templateId).click();
		await this.createProjectModal.waitFor();
	}
	
	async previewTemplate(templateId: string): Promise<void> {
		await this.templatePreview(templateId).click();
		await this.page.waitForSelector('[data-testid="template-preview-modal"]');
	}
	
	// Utility methods
	async waitForResults(): Promise<void> {
		await this.page.waitForTimeout(1000);
		await this.loadingSpinner.waitFor({ state: 'hidden' });
	}
	
	async getProjectCount(): Promise<number> {
		const countText = await this.totalCount.textContent();
		return countText ? parseInt(countText.replace(/\D/g, '')) : 0;
	}
	
	async getSelectedProjectsCount(): Promise<number> {
		const countText = await this.selectedItemsCount.textContent();
		return countText ? parseInt(countText.replace(/\D/g, '')) : 0;
	}
	
	async isProjectVisible(projectId: string): Promise<boolean> {
		return await this.projectCard(projectId).isVisible();
	}
	
	async isProjectFavorited(projectId: string): Promise<boolean> {
		const favoriteButton = this.favoriteProjectButton(projectId);
		return await favoriteButton.getAttribute('aria-pressed') === 'true';
	}
	
	async isProjectArchived(projectId: string): Promise<boolean> {
		return await this.projectArchived(projectId).isVisible();
	}
	
	async getProjectStatus(projectId: string): Promise<string> {
		const statusElement = this.projectStatus(projectId);
		return await statusElement.textContent() || '';
	}
	
	async getProjectType(projectId: string): Promise<string> {
		const typeElement = this.projectType(projectId);
		return await typeElement.textContent() || '';
	}
	
	async getProjectTags(projectId: string): Promise<string[]> {
		const tagsElement = this.projectTags(projectId);
		const tagElements = await tagsElement.locator('[data-testid^="tag-"]').all();
		const tags: string[] = [];
		
		for (const tagElement of tagElements) {
			const tagText = await tagElement.textContent();
			if (tagText) {
				tags.push(tagText);
			}
		}
		
		return tags;
	}
	
	async refreshProjects(): Promise<void> {
		await this.refreshButton.click();
		await this.waitForResults();
	}
	
	async waitForNotification(type: 'success' | 'error' | 'warning' | 'info'): Promise<void> {
		const notification = this.page.locator(`[data-testid="${type}-message"]`);
		await notification.waitFor();
	}
	
	async dismissNotification(): Promise<void> {
		await this.alertCloseButton.click();
	}
	
	// Responsive design methods
	async isMobileView(): Promise<boolean> {
		return await this.mobileMenuToggle.isVisible();
	}
	
	async isTabletView(): Promise<boolean> {
		return await this.tabletView.isVisible();
	}
	
	async isDesktopView(): Promise<boolean> {
		return await this.desktopView.isVisible();
	}
	
	async toggleMobileMenu(): Promise<void> {
		await this.mobileMenuToggle.click();
		await this.mobileMenu.waitFor();
	}
	
	// Accessibility methods
	async checkAccessibility(): Promise<void> {
		// Check for essential accessibility attributes
		await expect(this.pageTitle).toHaveAttribute('role', 'heading');
		await expect(this.searchProjects).toHaveAttribute('aria-label');
		await expect(this.createProjectButton).toHaveAttribute('aria-label');
		
		// Check for keyboard navigation
		await this.createProjectButton.focus();
		await expect(this.createProjectButton).toBeFocused();
		
		// Check for screen reader announcements
		await expect(this.totalCount).toHaveAttribute('aria-live', 'polite');
	}
	
	async navigateWithKeyboard(): Promise<void> {
		await this.page.keyboard.press('Tab');
		await this.page.keyboard.press('Enter');
	}
}