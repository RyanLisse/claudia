/**
 * Inngest functions for AI Agent orchestration
 */

import { inngest } from './client.js';
import type { 
  Task, 
  TaskStatus, 
  AgentStatus,
  Priority,
  AgentCapability 
} from '../types/agent.js';

/**
 * Task assignment and routing function
 */
export const assignTask = inngest.createFunction(
  { id: 'assign-task', name: 'Assign Task to Agent' },
  { event: 'agent/task.created' },
  async ({ event, step }) => {
    const { taskId, type, priority, payload, requiredCapabilities, timeoutMs, maxRetries } = event.data;
    
    // Step 1: Find available agents
    const availableAgents = await step.run('find-available-agents', async () => {
      // This would query your agent registry
      return await findAgentsByCapabilities(requiredCapabilities);
    });
    
    if (availableAgents.length === 0) {
      // No agents available - queue the task
      await step.run('queue-task', async () => {
        await queueTask({
          id: taskId,
          type,
          priority,
          payload,
          requiredCapabilities,
          status: TaskStatus.PENDING,
          createdAt: new Date(),
          updatedAt: new Date(),
          retryCount: 0,
          maxRetries,
          timeoutMs,
        } as Task);
      });
      
      return { status: 'queued', taskId };
    }
    
    // Step 2: Select best agent based on load balancing
    const selectedAgent = await step.run('select-agent', async () => {
      return selectBestAgent(availableAgents, priority);
    });
    
    // Step 3: Assign task to agent
    const assignmentResult = await step.run('assign-to-agent', async () => {
      return await assignTaskToAgent(taskId, selectedAgent.id);
    });
    
    if (assignmentResult.success) {
      // Send assignment event
      await step.sendEvent('task-assigned', {
        name: 'agent/task.assigned',
        data: {
          taskId,
          agentId: selectedAgent.id,
          assignedAt: new Date().toISOString(),
        }
      });
      
      // Schedule task timeout
      await step.sendEvent('schedule-timeout', {
        name: 'agent/task.timeout',
        data: { taskId, agentId: selectedAgent.id },
        ts: new Date(Date.now() + timeoutMs).getTime(),
      });
      
      return { status: 'assigned', taskId, agentId: selectedAgent.id };
    } else {
      // Assignment failed - retry or queue
      await step.run('handle-assignment-failure', async () => {
        await retryTaskAssignment(taskId, maxRetries);
      });
      
      return { status: 'assignment_failed', taskId };
    }
  }
);

/**
 * Task execution monitoring and timeout handling
 */
export const monitorTaskExecution = inngest.createFunction(
  { id: 'monitor-task-execution', name: 'Monitor Task Execution' },
  { event: 'agent/task.timeout' },
  async ({ event, step }) => {
    const { taskId, agentId } = event.data;
    
    // Check if task is still running
    const taskStatus = await step.run('check-task-status', async () => {
      return await getTaskStatus(taskId);
    });
    
    if (taskStatus === TaskStatus.IN_PROGRESS) {
      // Task timed out - cancel and reassign
      await step.run('cancel-timed-out-task', async () => {
        await cancelTaskOnAgent(agentId, taskId);
      });
      
      // Send task failure event
      await step.sendEvent('task-timeout', {
        name: 'agent/task.failed',
        data: {
          taskId,
          agentId,
          error: 'Task execution timeout',
          retryCount: 0,
          failedAt: new Date().toISOString(),
        }
      });
      
      // Attempt to reassign if retries available
      await step.run('reassign-task', async () => {
        await reassignTask(taskId);
      });
    }
    
    return { taskId, status: taskStatus };
  }
);

/**
 * Task retry mechanism
 */
export const retryFailedTask = inngest.createFunction(
  { id: 'retry-failed-task', name: 'Retry Failed Task' },
  { event: 'agent/task.failed' },
  async ({ event, step }) => {
    const { taskId, agentId, error, retryCount } = event.data;
    
    const task = await step.run('get-task-details', async () => {
      return await getTask(taskId);
    });
    
    if (!task || retryCount >= task.maxRetries) {
      // Max retries reached - mark as permanently failed
      await step.run('mark-permanently-failed', async () => {
        await updateTaskStatus(taskId, TaskStatus.FAILED);
      });
      
      return { taskId, status: 'permanently_failed', retryCount };
    }
    
    // Calculate backoff delay
    const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30s
    
    // Schedule retry with exponential backoff
    await step.sendEvent('schedule-retry', {
      name: 'agent/task.created',
      data: {
        taskId,
        type: task.type,
        priority: task.priority,
        payload: task.payload,
        requiredCapabilities: task.requiredCapabilities,
        timeoutMs: task.timeoutMs,
        maxRetries: task.maxRetries,
      },
      ts: new Date(Date.now() + backoffDelay).getTime(),
    });
    
    return { taskId, status: 'retry_scheduled', retryCount: retryCount + 1 };
  }
);

/**
 * Agent health monitoring
 */
export const monitorAgentHealth = inngest.createFunction(
  { id: 'monitor-agent-health', name: 'Monitor Agent Health' },
  { event: 'agent/agent.heartbeat' },
  async ({ event, step }) => {
    const { agentId, status, currentTasks, metrics, timestamp } = event.data;
    
    // Update agent status in registry
    await step.run('update-agent-status', async () => {
      await updateAgentStatus(agentId, status, metrics);
    });
    
    // Check for health issues
    const healthIssues = await step.run('check-health-issues', async () => {
      const issues = [];
      
      // High failure rate check
      if (metrics.tasksFailed > 0 && metrics.tasksCompleted > 0) {
        const failureRate = metrics.tasksFailed / (metrics.tasksCompleted + metrics.tasksFailed);
        if (failureRate > 0.2) { // 20% failure rate threshold
          issues.push({
            type: 'high_failure_rate',
            severity: 'medium',
            message: `Agent ${agentId} has high failure rate: ${(failureRate * 100).toFixed(1)}%`,
          });
        }
      }
      
      // Performance degradation check
      if (metrics.averageTaskDurationMs > 60000) { // 1 minute threshold
        issues.push({
          type: 'performance_degradation',
          severity: 'low',
          message: `Agent ${agentId} average task duration is high: ${metrics.averageTaskDurationMs}ms`,
        });
      }
      
      return issues;
    });
    
    // Send alerts for health issues
    for (const issue of healthIssues) {
      await step.sendEvent(`health-alert-${issue.type}`, {
        name: 'agent/monitoring.alert',
        data: {
          alertType: issue.type as any,
          agentId,
          severity: issue.severity as any,
          message: issue.message,
          metadata: { metrics, timestamp },
          timestamp: new Date().toISOString(),
        }
      });
    }
    
    return { agentId, healthStatus: healthIssues.length === 0 ? 'healthy' : 'degraded' };
  }
);

/**
 * Agent scaling function
 */
export const scaleAgents = inngest.createFunction(
  { id: 'scale-agents', name: 'Scale Agent Pool' },
  { event: 'agent/system.scale' },
  async ({ event, step }) => {
    const { targetAgentCount, currentAgentCount } = event.data;
    
    if (targetAgentCount > currentAgentCount) {
      // Scale up - create new agents
      const agentsToCreate = targetAgentCount - currentAgentCount;
      
      await step.run('create-agents', async () => {
        for (let i = 0; i < agentsToCreate; i++) {
          await createNewAgent({
            capabilities: [AgentCapability.CODE_ANALYSIS, AgentCapability.CODE_GENERATION],
            maxConcurrentTasks: 3,
          });
        }
      });
      
      return { action: 'scale_up', agentsCreated: agentsToCreate };
    } else if (targetAgentCount < currentAgentCount) {
      // Scale down - gracefully stop excess agents
      const agentsToRemove = currentAgentCount - targetAgentCount;
      
      const removedAgents = await step.run('remove-agents', async () => {
        return await gracefullyRemoveAgents(agentsToRemove);
      });
      
      return { action: 'scale_down', agentsRemoved: removedAgents.length };
    }
    
    return { action: 'no_change', currentAgentCount };
  }
);

/**
 * Message routing between agents
 */
export const routeMessage = inngest.createFunction(
  { id: 'route-message', name: 'Route Inter-Agent Message' },
  { event: 'agent/message.sent' },
  async ({ event, step }) => {
    const { messageId, from, to, type, payload, priority, correlationId } = event.data;
    
    if (to === 'broadcast') {
      // Broadcast to all agents
      const allAgents = await step.run('get-all-agents', async () => {
        return await getAllActiveAgents();
      });
      
      await step.run('broadcast-message', async () => {
        for (const agentId of allAgents) {
          if (agentId !== from) {
            await deliverMessage(agentId, {
              id: messageId,
              from,
              to: agentId,
              type,
              payload,
              priority,
              timestamp: new Date(),
              correlationId,
            });
          }
        }
      });
      
      return { messageId, delivered: allAgents.length - 1 };
    } else {
      // Direct message
      const delivered = await step.run('deliver-message', async () => {
        return await deliverMessage(to, {
          id: messageId,
          from,
          to,
          type,
          payload,
          priority,
          timestamp: new Date(),
          correlationId,
        });
      });
      
      return { messageId, delivered: delivered ? 1 : 0 };
    }
  }
);

// Helper functions - Enhanced implementations
import { AgentRegistry } from '../core/AgentRegistry.js';
import { TaskQueue } from '../core/TaskQueue.js';
import { AgentOrchestrator } from '../core/AgentOrchestrator.js';
import { MessageBroker } from '../communication/MessageBroker.js';
import { syncManager } from '../../../frontend/apps/server/src/db/electric.js';

// Global instances (these would be injected in real implementation)
let globalAgentRegistry: AgentRegistry;
let globalTaskQueue: TaskQueue;
let globalOrchestrator: AgentOrchestrator;
let globalMessageBroker: MessageBroker;

// Initialize global instances
export function initializeGlobalAgentSystem() {
  globalAgentRegistry = new AgentRegistry();
  globalTaskQueue = new TaskQueue(1000);
  globalMessageBroker = new MessageBroker();
  globalOrchestrator = new AgentOrchestrator(
    globalAgentRegistry,
    globalTaskQueue,
    { getSystemHealth: async () => ({ healthy: true }) } as any,
    globalMessageBroker
  );
}

async function findAgentsByCapabilities(capabilities: string[]): Promise<any[]> {
  if (!globalAgentRegistry) initializeGlobalAgentSystem();
  
  const agents = [];
  for (const capability of capabilities) {
    const agentIds = await globalAgentRegistry.findByCapability(capability as any);
    for (const agentId of agentIds) {
      const agentInfo = globalAgentRegistry.getAgentInfo(agentId);
      if (agentInfo && agentInfo.currentStatus === 'idle') {
        agents.push({
          id: agentId,
          info: agentInfo,
          capabilities: agentInfo.capabilities,
          currentLoad: agentInfo.currentTasks.length
        });
      }
    }
  }
  
  return agents.sort((a, b) => a.currentLoad - b.currentLoad);
}

async function selectBestAgent(agents: any[], priority: number): Promise<any> {
  if (agents.length === 0) {
    throw new Error('No available agents');
  }
  
  // Load balancing algorithm based on:
  // 1. Current task load
  // 2. Agent performance metrics
  // 3. Task priority
  
  const scoredAgents = agents.map(agent => {
    const loadScore = 1 / (agent.currentLoad + 1); // Lower load = higher score
    const performanceScore = agent.info.metrics?.tasksCompleted || 0;
    const priorityBonus = priority > 2 ? 1.2 : 1.0; // Boost for high priority
    
    return {
      ...agent,
      score: (loadScore * 0.5 + performanceScore * 0.3) * priorityBonus
    };
  });
  
  return scoredAgents.sort((a, b) => b.score - a.score)[0];
}

async function assignTaskToAgent(taskId: string, agentId: string): Promise<{ success: boolean }> {
  if (!globalAgentRegistry || !globalTaskQueue) {
    initializeGlobalAgentSystem();
  }
  
  try {
    // Get the task from the queue
    const task = await globalTaskQueue.getTask(taskId);
    if (!task) {
      return { success: false };
    }
    
    // Get the agent
    const agent = await globalAgentRegistry.getAgent(agentId);
    if (!agent) {
      return { success: false };
    }
    
    // Assign the task
    const assigned = await agent.assignTask(task);
    
    if (assigned) {
      // Update task status
      await globalTaskQueue.updateTaskStatus(taskId, TaskStatus.IN_PROGRESS);
      
      // Store assignment in ElectricSQL for real-time sync
      await syncManager.initialize();
      // Would update assignment tables here
      
      return { success: true };
    }
    
    return { success: false };
  } catch (error) {
    console.error('Failed to assign task to agent:', error);
    return { success: false };
  }
}

async function queueTask(task: Task): Promise<void> {
  if (!globalTaskQueue) initializeGlobalAgentSystem();
  
  await globalTaskQueue.addTask(task);
  
  // Sync to ElectricSQL for real-time updates
  try {
    await syncManager.initialize();
    // Store task in synchronized database
    // Would use electric DB here for real-time sync
  } catch (error) {
    console.error('Failed to sync task to ElectricSQL:', error);
  }
}

async function getTaskStatus(taskId: string): Promise<TaskStatus> {
  if (!globalTaskQueue) initializeGlobalAgentSystem();
  
  const task = await globalTaskQueue.getTask(taskId);
  return task?.status || TaskStatus.FAILED;
}

async function cancelTaskOnAgent(agentId: string, taskId: string): Promise<void> {
  if (!globalAgentRegistry) initializeGlobalAgentSystem();
  
  const agent = await globalAgentRegistry.getAgent(agentId);
  if (agent) {
    await agent.cancelTask(taskId);
  }
}

async function reassignTask(taskId: string): Promise<void> {
  if (!globalTaskQueue) initializeGlobalAgentSystem();
  
  const task = await globalTaskQueue.getTask(taskId);
  if (task) {
    // Reset task status and increment retry count
    task.status = TaskStatus.PENDING;
    task.retryCount = (task.retryCount || 0) + 1;
    
    // Re-queue the task
    await queueTask(task);
  }
}

async function getTask(taskId: string): Promise<Task | null> {
  if (!globalTaskQueue) initializeGlobalAgentSystem();
  
  return await globalTaskQueue.getTask(taskId);
}

async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
  if (!globalTaskQueue) initializeGlobalAgentSystem();
  
  await globalTaskQueue.updateTaskStatus(taskId, status);
}

async function retryTaskAssignment(taskId: string, maxRetries: number): Promise<void> {
  const task = await getTask(taskId);
  if (task && (task.retryCount || 0) < maxRetries) {
    await reassignTask(taskId);
  } else {
    await updateTaskStatus(taskId, TaskStatus.FAILED);
  }
}

async function updateAgentStatus(agentId: string, status: string, metrics: any): Promise<void> {
  if (!globalAgentRegistry) initializeGlobalAgentSystem();
  
  const agentInfo = globalAgentRegistry.getAgentInfo(agentId);
  if (agentInfo) {
    agentInfo.currentStatus = status as any;
    agentInfo.metrics = { ...agentInfo.metrics, ...metrics };
    agentInfo.lastHeartbeat = new Date();
  }
}

async function createNewAgent(config: any): Promise<void> {
  // Import agent types
  const { createCoderAgent } = await import('../examples/CoderAgent.js');
  const { createResearcherAgent } = await import('../examples/ResearcherAgent.js');
  const { createAnalystAgent } = await import('../examples/AnalystAgent.js');
  
  if (!globalAgentRegistry) initializeGlobalAgentSystem();
  
  let agent;
  const agentType = config.type || 'coder';
  
  switch (agentType) {
    case 'coder':
      agent = createCoderAgent(config);
      break;
    case 'researcher':
      agent = createResearcherAgent(config);
      break;
    case 'analyst':
      agent = createAnalystAgent(config);
      break;
    default:
      agent = createCoderAgent(config);
  }
  
  await agent.start();
  await globalAgentRegistry.register(agent);
  
  console.log(`Created new ${agentType} agent: ${agent.id}`);
}

async function gracefullyRemoveAgents(count: number): Promise<string[]> {
  if (!globalAgentRegistry) initializeGlobalAgentSystem();
  
  const allAgents = await globalAgentRegistry.getAllAgents();
  const removedAgents = [];
  
  // Sort by current load (remove least busy agents first)
  const sortedAgents = [];
  for (const agentId of allAgents) {
    const agentInfo = globalAgentRegistry.getAgentInfo(agentId);
    if (agentInfo) {
      sortedAgents.push({ id: agentId, load: agentInfo.currentTasks.length });
    }
  }
  
  sortedAgents.sort((a, b) => a.load - b.load);
  
  for (let i = 0; i < Math.min(count, sortedAgents.length); i++) {
    const agentId = sortedAgents[i].id;
    const agent = await globalAgentRegistry.getAgent(agentId);
    
    if (agent) {
      await agent.stop();
      await globalAgentRegistry.unregister(agentId);
      removedAgents.push(agentId);
    }
  }
  
  return removedAgents;
}

async function getAllActiveAgents(): Promise<string[]> {
  if (!globalAgentRegistry) initializeGlobalAgentSystem();
  
  const allAgents = await globalAgentRegistry.getAllAgents();
  const activeAgents = [];
  
  for (const agentId of allAgents) {
    const agentInfo = globalAgentRegistry.getAgentInfo(agentId);
    if (agentInfo && agentInfo.currentStatus !== 'offline') {
      activeAgents.push(agentId);
    }
  }
  
  return activeAgents;
}

async function deliverMessage(agentId: string, message: any): Promise<boolean> {
  if (!globalAgentRegistry || !globalMessageBroker) {
    initializeGlobalAgentSystem();
  }
  
  try {
    const agent = await globalAgentRegistry.getAgent(agentId);
    if (agent) {
      await agent.handleMessage(message);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to deliver message:', error);
    return false;
  }
}