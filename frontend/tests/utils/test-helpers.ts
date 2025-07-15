import { vi, type MockedFunction } from 'vitest';
import { type Agent, type Session } from '@claudia/db';

/**
 * Test helpers for database operations
 */
export const mockDb = {
  query: {
    agents: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    aiSessions: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

/**
 * Factory functions for creating test data
 */
export const createMockAgent = (overrides: Partial<Agent> = {}): Agent => ({
  id: '123e4567-e89b-12d3-a456-426614174000',
  sessionId: '123e4567-e89b-12d3-a456-426614174001',
  type: 'coder',
  status: 'idle',
  capabilities: ['typescript', 'react'],
  currentTask: null,
  memory: {},
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  ...overrides,
});

export const createMockSession = (overrides: Partial<Session> = {}): Session => ({
  id: '123e4567-e89b-12d3-a456-426614174000',
  userId: '123e4567-e89b-12d3-a456-426614174001',
  name: 'Test Session',
  status: 'active',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  ...overrides,
});

/**
 * Test environment setup
 */
export const setupTestEnvironment = () => {
  // Mock environment variables
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
  process.env.NODE_ENV = 'test';
  process.env.INNGEST_EVENT_KEY = 'test-event-key';
  process.env.INNGEST_SIGNING_KEY = 'test-signing-key';
};

/**
 * Async utilities for testing
 */
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mock HTTP request/response helpers
 */
export const createMockRequest = (options: {
  method?: string;
  url?: string;
  body?: any;
  headers?: Record<string, string>;
} = {}) => {
  const {
    method = 'GET',
    url = '/',
    body = null,
    headers = {}
  } = options;

  return {
    method,
    url,
    json: vi.fn().mockResolvedValue(body),
    headers: new Headers(headers),
    param: vi.fn((key: string) => {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      return urlParams.get(key);
    }),
    valid: vi.fn().mockReturnValue(body),
  };
};

export const createMockResponse = () => ({
  json: vi.fn(),
  text: vi.fn(),
  status: vi.fn().mockReturnThis(),
  headers: vi.fn().mockReturnThis(),
});

/**
 * Validation helpers
 */
export const validateUUID = (value: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

export const validateTimestamp = (value: string | Date): boolean => {
  const date = new Date(value);
  return !isNaN(date.getTime());
};

/**
 * Error testing utilities
 */
export const expectError = async (
  fn: () => Promise<any>,
  expectedMessage?: string
): Promise<Error> => {
  try {
    await fn();
    throw new Error('Expected function to throw an error');
  } catch (error) {
    if (expectedMessage && error.message !== expectedMessage) {
      throw new Error(`Expected error message "${expectedMessage}", got "${error.message}"`);
    }
    return error as Error;
  }
};

/**
 * Coverage helpers
 */
export const mockAllMethods = <T extends Record<string, any>>(obj: T): T => {
  const mocked = { ...obj };
  Object.keys(mocked).forEach(key => {
    if (typeof mocked[key] === 'function') {
      mocked[key] = vi.fn();
    }
  });
  return mocked;
};