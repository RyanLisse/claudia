import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { TaskManager } from '../lib/inngest';
import { getWebSocketManager } from '../websocket/WebSocketManager';
import { 
  validateFileAccessMiddleware, 
  validateFilePaths, 
  FileOperationRateLimiter,
  FileOperationAuditLogger 
} from '../utils/security';
import type { Env } from '../types/env.js';
import type { Variables } from '../types/variables.js';

const tasksEnhanced = new Hono<{ Bindings: Env; Variables: Variables }>();

// Enhanced validation schemas with security validations
const createTaskSchema = z.object({
  type: z.enum(['code-generation', 'code-review', 'code-refactor', 'code-debug', 'code-test', 'research', 'analysis']),
  payload: z.object({
    prompt: z.string().min(1).max(10000), // Limit prompt length
    context: z.record(z.any()).optional(),
    files: z.array(z.string())
      .max(50) // Limit number of files
      .optional()
      .refine((files) => {
        if (!files || files.length === 0) return true;
        // Validate all file paths for security
        const validation = validateFilePaths(files);
        return validation.isValid;
      }, {
        message: "One or more file paths are invalid or contain security risks"
      }),
  }),
  agentId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Agent ID contains invalid characters"),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
  timeoutMs: z.number().min(1000).max(300000).default(60000),
  maxRetries: z.number().min(0).max(5).default(3),
  sessionId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Session ID contains invalid characters").optional(),
});

const updateTaskSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'failed', 'cancelled', 'timeout']).optional(),
  progress: z.number().min(0).max(100).optional(),
  result: z.any().optional(),
  error: z.string().optional(),
});

const taskActionSchema = z.object({
  action: z.enum(['cancel', 'retry', 'pause', 'resume']),
  reason: z.string().optional(),
});

const taskQuerySchema = z.object({
  agentId: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed', 'cancelled', 'timeout']).optional(),
  type: z.string().optional(),
  sessionId: z.string().optional(),
  limit: z.string().transform(val => parseInt(val) || 50).optional(),
  offset: z.string().transform(val => parseInt(val) || 0).optional(),
});

// GET /tasks - List tasks with filtering
tasksEnhanced.get('/', zValidator('query', taskQuerySchema), async (c) => {
  try {
    const query = c.req.valid('query');

    // Get tasks using TaskManager
    const result = await TaskManager.listTasks(query);

    return c.json({
      success: true,
      data: result.tasks || [],
      count: result.count || 0,
      metrics: result.metrics || {},
    });
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    throw new HTTPException(500, { message: 'Failed to fetch tasks' });
  }
});

// POST /tasks - Create new task with security validations
tasksEnhanced.post('/', zValidator('json', createTaskSchema), async (c) => {
  try {
    const taskData = c.req.valid('json');
    
    // Get client identifier for rate limiting and audit logging
    const clientId = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    
    // Rate limiting check
    if (!FileOperationRateLimiter.isAllowed(clientId)) {
      FileOperationAuditLogger.log('create_task', JSON.stringify(taskData.payload.files), clientId, 'failure', 'Rate limit exceeded');
      throw new HTTPException(429, { 
        message: 'Rate limit exceeded. Please try again later.',
        // remainingRequests: FileOperationRateLimiter.getRemainingRequests(clientId)
      });
    }
    
    // Additional file validation middleware
    validateFileAccessMiddleware(taskData.payload.files, 'code');

    // Create task using TaskManager
    const result = await TaskManager.createTask({
      ...taskData,
      createdAt: new Date().toISOString(),
      status: 'pending',
    });

    // Audit log successful task creation
    FileOperationAuditLogger.log(
      'create_task',
      JSON.stringify(taskData.payload.files || []),
      clientId,
      'success'
    );

    // Broadcast task creation to WebSocket clients
    const wsManager = getWebSocketManager();
    if (wsManager) {
      wsManager.broadcast('tasks', {
        type: 'event',
        eventType: 'task_update',
        data: {
          type: 'task_created',
          task: result.task,
        },
        timestamp: new Date().toISOString(),
        source: 'server',
      });
    }

    return c.json({
      success: true,
      data: result.task,
      message: 'Task created successfully',
    }, 201);
  } catch (error) {
    // Audit log failed task creation
    const clientId = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    const taskData = c.req.valid('json');
    FileOperationAuditLogger.log(
      'create_task',
      JSON.stringify(taskData?.payload?.files || []),
      clientId,
      'failure',
      error instanceof Error ? error.message : 'Unknown error'
    );
    
    console.error('Failed to create task:', error);
    
    // Re-throw HTTPExceptions as-is, wrap others
    if (error instanceof HTTPException) {
      throw error;
    }
    
    throw new HTTPException(500, { message: 'Failed to create task' });
  }
});

// GET /tasks/metrics - Get task metrics and analytics (must come before /:id route)
tasksEnhanced.get('/metrics', async (c) => {
  try {
    const result = await TaskManager.getTaskMetrics('24h');

    return c.json({
      success: true,
      data: result.metrics || {
        total: 0,
        byStatus: {},
        byType: {},
        byAgent: {},
        averageExecutionTime: 0,
        successRate: 0,
        throughput: 0,
      },
    });
  } catch (error) {
    console.error('Failed to get task metrics:', error);
    throw new HTTPException(500, { message: 'Failed to get task metrics' });
  }
});

// GET /tasks/:id - Get specific task with detailed status
tasksEnhanced.get('/:id', async (c) => {
  try {
    const taskId = c.req.param('id');
    
    // Validate task ID format to prevent injection attacks
    if (!/^[a-zA-Z0-9_-]+$/.test(taskId)) {
      throw new HTTPException(400, { message: 'Invalid task ID format' });
    }

    const result = await TaskManager.getTask(taskId);

    if (!result.task) {
      throw new HTTPException(404, { message: 'Task not found' });
    }

    return c.json({
      success: true,
      data: result.task,
    });
  } catch (error) {
    if (error instanceof HTTPException) throw error;
    console.error('Failed to fetch task:', error);
    throw new HTTPException(500, { message: 'Failed to fetch task' });
  }
});

// PUT /tasks/:id - Update task
tasksEnhanced.put('/:id', zValidator('json', updateTaskSchema), async (c) => {
  try {
    const taskId = c.req.param('id');
    
    // Validate task ID format to prevent injection attacks
    if (!/^[a-zA-Z0-9_-]+$/.test(taskId)) {
      throw new HTTPException(400, { message: 'Invalid task ID format' });
    }
    
    const updates = c.req.valid('json');

    const result = await TaskManager.updateTask(taskId, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    // Broadcast task update to WebSocket clients
    const wsManager = getWebSocketManager();
    if (wsManager) {
      wsManager.broadcast('tasks', {
        type: 'event',
        eventType: 'task_update',
        data: {
          type: 'task_updated',
          taskId,
          updates,
        },
        timestamp: new Date().toISOString(),
        source: 'server',
      });
    }

    return c.json({
      success: true,
      data: result.task,
      message: 'Task updated successfully',
    });
  } catch (error) {
    console.error('Failed to update task:', error);
    throw new HTTPException(500, { message: 'Failed to update task' });
  }
});

// POST /tasks/:id/action - Execute task action
tasksEnhanced.post('/:id/action', zValidator('json', taskActionSchema), async (c) => {
  try {
    const taskId = c.req.param('id');
    
    // Validate task ID format to prevent injection attacks
    if (!/^[a-zA-Z0-9_-]+$/.test(taskId)) {
      throw new HTTPException(400, { message: 'Invalid task ID format' });
    }
    
    const { action, reason } = c.req.valid('json');

    const result = await TaskManager.executeTaskAction(taskId, action, reason);

    // Broadcast action to WebSocket clients
    const wsManager = getWebSocketManager();
    if (wsManager) {
      wsManager.broadcast('tasks', {
        type: 'event',
        eventType: 'task_update',
        data: {
          type: 'task_action',
          taskId,
          action,
          result: result.success,
        },
        timestamp: new Date().toISOString(),
        source: 'server',
      });
    }

    return c.json({
      success: true,
      data: result,
      message: `Task ${action} executed successfully`,
    });
  } catch (error) {
    console.error(`Failed to execute task action:`, error);
    throw new HTTPException(500, { message: 'Failed to execute task action' });
  }
});

// GET /tasks/:id/progress - Get real-time task progress
tasksEnhanced.get('/:id/progress', async (c) => {
  try {
    const taskId = c.req.param('id');
    
    // Validate task ID format to prevent injection attacks
    if (!/^[a-zA-Z0-9_-]+$/.test(taskId)) {
      throw new HTTPException(400, { message: 'Invalid task ID format' });
    }

    const result = await TaskManager.getTaskProgress(taskId);

    return c.json({
      success: true,
      data: {
        taskId,
        progress: result.progress || 0,
        status: result.status,
        estimatedCompletion: result.estimatedCompletion,
        currentStep: result.currentStep,
        totalSteps: result.totalSteps,
      },
    });
  } catch (error) {
    console.error('Failed to get task progress:', error);
    throw new HTTPException(500, { message: 'Failed to get task progress' });
  }
});

// Metrics route moved above to avoid conflict with /:id route

// DELETE /tasks/:id - Delete task
tasksEnhanced.delete('/:id', async (c) => {
  try {
    const taskId = c.req.param('id');
    
    // Validate task ID format to prevent injection attacks
    if (!/^[a-zA-Z0-9_-]+$/.test(taskId)) {
      throw new HTTPException(400, { message: 'Invalid task ID format' });
    }

    const result = await TaskManager.deleteTask(taskId);

    // Broadcast task deletion to WebSocket clients
    const wsManager = getWebSocketManager();
    if (wsManager) {
      wsManager.broadcast('tasks', {
        type: 'event',
        eventType: 'task_update',
        data: {
          type: 'task_deleted',
          taskId,
        },
        timestamp: new Date().toISOString(),
        source: 'server',
      });
    }

    return c.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete task:', error);
    throw new HTTPException(500, { message: 'Failed to delete task' });
  }
});

export { tasksEnhanced };
