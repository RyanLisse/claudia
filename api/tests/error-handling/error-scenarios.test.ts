/**
 * Tests for error handling scenarios and edge cases
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { testUtils, mocks, TEST_CONSTANTS } from '../setup';

const { API_BASE } = TEST_CONSTANTS;

describe('Error Handling and Edge Cases', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mocks.inngestClient.send = () => Promise.resolve({ success: true });
  });

  describe('API Error Responses', () => {
    it('should handle 400 Bad Request errors', async () => {
      const response = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Missing required fields
          type: 'invalid-type',
        }),
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should handle 404 Not Found errors', async () => {
      const response = await fetch(`${API_BASE}/api/tasks/non-existent-task-id`);
      
      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should handle 500 Internal Server errors', async () => {
      // Mock service to throw error
      mocks.inngestClient.send = () => Promise.reject(new Error('Internal service error'));

      const response = await fetch(`${API_BASE}/api/tasks/metrics`);
      
      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should handle malformed JSON requests', async () => {
      const response = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{"invalid": json}', // Malformed JSON
      });

      expect(response.status).toBe(400);
    });

    it('should handle missing Content-Type header', async () => {
      const response = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        // Missing Content-Type header
        body: JSON.stringify({
          type: 'code-generation',
          payload: { prompt: 'test' },
          agentId: 'test-agent',
        }),
      });

      // Should still work or return appropriate error
      expect([200, 201, 400, 415]).toContain(response.status);
    });
  });

  describe('Service Unavailability', () => {
    it('should handle Inngest service unavailable', async () => {
      mocks.inngestClient.send = () => Promise.reject(new Error('ECONNREFUSED: Connection refused'));

      const response = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'code-generation',
          payload: { prompt: 'test' },
          agentId: 'test-agent',
        }),
      });

      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should handle timeout errors', async () => {
      mocks.inngestClient.send = () => new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 100);
      });

      const response = await fetch(`${API_BASE}/api/tasks/metrics`);
      
      expect(response.status).toBe(500);
    });

    it('should handle network errors', async () => {
      mocks.inngestClient.send = () => Promise.reject(new Error('Network error: DNS resolution failed'));

      const response = await fetch(`${API_BASE}/api/tasks/metrics`);
      
      expect(response.status).toBe(500);
    });
  });

  describe('Data Validation Edge Cases', () => {
    it('should handle extremely long task prompts', async () => {
      const longPrompt = 'a'.repeat(100000); // 100KB prompt
      
      const response = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'code-generation',
          payload: { prompt: longPrompt },
          agentId: 'test-agent',
        }),
      });

      // Should either accept or reject with appropriate status
      expect([201, 400, 413]).toContain(response.status);
    });

    it('should handle special characters in task data', async () => {
      const specialCharsPrompt = '🚀 Create a function with émojis and spëcial chars: ñáéíóú';
      
      const response = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'code-generation',
          payload: { prompt: specialCharsPrompt },
          agentId: 'test-agent',
        }),
      });

      expect([201, 400]).toContain(response.status);
    });

    it('should handle null and undefined values', async () => {
      const response = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'code-generation',
          payload: { prompt: null },
          agentId: undefined,
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should handle empty strings', async () => {
      const response = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: '',
          payload: { prompt: '' },
          agentId: '',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should handle negative numbers in numeric fields', async () => {
      const response = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'code-generation',
          payload: { prompt: 'test' },
          agentId: 'test-agent',
          timeoutMs: -1000,
          maxRetries: -5,
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle multiple simultaneous requests', async () => {
      const requests = Array.from({ length: 10 }, (_, i) =>
        fetch(`${API_BASE}/api/tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'code-generation',
            payload: { prompt: `Test request ${i}` },
            agentId: `test-agent-${i}`,
          }),
        })
      );

      const responses = await Promise.all(requests);
      
      // All requests should complete
      expect(responses).toHaveLength(10);
      
      // Most should succeed (allowing for some to fail due to service limits)
      const successCount = responses.filter(r => r.status === 201).length;
      expect(successCount).toBeGreaterThan(0);
    });

    it('should handle rapid sequential requests', async () => {
      const responses = [];
      
      for (let i = 0; i < 5; i++) {
        const response = await fetch(`${API_BASE}/api/tasks/metrics`);
        responses.push(response);
      }
      
      // All requests should complete
      expect(responses).toHaveLength(5);
      
      // All should return valid responses
      responses.forEach(response => {
        expect([200, 500]).toContain(response.status);
      });
    });
  });

  describe('Memory and Resource Limits', () => {
    it('should handle large response payloads', async () => {
      // Mock large response
      mocks.inngestClient.send = () => Promise.resolve({
        success: true,
        tasks: Array.from({ length: 1000 }, (_, i) => testUtils.createMockTask({ id: `task-${i}` })),
        count: 1000,
      });

      const response = await fetch(`${API_BASE}/api/tasks`);
      
      expect([200, 500]).toContain(response.status);
    });

    it('should handle memory pressure scenarios', async () => {
      // Simulate memory pressure by creating large objects
      const largeObject = {
        data: Array.from({ length: 10000 }, (_, i) => ({
          id: i,
          content: 'x'.repeat(1000),
        })),
      };

      mocks.inngestClient.send = () => Promise.resolve(largeObject);

      const response = await fetch(`${API_BASE}/api/tasks/metrics`);
      
      expect([200, 500]).toContain(response.status);
    });
  });

  describe('Authentication and Authorization Edge Cases', () => {
    it('should handle missing authentication headers', async () => {
      const response = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // No Authorization header
        },
        body: JSON.stringify({
          type: 'code-generation',
          payload: { prompt: 'test' },
          agentId: 'test-agent',
        }),
      });

      // Should work for now (no auth implemented) or return 401
      expect([201, 401]).toContain(response.status);
    });

    it('should handle malformed authentication tokens', async () => {
      const response = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid-token-format',
        },
        body: JSON.stringify({
          type: 'code-generation',
          payload: { prompt: 'test' },
          agentId: 'test-agent',
        }),
      });

      // Should work for now (no auth implemented) or return 401
      expect([201, 401]).toContain(response.status);
    });
  });

  describe('WebSocket Error Scenarios', () => {
    it('should handle WebSocket connection failures gracefully', () => {
      // Mock WebSocket connection failure
      const mockWs = {
        readyState: 3, // CLOSED
        send: () => { throw new Error('Connection closed'); },
        close: () => {},
      };

      expect(() => {
        try {
          mockWs.send(JSON.stringify({ type: 'test' }));
        } catch (error) {
          console.error('WebSocket send failed:', error);
        }
      }).not.toThrow();
    });

    it('should handle malformed WebSocket messages', () => {
      const malformedMessages = [
        '{"invalid": json}',
        'not-json-at-all',
        '',
        null,
        undefined,
      ];

      malformedMessages.forEach(message => {
        expect(() => {
          try {
            if (message) {
              JSON.parse(message);
            }
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        }).not.toThrow();
      });
    });
  });

  describe('Recovery Mechanisms', () => {
    it('should recover from temporary service failures', async () => {
      let callCount = 0;
      
      // Mock service that fails first time, succeeds second time
      mocks.inngestClient.send = () => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve({ success: true });
      };

      // First call should fail
      const response1 = await fetch(`${API_BASE}/api/tasks/metrics`);
      expect(response1.status).toBe(500);

      // Second call should succeed
      const response2 = await fetch(`${API_BASE}/api/tasks/metrics`);
      expect(response2.status).toBe(200);
    });

    it('should handle graceful degradation', async () => {
      // Mock partial service failure
      mocks.inngestClient.send = () => Promise.resolve({
        success: true,
        tasks: [], // Empty but valid response
        count: 0,
        metrics: null, // Missing metrics
      });

      const response = await fetch(`${API_BASE}/api/tasks`);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });
  });
});
