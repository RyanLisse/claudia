import { render, type RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'
import { vi } from 'vitest'
import React from 'react'

// Mock providers for testing
export const createMockProvider = (props: any = {}) => {
  return ({ children }: { children: React.ReactNode }) => 
    React.createElement('div', { 'data-testid': 'mock-provider', ...props }, children)
}

// Custom render function with providers
export const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  const AllTheProviders = createMockProvider()
  
  return render(ui, { wrapper: AllTheProviders, ...options })
}

// Mock Tauri invoke with custom responses
export const mockTauriInvoke = (responses: Record<string, any>) => {
  const { invoke } = require('@tauri-apps/api/core')
  invoke.mockImplementation((command: string, args?: any) => {
    if (responses[command]) {
      return Promise.resolve(responses[command])
    }
    return Promise.reject(new Error(`Mock not found for command: ${command}`))
  })
}

// Test data factories
export const createMockSession = (overrides: any = {}) => ({
  id: 'test-session-1',
  name: 'Test Session',
  status: 'active',
  createdAt: new Date().toISOString(),
  messages: [],
  ...overrides
})

export const createMockAgent = (overrides: any = {}) => ({
  id: 'test-agent-1',
  name: 'Test Agent',
  type: 'researcher',
  status: 'active',
  capabilities: ['research', 'analysis'],
  ...overrides
})

export const createMockProject = (overrides: any = {}) => ({
  id: 'test-project-1',
  name: 'Test Project',
  path: '/test/path',
  type: 'javascript',
  ...overrides
})

// Async testing utilities
export const waitForElement = async (
  getElement: () => Element | null,
  timeout = 5000
): Promise<Element> => {
  const start = Date.now()
  
  while (Date.now() - start < timeout) {
    const element = getElement()
    if (element) return element
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  
  throw new Error('Element not found within timeout')
}

// Event simulation helpers
export const simulateKeyPress = (element: Element, key: string) => {
  const event = new KeyboardEvent('keydown', { key })
  element.dispatchEvent(event)
}

export const simulateFileUpload = (input: HTMLInputElement, file: File) => {
  const dt = new DataTransfer()
  dt.items.add(file)
  input.files = dt.files
  
  const event = new Event('change', { bubbles: true })
  input.dispatchEvent(event)
}

// Performance testing utilities
export const measurePerformance = async (fn: () => Promise<void> | void) => {
  const start = performance.now()
  await fn()
  const end = performance.now()
  return end - start
}

// Database testing utilities (for integration tests)
export const createTestDatabase = () => ({
  // Mock database operations
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  select: vi.fn(),
  clear: vi.fn(),
})

// API testing utilities
export const createMockResponse = (data: any, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data)),
})

// Component testing utilities
export const getByTestId = (container: Element, testId: string) => {
  const element = container.querySelector(`[data-testid="${testId}"]`)
  if (!element) {
    throw new Error(`Element with data-testid="${testId}" not found`)
  }
  return element
}

// Error boundary testing
export const triggerError = (component: any, error: Error) => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  try {
    throw error
  } finally {
    spy.mockRestore()
  }
}

export * from '@testing-library/react'
export { vi }