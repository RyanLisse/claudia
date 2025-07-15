import { Hono } from 'hono'
import type { Env } from '../types/env.js'
import type { Variables, ApiResponse } from '../types/variables.js'

const health = new Hono<{ Bindings: Env; Variables: Variables }>()

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime: number
  version: string
  environment: string
  services: {
    database: 'up' | 'down' | 'unknown'
    redis: 'up' | 'down' | 'unknown'
    external_apis: 'up' | 'down' | 'unknown'
  }
  system: {
    memory: {
      used: number
      total: number
      percentage: number
    }
    cpu: {
      usage: number
    }
  }
}

// Basic health check
health.get('/', (c) => {
  const response: ApiResponse<HealthStatus> = {
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'up', // TODO: Add real database health check
        redis: 'unknown', // TODO: Add Redis health check if used
        external_apis: 'up'
      },
      system: {
        memory: {
          used: process.memoryUsage().heapUsed,
          total: process.memoryUsage().heapTotal,
          percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
        },
        cpu: {
          usage: 0 // TODO: Add CPU usage calculation
        }
      }
    },
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  }
  
  return c.json(response)
})

// Readiness check (for Kubernetes)
health.get('/ready', (c) => {
  // Check if all required services are available
  const isReady = true // TODO: Add real readiness checks
  
  const response: ApiResponse = {
    success: isReady,
    message: isReady ? 'Service is ready' : 'Service is not ready',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  }
  
  return c.json(response, isReady ? 200 : 503)
})

// Liveness check (for Kubernetes)
health.get('/live', (c) => {
  const response: ApiResponse = {
    success: true,
    message: 'Service is alive',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  }
  
  return c.json(response)
})

// Detailed health check with authentication
health.get('/detailed', async (c) => {
  // This could be protected with API key or admin auth
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkRedis(),
    checkExternalAPIs()
  ])
  
  const [dbCheck, redisCheck, apiCheck] = checks
  
  const allHealthy = checks.every(check => check.status === 'fulfilled' && check.value)
  
  const response: ApiResponse<{
    overall: 'healthy' | 'degraded' | 'unhealthy'
    checks: Record<string, any>
  }> = {
    success: true,
    data: {
      overall: allHealthy ? 'healthy' : 'degraded',
      checks: {
        database: dbCheck.status === 'fulfilled' ? dbCheck.value : 'error',
        redis: redisCheck.status === 'fulfilled' ? redisCheck.value : 'error',
        external_apis: apiCheck.status === 'fulfilled' ? apiCheck.value : 'error'
      }
    },
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  }
  
  return c.json(response, allHealthy ? 200 : 503)
})

// Health check helper functions
async function checkDatabase(): Promise<boolean> {
  try {
    // TODO: Add real database connection check
    // Example: await db.query('SELECT 1')
    return true
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}

async function checkRedis(): Promise<boolean> {
  try {
    // TODO: Add real Redis connection check
    // Example: await redis.ping()
    return true
  } catch (error) {
    console.error('Redis health check failed:', error)
    return false
  }
}

async function checkExternalAPIs(): Promise<boolean> {
  try {
    // TODO: Add checks for external services like Claude API
    return true
  } catch (error) {
    console.error('External API health check failed:', error)
    return false
  }
}

export { health as healthRoutes }