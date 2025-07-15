import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { authMiddleware, requirePermission } from '../middleware/auth.js'
import { validationMiddleware } from '../middleware/validation.js'
import type { Env } from '../types/env.js'
import type { Variables, ApiResponse, Agent, PaginatedResponse } from '../types/variables.js'

const agents = new Hono<{ Bindings: Env; Variables: Variables }>()

// Validation schemas
const createAgentSchema = z.object({
  name: z.string().min(1, 'Agent name is required').max(100, 'Agent name too long'),
  type: z.enum(['researcher', 'coder', 'analyst', 'optimizer', 'coordinator', 'tester', 'reviewer', 'documenter']),
  description: z.string().max(500, 'Description too long').optional(),
  configuration: z.record(z.any()).default({}),
  projectId: z.string().min(1, 'Project ID is required'),
  isActive: z.boolean().default(true)
})

const updateAgentSchema = z.object({
  name: z.string().min(1, 'Agent name is required').max(100, 'Agent name too long').optional(),
  type: z.enum(['researcher', 'coder', 'analyst', 'optimizer', 'coordinator', 'tester', 'reviewer', 'documenter']).optional(),
  description: z.string().max(500, 'Description too long').optional(),
  configuration: z.record(z.any()).optional(),
  isActive: z.boolean().optional()
})

const agentParamsSchema = z.object({
  id: z.string().min(1, 'Agent ID is required')
})

const agentQuerySchema = z.object({
  projectId: z.string().optional(),
  type: z.enum(['researcher', 'coder', 'analyst', 'optimizer', 'coordinator', 'tester', 'reviewer', 'documenter']).optional(),
  isActive: z.string().transform(val => val === 'true').optional(),
  search: z.string().optional()
})

const executeAgentSchema = z.object({
  task: z.string().min(1, 'Task description is required'),
  context: z.record(z.any()).optional().default({}),
  timeout: z.number().min(1).max(300).optional().default(60) // 1-300 seconds
})

// Mock database
const mockAgents: Agent[] = [
  {
    id: '1',
    name: 'Frontend Researcher',
    type: 'researcher',
    description: 'Specialized in researching frontend technologies and best practices',
    configuration: {
      languages: ['JavaScript', 'TypeScript', 'React'],
      tools: ['Vite', 'Webpack', 'ESLint'],
      searchDomains: ['frontend', 'react', 'javascript'],
      maxResults: 10
    },
    projectId: '1',
    userId: '1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    isActive: true
  },
  {
    id: '2',
    name: 'API Coder',
    type: 'coder',
    description: 'Focused on building robust API endpoints and backend services',
    configuration: {
      languages: ['TypeScript', 'Node.js'],
      frameworks: ['Hono', 'Express'],
      patterns: ['REST', 'GraphQL'],
      testing: ['Jest', 'Supertest']
    },
    projectId: '1',
    userId: '1',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date(),
    isActive: true
  },
  {
    id: '3',
    name: 'Performance Analyzer',
    type: 'analyst',
    description: 'Analyzes application performance and identifies bottlenecks',
    configuration: {
      metrics: ['response_time', 'memory_usage', 'cpu_usage'],
      tools: ['Lighthouse', 'WebPageTest', 'New Relic'],
      thresholds: {
        response_time: 200,
        memory_usage: 80,
        cpu_usage: 70
      }
    },
    projectId: '2',
    userId: '2',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date(),
    isActive: true
  },
  {
    id: '4',
    name: 'Test Coordinator',
    type: 'coordinator',
    description: 'Coordinates testing efforts across multiple teams',
    configuration: {
      testTypes: ['unit', 'integration', 'e2e'],
      frameworks: ['Jest', 'Cypress', 'Playwright'],
      coverage: {
        minimum: 80,
        target: 90
      }
    },
    projectId: '2',
    userId: '2',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
    isActive: false
  }
]

// Helper functions
function filterAgents(agents: Agent[], query: any, currentUserId: string, userRole: string) {
  let filtered = [...agents]
  
  // Non-admin users can only see their own agents
  if (userRole !== 'admin') {
    filtered = filtered.filter(a => a.userId === currentUserId)
  }
  
  if (query.projectId) {
    filtered = filtered.filter(a => a.projectId === query.projectId)
  }
  
  if (query.type) {
    filtered = filtered.filter(a => a.type === query.type)
  }
  
  if (query.isActive !== undefined) {
    filtered = filtered.filter(a => a.isActive === query.isActive)
  }
  
  if (query.search) {
    const searchTerm = query.search.toLowerCase()
    filtered = filtered.filter(a => 
      a.name.toLowerCase().includes(searchTerm) ||
      a.type.toLowerCase().includes(searchTerm) ||
      (a.description && a.description.toLowerCase().includes(searchTerm))
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

// Mock agent execution
async function executeAgent(agent: Agent, task: string, context: Record<string, any>, timeout: number) {
  // Simulate agent execution time
  const executionTime = Math.random() * 3000 + 1000 // 1-4 seconds
  
  await new Promise(resolve => setTimeout(resolve, Math.min(executionTime, timeout * 1000)))
  
  // Mock response based on agent type
  switch (agent.type) {
    case 'researcher':
      return {
        results: [
          { title: 'Best Practices for ' + task, url: 'https://example.com/1', relevance: 0.95 },
          { title: 'Modern Approaches to ' + task, url: 'https://example.com/2', relevance: 0.87 }
        ],
        summary: `Found ${Math.floor(Math.random() * 10) + 5} relevant resources for: ${task}`,
        confidence: 0.89
      }
    
    case 'coder':
      return {
        code: `// Generated code for: ${task}\nfunction ${task.replace(/\s+/g, '')}() {\n  // Implementation here\n  return true;\n}`,
        files: [`${task.replace(/\s+/g, '_').toLowerCase()}.ts`],
        tests: [`${task.replace(/\s+/g, '_').toLowerCase()}.test.ts`],
        confidence: 0.92
      }
    
    case 'analyst':
      return {
        metrics: {
          performance: Math.random() * 100,
          reliability: Math.random() * 100,
          maintainability: Math.random() * 100
        },
        issues: [
          { severity: 'medium', description: 'Potential memory leak detected' },
          { severity: 'low', description: 'Code complexity could be reduced' }
        ],
        recommendations: ['Optimize database queries', 'Implement caching'],
        confidence: 0.85
      }
    
    case 'optimizer':
      return {
        optimizations: [
          { type: 'performance', description: 'Bundle size reduction', impact: 'high' },
          { type: 'memory', description: 'Memory usage optimization', impact: 'medium' }
        ],
        expectedImprovement: '25-30% performance gain',
        confidence: 0.88
      }
    
    case 'coordinator':
      return {
        plan: [
          { step: 1, task: 'Initialize project structure', estimated: '2h' },
          { step: 2, task: 'Implement core features', estimated: '8h' },
          { step: 3, task: 'Testing and validation', estimated: '4h' }
        ],
        timeline: '2-3 days',
        resources: ['2 developers', '1 tester'],
        confidence: 0.90
      }
    
    default:
      return {
        result: `Completed task: ${task}`,
        details: context,
        confidence: 0.80
      }
  }
}

// Apply authentication to all agent routes
agents.use('*', authMiddleware)

// GET /api/agents - List agents
agents.get('/', zValidator('query', agentQuerySchema), validationMiddleware.pagination, (c) => {
  const query = c.req.valid('query')
  const { page, limit, sort, order } = c.get('validatedQuery') as any
  const currentUser = c.get('user')
  
  if (!currentUser) {
    throw new HTTPException(401, { message: 'User context not found' })
  }
  
  // Filter agents based on user role and query parameters
  let filteredAgents = filterAgents(mockAgents, query, currentUser.id, currentUser.role)
  
  // Apply sorting
  filteredAgents.sort((a, b) => {
    const aVal = a[sort as keyof Agent]
    const bVal = b[sort as keyof Agent]
    
    if (order === 'asc') {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
    }
  })
  
  const { data, pagination } = paginateResults(filteredAgents, page, limit)
  
  const response: PaginatedResponse<Agent> = {
    success: true,
    data,
    pagination,
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  }
  
  return c.json(response)
})

// POST /api/agents - Create new agent
agents.post('/', zValidator('json', createAgentSchema), (c) => {
  const agentData = c.req.valid('json')
  const currentUser = c.get('user')
  
  if (!currentUser) {
    throw new HTTPException(401, { message: 'User context not found' })
  }
  
  const newAgent: Agent = {
    id: `agent_${Date.now()}`,
    name: agentData.name,
    type: agentData.type,
    description: agentData.description,
    configuration: agentData.configuration,
    projectId: agentData.projectId,
    userId: currentUser.id,
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: agentData.isActive
  }
  
  mockAgents.push(newAgent)
  
  const response: ApiResponse<Agent> = {
    success: true,
    data: newAgent,
    message: 'Agent created successfully',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  }
  
  return c.json(response, 201)
})

// GET /api/agents/:id - Get agent by ID
agents.get('/:id', zValidator('param', agentParamsSchema), (c) => {
  const { id } = c.req.valid('param')
  const currentUser = c.get('user')
  
  if (!currentUser) {
    throw new HTTPException(401, { message: 'User context not found' })
  }
  
  const agent = mockAgents.find(a => a.id === id)
  
  if (!agent) {
    throw new HTTPException(404, { message: 'Agent not found' })
  }
  
  // Check if user has access to this agent
  if (currentUser.role !== 'admin' && agent.userId !== currentUser.id) {
    throw new HTTPException(403, { message: 'Access denied to this agent' })
  }
  
  const response: ApiResponse<Agent> = {
    success: true,
    data: agent,
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  }
  
  return c.json(response)
})

// PUT /api/agents/:id - Update agent
agents.put('/:id', zValidator('param', agentParamsSchema), zValidator('json', updateAgentSchema), (c) => {
  const { id } = c.req.valid('param')
  const updateData = c.req.valid('json')
  const currentUser = c.get('user')
  
  if (!currentUser) {
    throw new HTTPException(401, { message: 'User context not found' })
  }
  
  const agentIndex = mockAgents.findIndex(a => a.id === id)
  
  if (agentIndex === -1) {
    throw new HTTPException(404, { message: 'Agent not found' })
  }
  
  const agent = mockAgents[agentIndex]
  
  // Check if user has access to update this agent
  if (currentUser.role !== 'admin' && agent.userId !== currentUser.id) {
    throw new HTTPException(403, { message: 'Access denied to update this agent' })
  }
  
  // Update agent data
  mockAgents[agentIndex] = {
    ...agent,
    ...updateData,
    updatedAt: new Date()
  }
  
  const response: ApiResponse<Agent> = {
    success: true,
    data: mockAgents[agentIndex],
    message: 'Agent updated successfully',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  }
  
  return c.json(response)
})

// DELETE /api/agents/:id - Delete agent
agents.delete('/:id', zValidator('param', agentParamsSchema), (c) => {
  const { id } = c.req.valid('param')
  const currentUser = c.get('user')
  
  if (!currentUser) {
    throw new HTTPException(401, { message: 'User context not found' })
  }
  
  const agentIndex = mockAgents.findIndex(a => a.id === id)
  
  if (agentIndex === -1) {
    throw new HTTPException(404, { message: 'Agent not found' })
  }
  
  const agent = mockAgents[agentIndex]
  
  // Check if user has access to delete this agent
  if (currentUser.role !== 'admin' && agent.userId !== currentUser.id) {
    throw new HTTPException(403, { message: 'Access denied to delete this agent' })
  }
  
  // Soft delete by deactivating
  mockAgents[agentIndex].isActive = false
  mockAgents[agentIndex].updatedAt = new Date()
  
  const response: ApiResponse = {
    success: true,
    message: 'Agent deleted successfully',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  }
  
  return c.json(response)
})

// POST /api/agents/:id/execute - Execute agent task
agents.post('/:id/execute', zValidator('param', agentParamsSchema), zValidator('json', executeAgentSchema), async (c) => {
  const { id } = c.req.valid('param')
  const { task, context, timeout } = c.req.valid('json')
  const currentUser = c.get('user')
  
  if (!currentUser) {
    throw new HTTPException(401, { message: 'User context not found' })
  }
  
  const agent = mockAgents.find(a => a.id === id)
  
  if (!agent) {
    throw new HTTPException(404, { message: 'Agent not found' })
  }
  
  // Check if user has access to this agent
  if (currentUser.role !== 'admin' && agent.userId !== currentUser.id) {
    throw new HTTPException(403, { message: 'Access denied to execute this agent' })
  }
  
  if (!agent.isActive) {
    throw new HTTPException(400, { message: 'Agent is not active' })
  }
  
  try {
    const startTime = Date.now()
    const result = await executeAgent(agent, task, context, timeout)
    const executionTime = Date.now() - startTime
    
    const response: ApiResponse<{
      agent: Agent
      task: string
      result: any
      executionTime: number
      timestamp: string
    }> = {
      success: true,
      data: {
        agent,
        task,
        result,
        executionTime,
        timestamp: new Date().toISOString()
      },
      message: 'Agent executed successfully',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId')
    }
    
    return c.json(response)
  } catch (error) {
    throw new HTTPException(500, { message: 'Agent execution failed' })
  }
})

// GET /api/agents/types - Get available agent types
agents.get('/types', (c) => {
  const agentTypes = [
    {
      type: 'researcher',
      description: 'Researches information and gathers data from various sources',
      capabilities: ['web_search', 'data_analysis', 'report_generation']
    },
    {
      type: 'coder',
      description: 'Writes and modifies code based on specifications',
      capabilities: ['code_generation', 'refactoring', 'testing']
    },
    {
      type: 'analyst',
      description: 'Analyzes data, performance metrics, and system behavior',
      capabilities: ['performance_analysis', 'data_visualization', 'recommendations']
    },
    {
      type: 'optimizer',
      description: 'Optimizes code, configurations, and system performance',
      capabilities: ['performance_optimization', 'resource_management', 'efficiency_improvements']
    },
    {
      type: 'coordinator',
      description: 'Coordinates tasks and manages project workflows',
      capabilities: ['task_planning', 'resource_allocation', 'timeline_management']
    },
    {
      type: 'tester',
      description: 'Creates and executes tests for quality assurance',
      capabilities: ['test_generation', 'test_execution', 'bug_detection']
    },
    {
      type: 'reviewer',
      description: 'Reviews code, documents, and provides feedback',
      capabilities: ['code_review', 'quality_assessment', 'best_practices']
    },
    {
      type: 'documenter',
      description: 'Creates and maintains project documentation',
      capabilities: ['documentation_generation', 'api_docs', 'user_guides']
    }
  ]
  
  const response: ApiResponse<typeof agentTypes> = {
    success: true,
    data: agentTypes,
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  }
  
  return c.json(response)
})

// GET /api/agents/stats - Get agent statistics
agents.get('/stats', (c) => {
  const currentUser = c.get('user')
  
  if (!currentUser) {
    throw new HTTPException(401, { message: 'User context not found' })
  }
  
  let agentsToAnalyze = mockAgents
  
  // Non-admin users only see their own agent stats
  if (currentUser.role !== 'admin') {
    agentsToAnalyze = mockAgents.filter(a => a.userId === currentUser.id)
  }
  
  const stats = {
    total: agentsToAnalyze.length,
    active: agentsToAnalyze.filter(a => a.isActive).length,
    inactive: agentsToAnalyze.filter(a => !a.isActive).length,
    byType: agentsToAnalyze.reduce((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    recentlyCreated: agentsToAnalyze.filter(a => {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return a.createdAt > weekAgo
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

export { agents as agentRoutes }