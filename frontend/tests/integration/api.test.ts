import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { app } from '../../apps/api/src/index';
import { db } from '@claudia/db';
import { mockInputs, mockDbResponses, testEnv } from '../fixtures/test-data';

// Mock the database
vi.mock('@claudia/db', () => ({
  db: {
    query: {
      aiSessions: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      agents: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock Inngest
vi.mock('../../apps/api/src/inngest/client', () => ({
  inngest: {
    send: vi.fn(),
  },
}));

describe('API Integration Tests', () => {
  beforeEach(() => {
    // Set up test environment
    Object.assign(process.env, testEnv);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Health Check', () => {
    it('should return OK status', async () => {
      const response = await app.request('/health');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ status: 'ok', runtime: 'bun' });
    });
  });

  describe('Sessions API', () => {
    describe('GET /api/sessions', () => {
      it('should return list of sessions', async () => {
        vi.mocked(db.query.aiSessions.findMany).mockResolvedValue(mockDbResponses.sessions.findMany);

        const response = await app.request('/api/sessions');
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('sessions');
        expect(Array.isArray(data.sessions)).toBe(true);
        expect(db.query.aiSessions.findMany).toHaveBeenCalledWith({
          orderBy: expect.any(Array),
          limit: 50,
        });
      });

      it('should handle database errors', async () => {
        vi.mocked(db.query.aiSessions.findMany).mockRejectedValue(new Error('Database error'));

        const response = await app.request('/api/sessions');
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toEqual({ error: 'Failed to fetch sessions' });
      });
    });

    describe('POST /api/sessions', () => {
      it('should create a new session', async () => {
        vi.mocked(db.insert).mockResolvedValue(mockDbResponses.sessions.insert);

        const response = await app.request('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mockInputs.createSession.valid),
        });
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data).toHaveProperty('session');
        expect(data.session.name).toBe(mockInputs.createSession.valid.name);
      });

      it('should validate input data', async () => {
        const response = await app.request('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mockInputs.createSession.invalid),
        });

        expect(response.status).toBe(400);
      });
    });

    describe('GET /api/sessions/:id', () => {
      it('should return single session', async () => {
        vi.mocked(db.query.aiSessions.findFirst).mockResolvedValue(mockDbResponses.sessions.findFirst);

        const response = await app.request('/api/sessions/123e4567-e89b-12d3-a456-426614174001');
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('session');
        expect(data.session.id).toBe('123e4567-e89b-12d3-a456-426614174001');
      });

      it('should return 404 for non-existent session', async () => {
        vi.mocked(db.query.aiSessions.findFirst).mockResolvedValue(undefined);

        const response = await app.request('/api/sessions/non-existent-id');
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data).toEqual({ error: 'Session not found' });
      });
    });
  });

  describe('Agents API', () => {
    describe('GET /api/agents', () => {
      it('should return list of agents', async () => {
        vi.mocked(db.query.agents.findMany).mockResolvedValue(mockDbResponses.agents.findMany);

        const response = await app.request('/api/agents');
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('agents');
        expect(Array.isArray(data.agents)).toBe(true);
        expect(db.query.agents.findMany).toHaveBeenCalledWith({
          orderBy: expect.any(Array),
          limit: 50,
        });
      });
    });

    describe('POST /api/agents', () => {
      it('should create a new agent', async () => {
        vi.mocked(db.insert).mockResolvedValue(mockDbResponses.agents.insert);

        const response = await app.request('/api/agents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mockInputs.createAgent.valid),
        });
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data).toHaveProperty('agent');
        expect(data.agent.type).toBe(mockInputs.createAgent.valid.type);
      });

      it('should validate input data', async () => {
        const response = await app.request('/api/agents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mockInputs.createAgent.invalid),
        });

        expect(response.status).toBe(400);
      });
    });

    describe('GET /api/agents/:id', () => {
      it('should return single agent', async () => {
        vi.mocked(db.query.agents.findFirst).mockResolvedValue(mockDbResponses.agents.findFirst);

        const response = await app.request('/api/agents/123e4567-e89b-12d3-a456-426614174000');
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('agent');
        expect(data.agent.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      });

      it('should return 404 for non-existent agent', async () => {
        vi.mocked(db.query.agents.findFirst).mockResolvedValue(undefined);

        const response = await app.request('/api/agents/non-existent-id');
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data).toEqual({ error: 'Agent not found' });
      });
    });
  });

  describe('Inngest Integration', () => {
    it('should handle inngest webhook', async () => {
      const response = await app.request('/api/inngest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'test' }),
      });

      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown routes', async () => {
      const response = await app.request('/api/unknown');
      expect(response.status).toBe(404);
    });

    it('should handle server errors gracefully', async () => {
      vi.mocked(db.query.aiSessions.findMany).mockRejectedValue(new Error('Database connection failed'));

      const response = await app.request('/api/sessions');
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch sessions' });
    });
  });
});