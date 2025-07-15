import { EventEmitter } from 'eventemitter3';
import type { Message, Priority, TaskStatus } from '../types';

export interface QueuedMessage {
  message: Message;
  attempts: number;
  maxAttempts: number;
  nextRetryAt: Date;
  createdAt: Date;
  status: TaskStatus;
  error?: string;
}

export interface MessageQueueConfig {
  maxMessages?: number;
  maxAttempts?: number;
  retryDelayMs?: number;
  enablePersistence?: boolean;
  processingIntervalMs?: number;
  enableLogging?: boolean;
}

export interface QueueStats {
  totalMessages: number;
  pendingMessages: number;
  processingMessages: number;
  completedMessages: number;
  failedMessages: number;
  averageProcessingTime: number;
  messagesByPriority: Map<Priority, number>;
}

/**
 * Message queue for reliable message delivery and processing
 */
export class MessageQueue extends EventEmitter {
  private messageQueue: QueuedMessage[] = [];
  private processingMessages: Map<string, QueuedMessage> = new Map();
  private completedMessages: Map<string, QueuedMessage> = new Map();
  private failedMessages: Map<string, QueuedMessage> = new Map();
  private stats: QueueStats;
  private config: MessageQueueConfig;
  private processingInterval?: NodeJS.Timer;
  private isProcessing: boolean = false;

  constructor(config: MessageQueueConfig = {}) {
    super();
    this.config = {
      maxMessages: config.maxMessages ?? 10000,
      maxAttempts: config.maxAttempts ?? 3,
      retryDelayMs: config.retryDelayMs ?? 1000,
      enablePersistence: config.enablePersistence ?? false,
      processingIntervalMs: config.processingIntervalMs ?? 100,
      enableLogging: config.enableLogging ?? false
    };
    
    this.stats = {
      totalMessages: 0,
      pendingMessages: 0,
      processingMessages: 0,
      completedMessages: 0,
      failedMessages: 0,
      averageProcessingTime: 0,
      messagesByPriority: new Map()
    };

    this.startProcessing();
  }

  /**
   * Enqueue a message for processing
   */
  async enqueue(message: Message, maxAttempts?: number): Promise<void> {
    if (this.messageQueue.length >= this.config.maxMessages!) {
      throw new Error('Message queue is full');
    }

    const queuedMessage: QueuedMessage = {
      message,
      attempts: 0,
      maxAttempts: maxAttempts ?? this.config.maxAttempts!,
      nextRetryAt: new Date(),
      createdAt: new Date(),
      status: TaskStatus.PENDING
    };

    // Insert message based on priority
    this.insertByPriority(queuedMessage);
    
    // Update stats
    this.stats.totalMessages++;
    this.stats.pendingMessages++;
    const priorityCount = this.stats.messagesByPriority.get(message.priority) || 0;
    this.stats.messagesByPriority.set(message.priority, priorityCount + 1);
    
    if (this.config.enableLogging) {
      console.log(`Message ${message.id} enqueued with priority ${message.priority}`);
    }
    
    this.emit('message.enqueued', { message: queuedMessage });
  }

  /**
   * Process the next message in the queue
   */
  async processNext(): Promise<boolean> {
    if (this.messageQueue.length === 0) {
      return false;
    }

    const queuedMessage = this.messageQueue.shift()!;
    
    // Check if message is ready for processing
    if (queuedMessage.nextRetryAt > new Date()) {
      // Put it back in the queue
      this.insertByPriority(queuedMessage);
      return false;
    }

    // Move to processing
    this.processingMessages.set(queuedMessage.message.id, queuedMessage);
    queuedMessage.status = TaskStatus.IN_PROGRESS;
    queuedMessage.attempts++;
    
    this.stats.pendingMessages--;
    this.stats.processingMessages++;
    
    const startTime = Date.now();
    
    try {
      // Emit processing event
      this.emit('message.processing', { message: queuedMessage });
      
      // Process the message
      await this.processMessage(queuedMessage.message);
      
      // Mark as completed
      this.processingMessages.delete(queuedMessage.message.id);
      this.completedMessages.set(queuedMessage.message.id, queuedMessage);
      queuedMessage.status = TaskStatus.COMPLETED;
      
      this.stats.processingMessages--;
      this.stats.completedMessages++;
      
      const processingTime = Date.now() - startTime;
      this.updateAverageProcessingTime(processingTime);
      
      if (this.config.enableLogging) {
        console.log(`Message ${queuedMessage.message.id} processed successfully in ${processingTime}ms`);
      }
      
      this.emit('message.completed', { message: queuedMessage, processingTime });
      
      return true;
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      // Handle retry logic
      if (queuedMessage.attempts < queuedMessage.maxAttempts) {
        // Schedule retry
        queuedMessage.nextRetryAt = new Date(Date.now() + this.config.retryDelayMs!);
        queuedMessage.status = TaskStatus.PENDING;
        queuedMessage.error = error instanceof Error ? error.message : String(error);
        
        // Put back in queue
        this.processingMessages.delete(queuedMessage.message.id);
        this.insertByPriority(queuedMessage);
        
        this.stats.processingMessages--;
        this.stats.pendingMessages++;
        
        if (this.config.enableLogging) {
          console.log(`Message ${queuedMessage.message.id} failed, scheduling retry ${queuedMessage.attempts}/${queuedMessage.maxAttempts}`);
        }
        
        this.emit('message.retry', { message: queuedMessage, error, processingTime });
        
      } else {
        // Mark as failed
        this.processingMessages.delete(queuedMessage.message.id);
        this.failedMessages.set(queuedMessage.message.id, queuedMessage);
        queuedMessage.status = TaskStatus.FAILED;
        queuedMessage.error = error instanceof Error ? error.message : String(error);
        
        this.stats.processingMessages--;
        this.stats.failedMessages++;
        
        if (this.config.enableLogging) {
          console.error(`Message ${queuedMessage.message.id} failed permanently after ${queuedMessage.attempts} attempts:`, error);
        }
        
        this.emit('message.failed', { message: queuedMessage, error, processingTime });
      }
      
      return false;
    }
  }

  /**
   * Process a message (to be implemented by subclasses or provided as callback)
   */
  protected async processMessage(message: Message): Promise<void> {
    // Default implementation - emit event for external processing
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Message processing timeout'));
      }, 30000); // 30 second timeout
      
      this.emit('process.message', {
        message,
        resolve: (result?: any) => {
          clearTimeout(timeout);
          resolve(result);
        },
        reject: (error: Error) => {
          clearTimeout(timeout);
          reject(error);
        }
      });
    });
  }

  /**
   * Get message by ID
   */
  getMessage(messageId: string): QueuedMessage | undefined {
    // Check all queues
    const pending = this.messageQueue.find(m => m.message.id === messageId);
    if (pending) return pending;
    
    const processing = this.processingMessages.get(messageId);
    if (processing) return processing;
    
    const completed = this.completedMessages.get(messageId);
    if (completed) return completed;
    
    const failed = this.failedMessages.get(messageId);
    if (failed) return failed;
    
    return undefined;
  }

  /**
   * Get all messages with a specific status
   */
  getMessagesByStatus(status: TaskStatus): QueuedMessage[] {
    switch (status) {
      case TaskStatus.PENDING:
        return [...this.messageQueue];
      case TaskStatus.IN_PROGRESS:
        return Array.from(this.processingMessages.values());
      case TaskStatus.COMPLETED:
        return Array.from(this.completedMessages.values());
      case TaskStatus.FAILED:
        return Array.from(this.failedMessages.values());
      default:
        return [];
    }
  }

  /**
   * Cancel a message
   */
  async cancelMessage(messageId: string): Promise<boolean> {
    // Check if message is in pending queue
    const pendingIndex = this.messageQueue.findIndex(m => m.message.id === messageId);
    if (pendingIndex !== -1) {
      const queuedMessage = this.messageQueue.splice(pendingIndex, 1)[0];
      queuedMessage.status = TaskStatus.CANCELLED;
      
      this.stats.pendingMessages--;
      
      if (this.config.enableLogging) {
        console.log(`Message ${messageId} cancelled from pending queue`);
      }
      
      this.emit('message.cancelled', { message: queuedMessage });
      return true;
    }
    
    // Check if message is currently processing
    const processingMessage = this.processingMessages.get(messageId);
    if (processingMessage) {
      processingMessage.status = TaskStatus.CANCELLED;
      this.processingMessages.delete(messageId);
      
      this.stats.processingMessages--;
      
      if (this.config.enableLogging) {
        console.log(`Message ${messageId} cancelled from processing`);
      }
      
      this.emit('message.cancelled', { message: processingMessage });
      return true;
    }
    
    return false;
  }

  /**
   * Retry a failed message
   */
  async retryMessage(messageId: string): Promise<boolean> {
    const failedMessage = this.failedMessages.get(messageId);
    if (!failedMessage) {
      return false;
    }
    
    // Reset attempts and re-queue
    failedMessage.attempts = 0;
    failedMessage.nextRetryAt = new Date();
    failedMessage.status = TaskStatus.PENDING;
    failedMessage.error = undefined;
    
    this.failedMessages.delete(messageId);
    this.insertByPriority(failedMessage);
    
    this.stats.failedMessages--;
    this.stats.pendingMessages++;
    
    if (this.config.enableLogging) {
      console.log(`Message ${messageId} manually retried`);
    }
    
    this.emit('message.retried', { message: failedMessage });
    return true;
  }

  /**
   * Clear completed messages
   */
  clearCompleted(): number {
    const count = this.completedMessages.size;
    this.completedMessages.clear();
    this.stats.completedMessages = 0;
    
    if (this.config.enableLogging) {
      console.log(`Cleared ${count} completed messages`);
    }
    
    return count;
  }

  /**
   * Clear failed messages
   */
  clearFailed(): number {
    const count = this.failedMessages.size;
    this.failedMessages.clear();
    this.stats.failedMessages = 0;
    
    if (this.config.enableLogging) {
      console.log(`Cleared ${count} failed messages`);
    }
    
    return count;
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    return {
      ...this.stats,
      messagesByPriority: new Map(this.stats.messagesByPriority)
    };
  }

  /**
   * Get queue size
   */
  getSize(): number {
    return this.messageQueue.length;
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.messageQueue.length === 0 && this.processingMessages.size === 0;
  }

  /**
   * Start processing messages
   */
  private startProcessing(): void {
    this.processingInterval = setInterval(async () => {
      if (!this.isProcessing && this.messageQueue.length > 0) {
        this.isProcessing = true;
        try {
          await this.processNext();
        } catch (error) {
          if (this.config.enableLogging) {
            console.error('Error in message processing:', error);
          }
        } finally {
          this.isProcessing = false;
        }
      }
    }, this.config.processingIntervalMs);
  }

  /**
   * Stop processing messages
   */
  private stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }
  }

  /**
   * Insert message by priority
   */
  private insertByPriority(queuedMessage: QueuedMessage): void {
    const priority = queuedMessage.message.priority;
    let insertIndex = 0;
    
    // Find the correct position to insert based on priority
    for (let i = 0; i < this.messageQueue.length; i++) {
      if (this.messageQueue[i].message.priority < priority) {
        insertIndex = i;
        break;
      }
      insertIndex = i + 1;
    }
    
    this.messageQueue.splice(insertIndex, 0, queuedMessage);
  }

  /**
   * Update average processing time
   */
  private updateAverageProcessingTime(processingTime: number): void {
    const currentAverage = this.stats.averageProcessingTime;
    const totalCompleted = this.stats.completedMessages;
    this.stats.averageProcessingTime = 
      ((currentAverage * (totalCompleted - 1)) + processingTime) / totalCompleted;
  }

  /**
   * Reset the queue
   */
  reset(): void {
    this.messageQueue.length = 0;
    this.processingMessages.clear();
    this.completedMessages.clear();
    this.failedMessages.clear();
    
    this.stats = {
      totalMessages: 0,
      pendingMessages: 0,
      processingMessages: 0,
      completedMessages: 0,
      failedMessages: 0,
      averageProcessingTime: 0,
      messagesByPriority: new Map()
    };
    
    this.emit('queue.reset');
  }

  /**
   * Cleanup and stop the queue
   */
  async cleanup(): Promise<void> {
    this.stopProcessing();
    this.reset();
    this.removeAllListeners();
  }
}