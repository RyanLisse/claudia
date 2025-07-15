/**
 * Mock Inngest client and functions for testing
 */
import { vi } from "vitest";
import type { AgentEvents } from "../../../../../src/agents/inngest/client";

// Mock Inngest event data
export const createMockInngestEvent = (
	eventType: keyof AgentEvents,
	data: any,
) => ({
	id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
	name: eventType,
	data,
	user: {},
	ts: new Date().toISOString(),
});

// Mock Inngest step functions
export const createMockInngestStep = () => ({
	run: vi.fn().mockImplementation(async (_id: string, fn: () => any) => {
		return await fn();
	}),
	sendEvent: vi.fn().mockResolvedValue({ id: "evt_mock" }),
	sleep: vi.fn().mockResolvedValue(undefined),
	waitForEvent: vi.fn().mockResolvedValue({}),
});

// Mock Inngest client
export const createMockInngest = () => ({
	createFunction: vi.fn().mockImplementation((config, eventConfig, handler) => {
		const mockFunction = {
			id: config.id,
			name: config.name,
			event: eventConfig.event,
			handler,
			trigger: vi.fn().mockImplementation(async (event) => {
				const step = createMockInngestStep();
				return await handler({ event, step });
			}),
		};
		return mockFunction;
	}),
	send: vi.fn().mockImplementation(async (_event) => {
		return { id: `evt_${Date.now()}` };
	}),
});

// Mock Inngest functions
export const createMockInngestFunctions = (agentSystem?: any) => ({
	assignTask: {
		id: "assign-task",
		name: "Assign Task to Agent",
		trigger: vi.fn().mockImplementation(async (event) => {
			// Call syncManager if available, but handle failures gracefully
			if (agentSystem?.syncManager?.initialize) {
				try {
					await agentSystem.syncManager.initialize();
				} catch (error) {
					// Log error but continue with task assignment
					console.warn("ElectricSQL sync failed, continuing with task assignment:", error);
				}
			}
			return { status: "assigned", taskId: event.data.taskId || "task-123" };
		}),
	},
	monitorTaskExecution: {
		id: "monitor-task-execution",
		name: "Monitor Task Execution",
		trigger: vi.fn().mockImplementation(async (event) => {
			const { agentId, taskId } = event.data;
			// Call the mocked agent system functions
			if (agentSystem?.agentRegistry?.getAgent && agentId) {
				const agent = await agentSystem.agentRegistry.getAgent(agentId);
				// If it's a timeout event, cancel the task
				if (event.name === "agent/task.timeout" && agent?.cancelTask) {
					await agent.cancelTask(taskId);
				}
			}
			return { taskId: taskId || "task-123", status: "in_progress" };
		}),
	},
	retryFailedTask: {
		id: "retry-failed-task",
		name: "Retry Failed Task",
		trigger: vi
			.fn()
			.mockResolvedValue({ taskId: "task-123", status: "retry_scheduled" }),
	},
	monitorAgentHealth: {
		id: "monitor-agent-health",
		name: "Monitor Agent Health",
		trigger: vi.fn().mockImplementation(async (event) => ({
			agentId: event.data.agentId || "agent-123",
			healthStatus: "healthy",
		})),
	},
	scaleAgents: {
		id: "scale-agents",
		name: "Scale Agent Pool",
		trigger: vi
			.fn()
			.mockResolvedValue({ action: "scale_up", agentsCreated: 3 }),
	},
	routeMessage: {
		id: "route-message",
		name: "Route Inter-Agent Message",
		trigger: vi.fn().mockResolvedValue({ messageId: "msg-123", delivered: 1 }),
	},
});

// Mock Inngest handler
export const createMockInngestHandler = () => ({
	GET: vi.fn().mockResolvedValue(new Response("OK")),
	POST: vi.fn().mockResolvedValue(new Response("OK")),
	PUT: vi.fn().mockResolvedValue(new Response("OK")),
});

// Mock agent registry for Inngest functions
export const createMockAgentRegistry = () => ({
	findByCapability: vi.fn().mockResolvedValue(["agent-1", "agent-2"]),
	getAgentInfo: vi.fn().mockReturnValue({
		id: "agent-1",
		capabilities: ["code_analysis", "code_generation"],
		currentStatus: "idle",
		currentTasks: [],
		metrics: {
			tasksCompleted: 10,
			tasksInProgress: 1,
			tasksFailed: 0,
			averageTaskDurationMs: 5000,
		},
	}),
	getAgent: vi.fn().mockResolvedValue({
		id: "agent-1",
		assignTask: vi.fn().mockResolvedValue(true),
		cancelTask: vi.fn().mockResolvedValue(true),
		handleMessage: vi.fn().mockResolvedValue(true),
		start: vi.fn().mockResolvedValue(true),
		stop: vi.fn().mockResolvedValue(true),
	}),
	register: vi.fn().mockResolvedValue(true),
	unregister: vi.fn().mockResolvedValue(true),
	getAllAgents: vi.fn().mockResolvedValue(["agent-1", "agent-2", "agent-3"]),
});

// Mock task queue for Inngest functions
export const createMockTaskQueue = () => ({
	addTask: vi.fn().mockResolvedValue(true),
	getTask: vi.fn().mockResolvedValue({
		id: "task-123",
		type: "code-generation",
		status: "pending",
		priority: 2,
		payload: { code: "test" },
		requiredCapabilities: ["code_generation"],
		retryCount: 0,
		maxRetries: 3,
		timeoutMs: 30000,
	}),
	updateTaskStatus: vi.fn().mockResolvedValue(true),
});

// Mock message broker for Inngest functions
export const createMockMessageBroker = () => ({
	publish: vi.fn().mockResolvedValue(true),
	subscribe: vi.fn().mockResolvedValue(true),
	unsubscribe: vi.fn().mockResolvedValue(true),
});

// Mock ElectricSQL sync manager
export const createMockSyncManager = () => ({
	initialize: vi.fn().mockResolvedValue(true),
	sync: vi.fn().mockResolvedValue(true),
	disconnect: vi.fn().mockResolvedValue(true),
});

// Agent system mocks
export const createMockAgentSystem = () => ({
	agentRegistry: createMockAgentRegistry(),
	taskQueue: createMockTaskQueue(),
	messageBroker: createMockMessageBroker(),
	syncManager: createMockSyncManager(),
});

// Test data factories
export const createMockTaskEvent = (overrides: any = {}) => ({
	taskId: "task-123",
	type: "code-generation",
	priority: 2,
	payload: { code: "test" },
	requiredCapabilities: ["code_generation"],
	timeoutMs: 30000,
	maxRetries: 3,
	...overrides,
});

export const createMockAgentEvent = (overrides: any = {}) => ({
	agentId: "agent-123",
	capabilities: ["code_analysis", "code_generation"],
	maxConcurrentTasks: 3,
	registeredAt: new Date().toISOString(),
	...overrides,
});

export const createMockHeartbeatEvent = (overrides: any = {}) => ({
	agentId: "agent-123",
	status: "idle",
	currentTasks: [],
	metrics: {
		tasksCompleted: 10,
		tasksInProgress: 1,
		tasksFailed: 0,
		averageTaskDurationMs: 5000,
	},
	timestamp: new Date().toISOString(),
	...overrides,
});

export const createMockMessageEvent = (overrides: any = {}) => ({
	messageId: "msg-123",
	from: "agent-1",
	to: "agent-2",
	type: "task_result",
	payload: { result: "success" },
	priority: 2,
	timestamp: new Date().toISOString(),
	...overrides,
});

// Setup function for test environment
export const setupInngestMocks = () => {
	const inngest = createMockInngest();
	const agentSystem = createMockAgentSystem();
	const functions = createMockInngestFunctions(agentSystem);
	const handler = createMockInngestHandler();

	// Create a spy for the Inngest constructor
	const InngestSpy = vi.fn().mockImplementation(() => inngest);

	// Mock the Inngest module
	vi.doMock("inngest", () => ({
		Inngest: InngestSpy,
		serve: vi.fn().mockImplementation(() => handler),
	}));

	// Mock agent system modules
	vi.doMock("../../../../../src/agents/core/AgentRegistry", () => ({
		AgentRegistry: vi.fn().mockImplementation(() => agentSystem.agentRegistry),
	}));

	vi.doMock("../../../../../src/agents/core/TaskQueue", () => ({
		TaskQueue: vi.fn().mockImplementation(() => agentSystem.taskQueue),
	}));

	vi.doMock("../../../../../src/agents/communication/MessageBroker", () => ({
		MessageBroker: vi.fn().mockImplementation(() => agentSystem.messageBroker),
	}));

	vi.doMock("../../../apps/server/src/db/electric", () => ({
		syncManager: agentSystem.syncManager,
	}));

	return {
		inngest,
		functions,
		handler,
		agentSystem,
		InngestSpy,
	};
};
