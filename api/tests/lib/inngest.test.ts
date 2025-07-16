/**
 * Tests for Inngest integration layer and TaskManager
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { TaskManager } from '../../src/lib/inngest';
import { mocks, testUtils } from '../setup';

describe('Inngest Integration Layer', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mocks.inngestClient.send = () => Promise.resolve({ success: true });
  });

  describe('TaskManager', () => {
    describe('createTask', () => {
      it('should create a task successfully', async () => {
        const taskData = {
          type: 'code-generation',
          payload: {
            prompt: 'Create a test function',
            context: { language: 'typescript' },
          },
          agentId: 'test-agent-1',
          priority: 'normal' as const,
          timeoutMs: 60000,
          maxRetries: 3,
          sessionId: 'test-session-1',
          createdAt: new Date().toISOString(),
          status: 'pending',
        };

        const result = await TaskManager.createTask(taskData);

        expect(result.success).toBe(true);
        expect(result.task).toBeDefined();
        expect(result.task.id).toBeDefined();
        expect(result.task.type).toBe(taskData.type);
        expect(result.task.agentId).toBe(taskData.agentId);
        expect(result.task.status).toBe('pending');
      });

      it('should generate unique task IDs', async () => {
        const taskData = testUtils.createMockTask();

        const result1 = await TaskManager.createTask(taskData);
        const result2 = await TaskManager.createTask(taskData);

        expect(result1.task.id).not.toBe(result2.task.id);
      });

      it('should handle Inngest send errors', async () => {
        mocks.inngestClient.send = () => Promise.reject(new Error('Inngest API Error: 401 Event key not found'));

        const taskData = testUtils.createMockTask();

        await expect(TaskManager.createTask(taskData)).rejects.toThrow('Failed to create task: Inngest API Error: 401 Event key not found');
      });

      it('should handle unknown errors', async () => {
        mocks.inngestClient.send = () => Promise.reject('Unknown error');

        const taskData = testUtils.createMockTask();

        await expect(TaskManager.createTask(taskData)).rejects.toThrow('Failed to create task: Unknown error');
      });
    });

    describe('listTasks', () => {
      it('should return empty list initially', async () => {
        const result = await TaskManager.listTasks({});

        expect(result.success).toBe(true);
        expect(result.tasks).toEqual([]);
        expect(result.count).toBe(0);
        expect(result.metrics).toBeDefined();
      });

      it('should handle filter parameters', async () => {
        const filters = {
          agentId: 'test-agent-1',
          status: 'pending',
          type: 'code-generation',
          sessionId: 'test-session-1',
          limit: 10,
          offset: 0,
        };

        const result = await TaskManager.listTasks(filters);

        expect(result.success).toBe(true);
        expect(result.tasks).toEqual([]);
        expect(result.count).toBe(0);
      });

      it('should handle service errors', async () => {
        mocks.inngestClient.send = () => Promise.reject(new Error('Service unavailable'));

        await expect(TaskManager.listTasks({})).rejects.toThrow('Failed to list tasks: Service unavailable');
      });
    });

    describe('getTask', () => {
      it('should return null for non-existent task', async () => {
        const result = await TaskManager.getTask('non-existent-id');

        expect(result.success).toBe(true);
        expect(result.task).toBe(null);
      });

      it('should handle service errors', async () => {
        mocks.inngestClient.send = () => Promise.reject(new Error('Service unavailable'));

        await expect(TaskManager.getTask('test-task-id')).rejects.toThrow('Failed to get task: Service unavailable');
      });
    });

    describe('updateTask', () => {
      it('should update task successfully', async () => {
        const taskId = 'test-task-id';
        const updates = {
          status: 'in_progress',
          progress: 50,
          updatedAt: new Date().toISOString(),
        };

        const result = await TaskManager.updateTask(taskId, updates);

        expect(result.success).toBe(true);
        expect(result.task).toBeDefined();
        expect(result.task.id).toBe(taskId);
      });

      it('should handle service errors', async () => {
        mocks.inngestClient.send = () => Promise.reject(new Error('Service unavailable'));

        const updates = { status: 'completed', updatedAt: new Date().toISOString() };

        await expect(TaskManager.updateTask('test-task-id', updates)).rejects.toThrow('Failed to update task: Service unavailable');
      });
    });

    describe('executeTaskAction', () => {
      it('should execute cancel action', async () => {
        const result = await TaskManager.executeTaskAction('test-task-id', 'cancel', 'User requested cancellation');

        expect(result.success).toBe(true);
        expect(result.message).toBe('Task cancel executed successfully');
      });

      it('should execute retry action', async () => {
        const result = await TaskManager.executeTaskAction('test-task-id', 'retry', 'Retry after failure');

        expect(result.success).toBe(true);
        expect(result.message).toBe('Task retry executed successfully');
      });

      it('should execute pause action', async () => {
        const result = await TaskManager.executeTaskAction('test-task-id', 'pause', 'Pause for maintenance');

        expect(result.success).toBe(true);
        expect(result.message).toBe('Task pause executed successfully');
      });

      it('should execute resume action', async () => {
        const result = await TaskManager.executeTaskAction('test-task-id', 'resume', 'Resume after pause');

        expect(result.success).toBe(true);
        expect(result.message).toBe('Task resume executed successfully');
      });

      it('should handle unknown actions', async () => {
        await expect(TaskManager.executeTaskAction('test-task-id', 'unknown-action', 'Test')).rejects.toThrow('Unknown action: unknown-action');
      });

      it('should handle service errors', async () => {
        mocks.inngestClient.send = () => Promise.reject(new Error('Service unavailable'));

        await expect(TaskManager.executeTaskAction('test-task-id', 'cancel')).rejects.toThrow('Failed to execute task cancel: Service unavailable');
      });
    });

    describe('getTaskProgress', () => {
      it('should return default progress for non-existent task', async () => {
        const result = await TaskManager.getTaskProgress('test-task-id');

        expect(result.success).toBe(true);
        expect(result.progress).toBe(0);
        expect(result.status).toBe('pending');
        expect(result.estimatedCompletion).toBe(null);
        expect(result.currentStep).toBe(null);
        expect(result.totalSteps).toBe(null);
      });

      it('should handle service errors', async () => {
        mocks.inngestClient.send = () => Promise.reject(new Error('Service unavailable'));

        await expect(TaskManager.getTaskProgress('test-task-id')).rejects.toThrow('Failed to get task progress: Service unavailable');
      });
    });

    describe('getTaskMetrics', () => {
      it('should return default metrics', async () => {
        const result = await TaskManager.getTaskMetrics('24h');

        expect(result.success).toBe(true);
        expect(result.metrics).toBeDefined();
        expect(result.metrics.total).toBe(0);
        expect(result.metrics.byStatus).toEqual({});
        expect(result.metrics.byType).toEqual({});
        expect(result.metrics.byAgent).toEqual({});
        expect(result.metrics.averageExecutionTime).toBe(0);
        expect(result.metrics.successRate).toBe(0);
        expect(result.metrics.throughput).toBe(0);
      });

      it('should handle different time ranges', async () => {
        const result1 = await TaskManager.getTaskMetrics('1h');
        const result2 = await TaskManager.getTaskMetrics('7d');
        const result3 = await TaskManager.getTaskMetrics('30d');

        expect(result1.success).toBe(true);
        expect(result2.success).toBe(true);
        expect(result3.success).toBe(true);
      });

      it('should handle service errors', async () => {
        mocks.inngestClient.send = () => Promise.reject(new Error('Service unavailable'));

        await expect(TaskManager.getTaskMetrics('24h')).rejects.toThrow('Failed to get task metrics: Service unavailable');
      });
    });

    describe('deleteTask', () => {
      it('should delete task successfully', async () => {
        const result = await TaskManager.deleteTask('test-task-id');

        expect(result.success).toBe(true);
        expect(result.message).toBe('Task deleted successfully');
      });

      it('should handle service errors', async () => {
        mocks.inngestClient.send = () => Promise.reject(new Error('Service unavailable'));

        await expect(TaskManager.deleteTask('test-task-id')).rejects.toThrow('Failed to delete task: Service unavailable');
      });
    });
  });

  describe('Utility Functions', () => {
    it('should generate unique task IDs', () => {
      // Access the utility functions through TaskManager (they're private but we can test the behavior)
      const taskData = testUtils.createMockTask();
      
      // Create multiple tasks to test ID uniqueness
      const promises = Array.from({ length: 5 }, () => TaskManager.createTask(taskData));
      
      return Promise.all(promises).then(results => {
        const ids = results.map(result => result.task.id);
        const uniqueIds = new Set(ids);
        
        expect(uniqueIds.size).toBe(ids.length);
      });
    });

    it('should generate unique session IDs', () => {
      const taskData1 = testUtils.createMockTask({ sessionId: undefined });
      const taskData2 = testUtils.createMockTask({ sessionId: undefined });
      
      return Promise.all([
        TaskManager.createTask(taskData1),
        TaskManager.createTask(taskData2)
      ]).then(([result1, result2]) => {
        // Both should have generated session IDs
        expect(result1.task.sessionId).toBeDefined();
        expect(result2.task.sessionId).toBeDefined();
        // They should be different
        expect(result1.task.sessionId).not.toBe(result2.task.sessionId);
      });
    });
  });
});
