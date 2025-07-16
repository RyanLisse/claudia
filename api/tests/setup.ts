/**
 * Test setup and utilities for the AI Agent System
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';
import type { MockTask, MockAgent, MockWebSocketClient } from './types';

// Mock environment variables for testing
const processEnv = (globalThis as Record<string, any>).process?.env;
if (processEnv) {
  processEnv.NODE_ENV = 'test';
  processEnv.PORT = '3001';
  processEnv.WS_PORT = '3002';
  processEnv.INNGEST_EVENT_KEY = 'test-event-key-12345678901234567890123456789012';
  processEnv.INNGEST_SIGNING_KEY = 'test-signing-key-12345678901234567890123456789012';
  processEnv.OPENAI_API_KEY = 'test-openai-key';
  processEnv.LOG_LEVEL = 'error'; // Reduce noise in tests
  processEnv.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only';
  processEnv.API_KEY = 'test-api-key-12345678901234567890123456789012';
  // Disable rate limiting in tests
  processEnv.DISABLE_RATE_LIMITING = 'true';
}

// Global test server instance
let testServer: unknown = null;

/**
 * Mock implementations for external services
 */
export const mocks = {
  // Inngest client mock
  inngestClient: {
    send: () => Promise.resolve({ success: true }),
    createFunction: (_config: unknown, _trigger: unknown, fn: unknown) => fn,
  },

  // WebSocket mock
  webSocket: {
    clients: new Map(),
    broadcast: () => {},
    send: () => {},
    close: () => {},
  },

  // OpenAI mock
  openai: {
    chat: {
      completions: {
        create: () => Promise.resolve({
          choices: [{ message: { content: 'Mock AI response' } }],
        }),
      },
    },
  },

  // Database mock (if needed)
  database: {
    query: () => Promise.resolve([]),
    insert: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({}),
  },
};

/**
 * Test utilities
 */
export const testUtils = {
  /**
   * Create a mock task object
   */
  createMockTask: (overrides: Partial<MockTask> = {}): MockTask => ({
    id: 'test-task-1',
    type: 'code-generation',
    payload: {
      prompt: 'Create a test function',
      context: { language: 'typescript' },
    },
    agentId: 'test-agent-1',
    priority: 'normal' as const,
    timeoutMs: 60000,
    maxRetries: 3,
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),

  /**
   * Create a mock agent object
   */
  createMockAgent: (overrides: Partial<MockAgent> = {}): MockAgent => ({
    id: 'test-agent-1',
    name: 'Test Agent',
    type: 'coder',
    capabilities: ['code-generation', 'code-review'],
    maxConcurrentTasks: 3,
    status: 'idle',
    currentTasks: [],
    metrics: {
      tasksCompleted: 10,
      tasksInProgress: 1,
      tasksFailed: 0,
      averageTaskTime: 5000,
      uptime: 86400000,
    },
    ...overrides,
  }),

  /**
   * Create a mock WebSocket client
   */
  createMockWebSocketClient: (overrides: Partial<MockWebSocketClient> = {}): MockWebSocketClient => ({
    id: 'test-client-1',
    ws: {
      send: () => {},
      close: () => {},
      readyState: 1, // OPEN
    },
    channels: new Set(['tasks']),
    lastPing: new Date(),
    metadata: {
      userAgent: 'test-agent',
      ip: '127.0.0.1',
      connectedAt: new Date(),
    },
    ...overrides,
  }),

  /**
   * Wait for a specified amount of time
   */
  wait: (ms: number) => new Promise(resolve => {
    if (typeof setTimeout !== 'undefined') {
      setTimeout(resolve, ms);
    } else {
      resolve(undefined);
    }
  }),

  /**
   * Generate a random ID for testing
   */
  generateId: () => `test-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,

  /**
   * Create a mock HTTP request
   */
  createMockRequest: (method: string, path: string, body?: unknown, headers?: Record<string, string>) => ({
    method,
    url: `http://localhost:3001${path}`,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  }),

  /**
   * Create a mock HTTP response
   */
  createMockResponse: (status: number, data?: unknown) => ({
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  }),
};

/**
 * Setup test server
 */
export async function setupTestServer() {
  if (testServer) return testServer;

  try {
    // Import the app
    const { default: app } = await import('../src/index');

    // Start the server (using globalThis to access Bun)
    const BunRuntime = (globalThis as any).Bun;
    if (BunRuntime) {
      testServer = BunRuntime.serve({
        port: 3001,
        fetch: app.fetch,
      });
    }

    // Wait for server to start
    await testUtils.wait(1000);

    return testServer;
  } catch (error) {
    if (typeof console !== 'undefined') {
      console.error('Failed to setup test server:', error);
    }
    throw error;
  }
}

/**
 * Cleanup test server
 */
export function cleanupTestServer() {
  if (testServer && typeof testServer === 'object' && 'stop' in testServer) {
    (testServer as any).stop();
    testServer = null;
  }
}

/**
 * Reset all mocks
 */
export function resetMocks() {
  // Reset mock implementations to their defaults
  mocks.inngestClient.send = () => Promise.resolve({ success: true });
  mocks.webSocket.broadcast = () => {};
  mocks.webSocket.send = () => {};
  mocks.webSocket.close = () => {};
  mocks.openai.chat.completions.create = () => Promise.resolve({
    choices: [{ message: { content: 'Mock AI response' } }],
  });
}

/**
 * Global test setup
 */
beforeAll(async () => {
  // Setup test server
  await setupTestServer();
});

afterAll(() => {
  // Cleanup test server
  cleanupTestServer();
});

beforeEach(() => {
  // Reset mocks before each test
  resetMocks();
});

afterEach(() => {
  // Additional cleanup if needed
});

/**
 * Test constants
 */
export const TEST_CONSTANTS = {
  API_BASE: 'http://localhost:3001',
  WS_BASE: 'ws://localhost:3002',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  MOCK_AGENT_ID: 'test-agent-1',
  MOCK_TASK_ID: 'test-task-1',
  MOCK_SESSION_ID: 'test-session-1',
};

/**
 * Custom matchers for testing
 */
export const customMatchers = {
  /**
   * Check if a task object has the required properties
   */
  toBeValidTask: (received: unknown) => {
    const requiredProps = ['id', 'type', 'payload', 'agentId', 'priority', 'status'];
    const hasAllProps = requiredProps.every(prop =>
      received && typeof received === 'object' && prop in received
    );

    return {
      pass: hasAllProps,
      message: () => hasAllProps
        ? `Expected task to be invalid`
        : `Expected task to have all required properties: ${requiredProps.join(', ')}`,
    };
  },

  /**
   * Check if an agent object has the required properties
   */
  toBeValidAgent: (received: unknown) => {
    const requiredProps = ['id', 'name', 'type', 'capabilities', 'status'];
    const hasAllProps = requiredProps.every(prop =>
      received && typeof received === 'object' && prop in received
    );

    return {
      pass: hasAllProps,
      message: () => hasAllProps
        ? `Expected agent to be invalid`
        : `Expected agent to have all required properties: ${requiredProps.join(', ')}`,
    };
  },
};

// Export everything for easy importing
export default {
  mocks,
  testUtils,
  setupTestServer,
  cleanupTestServer,
  resetMocks,
  TEST_CONSTANTS,
  customMatchers,
};
