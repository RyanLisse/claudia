import { EventEmitter } from 'eventemitter3';
import { CommunicationManager } from '../CommunicationManager';
import { Message, MessageType, MessagePriority } from '../types/Message';
import { AgentStatus, AgentCapability } from '../../types';

// Mock implementations for testing
jest.mock('../MessageBroker');
jest.mock('../EventBus');
jest.mock('../MessageQueue');
jest.mock('../AgentRegistry');

describe('CommunicationManager', () => {
  let communicationManager: CommunicationManager;
  let mockAgent: any;
  let mockMessage: Message;

  beforeEach(() => {
    communicationManager = new CommunicationManager({
      enablePriorityRouting: true,
      maxRetryAttempts: 3,
      enableEventHistory: true,
      maxEventHistory: 100,
      queueProcessingInterval: 100,
      enableHeartbeat: true,
      heartbeatInterval: 5000,
      enablePersistence: false
    });

    mockAgent = {
      config: {
        id: 'test-agent-1',
        type: 'coder',
        capabilities: [AgentCapability.CODE_GENERATION],
        maxConcurrentTasks: 5
      },
      status: AgentStatus.IDLE,
      metrics: {
        uptime: 1000,
        errorRate: 0.1,
        throughput: 10,
        tasksCompleted: 5,
        tasksInProgress: 0,
        averageResponseTime: 500
      },
      registeredAt: new Date(),
      lastHeartbeat: new Date(),
      capabilities: [AgentCapability.CODE_GENERATION],
      tags: ['test'],
      metadata: {}
    };

    mockMessage = {
      id: 'msg-001',
      type: MessageType.REQUEST,
      senderId: 'sender-1',
      receiverId: 'receiver-1',
      content: { action: 'test' },
      timestamp: new Date(),
      priority: MessagePriority.MEDIUM,
      correlationId: 'corr-001'
    };
  });

  afterEach(async () => {
    await communicationManager.stop();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const manager = new CommunicationManager();
      expect(manager).toBeDefined();
      expect(manager.isRunning).toBe(false);
    });

    it('should initialize with custom configuration', () => {
      const config = {
        enablePriorityRouting: false,
        maxRetryAttempts: 5,
        enableEventHistory: false
      };
      
      const manager = new CommunicationManager(config);
      expect(manager).toBeDefined();
    });

    it('should start and stop successfully', async () => {
      expect(communicationManager.isRunning).toBe(false);
      
      await communicationManager.start();
      expect(communicationManager.isRunning).toBe(true);
      
      await communicationManager.stop();
      expect(communicationManager.isRunning).toBe(false);
    });
  });

  describe('Agent Management', () => {
    beforeEach(async () => {
      await communicationManager.start();
    });

    it('should register agent successfully', async () => {
      const result = await communicationManager.registerAgent(
        mockAgent.config,
        mockAgent.status,
        mockAgent.metrics,
        {
          tags: mockAgent.tags,
          metadata: mockAgent.metadata
        }
      );

      expect(result).toBe(true);
    });

    it('should unregister agent successfully', async () => {
      await communicationManager.registerAgent(
        mockAgent.config,
        mockAgent.status,
        mockAgent.metrics
      );

      const result = await communicationManager.unregisterAgent(mockAgent.config.id);
      expect(result).toBe(true);
    });

    it('should update agent status', async () => {
      await communicationManager.registerAgent(
        mockAgent.config,
        mockAgent.status,
        mockAgent.metrics
      );

      const result = await communicationManager.updateAgentStatus(
        mockAgent.config.id,
        AgentStatus.BUSY
      );
      expect(result).toBe(true);
    });

    it('should get agent by ID', async () => {
      await communicationManager.registerAgent(
        mockAgent.config,
        mockAgent.status,
        mockAgent.metrics
      );

      const agent = communicationManager.getAgent(mockAgent.config.id);
      expect(agent).toBeDefined();
      expect(agent?.config.id).toBe(mockAgent.config.id);
    });

    it('should find agents by query', async () => {
      await communicationManager.registerAgent(
        mockAgent.config,
        mockAgent.status,
        mockAgent.metrics
      );

      const agents = communicationManager.findAgents({
        type: 'coder',
        capabilities: [AgentCapability.CODE_GENERATION]
      });

      expect(agents).toHaveLength(1);
      expect(agents[0].config.id).toBe(mockAgent.config.id);
    });

    it('should find best agent for task', async () => {
      await communicationManager.registerAgent(
        mockAgent.config,
        mockAgent.status,
        mockAgent.metrics
      );

      const bestAgent = communicationManager.findBestAgent([
        AgentCapability.CODE_GENERATION
      ]);

      expect(bestAgent).toBeDefined();
      expect(bestAgent?.config.id).toBe(mockAgent.config.id);
    });
  });

  describe('Message Communication', () => {
    beforeEach(async () => {
      await communicationManager.start();
      await communicationManager.registerAgent(
        mockAgent.config,
        mockAgent.status,
        mockAgent.metrics
      );
    });

    it('should send message successfully', async () => {
      await expect(
        communicationManager.sendMessage(mockMessage)
      ).resolves.not.toThrow();
    });

    it('should send request message', async () => {
      const response = await communicationManager.sendRequest(
        mockMessage.senderId,
        mockMessage.receiverId,
        mockMessage.content,
        { timeout: 5000 }
      );

      expect(response).toBeDefined();
    });

    it('should send response message', async () => {
      const responseMessage = {
        ...mockMessage,
        type: MessageType.RESPONSE,
        content: { result: 'success' }
      };

      await expect(
        communicationManager.sendResponse(
          mockMessage.correlationId!,
          responseMessage.senderId,
          responseMessage.receiverId,
          responseMessage.content
        )
      ).resolves.not.toThrow();
    });

    it('should broadcast message', async () => {
      const broadcastMessage = {
        ...mockMessage,
        type: MessageType.BROADCAST,
        receiverId: undefined
      };

      await expect(
        communicationManager.broadcastMessage(
          broadcastMessage.senderId,
          broadcastMessage.content,
          { excludeAgents: [] }
        )
      ).resolves.not.toThrow();
    });

    it('should handle message with retry on failure', async () => {
      const failingMessage = {
        ...mockMessage,
        receiverId: 'non-existent-agent'
      };

      // This should not throw but should retry internally
      await expect(
        communicationManager.sendMessage(failingMessage)
      ).resolves.not.toThrow();
    });
  });

  describe('Event Management', () => {
    beforeEach(async () => {
      await communicationManager.start();
    });

    it('should publish event', async () => {
      const eventData = { test: 'data' };
      
      await expect(
        communicationManager.publishEvent('test.event', eventData)
      ).resolves.not.toThrow();
    });

    it('should subscribe to events', async () => {
      const eventHandler = jest.fn();
      
      communicationManager.subscribe('test.event', eventHandler);
      
      await communicationManager.publishEvent('test.event', { test: 'data' });
      
      // Allow event processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'test.event',
          data: { test: 'data' }
        })
      );
    });

    it('should unsubscribe from events', async () => {
      const eventHandler = jest.fn();
      
      communicationManager.subscribe('test.event', eventHandler);
      communicationManager.unsubscribe('test.event', eventHandler);
      
      await communicationManager.publishEvent('test.event', { test: 'data' });
      
      // Allow event processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(eventHandler).not.toHaveBeenCalled();
    });
  });

  describe('Statistics and Monitoring', () => {
    beforeEach(async () => {
      await communicationManager.start();
      await communicationManager.registerAgent(
        mockAgent.config,
        mockAgent.status,
        mockAgent.metrics
      );
    });

    it('should collect comprehensive statistics', async () => {
      // Send some messages to generate stats
      await communicationManager.sendMessage(mockMessage);
      await communicationManager.publishEvent('test.event', { test: 'data' });
      
      const stats = communicationManager.getStatistics();
      
      expect(stats).toHaveProperty('totalMessages');
      expect(stats).toHaveProperty('totalEvents');
      expect(stats).toHaveProperty('activeAgents');
      expect(stats).toHaveProperty('queueSize');
      expect(stats).toHaveProperty('messageBrokerStats');
      expect(stats).toHaveProperty('eventBusStats');
      expect(stats).toHaveProperty('messageQueueStats');
      expect(stats).toHaveProperty('agentRegistryStats');
      expect(stats).toHaveProperty('uptime');
      expect(stats).toHaveProperty('memoryUsage');
    });

    it('should track message processing metrics', async () => {
      await communicationManager.sendMessage(mockMessage);
      
      const stats = communicationManager.getStatistics();
      expect(stats.totalMessages).toBeGreaterThan(0);
    });

    it('should track event processing metrics', async () => {
      await communicationManager.publishEvent('test.event', { test: 'data' });
      
      const stats = communicationManager.getStatistics();
      expect(stats.totalEvents).toBeGreaterThan(0);
    });

    it('should track agent registry metrics', async () => {
      const stats = communicationManager.getStatistics();
      expect(stats.activeAgents).toBeGreaterThan(0);
    });
  });

  describe('Health Monitoring', () => {
    beforeEach(async () => {
      await communicationManager.start();
    });

    it('should provide health status', async () => {
      const health = await communicationManager.getHealth();
      
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('uptime');
      expect(health).toHaveProperty('components');
      expect(health.components).toHaveProperty('messageBroker');
      expect(health.components).toHaveProperty('eventBus');
      expect(health.components).toHaveProperty('messageQueue');
      expect(health.components).toHaveProperty('agentRegistry');
    });

    it('should report healthy status when all components are working', async () => {
      const health = await communicationManager.getHealth();
      expect(health.status).toBe('healthy');
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await communicationManager.start();
    });

    it('should handle message sending errors gracefully', async () => {
      const invalidMessage = {
        ...mockMessage,
        receiverId: '', // Invalid receiver
        content: null // Invalid content
      };

      await expect(
        communicationManager.sendMessage(invalidMessage as any)
      ).resolves.not.toThrow();
    });

    it('should handle agent registration errors', async () => {
      const invalidAgent = {
        ...mockAgent.config,
        id: '', // Invalid ID
        type: null // Invalid type
      };

      const result = await communicationManager.registerAgent(
        invalidAgent as any,
        mockAgent.status,
        mockAgent.metrics
      );

      expect(result).toBe(false);
    });

    it('should handle event publishing errors', async () => {
      await expect(
        communicationManager.publishEvent('', null as any)
      ).resolves.not.toThrow();
    });
  });

  describe('Component Integration', () => {
    beforeEach(async () => {
      await communicationManager.start();
    });

    it('should integrate MessageBroker with MessageQueue', async () => {
      await communicationManager.sendMessage(mockMessage);
      
      const stats = communicationManager.getStatistics();
      expect(stats.totalMessages).toBeGreaterThan(0);
      expect(stats.queueSize).toBeGreaterThanOrEqual(0);
    });

    it('should integrate EventBus with message processing', async () => {
      const eventHandler = jest.fn();
      communicationManager.subscribe('message.sent', eventHandler);
      
      await communicationManager.sendMessage(mockMessage);
      
      // Allow event processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(eventHandler).toHaveBeenCalled();
    });

    it('should integrate AgentRegistry with message routing', async () => {
      await communicationManager.registerAgent(
        mockAgent.config,
        mockAgent.status,
        mockAgent.metrics
      );

      const targetedMessage = {
        ...mockMessage,
        receiverId: mockAgent.config.id
      };

      await expect(
        communicationManager.sendMessage(targetedMessage)
      ).resolves.not.toThrow();
    });
  });

  describe('Cleanup and Resource Management', () => {
    it('should cleanup resources on stop', async () => {
      await communicationManager.start();
      
      // Register agent and send messages
      await communicationManager.registerAgent(
        mockAgent.config,
        mockAgent.status,
        mockAgent.metrics
      );
      await communicationManager.sendMessage(mockMessage);
      
      await communicationManager.stop();
      
      expect(communicationManager.isRunning).toBe(false);
    });

    it('should handle multiple stop calls gracefully', async () => {
      await communicationManager.start();
      
      await communicationManager.stop();
      await communicationManager.stop(); // Second stop should not throw
      
      expect(communicationManager.isRunning).toBe(false);
    });

    it('should reject operations when stopped', async () => {
      await communicationManager.start();
      await communicationManager.stop();
      
      await expect(
        communicationManager.sendMessage(mockMessage)
      ).rejects.toThrow('CommunicationManager is not running');
    });
  });

  describe('Configuration Validation', () => {
    it('should handle invalid configuration gracefully', () => {
      const invalidConfig = {
        enablePriorityRouting: 'invalid' as any,
        maxRetryAttempts: -1,
        queueProcessingInterval: 'invalid' as any
      };

      expect(() => new CommunicationManager(invalidConfig)).not.toThrow();
    });

    it('should use default values for missing configuration', () => {
      const partialConfig = {
        enablePriorityRouting: true
      };

      const manager = new CommunicationManager(partialConfig);
      expect(manager).toBeDefined();
    });
  });

  describe('Performance and Scalability', () => {
    beforeEach(async () => {
      await communicationManager.start();
    });

    it('should handle multiple concurrent message sends', async () => {
      const messages = Array.from({ length: 10 }, (_, i) => ({
        ...mockMessage,
        id: `msg-${i}`,
        senderId: `sender-${i}`,
        receiverId: `receiver-${i}`
      }));

      const sendPromises = messages.map(msg => 
        communicationManager.sendMessage(msg)
      );

      await expect(Promise.all(sendPromises)).resolves.not.toThrow();
    });

    it('should handle multiple concurrent agent registrations', async () => {
      const agents = Array.from({ length: 5 }, (_, i) => ({
        config: {
          ...mockAgent.config,
          id: `agent-${i}`
        },
        status: mockAgent.status,
        metrics: mockAgent.metrics
      }));

      const registerPromises = agents.map(agent =>
        communicationManager.registerAgent(agent.config, agent.status, agent.metrics)
      );

      const results = await Promise.all(registerPromises);
      expect(results.every(result => result === true)).toBe(true);
    });

    it('should maintain performance with large numbers of events', async () => {
      const eventCount = 100;
      const publishPromises = Array.from({ length: eventCount }, (_, i) =>
        communicationManager.publishEvent(`test.event.${i}`, { index: i })
      );

      const startTime = Date.now();
      await Promise.all(publishPromises);
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});