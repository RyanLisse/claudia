import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'

interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  max: number // Maximum requests per window
  message?: string // Custom error message
  skipSuccessfulRequests?: boolean // Don't count successful requests
  skipFailedRequests?: boolean // Don't count failed requests
  keyGenerator?: (c: any) => string // Custom key generator
  onLimitReached?: (c: any) => void // Callback when limit is reached
}

interface RateLimitInfo {
  count: number
  resetTime: number
  blocked: boolean
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, RateLimitInfo>()

export const rateLimiter = (options: RateLimitOptions) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // 100 requests per window
    message = 'Too many requests from this IP, please try again later',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = (c) => getClientIP(c) || 'unknown',
    onLimitReached
  } = options

  return createMiddleware(async (c, next) => {
    const key = keyGenerator(c)
    const now = Date.now()
    
    // Clean up expired entries
    for (const [k, v] of rateLimitStore.entries()) {
      if (now > v.resetTime) {
        rateLimitStore.delete(k)
      }
    }
    
    // Get or create rate limit info
    let info = rateLimitStore.get(key)
    if (!info || now > info.resetTime) {
      info = {
        count: 0,
        resetTime: now + windowMs,
        blocked: false
      }
      rateLimitStore.set(key, info)
    }
    
    // Check if limit exceeded
    if (info.count >= max) {
      info.blocked = true
      if (onLimitReached) {
        onLimitReached(c)
      }
      
      // Set rate limit headers
      c.header('X-RateLimit-Limit', max.toString())
      c.header('X-RateLimit-Remaining', '0')
      c.header('X-RateLimit-Reset', Math.ceil(info.resetTime / 1000).toString())
      c.header('Retry-After', Math.ceil((info.resetTime - now) / 1000).toString())
      
      throw new HTTPException(429, { message })
    }
    
    // Increment counter if not skipping
    const shouldCount = !skipSuccessfulRequests && !skipFailedRequests
    if (shouldCount) {
      info.count++
    }
    
    // Set rate limit headers
    c.header('X-RateLimit-Limit', max.toString())
    c.header('X-RateLimit-Remaining', Math.max(0, max - info.count).toString())
    c.header('X-RateLimit-Reset', Math.ceil(info.resetTime / 1000).toString())
    
    await next()
    
    // Handle selective counting after response
    if (!shouldCount) {
      const status = c.res.status
      const shouldCountNow = 
        (!skipSuccessfulRequests && status < 400) ||
        (!skipFailedRequests && status >= 400)
      
      if (shouldCountNow) {
        info.count++
      }
    }
  })
}

// Helper function to get client IP
function getClientIP(c: any): string | null {
  return (
    c.req.header('CF-Connecting-IP') || // Cloudflare
    c.req.header('X-Real-IP') || // Nginx proxy
    c.req.header('X-Forwarded-For')?.split(',')[0] || // Load balancer
    c.req.header('X-Client-IP') || // Apache
    c.req.header('X-Forwarded') || // General proxy
    c.req.header('X-Cluster-Client-IP') || // Cluster
    c.req.header('Forwarded')?.match(/for=([^;]+)/)?.[1] || // RFC 7239
    c.env?.incoming?.socket?.remoteAddress || // Direct connection
    null
  )
}

// Predefined rate limiters for common use cases
export const strictRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many requests. Please try again in 15 minutes.'
})

export const moderateRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Request limit exceeded. Please try again later.'
})

export const lenientRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window
  message: 'Request limit exceeded. Please try again later.'
})

// API-specific rate limiters
export const authRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per window
  message: 'Too many login attempts. Please try again in 15 minutes.',
  skipSuccessfulRequests: true // Only count failed login attempts
})

export const apiRateLimit = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'API rate limit exceeded. Please try again later.'
})

export const uploadRateLimit = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: 'Upload limit exceeded. Please try again in an hour.'
})

// Rate limiter with custom key (e.g., by user ID)
export const userRateLimit = (userId: string, options: Partial<RateLimitOptions> = {}) => {
  return rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    keyGenerator: () => `user:${userId}`,
    ...options
  })
}

// Clear rate limit for a specific key (admin function)
export const clearRateLimit = (key: string): boolean => {
  return rateLimitStore.delete(key)
}

// Get rate limit info for a specific key
export const getRateLimitInfo = (key: string): RateLimitInfo | undefined => {
  return rateLimitStore.get(key)
}

// Reset all rate limits (admin function)
export const resetAllRateLimits = (): void => {
  rateLimitStore.clear()
}