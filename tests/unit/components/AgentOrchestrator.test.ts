import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { AgentOrchestrator } from '../../../src/agents/core/AgentOrchestrator'
import { BaseAgent } from '../../../src/agents/core/BaseAgent'
import { TaskQueue } from '../../../src/agents/core/TaskQueue'
import { AgentRegistry } from '../../../src/agents/core/AgentRegistry'

// Mock dependencies
vi.mock('../../../src/agents/core/TaskQueue')
vi.mock('../../../src/agents/core/AgentRegistry')
vi.mock('../../../src/agents/inngest/client', () => ({
  inngest: {
    send: vi.fn().mockResolvedValue(undefined)
  }
}))

describe('AgentOrchestrator - TDD Implementation', () => {
  let orchestrator: AgentOrchestrator
  let mockTaskQueue: TaskQueue
  let mockAgentRegistry: AgentRegistry
  let mockAgent: BaseAgent

  beforeEach(async () => {
    // Setup mocks
    mockTaskQueue = new TaskQueue() as any
    mockAgentRegistry = new AgentRegistry() as any
    mockAgent = {
      id: 'test-agent-1',
      name: 'Test Agent',
      type: 'coder',
      status: 'idle',
      capabilities: ['code-generation', 'testing'],
      execute: vi.fn().mockResolvedValue({ success: true, result: 'task completed' }),
      getStatus: vi.fn().mockReturnValue('idle'),
      getCapabilities: vi.fn().mockReturnValue(['code-generation', 'testing']),
      assignTask: vi.fn().mockResolvedValue(true),
      cancelTask: vi.fn().mockResolvedValue(true),
      getCurrentTasks: vi.fn().mockReturnValue([]),
      config: {
        id: 'test-agent-1',
        name: 'Test Agent',
        capabilities: ['code-generation', 'testing'],
        maxConcurrentTasks: 5,
        timeoutMs: 30000,
        retryAttempts: 3
      }
    } as any

    // Mock TaskQueue methods
    mockTaskQueue.enqueue = vi.fn().mockResolvedValue(undefined)
    mockTaskQueue.dequeue = vi.fn().mockResolvedValue({
      id: 'task-123',
      type: 'code-generation',
      payload: { description: 'Generate test code' },
      priority: 3,
      requiredCapabilities: ['code-generation'],
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      retryCount: 0,
      maxRetries: 3,
      timeoutMs: 30000
    })
    mockTaskQueue.updateTaskStatus = vi.fn().mockResolvedValue(undefined)
    mockTaskQueue.size = vi.fn().mockResolvedValue(0)
    mockTaskQueue.getTasksByStatus = vi.fn().mockResolvedValue([])
    mockTaskQueue.remove = vi.fn().mockResolvedValue(true)
    mockTaskQueue.addTask = vi.fn().mockResolvedValue('task-123')
    mockTaskQueue.getNextTask = vi.fn().mockResolvedValue(null)

    // Mock AgentRegistry methods
    mockAgentRegistry.register = vi.fn().mockResolvedValue(undefined)
    mockAgentRegistry.findByStatus = vi.fn().mockResolvedValue(['test-agent-1'])
    mockAgentRegistry.getAgent = vi.fn().mockResolvedValue(mockAgent)
    mockAgentRegistry.getAllAgents = vi.fn().mockResolvedValue([mockAgent])
    mockAgentRegistry.getStats = vi.fn().mockReturnValue({
      totalAgents: 1,
      activeAgents: 1,
      averageLoad: 0.5,
      agentsByStatus: { idle: 1 },
      agentsByCapability: { 'code-generation': 1 }
    })
    mockAgentRegistry.findByCapability = vi.fn().mockResolvedValue([mockAgent])
    mockAgentRegistry.findAgentsByCapability = vi.fn().mockReturnValue([mockAgent])

    orchestrator = new AgentOrchestrator()
    // Inject mocks
    ;(orchestrator as any).taskQueue = mockTaskQueue
    ;(orchestrator as any).registry = mockAgentRegistry
    
    // Initialize orchestrator
    await orchestrator.initialize()
  })

  afterEach(async () => {
    vi.clearAllMocks()
    if (orchestrator) {
      await orchestrator.shutdown()
    }
  })

  describe('Agent Registration', () => {
    it('should register a new agent successfully', async () => {
      // TDD: Write test first, then implement
      const result = await orchestrator.registerAgent(mockAgent)

      expect(result).toBe(true)
      expect(mockAgentRegistry.register).toHaveBeenCalledWith(mockAgent)
    })

    it('should reject agent registration with invalid capabilities', async () => {
      const invalidAgent = { ...mockAgent, capabilities: [] }

      await expect(orchestrator.registerAgent(invalidAgent))
        .rejects.toThrow('Agent must have at least one capability')
    })

    it('should prevent duplicate agent registration', async () => {
      vi.mocked(mockAgentRegistry.register).mockRejectedValue(
        new Error('Agent with this ID already exists')
      )

      await expect(orchestrator.registerAgent(mockAgent))
        .rejects.toThrow('Agent with this ID already exists')
    })
  })

  describe('Task Assignment', () => {
    it('should assign task to capable agent', async () => {
      const task = {
        type: 'code-generation',
        description: 'Generate React component',
        priority: 'high' as const,
        requiredCapabilities: ['code-generation']
      }

      const result = await orchestrator.assignTask(task)

      expect(result.taskId).toBeDefined()
      expect(result.assignedAgent).toBe(mockAgent.id)
      expect(mockTaskQueue.addTask).toHaveBeenCalled()
    })

    it('should queue task when no agents available', async () => {
      vi.mocked(mockAgentRegistry.findAgentsByCapability).mockReturnValue([])

      const task = {
        type: 'specialized-task',
        description: 'Specialized work',
        priority: 'medium' as const,
        requiredCapabilities: ['specialized-capability']
      }

      const result = await orchestrator.assignTask(task)

      expect(result.taskId).toBeDefined()
      expect(result.assignedAgent).toBeNull()
      expect(result.queued).toBe(true)
    })

    it('should prioritize high-priority tasks', async () => {
      const highPriorityTask = {
        type: 'urgent-fix',
        description: 'Fix critical bug',
        priority: 'critical' as const,
        requiredCapabilities: ['code-generation']
      }

      const normalTask = {
        type: 'feature',
        description: 'Add new feature',
        priority: 'medium' as const,
        requiredCapabilities: ['code-generation']
      }

      await orchestrator.assignTask(normalTask)
      await orchestrator.assignTask(highPriorityTask)

      // Verify high priority task is processed first
      const calls = vi.mocked(mockTaskQueue.addTask).mock.calls
      expect(calls[1][0].priority).toBe('critical')
    })
  })

  describe('Task Execution', () => {
    it('should execute task and return results', async () => {
      const task = {
        id: 'task-123',
        type: 'code-generation',
        description: 'Generate test code',
        priority: 'high' as const,
        requiredCapabilities: ['code-generation']
      }

      const result = await orchestrator.executeTask(task, mockAgent)

      expect(result.success).toBe(true)
      expect(result.result).toBe('task completed')
      expect(mockAgent.execute).toHaveBeenCalledWith(task)
    })

    it('should handle task execution failure', async () => {
      const failingAgent = {
        ...mockAgent,
        execute: vi.fn().mockRejectedValue(new Error('Task execution failed'))
      }

      const task = {
        id: 'task-456',
        type: 'failing-task',
        description: 'This task will fail',
        priority: 'medium' as const,
        requiredCapabilities: ['code-generation']
      }

      const result = await orchestrator.executeTask(task, failingAgent)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Task execution failed')
    })

    it('should timeout long-running tasks', async () => {
      const slowAgent = {
        ...mockAgent,
        execute: vi.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(resolve, 6000))
        )
      }

      const task = {
        id: 'task-789',
        type: 'slow-task',
        description: 'This task takes too long',
        priority: 'low' as const,
        requiredCapabilities: ['code-generation']
      }

      const result = await orchestrator.executeTask(task, slowAgent, { timeout: 1000 })

      expect(result.success).toBe(false)
      expect(result.error).toContain('timeout')
    })
  })

  describe('Load Balancing', () => {
    it('should distribute tasks across available agents', async () => {
      const agents = [
        { ...mockAgent, id: 'agent-1', status: 'idle' },
        { ...mockAgent, id: 'agent-2', status: 'idle' },
        { ...mockAgent, id: 'agent-3', status: 'busy' }
      ]

      vi.mocked(mockAgentRegistry.findAgentsByCapability).mockReturnValue(agents)

      const tasks = [
        { type: 'task-1', description: 'Task 1', priority: 'medium' as const, requiredCapabilities: ['code-generation'] },
        { type: 'task-2', description: 'Task 2', priority: 'medium' as const, requiredCapabilities: ['code-generation'] }
      ]

      const results = await Promise.all(tasks.map(task => orchestrator.assignTask(task)))

      // Should assign to different idle agents
      const assignedAgents = results.map(r => r.assignedAgent)
      expect(new Set(assignedAgents).size).toBe(2) // Two different agents
      expect(assignedAgents).not.toContain('agent-3') // Busy agent not used
    })

    it('should handle agent capacity limits', async () => {
      const busyAgent = { ...mockAgent, status: 'busy', currentTasks: 5, maxConcurrentTasks: 5 }
      vi.mocked(mockAgentRegistry.findAgentsByCapability).mockReturnValue([busyAgent])

      const task = {
        type: 'overflow-task',
        description: 'Task when agent at capacity',
        priority: 'medium' as const,
        requiredCapabilities: ['code-generation']
      }

      const result = await orchestrator.assignTask(task)

      expect(result.queued).toBe(true)
      expect(result.assignedAgent).toBeNull()
    })
  })

  describe('Coordination and Communication', () => {
    it('should coordinate multi-agent tasks', async () => {
      const coordinationTask = {
        type: 'multi-agent-task',
        description: 'Requires multiple agents',
        priority: 'high' as const,
        requiredCapabilities: ['code-generation', 'testing'],
        requiresCoordination: true,
        subtasks: [
          { type: 'code-gen', capabilities: ['code-generation'] },
          { type: 'testing', capabilities: ['testing'] }
        ]
      }

      const codeAgent = { ...mockAgent, id: 'code-agent', capabilities: ['code-generation'] }
      const testAgent = { ...mockAgent, id: 'test-agent', capabilities: ['testing'] }

      vi.mocked(mockAgentRegistry.findAgentsByCapability)
        .mockReturnValueOnce([codeAgent])
        .mockReturnValueOnce([testAgent])

      const result = await orchestrator.coordinateMultiAgentTask(coordinationTask)

      expect(result.success).toBe(true)
      expect(result.participatingAgents).toHaveLength(2)
      expect(result.participatingAgents).toContain('code-agent')
      expect(result.participatingAgents).toContain('test-agent')
    })

    it('should handle agent communication failures', async () => {
      const communicationTask = {
        type: 'communication-test',
        description: 'Test agent communication',
        priority: 'medium' as const,
        requiredCapabilities: ['code-generation'],
        requiresCommunication: true
      }

      const failingCommunicationAgent = {
        ...mockAgent,
        communicate: vi.fn().mockRejectedValue(new Error('Communication failed'))
      }

      const result = await orchestrator.handleAgentCommunication(
        communicationTask,
        [failingCommunicationAgent]
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Communication failed')
    })
  })

  describe('Performance Monitoring', () => {
    it('should track agent performance metrics', async () => {
      const task = {
        id: 'perf-task',
        type: 'performance-test',
        description: 'Task for performance monitoring',
        priority: 'medium' as const,
        requiredCapabilities: ['code-generation']
      }

      await orchestrator.executeTask(task, mockAgent)

      const metrics = await orchestrator.getAgentMetrics(mockAgent.id)

      expect(metrics).toMatchObject({
        agentId: mockAgent.id,
        tasksCompleted: expect.any(Number),
        averageExecutionTime: expect.any(Number),
        successRate: expect.any(Number)
      })
    })

    it('should identify performance bottlenecks', async () => {
      const slowTask = {
        id: 'slow-task',
        type: 'slow-operation',
        description: 'Slow task for bottleneck testing',
        priority: 'low' as const,
        requiredCapabilities: ['code-generation']
      }

      const slowAgent = {
        ...mockAgent,
        execute: vi.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({ success: true, result: 'slow' }), 3000))
        )
      }

      await orchestrator.executeTask(slowTask, slowAgent)

      const bottlenecks = await orchestrator.identifyBottlenecks()

      expect(bottlenecks).toContainEqual(
        expect.objectContaining({
          agentId: slowAgent.id,
          issue: 'slow_execution_time'
        })
      )
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should recover from agent failures', async () => {
      const task = {
        id: 'recovery-task',
        type: 'recovery-test',
        description: 'Task to test recovery',
        priority: 'high' as const,
        requiredCapabilities: ['code-generation']
      }

      const failingAgent = {
        ...mockAgent,
        execute: vi.fn().mockRejectedValue(new Error('Agent crashed'))
      }

      const backupAgent = {
        ...mockAgent,
        id: 'backup-agent',
        execute: vi.fn().mockResolvedValue({ success: true, result: 'recovered' })
      }

      vi.mocked(mockAgentRegistry.findAgentsByCapability).mockReturnValue([backupAgent])

      const result = await orchestrator.executeTaskWithRecovery(task, failingAgent)

      expect(result.success).toBe(true)
      expect(result.result).toBe('recovered')
      expect(result.recoveredFrom).toBe(failingAgent.id)
    })

    it('should handle cascading failures', async () => {
      const criticalTask = {
        id: 'critical-task',
        type: 'critical-operation',
        description: 'Critical task that cannot fail',
        priority: 'critical' as const,
        requiredCapabilities: ['code-generation'],
        retryLimit: 3
      }

      const allFailingAgents = [
        { ...mockAgent, id: 'agent-1', execute: vi.fn().mockRejectedValue(new Error('Fail 1')) },
        { ...mockAgent, id: 'agent-2', execute: vi.fn().mockRejectedValue(new Error('Fail 2')) },
        { ...mockAgent, id: 'agent-3', execute: vi.fn().mockRejectedValue(new Error('Fail 3')) }
      ]

      vi.mocked(mockAgentRegistry.findAgentsByCapability).mockReturnValue(allFailingAgents)

      const result = await orchestrator.executeTaskWithRecovery(criticalTask, allFailingAgents[0])

      expect(result.success).toBe(false)
      expect(result.exhaustedRetries).toBe(true)
      expect(result.failureCount).toBe(3)
    })
  })

  describe('State Management', () => {
    it('should maintain orchestrator state consistency', async () => {
      const initialState = await orchestrator.getState()

      await orchestrator.registerAgent(mockAgent)
      const task = {
        type: 'state-test',
        description: 'Test state management',
        priority: 'medium' as const,
        requiredCapabilities: ['code-generation']
      }
      await orchestrator.assignTask(task)

      const finalState = await orchestrator.getState()

      expect(finalState.totalAgents).toBe(initialState.totalAgents + 1)
      expect(finalState.totalTasks).toBe(initialState.totalTasks + 1)
    })

    it('should handle state persistence and recovery', async () => {
      const stateBefore = await orchestrator.getState()
      
      await orchestrator.saveState('test-checkpoint')
      
      // Simulate orchestrator restart
      const newOrchestrator = new AgentOrchestrator()
      await newOrchestrator.loadState('test-checkpoint')
      
      const stateAfter = await newOrchestrator.getState()

      expect(stateAfter).toEqual(stateBefore)
    })
  })
})