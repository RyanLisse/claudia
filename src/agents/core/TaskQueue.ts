/**
 * Task queue implementation for agent orchestration
 */

import { EventEmitter } from 'events';
import type {
  TaskId,
  Task,
  TaskStatus,
  Priority,
  AgentCapability
} from '../types/agent.js';
import type { ITaskQueue } from '../interfaces/IAgent.js';

export interface QueueFilter {
  priority?: Priority;
  status?: TaskStatus;
  capabilities?: AgentCapability[];
  ageMs?: number;
}

/**
 * Priority-based task queue with capability matching
 */
export class TaskQueue extends EventEmitter implements ITaskQueue {
  private tasks: Map<TaskId, Task> = new Map();
  private priorityQueues: Map<Priority, TaskId[]> = new Map();
  private capabilityIndex: Map<AgentCapability, Set<TaskId>> = new Map();
  private statusIndex: Map<TaskStatus, Set<TaskId>> = new Map();
  private maxQueueSize: number;

  constructor(maxQueueSize: number = 1000) {
    super();
    this.maxQueueSize = maxQueueSize;
    this.initializePriorityQueues();
  }

  async enqueue(task: Task): Promise<void> {
    if (this.tasks.size >= this.maxQueueSize) {
      throw new Error('Task queue is full');
    }

    // Store task
    this.tasks.set(task.id, task);
    
    // Add to priority queue
    const priorityQueue = this.priorityQueues.get(task.priority)!;
    priorityQueue.push(task.id);
    
    // Update indexes
    this.updateIndexes(task);
    
    this.emit('task.enqueued', { taskId: task.id, task });
  }

  async dequeue(capabilities: AgentCapability[]): Promise<Task | null> {
    // Find tasks matching required capabilities, ordered by priority
    const matchingTasks = this.findMatchingTasks(capabilities);
    
    if (matchingTasks.length === 0) {
      return null;
    }

    // Get highest priority task
    const taskId = matchingTasks[0];
    const task = this.tasks.get(taskId);
    
    if (!task) {
      return null;
    }

    // Remove from queue
    await this.remove(taskId);
    
    this.emit('task.dequeued', { taskId, task });
    return task;
  }

  async size(): Promise<number> {
    return this.tasks.size;
  }

  async getTasksByStatus(status: TaskStatus): Promise<Task[]> {
    const taskIds = this.statusIndex.get(status) || new Set();
    return Array.from(taskIds).map(id => this.tasks.get(id)!).filter(Boolean);
  }

  async remove(taskId: TaskId): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }

    // Remove from task map
    this.tasks.delete(taskId);
    
    // Remove from priority queue
    const priorityQueue = this.priorityQueues.get(task.priority)!;
    const index = priorityQueue.indexOf(taskId);
    if (index >= 0) {
      priorityQueue.splice(index, 1);
    }
    
    // Remove from indexes
    this.removeFromIndexes(task);
    
    this.emit('task.removed', { taskId, task });
    return true;
  }

  async updateTaskStatus(taskId: TaskId, status: TaskStatus): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      return;
    }

    const oldStatus = task.status;
    task.status = status;
    task.updatedAt = new Date();
    
    // Update status index
    this.updateStatusIndex(taskId, oldStatus, status);
    
    this.emit('task.status.updated', { taskId, oldStatus, newStatus: status });
  }

  async getTask(taskId: TaskId): Promise<Task | null> {
    return this.tasks.get(taskId) || null;
  }

  /**
   * Find tasks matching specific criteria
   */
  findTasks(filter: QueueFilter): Task[] {
    let candidates = new Set(this.tasks.keys());

    // Filter by priority
    if (filter.priority !== undefined) {
      const priorityTasks = this.priorityQueues.get(filter.priority) || [];
      candidates = new Set(priorityTasks.filter(id => candidates.has(id)));
    }

    // Filter by status
    if (filter.status !== undefined) {
      const statusTasks = this.statusIndex.get(filter.status) || new Set();
      candidates = new Set([...candidates].filter(id => statusTasks.has(id)));
    }

    // Filter by capabilities
    if (filter.capabilities && filter.capabilities.length > 0) {
      for (const capability of filter.capabilities) {
        const capabilityTasks = this.capabilityIndex.get(capability) || new Set();
        candidates = new Set([...candidates].filter(id => capabilityTasks.has(id)));
      }
    }

    // Filter by age
    if (filter.ageMs !== undefined) {
      const cutoff = Date.now() - filter.ageMs;
      candidates = new Set([...candidates].filter(id => {
        const task = this.tasks.get(id);
        return task && task.createdAt.getTime() >= cutoff;
      }));
    }

    return Array.from(candidates).map(id => this.tasks.get(id)!).filter(Boolean);
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    totalTasks: number;
    tasksByPriority: Record<Priority, number>;
    tasksByStatus: Record<TaskStatus, number>;
    averageWaitTime: number;
    oldestTaskAge: number;
  } {
    const stats = {
      totalTasks: this.tasks.size,
      tasksByPriority: {} as Record<Priority, number>,
      tasksByStatus: {} as Record<TaskStatus, number>,
      averageWaitTime: 0,
      oldestTaskAge: 0,
    };

    let totalWaitTime = 0;
    let oldestTask: Task | null = null;
    const now = Date.now();

    for (const task of this.tasks.values()) {
      // Count by priority
      stats.tasksByPriority[task.priority] = (stats.tasksByPriority[task.priority] || 0) + 1;
      
      // Count by status
      stats.tasksByStatus[task.status] = (stats.tasksByStatus[task.status] || 0) + 1;
      
      // Calculate wait time
      const waitTime = now - task.createdAt.getTime();
      totalWaitTime += waitTime;
      
      // Find oldest task
      if (!oldestTask || task.createdAt < oldestTask.createdAt) {
        oldestTask = task;
      }
    }

    if (this.tasks.size > 0) {
      stats.averageWaitTime = totalWaitTime / this.tasks.size;
      stats.oldestTaskAge = oldestTask ? now - oldestTask.createdAt.getTime() : 0;
    }

    return stats;
  }

  /**
   * Clear all tasks
   */
  clear(): void {
    const clearedCount = this.tasks.size;
    
    this.tasks.clear();
    this.initializePriorityQueues();
    this.capabilityIndex.clear();
    this.statusIndex.clear();
    
    this.emit('queue.cleared', { clearedCount });
  }

  /**
   * Get tasks sorted by priority and creation time
   */
  getAllTasks(): Task[] {
    const allTasks = Array.from(this.tasks.values());
    
    return allTasks.sort((a, b) => {
      // First sort by priority (higher number = higher priority)
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      
      // Then by creation time (older first)
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  /**
   * Cleanup old completed/failed tasks
   */
  cleanup(olderThanMs: number = 3600000): number { // Default 1 hour
    const cutoff = Date.now() - olderThanMs;
    const toRemove: TaskId[] = [];

    for (const [taskId, task] of this.tasks) {
      if ((task.status === TaskStatus.COMPLETED || task.status === TaskStatus.FAILED) &&
          task.updatedAt.getTime() < cutoff) {
        toRemove.push(taskId);
      }
    }

    for (const taskId of toRemove) {
      this.remove(taskId);
    }

    this.emit('queue.cleanup', { removedCount: toRemove.length });
    return toRemove.length;
  }

  private initializePriorityQueues(): void {
    this.priorityQueues.clear();
    this.priorityQueues.set(Priority.LOW, []);
    this.priorityQueues.set(Priority.NORMAL, []);
    this.priorityQueues.set(Priority.HIGH, []);
    this.priorityQueues.set(Priority.CRITICAL, []);
  }

  private findMatchingTasks(requiredCapabilities: AgentCapability[]): TaskId[] {
    const matchingTasks: TaskId[] = [];

    // Search by priority (highest first)
    const priorities = [Priority.CRITICAL, Priority.HIGH, Priority.NORMAL, Priority.LOW];
    
    for (const priority of priorities) {
      const priorityQueue = this.priorityQueues.get(priority)!;
      
      for (const taskId of priorityQueue) {
        const task = this.tasks.get(taskId);
        if (!task || task.status !== TaskStatus.PENDING) {
          continue;
        }

        // Check if agent has all required capabilities
        const hasAllCapabilities = task.requiredCapabilities.every(cap => 
          requiredCapabilities.includes(cap)
        );

        if (hasAllCapabilities) {
          matchingTasks.push(taskId);
        }
      }
    }

    return matchingTasks;
  }

  private updateIndexes(task: Task): void {
    // Update capability index
    for (const capability of task.requiredCapabilities) {
      if (!this.capabilityIndex.has(capability)) {
        this.capabilityIndex.set(capability, new Set());
      }
      this.capabilityIndex.get(capability)!.add(task.id);
    }

    // Update status index
    if (!this.statusIndex.has(task.status)) {
      this.statusIndex.set(task.status, new Set());
    }
    this.statusIndex.get(task.status)!.add(task.id);
  }

  private removeFromIndexes(task: Task): void {
    // Remove from capability index
    for (const capability of task.requiredCapabilities) {
      const capabilityTasks = this.capabilityIndex.get(capability);
      if (capabilityTasks) {
        capabilityTasks.delete(task.id);
        if (capabilityTasks.size === 0) {
          this.capabilityIndex.delete(capability);
        }
      }
    }

    // Remove from status index
    const statusTasks = this.statusIndex.get(task.status);
    if (statusTasks) {
      statusTasks.delete(task.id);
      if (statusTasks.size === 0) {
        this.statusIndex.delete(task.status);
      }
    }
  }

  private updateStatusIndex(taskId: TaskId, oldStatus: TaskStatus, newStatus: TaskStatus): void {
    // Remove from old status
    const oldStatusTasks = this.statusIndex.get(oldStatus);
    if (oldStatusTasks) {
      oldStatusTasks.delete(taskId);
      if (oldStatusTasks.size === 0) {
        this.statusIndex.delete(oldStatus);
      }
    }

    // Add to new status
    if (!this.statusIndex.has(newStatus)) {
      this.statusIndex.set(newStatus, new Set());
    }
    this.statusIndex.get(newStatus)!.add(taskId);
  }
}