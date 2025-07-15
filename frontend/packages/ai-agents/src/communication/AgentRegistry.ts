import { EventEmitter } from 'eventemitter3';
import type { AgentConfig, AgentStatus, AgentMetrics, AgentCapability } from '../types';

export interface RegisteredAgent {
  config: AgentConfig;
  status: AgentStatus;
  metrics: AgentMetrics;
  registeredAt: Date;
  lastHeartbeat: Date;
  address?: string; // For remote agents
  capabilities: AgentCapability[];
  tags: string[];
  metadata: Record<string, any>;
}

export interface AgentQuery {
  type?: string;
  status?: AgentStatus;
  capabilities?: AgentCapability[];
  tags?: string[];
  minUptime?: number;
  maxErrorRate?: number;
  availableCapacity?: boolean;
}

export interface AgentRegistryConfig {
  heartbeatTimeoutMs?: number;
  enableLogging?: boolean;
  enablePersistence?: boolean;
  maxInactiveTimeMs?: number;
}

export interface RegistryStats {
  totalAgents: number;
  activeAgents: number;
  inactiveAgents: number;
  agentsByType: Map<string, number>;
  agentsByStatus: Map<AgentStatus, number>;
  averageUptime: number;
  averageErrorRate: number;
}

/**
 * Agent registry for managing agent discovery and routing
 */
export class AgentRegistry extends EventEmitter {
  private agents: Map<string, RegisteredAgent> = new Map();
  private config: AgentRegistryConfig;
  private heartbeatChecker?: NodeJS.Timer;
  private stats: RegistryStats;

  constructor(config: AgentRegistryConfig = {}) {
    super();
    this.config = {
      heartbeatTimeoutMs: config.heartbeatTimeoutMs ?? 60000, // 1 minute
      enableLogging: config.enableLogging ?? false,
      enablePersistence: config.enablePersistence ?? false,
      maxInactiveTimeMs: config.maxInactiveTimeMs ?? 300000 // 5 minutes
    };
    
    this.stats = {
      totalAgents: 0,
      activeAgents: 0,
      inactiveAgents: 0,
      agentsByType: new Map(),
      agentsByStatus: new Map(),
      averageUptime: 0,
      averageErrorRate: 0
    };

    this.startHeartbeatChecker();
  }

  /**
   * Register an agent
   */
  async registerAgent(
    config: AgentConfig,
    status: AgentStatus = AgentStatus.IDLE,
    metrics: AgentMetrics,
    options: {
      address?: string;
      tags?: string[];
      metadata?: Record<string, any>;
    } = {}
  ): Promise<void> {
    const registeredAgent: RegisteredAgent = {
      config,
      status,
      metrics,
      registeredAt: new Date(),
      lastHeartbeat: new Date(),
      address: options.address,
      capabilities: config.capabilities,
      tags: options.tags || [],
      metadata: options.metadata || {}
    };

    const existingAgent = this.agents.get(config.id);
    if (existingAgent) {
      // Update existing agent
      registeredAgent.registeredAt = existingAgent.registeredAt;
    } else {
      // New agent
      this.stats.totalAgents++;
    }

    this.agents.set(config.id, registeredAgent);
    this.updateStats();
    
    if (this.config.enableLogging) {
      console.log(`Agent ${config.id} registered with status ${status}`);
    }
    
    this.emit('agent.registered', { agent: registeredAgent });
  }

  /**
   * Unregister an agent
   */
  async unregisterAgent(agentId: string): Promise<boolean> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return false;
    }

    this.agents.delete(agentId);
    this.stats.totalAgents--;
    this.updateStats();
    
    if (this.config.enableLogging) {
      console.log(`Agent ${agentId} unregistered`);
    }
    
    this.emit('agent.unregistered', { agentId, agent });
    return true;
  }

  /**
   * Update agent status
   */
  async updateAgentStatus(agentId: string, status: AgentStatus): Promise<boolean> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return false;
    }

    const oldStatus = agent.status;
    agent.status = status;
    agent.lastHeartbeat = new Date();
    
    this.updateStats();
    
    if (this.config.enableLogging) {
      console.log(`Agent ${agentId} status updated from ${oldStatus} to ${status}`);
    }
    
    this.emit('agent.status.updated', { agentId, oldStatus, newStatus: status, agent });
    return true;
  }

  /**
   * Update agent metrics
   */
  async updateAgentMetrics(agentId: string, metrics: AgentMetrics): Promise<boolean> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return false;
    }

    agent.metrics = metrics;
    agent.lastHeartbeat = new Date();
    
    this.updateStats();
    
    if (this.config.enableLogging) {
      console.log(`Agent ${agentId} metrics updated`);
    }
    
    this.emit('agent.metrics.updated', { agentId, metrics, agent });
    return true;
  }

  /**
   * Process heartbeat from agent
   */
  async heartbeat(agentId: string, metrics?: AgentMetrics): Promise<boolean> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return false;
    }

    agent.lastHeartbeat = new Date();
    
    if (metrics) {
      agent.metrics = metrics;
    }
    
    this.updateStats();
    
    this.emit('agent.heartbeat', { agentId, agent });
    return true;
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): RegisteredAgent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all agents
   */
  getAllAgents(): RegisteredAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Find agents by query
   */
  findAgents(query: AgentQuery): RegisteredAgent[] {
    const agents = Array.from(this.agents.values());
    
    return agents.filter(agent => {
      // Type filter
      if (query.type && agent.config.type !== query.type) {
        return false;
      }
      
      // Status filter
      if (query.status && agent.status !== query.status) {
        return false;
      }
      
      // Capabilities filter
      if (query.capabilities) {
        const hasAllCapabilities = query.capabilities.every(cap => 
          agent.capabilities.includes(cap)
        );
        if (!hasAllCapabilities) {
          return false;
        }
      }
      
      // Tags filter
      if (query.tags) {
        const hasAllTags = query.tags.every(tag => 
          agent.tags.includes(tag)
        );
        if (!hasAllTags) {
          return false;
        }
      }
      
      // Uptime filter
      if (query.minUptime) {
        if (agent.metrics.uptime < query.minUptime) {
          return false;
        }
      }
      
      // Error rate filter
      if (query.maxErrorRate) {
        if (agent.metrics.errorRate > query.maxErrorRate) {
          return false;
        }
      }
      
      // Available capacity filter
      if (query.availableCapacity) {
        const hasCapacity = agent.metrics.tasksInProgress < agent.config.maxConcurrentTasks;
        if (!hasCapacity) {
          return false;
        }
      }
      
      return true;
    });
  }

  /**
   * Find best agent for a task
   */
  findBestAgent(
    capabilities: AgentCapability[],
    options: {
      excludeAgents?: string[];
      preferredType?: string;
      sortBy?: 'uptime' | 'errorRate' | 'throughput' | 'capacity';
    } = {}
  ): RegisteredAgent | undefined {
    const query: AgentQuery = {
      capabilities,
      status: AgentStatus.IDLE,
      availableCapacity: true
    };
    
    if (options.preferredType) {
      query.type = options.preferredType;
    }
    
    let candidates = this.findAgents(query);
    
    // Exclude specific agents
    if (options.excludeAgents) {
      candidates = candidates.filter(agent => 
        !options.excludeAgents!.includes(agent.config.id)
      );
    }
    
    if (candidates.length === 0) {
      return undefined;
    }
    
    // Sort candidates
    const sortBy = options.sortBy || 'throughput';
    candidates.sort((a, b) => {
      switch (sortBy) {
        case 'uptime':
          return b.metrics.uptime - a.metrics.uptime;
        case 'errorRate':
          return a.metrics.errorRate - b.metrics.errorRate;
        case 'throughput':
          return b.metrics.throughput - a.metrics.throughput;
        case 'capacity':
          const aCapacity = a.config.maxConcurrentTasks - a.metrics.tasksInProgress;
          const bCapacity = b.config.maxConcurrentTasks - b.metrics.tasksInProgress;
          return bCapacity - aCapacity;
        default:
          return 0;
      }
    });
    
    return candidates[0];
  }

  /**
   * Get agents by capability
   */
  getAgentsByCapability(capability: AgentCapability): RegisteredAgent[] {
    return this.findAgents({ capabilities: [capability] });
  }

  /**
   * Get agents by type
   */
  getAgentsByType(type: string): RegisteredAgent[] {
    return this.findAgents({ type });
  }

  /**
   * Get agents by status
   */
  getAgentsByStatus(status: AgentStatus): RegisteredAgent[] {
    return this.findAgents({ status });
  }

  /**
   * Get active agents
   */
  getActiveAgents(): RegisteredAgent[] {
    return Array.from(this.agents.values()).filter(agent => 
      agent.status !== AgentStatus.OFFLINE && 
      this.isAgentActive(agent)
    );
  }

  /**
   * Get inactive agents
   */
  getInactiveAgents(): RegisteredAgent[] {
    return Array.from(this.agents.values()).filter(agent => 
      agent.status === AgentStatus.OFFLINE || 
      !this.isAgentActive(agent)
    );
  }

  /**
   * Check if agent is active based on last heartbeat
   */
  isAgentActive(agent: RegisteredAgent): boolean {
    const timeSinceHeartbeat = Date.now() - agent.lastHeartbeat.getTime();
    return timeSinceHeartbeat < this.config.heartbeatTimeoutMs!;
  }

  /**
   * Get registry statistics
   */
  getStats(): RegistryStats {
    return {
      ...this.stats,
      agentsByType: new Map(this.stats.agentsByType),
      agentsByStatus: new Map(this.stats.agentsByStatus)
    };
  }

  /**
   * Get detailed agent information
   */
  getAgentDetails(agentId: string): RegisteredAgent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Update agent tags
   */
  async updateAgentTags(agentId: string, tags: string[]): Promise<boolean> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return false;
    }

    agent.tags = tags;
    
    if (this.config.enableLogging) {
      console.log(`Agent ${agentId} tags updated:`, tags);
    }
    
    this.emit('agent.tags.updated', { agentId, tags, agent });
    return true;
  }

  /**
   * Update agent metadata
   */
  async updateAgentMetadata(agentId: string, metadata: Record<string, any>): Promise<boolean> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return false;
    }

    agent.metadata = { ...agent.metadata, ...metadata };
    
    if (this.config.enableLogging) {
      console.log(`Agent ${agentId} metadata updated:`, metadata);
    }
    
    this.emit('agent.metadata.updated', { agentId, metadata, agent });
    return true;
  }

  /**
   * Private helper methods
   */
  private updateStats(): void {
    const agents = Array.from(this.agents.values());
    const activeAgents = agents.filter(agent => this.isAgentActive(agent));
    
    this.stats.activeAgents = activeAgents.length;
    this.stats.inactiveAgents = agents.length - activeAgents.length;
    
    // Update agents by type
    this.stats.agentsByType.clear();
    for (const agent of agents) {
      const count = this.stats.agentsByType.get(agent.config.type) || 0;
      this.stats.agentsByType.set(agent.config.type, count + 1);
    }
    
    // Update agents by status
    this.stats.agentsByStatus.clear();
    for (const agent of agents) {
      const count = this.stats.agentsByStatus.get(agent.status) || 0;
      this.stats.agentsByStatus.set(agent.status, count + 1);
    }
    
    // Calculate averages
    if (activeAgents.length > 0) {
      this.stats.averageUptime = activeAgents.reduce((sum, agent) => 
        sum + agent.metrics.uptime, 0) / activeAgents.length;
      
      this.stats.averageErrorRate = activeAgents.reduce((sum, agent) => 
        sum + agent.metrics.errorRate, 0) / activeAgents.length;
    } else {
      this.stats.averageUptime = 0;
      this.stats.averageErrorRate = 0;
    }
  }

  private startHeartbeatChecker(): void {
    this.heartbeatChecker = setInterval(() => {
      this.checkHeartbeats();
    }, this.config.heartbeatTimeoutMs! / 2);
  }

  private checkHeartbeats(): void {
    const now = Date.now();
    const inactiveAgents: string[] = [];
    
    for (const [agentId, agent] of this.agents.entries()) {
      const timeSinceHeartbeat = now - agent.lastHeartbeat.getTime();
      
      if (timeSinceHeartbeat > this.config.heartbeatTimeoutMs!) {
        if (agent.status !== AgentStatus.OFFLINE) {
          // Mark as offline
          agent.status = AgentStatus.OFFLINE;
          inactiveAgents.push(agentId);
          
          if (this.config.enableLogging) {
            console.log(`Agent ${agentId} marked as offline (no heartbeat for ${timeSinceHeartbeat}ms)`);
          }
          
          this.emit('agent.timeout', { agentId, agent, timeSinceHeartbeat });
        }
        
        // Remove if inactive for too long
        if (timeSinceHeartbeat > this.config.maxInactiveTimeMs!) {
          this.agents.delete(agentId);
          this.stats.totalAgents--;
          
          if (this.config.enableLogging) {
            console.log(`Agent ${agentId} removed due to inactivity`);
          }
          
          this.emit('agent.removed', { agentId, agent });
        }
      }
    }
    
    if (inactiveAgents.length > 0) {
      this.updateStats();
    }
  }

  /**
   * Reset the registry
   */
  reset(): void {
    this.agents.clear();
    
    this.stats = {
      totalAgents: 0,
      activeAgents: 0,
      inactiveAgents: 0,
      agentsByType: new Map(),
      agentsByStatus: new Map(),
      averageUptime: 0,
      averageErrorRate: 0
    };
    
    this.emit('registry.reset');
  }

  /**
   * Cleanup and stop the registry
   */
  async cleanup(): Promise<void> {
    if (this.heartbeatChecker) {
      clearInterval(this.heartbeatChecker);
    }
    
    this.reset();
    this.removeAllListeners();
  }
}