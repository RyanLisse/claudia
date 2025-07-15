import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { authMiddleware, requirePermission } from '../middleware/auth.js'
import { validationMiddleware } from '../middleware/validation.js'
import type { Env } from '../types/env.js'
import type { Variables, ApiResponse, Project, PaginatedResponse } from '../types/variables.js'

const projects = new Hono<{ Bindings: Env; Variables: Variables }>()

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  settings: z.record(z.any()).default({}),
  isActive: z.boolean().default(true)
})

const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  settings: z.record(z.any()).optional(),
  isActive: z.boolean().optional()
})

const projectParamsSchema = z.object({
  id: z.string().min(1, 'Project ID is required')
})

const projectQuerySchema = z.object({
  userId: z.string().optional(),
  isActive: z.string().transform(val => val === 'true').optional(),
  search: z.string().optional()
})

// Mock database
const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Claudia Web App',
    description: 'Main web application for Claudia platform',
    userId: '1',
    settings: {
      framework: 'React',
      buildTool: 'Vite',
      styling: 'Tailwind CSS',
      deployment: 'Vercel'
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    isActive: true
  },
  {
    id: '2',
    name: 'Mobile App',
    description: 'React Native mobile application',
    userId: '1',
    settings: {
      framework: 'React Native',
      platform: 'iOS/Android',
      state: 'Redux'
    },
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
    isActive: true
  },
  {
    id: '3',
    name: 'Documentation Site',
    description: 'Technical documentation and guides',
    userId: '2',
    settings: {
      generator: 'Docusaurus',
      deployment: 'GitHub Pages'
    },
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date(),
    isActive: false
  },
  {
    id: '4',
    name: 'E-commerce Platform',
    description: 'Online shopping platform with payment integration',
    userId: '2',
    settings: {
      framework: 'Next.js',
      database: 'PostgreSQL',
      payments: 'Stripe',
      cms: 'Strapi'
    },
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date(),
    isActive: true
  }
]

// Helper functions
function filterProjects(projects: Project[], query: any, currentUserId: string, userRole: string) {
  let filtered = [...projects]
  
  // Non-admin users can only see their own projects
  if (userRole !== 'admin') {
    filtered = filtered.filter(p => p.userId === currentUserId)
  } else if (query.userId) {
    filtered = filtered.filter(p => p.userId === query.userId)
  }
  
  if (query.isActive !== undefined) {
    filtered = filtered.filter(p => p.isActive === query.isActive)
  }
  
  if (query.search) {
    const searchTerm = query.search.toLowerCase()
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(searchTerm) ||
      (p.description && p.description.toLowerCase().includes(searchTerm))
    )
  }
  
  return filtered
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

// Apply authentication to all project routes
projects.use('*', authMiddleware)

// GET /api/projects - List projects
projects.get('/', zValidator('query', projectQuerySchema), validationMiddleware.pagination, (c) => {
  const query = c.req.valid('query')
  const { page, limit, sort, order } = c.get('validatedQuery') as any
  const currentUser = c.get('user')
  
  if (!currentUser) {
    throw new HTTPException(401, { message: 'User context not found' })
  }
  
  // Filter projects based on user role and query parameters
  let filteredProjects = filterProjects(mockProjects, query, currentUser.id, currentUser.role)
  
  // Apply sorting
  filteredProjects.sort((a, b) => {
    const aVal = a[sort as keyof Project]
    const bVal = b[sort as keyof Project]
    
    if (order === 'asc') {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
    }
  })
  
  const { data, pagination } = paginateResults(filteredProjects, page, limit)
  
  const response: PaginatedResponse<Project> = {
    success: true,
    data,
    pagination,
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  }
  
  return c.json(response)
})

// POST /api/projects - Create new project
projects.post('/', zValidator('json', createProjectSchema), (c) => {
  const projectData = c.req.valid('json')
  const currentUser = c.get('user')
  
  if (!currentUser) {
    throw new HTTPException(401, { message: 'User context not found' })
  }
  
  const newProject: Project = {
    id: `project_${Date.now()}`,
    name: projectData.name,
    description: projectData.description,
    userId: currentUser.id,
    settings: projectData.settings,
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: projectData.isActive
  }
  
  mockProjects.push(newProject)
  
  const response: ApiResponse<Project> = {
    success: true,
    data: newProject,
    message: 'Project created successfully',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  }
  
  return c.json(response, 201)
})

// GET /api/projects/:id - Get project by ID
projects.get('/:id', zValidator('param', projectParamsSchema), (c) => {
  const { id } = c.req.valid('param')
  const currentUser = c.get('user')
  
  if (!currentUser) {
    throw new HTTPException(401, { message: 'User context not found' })
  }
  
  const project = mockProjects.find(p => p.id === id)
  
  if (!project) {
    throw new HTTPException(404, { message: 'Project not found' })
  }
  
  // Check if user has access to this project
  if (currentUser.role !== 'admin' && project.userId !== currentUser.id) {
    throw new HTTPException(403, { message: 'Access denied to this project' })
  }
  
  const response: ApiResponse<Project> = {
    success: true,
    data: project,
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  }
  
  return c.json(response)
})

// PUT /api/projects/:id - Update project
projects.put('/:id', zValidator('param', projectParamsSchema), zValidator('json', updateProjectSchema), (c) => {
  const { id } = c.req.valid('param')
  const updateData = c.req.valid('json')
  const currentUser = c.get('user')
  
  if (!currentUser) {
    throw new HTTPException(401, { message: 'User context not found' })
  }
  
  const projectIndex = mockProjects.findIndex(p => p.id === id)
  
  if (projectIndex === -1) {
    throw new HTTPException(404, { message: 'Project not found' })
  }
  
  const project = mockProjects[projectIndex]
  
  // Check if user has access to update this project
  if (currentUser.role !== 'admin' && project.userId !== currentUser.id) {
    throw new HTTPException(403, { message: 'Access denied to update this project' })
  }
  
  // Update project data
  mockProjects[projectIndex] = {
    ...project,
    ...updateData,
    updatedAt: new Date()
  }
  
  const response: ApiResponse<Project> = {
    success: true,
    data: mockProjects[projectIndex],
    message: 'Project updated successfully',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  }
  
  return c.json(response)
})

// DELETE /api/projects/:id - Delete project
projects.delete('/:id', zValidator('param', projectParamsSchema), (c) => {
  const { id } = c.req.valid('param')
  const currentUser = c.get('user')
  
  if (!currentUser) {
    throw new HTTPException(401, { message: 'User context not found' })
  }
  
  const projectIndex = mockProjects.findIndex(p => p.id === id)
  
  if (projectIndex === -1) {
    throw new HTTPException(404, { message: 'Project not found' })
  }
  
  const project = mockProjects[projectIndex]
  
  // Check if user has access to delete this project
  if (currentUser.role !== 'admin' && project.userId !== currentUser.id) {
    throw new HTTPException(403, { message: 'Access denied to delete this project' })
  }
  
  // Soft delete by deactivating
  mockProjects[projectIndex].isActive = false
  mockProjects[projectIndex].updatedAt = new Date()
  
  const response: ApiResponse = {
    success: true,
    message: 'Project deleted successfully',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  }
  
  return c.json(response)
})

// POST /api/projects/:id/duplicate - Duplicate project
projects.post('/:id/duplicate', zValidator('param', projectParamsSchema), (c) => {
  const { id } = c.req.valid('param')
  const currentUser = c.get('user')
  
  if (!currentUser) {
    throw new HTTPException(401, { message: 'User context not found' })
  }
  
  const originalProject = mockProjects.find(p => p.id === id)
  
  if (!originalProject) {
    throw new HTTPException(404, { message: 'Project not found' })
  }
  
  // Check if user has access to this project
  if (currentUser.role !== 'admin' && originalProject.userId !== currentUser.id) {
    throw new HTTPException(403, { message: 'Access denied to duplicate this project' })
  }
  
  const duplicatedProject: Project = {
    id: `project_${Date.now()}`,
    name: `${originalProject.name} (Copy)`,
    description: originalProject.description,
    userId: currentUser.id,
    settings: { ...originalProject.settings },
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  }
  
  mockProjects.push(duplicatedProject)
  
  const response: ApiResponse<Project> = {
    success: true,
    data: duplicatedProject,
    message: 'Project duplicated successfully',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  }
  
  return c.json(response, 201)
})

// GET /api/projects/stats - Get project statistics
projects.get('/stats', (c) => {
  const currentUser = c.get('user')
  
  if (!currentUser) {
    throw new HTTPException(401, { message: 'User context not found' })
  }
  
  let projectsToAnalyze = mockProjects
  
  // Non-admin users only see their own project stats
  if (currentUser.role !== 'admin') {
    projectsToAnalyze = mockProjects.filter(p => p.userId === currentUser.id)
  }
  
  const stats = {
    total: projectsToAnalyze.length,
    active: projectsToAnalyze.filter(p => p.isActive).length,
    inactive: projectsToAnalyze.filter(p => !p.isActive).length,
    recentlyCreated: projectsToAnalyze.filter(p => {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return p.createdAt > weekAgo
    }).length,
    byFramework: projectsToAnalyze.reduce((acc, p) => {
      const framework = p.settings.framework || 'Unknown'
      acc[framework] = (acc[framework] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }
  
  const response: ApiResponse<typeof stats> = {
    success: true,
    data: stats,
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  }
  
  return c.json(response)
})

// GET /api/projects/:id/settings - Get project settings
projects.get('/:id/settings', zValidator('param', projectParamsSchema), (c) => {
  const { id } = c.req.valid('param')
  const currentUser = c.get('user')
  
  if (!currentUser) {
    throw new HTTPException(401, { message: 'User context not found' })
  }
  
  const project = mockProjects.find(p => p.id === id)
  
  if (!project) {
    throw new HTTPException(404, { message: 'Project not found' })
  }
  
  // Check if user has access to this project
  if (currentUser.role !== 'admin' && project.userId !== currentUser.id) {
    throw new HTTPException(403, { message: 'Access denied to this project' })
  }
  
  const response: ApiResponse<Record<string, any>> = {
    success: true,
    data: project.settings,
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  }
  
  return c.json(response)
})

// PUT /api/projects/:id/settings - Update project settings
projects.put('/:id/settings', zValidator('param', projectParamsSchema), zValidator('json', z.record(z.any())), (c) => {
  const { id } = c.req.valid('param')
  const newSettings = c.req.valid('json')
  const currentUser = c.get('user')
  
  if (!currentUser) {
    throw new HTTPException(401, { message: 'User context not found' })
  }
  
  const projectIndex = mockProjects.findIndex(p => p.id === id)
  
  if (projectIndex === -1) {
    throw new HTTPException(404, { message: 'Project not found' })
  }
  
  const project = mockProjects[projectIndex]
  
  // Check if user has access to update this project
  if (currentUser.role !== 'admin' && project.userId !== currentUser.id) {
    throw new HTTPException(403, { message: 'Access denied to update this project' })
  }
  
  // Update settings
  mockProjects[projectIndex].settings = {
    ...project.settings,
    ...newSettings
  }
  mockProjects[projectIndex].updatedAt = new Date()
  
  const response: ApiResponse<Record<string, any>> = {
    success: true,
    data: mockProjects[projectIndex].settings,
    message: 'Project settings updated successfully',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  }
  
  return c.json(response)
})

export { projects as projectRoutes }