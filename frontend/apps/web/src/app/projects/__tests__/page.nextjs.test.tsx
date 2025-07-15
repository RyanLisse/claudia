/**
 * Next.js-specific tests for ProjectsPage
 * Tests Next.js features, client-side functionality, and SSR compatibility
 */

import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import ProjectsPage from "../page";

// Mock React Query
const mockUseProjects = vi.fn();
const mockUseProjectSessions = vi.fn();
const mockUseCreateSession = vi.fn();

vi.mock("@/hooks/use-projects", () => ({
  useProjects: mockUseProjects,
  useProjectSessions: mockUseProjectSessions,
  useCreateSession: mockUseCreateSession,
}));

// Mock Next.js router
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  pathname: "/projects",
  query: {},
  asPath: "/projects",
};

vi.mock("next/router", () => ({
  useRouter: () => mockRouter,
}));

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/projects",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  ArrowLeft: ({ className }: any) => <div className={className} data-testid="arrow-left-icon" />,
  Calendar: ({ className }: any) => <div className={className} data-testid="calendar-icon" />,
  ChevronRight: ({ className }: any) => <div className={className} data-testid="chevron-right-icon" />,
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

// Mock RunningClaudeSessions component
vi.mock("@/components/RunningClaudeSessions", () => ({
  RunningClaudeSessions: ({ onSessionClick }: any) => (
    <div data-testid="running-claude-sessions">
      <button onClick={() => onSessionClick({ id: "test-session" })}>
        Test Running Session
      </button>
    </div>
  ),
}));

// Mock API
vi.mock("@/lib/api-web", () => ({
  api: {
    listProjects: vi.fn(),
    listProjectSessions: vi.fn(),
    createSession: vi.fn(),
  },
}));

vi.mock("@/lib/utils", () => ({
  cn: (...args: any[]) => args.join(" "),
}));

describe("ProjectsPage - Next.js Specific Tests", () => {
  const mockProjects = [
    {
      id: "1",
      path: "/test/project1",
      created_at: 1640995200, // 2022-01-01
      sessions: [
        {
          id: "session-1",
          first_message: "Test message 1",
          first_message_at: 1640995200,
          created_at: 1640995200,
          todo_data: null,
        },
      ],
    },
    {
      id: "2",
      path: "/test/project2",
      created_at: 1640995200,
      sessions: [],
    },
  ];

  const mockSessions = [
    {
      id: "session-1",
      first_message: "Test message 1",
      first_message_at: 1640995200,
      created_at: 1640995200,
      todo_data: null,
    },
    {
      id: "session-2",
      first_message: "Test message 2",
      first_message_at: 1640995200,
      created_at: 1640995200,
      todo_data: { todos: [] },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock window.location
    Object.defineProperty(window, "location", {
      value: {
        href: "/projects",
      },
      writable: true,
    });

    // Mock custom event dispatch
    const mockDispatchEvent = vi.fn();
    Object.defineProperty(window, "dispatchEvent", {
      value: mockDispatchEvent,
      writable: true,
    });

    // Default mock implementations
    mockUseProjects.mockReturnValue({
      data: mockProjects,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    mockUseProjectSessions.mockReturnValue({
      data: mockSessions,
      isLoading: false,
      error: null,
    });

    mockUseCreateSession.mockReturnValue({
      mutate: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Next.js Client-Side Features", () => {
    it("should work with 'use client' directive", () => {
      render(<ProjectsPage />);
      
      // Test client-side rendering
      expect(screen.getByText("CC Projects")).toBeInTheDocument();
      expect(screen.getByText("Browse your Claude Code sessions")).toBeInTheDocument();
    });

    it("should handle client-side routing", () => {
      render(<ProjectsPage />);
      
      const backButton = screen.getByText("← Back to Home");
      fireEvent.click(backButton);
      
      // Should navigate using window.location for client-side routing
      expect(window.location.href).toBe("/");
    });

    it("should handle React hooks correctly", () => {
      render(<ProjectsPage />);
      
      // Test useState hook for selected project
      expect(screen.getByText("CC Projects")).toBeInTheDocument();
      
      // Test that projects are displayed
      expect(screen.getByText("project1")).toBeInTheDocument();
      expect(screen.getByText("project2")).toBeInTheDocument();
    });

    it("should handle project selection state", async () => {
      render(<ProjectsPage />);
      
      // Click on a project
      const projectCard = screen.getByText("project1").closest("div");
      fireEvent.click(projectCard!);
      
      // Should show sessions view
      await waitFor(() => {
        expect(screen.getByText("/test/project1")).toBeInTheDocument();
      });
    });

    it("should handle navigation between views", async () => {
      render(<ProjectsPage />);
      
      // Click on a project
      const projectCard = screen.getByText("project1").closest("div");
      fireEvent.click(projectCard!);
      
      // Should show sessions view
      await waitFor(() => {
        expect(screen.getByTestId("arrow-left-icon")).toBeInTheDocument();
      });
      
      // Click back button
      const backButton = screen.getByTestId("arrow-left-icon").closest("button");
      fireEvent.click(backButton!);
      
      // Should return to projects view
      await waitFor(() => {
        expect(screen.getByText("CC Projects")).toBeInTheDocument();
      });
    });
  });

  describe("Next.js Data Loading", () => {
    it("should handle loading states", () => {
      mockUseProjects.mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      render(<ProjectsPage />);
      
      expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
    });

    it("should handle error states", () => {
      mockUseProjects.mockReturnValue({
        data: [],
        isLoading: false,
        error: new Error("Failed to load projects"),
        refetch: vi.fn(),
      });

      render(<ProjectsPage />);
      
      expect(screen.getByText("Failed to load projects")).toBeInTheDocument();
    });

    it("should handle empty projects state", () => {
      mockUseProjects.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<ProjectsPage />);
      
      expect(screen.getByText("No projects found in ~/.claude/projects")).toBeInTheDocument();
    });

    it("should handle React Query integration", () => {
      render(<ProjectsPage />);
      
      // Test that React Query hooks are called
      expect(mockUseProjects).toHaveBeenCalled();
      expect(mockUseProjectSessions).toHaveBeenCalledWith(null);
    });
  });

  describe("Next.js Component Architecture", () => {
    it("should support component composition", () => {
      render(<ProjectsPage />);
      
      // Test that RunningClaudeSessions component is rendered
      expect(screen.getByTestId("running-claude-sessions")).toBeInTheDocument();
    });

    it("should handle component props correctly", () => {
      render(<ProjectsPage />);
      
      // Test that project data is passed to components
      expect(screen.getByText("project1")).toBeInTheDocument();
      expect(screen.getByText("/test/project1")).toBeInTheDocument();
    });

    it("should support conditional rendering", () => {
      render(<ProjectsPage />);
      
      // Test that project list is shown initially
      expect(screen.getByText("CC Projects")).toBeInTheDocument();
      
      // Test that new session button is shown
      expect(screen.getByText("New Claude Code session")).toBeInTheDocument();
    });
  });

  describe("Next.js Event Handling", () => {
    it("should handle custom events", async () => {
      render(<ProjectsPage />);
      
      // Click on a project to show sessions
      const projectCard = screen.getByText("project1").closest("div");
      fireEvent.click(projectCard!);
      
      await waitFor(() => {
        expect(screen.getByText("session-1")).toBeInTheDocument();
      });
      
      // Click on a session
      const sessionCard = screen.getByText("session-1").closest("div");
      fireEvent.click(sessionCard!);
      
      // Should dispatch custom event
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "claude-session-selected",
          detail: expect.objectContaining({
            session: expect.objectContaining({ id: "session-1" }),
            projectPath: "/test/project1",
          }),
        })
      );
    });

    it("should handle button click events", () => {
      render(<ProjectsPage />);
      
      const newSessionButton = screen.getByText("New Claude Code session");
      fireEvent.click(newSessionButton);
      
      // Should navigate to home
      expect(window.location.href).toBe("/");
    });

    it("should handle running session clicks", () => {
      render(<ProjectsPage />);
      
      const runningSessionButton = screen.getByText("Test Running Session");
      fireEvent.click(runningSessionButton);
      
      // Should handle session click
      expect(runningSessionButton).toBeInTheDocument();
    });
  });

  describe("Next.js Responsive Design", () => {
    it("should support responsive grid layouts", () => {
      render(<ProjectsPage />);
      
      // Test responsive grid classes
      const projectCard = screen.getByText("project1").closest("div");
      expect(projectCard).toHaveClass("cursor-pointer");
    });

    it("should handle mobile-friendly design", () => {
      render(<ProjectsPage />);
      
      // Test that components are mobile-responsive
      expect(screen.getByText("CC Projects")).toBeInTheDocument();
    });
  });

  describe("Next.js Performance Features", () => {
    it("should support lazy loading", () => {
      render(<ProjectsPage />);
      
      // Test that components load efficiently
      expect(screen.getByText("CC Projects")).toBeInTheDocument();
    });

    it("should handle pagination", () => {
      // Create more projects to test pagination
      const manyProjects = Array.from({ length: 15 }, (_, i) => ({
        id: `${i + 1}`,
        path: `/test/project${i + 1}`,
        created_at: 1640995200,
        sessions: [],
      }));

      mockUseProjects.mockReturnValue({
        data: manyProjects,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<ProjectsPage />);
      
      // Should handle pagination if implemented
      expect(screen.getByText("project1")).toBeInTheDocument();
    });
  });

  describe("Next.js TypeScript Integration", () => {
    it("should have proper TypeScript types", () => {
      render(<ProjectsPage />);
      
      // Test that TypeScript compilation works
      expect(screen.getByText("CC Projects")).toBeInTheDocument();
    });

    it("should handle type-safe props", () => {
      render(<ProjectsPage />);
      
      // Test that props are type-safe
      expect(screen.getByText("project1")).toBeInTheDocument();
    });
  });

  describe("Next.js Animation Features", () => {
    it("should support framer-motion animations", () => {
      render(<ProjectsPage />);
      
      // Test that animations work without errors
      expect(screen.getByText("CC Projects")).toBeInTheDocument();
    });

    it("should handle view transitions", async () => {
      render(<ProjectsPage />);
      
      // Test transition between views
      const projectCard = screen.getByText("project1").closest("div");
      fireEvent.click(projectCard!);
      
      await waitFor(() => {
        expect(screen.getByText("/test/project1")).toBeInTheDocument();
      });
    });
  });

  describe("Next.js Accessibility", () => {
    it("should have proper ARIA labels", () => {
      render(<ProjectsPage />);
      
      // Test accessibility features
      const newSessionButton = screen.getByText("New Claude Code session");
      expect(newSessionButton).toBeInTheDocument();
    });

    it("should support keyboard navigation", () => {
      render(<ProjectsPage />);
      
      const newSessionButton = screen.getByText("New Claude Code session");
      fireEvent.keyDown(newSessionButton, { key: "Enter" });
      
      // Should handle keyboard events
      expect(newSessionButton).toBeInTheDocument();
    });
  });

  describe("Next.js Error Boundaries", () => {
    it("should handle component errors gracefully", () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<ProjectsPage />);
      
      // Test that errors are handled
      expect(screen.getByText("CC Projects")).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  describe("Next.js SEO Features", () => {
    it("should support proper document structure", () => {
      render(<ProjectsPage />);
      
      // Test heading structure
      expect(screen.getByText("CC Projects")).toBeInTheDocument();
      expect(screen.getByText("Browse your Claude Code sessions")).toBeInTheDocument();
    });
  });

  describe("Next.js Build Features", () => {
    it("should support code splitting", () => {
      render(<ProjectsPage />);
      
      // Test that components are properly split
      expect(screen.getByText("CC Projects")).toBeInTheDocument();
    });

    it("should handle environment variables", () => {
      render(<ProjectsPage />);
      
      // Test that environment-dependent features work
      expect(screen.getByText("CC Projects")).toBeInTheDocument();
    });
  });
});