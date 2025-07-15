import { EventEmitter } from 'eventemitter3';
import { v4 as uuidv4 } from 'uuid';
import type { Message, AgentConfig, Priority } from '../types';

export interface MessageRoute {
  pattern: string;
  handler: (message: Message) => Promise<void>;
  priority?: Priority;
}

export interface MessageBrokerConfig {
  enableLogging?: boolean;
  enablePersistence?: boolean;
  maxRetries?: number;
  retryDelayMs?: number;
  deadLetterQueue?: boolean;
}

export interface MessageStats {
  totalMessages: number;
  successfulMessages: number;
  failedMessages: number;
  averageLatencyMs: number;
  messagesByType: Map<string, number>;
}

/**
 * Message broker for routing messages between agents
 */
export class MessageBroker extends EventEmitter {
  private routes: Map<string, MessageRoute[]> = new Map();
  private agentRegistry: Map<string, AgentConfig> = new Map();
  private messageQueue: Map<string, Message[]> = new Map();
  private processingQueue: Set<string> = new Set();
  private deadLetterQueue: Message[] = [];
  private stats: MessageStats;
  private config: MessageBrokerConfig;

  constructor(config: MessageBrokerConfig = {}) {
    super();
    this.config = {
      enableLogging: config.enableLogging ?? false,
      enablePersistence: config.enablePersistence ?? false,
      maxRetries: config.maxRetries ?? 3,
      retryDelayMs: config.retryDelayMs ?? 1000,
      deadLetterQueue: config.deadLetterQueue ?? true
    };
    
    this.stats = {
      totalMessages: 0,
      successfulMessages: 0,
      failedMessages: 0,
      averageLatencyMs: 0,
      messagesByType: new Map()
    };

    this.startMessageProcessor();
  }

  /**
   * Register an agent with the broker
   */
  async registerAgent(agent: AgentConfig): Promise<void> {
    this.agentRegistry.set(agent.id, agent);
    this.messageQueue.set(agent.id, []);
    
    if (this.config.enableLogging) {
      console.log(`Agent ${agent.id} registered with message broker`);
    }
    
    this.emit('agent.registered', { agentId: agent.id, agent });
  }

  /**
   * Unregister an agent from the broker
   */
  async unregisterAgent(agentId: string): Promise<void> {
    this.agentRegistry.delete(agentId);
    
    // Process any remaining messages in the queue
    const remainingMessages = this.messageQueue.get(agentId) || [];
    if (remainingMessages.length > 0) {
      if (this.config.deadLetterQueue) {
        this.deadLetterQueue.push(...remainingMessages);
      }
    }
    
    this.messageQueue.delete(agentId);
    
    if (this.config.enableLogging) {
      console.log(`Agent ${agentId} unregistered from message broker`);
    }
    
    this.emit('agent.unregistered', { agentId });
  }

  /**
   * Add a message route for specific message types
   */
  addRoute(messageType: string, handler: (message: Message) => Promise<void>, priority: Priority = Priority.NORMAL): void {
    const route: MessageRoute = {
      pattern: messageType,
      handler,
      priority
    };

    const existingRoutes = this.routes.get(messageType) || [];
    existingRoutes.push(route);
    existingRoutes.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    
    this.routes.set(messageType, existingRoutes);
    
    if (this.config.enableLogging) {
      console.log(`Route added for message type: ${messageType}`);
    }
  }

  /**
   * Remove a message route
   */
  removeRoute(messageType: string, handler: (message: Message) => Promise<void>): void {
    const routes = this.routes.get(messageType) || [];
    const filteredRoutes = routes.filter(route => route.handler !== handler);
    
    if (filteredRoutes.length === 0) {
      this.routes.delete(messageType);
    } else {
      this.routes.set(messageType, filteredRoutes);
    }
    
    if (this.config.enableLogging) {
      console.log(`Route removed for message type: ${messageType}`);
    }
  }

  /**
   * Send a message through the broker
   */
  async sendMessage(message: Message): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Validate message
      if (!this.validateMessage(message)) {
        throw new Error('Invalid message format');
      }

      // Update stats
      this.stats.totalMessages++;
      const typeCount = this.stats.messagesByType.get(message.type) || 0;
      this.stats.messagesByType.set(message.type, typeCount + 1);

      // Handle broadcast messages
      if (message.to === 'broadcast') {
        await this.handleBroadcast(message);
        return;
      }

      // Route message to specific agent
      await this.routeMessage(message);
      
      // Update success stats
      this.stats.successfulMessages++;
      const latency = Date.now() - startTime;
      this.updateAverageLatency(latency);
      
      if (this.config.enableLogging) {
        console.log(`Message ${message.id} sent successfully (${latency}ms)`);
      }
      
      this.emit('message.sent', { message, latency });
      
    } catch (error) {
      this.stats.failedMessages++;
      
      if (this.config.enableLogging) {
        console.error(`Failed to send message ${message.id}:`, error);
      }
      
      this.emit('message.failed', { message, error });
      
      // Add to dead letter queue if enabled
      if (this.config.deadLetterQueue) {
        this.deadLetterQueue.push(message);
      }
      
      throw error;
    }
  }

  /**
   * Route a message to its destination
   */
  private async routeMessage(message: Message): Promise<void> {
    // Check if target agent is registered
    const targetAgent = this.agentRegistry.get(message.to);
    if (!targetAgent) {
      throw new Error(`Agent ${message.to} is not registered`);
    }

    // Add message to agent's queue
    const queue = this.messageQueue.get(message.to) || [];
    queue.push(message);
    this.messageQueue.set(message.to, queue);

    // Start processing if not already processing
    if (!this.processingQueue.has(message.to)) {
      this.processAgentQueue(message.to);
    }
  }

  /**
   * Handle broadcast messages
   */
  private async handleBroadcast(message: Message): Promise<void> {
    const activeAgents = Array.from(this.agentRegistry.keys());
    const broadcastPromises = activeAgents.map(agentId => {
      const broadcastMessage: Message = {
        ...message,
        to: agentId,
        id: uuidv4() // Generate new ID for each broadcast
      };
      return this.routeMessage(broadcastMessage);
    });

    await Promise.all(broadcastPromises);
  }

  /**
   * Process messages in an agent's queue
   */
  private async processAgentQueue(agentId: string): Promise<void> {
    if (this.processingQueue.has(agentId)) {
      return;
    }

    this.processingQueue.add(agentId);

    try {
      const queue = this.messageQueue.get(agentId) || [];
      
      while (queue.length > 0) {
        const message = queue.shift()!;
        
        try {
          await this.deliverMessage(message);
        } catch (error) {
          if (this.config.enableLogging) {
            console.error(`Failed to deliver message ${message.id} to ${agentId}:`, error);
          }
          
          // Add to dead letter queue
          if (this.config.deadLetterQueue) {
            this.deadLetterQueue.push(message);
          }
        }
      }
    } finally {
      this.processingQueue.delete(agentId);
    }
  }

  /**
   * Deliver a message to its destination
   */
  private async deliverMessage(message: Message): Promise<void> {
    // Check for message type routes
    const routes = this.routes.get(message.type) || [];
    
    if (routes.length > 0) {
      // Execute all routes for this message type
      const routePromises = routes.map(route => route.handler(message));
      await Promise.all(routePromises);
    }
    
    // Emit generic message event
    this.emit('message.delivered', { message });
  }

  /**
   * Validate message format
   */
  private validateMessage(message: Message): boolean {
    return !!(
      message.id &&
      message.from &&
      message.to &&
      message.type &&
      message.timestamp
    );
  }

  /**
   * Update average latency
   */
  private updateAverageLatency(latency: number): void {
    const currentAverage = this.stats.averageLatencyMs;
    const totalMessages = this.stats.successfulMessages;
    this.stats.averageLatencyMs = 
      ((currentAverage * (totalMessages - 1)) + latency) / totalMessages;
  }

  /**
   * Start the message processor
   */
  private startMessageProcessor(): void {
    // Process queues periodically
    setInterval(() => {
      this.processAllQueues();
    }, 100); // Process every 100ms
  }

  /**
   * Process all agent queues
   */
  private async processAllQueues(): Promise<void> {
    const agentIds = Array.from(this.messageQueue.keys());
    
    for (const agentId of agentIds) {
      if (!this.processingQueue.has(agentId)) {
        const queue = this.messageQueue.get(agentId) || [];
        if (queue.length > 0) {
          this.processAgentQueue(agentId);
        }
      }
    }
  }

  /**
   * Get broker statistics
   */
  getStats(): MessageStats {
    return {
      ...this.stats,
      messagesByType: new Map(this.stats.messagesByType)
    };
  }

  /**
   * Get dead letter queue messages
   */
  getDeadLetterQueue(): Message[] {
    return [...this.deadLetterQueue];
  }

  /**
   * Clear dead letter queue
   */
  clearDeadLetterQueue(): void {
    this.deadLetterQueue.length = 0;
  }

  /**
   * Get agent registry
   */
  getRegisteredAgents(): Map<string, AgentConfig> {
    return new Map(this.agentRegistry);
  }

  /**
   * Get pending messages for an agent
   */
  getPendingMessages(agentId: string): Message[] {
    return [...(this.messageQueue.get(agentId) || [])];
  }

  /**
   * Clear all queues and reset broker
   */
  reset(): void {
    this.routes.clear();
    this.agentRegistry.clear();
    this.messageQueue.clear();
    this.processingQueue.clear();
    this.deadLetterQueue.length = 0;
    
    this.stats = {
      totalMessages: 0,
      successfulMessages: 0,
      failedMessages: 0,
      averageLatencyMs: 0,
      messagesByType: new Map()
    };
    
    this.emit('broker.reset');
  }

  /**
   * Cleanup and stop the broker
   */
  async cleanup(): Promise<void> {
    this.reset();
    this.removeAllListeners();
  }
}