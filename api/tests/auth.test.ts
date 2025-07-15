import { describe, it, expect, beforeAll, afterAll } from 'bun:test'

const API_BASE = 'http://localhost:3001'

describe('Authentication API', () => {
  let server: any
  let accessToken: string
  let refreshToken: string

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

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@claudia.app',
          password: 'admin123',
          rememberMe: false
        })
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.user.email).toBe('admin@claudia.app')
      expect(data.data.tokens.accessToken).toBeDefined()
      expect(data.data.tokens.refreshToken).toBeDefined()
      
      // Store tokens for subsequent tests
      accessToken = data.data.tokens.accessToken
      refreshToken = data.data.tokens.refreshToken
    })

    it('should reject invalid credentials', async () => {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@claudia.app',
          password: 'wrongpassword'
        })
      })

      expect(response.status).toBe(401)
      
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Unauthorized')
    })

    it('should validate email format', async () => {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'invalid-email',
          password: 'password123'
        })
      })

      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Validation Error')
    })

    it('should validate password length', async () => {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: '123'
        })
      })

      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Validation Error')
    })
  })

  describe('GET /api/auth/verify', () => {
    it('should verify valid token', async () => {
      const response = await fetch(`${API_BASE}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.user.email).toBe('admin@claudia.app')
      expect(data.data.tokenInfo).toBeDefined()
    })

    it('should reject invalid token', async () => {
      const response = await fetch(`${API_BASE}/api/auth/verify`, {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      })

      expect(response.status).toBe(401)
      
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Unauthorized')
    })

    it('should reject missing token', async () => {
      const response = await fetch(`${API_BASE}/api/auth/verify`)

      expect(response.status).toBe(401)
      
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.message).toContain('No token provided')
    })
  })

  describe('POST /api/auth/refresh', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const response = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken
        })
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.tokens.accessToken).toBeDefined()
      expect(data.data.tokens.refreshToken).toBeDefined()
      expect(data.data.tokens.accessToken).not.toBe(accessToken)
    })

    it('should reject invalid refresh token', async () => {
      const response = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: 'invalid-refresh-token'
        })
      })

      expect(response.status).toBe(401)
      
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.message).toContain('Invalid or expired refresh token')
    })
  })

  describe('POST /api/auth/register', () => {
    it('should register new user with valid data', async () => {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'newuser@example.com',
          password: 'NewPass123',
          confirmPassword: 'NewPass123',
          acceptTerms: true
        })
      })

      expect(response.status).toBe(201)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.user.email).toBe('newuser@example.com')
      expect(data.data.tokens.accessToken).toBeDefined()
    })

    it('should reject registration with existing email', async () => {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@claudia.app',
          password: 'NewPass123',
          confirmPassword: 'NewPass123',
          acceptTerms: true
        })
      })

      expect(response.status).toBe(409)
      
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.message).toContain('User already exists')
    })

    it('should validate password requirements', async () => {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test2@example.com',
          password: 'weak',
          confirmPassword: 'weak',
          acceptTerms: true
        })
      })

      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Validation Error')
    })

    it('should validate password confirmation', async () => {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test3@example.com',
          password: 'StrongPass123',
          confirmPassword: 'DifferentPass123',
          acceptTerms: true
        })
      })

      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Validation Error')
    })

    it('should require terms acceptance', async () => {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test4@example.com',
          password: 'StrongPass123',
          confirmPassword: 'StrongPass123',
          acceptTerms: false
        })
      })

      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Validation Error')
    })
  })

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST'
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.message).toContain('Logged out successfully')
    })
  })

  describe('POST /api/auth/forgot-password', () => {
    it('should handle forgot password request', async () => {
      const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@claudia.app'
        })
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.message).toContain('password reset link')
    })

    it('should validate email format for forgot password', async () => {
      const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'invalid-email'
        })
      })

      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Validation Error')
    })
  })
})