import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import AgentsPage from "../page";

// Mock dependencies
vi.mock("framer-motion", () => ({
	motion: {
		div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
	},
	AnimatePresence: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("lucide-react", () => ({
	ArrowLeft: ({ className }: any) => <div className={className} data-testid="arrow-left" />,
	Bot: ({ className }: any) => <div className={className} data-testid="bot-icon" />,
	ChevronDown: ({ className }: any) => <div className={className} data-testid="chevron-down" />,
	Download: ({ className }: any) => <div className={className} data-testid="download-icon" />,
	Edit: ({ className }: any) => <div className={className} data-testid="edit-icon" />,
	FileJson: ({ className }: any) => <div className={className} data-testid="file-json-icon" />,
	Globe: ({ className }: any) => <div className={className} data-testid="globe-icon" />,
	History: ({ className }: any) => <div className={className} data-testid="history-icon" />,
	Loader2: ({ className }: any) => <div className={className} data-testid="loader-icon" />,
	MoreVertical: ({ className }: any) => <div className={className} data-testid="more-vertical-icon" />,
	Play: ({ className }: any) => <div className={className} data-testid="play-icon" />,
	Plus: ({ className }: any) => <div className={className} data-testid="plus-icon" />,
	Trash2: ({ className }: any) => <div className={className} data-testid="trash-icon" />,
	Upload: ({ className }: any) => <div className={className} data-testid="upload-icon" />,
}));

// Mock UI components
vi.mock("@/components/ui/badge", () => ({
	Badge: ({ children, className }: any) => <span className={className}>{children}</span>,
}));

vi.mock("@/components/ui/button", () => ({
	Button: ({ children, className, onClick, disabled, ...props }: any) => (
		<button className={className} onClick={onClick} disabled={disabled} {...props}>
			{children}
		</button>
	),
}));

vi.mock("@/components/ui/card", () => ({
	Card: ({ children, className, onClick }: any) => (
		<div className={className} onClick={onClick}>
			{children}
		</div>
	),
	CardContent: ({ children, className }: any) => (
		<div className={className}>{children}</div>
	),
	CardFooter: ({ children, className }: any) => (
		<div className={className}>{children}</div>
	),
}));

vi.mock("@/components/ui/dialog", () => ({
	Dialog: ({ children, open, onOpenChange }: any) => (
		open ? <div data-testid="dialog">{children}</div> : null
	),
	DialogContent: ({ children, className }: any) => (
		<div className={className}>{children}</div>
	),
	DialogDescription: ({ children }: any) => <div>{children}</div>,
	DialogFooter: ({ children }: any) => <div>{children}</div>,
	DialogHeader: ({ children }: any) => <div>{children}</div>,
	DialogTitle: ({ children }: any) => <h2>{children}</h2>,
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
	DropdownMenu: ({ children }: any) => <div>{children}</div>,
	DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
	DropdownMenuItem: ({ children, onClick }: any) => (
		<div onClick={onClick}>{children}</div>
	),
	DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
}));

// Mock API
const mockApi = {
	listAgents: vi.fn(),
	listAgentRuns: vi.fn(),
	createAgent: vi.fn(),
	updateAgent: vi.fn(),
	deleteAgent: vi.fn(),
	executeAgent: vi.fn(),
};

vi.mock("@/lib/api", () => ({
	api: mockApi,
}));

vi.mock("@/lib/utils", () => ({
	cn: (...args: any[]) => args.join(" "),
}));

describe("AgentsPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		
		// Mock window.location
		Object.defineProperty(window, "location", {
			value: {
				href: "/agents",
			},
			writable: true,
		});

		// Default mock implementations
		mockApi.listAgents.mockResolvedValue([
			{
				id: "1",
				name: "Test Agent",
				description: "Test agent description",
				system_prompt: "Test system prompt",
				icon: "bot",
				created_at: "2023-01-01T00:00:00Z",
			},
		]);

		mockApi.listAgentRuns.mockResolvedValue([
			{
				id: "run-1",
				agent_name: "Test Agent",
				status: "completed",
				created_at: "2023-01-01T00:00:00Z",
				project_path: "/test/path",
			},
		]);
	});

	it("renders the agents page with correct title", async () => {
		render(<AgentsPage />);

		expect(screen.getByText("CC Agents")).toBeInTheDocument();
		expect(screen.getByText("Manage your custom AI agents")).toBeInTheDocument();
	});

	it("loads and displays agents on mount", async () => {
		render(<AgentsPage />);

		await waitFor(() => {
			expect(mockApi.listAgents).toHaveBeenCalled();
			expect(mockApi.listAgentRuns).toHaveBeenCalled();
		});

		await waitFor(() => {
			expect(screen.getByText("Test Agent")).toBeInTheDocument();
		});
	});

	it("shows loading state initially", () => {
		render(<AgentsPage />);

		expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
	});

	it("navigates back to home when back button is clicked", () => {
		render(<AgentsPage />);

		const backButton = screen.getByTestId("arrow-left");
		fireEvent.click(backButton.closest("button")!);

		expect(window.location.href).toBe("/");
	});

	it("opens create agent modal when create button is clicked", async () => {
		render(<AgentsPage />);

		const createButton = screen.getByText("Create Agent");
		fireEvent.click(createButton);

		await waitFor(() => {
			expect(screen.getByText("Create New Agent")).toBeInTheDocument();
		});
	});

	it("displays agent cards with correct information", async () => {
		render(<AgentsPage />);

		await waitFor(() => {
			expect(screen.getByText("Test Agent")).toBeInTheDocument();
			expect(screen.getByText("Test agent description")).toBeInTheDocument();
		});
	});

	it("shows execute button for each agent", async () => {
		render(<AgentsPage />);

		await waitFor(() => {
			expect(screen.getByText("Execute")).toBeInTheDocument();
		});
	});

	it("shows edit button for each agent", async () => {
		render(<AgentsPage />);

		await waitFor(() => {
			expect(screen.getByText("Edit")).toBeInTheDocument();
		});
	});

	it("displays recent executions section", async () => {
		render(<AgentsPage />);

		await waitFor(() => {
			expect(screen.getByText("Recent Executions")).toBeInTheDocument();
		});
	});

	it("shows import dropdown menu", () => {
		render(<AgentsPage />);

		expect(screen.getByText("Import")).toBeInTheDocument();
	});

	it("handles empty agents state", async () => {
		mockApi.listAgents.mockResolvedValue([]);

		render(<AgentsPage />);

		await waitFor(() => {
			expect(screen.getByText("No agents yet")).toBeInTheDocument();
			expect(screen.getByText("Create your first CC Agent to get started")).toBeInTheDocument();
		});
	});

	it("handles API error gracefully", async () => {
		mockApi.listAgents.mockRejectedValue(new Error("API Error"));

		render(<AgentsPage />);

		await waitFor(() => {
			expect(screen.getByText("Failed to load agents")).toBeInTheDocument();
		});
	});

	it("creates new agent when form is submitted", async () => {
		mockApi.createAgent.mockResolvedValue({ id: "2" });

		render(<AgentsPage />);

		// Open create modal
		const createButton = screen.getByText("Create Agent");
		fireEvent.click(createButton);

		await waitFor(() => {
			expect(screen.getByText("Create New Agent")).toBeInTheDocument();
		});

		// Fill form
		const nameInput = screen.getByPlaceholderText("Enter agent name");
		fireEvent.change(nameInput, { target: { value: "New Agent" } });

		const submitButton = screen.getByText("Create Agent");
		fireEvent.click(submitButton);

		await waitFor(() => {
			expect(mockApi.createAgent).toHaveBeenCalledWith({
				name: "New Agent",
				description: "",
				system_prompt: "",
				icon: "bot",
			});
		});
	});

	it("executes agent when execute button is clicked", async () => {
		mockApi.executeAgent.mockResolvedValue({});

		render(<AgentsPage />);

		await waitFor(() => {
			const executeButton = screen.getByText("Execute");
			fireEvent.click(executeButton);
		});

		await waitFor(() => {
			expect(screen.getByText("Execute Agent")).toBeInTheDocument();
		});

		// Fill project path
		const projectPathInput = screen.getByPlaceholderText("Enter project path");
		fireEvent.change(projectPathInput, { target: { value: "/test/project" } });

		const executeSubmitButton = screen.getByText("Execute Agent");
		fireEvent.click(executeSubmitButton);

		await waitFor(() => {
			expect(mockApi.executeAgent).toHaveBeenCalledWith("1", "/test/project");
		});
	});

	it("deletes agent when delete is confirmed", async () => {
		mockApi.deleteAgent.mockResolvedValue({});

		render(<AgentsPage />);

		await waitFor(() => {
			// Find and click the more options button
			const moreButton = screen.getByTestId("more-vertical-icon").closest("button");
			fireEvent.click(moreButton!);
		});

		// Click delete option
		const deleteButton = screen.getByText("Delete");
		fireEvent.click(deleteButton);

		await waitFor(() => {
			expect(screen.getByText("Delete Agent")).toBeInTheDocument();
		});

		// Confirm deletion
		const confirmButton = screen.getByText("Delete Agent");
		fireEvent.click(confirmButton);

		await waitFor(() => {
			expect(mockApi.deleteAgent).toHaveBeenCalledWith("1");
		});
	});

	it("handles pagination correctly", async () => {
		// Create 10 agents to test pagination
		const agents = Array.from({ length: 10 }, (_, i) => ({
			id: `${i + 1}`,
			name: `Agent ${i + 1}`,
			description: `Description ${i + 1}`,
			system_prompt: "Test prompt",
			icon: "bot",
			created_at: "2023-01-01T00:00:00Z",
		}));

		mockApi.listAgents.mockResolvedValue(agents);

		render(<AgentsPage />);

		await waitFor(() => {
			// Should show pagination controls
			expect(screen.getByText("Next")).toBeInTheDocument();
		});
	});

	it("shows running execution status", async () => {
		mockApi.listAgentRuns.mockResolvedValue([
			{
				id: "run-1",
				agent_name: "Test Agent",
				status: "running",
				created_at: "2023-01-01T00:00:00Z",
				project_path: "/test/path",
			},
		]);

		render(<AgentsPage />);

		await waitFor(() => {
			expect(screen.getByText("running")).toBeInTheDocument();
		});
	});
});