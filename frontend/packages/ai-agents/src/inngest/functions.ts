import { inngest } from './client';
import { CoderAgent, CoderAgentConfig, CodeGenerationTask } from '../agents/CoderAgent';
import type { AgentTask, AgentMetrics, AgentStatus } from '../types';
import { z } from 'zod';

// Event schemas for type safety
const TaskExecutionEventSchema = z.object({
  taskId: z.string(),
  agentId: z.string(),
  sessionId: z.string(),
  task: z.object({
    id: z.string(),
    type: z.string(),
    payload: z.any(),
    priority: z.enum(['low', 'normal', 'high', 'critical']),
    timeoutMs: z.number().default(300000),
    retries: z.number().default(0),
    maxRetries: z.number().default(3)
  }),
  config: z.object({
    id: z.string(),
    name: z.string(),
    openai: z.object({
      apiKey: z.string(),
      model: z.string().optional(),
      temperature: z.number().optional(),
      maxTokens: z.number().optional(),
      streaming: z.boolean().optional()
    }),
    codeGeneration: z.object({
      maxFileSize: z.number().optional(),
      supportedLanguages: z.array(z.string()).optional(),
      includeTests: z.boolean().optional(),
      includeDocumentation: z.boolean().optional()
    }).optional()
  }).passthrough()
});

const AgentLifecycleEventSchema = z.object({
  agentId: z.string(),
  sessionId: z.string(),
  action: z.enum(['start', 'stop', 'restart', 'health-check']),
  config: z.object({
    id: z.string(),
    name: z.string(),
    openai: z.object({
      apiKey: z.string(),
      model: z.string().optional(),
      temperature: z.number().optional(),
      maxTokens: z.number().optional(),
      streaming: z.boolean().optional()
    }),
    codeGeneration: z.object({
      maxFileSize: z.number().optional(),
      supportedLanguages: z.array(z.string()).optional(),
      includeTests: z.boolean().optional(),
      includeDocumentation: z.boolean().optional()
    }).optional()
  }).passthrough()
});

const TaskStatusEventSchema = z.object({
  taskId: z.string(),
  agentId: z.string(),
  sessionId: z.string(),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed', 'cancelled', 'timeout']),
  result: z.any().optional(),
  error: z.string().optional(),
  metrics: z.object({
    startTime: z.number(),
    endTime: z.number().optional(),
    duration: z.number().optional(),
    tokensUsed: z.number().optional(),
    memoryUsed: z.number().optional()
  }).optional()
});

// In-memory agent registry for this demo
// In production, this would be a proper database or Redis
const agentRegistry = new Map<string, CoderAgent>();

// Helper function to get or create agent
async function getOrCreateAgent(agentId: string, config: CoderAgentConfig): Promise<CoderAgent> {
  let agent = agentRegistry.get(agentId);
  
  if (!agent) {
    agent = new CoderAgent(config);
    agentRegistry.set(agentId, agent);
    
    // Set up event forwarding to Inngest
    setupAgentEventForwarding(agent);
  }
  
  return agent;
}

// Helper function to set up event forwarding
function setupAgentEventForwarding(agent: CoderAgent) {
  // Forward agent events to Inngest
  agent.on('agent.started', async (event) => {
    await inngest.send({
      name: 'agent/lifecycle',
      data: {
        agentId: agent.id,
        action: 'started',
        event,
        timestamp: new Date().toISOString()
      }
    });
  });

  agent.on('agent.stopped', async (event) => {
    await inngest.send({
      name: 'agent/lifecycle',
      data: {
        agentId: agent.id,
        action: 'stopped',
        event,
        timestamp: new Date().toISOString()
      }
    });
  });

  agent.on('agent.error', async (event) => {
    await inngest.send({
      name: 'agent/error',
      data: {
        agentId: agent.id,
        error: event.data.error,
        event,
        timestamp: new Date().toISOString()
      }
    });
  });

  agent.on('task.started', async (event) => {
    await inngest.send({
      name: 'task/status',
      data: {
        taskId: event.taskId,
        agentId: agent.id,
        status: 'in_progress',
        event,
        timestamp: new Date().toISOString()
      }
    });
  });

  agent.on('task.completed', async (event) => {
    await inngest.send({
      name: 'task/status',
      data: {
        taskId: event.taskId,
        agentId: agent.id,
        status: 'completed',
        result: event.data.result,
        metrics: {
          duration: event.data.duration,
          tokensUsed: event.data.tokensUsed
        },
        event,
        timestamp: new Date().toISOString()
      }
    });
  });

  agent.on('task.failed', async (event) => {
    await inngest.send({
      name: 'task/status',
      data: {
        taskId: event.taskId,
        agentId: agent.id,
        status: 'failed',
        error: event.data.error,
        event,
        timestamp: new Date().toISOString()
      }
    });
  });

  agent.on('task.progress', async (event) => {
    await inngest.send({
      name: 'task/progress',
      data: {
        taskId: event.taskId || event.data.taskId,
        agentId: agent.id,
        progress: event.data.progress,
        status: event.data.status,
        partialContent: event.data.partialContent,
        event,
        timestamp: new Date().toISOString()
      }
    });
  });
}

// Main task execution function
export const executeCodeTask = inngest.createFunction(
  { 
    id: 'execute-code-task',
    name: 'Execute Code Generation Task',
    retries: 3,
    concurrency: {
      limit: 10,
      key: 'event.data.agentId'
    }
  },
  { event: 'task/execute' },
  async ({ event, step, logger }) => {
    const { data } = event;
    
    // Validate event data
    const parsedData = TaskExecutionEventSchema.parse(data);
    const { taskId, agentId, sessionId, task, config } = parsedData;
    
    logger.info('Starting task execution', { taskId, agentId, sessionId });
    
    // Get or create agent
    const agent = await step.run('get-or-create-agent', async () => {
      return await getOrCreateAgent(agentId, config as CoderAgentConfig);
    });
    
    // Ensure agent is started
    await step.run('ensure-agent-started', async () => {
      if (agent.status !== AgentStatus.IDLE && agent.status !== AgentStatus.BUSY) {
        await agent.start();
      }
    });
    
    // Execute the task
    const result = await step.run('execute-task', async () => {
      try {
        const agentTask: CodeGenerationTask = {
          ...task,
          sessionId,
          agentId,
          createdAt: new Date(),
          updatedAt: new Date()
        } as CodeGenerationTask;
        
        // Check if agent can handle the task
        if (!agent.canHandle(agentTask)) {
          throw new Error(`Agent ${agentId} cannot handle task type: ${task.type}`);
        }
        
        // Execute the task
        const taskResult = await agent.execute(agentTask);
        
        logger.info('Task executed successfully', { 
          taskId, 
          agentId, 
          tokensUsed: taskResult.metadata.tokensUsed,
          confidence: taskResult.metadata.confidence 
        });
        
        return taskResult;
        
      } catch (error) {
        logger.error('Task execution failed', { 
          taskId, 
          agentId, 
          error: error.message,
          stack: error.stack 
        });
        
        throw error;
      }
    });
    
    // Send completion event
    await step.run('send-completion-event', async () => {
      await inngest.send({
        name: 'task/completed',
        data: {
          taskId,
          agentId,
          sessionId,
          result,
          timestamp: new Date().toISOString()
        }
      });
    });
    
    return { taskId, agentId, sessionId, result };
  }
);

// Agent lifecycle management function
export const manageAgentLifecycle = inngest.createFunction(
  { 
    id: 'manage-agent-lifecycle',
    name: 'Manage Agent Lifecycle',
    retries: 2
  },
  { event: 'agent/manage' },
  async ({ event, step, logger }) => {
    const { data } = event;
    
    // Validate event data
    const parsedData = AgentLifecycleEventSchema.parse(data);
    const { agentId, sessionId, action, config } = parsedData;
    
    logger.info('Managing agent lifecycle', { agentId, sessionId, action });
    
    // Get or create agent
    const agent = await step.run('get-or-create-agent', async () => {
      return await getOrCreateAgent(agentId, config as CoderAgentConfig);
    });
    
    // Perform lifecycle action
    const result = await step.run('perform-lifecycle-action', async () => {
      try {
        switch (action) {
          case 'start':
            await agent.start();
            break;
          case 'stop':
            await agent.stop();
            break;
          case 'restart':
            await agent.restart();
            break;
          case 'health-check':
            const isHealthy = await agent.healthCheck();
            return { healthy: isHealthy };
          default:
            throw new Error(`Unknown lifecycle action: ${action}`);
        }
        
        return { 
          agentId, 
          action, 
          status: agent.status,
          timestamp: new Date().toISOString()
        };
        
      } catch (error) {
        logger.error('Lifecycle action failed', { 
          agentId, 
          action, 
          error: error.message 
        });
        
        throw error;
      }
    });
    
    return result;
  }
);

// Task status update function
export const updateTaskStatus = inngest.createFunction(
  { 
    id: 'update-task-status',
    name: 'Update Task Status',
    retries: 1
  },
  { event: 'task/status' },
  async ({ event, step, logger }) => {
    const { data } = event;
    
    // Validate event data
    const parsedData = TaskStatusEventSchema.parse(data);
    const { taskId, agentId, sessionId, status, result, error, metrics } = parsedData;
    
    logger.info('Updating task status', { taskId, agentId, sessionId, status });
    
    // Store task status (in production, this would be a database)
    await step.run('store-task-status', async () => {
      // This would typically update a database
      console.log('Task status updated:', {
        taskId,
        agentId,
        sessionId,
        status,
        result,
        error,
        metrics,
        timestamp: new Date().toISOString()
      });
    });
    
    // Send notification if task failed
    if (status === 'failed' && error) {
      await step.run('send-failure-notification', async () => {
        await inngest.send({
          name: 'task/failed',
          data: {
            taskId,
            agentId,
            sessionId,
            error,
            timestamp: new Date().toISOString()
          }
        });
      });
    }
    
    return { taskId, agentId, status, timestamp: new Date().toISOString() };
  }
);

// Task progress tracking function
export const trackTaskProgress = inngest.createFunction(
  { 
    id: 'track-task-progress',
    name: 'Track Task Progress',
    retries: 1
  },
  { event: 'task/progress' },
  async ({ event, step, logger }) => {
    const { data } = event;
    const { taskId, agentId, progress, status, partialContent } = data;
    
    logger.info('Tracking task progress', { taskId, agentId, progress, status });
    
    // Store progress update (in production, this would be a database or cache)
    await step.run('store-progress-update', async () => {
      // This would typically update a database or send to WebSocket clients
      console.log('Task progress updated:', {
        taskId,
        agentId,
        progress,
        status,
        partialContent: partialContent ? partialContent.substring(0, 100) + '...' : undefined,
        timestamp: new Date().toISOString()
      });
    });
    
    return { taskId, agentId, progress, status, timestamp: new Date().toISOString() };
  }
);

// Agent metrics collection function
export const collectAgentMetrics = inngest.createFunction(
  { 
    id: 'collect-agent-metrics',
    name: 'Collect Agent Metrics',
    retries: 1
  },
  { event: 'agent/metrics' },
  async ({ event, step, logger }) => {
    const { data } = event;
    const { agentId, sessionId } = data;
    
    logger.info('Collecting agent metrics', { agentId, sessionId });
    
    // Get agent metrics
    const metrics = await step.run('get-agent-metrics', async () => {
      const agent = agentRegistry.get(agentId);
      
      if (!agent) {
        throw new Error(`Agent ${agentId} not found`);
      }
      
      return agent.getMetrics();
    });
    
    // Store metrics (in production, this would be a database)
    await step.run('store-agent-metrics', async () => {
      // This would typically store in a time-series database
      console.log('Agent metrics collected:', {
        agentId,
        sessionId,
        metrics,
        timestamp: new Date().toISOString()
      });
    });
    
    return { agentId, sessionId, metrics, timestamp: new Date().toISOString() };
  }
);

// Batch task processing function
export const processBatchTasks = inngest.createFunction(
  { 
    id: 'process-batch-tasks',
    name: 'Process Batch Tasks',
    retries: 2,
    concurrency: {
      limit: 5,
      key: 'event.data.sessionId'
    }
  },
  { event: 'tasks/batch' },
  async ({ event, step, logger }) => {
    const { data } = event;
    const { sessionId, tasks, config } = data;
    
    logger.info('Processing batch tasks', { sessionId, taskCount: tasks.length });
    
    // Process tasks in parallel
    const results = await step.run('process-tasks-parallel', async () => {
      const promises = tasks.map(async (task: any) => {
        try {
          // Send individual task execution event
          await inngest.send({
            name: 'task/execute',
            data: {
              taskId: task.id,
              agentId: task.agentId,
              sessionId,
              task,
              config
            }
          });
          
          return { taskId: task.id, status: 'queued' };
        } catch (error) {
          logger.error('Failed to queue task', { taskId: task.id, error: error.message });
          return { taskId: task.id, status: 'failed', error: error.message };
        }
      });
      
      return await Promise.all(promises);
    });
    
    return { sessionId, results, timestamp: new Date().toISOString() };
  }
);

// Cleanup function for stopped agents
export const cleanupStoppedAgents = inngest.createFunction(
  { 
    id: 'cleanup-stopped-agents',
    name: 'Cleanup Stopped Agents'
  },
  { cron: '0 */6 * * *' }, // Run every 6 hours
  async ({ step, logger }) => {
    logger.info('Running agent cleanup');
    
    const cleanupResult = await step.run('cleanup-agents', async () => {
      const agentsToCleanup: string[] = [];
      
      for (const [agentId, agent] of agentRegistry.entries()) {
        if (agent.status === AgentStatus.OFFLINE) {
          try {
            await agent.cleanup();
            agentsToCleanup.push(agentId);
          } catch (error) {
            logger.error('Failed to cleanup agent', { agentId, error: error.message });
          }
        }
      }
      
      // Remove cleaned up agents from registry
      agentsToCleanup.forEach(agentId => {
        agentRegistry.delete(agentId);
      });
      
      return { cleanedUp: agentsToCleanup.length, remaining: agentRegistry.size };
    });
    
    logger.info('Agent cleanup completed', cleanupResult);
    return cleanupResult;
  }
);

// Export utility functions for external use
export const agentUtils = {
  getAgent: (agentId: string) => agentRegistry.get(agentId),
  getAllAgents: () => Array.from(agentRegistry.values()),
  getAgentMetrics: (agentId: string) => {
    const agent = agentRegistry.get(agentId);
    return agent ? agent.getMetrics() : null;
  },
  getAgentStatus: (agentId: string) => {
    const agent = agentRegistry.get(agentId);
    return agent ? agent.status : null;
  }
};