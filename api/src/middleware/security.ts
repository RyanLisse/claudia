import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { cors, environmentCors, strictCors, devCors, apiCors } from './cors.js'
import { securityHeaders, environmentSecurityHeaders, strictSecurityHeaders, apiSecurityHeaders } from './security-headers.js'
import { rateLimiter, moderateRateLimit, strictRateLimit, authRateLimit, apiRateLimit } from './rate-limiter.js'
import { inputSanitization, strictSanitization, apiSanitization, moderateSanitization } from './input-sanitization.js'

export interface SecurityConfig {
  enableCors?: boolean
  enableSecurityHeaders?: boolean
  enableRateLimit?: boolean
  enableInputSanitization?: boolean
  corsOptions?: 'strict' | 'dev' | 'api' | 'auto'
  securityHeadersOptions?: 'strict' | 'dev' | 'api' | 'auto'
  rateLimitOptions?: 'strict' | 'moderate' | 'lenient' | 'auth' | 'api' | 'custom'
  sanitizationOptions?: 'strict' | 'moderate' | 'lenient' | 'api' | 'custom'
  customRateLimit?: any
  customSanitization?: any
  trustedProxies?: string[]
  allowedOrigins?: string[]
  maxRequestSize?: number
  enableRequestLogging?: boolean
}

// Main security middleware factory
export const security = (config: SecurityConfig = {}) => {
  const {
    enableCors = true,
    enableSecurityHeaders = true,
    enableRateLimit = true,
    enableInputSanitization = true,
    corsOptions = 'auto',
    securityHeadersOptions = 'auto',
    rateLimitOptions = 'moderate',
    sanitizationOptions = 'strict',
    customRateLimit,
    customSanitization,
    trustedProxies = [],
    allowedOrigins = [],
    maxRequestSize = 1024 * 1024, // 1MB
    enableRequestLogging = false
  } = config

  return createMiddleware(async (c, next) => {
    // Request logging
    if (enableRequestLogging) {
      console.log(`[${new Date().toISOString()}] ${c.req.method} ${c.req.url} - ${c.req.header('User-Agent')}`)
    }

    // Request size check
    const contentLength = c.req.header('Content-Length')
    if (contentLength && parseInt(contentLength) > maxRequestSize) {
      throw new HTTPException(413, { message: 'Request entity too large' })
    }

    // Apply CORS
    if (enableCors) {
      let corsMiddleware
      switch (corsOptions) {
        case 'strict':
          corsMiddleware = strictCors
          break
        case 'dev':
          corsMiddleware = devCors
          break
        case 'api':
          corsMiddleware = apiCors
          break
        case 'auto':
          corsMiddleware = environmentCors()
          break
        default:
          corsMiddleware = cors()
      }
      await corsMiddleware(c, () => Promise.resolve())
    }

    // Apply security headers
    if (enableSecurityHeaders) {
      let headersMiddleware
      switch (securityHeadersOptions) {
        case 'strict':
          headersMiddleware = strictSecurityHeaders
          break
        case 'api':
          headersMiddleware = apiSecurityHeaders
          break
        case 'auto':
          headersMiddleware = environmentSecurityHeaders()
          break
        default:
          headersMiddleware = securityHeaders()
      }
      await headersMiddleware(c, () => Promise.resolve())
    }

    // Apply rate limiting
    if (enableRateLimit) {
      let rateLimitMiddleware
      
      if (customRateLimit) {
        rateLimitMiddleware = customRateLimit
      } else {
        switch (rateLimitOptions) {
          case 'strict':
            rateLimitMiddleware = strictRateLimit
            break
          case 'moderate':
            rateLimitMiddleware = moderateRateLimit
            break
          case 'auth':
            rateLimitMiddleware = authRateLimit
            break
          case 'api':
            rateLimitMiddleware = apiRateLimit
            break
          default:
            rateLimitMiddleware = moderateRateLimit
        }
      }
      
      await rateLimitMiddleware(c, () => Promise.resolve())
    }

    // Apply input sanitization
    if (enableInputSanitization) {
      let sanitizationMiddleware
      
      if (customSanitization) {
        sanitizationMiddleware = customSanitization
      } else {
        switch (sanitizationOptions) {
          case 'strict':
            sanitizationMiddleware = strictSanitization
            break
          case 'moderate':
            sanitizationMiddleware = moderateSanitization
            break
          case 'api':
            sanitizationMiddleware = apiSanitization
            break
          default:
            sanitizationMiddleware = strictSanitization
        }
      }
      
      await sanitizationMiddleware(c, () => Promise.resolve())
    }

    await next()
  })
}

// Preset security configurations
export const securityPresets = {
  // Maximum security for production
  production: security({
    enableCors: true,
    enableSecurityHeaders: true,
    enableRateLimit: true,
    enableInputSanitization: true,
    corsOptions: 'strict',
    securityHeadersOptions: 'strict',
    rateLimitOptions: 'moderate',
    sanitizationOptions: 'strict',
    maxRequestSize: 1024 * 1024, // 1MB
    enableRequestLogging: true
  }),

  // Development configuration
  development: security({
    enableCors: true,
    enableSecurityHeaders: true,
    enableRateLimit: false,
    enableInputSanitization: true,
    corsOptions: 'dev',
    securityHeadersOptions: 'dev',
    sanitizationOptions: 'moderate',
    maxRequestSize: 10 * 1024 * 1024, // 10MB
    enableRequestLogging: true
  }),

  // API-specific security
  api: security({
    enableCors: true,
    enableSecurityHeaders: true,
    enableRateLimit: true,
    enableInputSanitization: true,
    corsOptions: 'api',
    securityHeadersOptions: 'api',
    rateLimitOptions: 'api',
    sanitizationOptions: 'api',
    maxRequestSize: 1024 * 1024, // 1MB
    enableRequestLogging: false
  }),

  // Authentication endpoints
  auth: security({
    enableCors: true,
    enableSecurityHeaders: true,
    enableRateLimit: true,
    enableInputSanitization: true,
    corsOptions: 'strict',
    securityHeadersOptions: 'strict',
    rateLimitOptions: 'auth',
    sanitizationOptions: 'strict',
    maxRequestSize: 64 * 1024, // 64KB
    enableRequestLogging: true
  }),

  // Admin endpoints
  admin: security({
    enableCors: true,
    enableSecurityHeaders: true,
    enableRateLimit: true,
    enableInputSanitization: true,
    corsOptions: 'strict',
    securityHeadersOptions: 'strict',
    rateLimitOptions: 'strict',
    sanitizationOptions: 'moderate',
    maxRequestSize: 5 * 1024 * 1024, // 5MB
    enableRequestLogging: true
  }),

  // Public endpoints
  public: security({
    enableCors: true,
    enableSecurityHeaders: true,
    enableRateLimit: true,
    enableInputSanitization: true,
    corsOptions: 'api',
    securityHeadersOptions: 'api',
    rateLimitOptions: 'moderate',
    sanitizationOptions: 'strict',
    maxRequestSize: 256 * 1024, // 256KB
    enableRequestLogging: false
  }),

  // Webhook endpoints
  webhook: security({
    enableCors: false,
    enableSecurityHeaders: true,
    enableRateLimit: true,
    enableInputSanitization: false, // Webhooks often have specific formats
    securityHeadersOptions: 'api',
    rateLimitOptions: 'moderate',
    maxRequestSize: 1024 * 1024, // 1MB
    enableRequestLogging: true
  })
}

// Environment-based security
export const environmentSecurity = () => {
  const env = process.env.NODE_ENV || 'development'
  
  switch (env) {
    case 'production':
      return securityPresets.production
    case 'development':
      return securityPresets.development
    case 'test':
      return security({ enableRateLimit: false, enableRequestLogging: false })
    default:
      return securityPresets.development
  }
}

// Security middleware with specific protections
export const securityMiddleware = {
  // JWT authentication with rate limiting
  authProtected: createMiddleware(async (c, next) => {
    await securityPresets.auth(c, () => Promise.resolve())
    await next()
  }),

  // API endpoints with standard protection
  apiProtected: createMiddleware(async (c, next) => {
    await securityPresets.api(c, () => Promise.resolve())
    await next()
  }),

  // Admin endpoints with strict protection
  adminProtected: createMiddleware(async (c, next) => {
    await securityPresets.admin(c, () => Promise.resolve())
    await next()
  }),

  // Public endpoints with basic protection
  publicProtected: createMiddleware(async (c, next) => {
    await securityPresets.public(c, () => Promise.resolve())
    await next()
  }),

  // Webhook endpoints with webhook-specific protection
  webhookProtected: createMiddleware(async (c, next) => {
    await securityPresets.webhook(c, () => Promise.resolve())
    await next()
  })
}

// Security audit middleware
export const securityAudit = createMiddleware(async (c, next) => {
  const startTime = Date.now()
  const userAgent = c.req.header('User-Agent') || 'unknown'
  const ip = c.req.header('CF-Connecting-IP') || 
            c.req.header('X-Real-IP') || 
            c.req.header('X-Forwarded-For')?.split(',')[0] || 
            'unknown'

  // Log security-relevant request details
  console.log(`[SECURITY AUDIT] ${c.req.method} ${c.req.url}`, {
    ip,
    userAgent,
    timestamp: new Date().toISOString(),
    headers: Object.fromEntries(
      Object.entries(c.req.header()).filter(([key]) => 
        ['authorization', 'x-api-key', 'content-type', 'origin'].includes(key.toLowerCase())
      )
    )
  })

  await next()

  const endTime = Date.now()
  const duration = endTime - startTime
  
  // Log response details
  console.log(`[SECURITY AUDIT] Response ${c.res.status}`, {
    duration,
    size: c.res.headers.get('content-length') || 'unknown'
  })
})

// Threat detection middleware
export const threatDetection = createMiddleware(async (c, next) => {
  const userAgent = c.req.header('User-Agent') || ''
  const ip = c.req.header('CF-Connecting-IP') || 
            c.req.header('X-Real-IP') || 
            c.req.header('X-Forwarded-For')?.split(',')[0] || 
            'unknown'

  // Check for suspicious user agents
  const suspiciousUserAgents = [
    'sqlmap',
    'nmap',
    'nikto',
    'dirb',
    'gobuster',
    'wfuzz',
    'burp',
    'owasp',
    'scanner'
  ]

  if (suspiciousUserAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
    console.warn(`[THREAT DETECTION] Suspicious user agent from ${ip}: ${userAgent}`)
    throw new HTTPException(403, { message: 'Suspicious activity detected' })
  }

  // Check for rapid requests from same IP (simple bot detection)
  // This would typically use Redis or a more sophisticated system
  const requestKey = `requests:${ip}`
  // Implementation would depend on your caching system

  await next()
})

// Export individual components for custom configurations
export {
  cors,
  securityHeaders,
  rateLimiter,
  inputSanitization
} from './cors.js'

export * from './security-headers.js'
export * from './rate-limiter.js'
export * from './input-sanitization.js'