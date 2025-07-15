import { EventEmitter } from 'eventemitter3';
import type { AgentCapability } from '../types';

export interface Task {
  id: string;
  type: string;
  priority: TaskPriority;
  status: TaskStatus;
  agentId?: string;
  requiredCapabilities: AgentCapability[];
  payload: any;
  metadata: TaskMetadata;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  timeoutAt?: Date;
  retryCount: number;
  maxRetries: number;
  dependencies: string[];
  tags: string[];
}

export enum TaskPriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  URGENT = 4,
  CRITICAL = 5
}

export enum TaskStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout',
  RETRY = 'retry'
}

export interface TaskMetadata {
  createdBy?: string;
  description?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  errorMessage?: string;
  progress?: number;
  checkpoint?: any;
  context?: Record<string, any>;
}

export interface TaskResult {
  taskId: string;
  status: TaskStatus;
  result?: any;
  error?: Error;
  metadata: TaskMetadata;
  completedAt: Date;
  duration: number;
}

export interface TaskQueueConfig {
  maxConcurrentTasks?: number;
  taskTimeoutMs?: number;
  retryDelayMs?: number;
  maxRetries?: number;
  priorityEnabled?: boolean;
  persistenceEnabled?: boolean;
  deadLetterQueueEnabled?: boolean;
  processingIntervalMs?: number;
  enableLogging?: boolean;
}

export interface TaskQueueStats {
  totalTasks: number;
  pendingTasks: number;
  queuedTasks: number;
  assignedTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  failedTasks: number;
  cancelledTasks: number;
  timeoutTasks: number;
  retryTasks: number;
  averageWaitTime: number;
  averageProcessingTime: number;
  throughput: number;
  errorRate: number;
  tasksByPriority: Map<TaskPriority, number>;
  tasksByType: Map<string, number>;
}

export interface TaskFilter {
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: string;
  agentId?: string;
  capabilities?: AgentCapability[];
  tags?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
}

/**
 * Task queue for managing and processing agent tasks
 */
export class TaskQueue extends EventEmitter {
  private tasks: Map<string, Task> = new Map();
  private pendingQueue: Task[] = [];
  private processingQueue: Task[] = [];
  private deadLetterQueue: Task[] = [];
  private config: Required<TaskQueueConfig>;
  private processor?: NodeJS.Timer;
  private stats: TaskQueueStats;
  private isRunning = false;

  constructor(config: TaskQueueConfig = {}) {
    super();
    
    this.config = {
      maxConcurrentTasks: config.maxConcurrentTasks ?? 10,
      taskTimeoutMs: config.taskTimeoutMs ?? 300000, // 5 minutes
      retryDelayMs: config.retryDelayMs ?? 5000, // 5 seconds
      maxRetries: config.maxRetries ?? 3,
      priorityEnabled: config.priorityEnabled ?? true,
      persistenceEnabled: config.persistenceEnabled ?? false,
      deadLetterQueueEnabled: config.deadLetterQueueEnabled ?? true,
      processingIntervalMs: config.processingIntervalMs ?? 1000, // 1 second
      enableLogging: config.enableLogging ?? false
    };

    this.stats = {
      totalTasks: 0,
      pendingTasks: 0,
      queuedTasks: 0,
      assignedTasks: 0,
      inProgressTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      cancelledTasks: 0,
      timeoutTasks: 0,
      retryTasks: 0,
      averageWaitTime: 0,
      averageProcessingTime: 0,
      throughput: 0,
      errorRate: 0,
      tasksByPriority: new Map(),
      tasksByType: new Map()
    };
  }

  /**
   * Start the task queue processor
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.processor = setInterval(() => {
      this.processQueue();
    }, this.config.processingIntervalMs);

    if (this.config.enableLogging) {
      console.log('TaskQueue started');
    }

    this.emit('queue.started');
  }

  /**
   * Stop the task queue processor
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.processor) {
      clearInterval(this.processor);
      this.processor = undefined;
    }

    if (this.config.enableLogging) {
      console.log('TaskQueue stopped');
    }

    this.emit('queue.stopped');
  }

  /**
   * Add a task to the queue
   */
  async addTask(
    type: string,
    payload: any,
    options: {
      priority?: TaskPriority;
      requiredCapabilities?: AgentCapability[];
      metadata?: Partial<TaskMetadata>;
      maxRetries?: number;
      timeoutMs?: number;
      dependencies?: string[];
      tags?: string[];
    } = {}
  ): Promise<string> {
    const task: Task = {
      id: this.generateTaskId(),
      type,
      priority: options.priority ?? TaskPriority.MEDIUM,
      status: TaskStatus.PENDING,
      requiredCapabilities: options.requiredCapabilities ?? [],
      payload,
      metadata: {
        createdBy: options.metadata?.createdBy,
        description: options.metadata?.description,
        estimatedDuration: options.metadata?.estimatedDuration,
        context: options.metadata?.context,
        ...options.metadata
      },
      createdAt: new Date(),
      retryCount: 0,
      maxRetries: options.maxRetries ?? this.config.maxRetries,
      dependencies: options.dependencies ?? [],
      tags: options.tags ?? []
    };

    // Set timeout if specified
    if (options.timeoutMs) {
      task.timeoutAt = new Date(Date.now() + options.timeoutMs);
    } else if (this.config.taskTimeoutMs > 0) {
      task.timeoutAt = new Date(Date.now() + this.config.taskTimeoutMs);
    }

    this.tasks.set(task.id, task);
    this.stats.totalTasks++;

    // Check dependencies
    if (this.areDependenciesMet(task)) {
      this.queueTask(task);
    } else {
      this.updateTaskStatus(task, TaskStatus.PENDING);
    }

    if (this.config.enableLogging) {
      console.log(`Task ${task.id} added to queue with priority ${task.priority}`);
    }

    this.emit('task.added', { task });
    return task.id;
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get all tasks
   */
  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Find tasks by filter
   */
  findTasks(filter: TaskFilter): Task[] {
    const tasks = Array.from(this.tasks.values());
    
    return tasks.filter(task => {
      if (filter.status && task.status !== filter.status) {
        return false;
      }
      
      if (filter.priority && task.priority !== filter.priority) {
        return false;
      }
      
      if (filter.type && task.type !== filter.type) {
        return false;
      }
      
      if (filter.agentId && task.agentId !== filter.agentId) {
        return false;
      }
      
      if (filter.capabilities) {
        const hasAllCapabilities = filter.capabilities.every(cap =>
          task.requiredCapabilities.includes(cap)
        );
        if (!hasAllCapabilities) {
          return false;
        }
      }
      
      if (filter.tags) {
        const hasAllTags = filter.tags.every(tag =>
          task.tags.includes(tag)
        );
        if (!hasAllTags) {
          return false;
        }
      }
      
      if (filter.createdAfter && task.createdAt < filter.createdAfter) {
        return false;
      }
      
      if (filter.createdBefore && task.createdAt > filter.createdBefore) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Get next task for processing
   */
  getNextTask(agentCapabilities: AgentCapability[] = []): Task | undefined {
    // Filter tasks that can be processed by agent
    const availableTasks = this.pendingQueue.filter(task => {
      // Check if agent has required capabilities
      if (task.requiredCapabilities.length > 0 && agentCapabilities.length > 0) {
        const hasAllCapabilities = task.requiredCapabilities.every(cap =>
          agentCapabilities.includes(cap)
        );
        if (!hasAllCapabilities) {
          return false;
        }
      }
      
      // Check if dependencies are met
      return this.areDependenciesMet(task);
    });

    if (availableTasks.length === 0) {
      return undefined;
    }

    // Sort by priority if enabled
    if (this.config.priorityEnabled) {
      availableTasks.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority; // Higher priority first
        }
        return a.createdAt.getTime() - b.createdAt.getTime(); // FIFO for same priority
      });
    } else {
      // FIFO
      availableTasks.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    }

    return availableTasks[0];
  }

  /**
   * Assign task to agent
   */
  async assignTask(taskId: string, agentId: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }

    if (task.status !== TaskStatus.QUEUED) {
      return false;
    }

    // Remove from pending queue
    this.pendingQueue = this.pendingQueue.filter(t => t.id !== taskId);
    
    // Add to processing queue
    this.processingQueue.push(task);
    
    // Update task
    task.agentId = agentId;
    task.startedAt = new Date();
    this.updateTaskStatus(task, TaskStatus.ASSIGNED);

    if (this.config.enableLogging) {
      console.log(`Task ${taskId} assigned to agent ${agentId}`);
    }

    this.emit('task.assigned', { task, agentId });
    return true;
  }

  /**
   * Start task processing
   */
  async startTask(taskId: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }

    if (task.status !== TaskStatus.ASSIGNED) {
      return false;
    }

    this.updateTaskStatus(task, TaskStatus.IN_PROGRESS);

    if (this.config.enableLogging) {
      console.log(`Task ${taskId} started by agent ${task.agentId}`);
    }

    this.emit('task.started', { task });
    return true;
  }

  /**
   * Complete task
   */
  async completeTask(taskId: string, result?: any, metadata?: Partial<TaskMetadata>): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }

    if (task.status !== TaskStatus.IN_PROGRESS) {
      return false;
    }

    // Remove from processing queue
    this.processingQueue = this.processingQueue.filter(t => t.id !== taskId);
    
    // Update task
    task.completedAt = new Date();
    if (task.startedAt) {
      task.metadata.actualDuration = task.completedAt.getTime() - task.startedAt.getTime();
    }
    
    if (metadata) {
      task.metadata = { ...task.metadata, ...metadata };
    }

    this.updateTaskStatus(task, TaskStatus.COMPLETED);

    // Check for dependent tasks
    this.checkDependentTasks(taskId);

    if (this.config.enableLogging) {
      console.log(`Task ${taskId} completed by agent ${task.agentId}`);
    }

    const taskResult: TaskResult = {
      taskId,
      status: TaskStatus.COMPLETED,
      result,
      metadata: task.metadata,
      completedAt: task.completedAt,
      duration: task.metadata.actualDuration || 0
    };

    this.emit('task.completed', { task, result: taskResult });
    return true;
  }

  /**
   * Fail task
   */
  async failTask(taskId: string, error: Error, metadata?: Partial<TaskMetadata>): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }

    if (task.status !== TaskStatus.IN_PROGRESS) {
      return false;
    }

    // Remove from processing queue
    this.processingQueue = this.processingQueue.filter(t => t.id !== taskId);
    
    // Update task
    task.failedAt = new Date();
    task.metadata.errorMessage = error.message;
    
    if (metadata) {
      task.metadata = { ...task.metadata, ...metadata };
    }

    // Check if we should retry
    if (task.retryCount < task.maxRetries) {
      task.retryCount++;
      this.updateTaskStatus(task, TaskStatus.RETRY);
      
      // Schedule retry
      setTimeout(() => {
        this.retryTask(taskId);
      }, this.config.retryDelayMs);

      if (this.config.enableLogging) {
        console.log(`Task ${taskId} scheduled for retry (${task.retryCount}/${task.maxRetries})`);
      }
    } else {
      // Max retries reached
      this.updateTaskStatus(task, TaskStatus.FAILED);
      
      // Move to dead letter queue if enabled
      if (this.config.deadLetterQueueEnabled) {
        this.deadLetterQueue.push(task);
      }

      if (this.config.enableLogging) {
        console.log(`Task ${taskId} failed after ${task.retryCount} retries`);
      }
    }

    const taskResult: TaskResult = {
      taskId,
      status: task.status,
      error,
      metadata: task.metadata,
      completedAt: task.failedAt,
      duration: task.startedAt ? task.failedAt.getTime() - task.startedAt.getTime() : 0
    };

    this.emit('task.failed', { task, error, result: taskResult });
    return true;
  }

  /**
   * Cancel task
   */
  async cancelTask(taskId: string, reason?: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }

    if ([TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED].includes(task.status)) {
      return false;
    }

    // Remove from queues
    this.pendingQueue = this.pendingQueue.filter(t => t.id !== taskId);
    this.processingQueue = this.processingQueue.filter(t => t.id !== taskId);
    
    // Update task
    if (reason) {
      task.metadata.errorMessage = reason;
    }

    this.updateTaskStatus(task, TaskStatus.CANCELLED);

    if (this.config.enableLogging) {
      console.log(`Task ${taskId} cancelled: ${reason || 'No reason provided'}`);
    }

    this.emit('task.cancelled', { task, reason });
    return true;
  }

  /**
   * Update task progress
   */
  async updateTaskProgress(taskId: string, progress: number, checkpoint?: any): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }

    if (task.status !== TaskStatus.IN_PROGRESS) {
      return false;
    }

    task.metadata.progress = Math.max(0, Math.min(100, progress));
    
    if (checkpoint) {
      task.metadata.checkpoint = checkpoint;
    }

    this.emit('task.progress', { task, progress, checkpoint });
    return true;
  }

  /**
   * Get queue statistics
   */
  getStats(): TaskQueueStats {
    this.updateStats();
    return {
      ...this.stats,
      tasksByPriority: new Map(this.stats.tasksByPriority),
      tasksByType: new Map(this.stats.tasksByType)
    };
  }

  /**
   * Get dead letter queue tasks
   */
  getDeadLetterQueue(): Task[] {
    return [...this.deadLetterQueue];
  }

  /**
   * Requeue task from dead letter queue
   */
  async requeueFromDeadLetter(taskId: string): Promise<boolean> {
    const taskIndex = this.deadLetterQueue.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
      return false;
    }

    const task = this.deadLetterQueue[taskIndex];
    this.deadLetterQueue.splice(taskIndex, 1);

    // Reset task for retry
    task.retryCount = 0;
    task.failedAt = undefined;
    task.startedAt = undefined;
    task.agentId = undefined;
    task.metadata.errorMessage = undefined;

    this.queueTask(task);

    this.emit('task.requeued', { task });
    return true;
  }

  /**
   * Clear completed tasks
   */
  clearCompletedTasks(): number {
    const completedTasks = Array.from(this.tasks.values())
      .filter(task => task.status === TaskStatus.COMPLETED);
    
    completedTasks.forEach(task => {
      this.tasks.delete(task.id);
    });

    this.updateStats();
    return completedTasks.length;
  }

  /**
   * Private helper methods
   */
  private generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private queueTask(task: Task): void {
    this.pendingQueue.push(task);
    this.updateTaskStatus(task, TaskStatus.QUEUED);
  }

  private updateTaskStatus(task: Task, status: TaskStatus): void {
    const oldStatus = task.status;
    task.status = status;
    this.updateStats();
    
    this.emit('task.status.changed', { task, oldStatus, newStatus: status });
  }

  private areDependenciesMet(task: Task): boolean {
    if (task.dependencies.length === 0) {
      return true;
    }

    return task.dependencies.every(depId => {
      const depTask = this.tasks.get(depId);
      return depTask && depTask.status === TaskStatus.COMPLETED;
    });
  }

  private checkDependentTasks(completedTaskId: string): void {
    const pendingTasks = Array.from(this.tasks.values())
      .filter(task => 
        task.status === TaskStatus.PENDING &&
        task.dependencies.includes(completedTaskId)
      );

    pendingTasks.forEach(task => {
      if (this.areDependenciesMet(task)) {
        this.queueTask(task);
      }
    });
  }

  private retryTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== TaskStatus.RETRY) {
      return;
    }

    // Reset task for retry
    task.startedAt = undefined;
    task.failedAt = undefined;
    task.agentId = undefined;
    task.metadata.errorMessage = undefined;

    this.queueTask(task);
  }

  private processQueue(): void {
    if (!this.isRunning) {
      return;
    }

    // Check for timed out tasks
    this.checkTimeouts();

    // Check for failed dependencies
    this.checkDependencyFailures();

    // Update statistics
    this.updateStats();
  }

  private checkTimeouts(): void {
    const now = new Date();
    const timedOutTasks = this.processingQueue.filter(task => 
      task.timeoutAt && task.timeoutAt < now
    );

    timedOutTasks.forEach(task => {
      this.processingQueue = this.processingQueue.filter(t => t.id !== task.id);
      this.updateTaskStatus(task, TaskStatus.TIMEOUT);
      
      if (this.config.enableLogging) {
        console.log(`Task ${task.id} timed out`);
      }

      this.emit('task.timeout', { task });
    });
  }

  private checkDependencyFailures(): void {
    const pendingTasks = Array.from(this.tasks.values())
      .filter(task => task.status === TaskStatus.PENDING);

    pendingTasks.forEach(task => {
      const failedDependencies = task.dependencies.filter(depId => {
        const depTask = this.tasks.get(depId);
        return depTask && [TaskStatus.FAILED, TaskStatus.CANCELLED, TaskStatus.TIMEOUT].includes(depTask.status);
      });

      if (failedDependencies.length > 0) {
        this.updateTaskStatus(task, TaskStatus.FAILED);
        task.metadata.errorMessage = `Dependencies failed: ${failedDependencies.join(', ')}`;
        
        if (this.config.enableLogging) {
          console.log(`Task ${task.id} failed due to dependency failures`);
        }

        this.emit('task.dependency.failed', { task, failedDependencies });
      }
    });
  }

  private updateStats(): void {
    const tasks = Array.from(this.tasks.values());
    
    // Reset counters
    this.stats.pendingTasks = 0;
    this.stats.queuedTasks = 0;
    this.stats.assignedTasks = 0;
    this.stats.inProgressTasks = 0;
    this.stats.completedTasks = 0;
    this.stats.failedTasks = 0;
    this.stats.cancelledTasks = 0;
    this.stats.timeoutTasks = 0;
    this.stats.retryTasks = 0;
    this.stats.tasksByPriority.clear();
    this.stats.tasksByType.clear();

    // Count tasks by status
    tasks.forEach(task => {
      switch (task.status) {
        case TaskStatus.PENDING:
          this.stats.pendingTasks++;
          break;
        case TaskStatus.QUEUED:
          this.stats.queuedTasks++;
          break;
        case TaskStatus.ASSIGNED:
          this.stats.assignedTasks++;
          break;
        case TaskStatus.IN_PROGRESS:
          this.stats.inProgressTasks++;
          break;
        case TaskStatus.COMPLETED:
          this.stats.completedTasks++;
          break;
        case TaskStatus.FAILED:
          this.stats.failedTasks++;
          break;
        case TaskStatus.CANCELLED:
          this.stats.cancelledTasks++;
          break;
        case TaskStatus.TIMEOUT:
          this.stats.timeoutTasks++;
          break;
        case TaskStatus.RETRY:
          this.stats.retryTasks++;
          break;
      }

      // Count by priority
      const priorityCount = this.stats.tasksByPriority.get(task.priority) || 0;
      this.stats.tasksByPriority.set(task.priority, priorityCount + 1);

      // Count by type
      const typeCount = this.stats.tasksByType.get(task.type) || 0;
      this.stats.tasksByType.set(task.type, typeCount + 1);
    });

    // Calculate averages
    const completedTasks = tasks.filter(task => task.status === TaskStatus.COMPLETED);
    
    if (completedTasks.length > 0) {
      // Average wait time (from created to started)
      const totalWaitTime = completedTasks.reduce((sum, task) => {
        if (task.startedAt) {
          return sum + (task.startedAt.getTime() - task.createdAt.getTime());
        }
        return sum;
      }, 0);
      this.stats.averageWaitTime = totalWaitTime / completedTasks.length;

      // Average processing time (from started to completed)
      const totalProcessingTime = completedTasks.reduce((sum, task) => {
        return sum + (task.metadata.actualDuration || 0);
      }, 0);
      this.stats.averageProcessingTime = totalProcessingTime / completedTasks.length;
    }

    // Calculate throughput and error rate
    const totalProcessedTasks = this.stats.completedTasks + this.stats.failedTasks;
    this.stats.throughput = totalProcessedTasks;
    this.stats.errorRate = totalProcessedTasks > 0 ? this.stats.failedTasks / totalProcessedTasks : 0;
  }

  /**
   * Reset queue (for testing)
   */
  reset(): void {
    this.tasks.clear();
    this.pendingQueue = [];
    this.processingQueue = [];
    this.deadLetterQueue = [];
    
    this.stats = {
      totalTasks: 0,
      pendingTasks: 0,
      queuedTasks: 0,
      assignedTasks: 0,
      inProgressTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      cancelledTasks: 0,
      timeoutTasks: 0,
      retryTasks: 0,
      averageWaitTime: 0,
      averageProcessingTime: 0,
      throughput: 0,
      errorRate: 0,
      tasksByPriority: new Map(),
      tasksByType: new Map()
    };

    this.emit('queue.reset');
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.stop();
    this.reset();
    this.removeAllListeners();
  }
}