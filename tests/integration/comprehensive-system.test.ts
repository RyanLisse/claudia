import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { AgentOrchestrator } from '../../src/agents/core/AgentOrchestrator'
import { AgentRegistry } from '../../src/agents/core/AgentRegistry'
import { TaskQueue } from '../../src/agents/core/TaskQueue'
import { MessageBroker } from '../../src/agents/communication/MessageBroker'
import { AgentMonitor } from '../../src/agents/monitoring/AgentMonitor'
import { Priority, TaskStatus, AgentStatus } from '../../src/agents/types/agent'

/**
 * Comprehensive System Integration Tests
 * Tests the complete agent system with real components working together
 */
describe('Comprehensive System Integration Tests', () => {
  let orchestrator: AgentOrchestrator
  let agentRegistry: AgentRegistry
  let taskQueue: TaskQueue
  let messageBroker: MessageBroker
  let agentMonitor: AgentMonitor

  beforeAll(async () => {
    // Initialize the complete agent system
    agentRegistry = new AgentRegistry()
    taskQueue = new TaskQueue(1000)
    messageBroker = new MessageBroker()
    agentMonitor = new AgentMonitor()
    
    orchestrator = new AgentOrchestrator()
    await orchestrator.initialize()
  })

  afterAll(async () => {
    // Cleanup resources
    await orchestrator.shutdown()
    await messageBroker.disconnect()
    await agentMonitor.stop()
  })

  beforeEach(async () => {
    // Reset system state before each test
    await taskQueue.clear()
    await messageBroker.clearMessages()
    await agentMonitor.reset()
  })

  describe('System Initialization and Health', () => {
    it('should initialize all system components successfully', async () => {
      // Test system status
      const status = await orchestrator.getStatus()
      expect(status.initialized).toBe(true)
      expect(status.healthy).toBe(true)
      
      // Test registry stats
      const registryStats = agentRegistry.getStats()
      expect(registryStats).toHaveProperty('totalAgents')
      expect(registryStats).toHaveProperty('activeAgents')
      
      // Test queue stats
      const queueStats = taskQueue.getStats()
      expect(queueStats.totalTasks).toBe(0)
      expect(queueStats.tasksByStatus).toBeDefined()
      
      // Test message broker
      const brokerStats = messageBroker.getStats()
      expect(brokerStats).toHaveProperty('totalMessages')
      expect(brokerStats.totalMessages).toBe(0)
      
      // Test monitor
      const systemMetrics = await agentMonitor.getSystemMetrics()
      expect(systemMetrics).toHaveProperty('timestamp')
      expect(systemMetrics.timestamp).toBeInstanceOf(Date)
    })

    it('should maintain system health during operation', async () => {
      // Submit multiple tasks to test system stability
      const tasks = Array.from({ length: 10 }, (_, i) => ({
        id: `health-test-${i}`,
        type: 'test-task',
        priority: Priority.NORMAL,
        payload: { index: i },
        requiredCapabilities: ['testing'],
        maxRetries: 3,
        timeoutMs: 30000,
        createdAt: new Date(),
        status: TaskStatus.PENDING as const,
        updatedAt: new Date()
      }))

      // Submit tasks
      for (const task of tasks) {
        await taskQueue.enqueue(task)
      }

      // Check system health
      const status = await orchestrator.getStatus()
      expect(status.healthy).toBe(true)
      
      const queueStats = taskQueue.getStats()
      expect(queueStats.totalTasks).toBe(10)
      expect(queueStats.tasksByStatus[TaskStatus.PENDING]).toBe(10)
    })
  })

  describe('Task Flow Integration', () => {
    it('should handle complete task lifecycle', async () => {
      // Create a test task
      const testTask = {
        id: 'lifecycle-test-1',
        type: 'integration-test',
        priority: Priority.HIGH,
        payload: { test: 'lifecycle' },
        requiredCapabilities: ['testing'],
        maxRetries: 3,
        timeoutMs: 60000,
        createdAt: new Date(),
        status: TaskStatus.PENDING as const,
        updatedAt: new Date()
      }

      // Submit task
      await taskQueue.enqueue(testTask)
      
      // Verify task is queued
      const queuedTask = await taskQueue.getTask(testTask.id)
      expect(queuedTask).toBeDefined()
      expect(queuedTask!.status).toBe(TaskStatus.PENDING)
      
      // Update task status
      await taskQueue.updateTaskStatus(testTask.id, TaskStatus.RUNNING)
      
      // Verify status update
      const runningTask = await taskQueue.getTask(testTask.id)
      expect(runningTask!.status).toBe(TaskStatus.RUNNING)
      
      // Complete task
      await taskQueue.updateTaskStatus(testTask.id, TaskStatus.COMPLETED)
      
      // Verify completion
      const completedTask = await taskQueue.getTask(testTask.id)
      expect(completedTask!.status).toBe(TaskStatus.COMPLETED)
    })

    it('should handle task priority correctly', async () => {
      // Create tasks with different priorities
      const lowPriorityTask = {
        id: 'low-priority',
        type: 'test',
        priority: Priority.LOW,
        payload: {},
        requiredCapabilities: ['testing'],
        maxRetries: 3,
        timeoutMs: 30000,
        createdAt: new Date(),
        status: TaskStatus.PENDING as const,
        updatedAt: new Date()
      }

      const highPriorityTask = {
        id: 'high-priority',
        type: 'test',
        priority: Priority.CRITICAL,
        payload: {},
        requiredCapabilities: ['testing'],
        maxRetries: 3,
        timeoutMs: 30000,
        createdAt: new Date(),
        status: TaskStatus.PENDING as const,
        updatedAt: new Date()
      }

      // Submit low priority first
      await taskQueue.enqueue(lowPriorityTask)
      await taskQueue.enqueue(highPriorityTask)

      // Dequeue should return high priority first
      const firstTask = await taskQueue.dequeue(['testing'])
      expect(firstTask!.id).toBe('high-priority')
      
      const secondTask = await taskQueue.dequeue(['testing'])
      expect(secondTask!.id).toBe('low-priority')
    })
  })

  describe('Message Broker Integration', () => {
    it('should handle message routing correctly', async () => {
      // Register test agents
      messageBroker.registerAgent('agent-1')
      messageBroker.registerAgent('agent-2')

      // Create test message
      const testMessage = {
        id: 'msg-1',
        from: 'agent-1',
        to: 'agent-2',
        type: 'test-message',
        payload: { data: 'test' },
        priority: Priority.NORMAL,
        timestamp: new Date()
      }

      // Send message
      const result = await messageBroker.sendMessage(testMessage)
      expect(result.success).toBe(true)

      // Check message delivery
      const messages = messageBroker.getMessages('agent-2')
      expect(messages).toHaveLength(1)
      expect(messages[0].id).toBe('msg-1')
    })

    it('should handle broadcast messages', async () => {
      // Register multiple agents
      const agents = ['agent-1', 'agent-2', 'agent-3']
      agents.forEach(agentId => messageBroker.registerAgent(agentId))

      // Create broadcast message
      const broadcastMessage = {
        id: 'broadcast-1',
        from: 'system',
        to: '*', // Broadcast
        type: 'system-announcement',
        payload: { announcement: 'System maintenance' },
        priority: Priority.HIGH,
        timestamp: new Date()
      }

      // Send broadcast
      const result = await messageBroker.sendMessage(broadcastMessage)
      expect(result.success).toBe(true)

      // Check all agents received the message
      agents.forEach(agentId => {
        const messages = messageBroker.getMessages(agentId)
        expect(messages).toHaveLength(1)
        expect(messages[0].payload.announcement).toBe('System maintenance')
      })
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle high task volume efficiently', async () => {
      const taskCount = 100
      const startTime = Date.now()

      // Create many tasks
      const tasks = Array.from({ length: taskCount }, (_, i) => ({
        id: `bulk-task-${i}`,
        type: 'bulk-test',
        priority: Priority.NORMAL,
        payload: { index: i },
        requiredCapabilities: ['testing'],
        maxRetries: 3,
        timeoutMs: 30000,
        createdAt: new Date(),
        status: TaskStatus.PENDING as const,
        updatedAt: new Date()
      }))

      // Submit all tasks
      for (const task of tasks) {
        await taskQueue.enqueue(task)
      }

      const endTime = Date.now()
      const duration = endTime - startTime

      // Should complete within reasonable time (less than 1 second for 100 tasks)
      expect(duration).toBeLessThan(1000)

      // Verify all tasks are queued
      const stats = taskQueue.getStats()
      expect(stats.totalTasks).toBe(taskCount)
      expect(stats.tasksByStatus[TaskStatus.PENDING]).toBe(taskCount)
    })

    it('should handle concurrent message sending', async () => {
      // Register agents
      const agentCount = 20
      const agents = Array.from({ length: agentCount }, (_, i) => `agent-${i}`)
      agents.forEach(agentId => messageBroker.registerAgent(agentId))

      // Create concurrent messages
      const messagePromises = agents.map((fromAgent, i) => {
        const toAgent = agents[(i + 1) % agents.length] // Send to next agent
        return messageBroker.sendMessage({
          id: `concurrent-${i}`,
          from: fromAgent,
          to: toAgent,
          type: 'concurrent-test',
          payload: { from: fromAgent, to: toAgent },
          priority: Priority.NORMAL,
          timestamp: new Date()
        })
      })

      // Wait for all messages to be sent
      const results = await Promise.all(messagePromises)
      
      // All should succeed
      expect(results.every(r => r.success)).toBe(true)

      // Each agent should have received one message
      agents.forEach(agentId => {
        const messages = messageBroker.getMessages(agentId)
        expect(messages).toHaveLength(1)
      })
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should handle task queue overflow gracefully', async () => {
      // Fill the queue beyond capacity
      const queueCapacity = 1000
      
      // Try to add more than capacity
      const tasks = Array.from({ length: queueCapacity + 10 }, (_, i) => ({
        id: `overflow-task-${i}`,
        type: 'overflow-test',
        priority: Priority.NORMAL,
        payload: { index: i },
        requiredCapabilities: ['testing'],
        maxRetries: 3,
        timeoutMs: 30000,
        createdAt: new Date(),
        status: TaskStatus.PENDING as const,
        updatedAt: new Date()
      }))

      // Add tasks up to capacity
      for (let i = 0; i < queueCapacity; i++) {
        await taskQueue.enqueue(tasks[i])
      }

      // Adding more should throw an error
      await expect(taskQueue.enqueue(tasks[queueCapacity])).rejects.toThrow('Task queue is full')
      
      // Queue should be at capacity
      const stats = taskQueue.getStats()
      expect(stats.totalTasks).toBe(queueCapacity)
    })

    it('should handle message broker disconnection', async () => {
      // Register agent and send message
      messageBroker.registerAgent('test-agent')
      
      const testMessage = {
        id: 'disconnection-test',
        from: 'system',
        to: 'test-agent',
        type: 'test',
        payload: {},
        priority: Priority.NORMAL,
        timestamp: new Date()
      }

      // Should work normally
      let result = await messageBroker.sendMessage(testMessage)
      expect(result.success).toBe(true)

      // Simulate disconnection
      await messageBroker.disconnect()

      // Messages should still be queued but not delivered immediately
      const testMessage2 = {
        ...testMessage,
        id: 'disconnection-test-2'
      }
      
      // Should handle disconnection gracefully
      result = await messageBroker.sendMessage(testMessage2)
      expect(result.success).toBe(false) // Should fail when disconnected
    })

    it('should handle system resource exhaustion', async () => {
      // Monitor system metrics before heavy operation
      const initialMetrics = await agentMonitor.getSystemMetrics()
      expect(initialMetrics).toBeDefined()

      // Simulate heavy load
      const heavyTasks = Array.from({ length: 500 }, (_, i) => ({
        id: `heavy-task-${i}`,
        type: 'resource-intensive',
        priority: Priority.HIGH,
        payload: { size: 'large', index: i },
        requiredCapabilities: ['heavy-processing'],
        maxRetries: 3,
        timeoutMs: 60000,
        createdAt: new Date(),
        status: TaskStatus.PENDING as const,
        updatedAt: new Date()
      }))

      // Submit heavy tasks
      for (const task of heavyTasks) {
        await taskQueue.enqueue(task)
      }

      // System should still be responsive
      const postLoadMetrics = await agentMonitor.getSystemMetrics()
      expect(postLoadMetrics).toBeDefined()
      expect(postLoadMetrics.timestamp).toBeInstanceOf(Date)

      // Queue should have all tasks
      const stats = taskQueue.getStats()
      expect(stats.totalTasks).toBe(500)
    })
  })

  describe('System Cleanup and Shutdown', () => {
    it('should cleanup old completed tasks', async () => {
      // Create completed tasks with old timestamps
      const oldDate = new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      
      const oldTasks = Array.from({ length: 5 }, (_, i) => ({
        id: `old-task-${i}`,
        type: 'cleanup-test',
        priority: Priority.NORMAL,
        payload: {},
        requiredCapabilities: ['testing'],
        maxRetries: 3,
        timeoutMs: 30000,
        createdAt: oldDate,
        status: TaskStatus.COMPLETED as const,
        updatedAt: oldDate
      }))

      // Add old tasks
      for (const task of oldTasks) {
        await taskQueue.enqueue(task)
        await taskQueue.updateTaskStatus(task.id, TaskStatus.COMPLETED)
      }

      // Add recent task
      const recentTask = {
        id: 'recent-task',
        type: 'cleanup-test',
        priority: Priority.NORMAL,
        payload: {},
        requiredCapabilities: ['testing'],
        maxRetries: 3,
        timeoutMs: 30000,
        createdAt: new Date(),
        status: TaskStatus.COMPLETED as const,
        updatedAt: new Date()
      }
      
      await taskQueue.enqueue(recentTask)
      await taskQueue.updateTaskStatus(recentTask.id, TaskStatus.COMPLETED)

      // Initial state
      expect(taskQueue.getStats().totalTasks).toBe(6)

      // Cleanup old tasks (older than 1 hour)
      const removedCount = taskQueue.cleanup(3600000) // 1 hour
      
      // Should remove 5 old tasks, keep 1 recent
      expect(removedCount).toBe(5)
      expect(taskQueue.getStats().totalTasks).toBe(1)
      
      // Recent task should still exist
      const remainingTask = await taskQueue.getTask(recentTask.id)
      expect(remainingTask).toBeDefined()
    })

    it('should shutdown gracefully', async () => {
      // System should be running
      const initialStatus = await orchestrator.getStatus()
      expect(initialStatus.initialized).toBe(true)

      // Shutdown
      await orchestrator.shutdown()

      // System should be stopped
      const finalStatus = await orchestrator.getStatus()
      expect(finalStatus.initialized).toBe(false)
    })
  })
})