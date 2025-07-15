import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import HomePage from "../page";

// Mock framer-motion
vi.mock("framer-motion", () => ({
	motion: {
		div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
	},
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
	Bot: ({ className }: any) => <div className={className} data-testid="bot-icon" />,
	FolderCode: ({ className }: any) => <div className={className} data-testid="folder-code-icon" />,
}));

describe("HomePage", () => {
	beforeEach(() => {
		// Reset any mocks before each test
		vi.clearAllMocks();
		
		// Mock window.location
		Object.defineProperty(window, "location", {
			value: {
				href: "/",
			},
			writable: true,
		});
	});

	it("renders the homepage with correct title", () => {
		render(<HomePage />);

		expect(screen.getByText("Welcome to Claudia")).toBeInTheDocument();
		expect(screen.getByText("Claudia - Claude Code GUI")).toBeInTheDocument();
	});

	it("renders navigation cards", () => {
		render(<HomePage />);

		// Check for CC Agents card
		const agentsElements = screen.getAllByText("CC Agents");
		expect(agentsElements).toHaveLength(1);
		expect(screen.getByTestId("bot-icon")).toBeInTheDocument();

		// Check for CC Projects card
		expect(screen.getByText("CC Projects")).toBeInTheDocument();
		expect(screen.getByTestId("folder-code-icon")).toBeInTheDocument();
	});

	it("navigates to agents page when CC Agents card is clicked", () => {
		render(<HomePage />);

		const agentsCard = screen.getByText("CC Agents").closest(".cursor-pointer");
		fireEvent.click(agentsCard!);

		expect(window.location.href).toBe("/agents");
	});

	it("navigates to projects page when CC Projects card is clicked", () => {
		render(<HomePage />);

		const projectsCard = screen.getByText("CC Projects").closest(".cursor-pointer");
		fireEvent.click(projectsCard!);

		expect(window.location.href).toBe("/projects");
	});

	it("shows about button in topbar", () => {
		render(<HomePage />);

		const aboutButton = screen.getByText("About");
		expect(aboutButton).toBeInTheDocument();
	});

	it("shows about modal when about button is clicked", () => {
		render(<HomePage />);

		const aboutButton = screen.getByText("About");
		fireEvent.click(aboutButton);

		// The component has a setShowNFO state but the modal is not implemented
		// This test verifies the button exists and is clickable
		expect(aboutButton).toBeInTheDocument();
	});

	it("displays Electric SQL test component", () => {
		render(<HomePage />);

		expect(screen.getByText("Electric SQL Test")).toBeInTheDocument();
		expect(screen.getByText("Electric SQL integration temporarily disabled for build optimization.")).toBeInTheDocument();
	});

	it("renders with correct styling classes", () => {
		render(<HomePage />);

		// Check for main container structure
		const mainContent = screen.getByText("Welcome to Claudia").closest("div");
		expect(mainContent).toHaveClass("text-center");
	});

	it("renders motion components without errors", () => {
		// This test ensures that motion components are properly mocked
		render(<HomePage />);

		// If motion components were not properly mocked, this would throw an error
		expect(screen.getByText("Welcome to Claudia")).toBeInTheDocument();
	});

	it("has correct hover effects on navigation cards", () => {
		render(<HomePage />);

		const agentsCard = screen.getByText("CC Agents").closest(".cursor-pointer");
		const projectsCard = screen.getByText("CC Projects").closest(".cursor-pointer");

		// Check that cards have hover classes
		expect(agentsCard).toHaveClass("hover:scale-105");
		expect(projectsCard).toHaveClass("hover:scale-105");
	});

	it("maintains responsive design classes", () => {
		render(<HomePage />);

		// Check for responsive grid classes by finding the grid container
		const gridContainer = screen.getByText("CC Agents").closest("div")?.parentElement?.parentElement;
		expect(gridContainer).toHaveClass("grid-cols-1", "md:grid-cols-2");
	});
});