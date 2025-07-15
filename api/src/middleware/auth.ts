import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import * as jose from 'jose'
import type { User } from '../types/variables.js'

// Mock user database (replace with real database in production)
const users: User[] = [
  {
    id: '1',
    email: 'admin@claudia.app',
    password: '$2a$10$dummy.hash.for.testing.purposes.only',
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
  
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-key')
    const { payload } = await jose.jwtVerify(token, secret)
    
    // Find user by ID from token
    const user = users.find(u => u.id === payload.sub && u.isActive)
    
    if (!user) {
      throw new HTTPException(401, { message: 'Unauthorized: User not found or inactive' })
    }
    
    // Set user in context
    c.set('user', {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    })
    
    await next()
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    throw new HTTPException(401, { message: 'Unauthorized: Invalid token' })
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

// API Key authentication middleware
export const apiKeyAuth = createMiddleware(async (c, next) => {
  const apiKey = c.req.header('X-API-Key')
  const expectedApiKey = process.env.API_KEY
  
  if (!apiKey) {
    throw new HTTPException(401, { message: 'Unauthorized: Missing API key' })
  }
  
  if (!expectedApiKey || apiKey !== expectedApiKey) {
    throw new HTTPException(401, { message: 'Unauthorized: Invalid API key' })
  }
  
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