/**
 * tRPC router for AI Agent System API endpoints
 */

import { z } from 'zod';
import { router, publicProcedure } from '../lib/trpc';
// Import from agent system - using direct imports to avoid export issues
import { AgentOrchestrator } from '../../../../../src/agents/core/AgentOrchestrator';
import { AgentRegistry } from '../../../../../src/agents/core/AgentRegistry';  
import { AgentMonitor } from '../../../../../src/agents/monitoring/AgentMonitor';
import { MessageBroker } from '../../../../../src/agents/communication/MessageBroker';
import { TaskQueue } from '../../../../../src/agents/core/TaskQueue';
import { CodeAnalysisAgent } from '../../../../../src/agents/examples/CodeAnalysisAgent';
import { 
  AgentCapability,
  Priority,
  TaskStatus,
  AgentStatus
} from '../../../../../src/agents/types/agent';

// Initialize system components locally
const agentRegistry = new AgentRegistry();
const taskQueue = new TaskQueue(1000);
const agentMonitor = new AgentMonitor();
const messageBroker = new MessageBroker();
const orchestrator = new AgentOrchestrator(
  agentRegistry,
  taskQueue,
  agentMonitor,
  messageBroker
);

// Helper functions
async function getSystemHealth() {
  const registryStats = agentRegistry.getStats();
  const queueStats = taskQueue.getStats();
  const monitorHealth = agentMonitor.getSystemHealth();
  
  return {
    agentHealth: {
      totalAgents: registryStats.totalAgents,
      activeAgents: registryStats.activeAgents,
      idleAgents: registryStats.idleAgents,
      busyAgents: registryStats.busyAgents,
      errorAgents: registryStats.errorAgents,
    },
    taskHealth: {
      queueSize: queueStats.queueSize,
      processingTasks: queueStats.processingTasks,
      completedTasks: queueStats.completedTasks,
      failedTasks: queueStats.failedTasks,
    },
    monitorHealth,
    timestamp: new Date().toISOString(),
  };
}

function createCodeAnalysisAgent(): CodeAnalysisAgent {
  return new CodeAnalysisAgent(`agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
}

async function submitCodeAnalysisTask(
  codeContent: string,
  language: string,
  analysisTypes: string[] = ['complexity']
): Promise<string> {
  const task = {
    id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'code_analysis',
    priority: 1,
    payload: {
      codeContent,
      language,
      analysisTypes,
    },
    requiredCapabilities: ['CODE_ANALYSIS'],
    maxRetries: 3,
    timeoutMs: 120000,
    createdAt: new Date(),
    status: 'pending' as const,
  };

  return orchestrator.submitTask(task);
}

// Input validation schemas
const createAgentSchema = z.object({
  type: z.enum(['code-analysis', 'testing', 'documentation']),
  name: z.string().optional(),
  capabilities: z.array(z.nativeEnum(AgentCapability)).optional(),
  maxConcurrentTasks: z.number().min(1).max(10).default(3),
});

const submitTaskSchema = z.object({
  type: z.string(),
  priority: z.nativeEnum(Priority).default(Priority.NORMAL),
  payload: z.record(z.any()),
  requiredCapabilities: z.array(z.nativeEnum(AgentCapability)),
  maxRetries: z.number().min(0).max(5).default(3),
  timeoutMs: z.number().min(5000).max(600000).default(120000),
});

const codeAnalysisSchema = z.object({
  codeContent: z.string().min(1),
  language: z.string(),
  analysisTypes: z.array(z.enum(['complexity', 'security', 'performance', 'style']))
    .default(['complexity']),
});

const agentIdSchema = z.object({
  agentId: z.string(),
});

const taskIdSchema = z.object({
  taskId: z.string(),
});

export const agentsRouter = router({
  // System management endpoints
  getSystemStatus: publicProcedure
    .query(async () => {
      const [orchestratorStatus, systemHealth, detailedStatus] = await Promise.all([
        orchestrator.getStatus(),
        getSystemHealth(),
        orchestrator.getDetailedStatus(),
      ]);

      return {
        orchestrator: orchestratorStatus,
        health: systemHealth,
        detailed: detailedStatus,
        timestamp: new Date().toISOString(),
      };
    }),

  initializeSystem: publicProcedure
    .input(z.object({
      maxAgents: z.number().min(1).max(100).default(10),
      taskQueueSize: z.number().min(10).max(10000).default(1000),
      heartbeatIntervalMs: z.number().min(10000).max(300000).default(30000),
    }))
    .mutation(async ({ input }) => {
      await orchestrator.initialize();
      return {
        success: true,
        config: input,
        message: 'AI Agent System initialized successfully',
      };
    }),

  shutdownSystem: publicProcedure
    .mutation(async () => {
      await orchestrator.shutdown();
      return {
        success: true,
        message: 'AI Agent System shut down successfully',
      };
    }),

  // Agent management endpoints
  createAgent: publicProcedure
    .input(createAgentSchema)
    .mutation(async ({ input }) => {
      let agent;
      
      switch (input.type) {
        case 'code-analysis':
          agent = createCodeAnalysisAgent();
          break;
        default:
          throw new Error(`Unsupported agent type: ${input.type}`);
      }

      await agent.start();
      await agentRegistry.register(agent);
      await agentMonitor.startMonitoring(agent.id);
      messageBroker.registerAgent(agent.id);

      return {
        agentId: agent.id,
        type: input.type,
        status: agent.getStatus(),
        capabilities: agent.config.capabilities,
        created: new Date().toISOString(),
      };
    }),

  listAgents: publicProcedure
    .input(z.object({
      status: z.nativeEnum(AgentStatus).optional(),
      capability: z.nativeEnum(AgentCapability).optional(),
    }).optional())
    .query(async ({ input }) => {
      let agentIds: string[];

      if (input?.status) {
        agentIds = await agentRegistry.findByStatus(input.status);
      } else if (input?.capability) {
        agentIds = await agentRegistry.findByCapability(input.capability);
      } else {
        agentIds = await agentRegistry.getAllAgents();
      }

      const agents = await Promise.all(
        agentIds.map(async (agentId) => {
          const agentInfo = agentRegistry.getAgentInfo(agentId);
          return agentInfo ? {
            id: agentInfo.agent.id,
            name: agentInfo.agent.config.name,
            status: agentInfo.currentStatus,
            capabilities: agentInfo.capabilities,
            currentTasks: agentInfo.currentTasks,
            registeredAt: agentInfo.registeredAt,
            lastHeartbeat: agentInfo.lastHeartbeat,
            metrics: agentInfo.metrics,
          } : null;
        })
      );

      return agents.filter(Boolean);
    }),

  getAgent: publicProcedure
    .input(agentIdSchema)
    .query(async ({ input }) => {
      const agentInfo = agentRegistry.getAgentInfo(input.agentId);
      
      if (!agentInfo) {
        throw new Error(`Agent ${input.agentId} not found`);
      }

      const performanceHistory = agentMonitor.getPerformanceHistory(input.agentId, 24);
      const aggregatedMetrics = agentMonitor.getAggregatedMetrics(input.agentId, 3600000); // Last hour

      return {
        id: agentInfo.agent.id,
        name: agentInfo.agent.config.name,
        description: agentInfo.agent.config.description,
        status: agentInfo.currentStatus,
        capabilities: agentInfo.capabilities,
        tags: agentInfo.tags,
        currentTasks: agentInfo.currentTasks,
        maxConcurrentTasks: agentInfo.agent.config.maxConcurrentTasks,
        registeredAt: agentInfo.registeredAt,
        lastHeartbeat: agentInfo.lastHeartbeat,
        metrics: agentInfo.metrics,
        performanceHistory,
        aggregatedMetrics,
      };
    }),

  stopAgent: publicProcedure
    .input(agentIdSchema)
    .mutation(async ({ input }) => {
      const agent = await agentRegistry.getAgent(input.agentId);
      
      if (!agent) {
        throw new Error(`Agent ${input.agentId} not found`);
      }

      await agent.stop();
      await agentRegistry.unregister(input.agentId);
      await agentMonitor.stopMonitoring(input.agentId);
      messageBroker.unregisterAgent(input.agentId);

      return {
        success: true,
        agentId: input.agentId,
        message: 'Agent stopped successfully',
      };
    }),

  // Task management endpoints
  submitTask: publicProcedure
    .input(submitTaskSchema)
    .mutation(async ({ input }) => {
      const taskId = await orchestrator.submitTask(input);
      
      return {
        taskId,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
      };
    }),

  submitCodeAnalysis: publicProcedure
    .input(codeAnalysisSchema)
    .mutation(async ({ input }) => {
      const taskId = await submitCodeAnalysisTask(
        input.codeContent,
        input.language,
        input.analysisTypes
      );

      return {
        taskId,
        type: 'code_analysis',
        status: 'submitted',
        submittedAt: new Date().toISOString(),
      };
    }),

  getTaskResult: publicProcedure
    .input(taskIdSchema)
    .query(async ({ input }) => {
      const result = await orchestrator.getTaskResult(input.taskId);
      
      if (!result) {
        return {
          taskId: input.taskId,
          status: 'not_found',
          message: 'Task not found or still pending',
        };
      }

      return result;
    }),

  cancelTask: publicProcedure
    .input(taskIdSchema)
    .mutation(async ({ input }) => {
      const cancelled = await orchestrator.cancelTask(input.taskId);
      
      return {
        taskId: input.taskId,
        cancelled,
        message: cancelled ? 'Task cancelled successfully' : 'Task could not be cancelled',
      };
    }),

  // Monitoring endpoints
  getSystemMetrics: publicProcedure
    .query(async () => {
      const systemMetrics = await agentMonitor.getSystemMetrics();
      const orchestratorStats = orchestrator.getStats();
      const registryStats = agentRegistry.getStats();
      const messageBrokerStats = messageBroker.getStats();

      return {
        system: systemMetrics,
        orchestrator: orchestratorStats,
        registry: registryStats,
        messageBroker: messageBrokerStats,
        timestamp: new Date().toISOString(),
      };
    }),

  getAgentMetrics: publicProcedure
    .input(agentIdSchema)
    .query(async ({ input }) => {
      const metrics = await agentMonitor.getMetrics(input.agentId);
      const performanceHistory = agentMonitor.getPerformanceHistory(input.agentId, 50);

      return {
        agentId: input.agentId,
        currentMetrics: metrics,
        performanceHistory,
        timestamp: new Date().toISOString(),
      };
    }),

  getDashboard: publicProcedure
    .query(async () => {
      const dashboardData = agentMonitor.getDashboardData();
      const systemHealth = await getSystemHealth();

      return {
        ...dashboardData,
        systemHealth,
        timestamp: new Date().toISOString(),
      };
    }),

  // Communication endpoints
  sendMessage: publicProcedure
    .input(z.object({
      from: z.string(),
      to: z.string(),
      type: z.string(),
      payload: z.record(z.any()),
      priority: z.nativeEnum(Priority).default(Priority.NORMAL),
    }))
    .mutation(async ({ input }) => {
      const message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        from: input.from,
        to: input.to,
        type: input.type,
        payload: input.payload,
        priority: input.priority,
        timestamp: new Date(),
      };

      const delivered = await messageBroker.sendMessage(message);

      return {
        messageId: message.id,
        delivered,
        timestamp: message.timestamp.toISOString(),
      };
    }),

  getMessages: publicProcedure
    .input(z.object({
      agentId: z.string(),
      messageType: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      const filter = input.messageType ? { messageType: input.messageType } : undefined;
      const messages = messageBroker.getMessages(input.agentId, filter);

      return {
        agentId: input.agentId,
        messages: messages.slice(0, input.limit),
        total: messages.length,
      };
    }),

  // Scaling endpoints
  scaleAgents: publicProcedure
    .input(z.object({
      targetCount: z.number().min(0).max(100),
    }))
    .mutation(async ({ input }) => {
      await orchestrator.scaleAgents(input.targetCount);

      return {
        targetCount: input.targetCount,
        message: 'Scaling request submitted',
        timestamp: new Date().toISOString(),
      };
    }),

  // Health check endpoint
  healthCheck: publicProcedure
    .query(async () => {
      const health = await getSystemHealth();
      const isHealthy = Object.values(health.agentHealth).every(Boolean);

      return {
        status: isHealthy ? 'healthy' : 'degraded',
        ...health,
        timestamp: new Date().toISOString(),
      };
    }),
});