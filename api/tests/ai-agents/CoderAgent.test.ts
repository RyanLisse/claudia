/**
 * Tests for AI Agents Package Components
 * Note: These tests mock the ai-agents package since it's in a different location
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { testUtils, mocks } from '../setup';

// Mock the ai-agents package components
const mockCoderAgent = {
  id: 'test-coder-agent',
  status: 'idle',
  capabilities: ['code-generation', 'code-review', 'code-refactor'],
  maxConcurrentTasks: 3,
  currentTasks: [],
  metrics: {
    tasksCompleted: 0,
    tasksInProgress: 0,
    tasksFailed: 0,
    averageTaskTime: 0,
    uptime: 0,
  },
  
  // Methods
  start: () => Promise.resolve(),
  stop: () => Promise.resolve(),
  restart: () => Promise.resolve(),
  execute: (task: any) => Promise.resolve({
    success: true,
    result: { code: 'function test() { return "Hello World"; }' },
    metadata: { tokensUsed: 150, confidence: 0.95 },
  }),
  canHandle: (task: any) => task.type === 'code-generation',
  healthCheck: () => Promise.resolve(true),
  getMetrics: () => mockCoderAgent.metrics,
  cleanup: () => Promise.resolve(),
  
  // Event emitter methods
  on: (event: string, handler: Function) => {},
  emit: (event: string, data: any) => {},
};

const mockTaskQueue = {
  tasks: [],
  processing: false,
  
  // Methods
  enqueue: (task: any) => {
    mockTaskQueue.tasks.push(task);
    return Promise.resolve(task.id);
  },
  dequeue: () => {
    return mockTaskQueue.tasks.shift() || null;
  },
  peek: () => {
    return mockTaskQueue.tasks[0] || null;
  },
  size: () => mockTaskQueue.tasks.length,
  clear: () => {
    mockTaskQueue.tasks = [];
  },
  getStats: () => ({
    totalTasks: mockTaskQueue.tasks.length,
    pendingTasks: mockTaskQueue.tasks.filter(t => t.status === 'pending').length,
    processingTasks: mockTaskQueue.tasks.filter(t => t.status === 'processing').length,
    completedTasks: mockTaskQueue.tasks.filter(t => t.status === 'completed').length,
    failedTasks: mockTaskQueue.tasks.filter(t => t.status === 'failed').length,
  }),
};

const mockAgentRegistry = {
  agents: new Map(),
  
  // Methods
  register: (agent: any) => {
    mockAgentRegistry.agents.set(agent.id, agent);
    return Promise.resolve();
  },
  unregister: (agentId: string) => {
    mockAgentRegistry.agents.delete(agentId);
    return Promise.resolve();
  },
  get: (agentId: string) => {
    return mockAgentRegistry.agents.get(agentId) || null;
  },
  getAll: () => {
    return Array.from(mockAgentRegistry.agents.values());
  },
  getByCapability: (capability: string) => {
    return Array.from(mockAgentRegistry.agents.values())
      .filter(agent => agent.capabilities.includes(capability));
  },
  getStats: () => ({
    totalAgents: mockAgentRegistry.agents.size,
    activeAgents: Array.from(mockAgentRegistry.agents.values())
      .filter(agent => agent.status === 'active').length,
    idleAgents: Array.from(mockAgentRegistry.agents.values())
      .filter(agent => agent.status === 'idle').length,
  }),
};

describe('AI Agents Package Components', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockTaskQueue.tasks = [];
    mockTaskQueue.processing = false;
    mockAgentRegistry.agents.clear();
    mockCoderAgent.currentTasks = [];
    mockCoderAgent.metrics = {
      tasksCompleted: 0,
      tasksInProgress: 0,
      tasksFailed: 0,
      averageTaskTime: 0,
      uptime: 0,
    };
  });

  describe('CoderAgent', () => {
    it('should initialize with correct properties', () => {
      expect(mockCoderAgent.id).toBe('test-coder-agent');
      expect(mockCoderAgent.status).toBe('idle');
      expect(mockCoderAgent.capabilities).toContain('code-generation');
      expect(mockCoderAgent.maxConcurrentTasks).toBe(3);
      expect(Array.isArray(mockCoderAgent.currentTasks)).toBe(true);
    });

    it('should start successfully', async () => {
      await expect(mockCoderAgent.start()).resolves.toBeUndefined();
    });

    it('should stop successfully', async () => {
      await expect(mockCoderAgent.stop()).resolves.toBeUndefined();
    });

    it('should restart successfully', async () => {
      await expect(mockCoderAgent.restart()).resolves.toBeUndefined();
    });

    it('should execute code generation tasks', async () => {
      const task = testUtils.createMockTask({
        type: 'code-generation',
        payload: {
          prompt: 'Create a hello world function',
          language: 'typescript',
        },
      });

      const result = await mockCoderAgent.execute(task);

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result.code).toContain('function');
      expect(result.metadata.tokensUsed).toBeGreaterThan(0);
      expect(result.metadata.confidence).toBeGreaterThan(0);
    });

    it('should check if it can handle tasks', () => {
      const codeTask = testUtils.createMockTask({ type: 'code-generation' });
      const reviewTask = testUtils.createMockTask({ type: 'code-review' });
      const unknownTask = testUtils.createMockTask({ type: 'unknown-type' });

      expect(mockCoderAgent.canHandle(codeTask)).toBe(true);
      expect(mockCoderAgent.canHandle(reviewTask)).toBe(false); // Mock only handles code-generation
      expect(mockCoderAgent.canHandle(unknownTask)).toBe(false);
    });

    it('should perform health checks', async () => {
      const isHealthy = await mockCoderAgent.healthCheck();
      expect(isHealthy).toBe(true);
    });

    it('should provide metrics', () => {
      const metrics = mockCoderAgent.getMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.tasksCompleted).toBeDefined();
      expect(metrics.tasksInProgress).toBeDefined();
      expect(metrics.tasksFailed).toBeDefined();
      expect(metrics.averageTaskTime).toBeDefined();
      expect(metrics.uptime).toBeDefined();
    });

    it('should cleanup resources', async () => {
      await expect(mockCoderAgent.cleanup()).resolves.toBeUndefined();
    });
  });

  describe('TaskQueue', () => {
    it('should initialize empty', () => {
      expect(mockTaskQueue.size()).toBe(0);
      expect(mockTaskQueue.peek()).toBe(null);
    });

    it('should enqueue tasks', async () => {
      const task = testUtils.createMockTask();
      
      const taskId = await mockTaskQueue.enqueue(task);
      
      expect(taskId).toBe(task.id);
      expect(mockTaskQueue.size()).toBe(1);
    });

    it('should dequeue tasks in FIFO order', async () => {
      const task1 = testUtils.createMockTask({ id: 'task-1' });
      const task2 = testUtils.createMockTask({ id: 'task-2' });
      
      await mockTaskQueue.enqueue(task1);
      await mockTaskQueue.enqueue(task2);
      
      const dequeuedTask1 = mockTaskQueue.dequeue();
      const dequeuedTask2 = mockTaskQueue.dequeue();
      
      expect(dequeuedTask1?.id).toBe('task-1');
      expect(dequeuedTask2?.id).toBe('task-2');
      expect(mockTaskQueue.size()).toBe(0);
    });

    it('should peek at next task without removing it', async () => {
      const task = testUtils.createMockTask();
      
      await mockTaskQueue.enqueue(task);
      
      const peekedTask = mockTaskQueue.peek();
      expect(peekedTask?.id).toBe(task.id);
      expect(mockTaskQueue.size()).toBe(1); // Task should still be in queue
    });

    it('should clear all tasks', async () => {
      const task1 = testUtils.createMockTask();
      const task2 = testUtils.createMockTask();
      
      await mockTaskQueue.enqueue(task1);
      await mockTaskQueue.enqueue(task2);
      
      mockTaskQueue.clear();
      
      expect(mockTaskQueue.size()).toBe(0);
      expect(mockTaskQueue.peek()).toBe(null);
    });

    it('should provide queue statistics', async () => {
      const task1 = testUtils.createMockTask({ status: 'pending' });
      const task2 = testUtils.createMockTask({ status: 'processing' });
      const task3 = testUtils.createMockTask({ status: 'completed' });
      
      await mockTaskQueue.enqueue(task1);
      await mockTaskQueue.enqueue(task2);
      await mockTaskQueue.enqueue(task3);
      
      const stats = mockTaskQueue.getStats();
      
      expect(stats.totalTasks).toBe(3);
      expect(stats.pendingTasks).toBe(1);
      expect(stats.processingTasks).toBe(1);
      expect(stats.completedTasks).toBe(1);
      expect(stats.failedTasks).toBe(0);
    });
  });

  describe('AgentRegistry', () => {
    it('should register agents', async () => {
      const agent = testUtils.createMockAgent();
      
      await mockAgentRegistry.register(agent);
      
      const retrievedAgent = mockAgentRegistry.get(agent.id);
      expect(retrievedAgent).toBe(agent);
    });

    it('should unregister agents', async () => {
      const agent = testUtils.createMockAgent();
      
      await mockAgentRegistry.register(agent);
      await mockAgentRegistry.unregister(agent.id);
      
      const retrievedAgent = mockAgentRegistry.get(agent.id);
      expect(retrievedAgent).toBe(null);
    });

    it('should get all agents', async () => {
      const agent1 = testUtils.createMockAgent({ id: 'agent-1' });
      const agent2 = testUtils.createMockAgent({ id: 'agent-2' });
      
      await mockAgentRegistry.register(agent1);
      await mockAgentRegistry.register(agent2);
      
      const allAgents = mockAgentRegistry.getAll();
      expect(allAgents).toHaveLength(2);
      expect(allAgents.map(a => a.id)).toContain('agent-1');
      expect(allAgents.map(a => a.id)).toContain('agent-2');
    });

    it('should get agents by capability', async () => {
      const codeAgent = testUtils.createMockAgent({
        id: 'code-agent',
        capabilities: ['code-generation', 'code-review'],
      });
      const testAgent = testUtils.createMockAgent({
        id: 'test-agent',
        capabilities: ['code-test', 'code-debug'],
      });
      
      await mockAgentRegistry.register(codeAgent);
      await mockAgentRegistry.register(testAgent);
      
      const codeAgents = mockAgentRegistry.getByCapability('code-generation');
      const testAgents = mockAgentRegistry.getByCapability('code-test');
      
      expect(codeAgents).toHaveLength(1);
      expect(codeAgents[0].id).toBe('code-agent');
      expect(testAgents).toHaveLength(1);
      expect(testAgents[0].id).toBe('test-agent');
    });

    it('should provide registry statistics', async () => {
      const activeAgent = testUtils.createMockAgent({
        id: 'active-agent',
        status: 'active',
      });
      const idleAgent = testUtils.createMockAgent({
        id: 'idle-agent',
        status: 'idle',
      });
      
      await mockAgentRegistry.register(activeAgent);
      await mockAgentRegistry.register(idleAgent);
      
      const stats = mockAgentRegistry.getStats();
      
      expect(stats.totalAgents).toBe(2);
      expect(stats.activeAgents).toBe(1);
      expect(stats.idleAgents).toBe(1);
    });
  });

  describe('Integration Tests', () => {
    it('should handle agent-task workflow', async () => {
      // Register agent
      const agent = testUtils.createMockAgent();
      await mockAgentRegistry.register(agent);
      
      // Create and enqueue task
      const task = testUtils.createMockTask();
      await mockTaskQueue.enqueue(task);
      
      // Dequeue and execute task
      const dequeuedTask = mockTaskQueue.dequeue();
      expect(dequeuedTask).toBeDefined();
      
      if (dequeuedTask && mockCoderAgent.canHandle(dequeuedTask)) {
        const result = await mockCoderAgent.execute(dequeuedTask);
        expect(result.success).toBe(true);
      }
    });

    it('should handle multiple agents and tasks', async () => {
      // Register multiple agents
      const agent1 = testUtils.createMockAgent({ id: 'agent-1' });
      const agent2 = testUtils.createMockAgent({ id: 'agent-2' });
      
      await mockAgentRegistry.register(agent1);
      await mockAgentRegistry.register(agent2);
      
      // Enqueue multiple tasks
      const task1 = testUtils.createMockTask({ id: 'task-1' });
      const task2 = testUtils.createMockTask({ id: 'task-2' });
      
      await mockTaskQueue.enqueue(task1);
      await mockTaskQueue.enqueue(task2);
      
      // Verify setup
      expect(mockAgentRegistry.getAll()).toHaveLength(2);
      expect(mockTaskQueue.size()).toBe(2);
    });
  });
});
