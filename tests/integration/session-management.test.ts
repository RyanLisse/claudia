import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mockTauriInvoke, createMockSession, createTestDatabase } from '../utils/test-helpers'

describe('Session Management Integration', () => {
  let mockDb: any

  beforeEach(() => {
    mockDb = createTestDatabase()
    
    // Mock Tauri database operations
    mockTauriInvoke({
      'db_create_session': (args: any) => {
        const session = createMockSession(args)
        mockDb.insert(session)
        return session
      },
      'db_get_sessions': () => mockDb.select(),
      'db_update_session': (args: any) => {
        mockDb.update(args)
        return createMockSession(args)
      },
      'db_delete_session': (args: any) => {
        mockDb.delete(args.id)
        return { success: true }
      },
      'session_start': (args: any) => ({
        sessionId: args.id,
        status: 'started',
        timestamp: new Date().toISOString()
      }),
      'session_stop': (args: any) => ({
        sessionId: args.id,
        status: 'stopped',
        timestamp: new Date().toISOString()
      })
    })
  })

  afterEach(() => {
    mockDb.clear()
    vi.clearAllMocks()
  })

  describe('Session Creation', () => {
    it('should create a new session with valid data', async () => {
      const sessionData = {
        name: 'Integration Test Session',
        projectId: 'test-project-1',
        type: 'development'
      }

      const { invoke } = require('@tauri-apps/api/core')
      const result = await invoke('db_create_session', sessionData)

      expect(result).toMatchObject({
        name: sessionData.name,
        projectId: sessionData.projectId,
        status: 'active'
      })
      expect(result.id).toBeDefined()
      expect(result.createdAt).toBeDefined()
    })

    it('should handle session creation with minimal data', async () => {
      const sessionData = {
        name: 'Minimal Session'
      }

      const { invoke } = require('@tauri-apps/api/core')
      const result = await invoke('db_create_session', sessionData)

      expect(result.name).toBe(sessionData.name)
      expect(result.id).toBeDefined()
    })

    it('should generate unique session IDs', async () => {
      const { invoke } = require('@tauri-apps/api/core')
      
      const session1 = await invoke('db_create_session', { name: 'Session 1' })
      const session2 = await invoke('db_create_session', { name: 'Session 2' })

      expect(session1.id).not.toBe(session2.id)
    })
  })

  describe('Session Retrieval', () => {
    it('should retrieve all sessions', async () => {
      // Create test sessions
      const session1 = createMockSession({ name: 'Session 1' })
      const session2 = createMockSession({ name: 'Session 2' })
      mockDb.insert(session1)
      mockDb.insert(session2)

      const { invoke } = require('@tauri-apps/api/core')
      const sessions = await invoke('db_get_sessions')

      expect(sessions).toHaveLength(2)
      expect(sessions).toContainEqual(session1)
      expect(sessions).toContainEqual(session2)
    })

    it('should handle empty session list', async () => {
      const { invoke } = require('@tauri-apps/api/core')
      const sessions = await invoke('db_get_sessions')

      expect(sessions).toEqual([])
    })
  })

  describe('Session Updates', () => {
    it('should update session properties', async () => {
      const originalSession = createMockSession({ name: 'Original Name' })
      mockDb.insert(originalSession)

      const updateData = {
        id: originalSession.id,
        name: 'Updated Name',
        status: 'completed'
      }

      const { invoke } = require('@tauri-apps/api/core')
      const result = await invoke('db_update_session', updateData)

      expect(result.name).toBe(updateData.name)
      expect(result.status).toBe(updateData.status)
      expect(result.id).toBe(originalSession.id)
    })

    it('should preserve unchanged properties during update', async () => {
      const originalSession = createMockSession({ 
        name: 'Original Name',
        projectId: 'project-1'
      })
      mockDb.insert(originalSession)

      const updateData = {
        id: originalSession.id,
        name: 'Updated Name'
      }

      const { invoke } = require('@tauri-apps/api/core')
      const result = await invoke('db_update_session', updateData)

      expect(result.name).toBe(updateData.name)
      expect(result.projectId).toBe(originalSession.projectId)
    })
  })

  describe('Session Lifecycle', () => {
    it('should start a session', async () => {
      const session = createMockSession()
      mockDb.insert(session)

      const { invoke } = require('@tauri-apps/api/core')
      const result = await invoke('session_start', { id: session.id })

      expect(result.sessionId).toBe(session.id)
      expect(result.status).toBe('started')
      expect(result.timestamp).toBeDefined()
    })

    it('should stop a session', async () => {
      const session = createMockSession({ status: 'running' })
      mockDb.insert(session)

      const { invoke } = require('@tauri-apps/api/core')
      const result = await invoke('session_stop', { id: session.id })

      expect(result.sessionId).toBe(session.id)
      expect(result.status).toBe('stopped')
      expect(result.timestamp).toBeDefined()
    })
  })

  describe('Session Deletion', () => {
    it('should delete a session', async () => {
      const session = createMockSession()
      mockDb.insert(session)

      const { invoke } = require('@tauri-apps/api/core')
      const result = await invoke('db_delete_session', { id: session.id })

      expect(result.success).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockTauriInvoke({
        'db_create_session': () => {
          throw new Error('Database connection failed')
        }
      })

      const { invoke } = require('@tauri-apps/api/core')
      
      await expect(invoke('db_create_session', { name: 'Test' }))
        .rejects.toThrow('Database connection failed')
    })

    it('should handle invalid session data', async () => {
      mockTauriInvoke({
        'db_create_session': (args: any) => {
          if (!args.name) {
            throw new Error('Session name is required')
          }
          return createMockSession(args)
        }
      })

      const { invoke } = require('@tauri-apps/api/core')
      
      await expect(invoke('db_create_session', {}))
        .rejects.toThrow('Session name is required')
    })
  })

  describe('Performance', () => {
    it('should handle large number of sessions efficiently', async () => {
      // Create 1000 mock sessions
      const sessions = Array.from({ length: 1000 }, (_, i) => 
        createMockSession({ name: `Session ${i}` })
      )
      
      sessions.forEach(session => mockDb.insert(session))

      const { invoke } = require('@tauri-apps/api/core')
      
      const start = performance.now()
      const result = await invoke('db_get_sessions')
      const end = performance.now()

      expect(result).toHaveLength(1000)
      expect(end - start).toBeLessThan(100) // Should complete in under 100ms
    })
  })

  describe('Concurrent Operations', () => {
    it('should handle concurrent session creation', async () => {
      const { invoke } = require('@tauri-apps/api/core')
      
      const promises = Array.from({ length: 10 }, (_, i) =>
        invoke('db_create_session', { name: `Concurrent Session ${i}` })
      )

      const results = await Promise.all(promises)
      
      expect(results).toHaveLength(10)
      
      // All sessions should have unique IDs
      const ids = results.map(r => r.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(10)
    })

    it('should handle concurrent updates to the same session', async () => {
      const session = createMockSession()
      mockDb.insert(session)

      const { invoke } = require('@tauri-apps/api/core')
      
      const updates = [
        { id: session.id, name: 'Update 1' },
        { id: session.id, name: 'Update 2' },
        { id: session.id, name: 'Update 3' }
      ]

      const promises = updates.map(update =>
        invoke('db_update_session', update)
      )

      const results = await Promise.all(promises)
      
      expect(results).toHaveLength(3)
      // Last update should win
      expect(results[2].name).toBe('Update 3')
    })
  })
})