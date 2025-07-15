import { EventEmitter } from 'eventemitter3';
import { v4 as uuidv4 } from 'uuid';
import type {
  IAgent,
  IAgentLifecycle,
  ITaskExecutor,
  IAgentCommunication,
  AgentTask,
  AgentConfig,
  AgentMetrics,
  Message,
  AgentStatus,
  TaskStatus,
  Priority,
  AgentEvent,
  TaskEvent,
  MessageEvent,
  TaskExecutionError,
  AgentCommunicationError
} from '../types';

/**
 * Base Agent class providing common functionality for all AI agents
 */
export abstract class BaseAgent extends EventEmitter implements IAgent, IAgentLifecycle, ITaskExecutor, IAgentCommunication {
  protected _status: AgentStatus = AgentStatus.OFFLINE;
  protected _currentTasks: Map<string, AgentTask> = new Map();
  protected _metrics: AgentMetrics;
  protected _messageHandlers: Map<string, (message: Message) => Promise<void>> = new Map();
  protected _startTime: Date = new Date();
  protected _lastHeartbeat: Date = new Date();
  protected _heartbeatInterval?: NodeJS.Timer;
  protected _taskTimeouts: Map<string, NodeJS.Timeout> = new Map();
  protected _initialized: boolean = false;

  constructor(public readonly config: AgentConfig) {
    super();
    this._metrics = this.initializeMetrics();
    this.setupEventHandlers();
  }

  // IAgent implementation
  get id(): string {
    return this.config.id;
  }

  get status(): AgentStatus {
    return this._status;
  }

  get metrics(): AgentMetrics {
    return {
      ...this._metrics,
      uptime: Date.now() - this._startTime.getTime(),
      lastActiveAt: this._lastHeartbeat
    };
  }

  getStatus(): AgentStatus {
    return this._status;
  }

  getMetrics(): AgentMetrics {
    return this.metrics;
  }

  async start(): Promise<void> {
    if (this._status !== AgentStatus.OFFLINE) {
      throw new Error(`Agent ${this.id} is already running`);
    }

    try {
      this._status = AgentStatus.STARTING;
      this.emit('agent.starting', this.createAgentEvent('starting', {}));
      
      await this.onStart();
      
      this._status = AgentStatus.IDLE;
      this._startTime = new Date();
      this._lastHeartbeat = new Date();
      
      this.emit('agent.started', this.createAgentEvent('started', {}));
      
      // Start heartbeat
      this.startHeartbeat();
      
      // Start task cleanup
      this.startTaskCleanup();
      
    } catch (error) {
      this._status = AgentStatus.ERROR;
      const agentEvent = this.createAgentEvent('error', { error });
      this.emit('agent.error', agentEvent);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this._status === AgentStatus.OFFLINE) {
      return;
    }

    try {
      this._status = AgentStatus.STOPPING;
      this.emit('agent.stopping', this.createAgentEvent('stopping', {}));
      
      // Cancel all current tasks
      const cancelPromises = Array.from(this._currentTasks.keys()).map(taskId => 
        this.cancelTask(taskId)
      );
      await Promise.all(cancelPromises);
      
      // Stop heartbeat
      if (this._heartbeatInterval) {
        clearInterval(this._heartbeatInterval);
      }
      
      // Clear task timeouts
      this._taskTimeouts.forEach(timeout => clearTimeout(timeout));
      this._taskTimeouts.clear();
      
      await this.onStop();
      
      this._status = AgentStatus.OFFLINE;
      this.emit('agent.stopped', this.createAgentEvent('stopped', {}));
      
    } catch (error) {
      this._status = AgentStatus.ERROR;
      const agentEvent = this.createAgentEvent('error', { error });
      this.emit('agent.error', agentEvent);
      throw error;
    }
  }

  async assignTask(task: AgentTask): Promise<boolean> {
    if (!this.canHandle(task)) {
      return false;
    }

    if (this._currentTasks.size >= this.config.maxConcurrentTasks) {
      return false;
    }

    if (this._status !== AgentStatus.IDLE && this._status !== AgentStatus.BUSY) {
      return false;
    }

    this._currentTasks.set(task.id, task);
    this._status = AgentStatus.BUSY;
    this._metrics.tasksInProgress++;
    
    // Set task timeout
    const timeout = setTimeout(() => {
      this.timeoutTask(task.id);
    }, task.timeoutMs);
    this._taskTimeouts.set(task.id, timeout);
    
    // Execute task asynchronously
    this.executeTaskAsync(task).catch(error => {
      this.emit('agent.error', this.createAgentEvent('error', { error, taskId: task.id }));
    });
    
    return true;
  }

  async cancelTask(taskId: string): Promise<boolean> {
    const task = this._currentTasks.get(taskId);
    if (!task) {
      return false;
    }

    try {
      // Clear timeout
      const timeout = this._taskTimeouts.get(taskId);
      if (timeout) {
        clearTimeout(timeout);
        this._taskTimeouts.delete(taskId);
      }
      
      await this.onCancelTask(taskId);
      
      this._currentTasks.delete(taskId);
      this._metrics.tasksInProgress--;
      
      if (this._currentTasks.size === 0) {
        this._status = AgentStatus.IDLE;
      }
      
      const taskEvent = this.createTaskEvent('cancelled', taskId, {});
      this.emit('task.cancelled', taskEvent);
      
      return true;
    } catch (error) {
      const agentEvent = this.createAgentEvent('error', { error, taskId });
      this.emit('agent.error', agentEvent);
      return false;
    }
  }

  getCurrentTasks(): AgentTask[] {
    return Array.from(this._currentTasks.values());
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.onHealthCheck();
      this._lastHeartbeat = new Date();
      return true;
    } catch (error) {
      const agentEvent = this.createAgentEvent('error', { error });
      this.emit('agent.error', agentEvent);
      return false;
    }
  }

  // IAgentLifecycle implementation
  async initialize(config: AgentConfig): Promise<void> {
    if (this._initialized) {
      return;
    }

    Object.assign(this.config, config);
    await this.onInitialize(config);
    this._initialized = true;
  }

  async cleanup(): Promise<void> {
    await this.stop();
    await this.onCleanup();
    this.removeAllListeners();
  }

  async restart(): Promise<void> {
    await this.stop();
    await this.start();
  }

  async updateConfig(config: Partial<AgentConfig>): Promise<void> {
    const oldConfig = { ...this.config };
    Object.assign(this.config, config);
    
    try {
      await this.onConfigUpdate(config);
    } catch (error) {
      // Rollback on error
      Object.assign(this.config, oldConfig);
      throw error;
    }
  }

  // ITaskExecutor implementation
  abstract execute(task: AgentTask): Promise<any>;
  abstract validate(task: AgentTask): Promise<boolean>;

  canHandle(task: AgentTask): boolean {
    return this.config.capabilities.some(cap => 
      task.type.includes(cap) || cap === task.type
    );
  }

  getExecutionContext(taskId: string): any {
    const task = this._currentTasks.get(taskId);
    return task ? { task, agent: this } : null;
  }

  async pauseTask(taskId: string): Promise<boolean> {
    return await this.onPauseTask(taskId);
  }

  async resumeTask(taskId: string): Promise<boolean> {
    return await this.onResumeTask(taskId);
  }

  // IAgentCommunication implementation
  async sendMessage(message: Omit<Message, 'id' | 'from' | 'timestamp'>): Promise<void> {
    const fullMessage: Message = {
      ...message,
      id: uuidv4(),
      from: this.id,
      timestamp: new Date()
    };

    await this.onSendMessage(fullMessage);
    
    const messageEvent = this.createMessageEvent('sent', fullMessage);
    this.emit('message.sent', messageEvent);
  }

  async handleMessage(message: Message): Promise<void> {
    this._lastHeartbeat = new Date();
    
    const messageEvent = this.createMessageEvent('received', message);
    this.emit('message.received', messageEvent);
    
    const handler = this._messageHandlers.get(message.type);
    if (handler) {
      try {
        await handler(message);
      } catch (error) {
        const agentEvent = this.createAgentEvent('error', { error, messageId: message.id });
        this.emit('agent.error', agentEvent);
      }
    }
  }

  subscribe(messageType: string, handler: (message: Message) => Promise<void>): void {
    this._messageHandlers.set(messageType, handler);
  }

  unsubscribe(messageType: string): void {
    this._messageHandlers.delete(messageType);
  }

  async request(to: string, type: string, payload: any, timeoutMs: number = 5000): Promise<any> {
    const correlationId = uuidv4();
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.unsubscribe(`response.${correlationId}`);
        reject(new Error('Request timeout'));
      }, timeoutMs);

      this.subscribe(`response.${correlationId}`, async (message) => {
        clearTimeout(timeout);
        this.unsubscribe(`response.${correlationId}`);
        resolve(message.payload);
      });

      this.sendMessage({
        to,
        type,
        payload,
        priority: Priority.NORMAL,
        correlationId
      });
    });
  }

  async respond(to: string, correlationId: string, payload: any): Promise<void> {
    await this.sendMessage({
      to,
      type: `response.${correlationId}`,
      payload,
      priority: Priority.NORMAL,
      correlationId
    });
  }

  async broadcast(type: string, payload: any): Promise<void> {
    await this.sendMessage({
      to: 'broadcast',
      type,
      payload,
      priority: Priority.NORMAL
    });
  }

  // Protected methods for subclass implementation
  protected abstract onStart(): Promise<void>;
  protected abstract onStop(): Promise<void>;
  protected abstract onSendMessage(message: Message): Promise<void>;
  protected abstract onCancelTask(taskId: string): Promise<void>;

  protected async onInitialize(_config: AgentConfig): Promise<void> {
    // Default implementation - override if needed
  }

  protected async onCleanup(): Promise<void> {
    // Default implementation - override if needed
  }

  protected async onConfigUpdate(_config: Partial<AgentConfig>): Promise<void> {
    // Default implementation - override if needed
  }

  protected async onHealthCheck(): Promise<void> {
    // Default implementation - override if needed
  }

  protected async onPauseTask(_taskId: string): Promise<boolean> {
    // Default implementation - override if needed
    return false;
  }

  protected async onResumeTask(_taskId: string): Promise<boolean> {
    // Default implementation - override if needed
    return false;
  }

  // Utility methods
  protected async emit(event: string, data: any): Promise<void> {
    await this.onEmit(event, data);
    super.emit(event, data);
  }

  protected async onEmit(event: string, data: any): Promise<void> {
    // Default implementation - override for custom event handling
  }

  // Private methods
  private async executeTaskAsync(task: AgentTask): Promise<void> {
    const startTime = Date.now();
    
    try {
      task.status = TaskStatus.IN_PROGRESS;
      task.updatedAt = new Date();
      
      const taskEvent = this.createTaskEvent('started', task.id, {});
      this.emit('task.started', taskEvent);
      
      const result = await this.execute(task);
      
      // Clear timeout
      const timeout = this._taskTimeouts.get(task.id);
      if (timeout) {
        clearTimeout(timeout);
        this._taskTimeouts.delete(task.id);
      }
      
      task.status = TaskStatus.COMPLETED;
      task.result = result;
      task.updatedAt = new Date();
      
      this._currentTasks.delete(task.id);
      this._metrics.tasksCompleted++;
      this._metrics.tasksInProgress--;
      
      const duration = Date.now() - startTime;
      this.updateAverageTaskDuration(duration);
      
      if (this._currentTasks.size === 0) {
        this._status = AgentStatus.IDLE;
      }
      
      const completedEvent = this.createTaskEvent('completed', task.id, { result, duration });
      this.emit('task.completed', completedEvent);
      
    } catch (error) {
      // Clear timeout
      const timeout = this._taskTimeouts.get(task.id);
      if (timeout) {
        clearTimeout(timeout);
        this._taskTimeouts.delete(task.id);
      }
      
      task.status = TaskStatus.FAILED;
      task.error = error instanceof Error ? error.message : String(error);
      task.updatedAt = new Date();
      
      this._currentTasks.delete(task.id);
      this._metrics.tasksFailed++;
      this._metrics.tasksInProgress--;
      
      if (this._currentTasks.size === 0) {
        this._status = AgentStatus.IDLE;
      }
      
      const failedEvent = this.createTaskEvent('failed', task.id, { error });
      this.emit('task.failed', failedEvent);
      
      throw new TaskExecutionError(
        `Task ${task.id} failed: ${task.error}`,
        this.id,
        task.id,
        { originalError: error }
      );
    }
  }

  private async timeoutTask(taskId: string): Promise<void> {
    const task = this._currentTasks.get(taskId);
    if (!task) {
      return;
    }

    task.status = TaskStatus.TIMEOUT;
    task.error = 'Task execution timeout';
    task.updatedAt = new Date();

    this._currentTasks.delete(taskId);
    this._metrics.tasksFailed++;
    this._metrics.tasksInProgress--;

    if (this._currentTasks.size === 0) {
      this._status = AgentStatus.IDLE;
    }

    const timeoutEvent = this.createTaskEvent('timeout', taskId, {});
    this.emit('task.timeout', timeoutEvent);
  }

  private initializeMetrics(): AgentMetrics {
    return {
      id: this.id,
      tasksCompleted: 0,
      tasksInProgress: 0,
      tasksFailed: 0,
      averageTaskDurationMs: 0,
      lastActiveAt: new Date(),
      uptime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      errorRate: 0,
      throughput: 0
    };
  }

  private updateAverageTaskDuration(durationMs: number): void {
    const totalTasks = this._metrics.tasksCompleted;
    const currentAverage = this._metrics.averageTaskDurationMs;
    this._metrics.averageTaskDurationMs = 
      ((currentAverage * (totalTasks - 1)) + durationMs) / totalTasks;
  }

  private startHeartbeat(): void {
    this._heartbeatInterval = setInterval(() => {
      if (this._status === AgentStatus.OFFLINE) {
        return;
      }
      
      this._lastHeartbeat = new Date();
      this.updateMetrics();
      
      const heartbeatEvent = this.createAgentEvent('heartbeat', { 
        timestamp: this._lastHeartbeat 
      });
      this.emit('agent.heartbeat', heartbeatEvent);
    }, 30000); // 30 second heartbeat
  }

  private startTaskCleanup(): void {
    setInterval(() => {
      this.cleanupExpiredTasks();
    }, 60000); // Check every minute
  }

  private cleanupExpiredTasks(): void {
    const now = Date.now();
    const expiredTasks = Array.from(this._currentTasks.entries()).filter(
      ([_, task]) => (now - task.createdAt.getTime()) > task.timeoutMs
    );

    expiredTasks.forEach(([taskId, _]) => {
      this.timeoutTask(taskId);
    });
  }

  private updateMetrics(): void {
    const totalTasks = this._metrics.tasksCompleted + this._metrics.tasksFailed;
    this._metrics.errorRate = totalTasks > 0 ? this._metrics.tasksFailed / totalTasks : 0;
    
    const uptimeHours = this._metrics.uptime / (1000 * 60 * 60);
    this._metrics.throughput = uptimeHours > 0 ? this._metrics.tasksCompleted / uptimeHours : 0;
  }

  private setupEventHandlers(): void {
    this.on('task.started', (event: TaskEvent) => {
      this.onTaskStarted(event);
    });

    this.on('task.completed', (event: TaskEvent) => {
      this.onTaskCompleted(event);
    });

    this.on('task.failed', (event: TaskEvent) => {
      this.onTaskFailed(event);
    });
  }

  private onTaskStarted(event: TaskEvent): void {
    // Override in subclasses for custom handling
  }

  private onTaskCompleted(event: TaskEvent): void {
    // Override in subclasses for custom handling
  }

  private onTaskFailed(event: TaskEvent): void {
    // Override in subclasses for custom handling
  }

  private createAgentEvent(type: string, data: any): AgentEvent {
    return {
      type,
      agentId: this.id,
      timestamp: new Date(),
      data
    };
  }

  private createTaskEvent(type: string, taskId: string, data: any): TaskEvent {
    return {
      type,
      agentId: this.id,
      taskId,
      timestamp: new Date(),
      data
    };
  }

  private createMessageEvent(type: string, message: Message): MessageEvent {
    return {
      type,
      agentId: this.id,
      messageId: message.id,
      from: message.from,
      to: message.to,
      timestamp: new Date(),
      data: message
    };
  }
}