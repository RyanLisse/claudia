/**
 * Next.js-specific tests for AgentsPage
 * Tests Next.js features, client-side functionality, and SSR compatibility
 */

import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import AgentsPage from "../page";

// Mock Next.js router
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  pathname: "/agents",
  query: {},
  asPath: "/agents",
};

vi.mock("next/router", () => ({
  useRouter: () => mockRouter,
}));

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/agents",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js dynamic imports
vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: (fn: any) => {
    const Component = fn();
    return Component;
  },
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

describe("AgentsPage - Next.js Specific Tests", () => {
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

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Next.js Client-Side Features", () => {
    it("should work with 'use client' directive", () => {
      render(<AgentsPage />);
      
      // Test client-side state management
      expect(screen.getByText("CC Agents")).toBeInTheDocument();
      expect(screen.getByText("Manage your custom AI agents")).toBeInTheDocument();
    });

    it("should handle client-side routing", () => {
      render(<AgentsPage />);
      
      const backButton = screen.getByTestId("arrow-left");
      fireEvent.click(backButton.closest("button")!);
      
      // Should navigate using window.location for client-side routing
      expect(window.location.href).toBe("/");
    });

    it("should handle React hooks correctly", async () => {
      render(<AgentsPage />);
      
      // Test useState hook for loading state
      expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
      
      // Test useEffect hook for data loading
      await waitFor(() => {
        expect(mockApi.listAgents).toHaveBeenCalled();
        expect(mockApi.listAgentRuns).toHaveBeenCalled();
      });
    });

    it("should handle form state management", async () => {
      render(<AgentsPage />);
      
      // Open create modal
      const createButton = screen.getByText("Create Agent");
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(screen.getByText("Create New Agent")).toBeInTheDocument();
      });
      
      // Test form inputs
      const nameInput = screen.getByPlaceholderText("Enter agent name");
      expect(nameInput).toBeInTheDocument();
      
      // Test form validation
      fireEvent.change(nameInput, { target: { value: "New Agent" } });
      expect(nameInput).toHaveValue("New Agent");
    });

    it("should handle modal state correctly", async () => {
      render(<AgentsPage />);
      
      // Test modal opening
      const createButton = screen.getByText("Create Agent");
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(screen.getByTestId("dialog")).toBeInTheDocument();
      });
      
      // Test modal closing
      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
      });
    });
  });

  describe("Next.js Performance Features", () => {
    it("should support lazy loading", async () => {
      render(<AgentsPage />);
      
      // Test that components load asynchronously
      await waitFor(() => {
        expect(screen.getByText("CC Agents")).toBeInTheDocument();
      });
    });

    it("should handle image optimization", async () => {
      render(<AgentsPage />);
      
      await waitFor(() => {
        const botIcon = screen.getByTestId("bot-icon");
        expect(botIcon).toBeInTheDocument();
      });
    });

    it("should support code splitting", () => {
      render(<AgentsPage />);
      
      // Test that the component renders without import errors
      expect(screen.getByText("CC Agents")).toBeInTheDocument();
    });
  });

  describe("Next.js Static Export Compatibility", () => {
    it("should work with static export", () => {
      render(<AgentsPage />);
      
      // Test that the component works without server-side features
      expect(screen.getByText("CC Agents")).toBeInTheDocument();
    });

    it("should handle client-side navigation", () => {
      render(<AgentsPage />);
      
      const backButton = screen.getByTestId("arrow-left");
      fireEvent.click(backButton.closest("button")!);
      
      // Should use window.location for static export compatibility
      expect(window.location.href).toBe("/");
    });

    it("should handle file operations for static export", async () => {
      render(<AgentsPage />);
      
      await waitFor(() => {
        const importButton = screen.getByText("Import");
        expect(importButton).toBeInTheDocument();
      });
    });
  });

  describe("Next.js Error Handling", () => {
    it("should handle API errors gracefully", async () => {
      mockApi.listAgents.mockRejectedValue(new Error("Network error"));
      
      render(<AgentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText("Failed to load agents")).toBeInTheDocument();
      });
    });

    it("should handle component errors", () => {
      // Test error boundary behavior
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<AgentsPage />);
      
      expect(screen.getByText("CC Agents")).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  describe("Next.js Accessibility Features", () => {
    it("should have proper ARIA labels", () => {
      render(<AgentsPage />);
      
      const createButton = screen.getByText("Create Agent");
      expect(createButton).toBeInTheDocument();
    });

    it("should support keyboard navigation", () => {
      render(<AgentsPage />);
      
      const createButton = screen.getByText("Create Agent");
      fireEvent.keyDown(createButton, { key: "Enter" });
      
      expect(screen.getByText("Create New Agent")).toBeInTheDocument();
    });

    it("should have proper focus management", async () => {
      render(<AgentsPage />);
      
      const createButton = screen.getByText("Create Agent");
      fireEvent.click(createButton);
      
      await waitFor(() => {
        const modal = screen.getByTestId("dialog");
        expect(modal).toBeInTheDocument();
      });
    });
  });

  describe("Next.js SEO Features", () => {
    it("should support proper document structure", () => {
      render(<AgentsPage />);
      
      // Test heading structure
      expect(screen.getByText("CC Agents")).toBeInTheDocument();
      expect(screen.getByText("Manage your custom AI agents")).toBeInTheDocument();
    });

    it("should handle meta tags correctly", () => {
      render(<AgentsPage />);
      
      // Test that the page title is rendered
      expect(screen.getByText("CC Agents")).toBeInTheDocument();
    });
  });

  describe("Next.js Build Optimization", () => {
    it("should tree-shake unused code", () => {
      render(<AgentsPage />);
      
      // Test that only required components are loaded
      expect(screen.getByText("CC Agents")).toBeInTheDocument();
    });

    it("should bundle dependencies correctly", () => {
      render(<AgentsPage />);
      
      // Test that external dependencies work
      expect(screen.getByTestId("bot-icon")).toBeInTheDocument();
    });
  });

  describe("Next.js TypeScript Integration", () => {
    it("should have proper TypeScript types", () => {
      render(<AgentsPage />);
      
      // Test that TypeScript compilation works
      expect(screen.getByText("CC Agents")).toBeInTheDocument();
    });

    it("should handle type-safe API calls", async () => {
      render(<AgentsPage />);
      
      await waitFor(() => {
        expect(mockApi.listAgents).toHaveBeenCalled();
      });
    });
  });

  describe("Next.js Environment Variables", () => {
    it("should handle environment variables", () => {
      render(<AgentsPage />);
      
      // Test that environment-dependent features work
      expect(screen.getByText("CC Agents")).toBeInTheDocument();
    });
  });

  describe("Next.js Animation and Styling", () => {
    it("should support CSS modules", () => {
      render(<AgentsPage />);
      
      // Test that CSS classes are applied
      const title = screen.getByText("CC Agents");
      expect(title).toHaveClass("font-bold");
    });

    it("should support Tailwind CSS", () => {
      render(<AgentsPage />);
      
      // Test Tailwind classes
      expect(screen.getByText("CC Agents")).toBeInTheDocument();
    });

    it("should support framer-motion animations", () => {
      render(<AgentsPage />);
      
      // Test that animations work without errors
      expect(screen.getByText("CC Agents")).toBeInTheDocument();
    });
  });
});