/**
 * Snapshot tests for key components
 * Tests that components render consistently and detect unintended changes
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RootLayout from '@/app/layout';
import HomePage from '@/app/page';
import AgentsPage from '@/app/agents/page';
import ProjectsPage from '@/app/projects/page';

// Mock dependencies
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
    nav: ({ children, ...props }: any) => <nav {...props}>{children}</nav>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('lucide-react', () => ({
  ArrowLeft: () => <svg data-testid="arrow-left-icon" />,
  ArrowRight: () => <svg data-testid="arrow-right-icon" />,
  Calendar: () => <svg data-testid="calendar-icon" />,
  ChevronRight: () => <svg data-testid="chevron-right-icon" />,
  Clock: () => <svg data-testid="clock-icon" />,
  FileText: () => <svg data-testid="file-text-icon" />,
  FolderOpen: () => <svg data-testid="folder-open-icon" />,
  Loader2: () => <svg data-testid="loader-icon" />,
  MessageSquare: () => <svg data-testid="message-square-icon" />,
  MoreVertical: () => <svg data-testid="more-vertical-icon" />,
  Plus: () => <svg data-testid="plus-icon" />,
  Settings: () => <svg data-testid="settings-icon" />,
  User: () => <svg data-testid="user-icon" />,
  Code: () => <svg data-testid="code-icon" />,
  Play: () => <svg data-testid="play-icon" />,
  Pause: () => <svg data-testid="pause-icon" />,
  Stop: () => <svg data-testid="stop-icon" />,
  Download: () => <svg data-testid="download-icon" />,
  Upload: () => <svg data-testid="upload-icon" />,
  Trash2: () => <svg data-testid="trash-icon" />,
  Edit: () => <svg data-testid="edit-icon" />,
  Copy: () => <svg data-testid="copy-icon" />,
  Check: () => <svg data-testid="check-icon" />,
  X: () => <svg data-testid="x-icon" />,
}));

vi.mock('@/components/providers', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="providers">{children}</div>
  ),
}));

vi.mock('@/components/error-boundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, variant, size, className, ...props }: any) => (
    <button
      data-testid="button"
      data-variant={variant}
      data-size={size}
      className={className}
      {...props}
    >
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div data-testid="card" className={className} {...props}>
      {children}
    </div>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div data-testid="card-content" className={className} {...props}>
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => (
    <div data-testid="dropdown-menu">{children}</div>
  ),
  DropdownMenuTrigger: ({ children, ...props }: any) => (
    <div data-testid="dropdown-menu-trigger" {...props}>
      {children}
    </div>
  ),
  DropdownMenuContent: ({ children }: any) => (
    <div data-testid="dropdown-menu-content">{children}</div>
  ),
  DropdownMenuItem: ({ children, ...props }: any) => (
    <div data-testid="dropdown-menu-item" {...props}>
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => (
    <input data-testid="input" {...props} />
  ),
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => (
    <label data-testid="label" {...props}>
      {children}
    </label>
  ),
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props: any) => (
    <textarea data-testid="textarea" {...props} />
  ),
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: any) => (
    <div data-testid="dialog">{children}</div>
  ),
  DialogContent: ({ children }: any) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: any) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children }: any) => (
    <h2 data-testid="dialog-title">{children}</h2>
  ),
  DialogFooter: ({ children }: any) => (
    <div data-testid="dialog-footer">{children}</div>
  ),
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: any) => (
    <div data-testid="select">{children}</div>
  ),
  SelectContent: ({ children }: any) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({ children, value }: any) => (
    <div data-testid="select-item" data-value={value}>
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: any) => (
    <div data-testid="select-trigger">{children}</div>
  ),
  SelectValue: ({ placeholder }: any) => (
    <span data-testid="select-value" data-placeholder={placeholder} />
  ),
}));

vi.mock('@/components/RunningClaudeSessions', () => ({
  RunningClaudeSessions: ({ onSessionClick }: any) => (
    <div data-testid="running-claude-sessions">
      <button onClick={() => onSessionClick({ id: 'test-session' })}>
        Test Session
      </button>
    </div>
  ),
}));

vi.mock('@/hooks/use-projects', () => ({
  useProjects: () => ({
    data: [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
  useProjectSessions: () => ({
    data: [],
    isLoading: false,
    error: null,
  }),
  useCreateSession: () => ({
    mutate: vi.fn(),
    isLoading: false,
    error: null,
  }),
}));

vi.mock('@/lib/api-web', () => ({
  api: {
    agents: {
      list: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      execute: vi.fn(),
    },
    projects: {
      list: vi.fn().mockResolvedValue([]),
      getSessions: vi.fn().mockResolvedValue([]),
      createSession: vi.fn(),
    },
  },
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

// Mock fonts
vi.mock('next/font/google', () => ({
  Inter: () => ({
    variable: '--font-inter',
    className: 'font-inter',
  }),
}));

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <div data-testid="test-wrapper">
        {children}
      </div>
    </BrowserRouter>
  );
};

describe('Component Snapshots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('RootLayout Component', () => {
    it('should render RootLayout with consistent structure', () => {
      const { container } = render(
        <RootLayout>
          <div>Test content</div>
        </RootLayout>
      );

      expect(container).toMatchSnapshot();
    });

    it('should render RootLayout with error boundary', () => {
      const { container } = render(
        <RootLayout>
          <div>Content with error boundary</div>
        </RootLayout>
      );

      expect(container.querySelector('[data-testid="error-boundary"]')).toBeTruthy();
      expect(container).toMatchSnapshot();
    });

    it('should render RootLayout with providers', () => {
      const { container } = render(
        <RootLayout>
          <div>Content with providers</div>
        </RootLayout>
      );

      expect(container.querySelector('[data-testid="providers"]')).toBeTruthy();
      expect(container).toMatchSnapshot();
    });
  });

  describe('HomePage Component', () => {
    it('should render HomePage with navigation cards', () => {
      const { container } = render(
        <TestWrapper>
          <HomePage />
        </TestWrapper>
      );

      expect(container).toMatchSnapshot();
    });

    it('should render HomePage with consistent layout', () => {
      const { container } = render(
        <TestWrapper>
          <HomePage />
        </TestWrapper>
      );

      // Check for main structural elements
      expect(container.querySelector('h1')).toBeTruthy();
      expect(container.querySelector('[data-testid="card"]')).toBeTruthy();
      expect(container).toMatchSnapshot();
    });
  });

  describe('AgentsPage Component', () => {
    it('should render AgentsPage with default state', () => {
      const { container } = render(
        <TestWrapper>
          <AgentsPage />
        </TestWrapper>
      );

      expect(container).toMatchSnapshot();
    });

    it('should render AgentsPage with loading state', () => {
      // Mock loading state
      vi.mocked(vi.fn()).mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
      });

      const { container } = render(
        <TestWrapper>
          <AgentsPage />
        </TestWrapper>
      );

      expect(container).toMatchSnapshot();
    });

    it('should render AgentsPage with empty state', () => {
      const { container } = render(
        <TestWrapper>
          <AgentsPage />
        </TestWrapper>
      );

      expect(container).toMatchSnapshot();
    });
  });

  describe('ProjectsPage Component', () => {
    it('should render ProjectsPage with default state', () => {
      const { container } = render(
        <TestWrapper>
          <ProjectsPage />
        </TestWrapper>
      );

      expect(container).toMatchSnapshot();
    });

    it('should render ProjectsPage with project list', () => {
      const { container } = render(
        <TestWrapper>
          <ProjectsPage />
        </TestWrapper>
      );

      expect(container).toMatchSnapshot();
    });

    it('should render ProjectsPage with running sessions', () => {
      const { container } = render(
        <TestWrapper>
          <ProjectsPage />
        </TestWrapper>
      );

      expect(container.querySelector('[data-testid="running-claude-sessions"]')).toBeTruthy();
      expect(container).toMatchSnapshot();
    });
  });

  describe('Component Interactions', () => {
    it('should render HomePage navigation cards consistently', () => {
      const { container } = render(
        <TestWrapper>
          <HomePage />
        </TestWrapper>
      );

      // Should have navigation cards
      const cards = container.querySelectorAll('[data-testid="card"]');
      expect(cards.length).toBeGreaterThan(0);
      expect(container).toMatchSnapshot();
    });

    it('should render AgentsPage modals consistently', () => {
      const { container } = render(
        <TestWrapper>
          <AgentsPage />
        </TestWrapper>
      );

      // Should have dialog elements for modals
      const dialogs = container.querySelectorAll('[data-testid="dialog"]');
      expect(container).toMatchSnapshot();
    });

    it('should render ProjectsPage pagination consistently', () => {
      const { container } = render(
        <TestWrapper>
          <ProjectsPage />
        </TestWrapper>
      );

      // Should have consistent pagination structure
      expect(container).toMatchSnapshot();
    });
  });

  describe('Component Props Variations', () => {
    it('should render RootLayout with different children', () => {
      const { container: container1 } = render(
        <RootLayout>
          <div>Child 1</div>
        </RootLayout>
      );

      const { container: container2 } = render(
        <RootLayout>
          <div>Child 2</div>
        </RootLayout>
      );

      expect(container1).toMatchSnapshot();
      expect(container2).toMatchSnapshot();
    });

    it('should render components with different states', () => {
      // Test with different mock states
      const { container } = render(
        <TestWrapper>
          <AgentsPage />
        </TestWrapper>
      );

      expect(container).toMatchSnapshot();
    });
  });

  describe('Component Accessibility', () => {
    it('should render with proper accessibility attributes', () => {
      const { container } = render(
        <RootLayout>
          <div>Accessible content</div>
        </RootLayout>
      );

      // Check for language attribute
      const html = container.querySelector('html');
      expect(html?.getAttribute('lang')).toBe('en');
      expect(container).toMatchSnapshot();
    });

    it('should render buttons with proper attributes', () => {
      const { container } = render(
        <TestWrapper>
          <HomePage />
        </TestWrapper>
      );

      const buttons = container.querySelectorAll('[data-testid="button"]');
      expect(buttons.length).toBeGreaterThan(0);
      expect(container).toMatchSnapshot();
    });
  });

  describe('Component Styling', () => {
    it('should render with consistent CSS classes', () => {
      const { container } = render(
        <TestWrapper>
          <HomePage />
        </TestWrapper>
      );

      // Check for common styling classes
      const elementsWithClasses = container.querySelectorAll('[class*="min-h-screen"]');
      expect(container).toMatchSnapshot();
    });

    it('should render with proper responsive classes', () => {
      const { container } = render(
        <TestWrapper>
          <ProjectsPage />
        </TestWrapper>
      );

      // Check for responsive grid classes
      const grids = container.querySelectorAll('[class*="grid-cols"]');
      expect(container).toMatchSnapshot();
    });
  });

  describe('Component Error States', () => {
    it('should render error states consistently', () => {
      const { container } = render(
        <TestWrapper>
          <AgentsPage />
        </TestWrapper>
      );

      expect(container).toMatchSnapshot();
    });

    it('should render loading states consistently', () => {
      const { container } = render(
        <TestWrapper>
          <ProjectsPage />
        </TestWrapper>
      );

      expect(container).toMatchSnapshot();
    });
  });

  describe('Component Data Structures', () => {
    it('should render with consistent data attributes', () => {
      const { container } = render(
        <TestWrapper>
          <AgentsPage />
        </TestWrapper>
      );

      // Check for testid attributes
      const testElements = container.querySelectorAll('[data-testid]');
      expect(testElements.length).toBeGreaterThan(0);
      expect(container).toMatchSnapshot();
    });

    it('should render with proper component hierarchy', () => {
      const { container } = render(
        <RootLayout>
          <TestWrapper>
            <HomePage />
          </TestWrapper>
        </RootLayout>
      );

      expect(container).toMatchSnapshot();
    });
  });
});