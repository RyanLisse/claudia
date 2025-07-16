import { db } from '@db/client';
import { sql } from '@db/client';

// Define audit event types
export type AuditEventType = 
  | 'AGENT_CREATED'
  | 'AGENT_UPDATED'
  | 'AGENT_DELETED'
  | 'AGENT_ACTION'
  | 'TASK_ASSIGNED'
  | 'TASK_COMPLETED'
  | 'SECURITY_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'UNAUTHORIZED_ACCESS'
  | 'SQL_INJECTION_ATTEMPT'
  | 'INVALID_INPUT'
  | 'DATABASE_ERROR';

export interface AuditLogEntry {
  eventType: AuditEventType;
  userId?: string;
  agentId?: string;
  taskId?: string;
  data: Record<string, any>;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

/**
 * Log audit events to database with proper security measures
 */
export async function auditLog(
  eventType: AuditEventType,
  data: Record<string, any>,
  context?: {
    userId?: string;
    agentId?: string;
    taskId?: string;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  }
): Promise<void> {
  try {
    // Ensure audit_logs table exists
    await ensureAuditTable();
    
    const logEntry: AuditLogEntry = {
      eventType,
      userId: context?.userId,
      agentId: context?.agentId,
      taskId: context?.taskId,
      data: sanitizeAuditData(data),
      timestamp: new Date().toISOString(),
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      sessionId: context?.sessionId,
    };
    
    // Use parameterized query to prevent SQL injection
    await sql`
      INSERT INTO audit_logs (
        event_type, user_id, agent_id, task_id, data, 
        timestamp, ip_address, user_agent, session_id
      )
      VALUES (
        ${logEntry.eventType},
        ${logEntry.userId || null},
        ${logEntry.agentId || null},
        ${logEntry.taskId || null},
        ${JSON.stringify(logEntry.data)},
        ${logEntry.timestamp},
        ${logEntry.ipAddress || null},
        ${logEntry.userAgent || null},
        ${logEntry.sessionId || null}
      )
    `;
    
    // Also log to console for immediate visibility
    console.log(`[AUDIT] ${eventType}:`, JSON.stringify(logEntry, null, 2));
    
  } catch (error) {
    // If audit logging fails, log to console but don't throw
    console.error('[AUDIT_ERROR] Failed to log audit event:', error);
    console.error('[AUDIT_ERROR] Event data:', { eventType, data, context });
  }
}

/**
 * Ensure audit_logs table exists
 */
async function ensureAuditTable(): Promise<void> {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_type TEXT NOT NULL,
        user_id UUID,
        agent_id UUID,
        task_id UUID,
        data JSONB NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        session_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // Create indexes for better query performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type 
      ON audit_logs(event_type)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp 
      ON audit_logs(timestamp)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id 
      ON audit_logs(user_id)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_agent_id 
      ON audit_logs(agent_id)
    `;
    
  } catch (error) {
    console.error('[AUDIT_TABLE_ERROR] Failed to create audit table:', error);
  }
}

/**
 * Sanitize audit data to prevent logging sensitive information
 */
function sanitizeAuditData(data: Record<string, any>): Record<string, any> {
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'key',
    'auth',
    'credential',
    'private',
    'sensitive'
  ];
  
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    
    // Check if field might contain sensitive data
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'string' && value.length > 1000) {
      // Truncate very long strings
      sanitized[key] = value.substring(0, 1000) + '...[TRUNCATED]';
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeAuditData(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Query audit logs with filtering and pagination
 */
export async function getAuditLogs(options: {
  eventType?: AuditEventType;
  userId?: string;
  agentId?: string;
  taskId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}): Promise<AuditLogEntry[]> {
  try {
    let query = sql`
      SELECT * FROM audit_logs 
      WHERE 1=1
    `;
    
    const conditions: any[] = [];
    
    if (options.eventType) {
      conditions.push(sql`event_type = ${options.eventType}`);
    }
    
    if (options.userId) {
      conditions.push(sql`user_id = ${options.userId}`);
    }
    
    if (options.agentId) {
      conditions.push(sql`agent_id = ${options.agentId}`);
    }
    
    if (options.taskId) {
      conditions.push(sql`task_id = ${options.taskId}`);
    }
    
    if (options.startDate) {
      conditions.push(sql`timestamp >= ${options.startDate}`);
    }
    
    if (options.endDate) {
      conditions.push(sql`timestamp <= ${options.endDate}`);
    }
    
    // Apply conditions
    for (const condition of conditions) {
      query = sql`${query} AND ${condition}`;
    }
    
    // Add ordering and pagination
    query = sql`
      ${query}
      ORDER BY timestamp DESC
      LIMIT ${options.limit || 100}
      OFFSET ${options.offset || 0}
    `;
    
    const results = await query;
    return results as AuditLogEntry[];
    
  } catch (error) {
    console.error('[AUDIT_QUERY_ERROR] Failed to query audit logs:', error);
    throw error;
  }
}

/**
 * Helper function to log database operations
 */
export async function auditDatabaseOperation(
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
  table: string,
  data: Record<string, any>,
  context?: {
    userId?: string;
    agentId?: string;
    taskId?: string;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  }
): Promise<void> {
  await auditLog('DATABASE_ERROR', {
    operation,
    table,
    data,
  }, context);
}