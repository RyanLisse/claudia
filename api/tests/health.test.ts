import { describe, it, expect, beforeAll, afterAll } from 'bun:test'

const API_BASE = 'http://localhost:3001'

describe('Health API', () => {
  let server: any

  beforeAll(async () => {
    // Start the server for testing
    const { default: app } = await import('../src/index')
    server = Bun.serve({
      port: 3001,
      fetch: app.fetch,
    })
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 1000))
  })

  afterAll(() => {
    if (server) {
      server.stop()
    }
  })

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await fetch(`${API_BASE}/api/health`)

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.status).toBe('healthy')
      expect(data.data.timestamp).toBeDefined()
      expect(data.data.uptime).toBeGreaterThan(0)
      expect(data.data.version).toBe('1.0.0')
      expect(data.data.services).toBeDefined()
      expect(data.data.system).toBeDefined()
    })

    it('should include system metrics', async () => {
      const response = await fetch(`${API_BASE}/api/health`)
      const data = await response.json()

      expect(data.data.system.memory).toBeDefined()
      expect(data.data.system.memory.used).toBeGreaterThan(0)
      expect(data.data.system.memory.total).toBeGreaterThan(0)
      expect(data.data.system.memory.percentage).toBeGreaterThanOrEqual(0)
      expect(data.data.system.memory.percentage).toBeLessThanOrEqual(100)
    })

    it('should include service status', async () => {
      const response = await fetch(`${API_BASE}/api/health`)
      const data = await response.json()

      expect(data.data.services.database).toBeDefined()
      expect(data.data.services.redis).toBeDefined()
      expect(data.data.services.external_apis).toBeDefined()
    })
  })

  describe('GET /api/health/ready', () => {
    it('should return readiness status', async () => {
      const response = await fetch(`${API_BASE}/api/health/ready`)

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.message).toContain('ready')
    })
  })

  describe('GET /api/health/live', () => {
    it('should return liveness status', async () => {
      const response = await fetch(`${API_BASE}/api/health/live`)

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.message).toContain('alive')
    })
  })

  describe('GET /api/health/detailed', () => {
    it('should return detailed health check', async () => {
      const response = await fetch(`${API_BASE}/api/health/detailed`)

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.overall).toBeDefined()
      expect(data.data.checks).toBeDefined()
      expect(data.data.checks.database).toBeDefined()
      expect(data.data.checks.redis).toBeDefined()
      expect(data.data.checks.external_apis).toBeDefined()
    })
  })

  describe('Response format validation', () => {
    it('should have consistent response format', async () => {
      const response = await fetch(`${API_BASE}/api/health`)
      const data = await response.json()

      // Check required fields
      expect(data.success).toBeDefined()
      expect(data.timestamp).toBeDefined()
      expect(data.requestId).toBeDefined()
      
      // Validate timestamp format (ISO 8601)
      expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp)
    })

    it('should include request ID', async () => {
      const response = await fetch(`${API_BASE}/api/health`)
      const data = await response.json()

      expect(data.requestId).toBeDefined()
      expect(typeof data.requestId).toBe('string')
      expect(data.requestId.length).toBeGreaterThan(0)
    })
  })

  describe('Performance', () => {
    it('should respond quickly', async () => {
      const startTime = Date.now()
      const response = await fetch(`${API_BASE}/api/health`)
      const endTime = Date.now()

      expect(response.status).toBe(200)
      expect(endTime - startTime).toBeLessThan(1000) // Should respond within 1 second
    })

    it('should handle concurrent requests', async () => {
      const requests = Array(10).fill(null).map(() => 
        fetch(`${API_BASE}/api/health`)
      )

      const responses = await Promise.all(requests)
      
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })
  })
})