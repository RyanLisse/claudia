import { z } from 'zod';

// Agent Status
export enum AgentStatus {
  IDLE = 'idle',
  BUSY = 'busy',
  ERROR = 'error',
  OFFLINE = 'offline',
  STARTING = 'starting',
  STOPPING = 'stopping'
}

// Task Status
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout'
}

// Agent Types
export enum AgentType {
  CODER = 'coder',
  RESEARCHER = 'researcher',
  ANALYST = 'analyst',
  REVIEWER = 'reviewer',
  COORDINATOR = 'coordinator',
  TESTER = 'tester',
  ARCHITECT = 'architect'
}

// Priority levels
export enum Priority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  CRITICAL = 4
}

// Agent Capabilities
export enum AgentCapability {
  CODE_GENERATION = 'code_generation',
  CODE_REVIEW = 'code_review',
  TESTING = 'testing',
  DOCUMENTATION = 'documentation',
  RESEARCH = 'research',
  ANALYSIS = 'analysis',
  DEBUGGING = 'debugging',
  REFACTORING = 'refactoring',
  ARCHITECTURE = 'architecture',
  DEPLOYMENT = 'deployment',
  MONITORING = 'monitoring',
  OPTIMIZATION = 'optimization'
}

// Base schemas
export const AgentTaskSchema = z.object({
  id: z.string(),
  type: z.string(),
  payload: z.any(),
  sessionId: z.string(),
  agentId: z.string(),
  priority: z.nativeEnum(Priority).default(Priority.NORMAL),
  retries: z.number().default(0),
  maxRetries: z.number().default(3),
  timeoutMs: z.number().default(300000), // 5 minutes
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.PENDING),
  result: z.any().optional(),
  error: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

export const AgentConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.nativeEnum(AgentType),
  capabilities: z.array(z.nativeEnum(AgentCapability)),
  maxConcurrentTasks: z.number().default(1),
  config: z.record(z.any()).optional(),
  enabled: z.boolean().default(true),
  version: z.string().default('1.0.0'),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

export const AgentMetricsSchema = z.object({
  id: z.string(),
  tasksCompleted: z.number().default(0),
  tasksInProgress: z.number().default(0),
  tasksFailed: z.number().default(0),
  averageTaskDurationMs: z.number().default(0),
  lastActiveAt: z.date(),
  uptime: z.number().default(0),
  memoryUsage: z.number().optional(),
  cpuUsage: z.number().optional(),
  errorRate: z.number().default(0),
  throughput: z.number().default(0)
});

export const MessageSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  type: z.string(),
  payload: z.any(),
  priority: z.nativeEnum(Priority).default(Priority.NORMAL),
  timestamp: z.date().default(() => new Date()),
  correlationId: z.string().optional(),
  replyTo: z.string().optional(),
  ttl: z.number().optional()
});

export const WorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  stages: z.array(z.object({
    id: z.string(),
    name: z.string(),
    parallel: z.boolean().default(false),
    tasks: z.array(z.object({
      id: z.string(),
      type: z.string(),
      agentId: z.string(),
      payload: z.any(),
      dependencies: z.array(z.string()).optional()
    }))
  })),
  status: z.enum(['pending', 'running', 'completed', 'failed']).default('pending'),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

// Type exports
export type AgentTask = z.infer<typeof AgentTaskSchema>;
export type AgentConfig = z.infer<typeof AgentConfigSchema>;
export type AgentMetrics = z.infer<typeof AgentMetricsSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type Workflow = z.infer<typeof WorkflowSchema>;

// Agent interfaces
export interface IAgent {
  id: string;
  config: AgentConfig;
  status: AgentStatus;
  metrics: AgentMetrics;
  
  start(): Promise<void>;
  stop(): Promise<void>;
  assignTask(task: AgentTask): Promise<boolean>;
  cancelTask(taskId: string): Promise<boolean>;
  getCurrentTasks(): AgentTask[];
  getStatus(): AgentStatus;
  getMetrics(): AgentMetrics;
  healthCheck(): Promise<boolean>;
}

export interface ITaskExecutor {
  execute(task: AgentTask): Promise<any>;
  validate(task: AgentTask): Promise<boolean>;
  canHandle(task: AgentTask): boolean;
  getExecutionContext(taskId: string): any;
  pauseTask(taskId: string): Promise<boolean>;
  resumeTask(taskId: string): Promise<boolean>;
}

export interface IAgentCommunication {
  sendMessage(message: Omit<Message, 'id' | 'from' | 'timestamp'>): Promise<void>;
  handleMessage(message: Message): Promise<void>;
  subscribe(messageType: string, handler: (message: Message) => Promise<void>): void;
  unsubscribe(messageType: string): void;
  request(to: string, type: string, payload: any, timeoutMs?: number): Promise<any>;
  respond(to: string, correlationId: string, payload: any): Promise<void>;
  broadcast(type: string, payload: any): Promise<void>;
}

export interface IAgentLifecycle {
  initialize(config: AgentConfig): Promise<void>;
  cleanup(): Promise<void>;
  restart(): Promise<void>;
  updateConfig(config: Partial<AgentConfig>): Promise<void>;
}

// Event types
export interface AgentEvent {
  type: string;
  agentId: string;
  timestamp: Date;
  data: any;
}

export interface TaskEvent extends AgentEvent {
  taskId: string;
}

export interface MessageEvent extends AgentEvent {
  messageId: string;
  from: string;
  to: string;
}

// Error types
export class AgentError extends Error {
  constructor(
    message: string,
    public agentId: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

export class TaskExecutionError extends AgentError {
  constructor(
    message: string,
    agentId: string,
    public taskId: string,
    details?: any
  ) {
    super(message, agentId, 'TASK_EXECUTION_ERROR', details);
    this.name = 'TaskExecutionError';
  }
}

export class AgentCommunicationError extends AgentError {
  constructor(
    message: string,
    agentId: string,
    public messageId: string,
    details?: any
  ) {
    super(message, agentId, 'COMMUNICATION_ERROR', details);
    this.name = 'AgentCommunicationError';
  }
}

// Utility functions
export function validateAgentTask(task: any): task is AgentTask {
  return AgentTaskSchema.safeParse(task).success;
}

export function validateAgentConfig(config: any): config is AgentConfig {
  return AgentConfigSchema.safeParse(config).success;
}

export function validateMessage(message: any): message is Message {
  return MessageSchema.safeParse(message).success;
}

export function hasCapability(agent: AgentConfig, capability: AgentCapability): boolean {
  return agent.capabilities.includes(capability);
}

export function hasAllCapabilities(agent: AgentConfig, capabilities: AgentCapability[]): boolean {
  return capabilities.every(cap => agent.capabilities.includes(cap));
}

export function compareByPriority(a: AgentTask, b: AgentTask): number {
  return b.priority - a.priority;
}

export function isTaskExpired(task: AgentTask): boolean {
  const now = Date.now();
  const taskTime = task.createdAt.getTime();
  return (now - taskTime) > task.timeoutMs;
}

export function shouldRetryTask(task: AgentTask): boolean {
  return task.retries < task.maxRetries;
}

export function calculateErrorRate(metrics: AgentMetrics): number {
  const totalTasks = metrics.tasksCompleted + metrics.tasksFailed;
  return totalTasks > 0 ? metrics.tasksFailed / totalTasks : 0;
}

export function calculateThroughput(metrics: AgentMetrics): number {
  const uptimeHours = metrics.uptime / (1000 * 60 * 60);
  return uptimeHours > 0 ? metrics.tasksCompleted / uptimeHours : 0;
}

// Default configurations
export const DEFAULT_AGENT_CONFIG: Partial<AgentConfig> = {
  maxConcurrentTasks: 1,
  enabled: true,
  version: '1.0.0'
};

export const DEFAULT_TASK_CONFIG: Partial<AgentTask> = {
  priority: Priority.NORMAL,
  retries: 0,
  maxRetries: 3,
  timeoutMs: 300000, // 5 minutes
  status: TaskStatus.PENDING
};

export const DEFAULT_MESSAGE_CONFIG: Partial<Message> = {
  priority: Priority.NORMAL,
  ttl: 300000 // 5 minutes
};