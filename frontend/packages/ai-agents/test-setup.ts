import { vi } from 'vitest';
import '@testing-library/jest-dom';

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

// Mock isomorphic-dompurify for testing
vi.mock('isomorphic-dompurify', () => ({
  default: {
    sanitize: vi.fn((input: string) => input.replace(/</g, '&lt;').replace(/>/g, '&gt;'))
  }
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

// Setup browser globals for Node.js environment
Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (test)',
    language: 'en-US',
    languages: ['en-US', 'en'],
    platform: 'test',
    cookieEnabled: true,
    doNotTrack: null
  },
  writable: true
});

Object.defineProperty(global, 'window', {
  value: {
    location: {
      href: 'http://localhost:3000/',
      origin: 'http://localhost:3000',
      pathname: '/',
      search: '',
      hash: ''
    },
    localStorage: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    },
    sessionStorage: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  },
  writable: true
});

// Setup console for testing
Object.defineProperty(global, 'console', {
  value: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn()
  },
  writable: true
});

// Setup timers - use vi.useFakeTimers() for better control
vi.useFakeTimers();

Object.defineProperty(global, 'setTimeout', {
  value: vi.fn().mockImplementation((callback, delay) => {
    const id = Math.random();
    return id;
  }),
  writable: true
});

Object.defineProperty(global, 'clearTimeout', {
  value: vi.fn(),
  writable: true
});

Object.defineProperty(global, 'setInterval', {
  value: vi.fn().mockImplementation((callback, delay) => {
    const id = Math.random();
    return id;
  }),
  writable: true
});

Object.defineProperty(global, 'clearInterval', {
  value: vi.fn(),
  writable: true
});