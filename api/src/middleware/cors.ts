import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'

interface CorsOptions {
  origin?: string | string[] | ((origin: string) => boolean)
  methods?: string[]
  allowedHeaders?: string[]
  exposedHeaders?: string[]
  credentials?: boolean
  maxAge?: number
  preflightContinue?: boolean
  optionsSuccessStatus?: number
}

export const cors = (options: CorsOptions = {}) => {
  const {
    origin = '*',
    methods = ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders = ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key'],
    exposedHeaders = [],
    credentials = false,
    maxAge = 86400, // 24 hours
    preflightContinue = false,
    optionsSuccessStatus = 204
  } = options

  return createMiddleware(async (c, next) => {
    const requestOrigin = c.req.header('Origin')
    const requestMethod = c.req.method
    
    // Handle origin validation
    let allowedOrigin: string | null = null
    
    if (typeof origin === 'string') {
      allowedOrigin = origin
    } else if (Array.isArray(origin)) {
      if (requestOrigin && origin.includes(requestOrigin)) {
        allowedOrigin = requestOrigin
      }
    } else if (typeof origin === 'function') {
      if (requestOrigin && origin(requestOrigin)) {
        allowedOrigin = requestOrigin
      }
    }
    
    // Set CORS headers
    if (allowedOrigin) {
      c.header('Access-Control-Allow-Origin', allowedOrigin)
    }
    
    if (credentials) {
      c.header('Access-Control-Allow-Credentials', 'true')
    }
    
    if (exposedHeaders.length > 0) {
      c.header('Access-Control-Expose-Headers', exposedHeaders.join(', '))
    }
    
    // Handle preflight requests
    if (requestMethod === 'OPTIONS') {
      c.header('Access-Control-Allow-Methods', methods.join(', '))
      c.header('Access-Control-Allow-Headers', allowedHeaders.join(', '))
      c.header('Access-Control-Max-Age', maxAge.toString())
      
      if (!preflightContinue) {
        return c.text('', optionsSuccessStatus)
      }
    }
    
    await next()
  })
}

// Strict CORS for production
export const strictCors = cors({
  origin: (origin: string) => {
    const allowedOrigins = [
      'https://claudia.app',
      'https://app.claudia.app',
      'https://admin.claudia.app'
    ]
    return allowedOrigins.includes(origin)
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Requested-With'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400
})

// Development CORS (more permissive)
export const devCors = cors({
  origin: (origin: string) => {
    // Allow localhost and development domains
    return origin.includes('localhost') || 
           origin.includes('127.0.0.1') ||
           origin.includes('0.0.0.0') ||
           origin.includes('.dev') ||
           origin.includes('.local')
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Requested-With'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
})

// API-only CORS (no credentials)
export const apiCors = cors({
  origin: '*',
  credentials: false,
  allowedHeaders: ['Content-Type', 'X-API-Key', 'X-Requested-With'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
})

// Webhook CORS (very restrictive)
export const webhookCors = cors({
  origin: (origin: string) => {
    const allowedServices = [
      'github.com',
      'gitlab.com',
      'bitbucket.org',
      'stripe.com',
      'paypal.com'
    ]
    return allowedServices.some(service => origin.includes(service))
  },
  methods: ['POST'],
  allowedHeaders: ['Content-Type', 'X-Hub-Signature', 'X-GitHub-Event', 'X-GitLab-Event'],
  credentials: false
})

// Admin CORS (very strict)
export const adminCors = cors({
  origin: ['https://admin.claudia.app'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Key'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 3600 // 1 hour
})

// Environment-based CORS
export const environmentCors = () => {
  const env = process.env.NODE_ENV || 'development'
  
  switch (env) {
    case 'production':
      return strictCors
    case 'development':
      return devCors
    case 'test':
      return cors({ origin: '*', credentials: false })
    default:
      return devCors
  }
}

// CORS middleware with custom validation
export const corsWithValidation = (allowedOrigins: string[] = []) => {
  return createMiddleware(async (c, next) => {
    const requestOrigin = c.req.header('Origin')
    
    // Block requests without origin (except for same-origin)
    if (!requestOrigin && c.req.header('Host')) {
      const host = c.req.header('Host')
      const referer = c.req.header('Referer')
      
      if (referer && !referer.includes(host)) {
        throw new HTTPException(403, { message: 'Invalid origin' })
      }
    }
    
    // Validate origin against allowlist
    if (requestOrigin && allowedOrigins.length > 0) {
      const isAllowed = allowedOrigins.some(allowed => {
        // Support wildcards
        if (allowed.includes('*')) {
          const pattern = allowed.replace(/\*/g, '.*')
          return new RegExp(pattern).test(requestOrigin)
        }
        return requestOrigin === allowed
      })
      
      if (!isAllowed) {
        throw new HTTPException(403, { message: 'Origin not allowed' })
      }
    }
    
    await cors({
      origin: requestOrigin || '*',
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Requested-With'],
      exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
    })(c, next)
  })
}