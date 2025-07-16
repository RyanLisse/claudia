import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { secureHeaders } from 'hono/secure-headers'
import { timing } from 'hono/timing'
// Rate limiter - built-in middleware
import { requestId } from 'hono/request-id'
// import { compress } from 'hono/compress' // Disabled due to CompressionStream issues

// Import routes
import { authRoutes } from './routes/auth.js'
import { userRoutes } from './routes/users.js'
import { healthRoutes } from './routes/health.js'
import { projectRoutes } from './routes/projects.js'
import { agentRoutes } from './routes/agents.js'
import { tasksEnhanced } from './routes/tasks-enhanced.js'

// Import middleware
import { errorHandler } from './middleware/error.js'
import { authMiddleware } from './middleware/auth.js'
import { validationMiddleware } from './middleware/validation.js'
import {
  environmentSecurity,
  securityPresets,
  securityAudit,
  threatDetection,
  securityMiddleware
} from './middleware/security.js'
import { apiSanitization } from './middleware/input-sanitization.js'

// Import WebSocket manager
import { createWebSocketManager } from './websocket/WebSocketManager.js'

// Import types
import type { Env } from './types/env.js'
import type { Variables } from './types/variables.js'

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

// ============================================================================
// SECURITY MIDDLEWARE SETUP (First line of defense)
// ============================================================================

// 1. Security Audit and Threat Detection (First line of defense)
app.use('*', securityAudit)
app.use('*', threatDetection)

// 2. Environment-based security configuration
app.use('*', environmentSecurity())

// 3. Input sanitization for all requests
app.use('*', apiSanitization)

// ============================================================================
// STANDARD MIDDLEWARE
// ============================================================================

// Global middleware
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'https://claudia.app'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true,
}))

app.use('*', secureHeaders())
// app.use('*', compress()) // Disabled due to CompressionStream issues
app.use('*', timing())
app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', requestId())

// Simple rate limiting middleware (production should use Redis-based solution)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

app.use('*', async (c, next) => {
  // Skip rate limiting in test environment
  if (process.env.NODE_ENV === 'test' || process.env.DISABLE_RATE_LIMITING === 'true') {
    await next()
    return
  }

  const ip = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'anonymous'
  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutes
  const limit = c.req.path.startsWith('/api/auth') ? 10 : 1000

  const key = `${ip}:${c.req.path.startsWith('/api/auth') ? 'auth' : 'general'}`
  let record = rateLimitStore.get(key)

  if (!record || now > record.resetTime) {
    record = { count: 0, resetTime: now + windowMs }
  }

  record.count++
  rateLimitStore.set(key, record)

  // Set rate limit headers
  c.res.headers.set('X-RateLimit-Limit', limit.toString())
  c.res.headers.set('X-RateLimit-Remaining', Math.max(0, limit - record.count).toString())
  c.res.headers.set('X-RateLimit-Reset', new Date(record.resetTime).toISOString())

  if (record.count > limit) {
    return c.json({
      success: false,
      error: 'Rate Limit Exceeded',
      message: 'Too many requests. Please try again later.',
      timestamp: new Date().toISOString()
    }, 429)
  }
  
  await next()
})

// ============================================================================
// PROTECTED API ROUTES
// ============================================================================

// Public routes (health check)
app.route('/api/health', healthRoutes)

// Authentication routes (with auth-specific security)
app.use('/api/auth/*', securityMiddleware.authProtected)
app.route('/api/auth', authRoutes)

// Protected API routes (require authentication + API security)
app.use('/api/users/*', authMiddleware)
app.use('/api/users/*', securityMiddleware.apiProtected)
app.route('/api/users', userRoutes)

app.use('/api/projects/*', authMiddleware)
app.use('/api/projects/*', securityMiddleware.apiProtected)
app.route('/api/projects', projectRoutes)

app.use('/api/agents/*', authMiddleware)
app.use('/api/agents/*', securityMiddleware.apiProtected)
app.route('/api/agents', agentRoutes)

app.use('/api/tasks/*', authMiddleware)
app.use('/api/tasks/*', securityMiddleware.apiProtected)
app.route('/api/tasks', tasksEnhanced)

// Root endpoint
app.get('/', (c) => {
  return c.json({
    name: 'Claudia API',
    version: '1.0.0',
    description: 'High-performance API server built with Hono and Bun',
    status: 'operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      projects: '/api/projects',
      agents: '/api/agents',
      tasks: '/api/tasks',
      docs: '/docs',
      websocket: '/ws'
    }
  })
})

// API documentation
app.get('/docs', (c) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Claudia API Documentation</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <div id="toc"></div>
        <script
          id="api-reference"
          data-url="/openapi.json"
          data-configuration='{"theme":"alternate"}'
        ></script>
        <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
      </body>
    </html>
  `
  return c.html(html)
})

// OpenAPI specification
app.get('/openapi.json', (c) => {
  return c.json({
    openapi: '3.0.0',
    info: {
      title: 'Claudia API',
      version: '1.0.0',
      description: 'High-performance API server for Claudia application'
    },
    servers: [
      { url: 'http://localhost:3001', description: 'Development server' },
      { url: 'https://api.claudia.app', description: 'Production server' }
    ],
    paths: {
      '/api/health': {
        get: {
          summary: 'Health check',
          responses: {
            '200': {
              description: 'Service is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  })
})

// Global error handler
app.onError(errorHandler)

// 404 handler
app.notFound((c) => {
  return c.json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
    timestamp: new Date().toISOString()
  }, 404)
})

const port = process.env.PORT || 3001
const wsPort = parseInt(process.env.WS_PORT || '3002')

console.log(`🚀 Claudia API server starting on port ${port}`)
console.log(`🔌 WebSocket server starting on port ${wsPort}`)

// Initialize WebSocket server
const wsManager = createWebSocketManager(wsPort)

export default {
  port,
  fetch: app.fetch,
}