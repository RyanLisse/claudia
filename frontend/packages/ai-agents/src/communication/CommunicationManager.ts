import { EventEmitter } from 'eventemitter3';
import type { Message, AgentConfig, AgentStatus, AgentMetrics, AgentCapability } from '../types';
import { MessageBroker } from './MessageBroker';
import { EventBus } from './EventBus';
import { MessageQueue } from './MessageQueue';
import { AgentRegistry } from './AgentRegistry';

export interface CommunicationConfig {
  // Message broker configuration
  enablePriorityRouting?: boolean;
  maxRetryAttempts?: number;
  retryDelayMs?: number;
  
  // Event bus configuration
  enableEventHistory?: boolean;
  maxEventHistory?: number;
  
  // Message queue configuration
  maxConcurrentMessages?: number;
  messageTimeoutMs?: number;
  enableDeadLetterQueue?: boolean;
  
  // Agent registry configuration
  heartbeatTimeoutMs?: number;
  maxInactiveTimeMs?: number;
  
  // General configuration
  enableLogging?: boolean;
  enableMetrics?: boolean;
}

export interface CommunicationStats {
  messagesSent: number;
  messagesReceived: number;
  messagesQueued: number;
  messagesProcessed: number;
  messagesFailed: number;
  activeAgents: number;
  totalAgents: number;
  averageResponseTime: number;
  averageThroughput: number;
}

/**
 * Central communication manager that coordinates all communication infrastructure
 */
export class CommunicationManager extends EventEmitter {
  private messageBroker: MessageBroker;
  private eventBus: EventBus;
  private messageQueue: MessageQueue;
  private agentRegistry: AgentRegistry;
  private config: CommunicationConfig;
  private stats: CommunicationStats;
  private isRunning = false;

  constructor(config: CommunicationConfig = {}) {
    super();
    
    this.config = {
      enablePriorityRouting: config.enablePriorityRouting ?? true,
      maxRetryAttempts: config.maxRetryAttempts ?? 3,
      retryDelayMs: config.retryDelayMs ?? 1000,
      enableEventHistory: config.enableEventHistory ?? true,
      maxEventHistory: config.maxEventHistory ?? 1000,
      maxConcurrentMessages: config.maxConcurrentMessages ?? 10,
      messageTimeoutMs: config.messageTimeoutMs ?? 30000,
      enableDeadLetterQueue: config.enableDeadLetterQueue ?? true,
      heartbeatTimeoutMs: config.heartbeatTimeoutMs ?? 60000,
      maxInactiveTimeMs: config.maxInactiveTimeMs ?? 300000,
      enableLogging: config.enableLogging ?? false,
      enableMetrics: config.enableMetrics ?? true,
      ...config
    };

    this.stats = {
      messagesSent: 0,
      messagesReceived: 0,
      messagesQueued: 0,
      messagesProcessed: 0,
      messagesFailed: 0,
      activeAgents: 0,
      totalAgents: 0,
      averageResponseTime: 0,
      averageThroughput: 0
    };

    this.initializeComponents();
  }

  /**
   * Initialize all communication components
   */
  private initializeComponents(): void {
    // Initialize message broker
    this.messageBroker = new MessageBroker({
      enablePriorityRouting: this.config.enablePriorityRouting,
      maxRetryAttempts: this.config.maxRetryAttempts,
      retryDelayMs: this.config.retryDelayMs,
      enableDeadLetterQueue: this.config.enableDeadLetterQueue,
      enableLogging: this.config.enableLogging
    });

    // Initialize event bus
    this.eventBus = new EventBus({
      enableHistory: this.config.enableEventHistory,
      maxHistorySize: this.config.maxEventHistory,
      enableLogging: this.config.enableLogging
    });

    // Initialize message queue
    this.messageQueue = new MessageQueue({
      maxConcurrentTasks: this.config.maxConcurrentMessages,
      defaultTimeoutMs: this.config.messageTimeoutMs,
      maxAttempts: this.config.maxRetryAttempts,
      enableDeadLetterQueue: this.config.enableDeadLetterQueue,
      enableLogging: this.config.enableLogging
    });

    // Initialize agent registry
    this.agentRegistry = new AgentRegistry({
      heartbeatTimeoutMs: this.config.heartbeatTimeoutMs,
      maxInactiveTimeMs: this.config.maxInactiveTimeMs,
      enableLogging: this.config.enableLogging
    });

    this.setupEventHandlers();
  }

  /**
   * Set up event handlers between components
   */
  private setupEventHandlers(): void {
    // Message broker events
    this.messageBroker.on('message.sent', (data) => {
      this.stats.messagesSent++;
      this.emit('message.sent', data);
    });

    this.messageBroker.on('message.received', (data) => {
      this.stats.messagesReceived++;
      this.emit('message.received', data);
    });

    this.messageBroker.on('message.failed', (data) => {
      this.stats.messagesFailed++;
      this.emit('message.failed', data);
    });

    // Message queue events
    this.messageQueue.on('message.queued', (data) => {
      this.stats.messagesQueued++;
      this.emit('message.queued', data);
    });

    this.messageQueue.on('message.processed', (data) => {
      this.stats.messagesProcessed++;
      this.emit('message.processed', data);
    });

    this.messageQueue.on('message.timeout', (data) => {
      this.stats.messagesFailed++;
      this.emit('message.timeout', data);
    });

    // Agent registry events
    this.agentRegistry.on('agent.registered', (data) => {
      this.stats.totalAgents++;
      this.updateActiveAgentsCount();
      this.emit('agent.registered', data);
    });

    this.agentRegistry.on('agent.unregistered', (data) => {
      this.stats.totalAgents--;
      this.updateActiveAgentsCount();
      this.emit('agent.unregistered', data);
    });

    this.agentRegistry.on('agent.status.updated', (data) => {
      this.updateActiveAgentsCount();
      this.emit('agent.status.updated', data);
    });

    // Event bus events
    this.eventBus.on('event.published', (data) => {
      this.emit('event.published', data);
    });

    this.eventBus.on('event.subscription.added', (data) => {
      this.emit('event.subscription.added', data);
    });
  }

  /**
   * Start the communication manager
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    
    // Start message processing
    this.messageQueue.start();
    
    if (this.config.enableLogging) {
      console.log('CommunicationManager started');
    }
    
    this.emit('manager.started');
  }

  /**
   * Stop the communication manager
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    // Stop message processing
    this.messageQueue.stop();
    
    // Cleanup components
    await this.agentRegistry.cleanup();
    
    if (this.config.enableLogging) {
      console.log('CommunicationManager stopped');
    }
    
    this.emit('manager.stopped');
  }

  /**
   * Register an agent with the communication system
   */
  async registerAgent(
    config: AgentConfig,
    status: AgentStatus,
    metrics: AgentMetrics,
    options: {
      address?: string;
      tags?: string[];
      metadata?: Record<string, any>;
    } = {}
  ): Promise<void> {
    // Register with agent registry
    await this.agentRegistry.registerAgent(config, status, metrics, options);
    
    // Register with message broker
    this.messageBroker.registerAgent(config.id, config);
    
    if (this.config.enableLogging) {
      console.log(`Agent ${config.id} registered with communication system`);
    }
  }

  /**
   * Unregister an agent from the communication system
   */
  async unregisterAgent(agentId: string): Promise<void> {
    // Unregister from agent registry
    await this.agentRegistry.unregisterAgent(agentId);
    
    // Unregister from message broker
    this.messageBroker.unregisterAgent(agentId);
    
    if (this.config.enableLogging) {
      console.log(`Agent ${agentId} unregistered from communication system`);
    }
  }

  /**
   * Send a message through the communication system
   */
  async sendMessage(message: Message): Promise<void> {
    if (!this.isRunning) {
      throw new Error('CommunicationManager is not running');
    }

    // Queue message for processing
    await this.messageQueue.enqueue(message);
    
    // Process through message broker
    await this.messageBroker.sendMessage(message);
  }

  /**
   * Subscribe to message type
   */
  subscribeToMessages(
    messageType: string,
    handler: (message: Message) => Promise<void>
  ): string {
    return this.messageBroker.subscribe(messageType, handler);
  }

  /**
   * Unsubscribe from message type
   */
  unsubscribeFromMessages(subscriptionId: string): void {
    this.messageBroker.unsubscribe(subscriptionId);
  }

  /**
   * Publish event to event bus
   */
  publishEvent(event: string, data: any): void {
    this.eventBus.publish(event, data);
  }

  /**
   * Subscribe to event
   */
  subscribeToEvent(
    event: string,
    handler: (data: any) => void
  ): string {
    return this.eventBus.subscribe(event, handler);
  }

  /**
   * Unsubscribe from event
   */
  unsubscribeFromEvent(subscriptionId: string): void {
    this.eventBus.unsubscribe(subscriptionId);
  }

  /**
   * Find agents by capability
   */
  findAgentsByCapability(capability: AgentCapability): any[] {
    return this.agentRegistry.getAgentsByCapability(capability);
  }

  /**
   * Find best agent for task
   */
  findBestAgent(
    capabilities: AgentCapability[],
    options: {
      excludeAgents?: string[];
      preferredType?: string;
      sortBy?: 'uptime' | 'errorRate' | 'throughput' | 'capacity';
    } = {}
  ): any {
    return this.agentRegistry.findBestAgent(capabilities, options);
  }

  /**
   * Update agent status
   */
  async updateAgentStatus(agentId: string, status: AgentStatus): Promise<void> {
    await this.agentRegistry.updateAgentStatus(agentId, status);
  }

  /**
   * Update agent metrics
   */
  async updateAgentMetrics(agentId: string, metrics: AgentMetrics): Promise<void> {
    await this.agentRegistry.updateAgentMetrics(agentId, metrics);
  }

  /**
   * Process heartbeat from agent
   */
  async processHeartbeat(agentId: string, metrics?: AgentMetrics): Promise<void> {
    await this.agentRegistry.heartbeat(agentId, metrics);
  }

  /**
   * Get communication statistics
   */
  getStats(): CommunicationStats {
    return { ...this.stats };
  }

  /**
   * Get agent registry statistics
   */
  getAgentStats(): any {
    return this.agentRegistry.getStats();
  }

  /**
   * Get message queue statistics
   */
  getQueueStats(): any {
    return this.messageQueue.getStats();
  }

  /**
   * Get event bus statistics
   */
  getEventStats(): any {
    return this.eventBus.getStats();
  }

  /**
   * Get all active agents
   */
  getActiveAgents(): any[] {
    return this.agentRegistry.getActiveAgents();
  }

  /**
   * Get all registered agents
   */
  getAllAgents(): any[] {
    return this.agentRegistry.getAllAgents();
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): any {
    return this.agentRegistry.getAgent(agentId);
  }

  /**
   * Reset all statistics
   */
  resetStats(): void {
    this.stats = {
      messagesSent: 0,
      messagesReceived: 0,
      messagesQueued: 0,
      messagesProcessed: 0,
      messagesFailed: 0,
      activeAgents: 0,
      totalAgents: 0,
      averageResponseTime: 0,
      averageThroughput: 0
    };
    
    this.emit('stats.reset');
  }

  /**
   * Get comprehensive system status
   */
  getSystemStatus(): {
    manager: { isRunning: boolean };
    stats: CommunicationStats;
    agents: any;
    queue: any;
    events: any;
  } {
    return {
      manager: {
        isRunning: this.isRunning
      },
      stats: this.getStats(),
      agents: this.getAgentStats(),
      queue: this.getQueueStats(),
      events: this.getEventStats()
    };
  }

  /**
   * Private helper methods
   */
  private updateActiveAgentsCount(): void {
    this.stats.activeAgents = this.agentRegistry.getActiveAgents().length;
    this.stats.totalAgents = this.agentRegistry.getAllAgents().length;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.stop();
    
    // Clean up all components
    await this.agentRegistry.cleanup();
    this.messageQueue.cleanup();
    this.eventBus.cleanup();
    this.messageBroker.cleanup();
    
    this.removeAllListeners();
    
    if (this.config.enableLogging) {
      console.log('CommunicationManager cleaned up');
    }
  }
}