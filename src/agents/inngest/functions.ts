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

// Helper functions (these would be implemented based on your storage solution)
async function findAgentsByCapabilities(capabilities: string[]): Promise<any[]> {
  // Implementation depends on your agent registry
  return [];
}

async function selectBestAgent(agents: any[], priority: number): Promise<any> {
  // Implement load balancing logic
  return agents[0];
}

async function assignTaskToAgent(taskId: string, agentId: string): Promise<{ success: boolean }> {
  // Implementation depends on your agent communication system
  return { success: true };
}

async function queueTask(task: Task): Promise<void> {
  // Implementation depends on your task queue
}

async function getTaskStatus(taskId: string): Promise<TaskStatus> {
  // Implementation depends on your storage
  return TaskStatus.IN_PROGRESS;
}

async function cancelTaskOnAgent(agentId: string, taskId: string): Promise<void> {
  // Implementation depends on your agent communication system
}

async function reassignTask(taskId: string): Promise<void> {
  // Re-trigger task creation event
}

async function getTask(taskId: string): Promise<Task | null> {
  // Implementation depends on your storage
  return null;
}

async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
  // Implementation depends on your storage
}

async function retryTaskAssignment(taskId: string, maxRetries: number): Promise<void> {
  // Implementation depends on your retry logic
}

async function updateAgentStatus(agentId: string, status: string, metrics: any): Promise<void> {
  // Implementation depends on your agent registry
}

async function createNewAgent(config: any): Promise<void> {
  // Implementation depends on your agent creation system
}

async function gracefullyRemoveAgents(count: number): Promise<string[]> {
  // Implementation depends on your agent management system
  return [];
}

async function getAllActiveAgents(): Promise<string[]> {
  // Implementation depends on your agent registry
  return [];
}

async function deliverMessage(agentId: string, message: any): Promise<boolean> {
  // Implementation depends on your message delivery system
  return true;
}