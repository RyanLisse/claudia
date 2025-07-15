import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TaskQueue, TaskPriority, TaskStatus, type Task, type TaskQueueConfig } from '../TaskQueue';
import type { AgentCapability } from '../../types';

// Mock timer functions
vi.useFakeTimers();

describe('TaskQueue', () => {
  let taskQueue: TaskQueue;
  let mockConfig: TaskQueueConfig;

  beforeEach(() => {
    mockConfig = {
      maxConcurrentTasks: 5,
      taskTimeoutMs: 30000,
      retryDelayMs: 1000,
      maxRetries: 3,
      priorityEnabled: true,
      persistenceEnabled: false,
      deadLetterQueueEnabled: true,
      processingIntervalMs: 500,
      enableLogging: false
    };
    taskQueue = new TaskQueue(mockConfig);
  });

  afterEach(async () => {
    await taskQueue.cleanup();
    vi.clearAllTimers();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const defaultQueue = new TaskQueue();
      expect(defaultQueue).toBeInstanceOf(TaskQueue);
    });

    it('should initialize with custom configuration', () => {
      expect(taskQueue).toBeInstanceOf(TaskQueue);
      const stats = taskQueue.getStats();
      expect(stats.totalTasks).toBe(0);
      expect(stats.pendingTasks).toBe(0);
    });

    it('should have empty queues initially', () => {
      expect(taskQueue.getAllTasks()).toHaveLength(0);
      expect(taskQueue.getDeadLetterQueue()).toHaveLength(0);
    });
  });

  describe('Task Management', () => {
    it('should add task to queue', async () => {
      const taskId = await taskQueue.addTask('test-task', { data: 'test' });
      
      expect(taskId).toBeDefined();
      expect(taskId).toMatch(/^task-\d+-[a-z0-9]+$/);
      
      const task = taskQueue.getTask(taskId);
      expect(task).toBeDefined();
      expect(task?.type).toBe('test-task');
      expect(task?.status).toBe(TaskStatus.QUEUED);
      expect(task?.priority).toBe(TaskPriority.MEDIUM);
    });

    it('should add task with custom options', async () => {
      const taskId = await taskQueue.addTask('priority-task', { data: 'test' }, {
        priority: TaskPriority.HIGH,
        requiredCapabilities: ['code_generation', 'testing'],
        maxRetries: 5,
        dependencies: [],
        tags: ['urgent', 'backend'],
        metadata: {
          createdBy: 'test-user',
          description: 'High priority test task',
          estimatedDuration: 60000
        }
      });

      const task = taskQueue.getTask(taskId);
      expect(task?.priority).toBe(TaskPriority.HIGH);
      expect(task?.requiredCapabilities).toEqual(['code_generation', 'testing']);
      expect(task?.maxRetries).toBe(5);
      expect(task?.tags).toEqual(['urgent', 'backend']);
      expect(task?.metadata.createdBy).toBe('test-user');
      expect(task?.metadata.description).toBe('High priority test task');
    });

    it('should handle task with dependencies', async () => {
      const task1Id = await taskQueue.addTask('task-1', { data: 'first' });
      const task2Id = await taskQueue.addTask('task-2', { data: 'second' }, {
        dependencies: [task1Id]
      });

      const task1 = taskQueue.getTask(task1Id);
      const task2 = taskQueue.getTask(task2Id);
      
      expect(task1?.status).toBe(TaskStatus.QUEUED);
      expect(task2?.status).toBe(TaskStatus.PENDING); // Should be pending due to dependency
      expect(task2?.dependencies).toContain(task1Id);
    });

    it('should get all tasks', async () => {
      await taskQueue.addTask('task-1', { data: 'first' });
      await taskQueue.addTask('task-2', { data: 'second' });
      await taskQueue.addTask('task-3', { data: 'third' });

      const allTasks = taskQueue.getAllTasks();
      expect(allTasks).toHaveLength(3);
      expect(allTasks.every(task => task.type.startsWith('task-'))).toBe(true);
    });

    it('should find tasks by filter', async () => {
      await taskQueue.addTask('task-1', { data: 'first' }, { priority: TaskPriority.HIGH });
      await taskQueue.addTask('task-2', { data: 'second' }, { priority: TaskPriority.LOW });
      await taskQueue.addTask('task-3', { data: 'third' }, { priority: TaskPriority.HIGH });

      const highPriorityTasks = taskQueue.findTasks({ priority: TaskPriority.HIGH });
      expect(highPriorityTasks).toHaveLength(2);
      expect(highPriorityTasks.every(task => task.priority === TaskPriority.HIGH)).toBe(true);

      const lowPriorityTasks = taskQueue.findTasks({ priority: TaskPriority.LOW });
      expect(lowPriorityTasks).toHaveLength(1);
      expect(lowPriorityTasks[0].priority).toBe(TaskPriority.LOW);
    });

    it('should find tasks by type', async () => {
      await taskQueue.addTask('code-gen', { data: 'code' });
      await taskQueue.addTask('test-gen', { data: 'test' });
      await taskQueue.addTask('code-gen', { data: 'more-code' });

      const codeTasks = taskQueue.findTasks({ type: 'code-gen' });
      expect(codeTasks).toHaveLength(2);
      expect(codeTasks.every(task => task.type === 'code-gen')).toBe(true);

      const testTasks = taskQueue.findTasks({ type: 'test-gen' });
      expect(testTasks).toHaveLength(1);
      expect(testTasks[0].type).toBe('test-gen');
    });

    it('should find tasks by capabilities', async () => {
      await taskQueue.addTask('task-1', { data: 'first' }, {
        requiredCapabilities: ['code_generation', 'testing']
      });
      await taskQueue.addTask('task-2', { data: 'second' }, {
        requiredCapabilities: ['data_analysis']
      });

      const codingTasks = taskQueue.findTasks({ 
        capabilities: ['code_generation'] 
      });
      expect(codingTasks).toHaveLength(1);
      expect(codingTasks[0].requiredCapabilities).toContain('code_generation');

      const analysisTasks = taskQueue.findTasks({ 
        capabilities: ['data_analysis'] 
      });
      expect(analysisTasks).toHaveLength(1);
      expect(analysisTasks[0].requiredCapabilities).toContain('data_analysis');
    });

    it('should find tasks by tags', async () => {
      await taskQueue.addTask('task-1', { data: 'first' }, { tags: ['urgent', 'backend'] });
      await taskQueue.addTask('task-2', { data: 'second' }, { tags: ['frontend'] });
      await taskQueue.addTask('task-3', { data: 'third' }, { tags: ['urgent', 'frontend'] });

      const urgentTasks = taskQueue.findTasks({ tags: ['urgent'] });
      expect(urgentTasks).toHaveLength(2);
      expect(urgentTasks.every(task => task.tags.includes('urgent'))).toBe(true);

      const frontendTasks = taskQueue.findTasks({ tags: ['frontend'] });
      expect(frontendTasks).toHaveLength(2);
      expect(frontendTasks.every(task => task.tags.includes('frontend'))).toBe(true);
    });

    it('should find tasks by date range', async () => {
      const baseDate = new Date('2024-01-01');
      const midDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-31');

      // Mock Date.now to create tasks at different times
      vi.setSystemTime(baseDate);
      const task1Id = await taskQueue.addTask('task-1', { data: 'first' });
      
      vi.setSystemTime(midDate);
      const task2Id = await taskQueue.addTask('task-2', { data: 'second' });
      
      vi.setSystemTime(endDate);
      const task3Id = await taskQueue.addTask('task-3', { data: 'third' });

      const midToEndTasks = taskQueue.findTasks({
        createdAfter: midDate,
        createdBefore: endDate
      });
      expect(midToEndTasks).toHaveLength(1);
      expect(midToEndTasks[0].id).toBe(task2Id);

      const allTasks = taskQueue.findTasks({
        createdAfter: baseDate
      });
      expect(allTasks).toHaveLength(3);
    });
  });

  describe('Task Assignment and Processing', () => {
    it('should get next task for processing', async () => {
      await taskQueue.addTask('task-1', { data: 'first' }, { priority: TaskPriority.LOW });
      await taskQueue.addTask('task-2', { data: 'second' }, { priority: TaskPriority.HIGH });
      await taskQueue.addTask('task-3', { data: 'third' }, { priority: TaskPriority.MEDIUM });

      const nextTask = taskQueue.getNextTask();
      expect(nextTask?.priority).toBe(TaskPriority.HIGH); // Should return highest priority
    });

    it('should get next task based on agent capabilities', async () => {
      await taskQueue.addTask('code-task', { data: 'code' }, {
        requiredCapabilities: ['code_generation']
      });
      await taskQueue.addTask('test-task', { data: 'test' }, {
        requiredCapabilities: ['testing']
      });

      const codeAgentCapabilities: AgentCapability[] = ['code_generation'];
      const testAgentCapabilities: AgentCapability[] = ['testing'];

      const codeTask = taskQueue.getNextTask(codeAgentCapabilities);
      expect(codeTask?.requiredCapabilities).toContain('code_generation');

      const testTask = taskQueue.getNextTask(testAgentCapabilities);
      expect(testTask?.requiredCapabilities).toContain('testing');
    });

    it('should assign task to agent', async () => {
      const taskId = await taskQueue.addTask('test-task', { data: 'test' });
      const agentId = 'agent-001';

      const assigned = await taskQueue.assignTask(taskId, agentId);
      expect(assigned).toBe(true);

      const task = taskQueue.getTask(taskId);
      expect(task?.status).toBe(TaskStatus.ASSIGNED);
      expect(task?.agentId).toBe(agentId);
      expect(task?.startedAt).toBeDefined();
    });

    it('should not assign already assigned task', async () => {
      const taskId = await taskQueue.addTask('test-task', { data: 'test' });
      const agentId1 = 'agent-001';
      const agentId2 = 'agent-002';

      await taskQueue.assignTask(taskId, agentId1);
      const secondAssignment = await taskQueue.assignTask(taskId, agentId2);
      
      expect(secondAssignment).toBe(false);
      
      const task = taskQueue.getTask(taskId);
      expect(task?.agentId).toBe(agentId1); // Should remain with first agent
    });

    it('should start task processing', async () => {
      const taskId = await taskQueue.addTask('test-task', { data: 'test' });
      const agentId = 'agent-001';

      await taskQueue.assignTask(taskId, agentId);
      const started = await taskQueue.startTask(taskId);
      
      expect(started).toBe(true);
      
      const task = taskQueue.getTask(taskId);
      expect(task?.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('should complete task successfully', async () => {
      const taskId = await taskQueue.addTask('test-task', { data: 'test' });
      const agentId = 'agent-001';
      const result = { output: 'task completed' };

      await taskQueue.assignTask(taskId, agentId);
      await taskQueue.startTask(taskId);
      
      const completed = await taskQueue.completeTask(taskId, result);
      expect(completed).toBe(true);

      const task = taskQueue.getTask(taskId);
      expect(task?.status).toBe(TaskStatus.COMPLETED);
      expect(task?.completedAt).toBeDefined();
      expect(task?.metadata.actualDuration).toBeDefined();
    });

    it('should handle task failure', async () => {
      const taskId = await taskQueue.addTask('test-task', { data: 'test' });
      const agentId = 'agent-001';
      const error = new Error('Task failed');

      await taskQueue.assignTask(taskId, agentId);
      await taskQueue.startTask(taskId);
      
      const failed = await taskQueue.failTask(taskId, error);
      expect(failed).toBe(true);

      const task = taskQueue.getTask(taskId);
      expect(task?.status).toBe(TaskStatus.RETRY); // Should retry first
      expect(task?.metadata.errorMessage).toBe('Task failed');
      expect(task?.retryCount).toBe(1);
    });

    it('should move task to dead letter queue after max retries', async () => {
      const taskId = await taskQueue.addTask('test-task', { data: 'test' }, {
        maxRetries: 2
      });
      const agentId = 'agent-001';
      const error = new Error('Task failed');

      // Simulate multiple failures
      for (let i = 0; i < 3; i++) {
        await taskQueue.assignTask(taskId, agentId);
        await taskQueue.startTask(taskId);
        await taskQueue.failTask(taskId, error);
        
        if (i < 2) {
          // Advance time to trigger retry
          vi.advanceTimersByTime(1000);
        }
      }

      const task = taskQueue.getTask(taskId);
      expect(task?.status).toBe(TaskStatus.FAILED);
      expect(task?.retryCount).toBe(2);

      const deadLetterQueue = taskQueue.getDeadLetterQueue();
      expect(deadLetterQueue).toHaveLength(1);
      expect(deadLetterQueue[0].id).toBe(taskId);
    });

    it('should cancel task', async () => {
      const taskId = await taskQueue.addTask('test-task', { data: 'test' });
      const reason = 'User cancelled';

      const cancelled = await taskQueue.cancelTask(taskId, reason);
      expect(cancelled).toBe(true);

      const task = taskQueue.getTask(taskId);
      expect(task?.status).toBe(TaskStatus.CANCELLED);
      expect(task?.metadata.errorMessage).toBe(reason);
    });

    it('should not cancel completed task', async () => {
      const taskId = await taskQueue.addTask('test-task', { data: 'test' });
      const agentId = 'agent-001';

      await taskQueue.assignTask(taskId, agentId);
      await taskQueue.startTask(taskId);
      await taskQueue.completeTask(taskId, { result: 'done' });

      const cancelled = await taskQueue.cancelTask(taskId, 'Too late');
      expect(cancelled).toBe(false);

      const task = taskQueue.getTask(taskId);
      expect(task?.status).toBe(TaskStatus.COMPLETED);
    });

    it('should update task progress', async () => {
      const taskId = await taskQueue.addTask('test-task', { data: 'test' });
      const agentId = 'agent-001';
      const checkpoint = { step: 'processing', data: 'checkpoint' };

      await taskQueue.assignTask(taskId, agentId);
      await taskQueue.startTask(taskId);

      const updated = await taskQueue.updateTaskProgress(taskId, 50, checkpoint);
      expect(updated).toBe(true);

      const task = taskQueue.getTask(taskId);
      expect(task?.metadata.progress).toBe(50);
      expect(task?.metadata.checkpoint).toEqual(checkpoint);
    });

    it('should clamp progress between 0 and 100', async () => {
      const taskId = await taskQueue.addTask('test-task', { data: 'test' });
      const agentId = 'agent-001';

      await taskQueue.assignTask(taskId, agentId);
      await taskQueue.startTask(taskId);

      await taskQueue.updateTaskProgress(taskId, -10);
      let task = taskQueue.getTask(taskId);
      expect(task?.metadata.progress).toBe(0);

      await taskQueue.updateTaskProgress(taskId, 150);
      task = taskQueue.getTask(taskId);
      expect(task?.metadata.progress).toBe(100);
    });
  });

  describe('Dependencies', () => {
    it('should handle task dependencies correctly', async () => {
      const task1Id = await taskQueue.addTask('task-1', { data: 'first' });
      const task2Id = await taskQueue.addTask('task-2', { data: 'second' }, {
        dependencies: [task1Id]
      });
      const task3Id = await taskQueue.addTask('task-3', { data: 'third' }, {
        dependencies: [task1Id, task2Id]
      });

      const task1 = taskQueue.getTask(task1Id);
      const task2 = taskQueue.getTask(task2Id);
      const task3 = taskQueue.getTask(task3Id);

      expect(task1?.status).toBe(TaskStatus.QUEUED);
      expect(task2?.status).toBe(TaskStatus.PENDING);
      expect(task3?.status).toBe(TaskStatus.PENDING);

      // Complete task 1
      await taskQueue.assignTask(task1Id, 'agent-001');
      await taskQueue.startTask(task1Id);
      await taskQueue.completeTask(task1Id, { result: 'done' });

      // Task 2 should now be queued
      const task2Updated = taskQueue.getTask(task2Id);
      expect(task2Updated?.status).toBe(TaskStatus.QUEUED);

      // Task 3 should still be pending
      const task3Updated = taskQueue.getTask(task3Id);
      expect(task3Updated?.status).toBe(TaskStatus.PENDING);

      // Complete task 2
      await taskQueue.assignTask(task2Id, 'agent-002');
      await taskQueue.startTask(task2Id);
      await taskQueue.completeTask(task2Id, { result: 'done' });

      // Task 3 should now be queued
      const task3Final = taskQueue.getTask(task3Id);
      expect(task3Final?.status).toBe(TaskStatus.QUEUED);
    });

    it('should fail dependent tasks when dependency fails', async () => {
      const task1Id = await taskQueue.addTask('task-1', { data: 'first' });
      const task2Id = await taskQueue.addTask('task-2', { data: 'second' }, {
        dependencies: [task1Id]
      });

      // Fail task 1
      await taskQueue.assignTask(task1Id, 'agent-001');
      await taskQueue.startTask(task1Id);
      await taskQueue.failTask(task1Id, new Error('Failed'));

      // Let task 1 exhaust retries
      for (let i = 0; i < 3; i++) {
        vi.advanceTimersByTime(1000);
        await taskQueue.assignTask(task1Id, 'agent-001');
        await taskQueue.startTask(task1Id);
        await taskQueue.failTask(task1Id, new Error('Failed'));
      }

      // Start queue processing to check dependency failures
      await taskQueue.start();
      vi.advanceTimersByTime(500);

      const task2 = taskQueue.getTask(task2Id);
      expect(task2?.status).toBe(TaskStatus.FAILED);
      expect(task2?.metadata.errorMessage).toContain('Dependencies failed');
    });
  });

  describe('Priority Processing', () => {
    it('should process tasks in priority order', async () => {
      const lowId = await taskQueue.addTask('low-task', { data: 'low' }, { priority: TaskPriority.LOW });
      const highId = await taskQueue.addTask('high-task', { data: 'high' }, { priority: TaskPriority.HIGH });
      const mediumId = await taskQueue.addTask('medium-task', { data: 'medium' }, { priority: TaskPriority.MEDIUM });
      const criticalId = await taskQueue.addTask('critical-task', { data: 'critical' }, { priority: TaskPriority.CRITICAL });

      // Get tasks in priority order
      const task1 = taskQueue.getNextTask();
      expect(task1?.id).toBe(criticalId);
      
      await taskQueue.assignTask(criticalId, 'agent-001');
      
      const task2 = taskQueue.getNextTask();
      expect(task2?.id).toBe(highId);
      
      await taskQueue.assignTask(highId, 'agent-002');
      
      const task3 = taskQueue.getNextTask();
      expect(task3?.id).toBe(mediumId);
      
      await taskQueue.assignTask(mediumId, 'agent-003');
      
      const task4 = taskQueue.getNextTask();
      expect(task4?.id).toBe(lowId);
    });

    it('should use FIFO for same priority tasks', async () => {
      const task1Id = await taskQueue.addTask('task-1', { data: 'first' }, { priority: TaskPriority.MEDIUM });
      
      // Small delay to ensure different timestamps
      vi.advanceTimersByTime(10);
      
      const task2Id = await taskQueue.addTask('task-2', { data: 'second' }, { priority: TaskPriority.MEDIUM });
      
      vi.advanceTimersByTime(10);
      
      const task3Id = await taskQueue.addTask('task-3', { data: 'third' }, { priority: TaskPriority.MEDIUM });

      const task1 = taskQueue.getNextTask();
      expect(task1?.id).toBe(task1Id);
      
      await taskQueue.assignTask(task1Id, 'agent-001');
      
      const task2 = taskQueue.getNextTask();
      expect(task2?.id).toBe(task2Id);
      
      await taskQueue.assignTask(task2Id, 'agent-002');
      
      const task3 = taskQueue.getNextTask();
      expect(task3?.id).toBe(task3Id);
    });
  });

  describe('Dead Letter Queue', () => {
    it('should requeue task from dead letter queue', async () => {
      const taskId = await taskQueue.addTask('test-task', { data: 'test' }, { maxRetries: 1 });
      const error = new Error('Task failed');

      // Fail task beyond max retries
      for (let i = 0; i < 2; i++) {
        await taskQueue.assignTask(taskId, 'agent-001');
        await taskQueue.startTask(taskId);
        await taskQueue.failTask(taskId, error);
        
        if (i === 0) {
          vi.advanceTimersByTime(1000);
        }
      }

      // Verify task is in dead letter queue
      const deadLetterQueue = taskQueue.getDeadLetterQueue();
      expect(deadLetterQueue).toHaveLength(1);
      expect(deadLetterQueue[0].id).toBe(taskId);

      // Requeue task
      const requeued = await taskQueue.requeueFromDeadLetter(taskId);
      expect(requeued).toBe(true);

      // Verify task is back in queue
      const task = taskQueue.getTask(taskId);
      expect(task?.status).toBe(TaskStatus.QUEUED);
      expect(task?.retryCount).toBe(0);
      expect(task?.failedAt).toBeUndefined();
      expect(task?.metadata.errorMessage).toBeUndefined();

      // Verify task is removed from dead letter queue
      const updatedDeadLetterQueue = taskQueue.getDeadLetterQueue();
      expect(updatedDeadLetterQueue).toHaveLength(0);
    });

    it('should not requeue non-existent task from dead letter queue', async () => {
      const requeued = await taskQueue.requeueFromDeadLetter('non-existent');
      expect(requeued).toBe(false);
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout long-running tasks', async () => {
      const taskId = await taskQueue.addTask('long-task', { data: 'test' }, {
        timeoutMs: 5000
      });

      await taskQueue.assignTask(taskId, 'agent-001');
      await taskQueue.startTask(taskId);

      // Start queue processing
      await taskQueue.start();

      // Advance time past timeout
      vi.advanceTimersByTime(6000);

      const task = taskQueue.getTask(taskId);
      expect(task?.status).toBe(TaskStatus.TIMEOUT);
    });

    it('should use default timeout when not specified', async () => {
      const taskId = await taskQueue.addTask('task', { data: 'test' });

      await taskQueue.assignTask(taskId, 'agent-001');
      await taskQueue.startTask(taskId);

      // Start queue processing
      await taskQueue.start();

      // Advance time past default timeout (30000ms)
      vi.advanceTimersByTime(31000);

      const task = taskQueue.getTask(taskId);
      expect(task?.status).toBe(TaskStatus.TIMEOUT);
    });
  });

  describe('Statistics', () => {
    it('should track task statistics', async () => {
      const task1Id = await taskQueue.addTask('task-1', { data: 'first' }, { priority: TaskPriority.HIGH });
      const task2Id = await taskQueue.addTask('task-2', { data: 'second' }, { priority: TaskPriority.LOW });
      const task3Id = await taskQueue.addTask('task-3', { data: 'third' }, { priority: TaskPriority.HIGH });

      let stats = taskQueue.getStats();
      expect(stats.totalTasks).toBe(3);
      expect(stats.queuedTasks).toBe(3);
      expect(stats.tasksByPriority.get(TaskPriority.HIGH)).toBe(2);
      expect(stats.tasksByPriority.get(TaskPriority.LOW)).toBe(1);
      expect(stats.tasksByType.get('task-1')).toBe(1);
      expect(stats.tasksByType.get('task-2')).toBe(1);
      expect(stats.tasksByType.get('task-3')).toBe(1);

      // Complete one task
      await taskQueue.assignTask(task1Id, 'agent-001');
      await taskQueue.startTask(task1Id);
      await taskQueue.completeTask(task1Id, { result: 'done' });

      stats = taskQueue.getStats();
      expect(stats.completedTasks).toBe(1);
      expect(stats.queuedTasks).toBe(2);
      expect(stats.inProgressTasks).toBe(0);
    });

    it('should calculate average processing times', async () => {
      const task1Id = await taskQueue.addTask('task-1', { data: 'first' });
      const task2Id = await taskQueue.addTask('task-2', { data: 'second' });

      // Complete task 1 with specific timing
      await taskQueue.assignTask(task1Id, 'agent-001');
      vi.advanceTimersByTime(1000);
      await taskQueue.startTask(task1Id);
      vi.advanceTimersByTime(5000);
      await taskQueue.completeTask(task1Id, { result: 'done' });

      // Complete task 2 with different timing
      await taskQueue.assignTask(task2Id, 'agent-002');
      vi.advanceTimersByTime(2000);
      await taskQueue.startTask(task2Id);
      vi.advanceTimersByTime(3000);
      await taskQueue.completeTask(task2Id, { result: 'done' });

      const stats = taskQueue.getStats();
      expect(stats.averageProcessingTime).toBe(4000); // (5000 + 3000) / 2
      expect(stats.averageWaitTime).toBe(1500); // (1000 + 2000) / 2
    });

    it('should calculate throughput and error rate', async () => {
      const task1Id = await taskQueue.addTask('task-1', { data: 'first' });
      const task2Id = await taskQueue.addTask('task-2', { data: 'second' });
      const task3Id = await taskQueue.addTask('task-3', { data: 'third' });

      // Complete one task
      await taskQueue.assignTask(task1Id, 'agent-001');
      await taskQueue.startTask(task1Id);
      await taskQueue.completeTask(task1Id, { result: 'done' });

      // Fail one task (with retries exhausted)
      await taskQueue.assignTask(task2Id, 'agent-002');
      await taskQueue.startTask(task2Id);
      for (let i = 0; i < 4; i++) {
        await taskQueue.failTask(task2Id, new Error('Failed'));
        if (i < 3) {
          vi.advanceTimersByTime(1000);
          await taskQueue.assignTask(task2Id, 'agent-002');
          await taskQueue.startTask(task2Id);
        }
      }

      const stats = taskQueue.getStats();
      expect(stats.throughput).toBe(2); // 1 completed + 1 failed
      expect(stats.errorRate).toBe(0.5); // 1 failed / 2 total processed
    });
  });

  describe('Queue Lifecycle', () => {
    it('should start and stop queue processor', async () => {
      expect(taskQueue['isRunning']).toBe(false);

      await taskQueue.start();
      expect(taskQueue['isRunning']).toBe(true);

      await taskQueue.stop();
      expect(taskQueue['isRunning']).toBe(false);
    });

    it('should not start already running queue', async () => {
      await taskQueue.start();
      expect(taskQueue['isRunning']).toBe(true);

      // Try to start again
      await taskQueue.start();
      expect(taskQueue['isRunning']).toBe(true);
    });

    it('should not stop already stopped queue', async () => {
      expect(taskQueue['isRunning']).toBe(false);

      await taskQueue.stop();
      expect(taskQueue['isRunning']).toBe(false);
    });

    it('should reset queue state', async () => {
      await taskQueue.addTask('task-1', { data: 'first' });
      await taskQueue.addTask('task-2', { data: 'second' });

      let stats = taskQueue.getStats();
      expect(stats.totalTasks).toBe(2);

      taskQueue.reset();

      stats = taskQueue.getStats();
      expect(stats.totalTasks).toBe(0);
      expect(taskQueue.getAllTasks()).toHaveLength(0);
      expect(taskQueue.getDeadLetterQueue()).toHaveLength(0);
    });

    it('should cleanup resources', async () => {
      await taskQueue.addTask('task-1', { data: 'first' });
      await taskQueue.start();

      expect(taskQueue['isRunning']).toBe(true);
      expect(taskQueue.getAllTasks()).toHaveLength(1);

      await taskQueue.cleanup();

      expect(taskQueue['isRunning']).toBe(false);
      expect(taskQueue.getAllTasks()).toHaveLength(0);
    });

    it('should clear completed tasks', async () => {
      const task1Id = await taskQueue.addTask('task-1', { data: 'first' });
      const task2Id = await taskQueue.addTask('task-2', { data: 'second' });
      const task3Id = await taskQueue.addTask('task-3', { data: 'third' });

      // Complete some tasks
      await taskQueue.assignTask(task1Id, 'agent-001');
      await taskQueue.startTask(task1Id);
      await taskQueue.completeTask(task1Id, { result: 'done' });

      await taskQueue.assignTask(task2Id, 'agent-002');
      await taskQueue.startTask(task2Id);
      await taskQueue.completeTask(task2Id, { result: 'done' });

      // Leave task3 in queue
      expect(taskQueue.getAllTasks()).toHaveLength(3);

      const clearedCount = taskQueue.clearCompletedTasks();
      expect(clearedCount).toBe(2);
      expect(taskQueue.getAllTasks()).toHaveLength(1);
      expect(taskQueue.getTask(task3Id)).toBeDefined();
    });
  });

  describe('Event Emission', () => {
    it('should emit events for task lifecycle', async () => {
      const events: string[] = [];
      
      taskQueue.on('task.added', () => events.push('task.added'));
      taskQueue.on('task.assigned', () => events.push('task.assigned'));
      taskQueue.on('task.started', () => events.push('task.started'));
      taskQueue.on('task.completed', () => events.push('task.completed'));
      taskQueue.on('task.failed', () => events.push('task.failed'));
      taskQueue.on('task.cancelled', () => events.push('task.cancelled'));

      const taskId = await taskQueue.addTask('test-task', { data: 'test' });
      await taskQueue.assignTask(taskId, 'agent-001');
      await taskQueue.startTask(taskId);
      await taskQueue.completeTask(taskId, { result: 'done' });

      expect(events).toEqual(['task.added', 'task.assigned', 'task.started', 'task.completed']);
    });

    it('should emit queue lifecycle events', async () => {
      const events: string[] = [];
      
      taskQueue.on('queue.started', () => events.push('queue.started'));
      taskQueue.on('queue.stopped', () => events.push('queue.stopped'));
      taskQueue.on('queue.reset', () => events.push('queue.reset'));

      await taskQueue.start();
      await taskQueue.stop();
      taskQueue.reset();

      expect(events).toEqual(['queue.started', 'queue.stopped', 'queue.reset']);
    });

    it('should emit progress events', async () => {
      const progressEvents: Array<{ progress: number }> = [];
      
      taskQueue.on('task.progress', (data) => progressEvents.push({ progress: data.progress }));

      const taskId = await taskQueue.addTask('test-task', { data: 'test' });
      await taskQueue.assignTask(taskId, 'agent-001');
      await taskQueue.startTask(taskId);
      
      await taskQueue.updateTaskProgress(taskId, 25);
      await taskQueue.updateTaskProgress(taskId, 50);
      await taskQueue.updateTaskProgress(taskId, 100);

      expect(progressEvents).toEqual([
        { progress: 25 },
        { progress: 50 },
        { progress: 100 }
      ]);
    });

    it('should emit timeout events', async () => {
      const timeoutEvents: Array<{ taskId: string }> = [];
      
      taskQueue.on('task.timeout', (data) => timeoutEvents.push({ taskId: data.task.id }));

      const taskId = await taskQueue.addTask('test-task', { data: 'test' }, { timeoutMs: 1000 });
      await taskQueue.assignTask(taskId, 'agent-001');
      await taskQueue.startTask(taskId);

      await taskQueue.start();
      vi.advanceTimersByTime(1500);

      expect(timeoutEvents).toHaveLength(1);
      expect(timeoutEvents[0].taskId).toBe(taskId);
    });

    it('should emit dependency failure events', async () => {
      const dependencyFailureEvents: Array<{ taskId: string }> = [];
      
      taskQueue.on('task.dependency.failed', (data) => 
        dependencyFailureEvents.push({ taskId: data.task.id })
      );

      const task1Id = await taskQueue.addTask('task-1', { data: 'first' });
      const task2Id = await taskQueue.addTask('task-2', { data: 'second' }, {
        dependencies: [task1Id]
      });

      // Fail task 1
      await taskQueue.assignTask(task1Id, 'agent-001');
      await taskQueue.startTask(task1Id);
      
      // Exhaust retries
      for (let i = 0; i < 4; i++) {
        await taskQueue.failTask(task1Id, new Error('Failed'));
        if (i < 3) {
          vi.advanceTimersByTime(1000);
          await taskQueue.assignTask(task1Id, 'agent-001');
          await taskQueue.startTask(task1Id);
        }
      }

      await taskQueue.start();
      vi.advanceTimersByTime(500);

      expect(dependencyFailureEvents).toHaveLength(1);
      expect(dependencyFailureEvents[0].taskId).toBe(task2Id);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty queue operations', () => {
      expect(taskQueue.getNextTask()).toBeUndefined();
      expect(taskQueue.getAllTasks()).toHaveLength(0);
      expect(taskQueue.findTasks({ status: TaskStatus.QUEUED })).toHaveLength(0);
    });

    it('should handle operations on non-existent tasks', async () => {
      const nonExistentId = 'non-existent-task';
      
      expect(taskQueue.getTask(nonExistentId)).toBeUndefined();
      expect(await taskQueue.assignTask(nonExistentId, 'agent-001')).toBe(false);
      expect(await taskQueue.startTask(nonExistentId)).toBe(false);
      expect(await taskQueue.completeTask(nonExistentId, { result: 'done' })).toBe(false);
      expect(await taskQueue.failTask(nonExistentId, new Error('Failed'))).toBe(false);
      expect(await taskQueue.cancelTask(nonExistentId)).toBe(false);
      expect(await taskQueue.updateTaskProgress(nonExistentId, 50)).toBe(false);
    });

    it('should handle invalid state transitions', async () => {
      const taskId = await taskQueue.addTask('test-task', { data: 'test' });
      
      // Try to start unassigned task
      expect(await taskQueue.startTask(taskId)).toBe(false);
      
      // Try to complete non-started task
      expect(await taskQueue.completeTask(taskId, { result: 'done' })).toBe(false);
    });

    it('should handle circular dependencies', async () => {
      const task1Id = await taskQueue.addTask('task-1', { data: 'first' });
      const task2Id = await taskQueue.addTask('task-2', { data: 'second' }, {
        dependencies: [task1Id]
      });
      
      // Try to create circular dependency (this should be handled gracefully)
      const task3Id = await taskQueue.addTask('task-3', { data: 'third' }, {
        dependencies: [task2Id]
      });

      // Add task1 dependency on task3 (circular)
      const task1 = taskQueue.getTask(task1Id);
      if (task1) {
        task1.dependencies.push(task3Id);
      }

      // No tasks should be able to proceed
      expect(taskQueue.getNextTask()).toBeUndefined();
    });
  });
});