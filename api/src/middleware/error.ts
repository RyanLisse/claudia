import type { ErrorHandler } from 'hono'
import type { ApiResponse } from '../types/variables.js'

export const errorHandler: ErrorHandler = (err, c) => {
  console.error('API Error:', err)

  const requestId = c.get('requestId') || 'unknown'

  // Handle HTTPException instances first (from Hono)
  if (err.name === 'HTTPException' || (err as any).status) {
    const httpErr = err as any
    const response: ApiResponse = {
      success: false,
      error: httpErr.message || 'HTTP Error',
      message: httpErr.message || 'An HTTP error occurred',
      timestamp: new Date().toISOString(),
      requestId,
      data: undefined
    }
    return c.json(response, httpErr.status || 500)
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    const response: ApiResponse = {
      success: false,
      error: err,
      message: 'Invalid request data',
      timestamp: new Date().toISOString(),
      requestId,
      data: (err as any).issues
    }
    return c.json(response, 400)
  }
  
  // Handle authentication errors
  if (err.message.includes('Unauthorized') || err.message.includes('Invalid token')) {
    const response: ApiResponse = {
      success: false,
      error: 'Unauthorized',
      message: 'Authentication required or invalid credentials',
      timestamp: new Date().toISOString(),
      requestId,
      data: undefined
    }
    return c.json(response, 401)
  }
  
  // Handle forbidden errors
  if (err.message.includes('Forbidden') || err.message.includes('Permission denied')) {
    const response: ApiResponse = {
      success: false,
      error: 'Forbidden',
      message: 'Insufficient permissions to access this resource',
      timestamp: new Date().toISOString(),
      requestId,
      data: undefined
    }
    return c.json(response, 403)
  }
  
  // Handle not found errors
  if (err.message.includes('Not found')) {
    const response: ApiResponse = {
      success: false,
      error: 'Not Found',
      message: 'The requested resource was not found',
      timestamp: new Date().toISOString(),
      requestId,
      data: undefined
    }
    return c.json(response, 404)
  }
  
  // Handle rate limit errors
  if (err.message.includes('Rate limit')) {
    const response: ApiResponse = {
      success: false,
      error: 'Rate Limit Exceeded',
      message: 'Too many requests. Please try again later.',
      timestamp: new Date().toISOString(),
      requestId,
      data: undefined
    }
    return c.json(response, 429)
  }
  
  // Handle database errors
  if (err.message.includes('database') || err.message.includes('SQL')) {
    const response: ApiResponse = {
      success: false,
      error: 'Database Error',
      message: 'Internal database error occurred',
      timestamp: new Date().toISOString(),
      requestId,
      data: undefined
    }
    return c.json(response, 500)
  }
  
  // Generic server error
  const response: ApiResponse = {
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development'
      ? err.message
      : 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
    requestId,
    data: undefined
  }
  
  return c.json(response, 500)
}