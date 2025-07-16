/**
 * Tests for enhanced tasks API routes
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { testUtils, mocks, TEST_CONSTANTS } from '../setup';

const { API_BASE } = TEST_CONSTANTS;

describe('Enhanced Tasks API', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mocks.inngestClient.send = () => Promise.resolve({ success: true });
  });

  describe('GET /api/tasks', () => {
    it('should return empty task list initially', async () => {
      const response = await fetch(`${API_BASE}/api/tasks`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
      expect(data.count).toBe(0);
      expect(data.metrics).toBeDefined();
    });

    it('should handle query parameters for filtering', async () => {
      const queryParams = new URLSearchParams({
        agentId: 'test-agent-1',
        status: 'pending',
        limit: '10',
        offset: '0',
      });

      const response = await fetch(`${API_BASE}/api/tasks?${queryParams}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle invalid query parameters gracefully', async () => {
      const response = await fetch(`${API_BASE}/api/tasks?limit=invalid`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task successfully', async () => {
      const taskData = {
        type: 'code-generation',
        payload: {
          prompt: 'Create a test function',
          context: { language: 'typescript' },
        },
        agentId: 'test-agent-1',
        priority: 'normal',
        timeoutMs: 60000,
        maxRetries: 3,
      };

      const response = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.type).toBe(taskData.type);
      expect(data.data.agentId).toBe(taskData.agentId);
      expect(data.message).toBe('Task created successfully');
    });

    it('should validate required fields', async () => {
      const invalidTaskData = {
        type: 'code-generation',
        // Missing required fields
      };

      const response = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidTaskData),
      });

      expect(response.status).toBe(400);
    });

    it('should validate task type enum', async () => {
      const invalidTaskData = {
        type: 'invalid-type',
        payload: { prompt: 'test' },
        agentId: 'test-agent-1',
      };

      const response = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidTaskData),
      });

      expect(response.status).toBe(400);
    });

    it('should validate priority enum', async () => {
      const invalidTaskData = {
        type: 'code-generation',
        payload: { prompt: 'test' },
        agentId: 'test-agent-1',
        priority: 'invalid-priority',
      };

      const response = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidTaskData),
      });

      expect(response.status).toBe(400);
    });

    it('should handle Inngest service errors', async () => {
      // Mock Inngest to throw an error
      mocks.inngestClient.send = () => Promise.reject(new Error('Inngest service unavailable'));

      const taskData = {
        type: 'code-generation',
        payload: { prompt: 'test' },
        agentId: 'test-agent-1',
      };

      const response = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/tasks/metrics', () => {
    it('should return task metrics', async () => {
      const response = await fetch(`${API_BASE}/api/tasks/metrics`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.total).toBeDefined();
      expect(data.data.byStatus).toBeDefined();
      expect(data.data.byType).toBeDefined();
      expect(data.data.byAgent).toBeDefined();
      expect(data.data.averageExecutionTime).toBeDefined();
      expect(data.data.successRate).toBeDefined();
      expect(data.data.throughput).toBeDefined();
    });

    it('should handle metrics service errors', async () => {
      // Mock TaskManager to throw an error
      mocks.inngestClient.send = () => Promise.reject(new Error('Metrics service unavailable'));

      const response = await fetch(`${API_BASE}/api/tasks/metrics`);
      
      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should return 404 for non-existent task', async () => {
      const response = await fetch(`${API_BASE}/api/tasks/non-existent-id`);
      
      expect(response.status).toBe(404);
    });

    it('should handle service errors gracefully', async () => {
      mocks.inngestClient.send = () => Promise.reject(new Error('Service unavailable'));

      const response = await fetch(`${API_BASE}/api/tasks/test-task-id`);
      
      expect(response.status).toBe(500);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update task status', async () => {
      const updateData = {
        status: 'in_progress',
        progress: 50,
      };

      const response = await fetch(`${API_BASE}/api/tasks/test-task-id`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Task updated successfully');
    });

    it('should validate update data', async () => {
      const invalidUpdateData = {
        status: 'invalid-status',
      };

      const response = await fetch(`${API_BASE}/api/tasks/test-task-id`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidUpdateData),
      });

      expect(response.status).toBe(400);
    });

    it('should validate progress range', async () => {
      const invalidUpdateData = {
        progress: 150, // Invalid: > 100
      };

      const response = await fetch(`${API_BASE}/api/tasks/test-task-id`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidUpdateData),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/tasks/:id/action', () => {
    it('should execute task actions', async () => {
      const actionData = {
        action: 'pause',
        reason: 'Testing pause functionality',
      };

      const response = await fetch(`${API_BASE}/api/tasks/test-task-id/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(actionData),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Task pause executed successfully');
    });

    it('should validate action types', async () => {
      const invalidActionData = {
        action: 'invalid-action',
      };

      const response = await fetch(`${API_BASE}/api/tasks/test-task-id/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidActionData),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/tasks/:id/progress', () => {
    it('should return task progress', async () => {
      const response = await fetch(`${API_BASE}/api/tasks/test-task-id/progress`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.taskId).toBe('test-task-id');
      expect(data.data.progress).toBeDefined();
      expect(data.data.status).toBeDefined();
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete task successfully', async () => {
      const response = await fetch(`${API_BASE}/api/tasks/test-task-id`, {
        method: 'DELETE',
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Task deleted successfully');
    });
  });
});
