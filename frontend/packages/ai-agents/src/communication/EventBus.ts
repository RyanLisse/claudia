import { EventEmitter } from 'eventemitter3';
import type { AgentEvent, TaskEvent, MessageEvent, Message } from '../types';

export interface EventSubscription {
  id: string;
  event: string;
  handler: (data: any) => void;
  agentId?: string;
  once?: boolean;
  priority?: number;
}

export interface EventBusConfig {
  enableLogging?: boolean;
  maxEventHistory?: number;
  enableEventPersistence?: boolean;
  eventTimeoutMs?: number;
}

export interface EventStats {
  totalEvents: number;
  activeSubscriptions: number;
  eventsByType: Map<string, number>;
  eventsByAgent: Map<string, number>;
  averageEventLatency: number;
}

/**
 * Event bus for system-wide agent events
 */
export class EventBus extends EventEmitter {
  private subscriptions: Map<string, EventSubscription[]> = new Map();
  private eventHistory: Array<{ event: string; data: any; timestamp: Date }> = [];
  private stats: EventStats;
  private config: EventBusConfig;

  constructor(config: EventBusConfig = {}) {
    super();
    this.config = {
      enableLogging: config.enableLogging ?? false,
      maxEventHistory: config.maxEventHistory ?? 1000,
      enableEventPersistence: config.enableEventPersistence ?? false,
      eventTimeoutMs: config.eventTimeoutMs ?? 30000
    };
    
    this.stats = {
      totalEvents: 0,
      activeSubscriptions: 0,
      eventsByType: new Map(),
      eventsByAgent: new Map(),
      averageEventLatency: 0
    };

    this.startEventCleanup();
  }

  /**
   * Subscribe to agent events
   */
  subscribeToAgentEvents(agentId: string, handler: (event: AgentEvent) => void): string {
    const subscriptionId = this.generateSubscriptionId();
    
    const subscription: EventSubscription = {
      id: subscriptionId,
      event: 'agent.*',
      handler: (event: AgentEvent) => {
        if (event.agentId === agentId) {
          handler(event);
        }
      },
      agentId
    };

    this.addSubscription('agent.*', subscription);
    
    if (this.config.enableLogging) {
      console.log(`Subscribed to agent events for agent: ${agentId}`);
    }
    
    return subscriptionId;
  }

  /**
   * Subscribe to task events
   */
  subscribeToTaskEvents(agentId: string, handler: (event: TaskEvent) => void): string {
    const subscriptionId = this.generateSubscriptionId();
    
    const subscription: EventSubscription = {
      id: subscriptionId,
      event: 'task.*',
      handler: (event: TaskEvent) => {
        if (event.agentId === agentId) {
          handler(event);
        }
      },
      agentId
    };

    this.addSubscription('task.*', subscription);
    
    if (this.config.enableLogging) {
      console.log(`Subscribed to task events for agent: ${agentId}`);
    }
    
    return subscriptionId;
  }

  /**
   * Subscribe to message events
   */
  subscribeToMessageEvents(agentId: string, handler: (event: MessageEvent) => void): string {
    const subscriptionId = this.generateSubscriptionId();
    
    const subscription: EventSubscription = {
      id: subscriptionId,
      event: 'message.*',
      handler: (event: MessageEvent) => {
        if (event.agentId === agentId || event.from === agentId || event.to === agentId) {
          handler(event);
        }
      },
      agentId
    };

    this.addSubscription('message.*', subscription);
    
    if (this.config.enableLogging) {
      console.log(`Subscribed to message events for agent: ${agentId}`);
    }
    
    return subscriptionId;
  }

  /**
   * Subscribe to specific event types
   */
  subscribe(eventType: string, handler: (data: any) => void, options: { agentId?: string; once?: boolean; priority?: number } = {}): string {
    const subscriptionId = this.generateSubscriptionId();
    
    const subscription: EventSubscription = {
      id: subscriptionId,
      event: eventType,
      handler,
      agentId: options.agentId,
      once: options.once,
      priority: options.priority ?? 0
    };

    this.addSubscription(eventType, subscription);
    
    if (this.config.enableLogging) {
      console.log(`Subscribed to event: ${eventType} (ID: ${subscriptionId})`);
    }
    
    return subscriptionId;
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId: string): boolean {
    for (const [eventType, subscriptions] of this.subscriptions.entries()) {
      const index = subscriptions.findIndex(sub => sub.id === subscriptionId);
      if (index !== -1) {
        subscriptions.splice(index, 1);
        
        if (subscriptions.length === 0) {
          this.subscriptions.delete(eventType);
        }
        
        this.updateActiveSubscriptions();
        
        if (this.config.enableLogging) {
          console.log(`Unsubscribed from event: ${eventType} (ID: ${subscriptionId})`);
        }
        
        return true;
      }
    }
    
    return false;
  }

  /**
   * Unsubscribe all events for an agent
   */
  unsubscribeAgent(agentId: string): number {
    let removedCount = 0;
    
    for (const [eventType, subscriptions] of this.subscriptions.entries()) {
      const initialLength = subscriptions.length;
      this.subscriptions.set(
        eventType,
        subscriptions.filter(sub => sub.agentId !== agentId)
      );
      
      const finalLength = this.subscriptions.get(eventType)!.length;
      removedCount += initialLength - finalLength;
      
      if (finalLength === 0) {
        this.subscriptions.delete(eventType);
      }
    }
    
    this.updateActiveSubscriptions();
    
    if (this.config.enableLogging) {
      console.log(`Unsubscribed ${removedCount} event subscriptions for agent: ${agentId}`);
    }
    
    return removedCount;
  }

  /**
   * Emit an agent event
   */
  emitAgentEvent(event: AgentEvent): void {
    this.emitEvent(`agent.${event.type}`, event);
    this.emitEvent('agent.*', event);
    
    // Update agent stats
    const agentCount = this.stats.eventsByAgent.get(event.agentId) || 0;
    this.stats.eventsByAgent.set(event.agentId, agentCount + 1);
  }

  /**
   * Emit a task event
   */
  emitTaskEvent(event: TaskEvent): void {
    this.emitEvent(`task.${event.type}`, event);
    this.emitEvent('task.*', event);
    
    // Update agent stats
    const agentCount = this.stats.eventsByAgent.get(event.agentId) || 0;
    this.stats.eventsByAgent.set(event.agentId, agentCount + 1);
  }

  /**
   * Emit a message event
   */
  emitMessageEvent(event: MessageEvent): void {
    this.emitEvent(`message.${event.type}`, event);
    this.emitEvent('message.*', event);
    
    // Update agent stats
    const agentCount = this.stats.eventsByAgent.get(event.agentId) || 0;
    this.stats.eventsByAgent.set(event.agentId, agentCount + 1);
  }

  /**
   * Emit a generic event
   */
  emitEvent(eventType: string, data: any): void {
    const startTime = Date.now();
    
    // Update stats
    this.stats.totalEvents++;
    const typeCount = this.stats.eventsByType.get(eventType) || 0;
    this.stats.eventsByType.set(eventType, typeCount + 1);
    
    // Add to history
    if (this.config.maxEventHistory > 0) {
      this.eventHistory.push({
        event: eventType,
        data,
        timestamp: new Date()
      });
      
      // Trim history if needed
      if (this.eventHistory.length > this.config.maxEventHistory) {
        this.eventHistory.shift();
      }
    }
    
    // Get subscriptions for this event type
    const subscriptions = this.getMatchingSubscriptions(eventType);
    
    // Sort by priority (higher priority first)
    subscriptions.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    
    // Execute handlers
    const handlersToRemove: string[] = [];
    
    for (const subscription of subscriptions) {
      try {
        subscription.handler(data);
        
        // Mark for removal if it's a once subscription
        if (subscription.once) {
          handlersToRemove.push(subscription.id);
        }
      } catch (error) {
        if (this.config.enableLogging) {
          console.error(`Error in event handler for ${eventType}:`, error);
        }
        
        super.emit('error', {
          eventType,
          subscriptionId: subscription.id,
          error,
          data
        });
      }
    }
    
    // Remove once subscriptions
    handlersToRemove.forEach(id => this.unsubscribe(id));
    
    // Update latency stats
    const latency = Date.now() - startTime;
    this.updateAverageLatency(latency);
    
    // Emit to EventEmitter as well
    super.emit(eventType, data);
    
    if (this.config.enableLogging) {
      console.log(`Event emitted: ${eventType} (${subscriptions.length} handlers, ${latency}ms)`);
    }
  }

  /**
   * Get event history
   */
  getEventHistory(limit?: number): Array<{ event: string; data: any; timestamp: Date }> {
    if (limit) {
      return this.eventHistory.slice(-limit);
    }
    return [...this.eventHistory];
  }

  /**
   * Get events for a specific agent
   */
  getAgentEventHistory(agentId: string, limit?: number): Array<{ event: string; data: any; timestamp: Date }> {
    const agentEvents = this.eventHistory.filter(entry => {
      const data = entry.data;
      return data.agentId === agentId || data.from === agentId || data.to === agentId;
    });
    
    if (limit) {
      return agentEvents.slice(-limit);
    }
    return agentEvents;
  }

  /**
   * Get event statistics
   */
  getStats(): EventStats {
    return {
      ...this.stats,
      eventsByType: new Map(this.stats.eventsByType),
      eventsByAgent: new Map(this.stats.eventsByAgent)
    };
  }

  /**
   * Get active subscriptions
   */
  getActiveSubscriptions(): Map<string, EventSubscription[]> {
    return new Map(this.subscriptions);
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory.length = 0;
  }

  /**
   * Reset all stats and subscriptions
   */
  reset(): void {
    this.subscriptions.clear();
    this.eventHistory.length = 0;
    
    this.stats = {
      totalEvents: 0,
      activeSubscriptions: 0,
      eventsByType: new Map(),
      eventsByAgent: new Map(),
      averageEventLatency: 0
    };
    
    this.removeAllListeners();
  }

  /**
   * Private helper methods
   */
  private addSubscription(eventType: string, subscription: EventSubscription): void {
    const subscriptions = this.subscriptions.get(eventType) || [];
    subscriptions.push(subscription);
    this.subscriptions.set(eventType, subscriptions);
    
    this.updateActiveSubscriptions();
  }

  private getMatchingSubscriptions(eventType: string): EventSubscription[] {
    const subscriptions: EventSubscription[] = [];
    
    for (const [pattern, subs] of this.subscriptions.entries()) {
      if (this.matchesPattern(eventType, pattern)) {
        subscriptions.push(...subs);
      }
    }
    
    return subscriptions;
  }

  private matchesPattern(eventType: string, pattern: string): boolean {
    if (pattern === eventType) {
      return true;
    }
    
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      return eventType.startsWith(prefix);
    }
    
    return false;
  }

  private updateActiveSubscriptions(): void {
    this.stats.activeSubscriptions = Array.from(this.subscriptions.values())
      .reduce((total, subs) => total + subs.length, 0);
  }

  private updateAverageLatency(latency: number): void {
    const currentAverage = this.stats.averageEventLatency;
    const totalEvents = this.stats.totalEvents;
    this.stats.averageEventLatency = 
      ((currentAverage * (totalEvents - 1)) + latency) / totalEvents;
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startEventCleanup(): void {
    // Clean up old events periodically
    setInterval(() => {
      this.cleanupOldEvents();
    }, 60000); // Clean up every minute
  }

  private cleanupOldEvents(): void {
    if (this.config.eventTimeoutMs && this.config.eventTimeoutMs > 0) {
      const cutoffTime = Date.now() - this.config.eventTimeoutMs;
      
      this.eventHistory = this.eventHistory.filter(
        entry => entry.timestamp.getTime() > cutoffTime
      );
    }
  }

  /**
   * Cleanup and stop the event bus
   */
  async cleanup(): Promise<void> {
    this.reset();
  }
}