import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { authMiddleware, requirePermission, getUserById } from '../middleware/auth.js'
import { validationMiddleware } from '../middleware/validation.js'
import type { Env } from '../types/env.js'
import type { Variables, ApiResponse, User, PaginatedResponse } from '../types/variables.js'

const users = new Hono<{ Bindings: Env; Variables: Variables }>()

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'user', 'guest']).default('user'),
  permissions: z.array(z.string()).default(['read']),
  metadata: z.record(z.any()).optional()
})

const updateUserSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  role: z.enum(['admin', 'user', 'guest']).optional(),
  permissions: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.any()).optional()
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain lowercase, uppercase, and number'),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

const userParamsSchema = z.object({
  id: z.string().min(1, 'User ID is required')
})

// Mock database
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@claudia.app',
    password: '$2a$10$dummy.hash.for.testing.purposes.only',
    role: 'admin',
    permissions: ['read', 'write', 'delete', 'admin'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    isActive: true,
    metadata: { 
      department: 'IT',
      lastPasswordChange: new Date().toISOString()
    }
  },
  {
    id: '2',
    email: 'user@claudia.app',
    password: '$2a$10$dummy.hash.for.testing.purposes.only',
    role: 'user',
    permissions: ['read', 'write'],
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date(),
    isActive: true,
    metadata: {
      department: 'Development',
      preferences: { theme: 'dark', language: 'en' }
    }
  },
  {
    id: '3',
    email: 'guest@claudia.app',
    password: '$2a$10$dummy.hash.for.testing.purposes.only',
    role: 'guest',
    permissions: ['read'],
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date(),
    isActive: false,
    metadata: {
      reason: 'Trial account expired'
    }
  }
]

// Helper functions
function sanitizeUser(user: User): Omit<User, 'password'> {
  const { password, ...sanitized } = user
  return sanitized
}

function paginateResults<T>(items: T[], page: number, limit: number) {
  const total = items.length
  const totalPages = Math.ceil(total / limit)
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const data = items.slice(startIndex, endIndex)
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  }
}

// Apply authentication to all user routes
users.use('*', authMiddleware)

// GET /api/users - List users (admin only)
users.get('/', requirePermission('admin'), validationMiddleware.pagination, (c) => {
  const { page, limit, sort, order } = c.get('validatedQuery') as any
  
  // Apply sorting
  const sortedUsers = [...mockUsers].sort((a, b) => {
    const aVal = a[sort as keyof User]
    const bVal = b[sort as keyof User]
    
    if (order === 'asc') {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
    }
  })
  
  const { data, pagination } = paginateResults(sortedUsers, page, limit)
  
  const response: PaginatedResponse<Omit<User, 'password'>> = {
    success: true,
    data: data.map(sanitizeUser),
    pagination,
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  }
  
  return c.json(response)
})

// GET /api/users/me - Get current user profile
users.get('/me', (c) => {
  const currentUser = c.get('user')
  
  if (!currentUser) {
    throw new HTTPException(401, { message: 'User context not found' })
  }
  
  const user = getUserById(currentUser.id)
  
  if (!user) {
    throw new HTTPException(404, { message: 'User not found' })
  }
  
  const response: ApiResponse<Omit<User, 'password'>> = {
    success: true,
    data: sanitizeUser(user),
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  }
  
  return c.json(response)
})

// PUT /api/users/me - Update current user profile
users.put('/me', zValidator('json', updateUserSchema.omit({ role: true, permissions: true })), (c) => {
  const currentUser = c.get('user')
  const updateData = c.req.valid('json')
  
  if (!currentUser) {
    throw new HTTPException(401, { message: 'User context not found' })
  }
  
  const userIndex = mockUsers.findIndex(u => u.id === currentUser.id)
  
  if (userIndex === -1) {
    throw new HTTPException(404, { message: 'User not found' })
  }
  
  // Update user data
  mockUsers[userIndex] = {
    ...mockUsers[userIndex],
    ...updateData,
    updatedAt: new Date()
  }
  
  const response: ApiResponse<Omit<User, 'password'>> = {
    success: true,
    data: sanitizeUser(mockUsers[userIndex]),
    message: 'Profile updated successfully',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  }
  
  return c.json(response)
})

// POST /api/users/me/change-password - Change current user password
users.post('/me/change-password', zValidator('json', changePasswordSchema), async (c) => {
  const currentUser = c.get('user')
  const { currentPassword, newPassword } = c.req.valid('json')
  
  if (!currentUser) {
    throw new HTTPException(401, { message: 'User context not found' })
  }
  
  const user = getUserById(currentUser.id)
  
  if (!user) {
    throw new HTTPException(404, { message: 'User not found' })
  }
  
  // Verify current password (in production, use real password verification)
  // const isValidPassword = await bcrypt.compare(currentPassword, user.password)
  const isValidPassword = true // Simplified for demo
  
  if (!isValidPassword) {
    throw new HTTPException(401, { message: 'Current password is incorrect' })
  }
  
  // Hash new password (in production)
  // const hashedPassword = await bcrypt.hash(newPassword, 12)
  
  // Update password
  const userIndex = mockUsers.findIndex(u => u.id === user.id)
  mockUsers[userIndex].updatedAt = new Date()
  mockUsers[userIndex].metadata = {
    ...mockUsers[userIndex].metadata,
    lastPasswordChange: new Date().toISOString()
  }
  
  const response: ApiResponse = {
    success: true,
    message: 'Password changed successfully',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  }
  
  return c.json(response)
})

// GET /api/users/:id - Get user by ID (admin only)
users.get('/:id', requirePermission('admin'), zValidator('param', userParamsSchema), (c) => {
  const { id } = c.req.valid('param')
  
  const user = mockUsers.find(u => u.id === id)
  
  if (!user) {
    throw new HTTPException(404, { message: 'User not found' })
  }
  
  const response: ApiResponse<Omit<User, 'password'>> = {
    success: true,
    data: sanitizeUser(user),
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  }
  
  return c.json(response)
})

// PUT /api/users/:id - Update user by ID (admin only)
users.put('/:id', requirePermission('admin'), zValidator('param', userParamsSchema), zValidator('json', updateUserSchema), (c) => {
  const { id } = c.req.valid('param')
  const updateData = c.req.valid('json')
  
  const userIndex = mockUsers.findIndex(u => u.id === id)
  
  if (userIndex === -1) {
    throw new HTTPException(404, { message: 'User not found' })
  }
  
  // Update user data
  mockUsers[userIndex] = {
    ...mockUsers[userIndex],
    ...updateData,
    updatedAt: new Date()
  }
  
  const response: ApiResponse<Omit<User, 'password'>> = {
    success: true,
    data: sanitizeUser(mockUsers[userIndex]),
    message: 'User updated successfully',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  }
  
  return c.json(response)
})

// DELETE /api/users/:id - Delete user by ID (admin only)
users.delete('/:id', requirePermission('admin'), zValidator('param', userParamsSchema), (c) => {
  const { id } = c.req.valid('param')
  const currentUser = c.get('user')
  
  // Prevent admin from deleting themselves
  if (currentUser?.id === id) {
    throw new HTTPException(400, { message: 'Cannot delete your own account' })
  }
  
  const userIndex = mockUsers.findIndex(u => u.id === id)
  
  if (userIndex === -1) {
    throw new HTTPException(404, { message: 'User not found' })
  }
  
  // Soft delete by deactivating
  mockUsers[userIndex].isActive = false
  mockUsers[userIndex].updatedAt = new Date()
  mockUsers[userIndex].metadata = {
    ...mockUsers[userIndex].metadata,
    deletedAt: new Date().toISOString(),
    deletedBy: currentUser?.id
  }
  
  const response: ApiResponse = {
    success: true,
    message: 'User deleted successfully',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  }
  
  return c.json(response)
})

// POST /api/users - Create new user (admin only)
users.post('/', requirePermission('admin'), zValidator('json', createUserSchema), async (c) => {
  const userData = c.req.valid('json')
  
  // Check if user already exists
  const existingUser = mockUsers.find(u => u.email === userData.email)
  
  if (existingUser) {
    throw new HTTPException(409, { message: 'User already exists with this email' })
  }
  
  // Hash password (in production)
  // const hashedPassword = await bcrypt.hash(userData.password, 12)
  
  const newUser: User = {
    id: `user_${Date.now()}`,
    email: userData.email,
    password: userData.password, // In production, use hashedPassword
    role: userData.role,
    permissions: userData.permissions,
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    metadata: userData.metadata
  }
  
  mockUsers.push(newUser)
  
  const response: ApiResponse<Omit<User, 'password'>> = {
    success: true,
    data: sanitizeUser(newUser),
    message: 'User created successfully',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  }
  
  return c.json(response, 201)
})

// GET /api/users/stats - Get user statistics (admin only)
users.get('/stats', requirePermission('admin'), (c) => {
  const stats = {
    total: mockUsers.length,
    active: mockUsers.filter(u => u.isActive).length,
    inactive: mockUsers.filter(u => !u.isActive).length,
    byRole: {
      admin: mockUsers.filter(u => u.role === 'admin').length,
      user: mockUsers.filter(u => u.role === 'user').length,
      guest: mockUsers.filter(u => u.role === 'guest').length
    },
    recentSignups: mockUsers.filter(u => {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return u.createdAt > weekAgo
    }).length
  }
  
  const response: ApiResponse<typeof stats> = {
    success: true,
    data: stats,
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  }
  
  return c.json(response)
})

export { users as userRoutes }