import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import * as jose from 'jose'
import * as bcrypt from 'bcryptjs'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import type { Env } from '../types/env.js'
import type { Variables, ApiResponse, User } from '../types/variables.js'
import { getUserByEmail, getUserById } from '../middleware/auth.js'

const auth = new Hono<{ Bindings: Env; Variables: Variables }>()

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional().default(false)
})

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain lowercase, uppercase, and number'),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(val => val === true, 'Must accept terms and conditions')
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
})

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format')
})

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain lowercase, uppercase, and number'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

// Helper functions
async function generateTokens(userId: string, rememberMe = false) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-key')
  const refreshSecret = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET || 'default-refresh-secret')
  
  const accessTokenExpiry = rememberMe ? '7d' : '1h'
  const refreshTokenExpiry = rememberMe ? '30d' : '7d'
  
  const accessToken = await new jose.SignJWT({ 
    sub: userId,
    type: 'access'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(accessTokenExpiry)
    .sign(secret)
  
  const refreshToken = await new jose.SignJWT({ 
    sub: userId,
    type: 'refresh'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(refreshTokenExpiry)
    .sign(refreshSecret)
  
  return { accessToken, refreshToken }
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Routes

// POST /api/auth/login
auth.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password, rememberMe } = c.req.valid('json')
  
  // Find user by email
  const user = getUserByEmail(email)
  
  if (!user) {
    throw new HTTPException(401, { message: 'Invalid email or password' })
  }
  
  // Verify password (in production, this would use real hashed passwords)
  const isValidPassword = await verifyPassword(password, user.password)
  
  if (!isValidPassword) {
    throw new HTTPException(401, { message: 'Invalid email or password' })
  }
  
  if (!user.isActive) {
    throw new HTTPException(401, { message: 'Account is disabled' })
  }
  
  // Generate tokens
  const { accessToken, refreshToken } = await generateTokens(user.id, rememberMe)
  
  // Update last login (in production, this would update the database)
  console.log(`User ${user.email} logged in at ${new Date().toISOString()}`)
  
  const response: ApiResponse<{
    user: Omit<User, 'password'>
    tokens: { accessToken: string; refreshToken: string }
  }> = {
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
        isActive: user.isActive,
        metadata: user.metadata
      },
      tokens: {
        accessToken,
        refreshToken
      }
    },
    message: 'Login successful',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  }
  
  return c.json(response)
})

// POST /api/auth/register
auth.post('/register', zValidator('json', registerSchema), async (c) => {
  const { email, password } = c.req.valid('json')
  
  // Check if user already exists
  const existingUser = getUserByEmail(email)
  
  if (existingUser) {
    throw new HTTPException(409, { message: 'User already exists with this email' })
  }
  
  // Hash password
  const hashedPassword = await hashPassword(password)
  
  // Create new user (in production, this would save to database)
  const newUser: User = {
    id: `user_${Date.now()}`,
    email,
    password: hashedPassword,
    role: 'user',
    permissions: ['read', 'write'],
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  }
  
  console.log(`New user registered: ${email}`)
  
  // Generate tokens
  const { accessToken, refreshToken } = await generateTokens(newUser.id)
  
  const response: ApiResponse<{
    user: Omit<User, 'password'>
    tokens: { accessToken: string; refreshToken: string }
  }> = {
    success: true,
    data: {
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        permissions: newUser.permissions,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
        lastLoginAt: newUser.lastLoginAt,
        isActive: newUser.isActive,
        metadata: newUser.metadata
      },
      tokens: {
        accessToken,
        refreshToken
      }
    },
    message: 'Registration successful',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  }
  
  return c.json(response, 201)
})

// POST /api/auth/refresh
auth.post('/refresh', zValidator('json', refreshTokenSchema), async (c) => {
  const { refreshToken } = c.req.valid('json')
  
  try {
    const refreshSecret = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET || 'default-refresh-secret')
    const { payload } = await jose.jwtVerify(refreshToken, refreshSecret)
    
    if (payload.type !== 'refresh') {
      throw new HTTPException(401, { message: 'Invalid token type' })
    }
    
    const user = getUserById(payload.sub as string)
    
    if (!user || !user.isActive) {
      throw new HTTPException(401, { message: 'User not found or inactive' })
    }
    
    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(user.id)
    
    const response: ApiResponse<{
      tokens: { accessToken: string; refreshToken: string }
    }> = {
      success: true,
      data: {
        tokens: {
          accessToken,
          refreshToken: newRefreshToken
        }
      },
      message: 'Tokens refreshed successfully',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId')
    }
    
    return c.json(response)
  } catch (error) {
    throw new HTTPException(401, { message: 'Invalid or expired refresh token' })
  }
})

// POST /api/auth/logout
auth.post('/logout', async (c) => {
  // In a real implementation, you would:
  // 1. Add the token to a blacklist
  // 2. Remove refresh token from database
  // 3. Log the logout event
  
  const response: ApiResponse = {
    success: true,
    message: 'Logged out successfully',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  }
  
  return c.json(response)
})

// POST /api/auth/forgot-password
auth.post('/forgot-password', zValidator('json', forgotPasswordSchema), async (c) => {
  const { email } = c.req.valid('json')
  
  const user = getUserByEmail(email)
  
  // Always return success to prevent email enumeration
  const response: ApiResponse = {
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  }
  
  if (user && user.isActive) {
    // In production, generate reset token and send email
    console.log(`Password reset requested for: ${email}`)
    // TODO: Send password reset email
  }
  
  return c.json(response)
})

// POST /api/auth/reset-password
auth.post('/reset-password', zValidator('json', resetPasswordSchema), async (c) => {
  const { token, password } = c.req.valid('json')
  
  // In production, verify the reset token and update password
  console.log(`Password reset attempted with token: ${token}`)
  
  // TODO: Verify token and update password in database
  
  const response: ApiResponse = {
    success: true,
    message: 'Password has been reset successfully',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  }
  
  return c.json(response)
})

// GET /api/auth/verify
auth.get('/verify', async (c) => {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'No token provided' })
  }
  
  const token = authHeader.substring(7)
  
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-key')
    const { payload } = await jose.jwtVerify(token, secret)
    
    const user = getUserById(payload.sub as string)
    
    if (!user || !user.isActive) {
      throw new HTTPException(401, { message: 'User not found or inactive' })
    }
    
    const response: ApiResponse<{
      user: Omit<User, 'password'>
      tokenInfo: { 
        sub: string
        iat: number
        exp: number
      }
    }> = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          lastLoginAt: user.lastLoginAt,
          isActive: user.isActive,
          metadata: user.metadata
        },
        tokenInfo: {
          sub: payload.sub as string,
          iat: payload.iat as number,
          exp: payload.exp as number
        }
      },
      message: 'Token is valid',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId')
    }
    
    return c.json(response)
  } catch (error) {
    throw new HTTPException(401, { message: 'Invalid or expired token' })
  }
})

export { auth as authRoutes }