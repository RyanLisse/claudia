/**
 * Main export file for the AI Agent System
 */

// Core types
export type {
  AgentId,
  TaskId,
  MessageId,
  AgentConfig,
  AgentMetrics,
  AgentStatus,
  Task,
  TaskResult,
  Message,
  TaskStatus,
  Priority,
  AgentCapability,
  AgentEvent,
  TaskEvent,
  OrchestrationConfig
} from '../types/agent.js';

// Interfaces
export type {
  IAgent,
  IAgentLifecycle,
  ITaskExecutor,
  IAgentCommunication,
  IAgentRegistry,
  IAgentMonitor,
  ITaskQueue,
  IAgentOrchestrator
} from '../interfaces/IAgent.js';

// Core classes
export { BaseAgent } from '../core/BaseAgent.js';
export { AgentRegistry, agentRegistry } from '../core/AgentRegistry.js';
export { TaskQueue } from '../core/TaskQueue.js';
export { AgentOrchestrator, orchestrator } from '../core/AgentOrchestrator.js';

// Communication
export { MessageBroker, messageBroker } from '../communication/MessageBroker.js';

// Monitoring
export { AgentMonitor, agentMonitor } from '../monitoring/AgentMonitor.js';

// Inngest integration
export { inngest } from '../inngest/client.js';
export {
  assignTask,
  monitorTaskExecution,
  retryFailedTask,
  monitorAgentHealth,
  scaleAgents,
  routeMessage
} from '../inngest/functions.js';

// Examples
export { CodeAnalysisAgent, createCodeAnalysisAgent } from '../examples/CodeAnalysisAgent.js';

/**
 * Initialize the AI Agent System
 */
export async function initializeAgentSystem(config?: {
  maxAgents?: number;
  taskQueueSize?: number;
  heartbeatIntervalMs?: number;
  taskTimeoutMs?: number;
}): Promise<{
  orchestrator: AgentOrchestrator;
  registry: AgentRegistry;
  monitor: AgentMonitor;
  messageBroker: MessageBroker;
}> {
  // Initialize orchestrator with config
  const orchestratorInstance = new AgentOrchestrator(config);
  await orchestratorInstance.initialize();

  return {
    orchestrator: orchestratorInstance,
    registry: agentRegistry,
    monitor: agentMonitor,
    messageBroker: messageBroker,
  };
}

/**
 * Shutdown the AI Agent System
 */
export async function shutdownAgentSystem(): Promise<void> {
  await orchestrator.shutdown();
  agentRegistry.shutdown();
  agentMonitor.shutdown();
}

/**
 * Quick setup function for common agent types
 */
export async function setupCommonAgents(): Promise<{
  codeAnalysisAgent: CodeAnalysisAgent;
}> {
  const codeAnalysisAgent = createCodeAnalysisAgent();
  await codeAnalysisAgent.start();
  await agentRegistry.register(codeAnalysisAgent);

  return {
    codeAnalysisAgent,
  };
}

/**
 * Utility function to create and submit a code analysis task
 */
export async function submitCodeAnalysisTask(
  codeContent: string,
  language: string,
  analysisTypes: ('complexity' | 'security' | 'performance' | 'style')[] = ['complexity']
): Promise<TaskId> {
  return await orchestrator.submitTask({
    type: 'code_analysis',
    priority: Priority.NORMAL,
    payload: {
      type: 'code_analysis',
      codeContent,
      language,
      analysisTypes,
      outputFormat: 'json'
    },
    requiredCapabilities: [AgentCapability.CODE_ANALYSIS],
    maxRetries: 2,
    timeoutMs: 120000, // 2 minutes
  });
}

/**
 * Utility function to get system health status
 */
export async function getSystemHealth(): Promise<{
  orchestratorStatus: any;
  agentHealth: Record<AgentId, boolean>;
  systemMetrics: any;
  queueStats: any;
}> {
  const [orchestratorStatus, agentHealth, systemMetrics] = await Promise.all([
    orchestrator.getStatus(),
    agentMonitor.getHealthStatus(),
    agentMonitor.getSystemMetrics(),
  ]);

  const taskQueue = new TaskQueue();
  const queueStats = taskQueue.getStats();

  return {
    orchestratorStatus,
    agentHealth,
    systemMetrics,
    queueStats,
  };
}