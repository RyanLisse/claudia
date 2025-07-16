/**
 * Inngest integration layer for the API server
 * Connects API routes with existing Inngest functions from ai-agents package
 */

import { Inngest } from 'inngest';

// Create Inngest client for API server
export const inngest = new Inngest({ 
  id: 'claudia-api-server',
  name: 'Claudia API Server',
  eventKey: process.env.INNGEST_EVENT_KEY,
  signingKey: process.env.INNGEST_SIGNING_KEY,
});

/**
 * Event interfaces for type safety
 */
export interface TaskEvents {
  'task/create': {
    data: {
      type: string;
      payload: {
        prompt: string;
        context?: Record<string, any>;
        files?: string[];
      };
      agentId: string;
      priority: 'low' | 'normal' | 'high' | 'critical';
      timeoutMs: number;
      maxRetries: number;
      sessionId?: string;
      createdAt: string;
      status: string;
    };
  };

  'task/list': {
    data: {
      filters: {
        agentId?: string;
        status?: string;
        type?: string;
        sessionId?: string;
        limit?: number;
        offset?: number;
      };
      includeMetrics: boolean;
    };
  };

  'task/get': {
    data: {
      taskId: string;
    };
  };

  'task/update': {
    data: {
      taskId: string;
      updates: {
        status?: string;
        progress?: number;
        result?: any;
        error?: string;
        updatedAt: string;
      };
    };
  };

  'task/action': {
    data: {
      taskId: string;
      action: 'cancel' | 'retry' | 'pause' | 'resume';
      reason?: string;
      timestamp: string;
    };
  };

  'task/get-progress': {
    data: {
      taskId: string;
    };
  };

  'task/get-metrics': {
    data: {
      timeRange: string;
      includeAgentBreakdown: boolean;
    };
  };

  'task/delete': {
    data: {
      taskId: string;
    };
  };
}

export interface AgentEvents {
  'agent/initialize': {
    data: {
      agentId: string;
      config: {
        name: string;
        type: string;
        description: string;
        capabilities: string[];
        maxConcurrentTasks: number;
        configuration: Record<string, any>;
      };
    };
  };

  'agent/list': {
    data: {
      filters?: {
        type?: string;
        status?: string;
        capabilities?: string[];
        limit?: number;
        offset?: number;
      };
    };
  };

  'agent/get': {
    data: {
      agentId: string;
    };
  };

  'agent/update': {
    data: {
      agentId: string;
      updates: {
        name?: string;
        description?: string;
        capabilities?: string[];
        maxConcurrentTasks?: number;
        configuration?: Record<string, any>;
        status?: string;
      };
    };
  };

  'agent/delete': {
    data: {
      agentId: string;
    };
  };

  'agent/get-metrics': {
    data: {
      agentId: string;
      timeRange?: string;
    };
  };
}

/**
 * Task management functions
 */
export class TaskManager {
  /**
   * Create a new task
   */
  static async createTask(taskData: TaskEvents['task/create']['data']) {
    try {
      // Send to existing Inngest function
      const result = await inngest.send({
        name: 'task/execute',
        data: {
          taskId: generateTaskId(),
          agentId: taskData.agentId,
          sessionId: taskData.sessionId || generateSessionId(),
          task: {
            id: generateTaskId(),
            type: taskData.type,
            payload: taskData.payload,
            priority: taskData.priority,
            timeoutMs: taskData.timeoutMs,
            retries: 0,
            maxRetries: taskData.maxRetries,
          },
          config: await this.getAgentConfig(taskData.agentId),
        },
      });

      return {
        success: true,
        task: {
          id: generateTaskId(), // Generate our own ID since Inngest send doesn't return taskId
          ...taskData,
          status: 'pending',
          createdAt: taskData.createdAt,
          updatedAt: taskData.createdAt,
        },
      };
    } catch (error) {
      console.error('Failed to create task:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create task: ${errorMessage}`);
    }
  }

  /**
   * List tasks with filtering
   */
  static async listTasks(filters: TaskEvents['task/list']['data']['filters']) {
    try {
      // In a real implementation, this would query a database
      // For now, we'll return mock data that matches the expected structure
      return {
        success: true,
        tasks: [],
        count: 0,
        metrics: {
          total: 0,
          byStatus: {},
          byType: {},
          byAgent: {},
          averageExecutionTime: 0,
          successRate: 0,
          throughput: 0,
        },
      };
    } catch (error) {
      console.error('Failed to list tasks:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to list tasks: ${errorMessage}`);
    }
  }

  /**
   * Get a specific task
   */
  static async getTask(taskId: string) {
    try {
      // In a real implementation, this would query a database
      return {
        success: true,
        task: null,
      };
    } catch (error) {
      console.error('Failed to get task:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get task: ${errorMessage}`);
    }
  }

  /**
   * Update a task
   */
  static async updateTask(taskId: string, updates: TaskEvents['task/update']['data']['updates']) {
    try {
      // Send update event to Inngest
      const result = await inngest.send({
        name: 'task/status',
        data: {
          taskId,
          agentId: 'unknown', // Would be retrieved from task data
          sessionId: 'unknown', // Would be retrieved from task data
          status: updates.status as any,
          result: updates.result,
          error: updates.error,
          metrics: updates.progress ? { progress: updates.progress } : undefined,
        },
      });

      return {
        success: true,
        task: {
          id: taskId,
          ...updates,
        },
      };
    } catch (error) {
      console.error('Failed to update task:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to update task: ${errorMessage}`);
    }
  }

  /**
   * Execute task action
   */
  static async executeTaskAction(taskId: string, action: string, reason?: string) {
    try {
      // Handle different actions
      switch (action) {
        case 'cancel':
          await this.updateTask(taskId, { status: 'cancelled', updatedAt: new Date().toISOString() });
          break;
        case 'retry':
          await this.updateTask(taskId, { status: 'pending', updatedAt: new Date().toISOString() });
          break;
        case 'pause':
          await this.updateTask(taskId, { status: 'paused', updatedAt: new Date().toISOString() });
          break;
        case 'resume':
          await this.updateTask(taskId, { status: 'in_progress', updatedAt: new Date().toISOString() });
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      return {
        success: true,
        message: `Task ${action} executed successfully`,
      };
    } catch (error) {
      console.error(`Failed to execute task ${action}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to execute task ${action}: ${errorMessage}`);
    }
  }

  /**
   * Get task progress
   */
  static async getTaskProgress(taskId: string) {
    try {
      // In a real implementation, this would query task progress from database/cache
      return {
        success: true,
        progress: 0,
        status: 'pending',
        estimatedCompletion: null,
        currentStep: null,
        totalSteps: null,
      };
    } catch (error) {
      console.error('Failed to get task progress:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get task progress: ${errorMessage}`);
    }
  }

  /**
   * Get task metrics
   */
  static async getTaskMetrics(timeRange: string = '24h') {
    try {
      // In a real implementation, this would query metrics from database
      return {
        success: true,
        metrics: {
          total: 0,
          byStatus: {},
          byType: {},
          byAgent: {},
          averageExecutionTime: 0,
          successRate: 0,
          throughput: 0,
        },
      };
    } catch (error) {
      console.error('Failed to get task metrics:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get task metrics: ${errorMessage}`);
    }
  }

  /**
   * Delete a task
   */
  static async deleteTask(taskId: string) {
    try {
      // In a real implementation, this would delete from database
      return {
        success: true,
        message: 'Task deleted successfully',
      };
    } catch (error) {
      console.error('Failed to delete task:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete task: ${errorMessage}`);
    }
  }

  /**
   * Get agent configuration (helper method)
   */
  private static async getAgentConfig(agentId: string) {
    // In a real implementation, this would fetch agent config from database
    return {
      id: agentId,
      name: `Agent ${agentId}`,
      openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
        streaming: false,
      },
      codeGeneration: {
        maxFileSize: 100000,
        supportedLanguages: ['typescript', 'javascript', 'python', 'rust'],
        includeTests: true,
        includeDocumentation: true,
      },
    };
  }
}

/**
 * Utility functions
 */
function generateTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export type TypedInngest = typeof inngest;
