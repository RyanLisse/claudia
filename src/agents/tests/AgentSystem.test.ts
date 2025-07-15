/**
 * Comprehensive test suite for the AI Agent System
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type {
  AgentId,
  TaskId,
  Task,
  AgentConfig
} from '../types/agent.ts';
import {
  TaskStatus,
  AgentStatus,
  Priority,
  AgentCapability
} from '../types/agent.ts';
import { BaseAgent } from '../core/BaseAgent.ts';
import { AgentRegistry } from '../core/AgentRegistry.ts';
import { TaskQueue } from '../core/TaskQueue.ts';
import { MessageBroker } from '../communication/MessageBroker.ts';
import { AgentMonitor } from '../monitoring/AgentMonitor.ts';
import { AgentOrchestrator } from '../core/AgentOrchestrator.ts';
import { CodeAnalysisAgent } from '../examples/CodeAnalysisAgent.ts';

// Mock agent implementation for testing
class MockAgent extends BaseAgent {
  private shouldFail = false;
  private executionDelay = 0;
  public capabilities: AgentCapability[];

  constructor(agentId: AgentId, capabilities: AgentCapability[] = [AgentCapability.CODE_ANALYSIS]) {
    const config: AgentConfig = {
      id: agentId,
      name: `Mock Agent ${agentId}`,
      capabilities,
      maxConcurrentTasks: 2,
      timeoutMs: 30000,
      retryAttempts: 1,
    };
    super(config);
    this.capabilities = capabilities;
  }

  setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  setExecutionDelay(delayMs: number): void {
    this.executionDelay = delayMs;
  }

  canHandle(task: Task): boolean {
    return task.requiredCapabilities.every(cap => this.config.capabilities.includes(cap));
  }

  async executeTask(task: Task): Promise<any> {
    if (this.executionDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.executionDelay));
    }

    if (this.shouldFail) {
      throw new Error('Mock task execution failed');
    }

    return {
      taskId: task.id,
      agentId: this.id,
      status: TaskStatus.COMPLETED,
      result: { success: true, data: task.payload },
      startedAt: new Date(),
      completedAt: new Date(),
      durationMs: this.executionDelay,
    };
  }

  protected async onStart(): Promise<void> {
    // Mock implementation
  }

  protected async onStop(): Promise<void> {
    // Mock implementation
  }

  protected async onSendMessage(): Promise<void> {
    // Mock implementation
  }

  protected async onCancelTask(): Promise<void> {
    // Mock implementation
  }
}

describe('AI Agent System', () => {
  let registry: AgentRegistry;
  let taskQueue: TaskQueue;
  let messageBroker: MessageBroker;
  let monitor: AgentMonitor;
  let orchestrator: AgentOrchestrator;

  beforeEach(() => {
    registry = new AgentRegistry();
    taskQueue = new TaskQueue(100);
    messageBroker = new MessageBroker();
    monitor = new AgentMonitor();
    orchestrator = new AgentOrchestrator();
  });

  afterEach(() => {
    registry.shutdown();
    monitor.shutdown();
  });

  describe('BaseAgent', () => {
    let agent: MockAgent;

    beforeEach(() => {
      agent = new MockAgent('test-agent-1');
    });

    it('should initialize with correct status', () => {
      expect(agent.getStatus()).toBe(AgentStatus.OFFLINE);
      expect(agent.id).toBe('test-agent-1');
    });

    it('should start and stop correctly', async () => {
      await agent.start();
      expect(agent.getStatus()).toBe(AgentStatus.IDLE);

      await agent.stop();
      expect(agent.getStatus()).toBe(AgentStatus.OFFLINE);
    });

    it('should handle task assignment', async () => {
      await agent.start();

      const task: Task = {
        id: 'test-task-1',
        type: 'test',
        priority: Priority.NORMAL,
        payload: { data: 'test' },
        requiredCapabilities: [AgentCapability.CODE_ANALYSIS],
        status: TaskStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        retryCount: 0,
        maxRetries: 3,
        timeoutMs: 30000,
      };

      // Set execution delay to ensure task stays in queue for testing
      agent.setExecutionDelay(100);

      const assigned = await agent.assignTask(task);
      expect(assigned).toBe(true);
      expect(agent.getCurrentTasks()).toHaveLength(1);
      expect(agent.getStatus()).toBe(AgentStatus.BUSY);
      
      // Wait for task execution to complete
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(agent.getCurrentTasks()).toHaveLength(0);
    });

    it('should reject tasks it cannot handle', async () => {
      await agent.start();

      const task: Task = {
        id: 'test-task-2',
        type: 'test',
        priority: Priority.NORMAL,
        payload: { data: 'test' },
        requiredCapabilities: [AgentCapability.DATABASE_OPERATIONS], // Agent doesn't have this capability
        status: TaskStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        retryCount: 0,
        maxRetries: 3,
        timeoutMs: 30000,
      };

      const assigned = await agent.assignTask(task);
      expect(assigned).toBe(false);
    });

    it('should handle task execution completion', async () => {
      await agent.start();

      const taskCompletedPromise = new Promise((resolve) => {
        agent.once('task.completed', resolve);
      });

      const task: Task = {
        id: 'test-task-3',
        type: 'test',
        priority: Priority.NORMAL,
        payload: { data: 'test' },
        requiredCapabilities: [AgentCapability.CODE_ANALYSIS],
        status: TaskStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        retryCount: 0,
        maxRetries: 3,
        timeoutMs: 30000,
      };

      await agent.assignTask(task);
      await taskCompletedPromise;

      expect(agent.getCurrentTasks()).toHaveLength(0);
      expect(agent.getStatus()).toBe(AgentStatus.IDLE);
    });
  });

  describe('AgentRegistry', () => {
    let agent1: MockAgent;
    let agent2: MockAgent;

    beforeEach(() => {
      agent1 = new MockAgent('registry-agent-1', [AgentCapability.CODE_ANALYSIS]);
      agent2 = new MockAgent('registry-agent-2', [AgentCapability.TESTING]);
    });

    it('should register and unregister agents', async () => {
      await registry.register(agent1);
      expect(await registry.isRegistered('registry-agent-1')).toBe(true);

      const retrievedAgent = await registry.getAgent('registry-agent-1');
      expect(retrievedAgent).toBe(agent1);

      await registry.unregister('registry-agent-1');
      expect(await registry.isRegistered('registry-agent-1')).toBe(false);
    });

    it('should find agents by capability', async () => {
      await registry.register(agent1);
      await registry.register(agent2);

      const codeAgents = await registry.findByCapability(AgentCapability.CODE_ANALYSIS);
      expect(codeAgents).toContain('registry-agent-1');
      expect(codeAgents).not.toContain('registry-agent-2');

      const testAgents = await registry.findByCapability(AgentCapability.TESTING);
      expect(testAgents).toContain('registry-agent-2');
      expect(testAgents).not.toContain('registry-agent-1');
    });

    it('should find best agent for task', async () => {
      await agent1.start();
      await agent2.start();
      await registry.register(agent1);
      await registry.register(agent2);

      const bestAgent = await registry.findBestAgent([AgentCapability.CODE_ANALYSIS]);
      expect(bestAgent).toBe('registry-agent-1');

      const noAgent = await registry.findBestAgent([AgentCapability.DATABASE_OPERATIONS]);
      expect(noAgent).toBeNull();
    });
  });

  describe('TaskQueue', () => {
    it('should enqueue and dequeue tasks by priority', async () => {
      const lowPriorityTask: Task = {
        id: 'low-task',
        type: 'test',
        priority: Priority.LOW,
        payload: {},
        requiredCapabilities: [AgentCapability.CODE_ANALYSIS],
        status: TaskStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        retryCount: 0,
        maxRetries: 3,
        timeoutMs: 30000,
      };

      const highPriorityTask: Task = {
        id: 'high-task',
        type: 'test',
        priority: Priority.HIGH,
        payload: {},
        requiredCapabilities: [AgentCapability.CODE_ANALYSIS],
        status: TaskStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        retryCount: 0,
        maxRetries: 3,
        timeoutMs: 30000,
      };

      await taskQueue.enqueue(lowPriorityTask);
      await taskQueue.enqueue(highPriorityTask);

      expect(await taskQueue.size()).toBe(2);

      // High priority task should be dequeued first
      const firstTask = await taskQueue.dequeue([AgentCapability.CODE_ANALYSIS]);
      expect(firstTask?.id).toBe('high-task');

      const secondTask = await taskQueue.dequeue([AgentCapability.CODE_ANALYSIS]);
      expect(secondTask?.id).toBe('low-task');
    });

    it('should filter tasks by capability requirements', async () => {
      const codeTask: Task = {
        id: 'code-task',
        type: 'test',
        priority: Priority.NORMAL,
        payload: {},
        requiredCapabilities: [AgentCapability.CODE_ANALYSIS],
        status: TaskStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        retryCount: 0,
        maxRetries: 3,
        timeoutMs: 30000,
      };

      const dbTask: Task = {
        id: 'db-task',
        type: 'test',
        priority: Priority.NORMAL,
        payload: {},
        requiredCapabilities: [AgentCapability.DATABASE_OPERATIONS],
        status: TaskStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        retryCount: 0,
        maxRetries: 3,
        timeoutMs: 30000,
      };

      await taskQueue.enqueue(codeTask);
      await taskQueue.enqueue(dbTask);

      // Agent with only code analysis capability should only get code task
      const codeAgentTask = await taskQueue.dequeue([AgentCapability.CODE_ANALYSIS]);
      expect(codeAgentTask?.id).toBe('code-task');

      // Agent without database capability should not get database task
      const noDbTask = await taskQueue.dequeue([AgentCapability.CODE_ANALYSIS]);
      expect(noDbTask).toBeNull();

      // Agent with database capability should get database task
      const dbAgentTask = await taskQueue.dequeue([AgentCapability.DATABASE_OPERATIONS]);
      expect(dbAgentTask?.id).toBe('db-task');
    });
  });

  describe('MessageBroker', () => {
    it('should register agents and route messages', async () => {
      messageBroker.registerAgent('sender');
      messageBroker.registerAgent('receiver');

      messageBroker.subscribe('receiver', 'test.message');

      const message = {
        id: 'msg-1',
        from: 'sender' as AgentId,
        to: 'receiver' as AgentId,
        type: 'test.message',
        payload: { data: 'hello' },
        priority: Priority.NORMAL,
        timestamp: new Date(),
      };

      const delivered = await messageBroker.sendMessage(message);
      expect(delivered).toBe(true);

      const receivedMessages = messageBroker.getMessages('receiver');
      expect(receivedMessages).toHaveLength(1);
      expect(receivedMessages[0].payload.data).toBe('hello');
    });

    it('should handle broadcast messages', async () => {
      messageBroker.registerAgent('agent1');
      messageBroker.registerAgent('agent2');
      messageBroker.registerAgent('sender');

      messageBroker.subscribe('agent1', 'broadcast.message');
      messageBroker.subscribe('agent2', 'broadcast.message');

      const broadcastMessage = {
        id: 'broadcast-1',
        from: 'sender' as AgentId,
        to: 'broadcast' as AgentId,
        type: 'broadcast.message',
        payload: { announcement: 'hello all' },
        priority: Priority.NORMAL,
        timestamp: new Date(),
      };

      const delivered = await messageBroker.sendMessage(broadcastMessage);
      expect(delivered).toBe(true);

      expect(messageBroker.getMessages('agent1')).toHaveLength(1);
      expect(messageBroker.getMessages('agent2')).toHaveLength(1);
      expect(messageBroker.getMessages('sender')).toHaveLength(0); // Sender shouldn't receive own broadcast
    });
  });

  describe('AgentMonitor', () => {
    it('should start and stop monitoring agents', async () => {
      await monitor.startMonitoring('monitor-agent-1');
      
      const metrics = {
        id: 'monitor-agent-1',
        tasksCompleted: 5,
        tasksInProgress: 2,
        tasksFailed: 1,
        averageTaskDurationMs: 1500,
        lastActiveAt: new Date(),
        uptime: 120000,
      };

      monitor.recordMetrics('monitor-agent-1', metrics);

      const retrievedMetrics = await monitor.getMetrics('monitor-agent-1');
      expect(retrievedMetrics.tasksCompleted).toBe(5);
      expect(retrievedMetrics.tasksFailed).toBe(1);

      await monitor.stopMonitoring('monitor-agent-1');
    });

    it('should trigger alerts based on rules', async () => {
      await monitor.startMonitoring('failing-agent');

      const alertPromise = new Promise((resolve) => {
        monitor.once('alert.triggered', resolve);
      });

      // Simulate high failure rate
      const badMetrics = {
        id: 'failing-agent',
        tasksCompleted: 10,
        tasksInProgress: 0,
        tasksFailed: 8, // 44% failure rate
        averageTaskDurationMs: 1000,
        lastActiveAt: new Date(),
        uptime: 60000,
      };

      monitor.recordMetrics('failing-agent', badMetrics);

      const alert = await alertPromise;
      expect(alert).toBeDefined();
    });
  });

  describe('CodeAnalysisAgent', () => {
    let codeAgent: CodeAnalysisAgent;

    beforeEach(() => {
      codeAgent = new CodeAnalysisAgent('code-agent-1');
    });

    it('should analyze code complexity', async () => {
      await codeAgent.start();

      const task: Task = {
        id: 'analysis-task-1',
        type: 'code_analysis',
        priority: Priority.NORMAL,
        payload: {
          type: 'code_analysis',
          codeContent: `
            function complexFunction(x, y) {
              if (x > 0) {
                for (let i = 0; i < x; i++) {
                  if (i % 2 === 0) {
                    console.log(i);
                  }
                }
              } else {
                while (y > 0) {
                  y--;
                }
              }
              return x + y;
            }
          `,
          language: 'javascript',
          analysisTypes: ['complexity', 'style'],
          outputFormat: 'json'
        },
        requiredCapabilities: [AgentCapability.CODE_ANALYSIS],
        status: TaskStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        retryCount: 0,
        maxRetries: 3,
        timeoutMs: 30000,
      };

      const result = await codeAgent.executeTask(task);
      
      expect(result.status).toBe(TaskStatus.COMPLETED);
      expect(result.result.complexity).toBeDefined();
      expect(result.result.complexity.cyclomaticComplexity).toBeGreaterThan(1);
      expect(result.result.style).toBeDefined();
    });

    it('should handle invalid code analysis tasks', async () => {
      await codeAgent.start();

      const invalidTask: Task = {
        id: 'invalid-task-1',
        type: 'code_analysis',
        priority: Priority.NORMAL,
        payload: {
          type: 'code_analysis',
          // Missing required fields
          outputFormat: 'json'
        },
        requiredCapabilities: [AgentCapability.CODE_ANALYSIS],
        status: TaskStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        retryCount: 0,
        maxRetries: 3,
        timeoutMs: 30000,
      };

      const result = await codeAgent.executeTask(invalidTask);
      
      expect(result.status).toBe(TaskStatus.FAILED);
      expect(result.error).toContain('Invalid task payload');
    });
  });

  describe('Integration Tests', () => {
    it('should orchestrate complete agent workflow', async () => {
      // This test verifies the entire system working together
      const agent = new MockAgent('integration-agent', [AgentCapability.CODE_ANALYSIS]);
      
      await agent.start();
      await monitor.startMonitoring(agent.id);
      messageBroker.registerAgent(agent.id);

      // Initialize the orchestrator first
      await orchestrator.initialize();
      
      // Register agent with orchestrator's registry
      await orchestrator.registerAgent(agent);

      // Submit a task through the orchestrator
      const taskId = await orchestrator.submitTask({
        type: 'test-task',
        priority: Priority.NORMAL,
        payload: { data: 'integration test' },
        requiredCapabilities: [AgentCapability.CODE_ANALYSIS],
        maxRetries: 2,
        timeoutMs: 30000,
        retryCount: 0,
      });

      expect(taskId).toBeDefined();

      // Wait for task processing (in a real scenario, this would be event-driven)
      await new Promise(resolve => setTimeout(resolve, 100));

      const status = await orchestrator.getStatus();
      expect(status.agentCount).toBe(1);
      
      // Shutdown orchestrator after test
      await orchestrator.shutdown();
    });
  });
});