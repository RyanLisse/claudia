import { vi } from 'vitest';

// Mock OpenAI for testing
vi.mock('openai', () => ({
  default: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn(() => ({
          choices: [{ message: { content: 'Mock response' } }]
        }))
      }
    }
  }))
}));

// Mock Inngest for testing
vi.mock('inngest', () => ({
  Inngest: vi.fn(() => ({
    send: vi.fn(),
    createFunction: vi.fn((config, trigger, fn) => fn)
  }))
}));

// Mock WebSocket for testing
vi.mock('ws', () => ({
  default: vi.fn()
}));

// Mock UUID for testing
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'test-uuid-123')
}));

// Setup global test environment
global.process = {
  ...global.process,
  env: {
    ...global.process.env,
    NODE_ENV: 'test',
    OPENAI_API_KEY: 'test-key',
    INNGEST_EVENT_KEY: 'test-event-key'
  }
};