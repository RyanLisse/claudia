import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// Mock tRPC client
const mockTrpcClient = {
  agents: {
    list: {
      useQuery: () => ({ data: [], isLoading: false }),
      useMutation: () => ({ mutate: vi.fn(), isLoading: false }),
    },
    create: {
      useMutation: () => ({ mutate: vi.fn(), isLoading: false }),
    },
  },
  sessions: {
    list: {
      useQuery: () => ({ data: [], isLoading: false }),
    },
  },
}

const TRPCProvider = ({ children }: { children: React.ReactNode }) => <div>{children}</div>

// Mock Chat component
const MockChat = () => <div data-testid="chat-component">Chat Component</div>

// Import the mocked components
const Chat = MockChat

/**
 * Integration Tests for Frontend-Backend Communication
 * Tests the complete flow from UI interactions to backend processing
 */
describe('Frontend-Backend Integration', () => {
  let server: ReturnType<typeof setupServer>
  let queryClient: QueryClient
  let trpcClient: any

  // Mock handlers for MSW
  const mockTrpcHandlers = createTRPCMsw({
    router: appRouter,
    baseUrl: 'http://localhost:3001',
  })

  beforeAll(() => {
    // Setup MSW server with TRPC handlers
    server = setupServer(...mockTrpcHandlers)
    server.listen()

    // Setup TRPC client
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    trpcClient = trpc.createClient({
      url: 'http://localhost:3001/trpc',
    })
  })

  afterAll(() => {
    server.close()
  })

  beforeEach(() => {
    server.resetHandlers()
    queryClient.clear()
  })

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      React.createElement(QueryClientProvider, { client: queryClient },
        React.createElement(TRPCProvider, { client: trpcClient, queryClient: queryClient },
          component
        )
      )
    )
  }

  describe('Agent Management Flow', () => {
    it('should create, list, and execute agents end-to-end', async () => {
      // Mock agent creation endpoint
      server.use(
        mockTrpcHandlers.agents.create.mutation(async () => ({
          id: 'agent-123',
          name: 'Test Agent',
          type: 'coder',
          status: 'idle',
          capabilities: ['code-generation'],
          createdAt: new Date(),
          updatedAt: new Date()
        }))
      )

      // Mock agent list endpoint
      server.use(
        mockTrpcHandlers.agents.list.query(async () => ([
          {
            id: 'agent-123',
            name: 'Test Agent',
            type: 'coder',
            status: 'idle',
            capabilities: ['code-generation'],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]))
      )

      // Mock agent execution endpoint
      server.use(
        mockTrpcHandlers.agents.execute.mutation(async ({ input }) => ({
          success: true,
          result: `Task "${input.task}" completed successfully`,
          executionTime: 2500,
          artifacts: ['component.tsx', 'component.test.tsx']
        }))
      )

      // Render the agent management component
      const AgentManagement = () => {
        const [agents, setAgents] = React.useState([])
        const createAgentMutation = trpc.agents.create.useMutation()
        const listAgentsQuery = trpc.agents.list.useQuery()
        const executeAgentMutation = trpc.agents.execute.useMutation()

        const handleCreateAgent = async () => {
          const result = await createAgentMutation.mutateAsync({
            name: 'Test Agent',
            type: 'coder',
            capabilities: ['code-generation']
          })
          
          // Refresh agent list
          await listAgentsQuery.refetch()
        }

        const handleExecuteTask = async (agentId: string) => {
          await executeAgentMutation.mutateAsync({
            agentId,
            task: 'Generate React component'
          })
        }

        return (
          <div>
            <button onClick={handleCreateAgent} data-testid="create-agent">
              Create Agent
            </button>
            
            {listAgentsQuery.data?.map(agent => (
              <div key={agent.id} data-testid={`agent-${agent.id}`}>
                <span>{agent.name}</span>
                <span>{agent.status}</span>
                <button 
                  onClick={() => handleExecuteTask(agent.id)}
                  data-testid={`execute-${agent.id}`}
                >
                  Execute Task
                </button>
              </div>
            ))}

            {executeAgentMutation.data && (
              <div data-testid="execution-result">
                {executeAgentMutation.data.result}
              </div>
            )}
          </div>
        )
      }

      renderWithProviders(<AgentManagement />)

      // Step 1: Create an agent
      const createButton = screen.getByTestId('create-agent')
      await userEvent.click(createButton)

      // Wait for agent to appear in list
      await waitFor(() => {
        expect(screen.getByTestId('agent-agent-123')).toBeInTheDocument()
      })

      // Verify agent details
      expect(screen.getByText('Test Agent')).toBeInTheDocument()
      expect(screen.getByText('idle')).toBeInTheDocument()

      // Step 2: Execute a task
      const executeButton = screen.getByTestId('execute-agent-123')
      await userEvent.click(executeButton)

      // Wait for execution result
      await waitFor(() => {
        expect(screen.getByTestId('execution-result')).toBeInTheDocument()
      })

      expect(screen.getByText('Task "Generate React component" completed successfully'))
        .toBeInTheDocument()
    })

    it('should handle agent errors gracefully', async () => {
      // Mock error response
      server.use(
        mockTrpcHandlers.agents.create.mutation(() => {
          throw new Error('Agent creation failed: Invalid configuration')
        })
      )

      const ErrorHandlingComponent = () => {
        const [error, setError] = React.useState<string | null>(null)
        const createAgentMutation = trpc.agents.create.useMutation({
          onError: (error) => {
            setError(error.message)
          }
        })

        const handleCreateAgent = async () => {
          try {
            await createAgentMutation.mutateAsync({
              name: '',
              type: 'invalid',
              capabilities: []
            })
          } catch (err) {
            // Error handled by onError callback
          }
        }

        return (
          <div>
            <button onClick={handleCreateAgent} data-testid="create-agent">
              Create Agent
            </button>
            {error && (
              <div data-testid="error-message" role="alert">
                {error}
              </div>
            )}
          </div>
        )
      }

      renderWithProviders(<ErrorHandlingComponent />)

      const createButton = screen.getByTestId('create-agent')
      await userEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument()
      })

      expect(screen.getByText('Agent creation failed: Invalid configuration'))
        .toBeInTheDocument()
    })
  })

  describe('Real-time Communication', () => {
    it('should handle real-time updates via WebSocket', async () => {
      // Mock WebSocket subscription
      const mockSubscription = vi.fn()
      
      server.use(
        mockTrpcHandlers.agents.subscribe.subscription(() => {
          // Simulate real-time updates
          const updates = [
            { type: 'agent_status_changed', agentId: 'agent-1', status: 'busy' },
            { type: 'task_completed', agentId: 'agent-1', taskId: 'task-123' },
            { type: 'agent_status_changed', agentId: 'agent-1', status: 'idle' }
          ]

          return updates
        })
      )

      const RealTimeComponent = () => {
        const [updates, setUpdates] = React.useState<any[]>([])
        
        trpc.agents.subscribe.useSubscription(undefined, {
          onData: (update) => {
            setUpdates(prev => [...prev, update])
          }
        })

        return (
          <div>
            <h3>Real-time Updates</h3>
            {updates.map((update, index) => (
              <div key={index} data-testid={`update-${index}`}>
                {update.type}: {update.agentId} - {update.status || update.taskId}
              </div>
            ))}
          </div>
        )
      }

      renderWithProviders(<RealTimeComponent />)

      // Wait for subscription updates
      await waitFor(() => {
        expect(screen.getByTestId('update-0')).toBeInTheDocument()
      }, { timeout: 5000 })

      expect(screen.getByText(/agent_status_changed: agent-1 - busy/))
        .toBeInTheDocument()
      expect(screen.getByText(/task_completed: agent-1 - task-123/))
        .toBeInTheDocument()
    })
  })

  describe('Chat Interface Integration', () => {
    it('should send messages and receive responses', async () => {
      // Mock chat endpoints
      server.use(
        mockTrpcHandlers.chat.sendMessage.mutation(async ({ input }) => ({
          id: 'msg-123',
          content: input.content,
          role: 'user',
          timestamp: new Date(),
          sessionId: input.sessionId
        }))
      )

      server.use(
        mockTrpcHandlers.chat.getResponse.mutation(async ({ input }) => ({
          id: 'response-123',
          content: `AI response to: ${input.message}`,
          role: 'assistant',
          timestamp: new Date(),
          sessionId: input.sessionId
        }))
      )

      renderWithProviders(<Chat sessionId="session-123" />)

      // Find and interact with chat input
      const chatInput = screen.getByPlaceholderText(/type your message/i)
      const sendButton = screen.getByRole('button', { name: /send/i })

      // Type and send message
      await userEvent.type(chatInput, 'Hello, can you help me with React testing?')
      await userEvent.click(sendButton)

      // Wait for user message to appear
      await waitFor(() => {
        expect(screen.getByText('Hello, can you help me with React testing?'))
          .toBeInTheDocument()
      })

      // Wait for AI response
      await waitFor(() => {
        expect(screen.getByText(/AI response to: Hello, can you help me with React testing/))
          .toBeInTheDocument()
      })

      // Verify message structure
      const userMessage = screen.getByTestId('message-user-msg-123')
      const aiMessage = screen.getByTestId('message-assistant-response-123')
      
      expect(userMessage).toBeInTheDocument()
      expect(aiMessage).toBeInTheDocument()
    })

    it('should handle streaming responses', async () => {
      // Mock streaming response
      server.use(
        mockTrpcHandlers.chat.streamResponse.subscription(({ input }) => {
          const chunks = [
            'I can definitely help',
            ' you with React testing.',
            ' Here are some best practices...'
          ]

          return chunks.map((chunk, index) => ({
            id: `chunk-${index}`,
            content: chunk,
            isPartial: index < chunks.length - 1,
            sessionId: input.sessionId
          }))
        })
      )

      const StreamingChat = () => {
        const [streamingContent, setStreamingContent] = React.useState('')
        
        trpc.chat.streamResponse.useSubscription(
          { sessionId: 'session-123', message: 'Help with testing' },
          {
            onData: (chunk) => {
              setStreamingContent(prev => prev + chunk.content)
            }
          }
        )

        return (
          <div>
            <div data-testid="streaming-response">
              {streamingContent}
            </div>
          </div>
        )
      }

      renderWithProviders(<StreamingChat />)

      // Wait for streaming content to complete
      await waitFor(() => {
        const response = screen.getByTestId('streaming-response')
        expect(response).toHaveTextContent(
          'I can definitely help you with React testing. Here are some best practices...'
        )
      }, { timeout: 5000 })
    })
  })

  describe('State Synchronization', () => {
    it('should synchronize state between frontend and backend', async () => {
      // Mock state sync endpoints
      server.use(
        mockTrpcHandlers.sync.getState.query(async () => ({
          agents: [
            { id: 'agent-1', name: 'Synced Agent', status: 'idle' }
          ],
          tasks: [
            { id: 'task-1', title: 'Synced Task', status: 'pending' }
          ],
          lastSyncTime: new Date()
        }))
      )

      server.use(
        mockTrpcHandlers.sync.updateState.mutation(async ({ input }) => ({
          success: true,
          updatedAt: new Date(),
          conflicts: []
        }))
      )

      const SyncComponent = () => {
        const [localState, setLocalState] = React.useState(null)
        const syncQuery = trpc.sync.getState.useQuery()
        const syncMutation = trpc.sync.updateState.useMutation()

        const handleSync = async () => {
          const result = await syncMutation.mutateAsync({
            localState: localState,
            lastSyncTime: new Date()
          })
          
          if (result.success) {
            await syncQuery.refetch()
          }
        }

        return (
          <div>
            <button onClick={handleSync} data-testid="sync-button">
              Sync State
            </button>
            
            {syncQuery.data && (
              <div data-testid="synced-data">
                Agents: {syncQuery.data.agents.length}
                Tasks: {syncQuery.data.tasks.length}
              </div>
            )}
          </div>
        )
      }

      renderWithProviders(<SyncComponent />)

      const syncButton = screen.getByTestId('sync-button')
      await userEvent.click(syncButton)

      await waitFor(() => {
        expect(screen.getByTestId('synced-data')).toBeInTheDocument()
      })

      expect(screen.getByText('Agents: 1')).toBeInTheDocument()
      expect(screen.getByText('Tasks: 1')).toBeInTheDocument()
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should handle network failures gracefully', async () => {
      // Mock network failure
      server.use(
        mockTrpcHandlers.agents.list.query(() => {
          throw new Error('Network error')
        })
      )

      const ErrorRecoveryComponent = () => {
        const [retryCount, setRetryCount] = React.useState(0)
        const agentsQuery = trpc.agents.list.useQuery(undefined, {
          retry: (failureCount, error) => {
            if (failureCount < 3) {
              setRetryCount(failureCount + 1)
              return true
            }
            return false
          },
          retryDelay: 1000
        })

        return (
          <div>
            {agentsQuery.isLoading && (
              <div data-testid="loading">Loading...</div>
            )}
            
            {agentsQuery.error && (
              <div data-testid="error">
                Error: {agentsQuery.error.message}
                Retries: {retryCount}
              </div>
            )}
            
            <button 
              onClick={() => agentsQuery.refetch()}
              data-testid="retry-button"
            >
              Retry
            </button>
          </div>
        )
      }

      renderWithProviders(<ErrorRecoveryComponent />)

      // Wait for error to appear after retries
      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument()
      }, { timeout: 10000 })

      expect(screen.getByText(/Network error/)).toBeInTheDocument()
      expect(screen.getByText(/Retries: 3/)).toBeInTheDocument()
    })

    it('should handle authentication errors', async () => {
      // Mock auth error
      server.use(
        mockTrpcHandlers.agents.create.mutation(() => {
          const error = new Error('Unauthorized')
          error.code = 'UNAUTHORIZED'
          throw error
        })
      )

      const AuthErrorComponent = () => {
        const [authError, setAuthError] = React.useState(false)
        const createAgentMutation = trpc.agents.create.useMutation({
          onError: (error) => {
            if (error.data?.code === 'UNAUTHORIZED') {
              setAuthError(true)
            }
          }
        })

        const handleCreateAgent = async () => {
          await createAgentMutation.mutateAsync({
            name: 'Test Agent',
            type: 'coder',
            capabilities: ['code-generation']
          })
        }

        return (
          <div>
            <button onClick={handleCreateAgent} data-testid="create-agent">
              Create Agent
            </button>
            
            {authError && (
              <div data-testid="auth-error">
                Authentication required. Please log in.
              </div>
            )}
          </div>
        )
      }

      renderWithProviders(<AuthErrorComponent />)

      const createButton = screen.getByTestId('create-agent')
      await userEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByTestId('auth-error')).toBeInTheDocument()
      })

      expect(screen.getByText('Authentication required. Please log in.'))
        .toBeInTheDocument()
    })
  })
})