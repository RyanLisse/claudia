/**
 * Inngest client configuration for AI Agent System
 */

import { Inngest } from 'inngest';

export const inngest = new Inngest({ 
  id: 'claudia-ai-agents',
  name: 'Claudia AI Agent System',
  eventKey: process.env.INNGEST_EVENT_KEY,
  signingKey: process.env.INNGEST_SIGNING_KEY,
});

/**
 * Event schemas for type safety
 */
export interface AgentEvents {
  'agent/task.created': {
    data: {
      taskId: string;
      type: string;
      priority: number;
      payload: Record<string, any>;
      requiredCapabilities: string[];
      timeoutMs: number;
      maxRetries: number;
    };
  };
  
  'agent/task.assigned': {
    data: {
      taskId: string;
      agentId: string;
      assignedAt: string;
    };
  };
  
  'agent/task.completed': {
    data: {
      taskId: string;
      agentId: string;
      result: any;
      durationMs: number;
      completedAt: string;
    };
  };
  
  'agent/task.failed': {
    data: {
      taskId: string;
      agentId: string;
      error: string;
      retryCount: number;
      failedAt: string;
    };
  };
  
  'agent/agent.registered': {
    data: {
      agentId: string;
      capabilities: string[];
      maxConcurrentTasks: number;
      registeredAt: string;
    };
  };
  
  'agent/agent.heartbeat': {
    data: {
      agentId: string;
      status: string;
      currentTasks: string[];
      metrics: {
        tasksCompleted: number;
        tasksInProgress: number;
        tasksFailed: number;
        averageTaskDurationMs: number;
      };
      timestamp: string;
    };
  };
  
  'agent/agent.status.changed': {
    data: {
      agentId: string;
      previousStatus: string;
      newStatus: string;
      timestamp: string;
    };
  };
  
  'agent/message.sent': {
    data: {
      messageId: string;
      from: string;
      to: string;
      type: string;
      payload: any;
      priority: number;
      timestamp: string;
      correlationId?: string;
    };
  };
  
  'agent/system.scale': {
    data: {
      targetAgentCount: number;
      currentAgentCount: number;
      requestedBy: string;
      timestamp: string;
    };
  };
  
  'agent/monitoring.alert': {
    data: {
      alertType: 'agent_down' | 'high_failure_rate' | 'queue_overflow' | 'performance_degradation';
      agentId?: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      metadata: Record<string, any>;
      timestamp: string;
    };
  };
}

/**
 * Typed Inngest client
 */
export type TypedInngest = typeof inngest;