/**
 * Message broker for inter-agent communication
 */

import { EventEmitter } from 'events';
import type { 
  AgentId, 
  MessageId, 
  Message, 
  Priority 
} from '../types/agent.js';
import { inngest } from '../inngest/client.js';

export interface MessageRoute {
  from: AgentId;
  to: AgentId | 'broadcast';
  patterns: string[];
}

export interface MessageFilter {
  agentId?: AgentId;
  messageType?: string;
  priority?: Priority;
  correlationId?: string;
}

/**
 * In-memory message broker with Inngest integration
 */
export class MessageBroker extends EventEmitter {
  private routes: Map<string, MessageRoute[]> = new Map();
  private messageHistory: Map<MessageId, Message> = new Map();
  private subscriptions: Map<AgentId, Set<string>> = new Map();
  private deliveryQueues: Map<AgentId, Message[]> = new Map();
  private maxHistorySize = 10000;
  private maxQueueSize = 1000;

  constructor() {
    super();
    this.setupCleanupInterval();
  }

  /**
   * Register an agent for message routing
   */
  registerAgent(agentId: AgentId): void {
    if (!this.subscriptions.has(agentId)) {
      this.subscriptions.set(agentId, new Set());
      this.deliveryQueues.set(agentId, []);
      this.emit('agent.registered', { agentId });
    }
  }

  /**
   * Unregister an agent
   */
  unregisterAgent(agentId: AgentId): void {
    this.subscriptions.delete(agentId);
    this.deliveryQueues.delete(agentId);
    
    // Remove routes involving this agent
    for (const [pattern, routes] of this.routes) {
      const filtered = routes.filter(route => 
        route.from !== agentId && route.to !== agentId
      );
      if (filtered.length === 0) {
        this.routes.delete(pattern);
      } else {
        this.routes.set(pattern, filtered);
      }
    }
    
    this.emit('agent.unregistered', { agentId });
  }

  /**
   * Subscribe an agent to specific message types
   */
  subscribe(agentId: AgentId, messageType: string): void {
    const agentSubscriptions = this.subscriptions.get(agentId);
    if (agentSubscriptions) {
      agentSubscriptions.add(messageType);
      this.emit('subscription.added', { agentId, messageType });
    }
  }

  /**
   * Unsubscribe an agent from message types
   */
  unsubscribe(agentId: AgentId, messageType?: string): void {
    const agentSubscriptions = this.subscriptions.get(agentId);
    if (agentSubscriptions) {
      if (messageType) {
        agentSubscriptions.delete(messageType);
        this.emit('subscription.removed', { agentId, messageType });
      } else {
        agentSubscriptions.clear();
        this.emit('subscriptions.cleared', { agentId });
      }
    }
  }

  /**
   * Add a message route
   */
  addRoute(route: MessageRoute): void {
    for (const pattern of route.patterns) {
      const existing = this.routes.get(pattern) || [];
      existing.push(route);
      this.routes.set(pattern, existing);
    }
    this.emit('route.added', route);
  }

  /**
   * Remove a message route
   */
  removeRoute(from: AgentId, to: AgentId | 'broadcast', pattern: string): void {
    const routes = this.routes.get(pattern);
    if (routes) {
      const filtered = routes.filter(route => 
        !(route.from === from && route.to === to)
      );
      if (filtered.length === 0) {
        this.routes.delete(pattern);
      } else {
        this.routes.set(pattern, filtered);
      }
    }
    this.emit('route.removed', { from, to, pattern });
  }

  /**
   * Send a message through the broker
   */
  async sendMessage(message: Message): Promise<boolean> {
    try {
      // Store message in history
      this.messageHistory.set(message.id, message);
      
      // Emit to Inngest for persistence and advanced routing
      await inngest.send({
        name: 'agent/message.sent',
        data: {
          messageId: message.id,
          from: message.from,
          to: message.to,
          type: message.type,
          payload: message.payload,
          priority: message.priority,
          timestamp: message.timestamp.toISOString(),
          correlationId: message.correlationId,
        }
      });

      // Handle local routing
      const delivered = await this.routeMessage(message);
      
      this.emit('message.sent', { message, delivered });
      return delivered;
    } catch (error) {
      this.emit('message.error', { message, error });
      return false;
    }
  }

  /**
   * Get messages for an agent
   */
  getMessages(agentId: AgentId, filter?: MessageFilter): Message[] {
    const queue = this.deliveryQueues.get(agentId) || [];
    
    if (!filter) {
      return [...queue];
    }

    return queue.filter(message => {
      if (filter.messageType && message.type !== filter.messageType) {
        return false;
      }
      if (filter.priority && message.priority !== filter.priority) {
        return false;
      }
      if (filter.correlationId && message.correlationId !== filter.correlationId) {
        return false;
      }
      return true;
    });
  }

  /**
   * Acknowledge message delivery (remove from queue)
   */
  acknowledgeMessage(agentId: AgentId, messageId: MessageId): boolean {
    const queue = this.deliveryQueues.get(agentId);
    if (queue) {
      const index = queue.findIndex(msg => msg.id === messageId);
      if (index >= 0) {
        queue.splice(index, 1);
        this.emit('message.acknowledged', { agentId, messageId });
        return true;
      }
    }
    return false;
  }

  /**
   * Get message by ID from history
   */
  getMessage(messageId: MessageId): Message | null {
    return this.messageHistory.get(messageId) || null;
  }

  /**
   * Get broker statistics
   */
  getStats(): {
    totalMessages: number;
    activeAgents: number;
    totalRoutes: number;
    queueSizes: Record<AgentId, number>;
  } {
    const queueSizes: Record<AgentId, number> = {};
    for (const [agentId, queue] of this.deliveryQueues) {
      queueSizes[agentId] = queue.length;
    }

    return {
      totalMessages: this.messageHistory.size,
      activeAgents: this.subscriptions.size,
      totalRoutes: Array.from(this.routes.values()).reduce((sum, routes) => sum + routes.length, 0),
      queueSizes,
    };
  }

  /**
   * Clear old messages from history
   */
  clearHistory(olderThanMs: number = 3600000): number { // Default 1 hour
    const cutoff = Date.now() - olderThanMs;
    let cleared = 0;

    for (const [messageId, message] of this.messageHistory) {
      if (message.timestamp.getTime() < cutoff) {
        this.messageHistory.delete(messageId);
        cleared++;
      }
    }

    this.emit('history.cleared', { cleared });
    return cleared;
  }

  /**
   * Route a message to appropriate agents
   */
  private async routeMessage(message: Message): Promise<boolean> {
    if (message.to === 'broadcast') {
      return this.broadcastMessage(message);
    } else {
      return this.deliverToAgent(message.to, message);
    }
  }

  /**
   * Broadcast message to all subscribed agents
   */
  private broadcastMessage(message: Message): boolean {
    let delivered = false;

    for (const [agentId, subscriptions] of this.subscriptions) {
      if (agentId !== message.from && subscriptions.has(message.type)) {
        if (this.deliverToAgent(agentId, message)) {
          delivered = true;
        }
      }
    }

    return delivered;
  }

  /**
   * Deliver message to specific agent
   */
  private deliverToAgent(agentId: AgentId, message: Message): boolean {
    const queue = this.deliveryQueues.get(agentId);
    if (!queue) {
      return false;
    }

    // Check queue size limit
    if (queue.length >= this.maxQueueSize) {
      // Remove oldest message to make room
      queue.shift();
      this.emit('queue.overflow', { agentId, droppedMessage: queue[0] });
    }

    // Add message to queue (sorted by priority)
    const insertIndex = queue.findIndex(msg => msg.priority < message.priority);
    if (insertIndex >= 0) {
      queue.splice(insertIndex, 0, message);
    } else {
      queue.push(message);
    }

    this.emit('message.delivered', { agentId, messageId: message.id });
    return true;
  }

  /**
   * Setup periodic cleanup
   */
  private setupCleanupInterval(): void {
    setInterval(() => {
      // Clear old message history
      if (this.messageHistory.size > this.maxHistorySize) {
        const toDelete = this.messageHistory.size - this.maxHistorySize;
        const entries = Array.from(this.messageHistory.entries())
          .sort(([, a], [, b]) => a.timestamp.getTime() - b.timestamp.getTime())
          .slice(0, toDelete);
        
        for (const [messageId] of entries) {
          this.messageHistory.delete(messageId);
        }
      }

      // Clear old messages from history
      this.clearHistory();
    }, 300000); // Run every 5 minutes
  }
}

/**
 * Singleton message broker instance
 */
export const messageBroker = new MessageBroker();