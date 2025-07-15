/**
 * Agent registry for discovery and management
 */

import { EventEmitter } from 'events';
import type {
  AgentId
} from '../types/agent.js';
import {
  AgentStatus,
  AgentCapability
} from '../types/agent.js';
import type { IAgent, IAgentRegistry } from '../interfaces/IAgent.js';
import { inngest } from '../inngest/client.js';

export interface RegisteredAgent {
  agent: IAgent;
  registeredAt: Date;
  lastHeartbeat: Date;
  capabilities: Set<AgentCapability>;
  tags: Set<string>;
}

export interface RegistryFilter {
  status?: AgentStatus;
  capabilities?: AgentCapability[];
  tags?: string[];
  lastHeartbeatAfter?: Date;
}

/**
 * Centralized agent registry for discovery and management
 */
export class AgentRegistry extends EventEmitter implements IAgentRegistry {
  private agents: Map<AgentId, RegisteredAgent> = new Map();
  private capabilityIndex: Map<AgentCapability, Set<AgentId>> = new Map();
  private statusIndex: Map<AgentStatus, Set<AgentId>> = new Map();
  private tagIndex: Map<string, Set<AgentId>> = new Map();
  private heartbeatTimeout = 120000; // 2 minutes
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.startCleanupInterval();
  }

  async register(agent: IAgent): Promise<void> {
    const agentId = agent.id;
    const config = agent.config;
    
    if (this.agents.has(agentId)) {
      throw new Error(`Agent ${agentId} is already registered`);
    }

    const registeredAgent: RegisteredAgent = {
      agent,
      registeredAt: new Date(),
      lastHeartbeat: new Date(),
      capabilities: new Set(config.capabilities),
      tags: new Set(config.metadata?.tags || []),
    };

    this.agents.set(agentId, registeredAgent);
    
    // Update indexes
    this.updateIndexes(agentId, registeredAgent);
    
    // Listen to agent events
    this.setupAgentEventListeners(agent);
    
    this.emit('agent.registered', { agentId, config });
    
    // Send registration event to Inngest
    await inngest.send({
      name: 'agent/agent.registered',
      data: {
        agentId,
        capabilities: config.capabilities,
        maxConcurrentTasks: config.maxConcurrentTasks,
        registeredAt: new Date().toISOString(),
      }
    });
  }

  async unregister(agentId: AgentId): Promise<void> {
    const registeredAgent = this.agents.get(agentId);
    if (!registeredAgent) {
      return;
    }

    // Remove from indexes
    this.removeFromIndexes(agentId, registeredAgent);
    
    // Clean up event listeners
    if ('removeAllListeners' in registeredAgent.agent) {
      (registeredAgent.agent as any).removeAllListeners();
    }
    
    this.agents.delete(agentId);
    this.emit('agent.unregistered', { agentId });
    
    // Send unregistration event to Inngest
    await inngest.send({
      name: 'agent/agent.unregistered',
      data: {
        agentId,
        unregisteredAt: new Date().toISOString(),
      }
    });
  }

  async findByCapability(capability: AgentCapability): Promise<AgentId[]> {
    const agentIds = this.capabilityIndex.get(capability) || new Set();
    return Array.from(agentIds);
  }

  async findByStatus(status: AgentStatus): Promise<AgentId[]> {
    const agentIds = this.statusIndex.get(status) || new Set();
    return Array.from(agentIds);
  }

  async getAllAgents(): Promise<AgentId[]> {
    return Array.from(this.agents.keys());
  }

  async getAgent(agentId: AgentId): Promise<IAgent | null> {
    const registeredAgent = this.agents.get(agentId);
    return registeredAgent ? registeredAgent.agent : null;
  }

  async isRegistered(agentId: AgentId): Promise<boolean> {
    return this.agents.has(agentId);
  }

  /**
   * Find agents by multiple criteria
   */
  async findAgents(filter: RegistryFilter): Promise<AgentId[]> {
    let candidates = new Set(this.agents.keys());

    // Filter by status
    if (filter.status) {
      const statusAgents = this.statusIndex.get(filter.status) || new Set();
      candidates = new Set([...candidates].filter(id => statusAgents.has(id)));
    }

    // Filter by capabilities
    if (filter.capabilities && filter.capabilities.length > 0) {
      for (const capability of filter.capabilities) {
        const capabilityAgents = this.capabilityIndex.get(capability) || new Set();
        candidates = new Set([...candidates].filter(id => capabilityAgents.has(id)));
      }
    }

    // Filter by tags
    if (filter.tags && filter.tags.length > 0) {
      for (const tag of filter.tags) {
        const tagAgents = this.tagIndex.get(tag) || new Set();
        candidates = new Set([...candidates].filter(id => tagAgents.has(id)));
      }
    }

    // Filter by last heartbeat
    if (filter.lastHeartbeatAfter) {
      candidates = new Set([...candidates].filter(id => {
        const agent = this.agents.get(id);
        return agent && agent.lastHeartbeat >= filter.lastHeartbeatAfter!;
      }));
    }

    return Array.from(candidates);
  }

  /**
   * Find the best agent for a task
   */
  async findBestAgent(
    requiredCapabilities: AgentCapability[],
    preferredCapabilities: AgentCapability[] = [],
    excludeAgents: AgentId[] = []
  ): Promise<AgentId | null> {
    // Find agents with all required capabilities
    let candidates = await this.findAgents({
      status: AgentStatus.IDLE,
      capabilities: requiredCapabilities,
    });

    // Exclude specified agents
    candidates = candidates.filter(id => !excludeAgents.includes(id));

    if (candidates.length === 0) {
      return null;
    }

    // Score agents based on preferred capabilities and load
    const scoredAgents = candidates.map(agentId => {
      const registeredAgent = this.agents.get(agentId)!;
      const agent = registeredAgent.agent;
      
      let score = 0;
      
      // Bonus for preferred capabilities
      for (const capability of preferredCapabilities) {
        if (registeredAgent.capabilities.has(capability)) {
          score += 10;
        }
      }
      
      // Penalty for current load
      const currentTasks = agent.getCurrentTasks().length;
      const maxTasks = agent.config.maxConcurrentTasks;
      const loadRatio = currentTasks / maxTasks;
      score -= loadRatio * 20;
      
      // Bonus for recent activity
      const timeSinceHeartbeat = Date.now() - registeredAgent.lastHeartbeat.getTime();
      if (timeSinceHeartbeat < 30000) { // Active in last 30 seconds
        score += 5;
      }
      
      return { agentId, score };
    });

    // Sort by score and return the best
    scoredAgents.sort((a, b) => b.score - a.score);
    return scoredAgents[0].agentId;
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    totalAgents: number;
    activeAgents: number;
    agentsByStatus: Record<AgentStatus, number>;
    agentsByCapability: Record<AgentCapability, number>;
    averageLoad: number;
  } {
    const stats = {
      totalAgents: this.agents.size,
      activeAgents: 0,
      agentsByStatus: {} as Record<AgentStatus, number>,
      agentsByCapability: {} as Record<AgentCapability, number>,
      averageLoad: 0,
    };

    let totalLoad = 0;

    for (const [, registeredAgent] of this.agents) {
      const status = registeredAgent.agent.getStatus();
      
      // Count by status
      stats.agentsByStatus[status] = (stats.agentsByStatus[status] || 0) + 1;
      
      if (status !== AgentStatus.OFFLINE) {
        stats.activeAgents++;
      }
      
      // Count by capability
      for (const capability of registeredAgent.capabilities) {
        stats.agentsByCapability[capability] = (stats.agentsByCapability[capability] || 0) + 1;
      }
      
      // Calculate load
      const currentTasks = registeredAgent.agent.getCurrentTasks().length;
      const maxTasks = registeredAgent.agent.config.maxConcurrentTasks;
      totalLoad += currentTasks / maxTasks;
    }

    stats.averageLoad = stats.totalAgents > 0 ? totalLoad / stats.totalAgents : 0;

    return stats;
  }

  /**
   * Update agent heartbeat
   */
  updateHeartbeat(agentId: AgentId): void {
    const registeredAgent = this.agents.get(agentId);
    if (registeredAgent) {
      registeredAgent.lastHeartbeat = new Date();
      this.emit('heartbeat.updated', { agentId });
    }
  }

  /**
   * Add tags to an agent
   */
  addTags(agentId: AgentId, tags: string[]): void {
    const registeredAgent = this.agents.get(agentId);
    if (registeredAgent) {
      for (const tag of tags) {
        registeredAgent.tags.add(tag);
        
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set());
        }
        this.tagIndex.get(tag)!.add(agentId);
      }
      
      this.emit('tags.added', { agentId, tags });
    }
  }

  /**
   * Remove tags from an agent
   */
  removeTags(agentId: AgentId, tags: string[]): void {
    const registeredAgent = this.agents.get(agentId);
    if (registeredAgent) {
      for (const tag of tags) {
        registeredAgent.tags.delete(tag);
        
        const tagAgents = this.tagIndex.get(tag);
        if (tagAgents) {
          tagAgents.delete(agentId);
          if (tagAgents.size === 0) {
            this.tagIndex.delete(tag);
          }
        }
      }
      
      this.emit('tags.removed', { agentId, tags });
    }
  }

  /**
   * Get detailed agent information
   */
  getAgentInfo(agentId: AgentId): {
    agent: IAgent;
    registeredAt: Date;
    lastHeartbeat: Date;
    capabilities: AgentCapability[];
    tags: string[];
    currentStatus: AgentStatus;
    currentTasks: number;
    metrics: any;
  } | null {
    const registeredAgent = this.agents.get(agentId);
    if (!registeredAgent) {
      return null;
    }

    return {
      agent: registeredAgent.agent,
      registeredAt: registeredAgent.registeredAt,
      lastHeartbeat: registeredAgent.lastHeartbeat,
      capabilities: Array.from(registeredAgent.capabilities),
      tags: Array.from(registeredAgent.tags),
      currentStatus: registeredAgent.agent.getStatus(),
      currentTasks: registeredAgent.agent.getCurrentTasks().length,
      metrics: registeredAgent.agent.getMetrics(),
    };
  }

  /**
   * Export registry data
   */
  export(): any {
    const data = {
      exportedAt: new Date().toISOString(),
      totalAgents: this.agents.size,
      agents: {} as any,
    };

    for (const [agentId, registeredAgent] of this.agents) {
      data.agents[agentId] = {
        config: registeredAgent.agent.config,
        registeredAt: registeredAgent.registeredAt,
        lastHeartbeat: registeredAgent.lastHeartbeat,
        capabilities: Array.from(registeredAgent.capabilities),
        tags: Array.from(registeredAgent.tags),
        status: registeredAgent.agent.getStatus(),
        metrics: registeredAgent.agent.getMetrics(),
      };
    }

    return data;
  }

  private updateIndexes(agentId: AgentId, registeredAgent: RegisteredAgent): void {
    // Update capability index
    for (const capability of registeredAgent.capabilities) {
      if (!this.capabilityIndex.has(capability)) {
        this.capabilityIndex.set(capability, new Set());
      }
      this.capabilityIndex.get(capability)!.add(agentId);
    }

    // Update status index
    const status = registeredAgent.agent.getStatus();
    if (!this.statusIndex.has(status)) {
      this.statusIndex.set(status, new Set());
    }
    this.statusIndex.get(status)!.add(agentId);

    // Update tag index
    for (const tag of registeredAgent.tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(agentId);
    }
  }

  private removeFromIndexes(agentId: AgentId, registeredAgent: RegisteredAgent): void {
    // Remove from capability index
    for (const capability of registeredAgent.capabilities) {
      const capabilityAgents = this.capabilityIndex.get(capability);
      if (capabilityAgents) {
        capabilityAgents.delete(agentId);
        if (capabilityAgents.size === 0) {
          this.capabilityIndex.delete(capability);
        }
      }
    }

    // Remove from status index
    const status = registeredAgent.agent.getStatus();
    const statusAgents = this.statusIndex.get(status);
    if (statusAgents) {
      statusAgents.delete(agentId);
      if (statusAgents.size === 0) {
        this.statusIndex.delete(status);
      }
    }

    // Remove from tag index
    for (const tag of registeredAgent.tags) {
      const tagAgents = this.tagIndex.get(tag);
      if (tagAgents) {
        tagAgents.delete(agentId);
        if (tagAgents.size === 0) {
          this.tagIndex.delete(tag);
        }
      }
    }
  }

  private setupAgentEventListeners(agent: IAgent): void {
    // Listen for status changes
    if ('on' in agent) {
      (agent as any).on('agent.status.changed', (event: any) => {
        this.updateAgentStatusIndex(agent.id, event.previousStatus, event.newStatus);
      });

      // Listen for heartbeats
      (agent as any).on('agent.heartbeat', () => {
        this.updateHeartbeat(agent.id);
      });
    }
  }

  private updateAgentStatusIndex(agentId: AgentId, oldStatus: AgentStatus, newStatus: AgentStatus): void {
    // Remove from old status index
    const oldStatusAgents = this.statusIndex.get(oldStatus);
    if (oldStatusAgents) {
      oldStatusAgents.delete(agentId);
      if (oldStatusAgents.size === 0) {
        this.statusIndex.delete(oldStatus);
      }
    }

    // Add to new status index
    if (!this.statusIndex.has(newStatus)) {
      this.statusIndex.set(newStatus, new Set());
    }
    this.statusIndex.get(newStatus)!.add(agentId);
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleAgents();
    }, 60000); // Check every minute
  }

  private cleanupStaleAgents(): void {
    const now = Date.now();
    const staleAgents: AgentId[] = [];

    for (const [agentId, registeredAgent] of this.agents) {
      const timeSinceHeartbeat = now - registeredAgent.lastHeartbeat.getTime();
      if (timeSinceHeartbeat > this.heartbeatTimeout) {
        staleAgents.push(agentId);
      }
    }

    for (const agentId of staleAgents) {
      this.emit('agent.stale', { agentId });
      // Optionally auto-unregister stale agents
      // this.unregister(agentId);
    }
  }

  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.removeAllListeners();
  }
}

/**
 * Singleton registry instance
 */
export const agentRegistry = new AgentRegistry();