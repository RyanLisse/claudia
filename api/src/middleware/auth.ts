import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import * as jose from 'jose'
import type { User } from '../types/variables.js'
import { authRateLimit } from './rate-limiter.js'

// Mock user database (replace with real database in production)
const users: User[] = [
  {
    id: '1',
    email: 'admin@claudia.app',
    // Hash for 'admin123' - bcrypt hash
    password: '$2a$10$g2hunHl.dp3jZxMuZieymeinEpmGBgfq0AvtUtFLO0L/HyulUQUW2',
    role: 'admin',
    permissions: ['read', 'write', 'delete', 'admin'],
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  },
  {
    id: '2',
    email: 'user@claudia.app',
    password: '$2a$10$dummy.hash.for.testing.purposes.only',
    role: 'user',
    permissions: ['read', 'write'],
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  }
]

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Unauthorized: Missing or invalid authorization header' })
  }
  
  const token = authHeader.substring(7) // Remove 'Bearer ' prefix
  
  // Check token length and format
  if (token.length < 10 || token.length > 2048) {
    throw new HTTPException(401, { message: 'Unauthorized: Invalid token format' })
  }
  
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-key')
    
    // Verify token with additional security checks
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: ['HS256'], // Only allow specific algorithm
      audience: process.env.JWT_AUDIENCE || 'claudia-api',
      issuer: process.env.JWT_ISSUER || 'claudia-api',
      clockTolerance: 30 // 30 seconds clock tolerance
    })
    
    // Find user by ID from token
    const user = users.find(u => u.id === payload.sub && u.isActive)
    
    if (!user) {
      throw new HTTPException(401, { message: 'Unauthorized: User not found or inactive' })
    }
    
    // Check for session hijacking (IP address change)
    const currentIp = c.req.header('CF-Connecting-IP') || 
                     c.req.header('X-Real-IP') || 
                     c.req.header('X-Forwarded-For')?.split(',')[0]
    
    if (payload.ip && currentIp && payload.ip !== currentIp) {
      console.warn(`[SECURITY] IP address changed for user ${user.id}: ${payload.ip} -> ${currentIp}`)
      // In production, you might want to require re-authentication
    }
    
    // Set user in context with additional security info
    c.set('user', {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      lastActivity: new Date(),
      sessionId: payload.sid || 'unknown',
      ip: currentIp
    })
    
    await next()
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    
    // Log security event
    console.warn(`[SECURITY] Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    
    // Different error messages for different failure types
    if (error instanceof jose.errors.JWTExpired) {
      throw new HTTPException(401, { message: 'Unauthorized: Token expired' })
    } else if (error instanceof jose.errors.JWTInvalid) {
      throw new HTTPException(401, { message: 'Unauthorized: Invalid token' })
    } else if (error instanceof jose.errors.JWTClaimValidationFailed) {
      throw new HTTPException(401, { message: 'Unauthorized: Invalid token claims' })
    }
    
    throw new HTTPException(401, { message: 'Unauthorized: Authentication failed' })
  }
})

export const requirePermission = (permission: string) => {
  return createMiddleware(async (c, next) => {
    const user = c.get('user')
    
    if (!user) {
      throw new HTTPException(401, { message: 'Unauthorized: No user context' })
    }
    
    if (!user.permissions.includes(permission) && !user.permissions.includes('admin')) {
      throw new HTTPException(403, { message: `Forbidden: Missing ${permission} permission` })
    }
    
    await next()
  })
}

export const requireRole = (role: string) => {
  return createMiddleware(async (c, next) => {
    const user = c.get('user')
    
    if (!user) {
      throw new HTTPException(401, { message: 'Unauthorized: No user context' })
    }
    
    if (user.role !== role && user.role !== 'admin') {
      throw new HTTPException(403, { message: `Forbidden: Requires ${role} role` })
    }
    
    await next()
  })
}

export const optionalAuth = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-key')
      const { payload } = await jose.jwtVerify(token, secret)
      
      const user = users.find(u => u.id === payload.sub && u.isActive)
      
      if (user) {
        c.set('user', {
          id: user.id,
          email: user.email,
          role: user.role,
          permissions: user.permissions
        })
      }
    } catch (error) {
      // Ignore invalid tokens for optional auth
      console.warn('Optional auth failed:', error)
    }
  }
  
  await next()
})

// API Key authentication middleware with enhanced security
export const apiKeyAuth = createMiddleware(async (c, next) => {
  const apiKey = c.req.header('X-API-Key')
  const expectedApiKey = process.env.API_KEY
  
  if (!apiKey) {
    throw new HTTPException(401, { message: 'Unauthorized: Missing API key' })
  }
  
  // Check API key format and length
  if (apiKey.length < 32 || apiKey.length > 128) {
    throw new HTTPException(401, { message: 'Unauthorized: Invalid API key format' })
  }
  
  if (!expectedApiKey || apiKey !== expectedApiKey) {
    // Log failed API key attempt
    const ip = c.req.header('CF-Connecting-IP') || 
              c.req.header('X-Real-IP') || 
              c.req.header('X-Forwarded-For')?.split(',')[0] || 
              'unknown'
    console.warn(`[SECURITY] Invalid API key attempt from ${ip}: ${apiKey.substring(0, 8)}...`)
    
    throw new HTTPException(401, { message: 'Unauthorized: Invalid API key' })
  }
  
  // Set API key info in context
  c.set('apiAuth', {
    keyId: apiKey.substring(0, 8),
    ip: c.req.header('CF-Connecting-IP') || 
        c.req.header('X-Real-IP') || 
        c.req.header('X-Forwarded-For')?.split(',')[0] || 
        'unknown',
    timestamp: new Date()
  })
  
  await next()
})

// Get user data by ID (helper function)
export const getUserById = (id: string): User | undefined => {
  return users.find(u => u.id === id && u.isActive)
}

// Get user data by email (helper function)
export const getUserByEmail = (email: string): User | undefined => {
  return users.find(u => u.email === email && u.isActive)
}