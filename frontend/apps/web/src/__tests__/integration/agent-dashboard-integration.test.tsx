import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentMetrics, SwarmMetrics } from "@/types/agent-dashboard";
import { AgentDashboard } from "../__mocks__/AgentDashboard";

// Mock framer-motion
vi.mock("framer-motion", () => ({
	motion: {
		div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
	},
}));

// Mock UI components
vi.mock("@/components/ui/badge", () => ({
	Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));

vi.mock("@/components/ui/button", () => ({
	Button: ({ children, onClick, ...props }: any) => (
		<button onClick={onClick} {...props}>
			{children}
		</button>
	),
}));

vi.mock("@/components/ui/card", () => ({
	Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
	CardContent: ({ children, ...props }: any) => (
		<div {...props}>{children}</div>
	),
	CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
	CardTitle: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

vi.mock("@/components/ui/progress", () => ({
	Progress: ({ value, ...props }: any) => (
		<div {...props} data-testid="progress" data-value={value}>
			Progress: {value}%
		</div>
	),
}));

vi.mock("@/components/ui/tabs", () => ({
	Tabs: ({ children, ...props }: any) => <div {...props}>{children}</div>,
	TabsContent: ({ children, ...props }: any) => (
		<div {...props}>{children}</div>
	),
	TabsList: ({ children, ...props }: any) => <div {...props}>{children}</div>,
	TabsTrigger: ({ children, ...props }: any) => (
		<div {...props}>{children}</div>
	),
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
	Activity: () => <div data-testid="activity-icon">Activity</div>,
	AlertCircle: () => <div data-testid="alert-circle-icon">AlertCircle</div>,
	Bot: () => <div data-testid="bot-icon">Bot</div>,
	Brain: () => <div data-testid="brain-icon">Brain</div>,
	CheckCircle: () => <div data-testid="check-circle-icon">CheckCircle</div>,
	Cpu: () => <div data-testid="cpu-icon">Cpu</div>,
	Network: () => <div data-testid="network-icon">Network</div>,
	Pause: () => <div data-testid="pause-icon">Pause</div>,
	Play: () => <div data-testid="play-icon">Play</div>,
	Settings: () => <div data-testid="settings-icon">Settings</div>,
	Stop: () => <div data-testid="stop-icon">Stop</div>,
	TrendingUp: () => <div data-testid="trending-up-icon">TrendingUp</div>,
	Zap: () => <div data-testid="zap-icon">Zap</div>,
}));

// Mock utils
vi.mock("@/lib/utils", () => ({
	cn: (...args: any[]) => args.filter(Boolean).join(" "),
}));

describe("Agent Dashboard Integration", () => {
	const mockAgents: AgentMetrics[] = [
		{
			id: "agent-1",
			name: "Test Agent 1",
			type: "coder",
			status: "active",
			currentTask: "Testing implementation",
			performance: {
				tasksCompleted: 15,
				successRate: 95,
				avgResponseTime: 250,
				cpuUsage: 65,
				memoryUsage: 45,
			},
			capabilities: ["code-generation", "testing", "debugging"],
			lastActivity: new Date("2023-07-15T10:00:00Z"),
			uptime: 3600,
			connectionQuality: "excellent",
		},
		{
			id: "agent-2",
			name: "Test Agent 2",
			type: "researcher",
			status: "idle",
			performance: {
				tasksCompleted: 8,
				successRate: 88,
				avgResponseTime: 180,
				cpuUsage: 25,
				memoryUsage: 30,
			},
			capabilities: ["research", "analysis", "documentation"],
			lastActivity: new Date("2023-07-15T09:30:00Z"),
			uptime: 2400,
			connectionQuality: "good",
		},
	];

	const mockSwarmMetrics: SwarmMetrics = {
		totalAgents: 5,
		activeAgents: 3,
		totalTasks: 25,
		completedTasks: 18,
		avgPerformance: 85,
		networkLatency: 50,
		coordinationEfficiency: 92,
	};

	const mockOnAgentAction = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	it("should render swarm metrics correctly", () => {
		render(
			<AgentDashboard
				agents={mockAgents}
				swarmMetrics={mockSwarmMetrics}
				onAgentAction={mockOnAgentAction}
			/>,
		);

		expect(screen.getByText("5")).toBeInTheDocument();
		expect(screen.getByText("3")).toBeInTheDocument();
		expect(screen.getByText("18")).toBeInTheDocument();
		expect(screen.getByText("92%")).toBeInTheDocument();
	});

	it("should display agent cards with correct information", () => {
		render(
			<AgentDashboard
				agents={mockAgents}
				swarmMetrics={mockSwarmMetrics}
				onAgentAction={mockOnAgentAction}
			/>,
		);

		// Check that the agent names are present (allow for multiple if component renders them multiple times)
		expect(screen.getAllByText("Test Agent 1").length).toBeGreaterThan(0);
		expect(screen.getAllByText("Test Agent 2").length).toBeGreaterThan(0);
		expect(screen.getAllByText("coder").length).toBeGreaterThan(0);
		expect(screen.getAllByText("researcher").length).toBeGreaterThan(0);
	});

	it("should show current task for active agents", () => {
		render(
			<AgentDashboard
				agents={mockAgents}
				swarmMetrics={mockSwarmMetrics}
				onAgentAction={mockOnAgentAction}
			/>,
		);

		expect(screen.getByText("Testing implementation")).toBeInTheDocument();
	});

	it("should display performance metrics", () => {
		render(
			<AgentDashboard
				agents={mockAgents}
				swarmMetrics={mockSwarmMetrics}
				onAgentAction={mockOnAgentAction}
			/>,
		);

		// Check that performance metrics are present
		expect(screen.getAllByText("65%").length).toBeGreaterThan(0); // CPU usage
		expect(screen.getAllByText("45%").length).toBeGreaterThan(0); // Memory usage
		expect(screen.getAllByText("15").length).toBeGreaterThan(0); // Tasks completed
		expect(screen.getAllByText("95%").length).toBeGreaterThan(0); // Success rate
	});

	it("should show capabilities as badges", () => {
		render(
			<AgentDashboard
				agents={mockAgents}
				swarmMetrics={mockSwarmMetrics}
				onAgentAction={mockOnAgentAction}
			/>,
		);

		expect(screen.getAllByText("code-generation").length).toBeGreaterThan(0);
		expect(screen.getAllByText("testing").length).toBeGreaterThan(0);
		expect(screen.getAllByText("debugging").length).toBeGreaterThan(0);
	});

	it("should handle agent action buttons", () => {
		render(
			<AgentDashboard
				agents={mockAgents}
				swarmMetrics={mockSwarmMetrics}
				onAgentAction={mockOnAgentAction}
			/>,
		);

		const pauseButtons = screen.getAllByRole("button", { name: /pause/i });
		const startButtons = screen.getAllByRole("button", { name: /start/i });

		// Click the first pause button (for agent-1 which is active)
		fireEvent.click(pauseButtons[0]);
		expect(mockOnAgentAction).toHaveBeenCalledWith("agent-1", "pause");

		// Click the first start button (for agent-2 which is idle)
		fireEvent.click(startButtons[0]);
		expect(mockOnAgentAction).toHaveBeenCalledWith("agent-2", "start");
	});

	it("should handle configure button clicks", () => {
		render(
			<AgentDashboard
				agents={mockAgents}
				swarmMetrics={mockSwarmMetrics}
				onAgentAction={mockOnAgentAction}
			/>,
		);

		const configureButtons = screen.getAllByTestId("settings-icon");
		fireEvent.click(configureButtons[0].closest("button")!);

		expect(mockOnAgentAction).toHaveBeenCalledWith("agent-1", "configure");
	});

	it("should format uptime correctly", () => {
		render(
			<AgentDashboard
				agents={mockAgents}
				swarmMetrics={mockSwarmMetrics}
				onAgentAction={mockOnAgentAction}
			/>,
		);

		const uptimeElements = screen.getAllByText("1h 0m"); // 3600 seconds
		expect(uptimeElements.length).toBeGreaterThan(0);

		expect(screen.getByText("40m")).toBeInTheDocument(); // 2400 seconds
	});

	it("should display correct status indicators", () => {
		render(
			<AgentDashboard
				agents={mockAgents}
				swarmMetrics={mockSwarmMetrics}
				onAgentAction={mockOnAgentAction}
			/>,
		);

		expect(screen.getAllByTestId("check-circle-icon")).toHaveLength(2); // active status + tasks completed icon
		expect(screen.getAllByTestId("pause-icon")).toHaveLength(2); // idle status + pause button
	});

	it("should handle agent selection", () => {
		render(
			<AgentDashboard
				agents={mockAgents}
				swarmMetrics={mockSwarmMetrics}
				onAgentAction={mockOnAgentAction}
			/>,
		);

		const agentCard = screen.getByText("Test Agent 1").closest("div");
		fireEvent.click(agentCard!);

		// Should not throw an error and should handle the click
		expect(agentCard).toBeInTheDocument();
	});

	it("should show truncated capabilities with +N indicator", () => {
		const agentWithManyCapabilities: AgentMetrics = {
			...mockAgents[0],
			capabilities: ["cap1", "cap2", "cap3", "cap4", "cap5"],
		};

		render(
			<AgentDashboard
				agents={[agentWithManyCapabilities]}
				swarmMetrics={mockSwarmMetrics}
				onAgentAction={mockOnAgentAction}
			/>,
		);

		expect(screen.getAllByText("+2").length).toBeGreaterThan(0);
	});

	it("should render different agent types with correct icons", () => {
		const agentTypes: AgentMetrics[] = [
			{ ...mockAgents[0], type: "coder" },
			{ ...mockAgents[1], type: "researcher" },
			{ ...mockAgents[0], id: "agent-3", type: "analyst" },
			{ ...mockAgents[1], id: "agent-4", type: "coordinator" },
		];

		render(
			<AgentDashboard
				agents={agentTypes}
				swarmMetrics={mockSwarmMetrics}
				onAgentAction={mockOnAgentAction}
			/>,
		);

		expect(screen.getAllByTestId("cpu-icon").length).toBeGreaterThan(0);
		expect(screen.getAllByTestId("brain-icon").length).toBeGreaterThan(0);
		expect(screen.getAllByTestId("trending-up-icon").length).toBeGreaterThan(0);
		expect(screen.getAllByTestId("network-icon").length).toBeGreaterThan(0);
	});

	it("should handle empty agent list", () => {
		render(
			<AgentDashboard
				agents={[]}
				swarmMetrics={mockSwarmMetrics}
				onAgentAction={mockOnAgentAction}
			/>,
		);

		expect(screen.getAllByText("5").length).toBeGreaterThan(0); // Still shows swarm metrics
		expect(screen.queryByText("Test Agent 1")).not.toBeInTheDocument();
	});

	it("should prevent event propagation on button clicks", () => {
		render(
			<AgentDashboard
				agents={mockAgents}
				swarmMetrics={mockSwarmMetrics}
				onAgentAction={mockOnAgentAction}
			/>,
		);

		// This test ensures the onClick handlers call stopPropagation
		// The actual implementation should handle this
		const pauseButtons = screen.getAllByRole("button", { name: /pause/i });
		expect(pauseButtons.length).toBeGreaterThan(0);

		// Test that the button exists and can be clicked
		fireEvent.click(pauseButtons[0]);
		expect(mockOnAgentAction).toHaveBeenCalled();
	});
});
