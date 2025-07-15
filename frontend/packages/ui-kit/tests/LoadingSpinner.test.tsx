import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { LoadingSpinner } from '../src/components/LoadingSpinner';

describe('LoadingSpinner', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders with default props', () => {
    render(<LoadingSpinner data-testid="test-spinner-default" />);
    
    const spinner = screen.getByTestId('test-spinner-default');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('role', 'status');
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });

  it('applies correct size classes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" data-testid="test-spinner-size" />);
    let spinner = screen.getByTestId('test-spinner-size');
    expect(spinner).toHaveClass('h-4', 'w-4');

    rerender(<LoadingSpinner size="md" data-testid="test-spinner-size" />);
    spinner = screen.getByTestId('test-spinner-size');
    expect(spinner).toHaveClass('h-6', 'w-6');

    rerender(<LoadingSpinner size="lg" data-testid="test-spinner-size" />);
    spinner = screen.getByTestId('test-spinner-size');
    expect(spinner).toHaveClass('h-8', 'w-8');
  });

  it('applies custom className', () => {
    render(<LoadingSpinner className="custom-class" data-testid="test-spinner-custom" />);
    
    const spinner = screen.getByTestId('test-spinner-custom');
    expect(spinner).toHaveClass('custom-class');
  });

  it('uses custom test id', () => {
    render(<LoadingSpinner data-testid="custom-spinner" />);
    
    expect(screen.getByTestId('custom-spinner')).toBeInTheDocument();
  });

  it('has spinning animation', () => {
    render(<LoadingSpinner data-testid="test-spinner-animation" />);
    
    const spinner = screen.getByTestId('test-spinner-animation');
    expect(spinner).toHaveClass('animate-spin');
  });

  it('has proper border styling', () => {
    render(<LoadingSpinner data-testid="test-spinner-border" />);
    
    const spinner = screen.getByTestId('test-spinner-border');
    expect(spinner).toHaveClass('rounded-full', 'border-2', 'border-gray-300', 'border-t-blue-600');
  });
});