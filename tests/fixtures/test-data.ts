// Mock data for tests
export const mockUsers = [
  {
    id: '1',
    name: 'Test User 1',
    email: 'test1@example.com',
    role: 'admin'
  },
  {
    id: '2',
    name: 'Test User 2',
    email: 'test2@example.com',
    role: 'user'
  }
]

export const mockProjects = [
  {
    id: 'project-1',
    name: 'React App',
    path: '/projects/react-app',
    type: 'react',
    description: 'A sample React application',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z'
  },
  {
    id: 'project-2',
    name: 'Node API',
    path: '/projects/node-api',
    type: 'node',
    description: 'A REST API built with Node.js',
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-04T00:00:00Z'
  }
]

export const mockSessions = [
  {
    id: 'session-1',
    name: 'Development Session',
    projectId: 'project-1',
    status: 'active',
    startTime: '2024-01-01T10:00:00Z',
    endTime: null,
    messages: [
      {
        id: 'msg-1',
        type: 'user',
        content: 'Create a new component',
        timestamp: '2024-01-01T10:01:00Z'
      },
      {
        id: 'msg-2',
        type: 'assistant',
        content: 'I\'ll create a new React component for you.',
        timestamp: '2024-01-01T10:01:30Z'
      }
    ]
  }
]

export const mockAgents = [
  {
    id: 'agent-1',
    name: 'Code Reviewer',
    type: 'reviewer',
    status: 'active',
    capabilities: ['code-review', 'testing', 'documentation'],
    description: 'Specialized in code review and quality assurance'
  },
  {
    id: 'agent-2',
    name: 'Architecture Analyst',
    type: 'architect',
    status: 'idle',
    capabilities: ['system-design', 'architecture', 'planning'],
    description: 'Focuses on system architecture and design patterns'
  }
]

export const mockFiles = [
  {
    path: '/src/components/Button.tsx',
    content: `import React from 'react'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary'
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'primary' 
}) => {
  return (
    <button 
      className={\`btn btn-\${variant}\`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}`,
    type: 'typescript',
    size: 345,
    lastModified: '2024-01-01T12:00:00Z'
  },
  {
    path: '/src/utils/helpers.ts',
    content: `export const formatDate = (date: Date): string => {
  return date.toLocaleDateString()
}

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void => {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}`,
    type: 'typescript',
    size: 512,
    lastModified: '2024-01-01T11:30:00Z'
  }
]

export const mockConfigurations = {
  tauri: {
    package: {
      productName: "Claudia Test",
      version: "0.1.0"
    },
    tauri: {
      allowlist: {
        all: false,
        shell: {
          all: false,
          open: true
        }
      }
    }
  },
  vscode: {
    settings: {
      "typescript.preferences.preferTypeOnlyAutoImports": true,
      "editor.formatOnSave": true
    }
  }
}

export const mockApiResponses = {
  success: {
    status: 'success',
    data: { message: 'Operation completed successfully' }
  },
  error: {
    status: 'error',
    message: 'Something went wrong',
    code: 'GENERIC_ERROR'
  },
  validation: {
    status: 'error',
    message: 'Validation failed',
    errors: [
      { field: 'name', message: 'Name is required' },
      { field: 'email', message: 'Invalid email format' }
    ]
  }
}

// Test environment configurations
export const testEnvironments = {
  development: {
    API_URL: 'http://localhost:3000',
    DEBUG: true,
    LOG_LEVEL: 'debug'
  },
  testing: {
    API_URL: 'http://localhost:3001',
    DEBUG: false,
    LOG_LEVEL: 'error'
  },
  production: {
    API_URL: 'https://api.example.com',
    DEBUG: false,
    LOG_LEVEL: 'warn'
  }
}