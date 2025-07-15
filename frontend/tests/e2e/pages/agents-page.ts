import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./base-page";

export class AgentsPage extends BasePage {
	readonly page: Page;
	
	// Main navigation
	readonly agentsTab: Locator;
	readonly createAgentButton: Locator;
	readonly agentsGrid: Locator;
	readonly searchInput: Locator;
	readonly filterDropdown: Locator;
	readonly sortDropdown: Locator;
	
	// Agent cards
	readonly agentCards: Locator;
	readonly agentCard: (name: string) => Locator;
	readonly agentStatus: (name: string) => Locator;
	readonly agentActions: (name: string) => Locator;
	
	// Agent creation modal
	readonly createAgentModal: Locator;
	readonly agentNameInput: Locator;
	readonly agentTypeSelect: Locator;
	readonly agentDescriptionInput: Locator;
	readonly agentCapabilitiesInput: Locator;
	readonly agentConfigurationInput: Locator;
	readonly saveAgentButton: Locator;
	readonly cancelAgentButton: Locator;
	
	// Agent details modal
	readonly agentDetailsModal: Locator;
	readonly agentDetailsName: Locator;
	readonly agentDetailsType: Locator;
	readonly agentDetailsStatus: Locator;
	readonly agentDetailsCapabilities: Locator;
	readonly agentDetailsConfiguration: Locator;
	readonly agentDetailsHistory: Locator;
	readonly agentDetailsMetrics: Locator;
	
	// Agent execution
	readonly executeAgentButton: Locator;
	readonly executionModal: Locator;
	readonly taskInput: Locator;
	readonly executeButton: Locator;
	readonly executionResults: Locator;
	readonly executionLogs: Locator;
	readonly executionStatus: Locator;
	
	// Agent management
	readonly editAgentButton: Locator;
	readonly duplicateAgentButton: Locator;
	readonly deleteAgentButton: Locator;
	readonly exportAgentButton: Locator;
	readonly importAgentButton: Locator;
	
	// Bulk operations
	readonly selectAllCheckbox: Locator;
	readonly bulkActionsDropdown: Locator;
	readonly bulkDeleteButton: Locator;
	readonly bulkExportButton: Locator;
	readonly bulkExecuteButton: Locator;
	
	// Agent types
	readonly coderAgentType: Locator;
	readonly analystAgentType: Locator;
	readonly researcherAgentType: Locator;
	readonly reviewerAgentType: Locator;
	readonly coordinatorAgentType: Locator;
	readonly customAgentType: Locator;
	
	// Agent templates
	readonly templatesDropdown: Locator;
	readonly templateCard: (name: string) => Locator;
	readonly useTemplateButton: Locator;
	readonly customizeTemplateButton: Locator;
	
	// Agent workflows
	readonly workflowsTab: Locator;
	readonly createWorkflowButton: Locator;
	readonly workflowList: Locator;
	readonly workflowCard: (name: string) => Locator;
	readonly executeWorkflowButton: Locator;
	
	// Agent collaboration
	readonly collaborationTab: Locator;
	readonly agentTeams: Locator;
	readonly createTeamButton: Locator;
	readonly teamMembersList: Locator;
	readonly addTeamMemberButton: Locator;
	
	// Agent monitoring
	readonly monitoringTab: Locator;
	readonly performanceMetrics: Locator;
	readonly activeAgentsCount: Locator;
	readonly totalExecutionsCount: Locator;
	readonly successRateMetric: Locator;
	readonly averageResponseTime: Locator;
	
	// Agent settings
	readonly agentSettingsTab: Locator;
	readonly globalSettingsPanel: Locator;
	readonly agentLimitsInput: Locator;
	readonly executionTimeoutInput: Locator;
	readonly retryAttemptsInput: Locator;
	readonly loggingLevelSelect: Locator;
	
	constructor(page: Page) {
		super(page);
		this.page = page;
		
		// Main navigation
		this.agentsTab = page.locator('[data-testid="agents-tab"]');
		this.createAgentButton = page.locator('[data-testid="create-agent-button"]');
		this.agentsGrid = page.locator('[data-testid="agents-grid"]');
		this.searchInput = page.locator('[data-testid="agents-search-input"]');
		this.filterDropdown = page.locator('[data-testid="agents-filter-dropdown"]');
		this.sortDropdown = page.locator('[data-testid="agents-sort-dropdown"]');
		
		// Agent cards
		this.agentCards = page.locator('[data-testid="agent-card"]');
		this.agentCard = (name: string) => page.locator(`[data-testid="agent-card-${name}"]`);
		this.agentStatus = (name: string) => page.locator(`[data-testid="agent-status-${name}"]`);
		this.agentActions = (name: string) => page.locator(`[data-testid="agent-actions-${name}"]`);
		
		// Agent creation modal
		this.createAgentModal = page.locator('[data-testid="create-agent-modal"]');
		this.agentNameInput = page.locator('[data-testid="agent-name-input"]');
		this.agentTypeSelect = page.locator('[data-testid="agent-type-select"]');
		this.agentDescriptionInput = page.locator('[data-testid="agent-description-input"]');
		this.agentCapabilitiesInput = page.locator('[data-testid="agent-capabilities-input"]');
		this.agentConfigurationInput = page.locator('[data-testid="agent-configuration-input"]');
		this.saveAgentButton = page.locator('[data-testid="save-agent-button"]');
		this.cancelAgentButton = page.locator('[data-testid="cancel-agent-button"]');
		
		// Agent details modal
		this.agentDetailsModal = page.locator('[data-testid="agent-details-modal"]');
		this.agentDetailsName = page.locator('[data-testid="agent-details-name"]');
		this.agentDetailsType = page.locator('[data-testid="agent-details-type"]');
		this.agentDetailsStatus = page.locator('[data-testid="agent-details-status"]');
		this.agentDetailsCapabilities = page.locator('[data-testid="agent-details-capabilities"]');
		this.agentDetailsConfiguration = page.locator('[data-testid="agent-details-configuration"]');
		this.agentDetailsHistory = page.locator('[data-testid="agent-details-history"]');
		this.agentDetailsMetrics = page.locator('[data-testid="agent-details-metrics"]');
		
		// Agent execution
		this.executeAgentButton = page.locator('[data-testid="execute-agent-button"]');
		this.executionModal = page.locator('[data-testid="execution-modal"]');
		this.taskInput = page.locator('[data-testid="task-input"]');
		this.executeButton = page.locator('[data-testid="execute-button"]');
		this.executionResults = page.locator('[data-testid="execution-results"]');
		this.executionLogs = page.locator('[data-testid="execution-logs"]');
		this.executionStatus = page.locator('[data-testid="execution-status"]');
		
		// Agent management
		this.editAgentButton = page.locator('[data-testid="edit-agent-button"]');
		this.duplicateAgentButton = page.locator('[data-testid="duplicate-agent-button"]');
		this.deleteAgentButton = page.locator('[data-testid="delete-agent-button"]');
		this.exportAgentButton = page.locator('[data-testid="export-agent-button"]');
		this.importAgentButton = page.locator('[data-testid="import-agent-button"]');
		
		// Bulk operations
		this.selectAllCheckbox = page.locator('[data-testid="select-all-checkbox"]');
		this.bulkActionsDropdown = page.locator('[data-testid="bulk-actions-dropdown"]');
		this.bulkDeleteButton = page.locator('[data-testid="bulk-delete-button"]');
		this.bulkExportButton = page.locator('[data-testid="bulk-export-button"]');
		this.bulkExecuteButton = page.locator('[data-testid="bulk-execute-button"]');
		
		// Agent types
		this.coderAgentType = page.locator('[data-testid="coder-agent-type"]');
		this.analystAgentType = page.locator('[data-testid="analyst-agent-type"]');
		this.researcherAgentType = page.locator('[data-testid="researcher-agent-type"]');
		this.reviewerAgentType = page.locator('[data-testid="reviewer-agent-type"]');
		this.coordinatorAgentType = page.locator('[data-testid="coordinator-agent-type"]');
		this.customAgentType = page.locator('[data-testid="custom-agent-type"]');
		
		// Agent templates
		this.templatesDropdown = page.locator('[data-testid="templates-dropdown"]');
		this.templateCard = (name: string) => page.locator(`[data-testid="template-card-${name}"]`);
		this.useTemplateButton = page.locator('[data-testid="use-template-button"]');
		this.customizeTemplateButton = page.locator('[data-testid="customize-template-button"]');
		
		// Agent workflows
		this.workflowsTab = page.locator('[data-testid="workflows-tab"]');
		this.createWorkflowButton = page.locator('[data-testid="create-workflow-button"]');
		this.workflowList = page.locator('[data-testid="workflow-list"]');
		this.workflowCard = (name: string) => page.locator(`[data-testid="workflow-card-${name}"]`);
		this.executeWorkflowButton = page.locator('[data-testid="execute-workflow-button"]');
		
		// Agent collaboration
		this.collaborationTab = page.locator('[data-testid="collaboration-tab"]');
		this.agentTeams = page.locator('[data-testid="agent-teams"]');
		this.createTeamButton = page.locator('[data-testid="create-team-button"]');
		this.teamMembersList = page.locator('[data-testid="team-members-list"]');
		this.addTeamMemberButton = page.locator('[data-testid="add-team-member-button"]');
		
		// Agent monitoring
		this.monitoringTab = page.locator('[data-testid="monitoring-tab"]');
		this.performanceMetrics = page.locator('[data-testid="performance-metrics"]');
		this.activeAgentsCount = page.locator('[data-testid="active-agents-count"]');
		this.totalExecutionsCount = page.locator('[data-testid="total-executions-count"]');
		this.successRateMetric = page.locator('[data-testid="success-rate-metric"]');
		this.averageResponseTime = page.locator('[data-testid="average-response-time"]');
		
		// Agent settings
		this.agentSettingsTab = page.locator('[data-testid="agent-settings-tab"]');
		this.globalSettingsPanel = page.locator('[data-testid="global-settings-panel"]');
		this.agentLimitsInput = page.locator('[data-testid="agent-limits-input"]');
		this.executionTimeoutInput = page.locator('[data-testid="execution-timeout-input"]');
		this.retryAttemptsInput = page.locator('[data-testid="retry-attempts-input"]');
		this.loggingLevelSelect = page.locator('[data-testid="logging-level-select"]');
	}
	
	async goto(): Promise<void> {
		await this.page.goto("/agents");
		await this.waitForPageLoad();
	}
	
	async createAgent(agentData: {
		name: string;
		type: string;
		description?: string;
		capabilities?: string[];
		configuration?: Record<string, any>;
	}): Promise<void> {
		await this.createAgentButton.click();
		await this.createAgentModal.waitFor({ state: "visible" });
		
		await this.agentNameInput.fill(agentData.name);
		await this.agentTypeSelect.selectOption(agentData.type);
		
		if (agentData.description) {
			await this.agentDescriptionInput.fill(agentData.description);
		}
		
		if (agentData.capabilities) {
			await this.agentCapabilitiesInput.fill(agentData.capabilities.join(", "));
		}
		
		if (agentData.configuration) {
			await this.agentConfigurationInput.fill(JSON.stringify(agentData.configuration, null, 2));
		}
		
		await this.saveAgentButton.click();
		await this.createAgentModal.waitFor({ state: "hidden" });
	}
	
	async executeAgent(agentName: string, task: string): Promise<void> {
		await this.agentCard(agentName).hover();
		await this.executeAgentButton.click();
		await this.executionModal.waitFor({ state: "visible" });
		
		await this.taskInput.fill(task);
		await this.executeButton.click();
		
		// Wait for execution to complete
		await this.executionStatus.waitFor({ state: "visible" });
		await expect(this.executionStatus).toContainText("Completed", { timeout: 60000 });
	}
	
	async searchAgents(query: string): Promise<void> {
		await this.searchInput.fill(query);
		await this.searchInput.press("Enter");
		await this.waitForSearchResults();
	}
	
	async filterAgents(filter: string): Promise<void> {
		await this.filterDropdown.click();
		await this.page.locator(`[data-testid="filter-option-${filter}"]`).click();
		await this.waitForSearchResults();
	}
	
	async sortAgents(sort: string): Promise<void> {
		await this.sortDropdown.click();
		await this.page.locator(`[data-testid="sort-option-${sort}"]`).click();
		await this.waitForSearchResults();
	}
	
	async viewAgentDetails(agentName: string): Promise<void> {
		await this.agentCard(agentName).click();
		await this.agentDetailsModal.waitFor({ state: "visible" });
	}
	
	async editAgent(agentName: string, updates: {
		name?: string;
		description?: string;
		capabilities?: string[];
		configuration?: Record<string, any>;
	}): Promise<void> {
		await this.agentCard(agentName).hover();
		await this.editAgentButton.click();
		await this.createAgentModal.waitFor({ state: "visible" });
		
		if (updates.name) {
			await this.agentNameInput.fill(updates.name);
		}
		
		if (updates.description) {
			await this.agentDescriptionInput.fill(updates.description);
		}
		
		if (updates.capabilities) {
			await this.agentCapabilitiesInput.fill(updates.capabilities.join(", "));
		}
		
		if (updates.configuration) {
			await this.agentConfigurationInput.fill(JSON.stringify(updates.configuration, null, 2));
		}
		
		await this.saveAgentButton.click();
		await this.createAgentModal.waitFor({ state: "hidden" });
	}
	
	async deleteAgent(agentName: string): Promise<void> {
		await this.agentCard(agentName).hover();
		await this.deleteAgentButton.click();
		
		// Confirm deletion
		await this.page.locator('[data-testid="confirm-delete-button"]').click();
		await this.agentCard(agentName).waitFor({ state: "hidden" });
	}
	
	async duplicateAgent(agentName: string, newName: string): Promise<void> {
		await this.agentCard(agentName).hover();
		await this.duplicateAgentButton.click();
		await this.createAgentModal.waitFor({ state: "visible" });
		
		await this.agentNameInput.fill(newName);
		await this.saveAgentButton.click();
		await this.createAgentModal.waitFor({ state: "hidden" });
	}
	
	async createWorkflow(workflowData: {
		name: string;
		description?: string;
		agents: string[];
		stages: Array<{
			name: string;
			agents: string[];
			parallelExecution?: boolean;
		}>;
	}): Promise<void> {
		await this.workflowsTab.click();
		await this.createWorkflowButton.click();
		
		const workflowModal = this.page.locator('[data-testid="create-workflow-modal"]');
		await workflowModal.waitFor({ state: "visible" });
		
		await this.page.locator('[data-testid="workflow-name-input"]').fill(workflowData.name);
		
		if (workflowData.description) {
			await this.page.locator('[data-testid="workflow-description-input"]').fill(workflowData.description);
		}
		
		// Add stages
		for (const stage of workflowData.stages) {
			await this.page.locator('[data-testid="add-stage-button"]').click();
			await this.page.locator('[data-testid="stage-name-input"]').last().fill(stage.name);
			
			// Add agents to stage
			for (const agentName of stage.agents) {
				await this.page.locator('[data-testid="add-agent-to-stage-button"]').last().click();
				await this.page.locator('[data-testid="agent-select"]').last().selectOption(agentName);
			}
			
			if (stage.parallelExecution) {
				await this.page.locator('[data-testid="parallel-execution-checkbox"]').last().check();
			}
		}
		
		await this.page.locator('[data-testid="save-workflow-button"]').click();
		await workflowModal.waitFor({ state: "hidden" });
	}
	
	async executeWorkflow(workflowName: string, input?: string): Promise<void> {
		await this.workflowsTab.click();
		await this.workflowCard(workflowName).hover();
		await this.executeWorkflowButton.click();
		
		const executionModal = this.page.locator('[data-testid="workflow-execution-modal"]');
		await executionModal.waitFor({ state: "visible" });
		
		if (input) {
			await this.page.locator('[data-testid="workflow-input"]').fill(input);
		}
		
		await this.page.locator('[data-testid="execute-workflow-button"]').click();
		
		// Wait for workflow completion
		await this.page.locator('[data-testid="workflow-status"]').waitFor({ state: "visible" });
		await expect(this.page.locator('[data-testid="workflow-status"]')).toContainText("Completed", { timeout: 120000 });
	}
	
	async createAgentTeam(teamData: {
		name: string;
		description?: string;
		members: string[];
		leader?: string;
	}): Promise<void> {
		await this.collaborationTab.click();
		await this.createTeamButton.click();
		
		const teamModal = this.page.locator('[data-testid="create-team-modal"]');
		await teamModal.waitFor({ state: "visible" });
		
		await this.page.locator('[data-testid="team-name-input"]').fill(teamData.name);
		
		if (teamData.description) {
			await this.page.locator('[data-testid="team-description-input"]').fill(teamData.description);
		}
		
		// Add team members
		for (const member of teamData.members) {
			await this.addTeamMemberButton.click();
			await this.page.locator('[data-testid="member-select"]').last().selectOption(member);
		}
		
		if (teamData.leader) {
			await this.page.locator('[data-testid="team-leader-select"]').selectOption(teamData.leader);
		}
		
		await this.page.locator('[data-testid="save-team-button"]').click();
		await teamModal.waitFor({ state: "hidden" });
	}
	
	async viewPerformanceMetrics(): Promise<{
		activeAgents: number;
		totalExecutions: number;
		successRate: number;
		averageResponseTime: number;
	}> {
		await this.monitoringTab.click();
		await this.performanceMetrics.waitFor({ state: "visible" });
		
		const activeAgents = await this.activeAgentsCount.textContent();
		const totalExecutions = await this.totalExecutionsCount.textContent();
		const successRate = await this.successRateMetric.textContent();
		const averageResponseTime = await this.averageResponseTime.textContent();
		
		return {
			activeAgents: parseInt(activeAgents || "0"),
			totalExecutions: parseInt(totalExecutions || "0"),
			successRate: parseFloat(successRate || "0"),
			averageResponseTime: parseFloat(averageResponseTime || "0")
		};
	}
	
	async configureGlobalSettings(settings: {
		agentLimits?: number;
		executionTimeout?: number;
		retryAttempts?: number;
		loggingLevel?: string;
	}): Promise<void> {
		await this.agentSettingsTab.click();
		await this.globalSettingsPanel.waitFor({ state: "visible" });
		
		if (settings.agentLimits) {
			await this.agentLimitsInput.fill(settings.agentLimits.toString());
		}
		
		if (settings.executionTimeout) {
			await this.executionTimeoutInput.fill(settings.executionTimeout.toString());
		}
		
		if (settings.retryAttempts) {
			await this.retryAttemptsInput.fill(settings.retryAttempts.toString());
		}
		
		if (settings.loggingLevel) {
			await this.loggingLevelSelect.selectOption(settings.loggingLevel);
		}
		
		await this.page.locator('[data-testid="save-settings-button"]').click();
	}
	
	async waitForSearchResults(): Promise<void> {
		await this.page.waitForTimeout(500);
		await this.agentsGrid.waitFor({ state: "visible" });
	}
	
	async getAgentCount(): Promise<number> {
		await this.agentsGrid.waitFor({ state: "visible" });
		return await this.agentCards.count();
	}
	
	async getAgentNames(): Promise<string[]> {
		await this.agentsGrid.waitFor({ state: "visible" });
		return await this.agentCards.allTextContents();
	}
	
	async verifyAgentExists(agentName: string): Promise<boolean> {
		try {
			await this.agentCard(agentName).waitFor({ state: "visible", timeout: 5000 });
			return true;
		} catch {
			return false;
		}
	}
	
	async verifyAgentStatus(agentName: string, expectedStatus: string): Promise<void> {
		await expect(this.agentStatus(agentName)).toContainText(expectedStatus);
	}
}