import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusBadge } from '../src/components/StatusBadge/StatusBadge';

describe('StatusBadge', () => {
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<StatusBadge status="idle" />);
      
      const badge = screen.getByTestId('status-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Idle');
    });

    it('renders with custom children', () => {
      render(<StatusBadge status="busy">Processing</StatusBadge>);
      
      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveTextContent('Processing');
    });

    it('renders with custom test id', () => {
      render(<StatusBadge status="error" data-testid="custom-badge" />);
      
      const badge = screen.getByTestId('custom-badge');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Status Variants', () => {
    it('renders idle status correctly', () => {
      render(<StatusBadge status="idle" />);
      
      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800', 'border-gray-300');
      expect(badge).toHaveTextContent('Idle');
    });

    it('renders busy status correctly', () => {
      render(<StatusBadge status="busy" />);
      
      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800', 'border-yellow-300');
      expect(badge).toHaveTextContent('Busy');
    });

    it('renders error status correctly', () => {
      render(<StatusBadge status="error" />);
      
      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveClass('bg-red-100', 'text-red-800', 'border-red-300');
      expect(badge).toHaveTextContent('Error');
    });

    it('renders success status correctly', () => {
      render(<StatusBadge status="success" />);
      
      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveClass('bg-green-100', 'text-green-800', 'border-green-300');
      expect(badge).toHaveTextContent('Success');
    });
  });

  describe('Size Variants', () => {
    it('renders small size', () => {
      render(<StatusBadge status="idle" size="sm" />);
      
      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveClass('px-2', 'py-1', 'text-xs');
    });

    it('renders medium size (default)', () => {
      render(<StatusBadge status="idle" size="md" />);
      
      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveClass('px-3', 'py-1', 'text-sm');
    });

    it('renders large size', () => {
      render(<StatusBadge status="idle" size="lg" />);
      
      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveClass('px-4', 'py-2', 'text-base');
    });

    it('defaults to medium size when not specified', () => {
      render(<StatusBadge status="idle" />);
      
      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveClass('px-3', 'py-1', 'text-sm');
    });
  });

  describe('Status Indicators', () => {
    it('shows correct indicator for idle status', () => {
      render(<StatusBadge status="idle" />);
      
      const badge = screen.getByTestId('status-badge');
      const indicator = badge.querySelector('span');
      expect(indicator).toHaveClass('bg-gray-500');
      expect(indicator).not.toHaveClass('animate-pulse');
    });

    it('shows animated indicator for busy status', () => {
      render(<StatusBadge status="busy" />);
      
      const badge = screen.getByTestId('status-badge');
      const indicator = badge.querySelector('span');
      expect(indicator).toHaveClass('bg-yellow-500', 'animate-pulse');
    });

    it('shows correct indicator for error status', () => {
      render(<StatusBadge status="error" />);
      
      const badge = screen.getByTestId('status-badge');
      const indicator = badge.querySelector('span');
      expect(indicator).toHaveClass('bg-red-500');
      expect(indicator).not.toHaveClass('animate-pulse');
    });

    it('shows correct indicator for success status', () => {
      render(<StatusBadge status="success" />);
      
      const badge = screen.getByTestId('status-badge');
      const indicator = badge.querySelector('span');
      expect(indicator).toHaveClass('bg-green-500');
      expect(indicator).not.toHaveClass('animate-pulse');
    });
  });

  describe('Accessibility', () => {
    it('has proper role attribute', () => {
      render(<StatusBadge status="idle" />);
      
      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveAttribute('role', 'status');
    });

    it('has proper aria-label', () => {
      render(<StatusBadge status="busy" />);
      
      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveAttribute('aria-label', 'Status: busy');
    });

    it('maintains aria-label consistency with different statuses', () => {
      const statuses = ['idle', 'busy', 'error', 'success'] as const;
      
      statuses.forEach(status => {
        const { unmount } = render(<StatusBadge status={status} />);
        const badge = screen.getByTestId('status-badge');
        expect(badge).toHaveAttribute('aria-label', `Status: ${status}`);
        unmount();
      });
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      render(<StatusBadge status="idle" className="custom-class" />);
      
      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveClass('custom-class');
    });

    it('maintains base classes with custom className', () => {
      render(<StatusBadge status="idle" className="custom-class" />);
      
      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveClass('inline-flex', 'items-center', 'rounded-full', 'border', 'font-medium');
      expect(badge).toHaveClass('custom-class');
    });

    it('allows className to override specific styles', () => {
      render(<StatusBadge status="idle" className="bg-blue-500" />);
      
      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveClass('bg-blue-500');
    });
  });

  describe('Text Capitalization', () => {
    it('capitalizes status text correctly', () => {
      const testCases = [
        { status: 'idle', expected: 'Idle' },
        { status: 'busy', expected: 'Busy' },
        { status: 'error', expected: 'Error' },
        { status: 'success', expected: 'Success' }
      ] as const;

      testCases.forEach(({ status, expected }) => {
        const { unmount } = render(<StatusBadge status={status} />);
        const badge = screen.getByTestId('status-badge');
        expect(badge).toHaveTextContent(expected);
        unmount();
      });
    });

    it('preserves custom children text without capitalization', () => {
      render(<StatusBadge status="busy">currently processing</StatusBadge>);
      
      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveTextContent('currently processing');
    });
  });

  describe('Performance', () => {
    it('renders quickly with multiple badges', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        const { unmount } = render(<StatusBadge status="idle" key={i} />);
        unmount();
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should render 100 badges in under 1 second
    });

    it('maintains consistent rendering performance across status types', () => {
      const statuses = ['idle', 'busy', 'error', 'success'] as const;
      const timings: number[] = [];

      statuses.forEach(status => {
        const startTime = performance.now();
        
        for (let i = 0; i < 50; i++) {
          const { unmount } = render(<StatusBadge status={status} key={i} />);
          unmount();
        }
        
        const endTime = performance.now();
        timings.push(endTime - startTime);
      });

      // All status types should have similar performance
      const maxTiming = Math.max(...timings);
      const minTiming = Math.min(...timings);
      expect(maxTiming - minTiming).toBeLessThan(100); // Difference should be less than 100ms
    });
  });

  describe('Edge Cases', () => {
    it('handles empty children gracefully', () => {
      render(<StatusBadge status="idle">{''}</StatusBadge>);
      
      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveTextContent('');
    });

    it('handles null children gracefully', () => {
      render(<StatusBadge status="idle">{null}</StatusBadge>);
      
      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveTextContent('Idle'); // Falls back to status
    });

    it('handles undefined children gracefully', () => {
      render(<StatusBadge status="idle">{undefined}</StatusBadge>);
      
      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveTextContent('Idle'); // Falls back to status
    });

    it('handles numeric children', () => {
      render(<StatusBadge status="idle">{42}</StatusBadge>);
      
      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveTextContent('42');
    });

    it('handles complex children elements', () => {
      render(
        <StatusBadge status="idle">
          <span data-testid="complex-child">Complex Content</span>
        </StatusBadge>
      );
      
      const badge = screen.getByTestId('status-badge');
      const child = screen.getByTestId('complex-child');
      expect(badge).toContainElement(child);
      expect(child).toHaveTextContent('Complex Content');
    });
  });

  describe('Component Integration', () => {
    it('works well within other components', () => {
      render(
        <div data-testid="parent">
          <StatusBadge status="success" />
          <StatusBadge status="error" />
        </div>
      );
      
      const parent = screen.getByTestId('parent');
      const badges = screen.getAllByTestId('status-badge');
      
      expect(badges).toHaveLength(2);
      expect(parent).toContainElement(badges[0]);
      expect(parent).toContainElement(badges[1]);
    });

    it('maintains proper spacing in flex containers', () => {
      render(
        <div className="flex gap-2" data-testid="flex-container">
          <StatusBadge status="idle" />
          <StatusBadge status="busy" />
          <StatusBadge status="success" />
        </div>
      );
      
      const container = screen.getByTestId('flex-container');
      const badges = screen.getAllByTestId('status-badge');
      
      expect(container).toHaveClass('flex', 'gap-2');
      expect(badges).toHaveLength(3);
    });
  });
});