import { beforeAll, afterAll, afterEach, vi } from 'vitest'
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
// Mock Service Worker setup would go here if needed
// import { setupServer } from 'msw/node'
// import { rest } from 'msw'

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

vi.mock('@tauri-apps/api/dialog', () => ({
  open: vi.fn(),
  save: vi.fn(),
  message: vi.fn(),
  ask: vi.fn(),
  confirm: vi.fn(),
}))

vi.mock('@tauri-apps/api/shell', () => ({
  Command: vi.fn().mockImplementation(() => ({
    execute: vi.fn(),
    spawn: vi.fn(),
  })),
}))

vi.mock('@tauri-apps/api/fs', () => ({
  readTextFile: vi.fn(),
  writeTextFile: vi.fn(),
  exists: vi.fn(),
  createDir: vi.fn(),
  removeFile: vi.fn(),
  removeDir: vi.fn(),
}))

vi.mock('@tauri-apps/plugin-global-shortcut', () => ({
  register: vi.fn(),
  unregister: vi.fn(),
  unregisterAll: vi.fn(),
}))

vi.mock('@tauri-apps/plugin-opener', () => ({
  open: vi.fn(),
}))

// Mock API responses for testing
const mockApiResponse = { message: 'Test API response' }

// Mock Inngest client to prevent API calls during tests
vi.mock('inngest', () => ({
  Inngest: vi.fn().mockImplementation(() => ({
    send: vi.fn().mockResolvedValue({ id: 'mock-event-id' }),
    createFunction: vi.fn().mockReturnValue({
      trigger: vi.fn().mockResolvedValue({ status: 'triggered' })
    })
  }))
}))

// Mock the Inngest client module specifically for agent tests
vi.mock('../src/agents/inngest/client.js', () => ({
  inngest: {
    send: vi.fn().mockResolvedValue({ id: 'mock-event-id' }),
    createFunction: vi.fn().mockReturnValue({
      trigger: vi.fn().mockResolvedValue({ status: 'triggered' })
    })
  }
}))

// Set up environment variables for testing
process.env.INNGEST_EVENT_KEY = 'test-event-key'
process.env.INNGEST_SIGNING_KEY = 'test-signing-key'
process.env.INNGEST_BASE_URL = 'http://localhost:3000/api/inngest'
process.env.NODE_ENV = 'test'

// Setup test environment
beforeAll(() => {
  // Setup global test environment
  console.log('Setting up test environment')
})

// Cleanup after all tests
afterAll(() => {
  // Cleanup test environment
  console.log('Cleaning up test environment')
})

// Reset state after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = vi.fn()

// Setup global test utilities
global.testUtils = {
  waitFor: (condition: () => boolean, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      const start = Date.now()
      const check = () => {
        if (condition()) {
          resolve(true)
        } else if (Date.now() - start > timeout) {
          reject(new Error('Timeout waiting for condition'))
        } else {
          setTimeout(check, 10)
        }
      }
      check()
    })
  }
}