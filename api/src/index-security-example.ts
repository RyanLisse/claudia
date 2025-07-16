import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { timing } from 'hono/timing'
import { requestId } from 'hono/request-id'
import { compress } from 'hono/compress'

// Import routes
import { authRoutes } from './routes/auth.js'
import { userRoutes } from './routes/users.js'
import { healthRoutes } from './routes/health.js'
import { projectRoutes } from './routes/projects.js'
import { agentRoutes } from './routes/agents.js'
import { tasksEnhanced } from './routes/tasks-enhanced.js'

// Import comprehensive security middleware
import { 
  securityPresets,
  securityMiddleware,
  environmentSecurity,
  securityAudit,
  threatDetection,
  authMiddleware,
  apiKeyAuth,
  requirePermission,
  requireRole
} from './middleware/index.js'

// Import error handler
import { errorHandler } from './middleware/error.js'

// Import WebSocket manager
import { createWebSocketManager } from './websocket/WebSocketManager.js'

// Import types
import type { Env } from './types/env.js'
import type { Variables } from './types/variables.js'

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

// ============================================================================
// SECURITY MIDDLEWARE SETUP
// ============================================================================

// 1. Security Audit and Threat Detection (First line of defense)
app.use('*', securityAudit)
app.use('*', threatDetection)

// 2. Environment-based security (automatically configures based on NODE_ENV)
app.use('*', environmentSecurity())

// 3. Standard middleware (after security)
app.use('*', compress())
app.use('*', timing())
app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', requestId())

// ============================================================================
// ROUTE-SPECIFIC SECURITY
// ============================================================================

// Health check - Public endpoint with basic protection
app.route('/api/health', healthRoutes)

// Authentication routes - Special protection for auth endpoints
app.use('/api/auth/*', securityPresets.auth)
app.route('/api/auth', authRoutes)

// Public API routes - Standard API protection
app.use('/api/users/*', securityMiddleware.apiProtected)
app.use('/api/projects/*', securityMiddleware.apiProtected)
app.use('/api/agents/*', securityMiddleware.apiProtected)
app.use('/api/tasks/*', securityMiddleware.apiProtected)

// Protected API routes with authentication
app.use('/api/users/*', authMiddleware)
app.use('/api/projects/*', authMiddleware)
app.use('/api/agents/*', authMiddleware)
app.use('/api/tasks/*', authMiddleware)

// Admin routes with strict security and role-based access
app.use('/api/admin/*', securityMiddleware.adminProtected)
app.use('/api/admin/*', authMiddleware)
app.use('/api/admin/*', requireRole('admin'))

// API Key protected routes (alternative to JWT)
app.use('/api/public/*', securityMiddleware.apiProtected)
app.use('/api/public/*', apiKeyAuth)

// Webhook routes with webhook-specific security
app.use('/api/webhook/*', securityMiddleware.webhookProtected)

// ============================================================================
// ROUTE REGISTRATION
// ============================================================================

app.route('/api/users', userRoutes)
app.route('/api/projects', projectRoutes)
app.route('/api/agents', agentRoutes)
app.route('/api/tasks', tasksEnhanced)

// ============================================================================
// ROOT AND DOCUMENTATION ENDPOINTS
// ============================================================================

// Root endpoint with basic security
app.get('/', securityMiddleware.publicProtected, (c) => {
  return c.json({
    name: 'Claudia API',
    version: '1.0.0',
    description: 'High-performance API server built with Hono and Bun',
    status: 'operational',
    timestamp: new Date().toISOString(),
    security: {
      cors: 'enabled',
      rateLimit: 'enabled',
      inputSanitization: 'enabled',
      securityHeaders: 'enabled',
      authentication: 'JWT + API Key',
      environment: process.env.NODE_ENV || 'development'
    },
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

// API documentation with public protection
app.get('/docs', securityMiddleware.publicProtected, (c) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Claudia API Documentation</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline';" />
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
app.get('/openapi.json', securityMiddleware.publicProtected, (c) => {
  return c.json({
    openapi: '3.0.0',
    info: {
      title: 'Claudia API',
      version: '1.0.0',
      description: 'High-performance API server for Claudia application with comprehensive security'
    },
    servers: [
      { url: 'http://localhost:3001', description: 'Development server' },
      { url: 'https://api.claudia.app', description: 'Production server' }
    ],
    security: [
      { bearerAuth: [] },
      { apiKeyAuth: [] }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      }
    },
    paths: {
      '/api/health': {
        get: {
          summary: 'Health check',
          security: [],
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
      },
      '/api/auth/login': {
        post: {
          summary: 'User authentication',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8 }
                  },
                  required: ['email', 'password']
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Authentication successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      token: { type: 'string' },
                      user: { type: 'object' }
                    }
                  }
                }
              }
            },
            '401': {
              description: 'Authentication failed'
            },
            '429': {
              description: 'Rate limit exceeded'
            }
          }
        }
      },
      '/api/users': {
        get: {
          summary: 'Get users',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'List of users',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { type: 'object' }
                  }
                }
              }
            },
            '401': {
              description: 'Authentication required'
            },
            '429': {
              description: 'Rate limit exceeded'
            }
          }
        }
      }
    }
  })
})

// ============================================================================
// SECURITY MONITORING ENDPOINTS (Admin only)
// ============================================================================

// Security status endpoint
app.get('/api/admin/security/status', 
  securityMiddleware.adminProtected,
  authMiddleware,
  requireRole('admin'),
  (c) => {
    return c.json({
      security: {
        cors: {
          enabled: true,
          origins: process.env.NODE_ENV === 'production' ? ['https://claudia.app'] : ['*']
        },
        rateLimit: {
          enabled: true,
          windows: {
            auth: '15 minutes',
            api: '1 minute',
            general: '15 minutes'
          }
        },
        headers: {
          csp: 'enabled',
          xss: 'enabled',
          frame: 'deny',
          contentType: 'nosniff'
        },
        authentication: {
          jwt: 'enabled',
          apiKey: 'enabled',
          sessionTimeout: process.env.JWT_EXPIRES_IN || '1h'
        },
        inputSanitization: {
          xss: 'enabled',
          sqlInjection: 'enabled',
          pathTraversal: 'enabled'
        }
      },
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    })
  }
)

// Security audit logs endpoint
app.get('/api/admin/security/audit', 
  securityMiddleware.adminProtected,
  authMiddleware,
  requireRole('admin'),
  (c) => {
    // In production, this would fetch from your logging system
    return c.json({
      message: 'Security audit logs endpoint',
      note: 'In production, this would return actual audit logs from your logging system',
      timestamp: new Date().toISOString()
    })
  }
)

// ============================================================================
// ERROR HANDLING
// ============================================================================

// Global error handler
app.onError(errorHandler)

// 404 handler with basic security
app.notFound((c) => {
  return c.json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
    timestamp: new Date().toISOString()
  }, 404)
})

// ============================================================================
// SERVER STARTUP
// ============================================================================

const port = process.env.PORT || 3001
const wsPort = parseInt(process.env.WS_PORT || '3002')

console.log(`🚀 Claudia API server starting on port ${port}`)
console.log(`🔌 WebSocket server starting on port ${wsPort}`)
console.log(`🔒 Security level: ${process.env.NODE_ENV || 'development'}`)
console.log(`🛡️  Security features: CORS, Rate Limiting, Input Sanitization, Security Headers, JWT Auth, API Key Auth`)

// Initialize WebSocket server
const wsManager = createWebSocketManager(wsPort)

export default {
  port,
  fetch: app.fetch,
}

// ============================================================================
// SECURITY CONFIGURATION SUMMARY
// ============================================================================

/*
SECURITY MIDDLEWARE APPLIED:

1. Security Audit & Threat Detection:
   - Logs all security events
   - Detects suspicious user agents
   - Monitors for unusual request patterns

2. Environment-based Security:
   - Production: Strict CORS, strict headers, moderate rate limiting
   - Development: Permissive CORS, dev headers, no rate limiting
   - Test: Minimal security for testing

3. Route-specific Security:
   - /api/health: Public access
   - /api/auth/*: Strict rate limiting, XSS protection
   - /api/users/*: JWT auth required, API protection
   - /api/admin/*: Admin role required, strict security
   - /api/public/*: API key auth, standard protection
   - /api/webhook/*: Webhook-specific security

4. Input Sanitization:
   - XSS protection on all inputs
   - SQL injection prevention
   - Path traversal protection
   - HTML tag filtering

5. Rate Limiting:
   - Auth endpoints: 10 requests/15 minutes
   - API endpoints: 60 requests/minute
   - General: 100 requests/15 minutes

6. Security Headers:
   - Content Security Policy
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff
   - X-XSS-Protection: 1; mode=block
   - Strict-Transport-Security (production)

7. CORS Configuration:
   - Production: Specific origins only
   - Development: Localhost domains
   - Credentials: Enabled for authenticated requests

8. Authentication:
   - JWT with proper validation
   - API key authentication
   - Role-based access control
   - Session hijacking protection

ENVIRONMENT VARIABLES REQUIRED:
- JWT_SECRET: Strong secret for JWT signing
- JWT_EXPIRES_IN: Token expiration time
- API_KEY: API key for public endpoints
- NODE_ENV: Environment (production/development/test)
- REDIS_URL: Redis URL for rate limiting (optional)

PRODUCTION CHECKLIST:
- [ ] Set strong JWT_SECRET
- [ ] Configure allowed CORS origins
- [ ] Set up Redis for rate limiting
- [ ] Enable HTTPS
- [ ] Monitor security logs
- [ ] Regular security audits
- [ ] Keep dependencies updated
*/