import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { AgentOrchestrator } from '../../src/agents/core/AgentOrchestrator'
import { BaseAgent } from '../../src/agents/core/BaseAgent'
import { AgentRegistry } from '../../src/agents/core/AgentRegistry'
import { TaskQueue } from '../../src/agents/core/TaskQueue'
import { MessageBroker } from '../../src/agents/communication/MessageBroker'
import { AgentMonitor } from '../../src/agents/monitoring/AgentMonitor'

/**
 * Integration Tests for Agent System
 * Tests the complete agent ecosystem working together
 */
describe('Agent System Integration Tests', () => {
  let orchestrator: AgentOrchestrator
  let agentRegistry: AgentRegistry
  let taskQueue: TaskQueue
  let messageBroker: MessageBroker
  let agentMonitor: AgentMonitor
  let codeAgent: BaseAgent
  let testAgent: BaseAgent
  let reviewAgent: BaseAgent

  beforeAll(async () => {
    // Initialize the complete agent system
    agentRegistry = new AgentRegistry()
    taskQueue = new TaskQueue()
    messageBroker = new MessageBroker()
    agentMonitor = new AgentMonitor()
    
    orchestrator = new AgentOrchestrator({
      registry: agentRegistry,
      taskQueue: taskQueue,
      messageBroker: messageBroker,
      monitor: agentMonitor
    })

    // Create specialized agents
    codeAgent = new BaseAgent({
      id: 'code-agent-1',
      name: 'Senior Code Generator',
      type: 'coder',
      capabilities: ['code-generation', 'refactoring', 'bug-fixing'],
      maxConcurrentTasks: 3
    })

    testAgent = new BaseAgent({
      id: 'test-agent-1',
      name: 'QA Test Engineer',
      type: 'tester',
      capabilities: ['testing', 'test-generation', 'coverage-analysis'],
      maxConcurrentTasks: 2
    })

    reviewAgent = new BaseAgent({
      id: 'review-agent-1',
      name: 'Code Review Specialist',
      type: 'reviewer',
      capabilities: ['code-review', 'quality-analysis', 'documentation'],
      maxConcurrentTasks: 4
    })

    // Register all agents
    await orchestrator.registerAgent(codeAgent)
    await orchestrator.registerAgent(testAgent)
    await orchestrator.registerAgent(reviewAgent)
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

  describe('End-to-End Feature Development Workflow', () => {
    it('should complete full feature development cycle', async () => {
      // Start monitoring
      const monitoringSession = await agentMonitor.startSession('e2e-feature-development')

      // Define a complex feature development task
      const featureTask = {
        id: 'feature-user-auth',
        type: 'feature-development',
        description: 'Implement complete user authentication system',
        priority: 'high' as const,
        requirements: {
          framework: 'React',
          typescript: true,
          testing: true,
          documentation: true
        },
        subtasks: [
          {
            id: 'auth-component',
            type: 'code-generation',
            description: 'Create authentication components',
            requiredCapabilities: ['code-generation'],
            dependencies: []
          },
          {
            id: 'auth-tests',
            type: 'test-generation',
            description: 'Generate comprehensive tests',
            requiredCapabilities: ['testing', 'test-generation'],
            dependencies: ['auth-component']
          },
          {
            id: 'auth-review',
            type: 'code-review',
            description: 'Review code quality and security',
            requiredCapabilities: ['code-review', 'quality-analysis'],
            dependencies: ['auth-component', 'auth-tests']
          }
        ]
      }

      // Execute the complete workflow
      const workflowResult = await orchestrator.executeWorkflow(featureTask)

      // Verify workflow completion
      expect(workflowResult.success).toBe(true)
      expect(workflowResult.completedTasks).toHaveLength(3)
      expect(workflowResult.participatingAgents).toHaveLength(3)

      // Verify each subtask was completed
      const completedTasks = workflowResult.completedTasks
      expect(completedTasks.find(t => t.id === 'auth-component')).toBeDefined()
      expect(completedTasks.find(t => t.id === 'auth-tests')).toBeDefined()
      expect(completedTasks.find(t => t.id === 'auth-review')).toBeDefined()

      // Verify agent participation
      expect(workflowResult.participatingAgents).toContain('code-agent-1')
      expect(workflowResult.participatingAgents).toContain('test-agent-1')
      expect(workflowResult.participatingAgents).toContain('review-agent-1')

      // Verify artifacts were generated
      expect(workflowResult.artifacts).toContain('AuthComponent.tsx')
      expect(workflowResult.artifacts).toContain('AuthComponent.test.tsx')
      expect(workflowResult.artifacts).toContain('code-review-report.md')

      // Stop monitoring and verify metrics
      const sessionMetrics = await agentMonitor.endSession(monitoringSession.id)
      expect(sessionMetrics.totalExecutionTime).toBeGreaterThan(0)
      expect(sessionMetrics.successRate).toBe(1.0)
      expect(sessionMetrics.agentUtilization).toBeGreaterThan(0.5)
    }, 30000)

    it('should handle workflow failures and recovery', async () => {
      // Create a workflow with a failing subtask
      const flakyFeatureTask = {
        id: 'flaky-feature',
        type: 'feature-development',
        description: 'Feature with potential failures',
        priority: 'medium' as const,
        subtasks: [
          {
            id: 'stable-task',
            type: 'code-generation',
            description: 'Stable code generation',
            requiredCapabilities: ['code-generation']
          },
          {
            id: 'failing-task',
            type: 'complex-analysis',
            description: 'Task that will fail initially',
            requiredCapabilities: ['non-existent-capability'],
            retryPolicy: { maxRetries: 2, backoffMultiplier: 1.5 }
          }
        ]
      }

      // Mock the failing capability to eventually succeed
      let failureCount = 0
      vi.spyOn(orchestrator, 'findCapableAgent')
        .mockImplementation((capabilities) => {
          if (capabilities.includes('non-existent-capability')) {
            failureCount++
            if (failureCount <= 2) {
              return null // Simulate no capable agent
            }
            // After 2 failures, return a capable agent
            return reviewAgent
          }
          return codeAgent
        })

      const workflowResult = await orchestrator.executeWorkflow(flakyFeatureTask)

      // Verify recovery worked
      expect(workflowResult.success).toBe(true)
      expect(workflowResult.recoveryActions).toHaveLength(1)
      expect(workflowResult.failedTasksRecovered).toBe(1)
    })
  })

  describe('Multi-Agent Collaboration', () => {
    it('should coordinate multiple agents on shared tasks', async () => {
      const collaborationTask = {
        id: 'collaboration-project',
        type: 'collaborative-development',
        description: 'Multi-agent collaboration on complex project',
        priority: 'high' as const,
        requiresCollaboration: true,
        collaborationPattern: 'sequential-with-feedback',
        phases: [
          {
            phase: 'design',
            primaryAgent: 'review-agent-1',
            supportingAgents: ['code-agent-1'],
            deliverables: ['architecture-design.md']
          },
          {
            phase: 'implementation',
            primaryAgent: 'code-agent-1',
            supportingAgents: ['test-agent-1'],
            deliverables: ['implementation.tsx', 'unit-tests.test.tsx']
          },
          {
            phase: 'validation',
            primaryAgent: 'test-agent-1',
            supportingAgents: ['review-agent-1'],
            deliverables: ['test-report.md', 'quality-report.md']
          }
        ]
      }

      const collaborationResult = await orchestrator.orchestrateCollaboration(collaborationTask)

      // Verify collaboration success
      expect(collaborationResult.success).toBe(true)
      expect(collaborationResult.phasesCompleted).toBe(3)
      expect(collaborationResult.deliverables).toHaveLength(5)

      // Verify agent communication occurred
      const messageHistory = await messageBroker.getMessageHistory(collaborationResult.sessionId)
      expect(messageHistory.length).toBeGreaterThan(0)
      
      // Verify cross-agent communication
      const codeToTestMessages = messageHistory.filter(
        msg => msg.from === 'code-agent-1' && msg.to === 'test-agent-1'
      )
      expect(codeToTestMessages.length).toBeGreaterThan(0)
    })

    it('should handle agent communication failures', async () => {
      // Mock communication failure
      vi.spyOn(messageBroker, 'sendMessage')
        .mockRejectedValueOnce(new Error('Network communication failed'))
        .mockResolvedValue({ success: true, messageId: 'msg-123' })

      const communicationTask = {
        id: 'communication-test',
        type: 'collaborative-task',
        description: 'Test communication resilience',
        priority: 'medium' as const,
        requiresCollaboration: true,
        participants: ['code-agent-1', 'test-agent-1']
      }

      const result = await orchestrator.orchestrateCollaboration(communicationTask)

      // Should succeed despite initial communication failure
      expect(result.success).toBe(true)
      expect(result.communicationRetries).toBeGreaterThan(0)
    })
  })

  describe('Load Balancing and Scaling', () => {
    it('should distribute tasks efficiently across agents', async () => {
      // Create many similar tasks
      const tasks = Array.from({ length: 10 }, (_, i) => ({
        id: `load-test-task-${i}`,
        type: 'code-generation',
        description: `Generate component ${i}`,
        priority: 'medium' as const,
        requiredCapabilities: ['code-generation'],
        estimatedDuration: 1000 + Math.random() * 2000 // 1-3 seconds
      }))

      const startTime = Date.now()
      const results = await Promise.all(
        tasks.map(task => orchestrator.assignTask(task))
      )
      const endTime = Date.now()

      // Verify efficient distribution
      expect(results.every(r => r.success)).toBe(true)
      
      // Verify load distribution
      const agentAssignments = results.reduce((acc, result) => {
        const agentId = result.assignedAgent!
        acc[agentId] = (acc[agentId] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Code agent should handle most tasks (has capability and capacity)
      expect(agentAssignments['code-agent-1']).toBeGreaterThan(0)
      
      // Total execution time should be reasonable (parallel execution)
      const totalTime = endTime - startTime
      expect(totalTime).toBeLessThan(15000) // Should complete in under 15 seconds
    })

    it('should scale up agents when load is high', async () => {
      // Simulate high load scenario
      const highLoadTasks = Array.from({ length: 20 }, (_, i) => ({
        id: `high-load-${i}`,
        type: 'code-generation',
        description: `High load task ${i}`,
        priority: 'high' as const,
        requiredCapabilities: ['code-generation'],
        estimatedDuration: 3000
      }))

      // Monitor system load
      const loadMonitor = await agentMonitor.startLoadMonitoring()

      // Submit all tasks
      const taskPromises = highLoadTasks.map(task => orchestrator.assignTask(task))
      
      // Wait a moment for load detection
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Check if orchestrator recommends scaling
      const scalingRecommendation = await orchestrator.getScalingRecommendation()
      
      expect(scalingRecommendation.shouldScale).toBe(true)
      expect(scalingRecommendation.recommendedAgents).toBeGreaterThan(0)
      expect(scalingRecommendation.agentType).toBe('coder')

      // Wait for tasks to complete
      const results = await Promise.all(taskPromises)
      expect(results.every(r => r.success || r.queued)).toBe(true)

      await agentMonitor.stopLoadMonitoring(loadMonitor.id)
    })
  })

  describe('Error Propagation and System Resilience', () => {
    it('should handle cascading failures gracefully', async () => {
      // Create a dependency chain where one failure affects others
      const dependencyTask = {
        id: 'dependency-chain',
        type: 'complex-feature',
        description: 'Feature with dependency chain',
        priority: 'critical' as const,
        subtasks: [
          {
            id: 'foundation-task',
            type: 'code-generation',
            description: 'Foundation component (will fail)',
            requiredCapabilities: ['code-generation'],
            mockFailure: true
          },
          {
            id: 'dependent-task-1',
            type: 'testing',
            description: 'Tests for foundation',
            requiredCapabilities: ['testing'],
            dependencies: ['foundation-task']
          },
          {
            id: 'dependent-task-2',
            type: 'documentation',
            description: 'Documentation for foundation',
            requiredCapabilities: ['documentation'],
            dependencies: ['foundation-task']
          }
        ]
      }

      // Mock failure for foundation task
      vi.spyOn(codeAgent, 'execute')
        .mockResolvedValueOnce({
          success: false,
          error: 'Critical compilation error',
          recoverable: false
        })

      const result = await orchestrator.executeWorkflow(dependencyTask)

      // Verify graceful failure handling
      expect(result.success).toBe(false)
      expect(result.failedTasks).toContain('foundation-task')
      expect(result.skippedTasks).toContain('dependent-task-1')
      expect(result.skippedTasks).toContain('dependent-task-2')
      expect(result.errorPropagation).toBe(true)
      expect(result.systemStable).toBe(true) // System remains stable despite failure
    })

    it('should recover from agent crashes', async () => {
      const criticalTask = {
        id: 'crash-recovery-test',
        type: 'critical-operation',
        description: 'Task that causes agent crash',
        priority: 'critical' as const,
        requiredCapabilities: ['code-generation'],
        retryPolicy: { maxRetries: 3, useBackupAgents: true }
      }

      // Mock agent crash
      let crashCount = 0
      vi.spyOn(codeAgent, 'execute')
        .mockImplementation(() => {
          crashCount++
          if (crashCount <= 2) {
            throw new Error('Agent crashed unexpectedly')
          }
          return Promise.resolve({ success: true, result: 'recovered' })
        })

      const result = await orchestrator.executeTask(criticalTask)

      // Verify recovery
      expect(result.success).toBe(true)
      expect(result.result).toBe('recovered')
      expect(result.recoveryAttempts).toBe(2)
      expect(result.recoveredFromCrash).toBe(true)
    })
  })

  describe('Performance and Metrics Integration', () => {
    it('should track comprehensive system metrics', async () => {
      // Execute a series of tasks while monitoring
      const monitoringSession = await agentMonitor.startComprehensiveMonitoring()

      const performanceTasks = [
        {
          id: 'perf-task-1',
          type: 'code-generation',
          description: 'Performance test task 1',
          priority: 'medium' as const,
          requiredCapabilities: ['code-generation']
        },
        {
          id: 'perf-task-2',
          type: 'testing',
          description: 'Performance test task 2',
          priority: 'high' as const,
          requiredCapabilities: ['testing']
        },
        {
          id: 'perf-task-3',
          type: 'code-review',
          description: 'Performance test task 3',
          priority: 'low' as const,
          requiredCapabilities: ['code-review']
        }
      ]

      const startTime = Date.now()
      const results = await Promise.all(
        performanceTasks.map(task => orchestrator.assignTask(task))
      )
      const endTime = Date.now()

      const metrics = await agentMonitor.endComprehensiveMonitoring(monitoringSession.id)

      // Verify comprehensive metrics collection
      expect(metrics).toMatchObject({
        totalTasks: 3,
        completedTasks: 3,
        averageTaskTime: expect.any(Number),
        agentUtilization: expect.objectContaining({
          'code-agent-1': expect.any(Number),
          'test-agent-1': expect.any(Number),
          'review-agent-1': expect.any(Number)
        }),
        systemThroughput: expect.any(Number),
        resourceUsage: expect.objectContaining({
          memory: expect.any(Number),
          cpu: expect.any(Number)
        }),
        communicationMetrics: expect.objectContaining({
          messagesSent: expect.any(Number),
          averageLatency: expect.any(Number)
        })
      })

      // Verify performance benchmarks
      expect(metrics.averageTaskTime).toBeLessThan(10000) // Under 10 seconds
      expect(metrics.systemThroughput).toBeGreaterThan(0.1) // At least 0.1 tasks/second
    })

    it('should identify and report performance bottlenecks', async () => {
      // Create a scenario with performance bottlenecks
      const bottleneckTasks = Array.from({ length: 8 }, (_, i) => ({
        id: `bottleneck-task-${i}`,
        type: 'resource-intensive',
        description: `Resource intensive task ${i}`,
        priority: 'medium' as const,
        requiredCapabilities: ['code-generation'], // All go to same agent
        estimatedDuration: 5000 // Long duration
      }))

      const bottleneckAnalysis = await agentMonitor.startBottleneckAnalysis()

      const results = await Promise.all(
        bottleneckTasks.map(task => orchestrator.assignTask(task))
      )

      const bottlenecks = await agentMonitor.endBottleneckAnalysis(bottleneckAnalysis.id)

      // Verify bottleneck detection
      expect(bottlenecks.detected).toBe(true)
      expect(bottlenecks.bottleneckAgents).toContain('code-agent-1')
      expect(bottlenecks.recommendations).toContainEqual(
        expect.objectContaining({
          type: 'scale-agents',
          agentType: 'coder',
          priority: 'high'
        })
      )
    })
  })

  describe('System Health and Monitoring', () => {
    it('should maintain system health during extended operations', async () => {
      const healthMonitor = await agentMonitor.startHealthMonitoring()

      // Run extended operation
      const extendedTasks = Array.from({ length: 50 }, (_, i) => ({
        id: `health-test-${i}`,
        type: 'routine-task',
        description: `Health test task ${i}`,
        priority: 'low' as const,
        requiredCapabilities: ['code-generation']
      }))

      // Execute in batches to simulate extended operation
      for (let i = 0; i < extendedTasks.length; i += 10) {
        const batch = extendedTasks.slice(i, i + 10)
        await Promise.all(batch.map(task => orchestrator.assignTask(task)))
        
        // Check health during operation
        const healthStatus = await agentMonitor.checkSystemHealth()
        expect(healthStatus.overall).toBe('healthy')
        expect(healthStatus.agentHealth['code-agent-1']).toBe('healthy')
        
        // Brief pause between batches
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      const finalHealthReport = await agentMonitor.endHealthMonitoring(healthMonitor.id)

      // Verify system remained healthy
      expect(finalHealthReport.overallHealth).toBe('healthy')
      expect(finalHealthReport.memoryLeaks).toBe(false)
      expect(finalHealthReport.resourceExhaustion).toBe(false)
      expect(finalHealthReport.agentCrashes).toBe(0)
    })
  })
})