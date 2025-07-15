import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import ProjectsPage from "../page";

// Mock dependencies
vi.mock("framer-motion", () => ({
	motion: {
		div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
	},
	AnimatePresence: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("lucide-react", () => ({
	ArrowLeft: ({ className }: any) => <div className={className} data-testid="arrow-left" />,
	Calendar: ({ className }: any) => <div className={className} data-testid="calendar-icon" />,
	ChevronRight: ({ className }: any) => <div className={className} data-testid="chevron-right" />,
	Clock: ({ className }: any) => <div className={className} data-testid="clock-icon" />,
	FileText: ({ className }: any) => <div className={className} data-testid="file-text-icon" />,
	FolderOpen: ({ className }: any) => <div className={className} data-testid="folder-open-icon" />,
	Loader2: ({ className }: any) => <div className={className} data-testid="loader-icon" />,
	MessageSquare: ({ className }: any) => <div className={className} data-testid="message-square-icon" />,
	MoreVertical: ({ className }: any) => <div className={className} data-testid="more-vertical-icon" />,
	Plus: ({ className }: any) => <div className={className} data-testid="plus-icon" />,
	Settings: ({ className }: any) => <div className={className} data-testid="settings-icon" />,
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
	listProjects: vi.fn(),
	getProjectSessions: vi.fn(),
	getRunningProcesses: vi.fn(),
};

vi.mock("@/lib/api", () => ({
	api: mockApi,
}));

vi.mock("@/lib/utils", () => ({
	cn: (...args: any[]) => args.join(" "),
}));

describe("ProjectsPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		
		// Mock window.location
		Object.defineProperty(window, "location", {
			value: {
				href: "/projects",
			},
			writable: true,
		});

		// Default mock implementations
		mockApi.listProjects.mockResolvedValue([
			{
				id: "1",
				path: "/test/project",
				created_at: 1672531200, // Unix timestamp
				sessions: [
					{
						id: "session-1",
						created_at: 1672531200,
						first_message: "Test message",
						first_message_at: 1672531200,
						todo_data: null,
					},
				],
			},
		]);

		mockApi.getProjectSessions.mockResolvedValue([
			{
				id: "session-1",
				created_at: 1672531200,
				first_message: "Test message",
				first_message_at: 1672531200,
				todo_data: null,
			},
		]);

		mockApi.getRunningProcesses.mockResolvedValue([]);
	});

	it("renders the projects page with correct title", async () => {
		render(<ProjectsPage />);

		expect(screen.getByText("CC Projects")).toBeInTheDocument();
		expect(screen.getByText("Browse your Claude Code sessions")).toBeInTheDocument();
	});

	it("loads and displays projects on mount", async () => {
		render(<ProjectsPage />);

		await waitFor(() => {
			expect(mockApi.listProjects).toHaveBeenCalled();
		});

		await waitFor(() => {
			expect(screen.getByText("project")).toBeInTheDocument(); // project name from path
		});
	});

	it("shows loading state initially", () => {
		render(<ProjectsPage />);

		expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
	});

	it("navigates back to home when back button is clicked", () => {
		render(<ProjectsPage />);

		const backButton = screen.getByText("← Back to Home");
		fireEvent.click(backButton);

		expect(window.location.href).toBe("/");
	});

	it("displays project cards with correct information", async () => {
		render(<ProjectsPage />);

		await waitFor(() => {
			expect(screen.getByText("project")).toBeInTheDocument();
			expect(screen.getByText("/test/project")).toBeInTheDocument();
		});
	});

	it("shows session count badge", async () => {
		render(<ProjectsPage />);

		await waitFor(() => {
			expect(screen.getByText("1")).toBeInTheDocument(); // Session count
		});
	});

	it("shows new session button", async () => {
		render(<ProjectsPage />);

		await waitFor(() => {
			expect(screen.getByText("New Claude Code session")).toBeInTheDocument();
		});
	});

	it("handles clicking on a project", async () => {
		render(<ProjectsPage />);

		await waitFor(() => {
			const projectCard = screen.getByText("project").closest("div");
			fireEvent.click(projectCard!);
		});

		await waitFor(() => {
			expect(mockApi.getProjectSessions).toHaveBeenCalledWith("1");
		});
	});

	it("displays session list when project is selected", async () => {
		render(<ProjectsPage />);

		await waitFor(() => {
			const projectCard = screen.getByText("project").closest("div");
			fireEvent.click(projectCard!);
		});

		await waitFor(() => {
			expect(screen.getByText("session-1")).toBeInTheDocument();
		});
	});

	it("shows back button in session view", async () => {
		render(<ProjectsPage />);

		await waitFor(() => {
			const projectCard = screen.getByText("project").closest("div");
			fireEvent.click(projectCard!);
		});

		await waitFor(() => {
			expect(screen.getByTestId("arrow-left")).toBeInTheDocument();
		});
	});

	it("navigates back to project list from session view", async () => {
		render(<ProjectsPage />);

		// Click on project
		await waitFor(() => {
			const projectCard = screen.getByText("project").closest("div");
			fireEvent.click(projectCard!);
		});

		// Click back button
		await waitFor(() => {
			const backButton = screen.getByTestId("arrow-left").closest("button");
			fireEvent.click(backButton!);
		});

		await waitFor(() => {
			expect(screen.getByText("project")).toBeInTheDocument();
		});
	});

	it("handles empty projects state", async () => {
		mockApi.listProjects.mockResolvedValue([]);

		render(<ProjectsPage />);

		await waitFor(() => {
			expect(screen.getByText("No projects found in ~/.claude/projects")).toBeInTheDocument();
		});
	});

	it("handles API error gracefully", async () => {
		mockApi.listProjects.mockRejectedValue(new Error("API Error"));

		render(<ProjectsPage />);

		await waitFor(() => {
			expect(screen.getByText("Failed to load projects. Please ensure ~/.claude directory exists.")).toBeInTheDocument();
		});
	});

	it("displays running Claude sessions", async () => {
		mockApi.getRunningProcesses.mockResolvedValue([
			{
				run_id: "run-1",
				pid: 1234,
				project_path: "/test/project",
				model: "claude-3-sonnet",
				started_at: "2023-01-01T00:00:00Z",
				process_type: {
					ClaudeSession: {
						session_id: "session-123",
					},
				},
			},
		]);

		render(<ProjectsPage />);

		await waitFor(() => {
			expect(screen.getByText("Running Claude Sessions")).toBeInTheDocument();
			expect(screen.getByText("Session session-1")).toBeInTheDocument();
		});
	});

	it("shows session details in session list", async () => {
		render(<ProjectsPage />);

		await waitFor(() => {
			const projectCard = screen.getByText("project").closest("div");
			fireEvent.click(projectCard!);
		});

		await waitFor(() => {
			expect(screen.getByText("Test message")).toBeInTheDocument();
			expect(screen.getByText("session-1")).toBeInTheDocument();
		});
	});

	it("handles session with todo data", async () => {
		mockApi.getProjectSessions.mockResolvedValue([
			{
				id: "session-1",
				created_at: 1672531200,
				first_message: "Test message",
				first_message_at: 1672531200,
				todo_data: { todos: [] },
			},
		]);

		render(<ProjectsPage />);

		await waitFor(() => {
			const projectCard = screen.getByText("project").closest("div");
			fireEvent.click(projectCard!);
		});

		await waitFor(() => {
			expect(screen.getByText("Has todo")).toBeInTheDocument();
		});
	});

	it("emits custom event when session is clicked", async () => {
		const eventSpy = vi.spyOn(window, "dispatchEvent");

		render(<ProjectsPage />);

		await waitFor(() => {
			const projectCard = screen.getByText("project").closest("div");
			fireEvent.click(projectCard!);
		});

		await waitFor(() => {
			const sessionCard = screen.getByText("session-1").closest("div");
			fireEvent.click(sessionCard!);
		});

		await waitFor(() => {
			expect(eventSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					type: "claude-session-selected",
					detail: expect.objectContaining({
						projectPath: "/test/project",
					}),
				})
			);
		});
	});

	it("navigates to home when new session button is clicked", async () => {
		render(<ProjectsPage />);

		await waitFor(() => {
			const newSessionButton = screen.getByText("New Claude Code session");
			fireEvent.click(newSessionButton);
		});

		expect(window.location.href).toBe("/");
	});

	it("handles pagination for projects", async () => {
		// Create 13 projects to test pagination
		const projects = Array.from({ length: 13 }, (_, i) => ({
			id: `${i + 1}`,
			path: `/test/project${i + 1}`,
			created_at: 1672531200,
			sessions: [],
		}));

		mockApi.listProjects.mockResolvedValue(projects);

		render(<ProjectsPage />);

		await waitFor(() => {
			// Should show pagination controls
			expect(screen.getByText("Next")).toBeInTheDocument();
		});
	});

	it("handles pagination for sessions", async () => {
		// Create 6 sessions to test pagination
		const sessions = Array.from({ length: 6 }, (_, i) => ({
			id: `session-${i + 1}`,
			created_at: 1672531200,
			first_message: `Test message ${i + 1}`,
			first_message_at: 1672531200,
			todo_data: null,
		}));

		mockApi.getProjectSessions.mockResolvedValue(sessions);

		render(<ProjectsPage />);

		await waitFor(() => {
			const projectCard = screen.getByText("project").closest("div");
			fireEvent.click(projectCard!);
		});

		await waitFor(() => {
			// Should show pagination controls
			expect(screen.getByText("Next")).toBeInTheDocument();
		});
	});

	it("formats timestamps correctly", async () => {
		render(<ProjectsPage />);

		await waitFor(() => {
			// Should format the Unix timestamp correctly
			expect(screen.getByText("0m ago")).toBeInTheDocument();
		});
	});

	it("truncates long messages", async () => {
		const longMessage = "This is a very long message that should be truncated".repeat(10);
		mockApi.getProjectSessions.mockResolvedValue([
			{
				id: "session-1",
				created_at: 1672531200,
				first_message: longMessage,
				first_message_at: 1672531200,
				todo_data: null,
			},
		]);

		render(<ProjectsPage />);

		await waitFor(() => {
			const projectCard = screen.getByText("project").closest("div");
			fireEvent.click(projectCard!);
		});

		await waitFor(() => {
			// Should truncate the message
			const messageElement = screen.getByText(/This is a very long message/);
			expect(messageElement.textContent).toContain("...");
		});
	});
});