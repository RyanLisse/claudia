import { vi } from "vitest";
import type {
	AgentCapability,
	AgentCapabilityAdaptation,
	AgentConfig,
	AgentCoordinationResult,
	AgentExecutionMetrics,
	AgentFeedback,
	AgentHealthStatus,
	AgentLearningResult,
	AgentMessage,
	AgentMessageResult,
	AgentPerformanceData,
	AgentState,
	AgentStatus,
	AgentType,
	RetryOptions,
	Task,
	TaskResult,
} from "../../../src/agents/types/agent";

// Mock BaseAgent class that matches test expectations
export class BaseAgent {
	public readonly id: string;
	public readonly name: string;
	public readonly type: AgentType;
	public readonly capabilities: AgentCapability[];
	public readonly maxConcurrentTasks: number;
	public status: AgentStatus = "idle";
	public currentTasks: string[] = [];
	private metrics: AgentExecutionMetrics = {
		totalTasksExecuted: 0,
		averageExecutionTime: 0,
		lastExecutionTime: 0,
		successRate: 1.0,
	};

	constructor(config: AgentConfig) {
		this.validateConfig(config);

		this.id = config.id;
		this.name = config.name;
		this.type = config.type;
		this.capabilities = config.capabilities;
		this.maxConcurrentTasks = config.maxConcurrentTasks || 1;
	}

	private validateConfig(config: AgentConfig): void {
		if (!config.id || config.id.trim() === "") {
			throw new Error("Agent ID cannot be empty");
		}
		if (!config.name || config.name.trim() === "") {
			throw new Error("Agent name cannot be empty");
		}
		if (!config.capabilities || config.capabilities.length === 0) {
			throw new Error("Agent must have at least one capability");
		}
	}

	public canExecuteTask(task: Task): boolean {
		return task.requiredCapabilities.every((capability) =>
			this.capabilities.includes(capability),
		);
	}

	public async execute(task: Task): Promise<TaskResult> {
		if (!this.canExecuteTask(task)) {
			throw new Error("Agent does not have required capabilities");
		}

		if (this.currentTasks.length >= this.maxConcurrentTasks) {
			throw new Error("Agent is at maximum concurrent task limit");
		}

		this.currentTasks.push(task.id);
		this.updateStatus();

		const startTime = Date.now();

		try {
			const result = await this.executeTaskImplementation(task);
			const endTime = Date.now();

			this.updateMetrics(endTime - startTime, true);
			this.currentTasks = this.currentTasks.filter((id) => id !== task.id);
			this.updateStatus();

			return result;
		} catch (error) {
			const endTime = Date.now();
			this.updateMetrics(endTime - startTime, false);
			this.currentTasks = this.currentTasks.filter((id) => id !== task.id);
			this.updateStatus();

			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Unknown error occurred",
			};
		}
	}

	public async executeWithRetry(
		task: Task,
		options: RetryOptions,
	): Promise<TaskResult> {
		const { maxRetries, backoffMs = 1000, exponentialBackoff = true } = options;
		let lastError: Error | null = null;

		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				const result = await this.executeTaskImplementation(task);
				return { ...result, attemptCount: attempt };
			} catch (error) {
				lastError = error instanceof Error ? error : new Error("Unknown error");

				if (attempt < maxRetries) {
					const delay = exponentialBackoff
						? backoffMs * 2 ** (attempt - 1)
						: backoffMs;
					await new Promise((resolve) => setTimeout(resolve, delay));
				}
			}
		}

		return {
			success: false,
			error: lastError?.message || "Max retries exceeded",
			attemptCount: maxRetries,
		};
	}

	public async executeTaskImplementation(task: Task): Promise<TaskResult> {
		return new Promise((resolve) => {
			setTimeout(() => {
				resolve({
					success: true,
					result: `Task ${task.id} completed successfully`,
					artifacts: [],
					metrics: {
						executionTime: 1000,
						linesOfCode: 50,
						testCoverage: 85,
					},
				});
			}, 100);
		});
	}

	private updateStatus(): void {
		if (this.currentTasks.length === 0) {
			this.status = "idle";
		} else {
			this.status = "busy";
		}
	}

	private updateMetrics(executionTime: number, success: boolean): void {
		this.metrics.totalTasksExecuted++;
		this.metrics.lastExecutionTime = Date.now();

		// Update average execution time
		const totalTime =
			this.metrics.averageExecutionTime *
				(this.metrics.totalTasksExecuted - 1) +
			executionTime;
		this.metrics.averageExecutionTime =
			totalTime / this.metrics.totalTasksExecuted;

		// Update success rate
		const successfulTasks =
			this.metrics.successRate * (this.metrics.totalTasksExecuted - 1) +
			(success ? 1 : 0);
		this.metrics.successRate =
			successfulTasks / this.metrics.totalTasksExecuted;
	}

	public getExecutionMetrics(): AgentExecutionMetrics {
		return { ...this.metrics };
	}

	public async sendMessage(
		_targetAgentId: string,
		_message: AgentMessage,
	): Promise<AgentMessageResult> {
		return {
			success: true,
			messageId: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
		};
	}

	public async receiveMessage(
		message: AgentMessage,
	): Promise<AgentMessageResult> {
		const result = await this.processIncomingMessage(message);
		return result;
	}

	public async processIncomingMessage(
		message: AgentMessage,
	): Promise<AgentMessageResult> {
		return {
			acknowledged: true,
			response: `Message processed: ${message.content}`,
		};
	}

	public async coordinateWithAgents(
		task: Task,
	): Promise<AgentCoordinationResult> {
		return {
			success: true,
			collaborationPlan: {
				myRole: "primary-executor",
				dependencies: task.collaborators || [],
			},
		};
	}

	public async learnFromFeedback(
		feedback: AgentFeedback,
	): Promise<AgentLearningResult> {
		return {
			learningApplied: true,
			adaptationsMade: feedback.suggestions.length,
		};
	}

	public async adaptCapabilities(
		performanceData: AgentPerformanceData,
	): Promise<AgentCapabilityAdaptation> {
		const newCapabilities: AgentCapability[] = [];
		const improvedCapabilities: AgentCapability[] = [];

		performanceData.commonIssues.forEach((issue) => {
			if (
				issue === "type-safety" &&
				!this.capabilities.includes("type-safety-enhancement")
			) {
				newCapabilities.push("type-safety-enhancement");
			}
			if (
				issue === "performance-optimization" &&
				this.capabilities.includes("optimization")
			) {
				improvedCapabilities.push("performance-optimization");
			}
		});

		return {
			capabilitiesUpdated:
				newCapabilities.length > 0 || improvedCapabilities.length > 0,
			newCapabilities,
			improvedCapabilities,
		};
	}

	public async saveState(): Promise<AgentState> {
		return {
			id: this.id,
			name: this.name,
			type: this.type,
			status: this.status,
			capabilities: this.capabilities,
			currentTasks: [...this.currentTasks],
			maxConcurrentTasks: this.maxConcurrentTasks,
			metrics: { ...this.metrics },
			lastStateUpdate: Date.now(),
		};
	}

	public async restoreState(state: AgentState): Promise<void> {
		if (!state.id || !state.name || !state.type) {
			throw new Error("Invalid agent state format");
		}

		this.status = state.status;
		this.currentTasks = [...state.currentTasks];
		this.metrics = { ...state.metrics };
	}

	public async cleanupResources(): Promise<{ cleaned: boolean }> {
		return { cleaned: true };
	}

	public async performHealthCheck(): Promise<AgentHealthStatus> {
		return {
			status: "healthy",
			memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
			taskQueueSize: this.currentTasks.length,
			lastActivityTime: this.metrics.lastExecutionTime || Date.now(),
		};
	}
}

// Mock the BaseAgent import
vi.mock("../../../src/agents/core/BaseAgent", () => ({
	BaseAgent,
}));
