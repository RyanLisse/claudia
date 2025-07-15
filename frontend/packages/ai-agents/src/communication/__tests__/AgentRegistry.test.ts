import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AgentRegistry, type RegisteredAgent, type AgentQuery, type AgentRegistryConfig } from '../AgentRegistry';
import { AgentStatus, AgentCapability, type AgentConfig, type AgentMetrics } from '../../types';

// Mock timers for heartbeat testing
vi.useFakeTimers();

describe('AgentRegistry', () => {
  let registry: AgentRegistry;
  let mockAgent: RegisteredAgent;
  let mockConfig: AgentConfig;
  let mockMetrics: AgentMetrics;

  beforeEach(() => {
    // Create a fresh registry for each test
    registry = new AgentRegistry({
      heartbeatTimeoutMs: 60000,
      enableLogging: false,
      enablePersistence: false,
      maxInactiveTimeMs: 300000
    });

    // Create mock agent config
    mockConfig = {
      id: 'test-agent-1',
      name: 'Test Agent 1',
      type: 'coder',
      capabilities: [AgentCapability.CODE_GENERATION, AgentCapability.CODE_REVIEW],
      maxConcurrentTasks: 3,
      version: '1.0.0'
    };

    // Create mock metrics
    mockMetrics = {
      tasksCompleted: 10,
      tasksInProgress: 1,
      averageTaskTime: 5000,
      errorRate: 0.1,
      uptime: 86400000,
      throughput: 2.5,
      memoryUsage: 512,
      cpuUsage: 25
    };

    // Create mock registered agent
    mockAgent = {
      config: mockConfig,
      status: AgentStatus.IDLE,
      metrics: mockMetrics,
      registeredAt: new Date(),
      lastHeartbeat: new Date(),
      capabilities: mockConfig.capabilities,
      tags: ['test', 'development'],
      metadata: { environment: 'test', version: '1.0.0' }
    };
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      const defaultRegistry = new AgentRegistry();
      const stats = defaultRegistry.getStats();
      
      expect(stats.totalAgents).toBe(0);
      expect(stats.activeAgents).toBe(0);
      expect(stats.inactiveAgents).toBe(0);
      expect(stats.agentsByType.size).toBe(0);
      expect(stats.agentsByStatus.size).toBe(0);
    });

    it('should initialize with custom configuration', () => {
      const customConfig: AgentRegistryConfig = {
        heartbeatTimeoutMs: 30000,
        enableLogging: true,
        enablePersistence: true,
        maxInactiveTimeMs: 120000
      };
      
      const customRegistry = new AgentRegistry(customConfig);
      expect(customRegistry).toBeDefined();
    });

    it('should start heartbeat checker on initialization', () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval');
      new AgentRegistry({ heartbeatTimeoutMs: 60000 });
      
      expect(setIntervalSpy).toHaveBeenCalledWith(
        expect.any(Function),
        30000 // heartbeatTimeoutMs / 2
      );
    });
  });

  describe('registerAgent', () => {
    it('should register a new agent successfully', async () => {
      const eventSpy = vi.fn();
      registry.on('agent.registered', eventSpy);

      await registry.registerAgent(mockConfig, AgentStatus.IDLE, mockMetrics);

      const registeredAgent = registry.getAgent(mockConfig.id);
      expect(registeredAgent).toBeDefined();
      expect(registeredAgent?.config.id).toBe(mockConfig.id);
      expect(registeredAgent?.status).toBe(AgentStatus.IDLE);
      expect(registeredAgent?.metrics).toEqual(mockMetrics);
      expect(eventSpy).toHaveBeenCalledWith({ agent: expect.any(Object) });
    });

    it('should register agent with optional parameters', async () => {
      const options = {
        address: 'http://localhost:3000',
        tags: ['production', 'backend'],
        metadata: { region: 'us-east-1', datacenter: 'dc1' }
      };

      await registry.registerAgent(mockConfig, AgentStatus.IDLE, mockMetrics, options);

      const registeredAgent = registry.getAgent(mockConfig.id);
      expect(registeredAgent?.address).toBe(options.address);
      expect(registeredAgent?.tags).toEqual(options.tags);
      expect(registeredAgent?.metadata).toEqual(options.metadata);
    });

    it('should update existing agent when re-registering', async () => {
      // Register agent first time
      await registry.registerAgent(mockConfig, AgentStatus.IDLE, mockMetrics);
      const initialStats = registry.getStats();
      
      // Update agent config
      const updatedMetrics = { ...mockMetrics, tasksCompleted: 20 };
      await registry.registerAgent(mockConfig, AgentStatus.BUSY, updatedMetrics);

      const updatedAgent = registry.getAgent(mockConfig.id);
      expect(updatedAgent?.status).toBe(AgentStatus.BUSY);
      expect(updatedAgent?.metrics.tasksCompleted).toBe(20);
      
      // Should not increase total agent count
      const updatedStats = registry.getStats();
      expect(updatedStats.totalAgents).toBe(initialStats.totalAgents);
    });

    it('should update statistics after registration', async () => {
      await registry.registerAgent(mockConfig, AgentStatus.IDLE, mockMetrics);

      const stats = registry.getStats();
      expect(stats.totalAgents).toBe(1);
      expect(stats.activeAgents).toBe(1);
      expect(stats.agentsByType.get('coder')).toBe(1);
      expect(stats.agentsByStatus.get(AgentStatus.IDLE)).toBe(1);
    });
  });

  describe('unregisterAgent', () => {
    beforeEach(async () => {
      await registry.registerAgent(mockConfig, AgentStatus.IDLE, mockMetrics);
    });

    it('should unregister an existing agent', async () => {
      const eventSpy = vi.fn();
      registry.on('agent.unregistered', eventSpy);

      const result = await registry.unregisterAgent(mockConfig.id);

      expect(result).toBe(true);
      expect(registry.getAgent(mockConfig.id)).toBeUndefined();
      expect(eventSpy).toHaveBeenCalledWith({
        agentId: mockConfig.id,
        agent: expect.any(Object)
      });
    });

    it('should return false for non-existent agent', async () => {
      const result = await registry.unregisterAgent('non-existent-agent');
      expect(result).toBe(false);
    });

    it('should update statistics after unregistration', async () => {
      await registry.unregisterAgent(mockConfig.id);

      const stats = registry.getStats();
      expect(stats.totalAgents).toBe(0);
      expect(stats.activeAgents).toBe(0);
      expect(stats.agentsByType.get('coder')).toBeUndefined();
      expect(stats.agentsByStatus.get(AgentStatus.IDLE)).toBeUndefined();
    });
  });

  describe('updateAgentStatus', () => {
    beforeEach(async () => {
      await registry.registerAgent(mockConfig, AgentStatus.IDLE, mockMetrics);
    });

    it('should update agent status successfully', async () => {
      const eventSpy = vi.fn();
      registry.on('agent.status.updated', eventSpy);

      const result = await registry.updateAgentStatus(mockConfig.id, AgentStatus.BUSY);

      expect(result).toBe(true);
      const agent = registry.getAgent(mockConfig.id);
      expect(agent?.status).toBe(AgentStatus.BUSY);
      expect(eventSpy).toHaveBeenCalledWith({
        agentId: mockConfig.id,
        oldStatus: AgentStatus.IDLE,
        newStatus: AgentStatus.BUSY,
        agent: expect.any(Object)
      });
    });

    it('should return false for non-existent agent', async () => {
      const result = await registry.updateAgentStatus('non-existent-agent', AgentStatus.BUSY);
      expect(result).toBe(false);
    });

    it('should update lastHeartbeat when status changes', async () => {
      const agent = registry.getAgent(mockConfig.id);
      const originalHeartbeat = agent?.lastHeartbeat;

      // Wait a bit to ensure timestamp difference
      vi.advanceTimersByTime(100);

      await registry.updateAgentStatus(mockConfig.id, AgentStatus.BUSY);

      const updatedAgent = registry.getAgent(mockConfig.id);
      expect(updatedAgent?.lastHeartbeat).not.toEqual(originalHeartbeat);
    });
  });

  describe('updateAgentMetrics', () => {
    beforeEach(async () => {
      await registry.registerAgent(mockConfig, AgentStatus.IDLE, mockMetrics);
    });

    it('should update agent metrics successfully', async () => {
      const eventSpy = vi.fn();
      registry.on('agent.metrics.updated', eventSpy);

      const newMetrics = { ...mockMetrics, tasksCompleted: 15 };
      const result = await registry.updateAgentMetrics(mockConfig.id, newMetrics);

      expect(result).toBe(true);
      const agent = registry.getAgent(mockConfig.id);
      expect(agent?.metrics.tasksCompleted).toBe(15);
      expect(eventSpy).toHaveBeenCalledWith({
        agentId: mockConfig.id,
        metrics: newMetrics,
        agent: expect.any(Object)
      });
    });

    it('should return false for non-existent agent', async () => {
      const result = await registry.updateAgentMetrics('non-existent-agent', mockMetrics);
      expect(result).toBe(false);
    });
  });

  describe('heartbeat', () => {
    beforeEach(async () => {
      await registry.registerAgent(mockConfig, AgentStatus.IDLE, mockMetrics);
    });

    it('should process heartbeat successfully', async () => {
      const eventSpy = vi.fn();
      registry.on('agent.heartbeat', eventSpy);

      const result = await registry.heartbeat(mockConfig.id);

      expect(result).toBe(true);
      expect(eventSpy).toHaveBeenCalledWith({
        agentId: mockConfig.id,
        agent: expect.any(Object)
      });
    });

    it('should update metrics when provided', async () => {
      const newMetrics = { ...mockMetrics, tasksCompleted: 20 };
      await registry.heartbeat(mockConfig.id, newMetrics);

      const agent = registry.getAgent(mockConfig.id);
      expect(agent?.metrics.tasksCompleted).toBe(20);
    });

    it('should return false for non-existent agent', async () => {
      const result = await registry.heartbeat('non-existent-agent');
      expect(result).toBe(false);
    });
  });

  describe('findAgents', () => {
    beforeEach(async () => {
      // Register multiple agents for testing
      await registry.registerAgent(mockConfig, AgentStatus.IDLE, mockMetrics);
      
      const config2 = { ...mockConfig, id: 'test-agent-2', type: 'analyst' };
      await registry.registerAgent(config2, AgentStatus.BUSY, mockMetrics);
      
      const config3 = { 
        ...mockConfig, 
        id: 'test-agent-3', 
        type: 'coder',
        capabilities: [AgentCapability.TESTING]
      };
      await registry.registerAgent(config3, AgentStatus.IDLE, mockMetrics);
    });

    it('should find agents by type', () => {
      const query: AgentQuery = { type: 'coder' };
      const results = registry.findAgents(query);
      
      expect(results).toHaveLength(2);
      expect(results.every(agent => agent.config.type === 'coder')).toBe(true);
    });

    it('should find agents by status', () => {
      const query: AgentQuery = { status: AgentStatus.IDLE };
      const results = registry.findAgents(query);
      
      expect(results).toHaveLength(2);
      expect(results.every(agent => agent.status === AgentStatus.IDLE)).toBe(true);
    });

    it('should find agents by capabilities', () => {
      const query: AgentQuery = { capabilities: [AgentCapability.CODE_GENERATION] };
      const results = registry.findAgents(query);
      
      expect(results).toHaveLength(1);
      expect(results[0].config.id).toBe('test-agent-1');
    });

    it('should find agents by multiple criteria', () => {
      const query: AgentQuery = {
        type: 'coder',
        status: AgentStatus.IDLE,
        capabilities: [AgentCapability.CODE_GENERATION]
      };
      const results = registry.findAgents(query);
      
      expect(results).toHaveLength(1);
      expect(results[0].config.id).toBe('test-agent-1');
    });

    it('should find agents with available capacity', () => {
      const query: AgentQuery = { availableCapacity: true };
      const results = registry.findAgents(query);
      
      // All agents should have available capacity (tasksInProgress < maxConcurrentTasks)
      expect(results).toHaveLength(3);
    });

    it('should return empty array when no agents match', () => {
      const query: AgentQuery = { type: 'non-existent-type' };
      const results = registry.findAgents(query);
      
      expect(results).toHaveLength(0);
    });
  });

  describe('findBestAgent', () => {
    beforeEach(async () => {
      const metrics1 = { ...mockMetrics, throughput: 1.0, errorRate: 0.2 };
      const metrics2 = { ...mockMetrics, throughput: 2.0, errorRate: 0.1 };
      const metrics3 = { ...mockMetrics, throughput: 3.0, errorRate: 0.05 };

      await registry.registerAgent(mockConfig, AgentStatus.IDLE, metrics1);
      
      const config2 = { ...mockConfig, id: 'test-agent-2' };
      await registry.registerAgent(config2, AgentStatus.IDLE, metrics2);
      
      const config3 = { ...mockConfig, id: 'test-agent-3' };
      await registry.registerAgent(config3, AgentStatus.IDLE, metrics3);
    });

    it('should find best agent by throughput (default)', () => {
      const bestAgent = registry.findBestAgent([AgentCapability.CODE_GENERATION]);
      
      expect(bestAgent).toBeDefined();
      expect(bestAgent?.config.id).toBe('test-agent-3'); // Highest throughput
    });

    it('should find best agent by error rate', () => {
      const bestAgent = registry.findBestAgent([AgentCapability.CODE_GENERATION], {
        sortBy: 'errorRate'
      });
      
      expect(bestAgent).toBeDefined();
      expect(bestAgent?.config.id).toBe('test-agent-3'); // Lowest error rate
    });

    it('should exclude specified agents', () => {
      const bestAgent = registry.findBestAgent([AgentCapability.CODE_GENERATION], {
        excludeAgents: ['test-agent-3']
      });
      
      expect(bestAgent).toBeDefined();
      expect(bestAgent?.config.id).toBe('test-agent-2');
    });

    it('should return undefined when no agents match', () => {
      const bestAgent = registry.findBestAgent([AgentCapability.DOCUMENTATION]);
      expect(bestAgent).toBeUndefined();
    });
  });

  describe('getAgentsByCapability', () => {
    beforeEach(async () => {
      await registry.registerAgent(mockConfig, AgentStatus.IDLE, mockMetrics);
      
      const config2 = {
        ...mockConfig,
        id: 'test-agent-2',
        capabilities: [AgentCapability.TESTING, AgentCapability.CODE_REVIEW]
      };
      await registry.registerAgent(config2, AgentStatus.IDLE, mockMetrics);
    });

    it('should return agents with specified capability', () => {
      const agents = registry.getAgentsByCapability(AgentCapability.CODE_REVIEW);
      
      expect(agents).toHaveLength(2);
      expect(agents.every(agent => 
        agent.capabilities.includes(AgentCapability.CODE_REVIEW)
      )).toBe(true);
    });

    it('should return empty array for non-existent capability', () => {
      const agents = registry.getAgentsByCapability(AgentCapability.DOCUMENTATION);
      expect(agents).toHaveLength(0);
    });
  });

  describe('getAgentsByType', () => {
    beforeEach(async () => {
      await registry.registerAgent(mockConfig, AgentStatus.IDLE, mockMetrics);
      
      const config2 = { ...mockConfig, id: 'test-agent-2', type: 'analyst' };
      await registry.registerAgent(config2, AgentStatus.IDLE, mockMetrics);
    });

    it('should return agents of specified type', () => {
      const agents = registry.getAgentsByType('coder');
      
      expect(agents).toHaveLength(1);
      expect(agents[0].config.type).toBe('coder');
    });

    it('should return empty array for non-existent type', () => {
      const agents = registry.getAgentsByType('non-existent-type');
      expect(agents).toHaveLength(0);
    });
  });

  describe('getAgentsByStatus', () => {
    beforeEach(async () => {
      await registry.registerAgent(mockConfig, AgentStatus.IDLE, mockMetrics);
      
      const config2 = { ...mockConfig, id: 'test-agent-2' };
      await registry.registerAgent(config2, AgentStatus.BUSY, mockMetrics);
    });

    it('should return agents with specified status', () => {
      const agents = registry.getAgentsByStatus(AgentStatus.IDLE);
      
      expect(agents).toHaveLength(1);
      expect(agents[0].status).toBe(AgentStatus.IDLE);
    });

    it('should return empty array for non-existent status', () => {
      const agents = registry.getAgentsByStatus(AgentStatus.ERROR);
      expect(agents).toHaveLength(0);
    });
  });

  describe('getActiveAgents', () => {
    beforeEach(async () => {
      await registry.registerAgent(mockConfig, AgentStatus.IDLE, mockMetrics);
      
      const config2 = { ...mockConfig, id: 'test-agent-2' };
      await registry.registerAgent(config2, AgentStatus.OFFLINE, mockMetrics);
    });

    it('should return only active agents', () => {
      const activeAgents = registry.getActiveAgents();
      
      expect(activeAgents).toHaveLength(1);
      expect(activeAgents[0].status).not.toBe(AgentStatus.OFFLINE);
    });
  });

  describe('getInactiveAgents', () => {
    beforeEach(async () => {
      await registry.registerAgent(mockConfig, AgentStatus.IDLE, mockMetrics);
      
      const config2 = { ...mockConfig, id: 'test-agent-2' };
      await registry.registerAgent(config2, AgentStatus.OFFLINE, mockMetrics);
    });

    it('should return only inactive agents', () => {
      const inactiveAgents = registry.getInactiveAgents();
      
      expect(inactiveAgents).toHaveLength(1);
      expect(inactiveAgents[0].status).toBe(AgentStatus.OFFLINE);
    });
  });

  describe('isAgentActive', () => {
    beforeEach(async () => {
      await registry.registerAgent(mockConfig, AgentStatus.IDLE, mockMetrics);
    });

    it('should return true for recently active agent', () => {
      const agent = registry.getAgent(mockConfig.id)!;
      expect(registry.isAgentActive(agent)).toBe(true);
    });

    it('should return false for agent with old heartbeat', () => {
      const agent = registry.getAgent(mockConfig.id)!;
      
      // Simulate old heartbeat
      agent.lastHeartbeat = new Date(Date.now() - 70000); // 70 seconds ago
      
      expect(registry.isAgentActive(agent)).toBe(false);
    });
  });

  describe('updateAgentTags', () => {
    beforeEach(async () => {
      await registry.registerAgent(mockConfig, AgentStatus.IDLE, mockMetrics);
    });

    it('should update agent tags successfully', async () => {
      const eventSpy = vi.fn();
      registry.on('agent.tags.updated', eventSpy);

      const newTags = ['production', 'backend', 'critical'];
      const result = await registry.updateAgentTags(mockConfig.id, newTags);

      expect(result).toBe(true);
      const agent = registry.getAgent(mockConfig.id);
      expect(agent?.tags).toEqual(newTags);
      expect(eventSpy).toHaveBeenCalledWith({
        agentId: mockConfig.id,
        tags: newTags,
        agent: expect.any(Object)
      });
    });

    it('should return false for non-existent agent', async () => {
      const result = await registry.updateAgentTags('non-existent-agent', ['tag']);
      expect(result).toBe(false);
    });
  });

  describe('updateAgentMetadata', () => {
    beforeEach(async () => {
      await registry.registerAgent(mockConfig, AgentStatus.IDLE, mockMetrics, {
        metadata: { region: 'us-east-1' }
      });
    });

    it('should update agent metadata successfully', async () => {
      const eventSpy = vi.fn();
      registry.on('agent.metadata.updated', eventSpy);

      const newMetadata = { datacenter: 'dc1', zone: 'a' };
      const result = await registry.updateAgentMetadata(mockConfig.id, newMetadata);

      expect(result).toBe(true);
      const agent = registry.getAgent(mockConfig.id);
      expect(agent?.metadata).toEqual({
        region: 'us-east-1',
        datacenter: 'dc1',
        zone: 'a'
      });
      expect(eventSpy).toHaveBeenCalledWith({
        agentId: mockConfig.id,
        metadata: newMetadata,
        agent: expect.any(Object)
      });
    });

    it('should return false for non-existent agent', async () => {
      const result = await registry.updateAgentMetadata('non-existent-agent', {});
      expect(result).toBe(false);
    });
  });

  describe('heartbeat checker', () => {
    beforeEach(async () => {
      await registry.registerAgent(mockConfig, AgentStatus.IDLE, mockMetrics);
    });

    it('should mark agents as offline when heartbeat times out', async () => {
      const eventSpy = vi.fn();
      registry.on('agent.timeout', eventSpy);

      // Advance time beyond heartbeat timeout
      vi.advanceTimersByTime(70000); // 70 seconds

      expect(eventSpy).toHaveBeenCalledWith({
        agentId: mockConfig.id,
        agent: expect.any(Object),
        timeSinceHeartbeat: expect.any(Number)
      });

      const agent = registry.getAgent(mockConfig.id);
      expect(agent?.status).toBe(AgentStatus.OFFLINE);
    });

    it('should remove agents after max inactive time', async () => {
      const eventSpy = vi.fn();
      registry.on('agent.removed', eventSpy);

      // Advance time beyond max inactive time
      vi.advanceTimersByTime(310000); // 310 seconds (5+ minutes)

      expect(eventSpy).toHaveBeenCalledWith({
        agentId: mockConfig.id,
        agent: expect.any(Object)
      });

      const agent = registry.getAgent(mockConfig.id);
      expect(agent).toBeUndefined();
    });
  });

  describe('reset', () => {
    beforeEach(async () => {
      await registry.registerAgent(mockConfig, AgentStatus.IDLE, mockMetrics);
    });

    it('should reset the registry to initial state', () => {
      const eventSpy = vi.fn();
      registry.on('registry.reset', eventSpy);

      registry.reset();

      expect(registry.getAllAgents()).toHaveLength(0);
      const stats = registry.getStats();
      expect(stats.totalAgents).toBe(0);
      expect(stats.activeAgents).toBe(0);
      expect(eventSpy).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should cleanup registry and remove all listeners', async () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      
      await registry.cleanup();

      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(registry.getAllAgents()).toHaveLength(0);
      expect(registry.listenerCount('agent.registered')).toBe(0);
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      await registry.registerAgent(mockConfig, AgentStatus.IDLE, mockMetrics);
      
      const config2 = { ...mockConfig, id: 'test-agent-2', type: 'analyst' };
      await registry.registerAgent(config2, AgentStatus.BUSY, mockMetrics);
    });

    it('should return accurate statistics', () => {
      const stats = registry.getStats();

      expect(stats.totalAgents).toBe(2);
      expect(stats.activeAgents).toBe(2);
      expect(stats.inactiveAgents).toBe(0);
      expect(stats.agentsByType.get('coder')).toBe(1);
      expect(stats.agentsByType.get('analyst')).toBe(1);
      expect(stats.agentsByStatus.get(AgentStatus.IDLE)).toBe(1);
      expect(stats.agentsByStatus.get(AgentStatus.BUSY)).toBe(1);
      expect(stats.averageUptime).toBe(mockMetrics.uptime);
      expect(stats.averageErrorRate).toBe(mockMetrics.errorRate);
    });

    it('should return defensive copies of maps', () => {
      const stats = registry.getStats();
      
      stats.agentsByType.set('test-type', 999);
      stats.agentsByStatus.set(AgentStatus.ERROR, 999);
      
      const freshStats = registry.getStats();
      expect(freshStats.agentsByType.get('test-type')).toBeUndefined();
      expect(freshStats.agentsByStatus.get(AgentStatus.ERROR)).toBeUndefined();
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty registry operations gracefully', () => {
      expect(registry.getAllAgents()).toHaveLength(0);
      expect(registry.getActiveAgents()).toHaveLength(0);
      expect(registry.getInactiveAgents()).toHaveLength(0);
      expect(registry.findAgents({})).toHaveLength(0);
      expect(registry.findBestAgent([AgentCapability.CODE_GENERATION])).toBeUndefined();
    });

    it('should handle agent operations on non-existent agents', async () => {
      expect(await registry.updateAgentStatus('non-existent', AgentStatus.BUSY)).toBe(false);
      expect(await registry.updateAgentMetrics('non-existent', mockMetrics)).toBe(false);
      expect(await registry.heartbeat('non-existent')).toBe(false);
      expect(await registry.updateAgentTags('non-existent', [])).toBe(false);
      expect(await registry.updateAgentMetadata('non-existent', {})).toBe(false);
    });

    it('should handle concurrent registration of same agent', async () => {
      const promises = Array.from({ length: 5 }, (_, i) => 
        registry.registerAgent(
          { ...mockConfig, id: `concurrent-agent-${i}` },
          AgentStatus.IDLE,
          mockMetrics
        )
      );

      await Promise.all(promises);

      expect(registry.getAllAgents()).toHaveLength(5);
      expect(registry.getStats().totalAgents).toBe(5);
    });
  });
});