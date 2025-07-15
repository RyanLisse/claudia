export interface Variables {
  user?: {
    id: string
    email: string
    role: string
    permissions: string[]
  }
  requestId?: string
  startTime?: number
}

export interface User {
  id: string
  email: string
  password: string
  role: 'admin' | 'user' | 'guest'
  permissions: string[]
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
  isActive: boolean
  metadata?: Record<string, any>
}

export interface Project {
  id: string
  name: string
  description?: string
  userId: string
  settings: Record<string, any>
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

export interface Agent {
  id: string
  name: string
  type: string
  description?: string
  configuration: Record<string, any>
  projectId: string
  userId: string
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

export interface ApiResponse<T = any> {
  success: boolean
  data: T | undefined
  error: string | undefined
  message: string | undefined
  timestamp: string
  requestId?: string
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}