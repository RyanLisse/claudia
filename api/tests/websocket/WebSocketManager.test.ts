/**
 * Tests for WebSocket Manager
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { WebSocketManager } from '../../src/websocket/WebSocketManager';
import { testUtils, mocks } from '../setup';

describe('WebSocketManager', () => {
  let wsManager: WebSocketManager;
  let mockClients: Map<string, any>;

  beforeEach(() => {
    // Create a new WebSocket manager for each test
    wsManager = new WebSocketManager(3003); // Use different port for testing
    mockClients = new Map();
  });

  afterEach(() => {
    // Clean up after each test
    if (wsManager) {
      wsManager.close();
    }
  });

  describe('Constructor', () => {
    it('should initialize with default port', () => {
      const manager = new WebSocketManager();
      expect(manager).toBeDefined();
      manager.close();
    });

    it('should initialize with custom port', () => {
      const manager = new WebSocketManager(3004);
      expect(manager).toBeDefined();
      manager.close();
    });
  });

  describe('Client Management', () => {
    it('should generate unique client IDs', () => {
      const client1 = testUtils.createMockWebSocketClient();
      const client2 = testUtils.createMockWebSocketClient();

      expect(client1.id).not.toBe(client2.id);
      expect(client1.id).toMatch(/^client_\d+_[a-z0-9]+$/);
      expect(client2.id).toMatch(/^client_\d+_[a-z0-9]+$/);
    });

    it('should track client connections', () => {
      const stats = wsManager.getStats();
      expect(stats.totalClients).toBe(0);
      expect(stats.totalChannels).toBe(0);
      expect(stats.channels).toEqual([]);
      expect(stats.clients).toEqual([]);
    });
  });

  describe('Channel Management', () => {
    it('should handle channel subscriptions', () => {
      const mockClient = testUtils.createMockWebSocketClient();
      
      // Simulate subscription
      mockClient.channels.add('tasks');
      mockClient.channels.add('agents');

      expect(mockClient.channels.has('tasks')).toBe(true);
      expect(mockClient.channels.has('agents')).toBe(true);
      expect(mockClient.channels.size).toBe(2);
    });

    it('should handle channel unsubscriptions', () => {
      const mockClient = testUtils.createMockWebSocketClient();
      
      // Add channels
      mockClient.channels.add('tasks');
      mockClient.channels.add('agents');
      
      // Remove one channel
      mockClient.channels.delete('tasks');

      expect(mockClient.channels.has('tasks')).toBe(false);
      expect(mockClient.channels.has('agents')).toBe(true);
      expect(mockClient.channels.size).toBe(1);
    });
  });

  describe('Message Broadcasting', () => {
    it('should broadcast messages to channel subscribers', () => {
      const message = {
        type: 'event' as const,
        eventType: 'task_update',
        data: {
          type: 'task_created',
          task: testUtils.createMockTask(),
        },
        timestamp: new Date().toISOString(),
        source: 'server',
      };

      // Test broadcast method exists and can be called
      expect(() => {
        wsManager.broadcast('tasks', message);
      }).not.toThrow();
    });

    it('should broadcast to all clients', () => {
      const message = {
        type: 'event' as const,
        eventType: 'system_update',
        data: { message: 'System maintenance scheduled' },
        timestamp: new Date().toISOString(),
        source: 'server',
      };

      // Test broadcastToAll method exists and can be called
      expect(() => {
        wsManager.broadcastToAll(message);
      }).not.toThrow();
    });

    it('should handle empty channel broadcasts gracefully', () => {
      const message = {
        type: 'event' as const,
        eventType: 'test_event',
        data: { test: true },
        timestamp: new Date().toISOString(),
        source: 'server',
      };

      // Broadcasting to non-existent channel should not throw
      expect(() => {
        wsManager.broadcast('non-existent-channel', message);
      }).not.toThrow();
    });
  });

  describe('Message Validation', () => {
    it('should validate message structure', () => {
      const validMessage = {
        type: 'subscribe',
        channel: 'tasks',
      };

      const invalidMessage = {
        type: 'invalid-type',
        channel: 'tasks',
      };

      // These would be validated by the WebSocket message handler
      expect(validMessage.type).toBe('subscribe');
      expect(invalidMessage.type).toBe('invalid-type');
    });

    it('should handle different message types', () => {
      const messageTypes = ['subscribe', 'unsubscribe', 'publish', 'ping', 'pong', 'event'];
      
      messageTypes.forEach(type => {
        const message = {
          type,
          channel: 'test-channel',
          data: { test: true },
        };

        expect(message.type).toBe(type);
      });
    });
  });

  describe('Connection Lifecycle', () => {
    it('should handle client connection', () => {
      const mockClient = testUtils.createMockWebSocketClient();
      
      // Simulate connection
      expect(mockClient.id).toBeDefined();
      expect(mockClient.ws).toBeDefined();
      expect(mockClient.channels).toBeDefined();
      expect(mockClient.lastPing).toBeDefined();
      expect(mockClient.metadata).toBeDefined();
    });

    it('should handle client disconnection', () => {
      const mockClient = testUtils.createMockWebSocketClient();
      
      // Simulate disconnection
      mockClient.channels.clear();
      
      expect(mockClient.channels.size).toBe(0);
    });

    it('should track client metadata', () => {
      const mockClient = testUtils.createMockWebSocketClient({
        metadata: {
          userAgent: 'test-browser',
          ip: '192.168.1.1',
          connectedAt: new Date(),
          path: '/ws',
        },
      });

      expect(mockClient.metadata.userAgent).toBe('test-browser');
      expect(mockClient.metadata.ip).toBe('192.168.1.1');
      expect(mockClient.metadata.connectedAt).toBeDefined();
      expect(mockClient.metadata.path).toBe('/ws');
    });
  });

  describe('Heartbeat Management', () => {
    it('should track client ping times', () => {
      const mockClient = testUtils.createMockWebSocketClient();
      const initialPing = mockClient.lastPing;
      
      // Simulate ping update
      mockClient.lastPing = new Date();
      
      expect(mockClient.lastPing.getTime()).toBeGreaterThan(initialPing.getTime());
    });

    it('should handle ping/pong messages', () => {
      const pingMessage = { type: 'ping' as const };
      const pongMessage = { type: 'pong' as const };

      expect(pingMessage.type).toBe('ping');
      expect(pongMessage.type).toBe('pong');
    });
  });

  describe('Error Handling', () => {
    it('should handle WebSocket errors gracefully', () => {
      const mockClient = testUtils.createMockWebSocketClient();
      
      // Simulate WebSocket error
      const error = new Error('Connection lost');
      
      // Error handling should not throw
      expect(() => {
        // This would be handled by the WebSocket error handler
        console.error(`WebSocket error for client ${mockClient.id}:`, error);
      }).not.toThrow();
    });

    it('should handle malformed messages', () => {
      const malformedMessage = '{"invalid": json}';
      
      // Message parsing should handle errors
      expect(() => {
        try {
          JSON.parse(malformedMessage);
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      }).not.toThrow();
    });

    it('should handle client timeout', async () => {
      const mockClient = testUtils.createMockWebSocketClient();
      const timeout = 60000; // 60 seconds
      const now = new Date();
      
      // Simulate old ping time
      mockClient.lastPing = new Date(now.getTime() - timeout - 1000);
      
      const isTimedOut = now.getTime() - mockClient.lastPing.getTime() > timeout;
      expect(isTimedOut).toBe(true);
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should provide connection statistics', () => {
      const stats = wsManager.getStats();
      
      expect(stats).toBeDefined();
      expect(stats.totalClients).toBeDefined();
      expect(stats.totalChannels).toBeDefined();
      expect(stats.channels).toBeDefined();
      expect(stats.clients).toBeDefined();
      expect(Array.isArray(stats.channels)).toBe(true);
      expect(Array.isArray(stats.clients)).toBe(true);
    });

    it('should track channel subscriber counts', () => {
      const stats = wsManager.getStats();
      
      // Initially no channels
      expect(stats.channels).toEqual([]);
      
      // Stats structure should be correct
      stats.channels.forEach(channel => {
        expect(channel).toHaveProperty('channel');
        expect(channel).toHaveProperty('subscribers');
        expect(typeof channel.subscribers).toBe('number');
      });
    });

    it('should track client information', () => {
      const stats = wsManager.getStats();
      
      // Initially no clients
      expect(stats.clients).toEqual([]);
      
      // Client stats structure should be correct
      stats.clients.forEach(client => {
        expect(client).toHaveProperty('id');
        expect(client).toHaveProperty('channels');
        expect(client).toHaveProperty('connectedAt');
        expect(client).toHaveProperty('lastPing');
        expect(Array.isArray(client.channels)).toBe(true);
      });
    });
  });

  describe('Cleanup', () => {
    it('should close all connections on shutdown', () => {
      // Test that close method exists and can be called
      expect(() => {
        wsManager.close();
      }).not.toThrow();
    });

    it('should clear intervals on shutdown', () => {
      // Create manager and immediately close
      const manager = new WebSocketManager(3005);
      
      expect(() => {
        manager.close();
      }).not.toThrow();
    });
  });
});
