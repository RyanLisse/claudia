import { type Agent, type Session } from '@claudia/db';

/**
 * Test data fixtures for consistent testing
 */

export const mockAgents: Agent[] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    sessionId: '123e4567-e89b-12d3-a456-426614174001',
    type: 'coder',
    status: 'idle',
    capabilities: ['typescript', 'react', 'node.js'],
    currentTask: null,
    memory: {},
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174002',
    sessionId: '123e4567-e89b-12d3-a456-426614174001',
    type: 'research',
    status: 'busy',
    capabilities: ['web-search', 'data-analysis'],
    currentTask: { id: 'task-001', description: 'Research latest trends' },
    memory: { lastSearch: 'AI developments 2024' },
    createdAt: new Date('2024-01-01T01:00:00Z'),
    updatedAt: new Date('2024-01-01T01:30:00Z'),
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174003',
    sessionId: '123e4567-e89b-12d3-a456-426614174002',
    type: 'analyst',
    status: 'error',
    capabilities: ['data-visualization', 'statistics'],
    currentTask: null,
    memory: { lastError: 'Connection timeout' },
    createdAt: new Date('2024-01-01T02:00:00Z'),
    updatedAt: new Date('2024-01-01T02:15:00Z'),
  },
];

export const mockSessions: Session[] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174001',
    userId: '123e4567-e89b-12d3-a456-426614174100',
    name: 'Development Session',
    status: 'active',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174002',
    userId: '123e4567-e89b-12d3-a456-426614174101',
    name: 'Research Session',
    status: 'active',
    createdAt: new Date('2024-01-01T01:00:00Z'),
    updatedAt: new Date('2024-01-01T01:00:00Z'),
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174003',
    userId: '123e4567-e89b-12d3-a456-426614174100',
    name: 'Completed Session',
    status: 'completed',
    createdAt: new Date('2024-01-01T02:00:00Z'),
    updatedAt: new Date('2024-01-01T03:00:00Z'),
  },
];

/**
 * API response fixtures
 */
export const mockApiResponses = {
  sessions: {
    list: {
      sessions: mockSessions,
    },
    single: {
      session: mockSessions[0],
    },
    created: {
      session: mockSessions[0],
    },
  },
  agents: {
    list: {
      agents: mockAgents,
    },
    single: {
      agent: mockAgents[0],
    },
    created: {
      agent: mockAgents[0],
    },
  },
  errors: {
    notFound: {
      error: 'Resource not found',
    },
    validation: {
      error: 'Validation failed',
      details: ['Name is required', 'Invalid UUID format'],
    },
    server: {
      error: 'Internal Server Error',
    },
  },
};

/**
 * Input data for testing
 */
export const mockInputs = {
  createSession: {
    valid: {
      name: 'Test Session',
      userId: '123e4567-e89b-12d3-a456-426614174100',
    },
    invalid: {
      name: '', // Empty name
      userId: 'invalid-uuid', // Invalid UUID
    },
  },
  createAgent: {
    valid: {
      sessionId: '123e4567-e89b-12d3-a456-426614174001',
      type: 'coder' as const,
      capabilities: ['typescript', 'react'],
    },
    invalid: {
      sessionId: 'invalid-uuid',
      type: 'invalid-type' as any,
      capabilities: [],
    },
  },
};

/**
 * Database mock responses
 */
export const mockDbResponses = {
  sessions: {
    insert: [mockSessions[0]],
    findMany: mockSessions,
    findFirst: mockSessions[0],
  },
  agents: {
    insert: [mockAgents[0]],
    findMany: mockAgents,
    findFirst: mockAgents[0],
    update: [{ ...mockAgents[0], status: 'busy' }],
  },
};

/**
 * Test environment variables
 */
export const testEnv = {
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
  NODE_ENV: 'test',
  INNGEST_EVENT_KEY: 'test-event-key',
  INNGEST_SIGNING_KEY: 'test-signing-key',
  PORT: '3001',
};