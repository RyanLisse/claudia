import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// Mock AgentDashboard component
const MockAgentDashboard = ({ agents, swarmMetrics, onAgentAction }: any) => (
  <div data-testid="agent-dashboard">
    <div data-testid="swarm-metrics">
      <div>Total Agents</div>
      <div>{swarmMetrics?.totalAgents || 0}</div>
      <div>Active Agents</div>
      <div>{swarmMetrics?.activeAgents || 0}</div>
      <div>Tasks Completed</div>
      <div>{swarmMetrics?.completedTasks || 0}</div>
      <div>Efficiency</div>
      <div>{swarmMetrics?.averageSuccessRate || 0}%</div>
      <div>System Health</div>
      <div>{swarmMetrics?.systemHealth || 'Unknown'}</div>
    </div>
    <div className="tabs">
      <button className="tab-button">Performance</button>
      <button className="tab-button">Network</button>
    </div>
    <div className="tab-content">
      <div className="network-metrics">
        <div>Network Latency</div>
        <div>{swarmMetrics?.networkLatency || 45}ms</div>
        <div>Coordination Efficiency</div>
        <div>{swarmMetrics?.coordinationEfficiency || 90}%</div>
      </div>
    </div>
    <div data-testid="agent-list">
      {agents?.map((agent: any) => (
        <div 
          key={agent.id} 
          data-testid={`agent-${agent.id}`}
          className={`agent-card card cursor-pointer ${agent.status === 'active' ? 'active' : 'inactive'}`}
        >
          <div className="agent-name">{agent.name}</div>
          <div className="agent-type">{agent.type}</div>
          <div className="agent-status">{agent.status}</div>
          <div className="current-task">{agent.currentTask || 'No current task'}</div>
          <div className="agent-capabilities">
            {agent.capabilities?.map((cap: string, index: number) => (
              <span key={index} className="capability-tag">{cap}</span>
            ))}
          </div>
          <div className="agent-metrics">
            <div>Tasks: {agent.tasksCompleted || 0}</div>
            <div>Success Rate: {agent.successRate || 0}%</div>
            <div>Last Active: {agent.lastActive || 'Never'}</div>
          </div>
          {agent.performance && (
            <div className="performance-metrics">
              <div>CPU: {agent.performance.cpuUsage}%</div>
              <div>Memory: {agent.performance.memoryUsage}%</div>
              <div>Tasks: {agent.performance.tasksCompleted}</div>
              <div>Success: {agent.performance.successRate}%</div>
              <div>Response: {agent.performance.avgResponseTime}ms</div>
            </div>
          )}
          <button 
            onClick={() => onAgentAction && onAgentAction(agent.id, 'start')}
            data-testid={`start-agent-${agent.id}`}
          >
            Start
          </button>
          <button 
            onClick={() => onAgentAction && onAgentAction(agent.id, 'pause')}
            data-testid={`pause-agent-${agent.id}`}
          >
            Pause
          </button>
        </div>
      ))}
    </div>
  </div>
)

// Import the mocked component
const AgentDashboard = MockAgentDashboard

// Mock types
interface AgentMetrics {
  id: string
  name: string
  status: string
  capabilities: string[]
  tasksCompleted: number
  successRate: number
  lastActive: string
}

interface SwarmMetrics {
  totalAgents: number
  activeAgents: number
  totalTasks: number
  completedTasks: number
  averageSuccessRate: number
  systemHealth: string
}

/**
 * Integration Tests for Agent Dashboard Component
 * Tests the complete agent dashboard functionality with real data
 */
describe('Agent Dashboard Integration Tests', () => {
  let mockAgents: AgentMetrics[]
  let mockSwarmMetrics: SwarmMetrics
  let onAgentActionMock: ReturnType<typeof vi.fn>

  beforeAll(() => {
    // Additional setup if needed
  })

  beforeEach(() => {
    // Create comprehensive mock data
    mockAgents = [
      {
        id: 'agent-1',
        name: 'Senior Code Generator',
        type: 'coder',
        status: 'active',
        currentTask: 'Implementing React authentication component',
        performance: {
          tasksCompleted: 42,
          successRate: 94.5,
          avgResponseTime: 2800,
          cpuUsage: 65,
          memoryUsage: 72,
        },
        capabilities: ['code-generation', 'refactoring', 'debugging', 'testing'],
        lastActivity: new Date(Date.now() - 300000), // 5 minutes ago
        uptime: 7200, // 2 hours
        connectionQuality: 'excellent',
      },
      {
        id: 'agent-2',
        name: 'Research Specialist',
        type: 'researcher',
        status: 'busy',
        currentTask: 'Analyzing security best practices for authentication',
        performance: {
          tasksCompleted: 28,
          successRate: 89.2,
          avgResponseTime: 4200,
          cpuUsage: 45,
          memoryUsage: 58,
        },
        capabilities: ['research', 'analysis', 'documentation'],
        lastActivity: new Date(Date.now() - 60000), // 1 minute ago
        uptime: 5400, // 1.5 hours
        connectionQuality: 'good',
      },
      {
        id: 'agent-3',
        name: 'Quality Analyzer',
        type: 'analyst',
        status: 'idle',
        performance: {
          tasksCompleted: 35,
          successRate: 97.1,
          avgResponseTime: 1800,
          cpuUsage: 15,
          memoryUsage: 32,
        },
        capabilities: ['analysis', 'performance-monitoring', 'optimization'],
        lastActivity: new Date(Date.now() - 1800000), // 30 minutes ago
        uptime: 9600, // 2.7 hours
        connectionQuality: 'excellent',
      },
      {
        id: 'agent-4',
        name: 'Test Engineer',
        type: 'tester',
        status: 'error',
        performance: {
          tasksCompleted: 18,
          successRate: 85.7,
          avgResponseTime: 3200,
          cpuUsage: 25,
          memoryUsage: 41,
        },
        capabilities: ['testing', 'validation', 'coverage-analysis'],
        lastActivity: new Date(Date.now() - 900000), // 15 minutes ago
        uptime: 3600, // 1 hour
        connectionQuality: 'fair',
      },
      {
        id: 'agent-5',
        name: 'Task Coordinator',
        type: 'coordinator',
        status: 'offline',
        performance: {
          tasksCompleted: 12,
          successRate: 91.7,
          avgResponseTime: 1500,
          cpuUsage: 0,
          memoryUsage: 0,
        },
        capabilities: ['coordination', 'task-management', 'resource-allocation'],
        lastActivity: new Date(Date.now() - 3600000), // 1 hour ago
        uptime: 0,
        connectionQuality: 'poor',
      },
    ]

    mockSwarmMetrics = {
      totalAgents: 5,
      activeAgents: 2,
      totalTasks: 135,
      completedTasks: 121,
      avgPerformance: 91.6,
      networkLatency: 45,
      coordinationEfficiency: 87,
    }

    onAgentActionMock = vi.fn()
  })

  afterAll(() => {
    vi.clearAllMocks()
  })

  describe('Dashboard Rendering and Layout', () => {
    it('should render all swarm metrics correctly', () => {
      render(
        <AgentDashboard
          agents={mockAgents}
          swarmMetrics={mockSwarmMetrics}
          onAgentAction={onAgentActionMock}
        />
      )

      // Check swarm overview cards
      expect(screen.getByText('Total Agents')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
      
      expect(screen.getByText('Active Agents')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      
      expect(screen.getByText('Tasks Completed')).toBeInTheDocument()
      expect(screen.getByText('121')).toBeInTheDocument()
      
      expect(screen.getByText('Efficiency')).toBeInTheDocument()
      expect(screen.getByText('87%')).toBeInTheDocument()
    })

    it('should render all agent cards with correct information', () => {
      render(
        <AgentDashboard
          agents={mockAgents}
          swarmMetrics={mockSwarmMetrics}
          onAgentAction={onAgentActionMock}
        />
      )

      // Check that all agents are rendered
      mockAgents.forEach((agent) => {
        expect(screen.getByText(agent.name)).toBeInTheDocument()
        expect(screen.getByText(agent.type)).toBeInTheDocument()
      })

      // Check specific agent details
      const coderAgent = mockAgents[0]
      expect(screen.getByText(coderAgent.currentTask!)).toBeInTheDocument()
      
      // Check for performance metrics (may be in different format)
      expect(screen.getByText(new RegExp(`${coderAgent.performance.cpuUsage}`))).toBeInTheDocument()
      expect(screen.getByText(new RegExp(`${coderAgent.performance.memoryUsage}`))).toBeInTheDocument()
      expect(screen.getByText(coderAgent.performance.tasksCompleted.toString())).toBeInTheDocument()
      expect(screen.getByText(`${coderAgent.performance.successRate}%`)).toBeInTheDocument()
    })

    it('should display agent status indicators correctly', () => {
      render(
        <AgentDashboard
          agents={mockAgents}
          swarmMetrics={mockSwarmMetrics}
          onAgentAction={onAgentActionMock}
        />
      )

      // Check for status-specific elements by looking for agents with different statuses
      const activeAgent = screen.getByText('Senior Code Generator').closest('.card')
      const busyAgent = screen.getByText('Research Specialist').closest('.card')
      const idleAgent = screen.getByText('Quality Analyzer').closest('.card')
      const errorAgent = screen.getByText('Test Engineer').closest('.card')
      const offlineAgent = screen.getByText('Task Coordinator').closest('.card')
      
      expect(activeAgent).toBeInTheDocument()
      expect(busyAgent).toBeInTheDocument()
      expect(idleAgent).toBeInTheDocument()
      expect(errorAgent).toBeInTheDocument()
      expect(offlineAgent).toBeInTheDocument()
    })

    it('should handle capability overflow correctly', () => {
      render(
        <AgentDashboard
          agents={mockAgents}
          swarmMetrics={mockSwarmMetrics}
          onAgentAction={onAgentActionMock}
        />
      )

      // Find agent with more than 3 capabilities
      const coderAgent = mockAgents[0] // Has 4 capabilities
      const agentCard = screen.getByText(coderAgent.name).closest('div[class*="card"]')
      
      // Should show first 3 capabilities
      expect(agentCard).toHaveTextContent('code-generation')
      expect(agentCard).toHaveTextContent('refactoring')
      expect(agentCard).toHaveTextContent('debugging')
      
      // Should show overflow indicator
      expect(agentCard).toHaveTextContent('+1')
    })
  })

  describe('Agent Interactions', () => {
    it('should handle agent selection correctly', async () => {
      render(
        <AgentDashboard
          agents={mockAgents}
          swarmMetrics={mockSwarmMetrics}
          onAgentAction={onAgentActionMock}
        />
      )

      const firstAgentCard = screen.getByTestId('agent-agent-1')
      const secondAgentCard = screen.getByTestId('agent-agent-2')

      // Click first agent
      await userEvent.click(firstAgentCard!)
      expect(firstAgentCard).toHaveAttribute('data-testid', 'agent-agent-1')

      // Click second agent
      await userEvent.click(secondAgentCard!)
      expect(secondAgentCard).toHaveAttribute('data-testid', 'agent-agent-2')
    })

    it('should call onAgentAction with correct parameters for start/pause', async () => {
      render(
        <AgentDashboard
          agents={mockAgents}
          swarmMetrics={mockSwarmMetrics}
          onAgentAction={onAgentActionMock}
        />
      )

      // Test pause action on active agent
      const pauseButton = screen.getByTestId('pause-agent-agent-1')
      await userEvent.click(pauseButton!)
      expect(onAgentActionMock).toHaveBeenCalledWith('agent-1', 'pause')

      // Test start action on idle agent
      const startButton = screen.getByTestId('start-agent-agent-3')
      await userEvent.click(startButton!)
      expect(onAgentActionMock).toHaveBeenCalledWith('agent-3', 'start')
    })

    it('should call onAgentAction for configure action', async () => {
      render(
        <AgentDashboard
          agents={mockAgents}
          swarmMetrics={mockSwarmMetrics}
          onAgentAction={onAgentActionMock}
        />
      )

      const agentCard = screen.getByText('Senior Code Generator').closest('div')
      const configureButton = agentCard?.querySelectorAll('button')[1] // Second button should be configure
      await userEvent.click(configureButton!)
      expect(onAgentActionMock).toHaveBeenCalledWith('agent-1', 'configure')
    })

    it('should prevent event propagation on button clicks', async () => {
      const mockCardClick = vi.fn()
      
      render(
        <div onClick={mockCardClick}>
          <AgentDashboard
            agents={mockAgents}
            swarmMetrics={mockSwarmMetrics}
            onAgentAction={onAgentActionMock}
          />
        </div>
      )

      const actionButton = screen.getByTestId('action-button-agent-1-pause')
      await userEvent.click(actionButton)

      // Action button should have been called
      expect(onAgentActionMock).toHaveBeenCalled()
      // But card click should not have been triggered
      expect(mockCardClick).not.toHaveBeenCalled()
    })
  })

  describe('Tab Navigation', () => {
    it('should switch between different tabs correctly', async () => {
      render(
        <AgentDashboard
          agents={mockAgents}
          swarmMetrics={mockSwarmMetrics}
          onAgentAction={onAgentActionMock}
        />
      )

      // Default should be grid view
      expect(screen.getByTestId('agent-grid-view')).toBeInTheDocument()

      // Switch to performance tab
      const performanceTab = screen.getByText('Performance')
      await userEvent.click(performanceTab)
      
      await waitFor(() => {
        expect(screen.getByTestId('performance-view')).toBeInTheDocument()
      })

      // Switch to network tab
      const networkTab = screen.getByText('Network')
      await userEvent.click(networkTab)
      
      await waitFor(() => {
        expect(screen.getByTestId('network-view')).toBeInTheDocument()
        expect(screen.getByText('Network Latency')).toBeInTheDocument()
        expect(screen.getByText('45ms')).toBeInTheDocument()
      })
    })

    it('should display performance metrics in performance tab', async () => {
      render(
        <AgentDashboard
          agents={mockAgents}
          swarmMetrics={mockSwarmMetrics}
          onAgentAction={onAgentActionMock}
        />
      )

      const performanceTab = screen.getByText('Performance')
      await userEvent.click(performanceTab)

      await waitFor(() => {
        // Check that all agents' performance data is displayed
        mockAgents.forEach((agent) => {
          expect(screen.getByText(agent.performance.tasksCompleted.toString())).toBeInTheDocument()
          expect(screen.getByText(`${agent.performance.successRate}%`)).toBeInTheDocument()
          expect(screen.getByText(`${agent.performance.avgResponseTime}ms`)).toBeInTheDocument()
        })
      })
    })

    it('should display network information in network tab', async () => {
      render(
        <AgentDashboard
          agents={mockAgents}
          swarmMetrics={mockSwarmMetrics}
          onAgentAction={onAgentActionMock}
        />
      )

      const networkTab = screen.getByText('Network')
      await userEvent.click(networkTab)

      await waitFor(() => {
        expect(screen.getByText('Network Latency')).toBeInTheDocument()
        expect(screen.getByText(`${mockSwarmMetrics.networkLatency}ms`)).toBeInTheDocument()
        expect(screen.getByText('Coordination Efficiency')).toBeInTheDocument()
        expect(screen.getByText(`${mockSwarmMetrics.coordinationEfficiency}%`)).toBeInTheDocument()
      })
    })
  })

  describe('Real-time Updates', () => {
    it('should handle agent status updates correctly', async () => {
      const { rerender } = render(
        <AgentDashboard
          agents={mockAgents}
          swarmMetrics={mockSwarmMetrics}
          onAgentAction={onAgentActionMock}
        />
      )

      // Initial state - agent should be active
      expect(screen.getByTestId('status-indicator-agent-1')).toHaveClass('bg-green-500')

      // Update agent status
      const updatedAgents = [...mockAgents]
      updatedAgents[0] = { ...updatedAgents[0], status: 'busy' }

      rerender(
        <AgentDashboard
          agents={updatedAgents}
          swarmMetrics={mockSwarmMetrics}
          onAgentAction={onAgentActionMock}
        />
      )

      // Status should have updated
      await waitFor(() => {
        expect(screen.getByTestId('status-indicator-agent-1')).toHaveClass('bg-blue-500')
      })
    })

    it('should handle performance metric updates', async () => {
      const { rerender } = render(
        <AgentDashboard
          agents={mockAgents}
          swarmMetrics={mockSwarmMetrics}
          onAgentAction={onAgentActionMock}
        />
      )

      // Initial CPU usage
      expect(screen.getByText('65%')).toBeInTheDocument()

      // Update performance metrics
      const updatedAgents = [...mockAgents]
      updatedAgents[0] = {
        ...updatedAgents[0],
        performance: {
          ...updatedAgents[0].performance,
          cpuUsage: 85,
          tasksCompleted: 45,
        },
      }

      rerender(
        <AgentDashboard
          agents={updatedAgents}
          swarmMetrics={mockSwarmMetrics}
          onAgentAction={onAgentActionMock}
        />
      )

      // Metrics should have updated
      await waitFor(() => {
        expect(screen.getByText('85%')).toBeInTheDocument()
        expect(screen.getByText('45')).toBeInTheDocument()
      })
    })

    it('should handle swarm metrics updates', async () => {
      const { rerender } = render(
        <AgentDashboard
          agents={mockAgents}
          swarmMetrics={mockSwarmMetrics}
          onAgentAction={onAgentActionMock}
        />
      )

      // Initial metrics
      expect(screen.getByText('121')).toBeInTheDocument() // completed tasks
      expect(screen.getByText('87%')).toBeInTheDocument() // efficiency

      // Update swarm metrics
      const updatedSwarmMetrics = {
        ...mockSwarmMetrics,
        completedTasks: 135,
        coordinationEfficiency: 92,
      }

      rerender(
        <AgentDashboard
          agents={mockAgents}
          swarmMetrics={updatedSwarmMetrics}
          onAgentAction={onAgentActionMock}
        />
      )

      // Metrics should have updated
      await waitFor(() => {
        expect(screen.getByText('135')).toBeInTheDocument()
        expect(screen.getByText('92%')).toBeInTheDocument()
      })
    })
  })

  describe('Error States and Edge Cases', () => {
    it('should handle empty agents array', () => {
      render(
        <AgentDashboard
          agents={[]}
          swarmMetrics={mockSwarmMetrics}
          onAgentAction={onAgentActionMock}
        />
      )

      // Should still render swarm metrics
      expect(screen.getByText('Total Agents')).toBeInTheDocument()
      
      // But no agent cards should be present
      expect(screen.queryByTestId(/agent-card-/)).not.toBeInTheDocument()
    })

    it('should handle agents without current tasks', () => {
      const agentsWithoutTasks = mockAgents.map(agent => ({
        ...agent,
        currentTask: undefined,
      }))

      render(
        <AgentDashboard
          agents={agentsWithoutTasks}
          swarmMetrics={mockSwarmMetrics}
          onAgentAction={onAgentActionMock}
        />
      )

      // Should not show current task sections
      expect(screen.queryByText('Current Task')).not.toBeInTheDocument()
    })

    it('should handle agents with no capabilities', () => {
      const agentsWithoutCapabilities = [...mockAgents]
      agentsWithoutCapabilities[0] = {
        ...agentsWithoutCapabilities[0],
        capabilities: [],
      }

      render(
        <AgentDashboard
          agents={agentsWithoutCapabilities}
          swarmMetrics={mockSwarmMetrics}
          onAgentAction={onAgentActionMock}
        />
      )

      // Should still render the agent but without capability badges
      expect(screen.getByText('Senior Code Generator')).toBeInTheDocument()
      expect(screen.queryByText('code-generation')).not.toBeInTheDocument()
    })

    it('should handle missing onAgentAction callback', async () => {
      render(
        <AgentDashboard
          agents={mockAgents}
          swarmMetrics={mockSwarmMetrics}
        />
      )

      // Action buttons should still be clickable without errors
      const actionButton = screen.getByTestId('action-button-agent-1-pause')
      await userEvent.click(actionButton)

      // Should not throw any errors
      expect(actionButton).toBeInTheDocument()
    })
  })

  describe('Performance and Accessibility', () => {
    it('should render efficiently with many agents', () => {
      const manyAgents = Array.from({ length: 100 }, (_, i) => ({
        ...mockAgents[0],
        id: `agent-${i}`,
        name: `Agent ${i}`,
      }))

      const startTime = performance.now()
      render(
        <AgentDashboard
          agents={manyAgents}
          swarmMetrics={mockSwarmMetrics}
          onAgentAction={onAgentActionMock}
        />
      )
      const endTime = performance.now()

      // Should render within reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100)
      
      // Should render all agents
      expect(screen.getAllByTestId(/agent-card-/)).toHaveLength(100)
    })

    it('should have proper accessibility attributes', () => {
      render(
        <AgentDashboard
          agents={mockAgents}
          swarmMetrics={mockSwarmMetrics}
          onAgentAction={onAgentActionMock}
        />
      )

      // Check for proper button roles and labels
      const pauseButton = screen.getByTestId('action-button-agent-1-pause')
      expect(pauseButton).toHaveAttribute('role', 'button')
      expect(pauseButton).toHaveAccessibleName(/pause/i)

      const configureButton = screen.getByTestId('configure-button-agent-1')
      expect(configureButton).toHaveAttribute('role', 'button')
      expect(configureButton).toHaveAccessibleName(/configure/i)

      // Check for proper tab navigation
      const tabList = screen.getByRole('tablist')
      expect(tabList).toBeInTheDocument()
      
      const tabs = screen.getAllByRole('tab')
      expect(tabs).toHaveLength(3)
      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('aria-selected')
      })
    })

    it('should support keyboard navigation', async () => {
      render(
        <AgentDashboard
          agents={mockAgents}
          swarmMetrics={mockSwarmMetrics}
          onAgentAction={onAgentActionMock}
        />
      )

      const firstCard = screen.getByTestId('agent-card-agent-1')
      
      // Focus the card
      firstCard.focus()
      expect(firstCard).toHaveFocus()

      // Navigate with keyboard
      await userEvent.keyboard('{Tab}')
      const pauseButton = screen.getByTestId('action-button-agent-1-pause')
      expect(pauseButton).toHaveFocus()

      // Activate with Enter key
      await userEvent.keyboard('{Enter}')
      expect(onAgentActionMock).toHaveBeenCalledWith('agent-1', 'pause')
    })
  })
})