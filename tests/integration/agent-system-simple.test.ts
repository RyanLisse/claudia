import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { TaskQueue } from '../../src/agents/core/TaskQueue'
import { AgentRegistry } from '../../src/agents/core/AgentRegistry'
import { Priority, TaskStatus, AgentCapability } from '../../src/agents/types/agent'

/**
 * Simplified Agent System Integration Tests
 * Tests core components without complex dependencies
 */
describe('Agent System Core Integration Tests', () => {
  let taskQueue: TaskQueue
  let agentRegistry: AgentRegistry

  beforeAll(() => {
    // Initialize core components
    taskQueue = new TaskQueue(100)
    agentRegistry = new AgentRegistry()
  })

  afterAll(() => {
    // Cleanup
    taskQueue.clear()
  })

  beforeEach(() => {
    // Reset state
    taskQueue.clear()
  })

  describe('Task Queue Operations', () => {
    it('should initialize with correct settings', () => {
      expect(taskQueue).toBeDefined()
      
      const stats = taskQueue.getStats()
      expect(stats.totalTasks).toBe(0)
      expect(stats.tasksByPriority).toBeDefined()
      expect(stats.tasksByStatus).toBeDefined()
    })

    it('should handle task enqueue and dequeue correctly', async () => {
      const testTask = {
        id: 'test-task-1',
        type: 'test',
        priority: Priority.NORMAL,
        payload: { test: 'data' },
        requiredCapabilities: [AgentCapability.TESTING],
        maxRetries: 3,
        timeoutMs: 30000,
        createdAt: new Date(),
        status: TaskStatus.PENDING as const,
        updatedAt: new Date()
      }

      // Enqueue task
      await taskQueue.enqueue(testTask)
      
      // Verify task is queued
      expect(taskQueue.getStats().totalTasks).toBe(1)
      
      // Dequeue task
      const dequeuedTask = await taskQueue.dequeue([AgentCapability.TESTING])
      expect(dequeuedTask).toBeDefined()
      expect(dequeuedTask!.id).toBe('test-task-1')
      
      // Queue should be empty
      expect(taskQueue.getStats().totalTasks).toBe(0)
    })

    it('should respect task priorities', async () => {
      const lowPriorityTask = {
        id: 'low-task',
        type: 'test',
        priority: Priority.LOW,
        payload: {},
        requiredCapabilities: [AgentCapability.TESTING],
        maxRetries: 3,
        timeoutMs: 30000,
        createdAt: new Date(),
        status: TaskStatus.PENDING as const,
        updatedAt: new Date()
      }

      const highPriorityTask = {
        id: 'high-task',
        type: 'test',
        priority: Priority.HIGH,
        payload: {},
        requiredCapabilities: [AgentCapability.TESTING],
        maxRetries: 3,
        timeoutMs: 30000,
        createdAt: new Date(),
        status: TaskStatus.PENDING as const,
        updatedAt: new Date()
      }

      // Enqueue low priority first
      await taskQueue.enqueue(lowPriorityTask)
      await taskQueue.enqueue(highPriorityTask)

      // High priority should be dequeued first
      const firstTask = await taskQueue.dequeue([AgentCapability.TESTING])
      expect(firstTask!.id).toBe('high-task')

      const secondTask = await taskQueue.dequeue([AgentCapability.TESTING])
      expect(secondTask!.id).toBe('low-task')
    })

    it('should handle capability matching', async () => {
      const codeTask = {
        id: 'code-task',
        type: 'code',
        priority: Priority.NORMAL,
        payload: {},
        requiredCapabilities: [AgentCapability.CODE_GENERATION],
        maxRetries: 3,
        timeoutMs: 30000,
        createdAt: new Date(),
        status: TaskStatus.PENDING as const,
        updatedAt: new Date()
      }

      const testTask = {
        id: 'test-task',
        type: 'test',
        priority: Priority.NORMAL,
        payload: {},
        requiredCapabilities: [AgentCapability.TESTING],
        maxRetries: 3,
        timeoutMs: 30000,
        createdAt: new Date(),
        status: TaskStatus.PENDING as const,
        updatedAt: new Date()
      }

      await taskQueue.enqueue(codeTask)
      await taskQueue.enqueue(testTask)

      // Agent with only testing capability should only get test task
      const testingTask = await taskQueue.dequeue([AgentCapability.TESTING])
      expect(testingTask!.id).toBe('test-task')

      // Agent with only code capability should only get code task
      const codingTask = await taskQueue.dequeue([AgentCapability.CODE_GENERATION])
      expect(codingTask!.id).toBe('code-task')
    })

    it('should handle task status updates', async () => {
      const task = {
        id: 'status-test-task',
        type: 'test',
        priority: Priority.NORMAL,
        payload: {},
        requiredCapabilities: [AgentCapability.TESTING],
        maxRetries: 3,
        timeoutMs: 30000,
        createdAt: new Date(),
        status: TaskStatus.PENDING as const,
        updatedAt: new Date()
      }

      await taskQueue.enqueue(task)

      // Update status
      await taskQueue.updateTaskStatus(task.id, TaskStatus.IN_PROGRESS)
      
      const updatedTask = await taskQueue.getTask(task.id)
      expect(updatedTask!.status).toBe(TaskStatus.IN_PROGRESS)

      // Complete task
      await taskQueue.updateTaskStatus(task.id, TaskStatus.COMPLETED)
      
      const completedTask = await taskQueue.getTask(task.id)
      expect(completedTask!.status).toBe(TaskStatus.COMPLETED)
    })

    it('should handle queue capacity limits', async () => {
      const smallQueue = new TaskQueue(2)

      const task1 = {
        id: 'task-1',
        type: 'test',
        priority: Priority.NORMAL,
        payload: {},
        requiredCapabilities: [AgentCapability.TESTING],
        maxRetries: 3,
        timeoutMs: 30000,
        createdAt: new Date(),
        status: TaskStatus.PENDING as const,
        updatedAt: new Date()
      }

      const task2 = {
        id: 'task-2',
        type: 'test',
        priority: Priority.NORMAL,
        payload: {},
        requiredCapabilities: [AgentCapability.TESTING],
        maxRetries: 3,
        timeoutMs: 30000,
        createdAt: new Date(),
        status: TaskStatus.PENDING as const,
        updatedAt: new Date()
      }

      const task3 = {
        id: 'task-3',
        type: 'test',
        priority: Priority.NORMAL,
        payload: {},
        requiredCapabilities: [AgentCapability.TESTING],
        maxRetries: 3,
        timeoutMs: 30000,
        createdAt: new Date(),
        status: TaskStatus.PENDING as const,
        updatedAt: new Date()
      }

      // Should be able to add 2 tasks
      await smallQueue.enqueue(task1)
      await smallQueue.enqueue(task2)
      expect(smallQueue.getStats().totalTasks).toBe(2)

      // Third task should throw error
      await expect(smallQueue.enqueue(task3)).rejects.toThrow('Task queue is full')
    })

    it('should cleanup old completed tasks', async () => {
      const oldTask = {
        id: 'old-task',
        type: 'test',
        priority: Priority.NORMAL,
        payload: {},
        requiredCapabilities: [AgentCapability.TESTING],
        maxRetries: 3,
        timeoutMs: 30000,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        status: TaskStatus.COMPLETED as const,
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      }

      const recentTask = {
        id: 'recent-task',
        type: 'test',
        priority: Priority.NORMAL,
        payload: {},
        requiredCapabilities: [AgentCapability.TESTING],
        maxRetries: 3,
        timeoutMs: 30000,
        createdAt: new Date(),
        status: TaskStatus.COMPLETED as const,
        updatedAt: new Date()
      }

      await taskQueue.enqueue(oldTask)
      await taskQueue.enqueue(recentTask)

      expect(taskQueue.getStats().totalTasks).toBe(2)

      // Cleanup tasks older than 1 hour
      const removedCount = taskQueue.cleanup(3600000)
      expect(removedCount).toBe(1)
      expect(taskQueue.getStats().totalTasks).toBe(1)

      // Recent task should still exist
      const remainingTask = await taskQueue.getTask(recentTask.id)
      expect(remainingTask).toBeDefined()
    })
  })

  describe('Agent Registry Operations', () => {
    it('should initialize with empty registry', () => {
      expect(agentRegistry).toBeDefined()
      
      const stats = agentRegistry.getStats()
      expect(stats.totalAgents).toBe(0)
      expect(stats.activeAgents).toBe(0)
    })

    it('should track registry statistics', async () => {
      const stats = agentRegistry.getStats()
      expect(stats).toHaveProperty('totalAgents')
      expect(stats).toHaveProperty('activeAgents')
      expect(stats).toHaveProperty('agentsByStatus')
      expect(stats).toHaveProperty('agentsByCapability')
      expect(stats).toHaveProperty('averageLoad')
      
      expect(stats.totalAgents).toBe(0)
      expect(stats.activeAgents).toBe(0)
      expect(typeof stats.averageLoad).toBe('number')
    })
  })

  describe('Performance Tests', () => {
    it('should handle many tasks efficiently', async () => {
      const taskCount = 50
      const startTime = Date.now()

      const tasks = Array.from({ length: taskCount }, (_, i) => ({
        id: `perf-task-${i}`,
        type: 'performance-test',
        priority: Priority.NORMAL,
        payload: { index: i },
        requiredCapabilities: [AgentCapability.TESTING],
        maxRetries: 3,
        timeoutMs: 30000,
        createdAt: new Date(),
        status: TaskStatus.PENDING as const,
        updatedAt: new Date()
      }))

      // Enqueue all tasks
      for (const task of tasks) {
        await taskQueue.enqueue(task)
      }

      const endTime = Date.now()
      const duration = endTime - startTime

      // Should complete within reasonable time
      expect(duration).toBeLessThan(500) // 500ms for 50 tasks
      expect(taskQueue.getStats().totalTasks).toBe(taskCount)
    })

    it('should handle rapid task operations', async () => {
      const iterations = 20
      
      for (let i = 0; i < iterations; i++) {
        const task = {
          id: `rapid-task-${i}`,
          type: 'rapid-test',
          priority: Priority.NORMAL,
          payload: { iteration: i },
          requiredCapabilities: [AgentCapability.TESTING],
          maxRetries: 3,
          timeoutMs: 30000,
          createdAt: new Date(),
          status: TaskStatus.PENDING as const,
          updatedAt: new Date()
        }

        await taskQueue.enqueue(task)
        const dequeuedTask = await taskQueue.dequeue([AgentCapability.TESTING])
        expect(dequeuedTask!.id).toBe(`rapid-task-${i}`)
      }

      // Queue should be empty
      expect(taskQueue.getStats().totalTasks).toBe(0)
    })
  })
})