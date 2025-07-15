/**
 * Base implementation of an AI Agent
 */

import { EventEmitter } from 'events';
import type {
  AgentId,
  TaskId,
  MessageId,
  AgentConfig,
  AgentMetrics,
  Task,
  TaskResult,
  Message
} from '../types/agent.js';
import {
  AgentStatus,
  TaskStatus,
  Priority
} from '../types/agent.js';
import type {
  IAgent,
  IAgentLifecycle,
  ITaskExecutor,
  IAgentCommunication
} from '../interfaces/IAgent.js';

/**
 * Base Agent class providing common functionality
 */
export abstract class BaseAgent extends EventEmitter implements IAgent, IAgentLifecycle, ITaskExecutor, IAgentCommunication {
  protected _status: AgentStatus = AgentStatus.OFFLINE;
  protected _currentTasks: Map<TaskId, Task> = new Map();
  protected _metrics: AgentMetrics;
  protected _messageHandlers: Map<string, (message: Message) => Promise<void>> = new Map();
  protected _startTime: Date = new Date();
  protected _lastHeartbeat: Date = new Date();

  constructor(public readonly config: AgentConfig) {
    super();
    this._metrics = this.initializeMetrics();
  }

  get id(): AgentId {
    return this.config.id;
  }

  getStatus(): AgentStatus {
    return this._status;
  }

  getMetrics(): AgentMetrics {
    return {
      ...this._metrics,
      uptime: Date.now() - this._startTime.getTime(),
      lastActiveAt: this._lastHeartbeat
    };
  }

  async start(): Promise<void> {
    try {
      this._status = AgentStatus.STARTING;
      this.emit('agent.starting', { agentId: this.id });
      
      await this.onStart();
      
      this._status = AgentStatus.IDLE;
      this._startTime = new Date();
      this._lastHeartbeat = new Date();
      
      this.emit('agent.started', { agentId: this.id });
      
      // Start heartbeat
      this.startHeartbeat();
    } catch (error) {
      this._status = AgentStatus.ERROR;
      this.emit('agent.error', { agentId: this.id, error });
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      this._status = AgentStatus.STOPPING;
      this.emit('agent.stopping', { agentId: this.id });
      
      // Cancel all current tasks
      for (const [taskId] of this._currentTasks) {
        await this.cancelTask(taskId);
      }
      
      await this.onStop();
      
      this._status = AgentStatus.OFFLINE;
      this.emit('agent.stopped', { agentId: this.id });
    } catch (error) {
      this._status = AgentStatus.ERROR;
      this.emit('agent.error', { agentId: this.id, error });
      throw error;
    }
  }

  async assignTask(task: Task): Promise<boolean> {
    if (!this.canHandle(task)) {
      return false;
    }

    if (this._currentTasks.size >= this.config.maxConcurrentTasks) {
      return false;
    }

    this._currentTasks.set(task.id, task);
    this._status = AgentStatus.BUSY;
    
    // Execute task asynchronously
    this.executeTaskAsync(task);
    
    return true;
  }

  async cancelTask(taskId: TaskId): Promise<boolean> {
    const task = this._currentTasks.get(taskId);
    if (!task) {
      return false;
    }

    try {
      await this.onCancelTask(taskId);
      this._currentTasks.delete(taskId);
      
      if (this._currentTasks.size === 0) {
        this._status = AgentStatus.IDLE;
      }
      
      return true;
    } catch (error) {
      this.emit('agent.error', { agentId: this.id, error });
      return false;
    }
  }

  getCurrentTasks(): Task[] {
    return Array.from(this._currentTasks.values());
  }

  async sendMessage(message: Omit<Message, 'id' | 'from' | 'timestamp'>): Promise<void> {
    const fullMessage: Message = {
      ...message,
      id: this.generateMessageId(),
      from: this.id,
      timestamp: new Date()
    };

    await this.onSendMessage(fullMessage);
  }

  async handleMessage(message: Message): Promise<void> {
    this._lastHeartbeat = new Date();
    
    const handler = this._messageHandlers.get(message.type);
    if (handler) {
      try {
        await handler(message);
      } catch (error) {
        this.emit('agent.error', { agentId: this.id, error });
      }
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.onHealthCheck();
      this._lastHeartbeat = new Date();
      return true;
    } catch (error) {
      this.emit('agent.error', { agentId: this.id, error });
      return false;
    }
  }

  // IAgentLifecycle implementation
  async initialize(config: AgentConfig): Promise<void> {
    Object.assign(this.config, config);
    await this.onInitialize(config);
  }

  async cleanup(): Promise<void> {
    await this.onCleanup();
  }

  async restart(): Promise<void> {
    await this.stop();
    await this.start();
  }

  async updateConfig(config: Partial<AgentConfig>): Promise<void> {
    Object.assign(this.config, config);
    await this.onConfigUpdate(config);
  }

  // ITaskExecutor implementation
  abstract executeTask(task: Task): Promise<TaskResult>;
  abstract canHandle(task: Task): boolean;

  getExecutionContext(taskId: TaskId): any {
    const task = this._currentTasks.get(taskId);
    return task ? { task, agent: this } : null;
  }

  async pauseTask(taskId: TaskId): Promise<boolean> {
    return await this.onPauseTask(taskId);
  }

  async resumeTask(taskId: TaskId): Promise<boolean> {
    return await this.onResumeTask(taskId);
  }

  // IAgentCommunication implementation
  subscribe(messageType: string, handler: (message: Message) => Promise<void>): void {
    this._messageHandlers.set(messageType, handler);
  }

  unsubscribe(messageType: string): void {
    this._messageHandlers.delete(messageType);
  }

  async request(to: AgentId, type: string, payload: any, timeoutMs: number = 5000): Promise<any> {
    const correlationId = this.generateMessageId();
    
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

  async respond(to: AgentId, correlationId: string, payload: any): Promise<void> {
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
  protected abstract onCancelTask(taskId: TaskId): Promise<void>;

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

  protected async onPauseTask(_taskId: TaskId): Promise<boolean> {
    // Default implementation - override if needed
    return false;
  }

  protected async onResumeTask(_taskId: TaskId): Promise<boolean> {
    // Default implementation - override if needed
    return false;
  }

  // Private methods
  private async executeTaskAsync(task: Task): Promise<void> {
    const startTime = new Date();
    
    try {
      task.status = TaskStatus.IN_PROGRESS;
      this.emit('task.started', { taskId: task.id, agentId: this.id });
      
      const result = await this.executeTask(task);
      
      this._currentTasks.delete(task.id);
      this._metrics.tasksCompleted++;
      this.updateAverageTaskDuration(Date.now() - startTime.getTime());
      
      if (this._currentTasks.size === 0) {
        this._status = AgentStatus.IDLE;
      }
      
      this.emit('task.completed', { taskId: task.id, agentId: this.id, result });
    } catch (error) {
      this._currentTasks.delete(task.id);
      this._metrics.tasksFailed++;
      
      if (this._currentTasks.size === 0) {
        this._status = AgentStatus.IDLE;
      }
      
      this.emit('task.failed', { taskId: task.id, agentId: this.id, error });
    }
  }

  private initializeMetrics(): AgentMetrics {
    return {
      id: this.id,
      tasksCompleted: 0,
      tasksInProgress: 0,
      tasksFailed: 0,
      averageTaskDurationMs: 0,
      lastActiveAt: new Date(),
      uptime: 0
    };
  }

  private updateAverageTaskDuration(durationMs: number): void {
    const totalTasks = this._metrics.tasksCompleted;
    const currentAverage = this._metrics.averageTaskDurationMs;
    this._metrics.averageTaskDurationMs = ((currentAverage * (totalTasks - 1)) + durationMs) / totalTasks;
  }

  private generateMessageId(): MessageId {
    return `msg_${this.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startHeartbeat(): void {
    const heartbeatInterval = setInterval(() => {
      if (this._status === AgentStatus.OFFLINE) {
        clearInterval(heartbeatInterval);
        return;
      }
      
      this._lastHeartbeat = new Date();
      this.emit('agent.heartbeat', { agentId: this.id, timestamp: this._lastHeartbeat });
    }, 30000); // 30 second heartbeat
  }
}