/**
 * Core types and interfaces for the AI Agent System
 */

export type AgentId = string;
export type TaskId = string;
export type MessageId = string;

/**
 * Agent Status enum indicating the current state of an agent
 */
export enum AgentStatus {
  IDLE = 'idle',
  BUSY = 'busy',
  STARTING = 'starting',
  STOPPING = 'stopping',
  ERROR = 'error',
  OFFLINE = 'offline'
}

/**
 * Task Status enum for tracking task lifecycle
 */
export enum TaskStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * Agent Capability types for specialization
 */
export enum AgentCapability {
  CODE_ANALYSIS = 'code_analysis',
  CODE_GENERATION = 'code_generation',
  TESTING = 'testing',
  DOCUMENTATION = 'documentation',
  SECURITY_AUDIT = 'security_audit',
  PERFORMANCE_OPTIMIZATION = 'performance_optimization',
  DATABASE_OPERATIONS = 'database_operations',
  API_INTEGRATION = 'api_integration',
  UI_UX_DESIGN = 'ui_ux_design',
  DEPLOYMENT = 'deployment'
}

/**
 * Priority levels for tasks and messages
 */
export enum Priority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  CRITICAL = 4
}

/**
 * Base agent configuration
 */
export interface AgentConfig {
  id: AgentId;
  name: string;
  description?: string;
  capabilities: AgentCapability[];
  maxConcurrentTasks: number;
  timeoutMs: number;
  retryAttempts: number;
  metadata?: Record<string, any>;
}

/**
 * Agent metrics for monitoring
 */
export interface AgentMetrics {
  id: AgentId;
  tasksCompleted: number;
  tasksInProgress: number;
  tasksFailed: number;
  averageTaskDurationMs: number;
  lastActiveAt: Date;
  uptime: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

/**
 * Task definition
 */
export interface Task {
  id: TaskId;
  type: string;
  priority: Priority;
  payload: Record<string, any>;
  requiredCapabilities: AgentCapability[];
  assignedAgent?: AgentId;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
  retryCount: number;
  maxRetries: number;
  timeoutMs: number;
  dependencies?: TaskId[];
  metadata?: Record<string, any>;
}

/**
 * Message types for agent communication
 */
export interface Message {
  id: MessageId;
  from: AgentId | 'system';
  to: AgentId | 'broadcast';
  type: string;
  payload: any;
  priority: Priority;
  timestamp: Date;
  correlationId?: string;
  replyTo?: MessageId;
}

/**
 * Agent state snapshot
 */
export interface AgentState {
  id: AgentId;
  status: AgentStatus;
  currentTasks: TaskId[];
  lastHeartbeat: Date;
  metrics: AgentMetrics;
  config: AgentConfig;
}

/**
 * Task execution result
 */
export interface TaskResult {
  taskId: TaskId;
  agentId: AgentId;
  status: TaskStatus;
  result?: any;
  error?: string;
  startedAt: Date;
  completedAt: Date;
  durationMs: number;
  metadata?: Record<string, any>;
}

/**
 * Event types for the agent system
 */
export interface AgentEvent {
  type: 'agent.started' | 'agent.stopped' | 'agent.error' | 'agent.heartbeat';
  agentId: AgentId;
  timestamp: Date;
  data: any;
}

export interface TaskEvent {
  type: 'task.created' | 'task.assigned' | 'task.started' | 'task.completed' | 'task.failed';
  taskId: TaskId;
  agentId?: AgentId;
  timestamp: Date;
  data: any;
}

/**
 * Agent orchestration configuration
 */
export interface OrchestrationConfig {
  maxAgents: number;
  taskQueueSize: number;
  heartbeatIntervalMs: number;
  taskTimeoutMs: number;
  retryPolicy: {
    maxRetries: number;
    backoffMs: number;
    backoffMultiplier: number;
  };
  loadBalancing: {
    strategy: 'round_robin' | 'least_busy' | 'capability_based';
    weights?: Record<AgentCapability, number>;
  };
}