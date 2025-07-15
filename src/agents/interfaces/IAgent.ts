/**
 * Core agent interfaces for the AI Agent System
 */

import type {
  AgentId,
  TaskId,
  MessageId,
  AgentConfig,
  AgentMetrics,
  AgentStatus,
  Task,
  TaskResult,
  Message,
  AgentCapability
} from '../types/agent.js';

/**
 * Base interface for all agents in the system
 */
export interface IAgent {
  readonly id: AgentId;
  readonly config: AgentConfig;
  
  /**
   * Get current agent status
   */
  getStatus(): AgentStatus;
  
  /**
   * Get agent metrics
   */
  getMetrics(): AgentMetrics;
  
  /**
   * Start the agent
   */
  start(): Promise<void>;
  
  /**
   * Stop the agent gracefully
   */
  stop(): Promise<void>;
  
  /**
   * Assign a task to this agent
   */
  assignTask(task: Task): Promise<boolean>;
  
  /**
   * Cancel a task
   */
  cancelTask(taskId: TaskId): Promise<boolean>;
  
  /**
   * Get current tasks
   */
  getCurrentTasks(): Task[];
  
  /**
   * Send a message to another agent or broadcast
   */
  sendMessage(message: Omit<Message, 'id' | 'from' | 'timestamp'>): Promise<void>;
  
  /**
   * Handle incoming messages
   */
  handleMessage(message: Message): Promise<void>;
  
  /**
   * Health check - returns true if agent is responsive
   */
  healthCheck(): Promise<boolean>;
}

/**
 * Interface for agent lifecycle management
 */
export interface IAgentLifecycle {
  /**
   * Initialize the agent with configuration
   */
  initialize(config: AgentConfig): Promise<void>;
  
  /**
   * Cleanup resources on shutdown
   */
  cleanup(): Promise<void>;
  
  /**
   * Restart the agent
   */
  restart(): Promise<void>;
  
  /**
   * Update agent configuration
   */
  updateConfig(config: Partial<AgentConfig>): Promise<void>;
}

/**
 * Interface for task execution
 */
export interface ITaskExecutor {
  /**
   * Execute a task and return the result
   */
  executeTask(task: Task): Promise<TaskResult>;
  
  /**
   * Check if agent can handle a specific task type
   */
  canHandle(task: Task): boolean;
  
  /**
   * Get execution context for a task
   */
  getExecutionContext(taskId: TaskId): any;
  
  /**
   * Pause task execution
   */
  pauseTask(taskId: TaskId): Promise<boolean>;
  
  /**
   * Resume task execution
   */
  resumeTask(taskId: TaskId): Promise<boolean>;
}

/**
 * Interface for agent communication
 */
export interface IAgentCommunication {
  /**
   * Subscribe to message types
   */
  subscribe(messageType: string, handler: (message: Message) => Promise<void>): void;
  
  /**
   * Unsubscribe from message types
   */
  unsubscribe(messageType: string): void;
  
  /**
   * Send a request and wait for response
   */
  request(to: AgentId, type: string, payload: any, timeoutMs?: number): Promise<any>;
  
  /**
   * Send a response to a request
   */
  respond(to: AgentId, correlationId: string, payload: any): Promise<void>;
  
  /**
   * Broadcast a message to all agents
   */
  broadcast(type: string, payload: any): Promise<void>;
}

/**
 * Interface for agent discovery and registration
 */
export interface IAgentRegistry {
  /**
   * Register an agent in the system
   */
  register(agent: IAgent): Promise<void>;
  
  /**
   * Unregister an agent
   */
  unregister(agentId: AgentId): Promise<void>;
  
  /**
   * Find agents by capability
   */
  findByCapability(capability: AgentCapability): Promise<AgentId[]>;
  
  /**
   * Find agents by status
   */
  findByStatus(status: AgentStatus): Promise<AgentId[]>;
  
  /**
   * Get all registered agents
   */
  getAllAgents(): Promise<AgentId[]>;
  
  /**
   * Get agent by ID
   */
  getAgent(agentId: AgentId): Promise<IAgent | null>;
  
  /**
   * Check if agent is registered
   */
  isRegistered(agentId: AgentId): Promise<boolean>;
}

/**
 * Interface for agent monitoring
 */
export interface IAgentMonitor {
  /**
   * Start monitoring an agent
   */
  startMonitoring(agentId: AgentId): Promise<void>;
  
  /**
   * Stop monitoring an agent
   */
  stopMonitoring(agentId: AgentId): Promise<void>;
  
  /**
   * Get real-time metrics for an agent
   */
  getMetrics(agentId: AgentId): Promise<AgentMetrics>;
  
  /**
   * Get system-wide metrics
   */
  getSystemMetrics(): Promise<{
    totalAgents: number;
    activeAgents: number;
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageResponseTime: number;
  }>;
  
  /**
   * Subscribe to metric updates
   */
  subscribeToMetrics(agentId: AgentId, callback: (metrics: AgentMetrics) => void): void;
  
  /**
   * Get health status of all agents
   */
  getHealthStatus(): Promise<Record<AgentId, boolean>>;
}

/**
 * Interface for task queue management
 */
export interface ITaskQueue {
  /**
   * Add a task to the queue
   */
  enqueue(task: Task): Promise<void>;
  
  /**
   * Get the next task for an agent with specific capabilities
   */
  dequeue(capabilities: AgentCapability[]): Promise<Task | null>;
  
  /**
   * Get queue size
   */
  size(): Promise<number>;
  
  /**
   * Get tasks by status
   */
  getTasksByStatus(status: string): Promise<Task[]>;
  
  /**
   * Remove a task from the queue
   */
  remove(taskId: TaskId): Promise<boolean>;
  
  /**
   * Update task status
   */
  updateTaskStatus(taskId: TaskId, status: string): Promise<void>;
  
  /**
   * Get task by ID
   */
  getTask(taskId: TaskId): Promise<Task | null>;
}

/**
 * Interface for agent orchestration
 */
export interface IAgentOrchestrator {
  /**
   * Initialize the orchestration system
   */
  initialize(): Promise<void>;
  
  /**
   * Shutdown the orchestration system
   */
  shutdown(): Promise<void>;
  
  /**
   * Submit a task for execution
   */
  submitTask(task: Omit<Task, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<TaskId>;
  
  /**
   * Get task result
   */
  getTaskResult(taskId: TaskId): Promise<TaskResult | null>;
  
  /**
   * Cancel a task
   */
  cancelTask(taskId: TaskId): Promise<boolean>;
  
  /**
   * Scale the number of agents
   */
  scaleAgents(targetCount: number): Promise<void>;
  
  /**
   * Get orchestrator status
   */
  getStatus(): Promise<{
    isRunning: boolean;
    agentCount: number;
    queueSize: number;
    tasksInProgress: number;
  }>;
}