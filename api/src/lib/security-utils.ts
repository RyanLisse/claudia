import { z } from 'zod';
import { HTTPException } from 'hono/http-exception';
import { auditLog } from './audit-logger.js';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Sanitize input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    throw new HTTPException(400, { message: 'Invalid input type' });
  }
  
  // Remove potentially dangerous characters
  const sanitized = input
    .replace(/[<>\"']/g, '') // Remove HTML/SQL injection characters
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .trim();
  
  if (sanitized.length === 0 && input.length > 0) {
    throw new HTTPException(400, { message: 'Input contains only invalid characters' });
  }
  
  return sanitized;
}

/**
 * Validate UUID format
 */
export function validateUUID(id: string): string {
  const uuidSchema = z.string().uuid();
  
  try {
    return uuidSchema.parse(id);
  } catch (error) {
    throw new HTTPException(400, { message: 'Invalid UUID format' });
  }
}

/**
 * Rate limiting middleware
 */
export function rateLimit(maxRequests: number = 100, windowMs: number = 60000) {
  return async (c: any, next: any) => {
    const clientIP = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    const key = `rate_limit:${clientIP}`;
    const now = Date.now();
    
    const record = rateLimitStore.get(key);
    
    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    } else {
      record.count++;
      if (record.count > maxRequests) {
        await auditLog('RATE_LIMIT_EXCEEDED', {
          clientIP,
          requestCount: record.count,
          windowMs,
          timestamp: new Date().toISOString()
        });
        throw new HTTPException(429, { message: 'Rate limit exceeded' });
      }
    }
    
    await next();
  };
}

/**
 * Validate and sanitize JSON input
 */
export function sanitizeJsonInput(input: any): any {
  if (typeof input === 'string') {
    return sanitizeInput(input);
  }
  
  if (Array.isArray(input)) {
    return input.map(item => sanitizeJsonInput(item));
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      const sanitizedKey = sanitizeInput(key);
      sanitized[sanitizedKey] = sanitizeJsonInput(value);
    }
    return sanitized;
  }
  
  return input;
}

/**
 * Validate database operation parameters
 */
export function validateDatabaseParams(params: Record<string, any>): Record<string, any> {
  const validated: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(params)) {
    const sanitizedKey = sanitizeInput(key);
    
    if (typeof value === 'string') {
      validated[sanitizedKey] = sanitizeInput(value);
    } else if (value !== null && value !== undefined) {
      validated[sanitizedKey] = sanitizeJsonInput(value);
    }
  }
  
  return validated;
}

/**
 * Secure error handling that doesn't leak sensitive information
 */
export function handleSecureError(error: any, context: string): HTTPException {
  // Log full error details for debugging
  console.error(`[${context}] Security error:`, error);
  
  await auditLog('SECURITY_ERROR', {
    context,
    error: error.message || 'Unknown error',
    timestamp: new Date().toISOString()
  });
  
  // Return generic error message to client
  if (error instanceof HTTPException) {
    return error;
  }
  
  return new HTTPException(500, { 
    message: 'An internal error occurred' 
  });
}

/**
 * Validate agent type enum
 */
export function validateAgentType(type: string): string {
  const validTypes = ['researcher', 'coder', 'analyst', 'optimizer', 'coordinator', 'tester', 'reviewer', 'documenter'];
  
  if (!validTypes.includes(type)) {
    throw new HTTPException(400, { message: 'Invalid agent type' });
  }
  
  return type;
}

/**
 * Validate agent status enum
 */
export function validateAgentStatus(status: string): string {
  const validStatuses = ['idle', 'busy', 'error'];
  
  if (!validStatuses.includes(status)) {
    throw new HTTPException(400, { message: 'Invalid agent status' });
  }
  
  return status;
}