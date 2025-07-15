import type { BaseAgent } from '../../src/agents/core/BaseAgent'
import type { Task, AgentCapability } from '../../src/agents/types/agent'

/**
 * Mock Agent Factory for Testing
 * Provides standardized mock agents for consistent testing
 */
export class MockAgentFactory {
  static createCodeAgent(overrides: Partial<BaseAgent> = {}): BaseAgent {
    return {
      id: 'mock-code-agent-1',
      name: 'Mock Code Agent',
      type: 'coder',
      status: 'idle',
      capabilities: ['code-generation', 'refactoring', 'bug-fixing'],
      maxConcurrentTasks: 3,
      currentTasks: [],
      metrics: {
        totalTasksExecuted: 0,
        successRate: 1.0,
        averageExecutionTime: 2500
      },
      // Mock methods
      canExecuteTask: vi.fn().mockReturnValue(true),
      execute: vi.fn().mockResolvedValue({
        success: true,
        result: 'Mock code generation completed',
        artifacts: ['MockComponent.tsx', 'MockComponent.test.tsx'],
        metrics: { executionTime: 2500, linesOfCode: 150 }
      }),
      executeTaskImplementation: vi.fn().mockResolvedValue({
        success: true,
        result: 'Mock implementation completed'
      }),
      sendMessage: vi.fn().mockResolvedValue({
        success: true,
        messageId: 'mock-msg-123'
      }),
      receiveMessage: vi.fn().mockResolvedValue({
        acknowledged: true,
        response: 'Message received'
      }),
      coordinateWithAgents: vi.fn().mockResolvedValue({
        success: true,
        collaborationPlan: { myRole: 'code-generation' }
      }),
      learnFromFeedback: vi.fn().mockResolvedValue({
        learningApplied: true,
        adaptationsMade: 1
      }),
      adaptCapabilities: vi.fn().mockResolvedValue({
        capabilitiesUpdated: true,
        newCapabilities: []
      }),
      saveState: vi.fn().mockResolvedValue({
        id: 'mock-code-agent-1',
        status: 'idle',
        metrics: {}
      }),
      restoreState: vi.fn().mockResolvedValue(undefined),
      executeWithRetry: vi.fn().mockResolvedValue({
        success: true,
        result: 'Retry completed',
        attemptCount: 1
      }),
      cleanupResources: vi.fn().mockResolvedValue({ cleaned: true }),
      performHealthCheck: vi.fn().mockResolvedValue({
        status: 'healthy',
        memoryUsage: 50,
        taskQueueSize: 0,
        lastActivityTime: Date.now()
      }),
      processIncomingMessage: vi.fn().mockResolvedValue({
        acknowledged: true,
        response: 'Processed'
      }),
      getExecutionMetrics: vi.fn().mockReturnValue({
        totalTasksExecuted: 5,
        averageExecutionTime: 2500,
        lastExecutionTime: Date.now()
      }),
      getStatus: vi.fn().mockReturnValue('idle'),
      getCapabilities: vi.fn().mockReturnValue(['code-generation', 'refactoring']),
      ...overrides
    } as unknown as BaseAgent
  }

  static createTestAgent(overrides: Partial<BaseAgent> = {}): BaseAgent {
    return {
      id: 'mock-test-agent-1',
      name: 'Mock Test Agent',
      type: 'tester',
      status: 'idle',
      capabilities: ['testing', 'test-generation', 'coverage-analysis'],
      maxConcurrentTasks: 2,
      currentTasks: [],
      metrics: {
        totalTasksExecuted: 0,
        successRate: 0.95,
        averageExecutionTime: 3000
      },
      // Mock methods
      canExecuteTask: vi.fn().mockReturnValue(true),
      execute: vi.fn().mockResolvedValue({
        success: true,
        result: 'Mock test generation completed',
        artifacts: ['MockComponent.test.tsx', 'test-coverage-report.html'],
        metrics: { executionTime: 3000, testCoverage: 95 }
      }),
      executeTaskImplementation: vi.fn().mockResolvedValue({
        success: true,
        result: 'Mock test implementation completed'
      }),
      sendMessage: vi.fn().mockResolvedValue({
        success: true,
        messageId: 'mock-test-msg-123'
      }),
      receiveMessage: vi.fn().mockResolvedValue({
        acknowledged: true,
        response: 'Test message received'
      }),
      coordinateWithAgents: vi.fn().mockResolvedValue({
        success: true,
        collaborationPlan: { myRole: 'testing' }
      }),
      getStatus: vi.fn().mockReturnValue('idle'),
      getCapabilities: vi.fn().mockReturnValue(['testing', 'test-generation']),
      ...overrides
    } as unknown as BaseAgent
  }

  static createReviewAgent(overrides: Partial<BaseAgent> = {}): BaseAgent {
    return {
      id: 'mock-review-agent-1',
      name: 'Mock Review Agent',
      type: 'reviewer',
      status: 'idle',
      capabilities: ['code-review', 'quality-analysis', 'documentation'],
      maxConcurrentTasks: 4,
      currentTasks: [],
      metrics: {
        totalTasksExecuted: 0,
        successRate: 0.98,
        averageExecutionTime: 1500
      },
      // Mock methods
      canExecuteTask: vi.fn().mockReturnValue(true),
      execute: vi.fn().mockResolvedValue({
        success: true,
        result: 'Mock code review completed',
        artifacts: ['code-review-report.md', 'quality-metrics.json'],
        metrics: { executionTime: 1500, qualityScore: 8.5 }
      }),
      executeTaskImplementation: vi.fn().mockResolvedValue({
        success: true,
        result: 'Mock review implementation completed'
      }),
      getStatus: vi.fn().mockReturnValue('idle'),
      getCapabilities: vi.fn().mockReturnValue(['code-review', 'quality-analysis']),
      ...overrides
    } as unknown as BaseAgent
  }

  static createFailingAgent(overrides: Partial<BaseAgent> = {}): BaseAgent {
    return {
      id: 'mock-failing-agent-1',
      name: 'Mock Failing Agent',
      type: 'coder',
      status: 'error',
      capabilities: ['code-generation'],
      maxConcurrentTasks: 1,
      currentTasks: [],
      metrics: {
        totalTasksExecuted: 0,
        successRate: 0.0,
        averageExecutionTime: 5000
      },
      // Mock methods that fail
      canExecuteTask: vi.fn().mockReturnValue(true),
      execute: vi.fn().mockRejectedValue(new Error('Mock agent execution failed')),
      executeTaskImplementation: vi.fn().mockRejectedValue(new Error('Mock implementation failed')),
      sendMessage: vi.fn().mockRejectedValue(new Error('Mock communication failed')),
      getStatus: vi.fn().mockReturnValue('error'),
      getCapabilities: vi.fn().mockReturnValue(['code-generation']),
      ...overrides
    } as unknown as BaseAgent
  }
}

/**
 * Mock Task Factory for Testing
 */
export class MockTaskFactory {
  static createCodeGenerationTask(overrides: Partial<Task> = {}): Task {
    return {
      id: 'mock-code-task-1',
      type: 'code-generation',
      description: 'Generate React authentication component',
      priority: 'high',
      requiredCapabilities: ['code-generation'],
      context: {
        framework: 'React',
        typescript: true,
        testingRequired: true
      },
      estimatedDuration: 2500,
      ...overrides
    }
  }

  static createTestGenerationTask(overrides: Partial<Task> = {}): Task {
    return {
      id: 'mock-test-task-1',
      type: 'test-generation',
      description: 'Generate comprehensive tests for authentication component',
      priority: 'medium',
      requiredCapabilities: ['testing', 'test-generation'],
      context: {
        testFramework: 'Vitest',
        coverageTarget: 95
      },
      dependencies: ['mock-code-task-1'],
      estimatedDuration: 3000,
      ...overrides
    }
  }

  static createReviewTask(overrides: Partial<Task> = {}): Task {
    return {
      id: 'mock-review-task-1',
      type: 'code-review',
      description: 'Review authentication component for quality and security',
      priority: 'medium',
      requiredCapabilities: ['code-review', 'quality-analysis'],
      context: {
        securityFocus: true,
        performanceCheck: true
      },
      dependencies: ['mock-code-task-1', 'mock-test-task-1'],
      estimatedDuration: 1500,
      ...overrides
    }
  }

  static createComplexWorkflowTask(overrides: Partial<Task> = {}): Task {
    return {
      id: 'mock-workflow-task-1',
      type: 'feature-development',
      description: 'Complete user authentication feature',
      priority: 'critical',
      requiresCoordination: true,
      subtasks: [
        MockTaskFactory.createCodeGenerationTask(),
        MockTaskFactory.createTestGenerationTask(),
        MockTaskFactory.createReviewTask()
      ],
      estimatedDuration: 7000,
      ...overrides
    }
  }

  static createFailingTask(overrides: Partial<Task> = {}): Task {
    return {
      id: 'mock-failing-task-1',
      type: 'impossible-task',
      description: 'Task designed to fail',
      priority: 'low',
      requiredCapabilities: ['non-existent-capability'],
      context: {
        shouldFail: true
      },
      estimatedDuration: 1000,
      ...overrides
    }
  }

  static createHighPriorityTask(overrides: Partial<Task> = {}): Task {
    return {
      id: 'mock-urgent-task-1',
      type: 'bug-fix',
      description: 'Critical security vulnerability fix',
      priority: 'critical',
      requiredCapabilities: ['bug-fixing', 'security-analysis'],
      context: {
        severity: 'critical',
        deadline: new Date(Date.now() + 3600000) // 1 hour
      },
      estimatedDuration: 1000,
      ...overrides
    }
  }

  static createBatchTasks(count: number, taskType: string = 'code-generation'): Task[] {
    return Array.from({ length: count }, (_, i) => ({
      id: `mock-batch-task-${i}`,
      type: taskType,
      description: `Batch task ${i} for ${taskType}`,
      priority: ['low', 'medium', 'high'][i % 3] as Task['priority'],
      requiredCapabilities: [taskType === 'code-generation' ? 'code-generation' : 'testing'],
      estimatedDuration: 1000 + Math.random() * 2000,
      context: {
        batchId: 'batch-123',
        batchIndex: i
      }
    }))
  }
}

/**
 * Mock Message Factory for Testing
 */
export class MockMessageFactory {
  static createCollaborationRequest() {
    return {
      id: 'mock-msg-1',
      from: 'mock-code-agent-1',
      to: 'mock-test-agent-1',
      type: 'collaboration-request',
      content: 'Need help with testing the generated component',
      timestamp: new Date(),
      taskContext: MockTaskFactory.createCodeGenerationTask()
    }
  }

  static createTaskDelegation() {
    return {
      id: 'mock-msg-2',
      from: 'mock-review-agent-1',
      to: 'mock-test-agent-1',
      type: 'task-delegation',
      content: 'Please handle the testing for this component',
      timestamp: new Date(),
      taskContext: MockTaskFactory.createTestGenerationTask()
    }
  }

  static createStatusUpdate() {
    return {
      id: 'mock-msg-3',
      from: 'mock-code-agent-1',
      to: 'orchestrator',
      type: 'status-update',
      content: 'Task completed successfully',
      timestamp: new Date(),
      taskContext: MockTaskFactory.createCodeGenerationTask()
    }
  }
}

/**
 * Mock Environment Setup for Testing
 */
export class MockTestEnvironment {
  static setupAgentSystem() {
    const agents = [
      MockAgentFactory.createCodeAgent(),
      MockAgentFactory.createTestAgent(),
      MockAgentFactory.createReviewAgent()
    ]

    const tasks = [
      MockTaskFactory.createCodeGenerationTask(),
      MockTaskFactory.createTestGenerationTask(),
      MockTaskFactory.createReviewTask()
    ]

    return { agents, tasks }
  }

  static setupFailureScenario() {
    const agents = [
      MockAgentFactory.createCodeAgent(),
      MockAgentFactory.createFailingAgent()
    ]

    const tasks = [
      MockTaskFactory.createCodeGenerationTask(),
      MockTaskFactory.createFailingTask()
    ]

    return { agents, tasks }
  }

  static setupLoadTestScenario(agentCount: number = 3, taskCount: number = 10) {
    const agents = Array.from({ length: agentCount }, (_, i) => 
      MockAgentFactory.createCodeAgent({ id: `load-test-agent-${i}` })
    )

    const tasks = MockTaskFactory.createBatchTasks(taskCount)

    return { agents, tasks }
  }

  static setupCollaborationScenario() {
    const agents = [
      MockAgentFactory.createCodeAgent(),
      MockAgentFactory.createTestAgent(),
      MockAgentFactory.createReviewAgent()
    ]

    const collaborationTask = MockTaskFactory.createComplexWorkflowTask()

    const messages = [
      MockMessageFactory.createCollaborationRequest(),
      MockMessageFactory.createTaskDelegation(),
      MockMessageFactory.createStatusUpdate()
    ]

    return { agents, collaborationTask, messages }
  }
}