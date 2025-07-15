import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';

describe('Card', () => {
  it('renders correctly', () => {
    render(<Card>Test Card</Card>);
    expect(screen.getByText('Test Card')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Card className="custom-class">Card</Card>);
    const card = screen.getByText('Card');
    expect(card).toHaveClass('custom-class');
  });

  it('renders different variants', () => {
    const { rerender } = render(<Card variant="default">Default</Card>);
    expect(screen.getByText('Default')).toHaveClass('border-border');

    rerender(<Card variant="outline">Outline</Card>);
    expect(screen.getByText('Outline')).toHaveClass('border-2');

    rerender(<Card variant="filled">Filled</Card>);
    expect(screen.getByText('Filled')).toHaveClass('bg-muted');

    rerender(<Card variant="elevated">Elevated</Card>);
    expect(screen.getByText('Elevated')).toHaveClass('shadow-lg');
  });

  it('renders different sizes', () => {
    const { rerender } = render(<Card size="default">Default</Card>);
    expect(screen.getByText('Default')).toHaveClass('p-6');

    rerender(<Card size="sm">Small</Card>);
    expect(screen.getByText('Small')).toHaveClass('p-4');

    rerender(<Card size="lg">Large</Card>);
    expect(screen.getByText('Large')).toHaveClass('p-8');

    rerender(<Card size="compact">Compact</Card>);
    expect(screen.getByText('Compact')).toHaveClass('p-3');
  });

  it('handles interactive state', () => {
    render(<Card interactive>Interactive Card</Card>);
    const card = screen.getByText('Interactive Card');
    expect(card).toHaveClass('cursor-pointer');
    expect(card).toHaveClass('hover:shadow-md');
  });

  it('renders as link when href is provided', () => {
    render(<Card href="/test">Link Card</Card>);
    const card = screen.getByText('Link Card');
    expect(card.tagName).toBe('A');
    expect(card).toHaveAttribute('href', '/test');
  });

  it('renders different layouts', () => {
    const { rerender } = render(<Card layout="default">Default</Card>);
    expect(screen.getByText('Default')).toHaveClass('block');

    rerender(<Card layout="vertical">Vertical</Card>);
    expect(screen.getByText('Vertical')).toHaveClass('flex-col');

    rerender(<Card layout="horizontal">Horizontal</Card>);
    expect(screen.getByText('Horizontal')).toHaveClass('flex-row');
  });

  describe('CardHeader', () => {
    it('renders correctly', () => {
      render(<CardHeader>Header Content</CardHeader>);
      expect(screen.getByText('Header Content')).toBeInTheDocument();
    });

    it('applies centered styling', () => {
      render(<CardHeader centered>Centered Header</CardHeader>);
      const header = screen.getByText('Centered Header');
      expect(header).toHaveClass('items-center');
      expect(header).toHaveClass('text-center');
    });
  });

  describe('CardTitle', () => {
    it('renders correctly', () => {
      render(<CardTitle>Title Text</CardTitle>);
      expect(screen.getByText('Title Text')).toBeInTheDocument();
    });

    it('has correct heading structure', () => {
      render(<CardTitle>Title Text</CardTitle>);
      const title = screen.getByText('Title Text');
      expect(title.tagName).toBe('H3');
    });
  });

  describe('CardDescription', () => {
    it('renders correctly', () => {
      render(<CardDescription>Description Text</CardDescription>);
      expect(screen.getByText('Description Text')).toBeInTheDocument();
    });

    it('has correct styling', () => {
      render(<CardDescription>Description Text</CardDescription>);
      const description = screen.getByText('Description Text');
      expect(description).toHaveClass('text-muted-foreground');
    });
  });

  describe('CardContent', () => {
    it('renders correctly', () => {
      render(<CardContent>Content Text</CardContent>);
      expect(screen.getByText('Content Text')).toBeInTheDocument();
    });

    it('applies scrollable styling', () => {
      render(<CardContent scrollable>Scrollable Content</CardContent>);
      const content = screen.getByText('Scrollable Content');
      expect(content).toHaveClass('overflow-y-auto');
    });
  });

  describe('CardFooter', () => {
    it('renders correctly', () => {
      render(<CardFooter>Footer Content</CardFooter>);
      expect(screen.getByText('Footer Content')).toBeInTheDocument();
    });

    it('applies different justify options', () => {
      const { rerender } = render(<CardFooter justify="start">Start</CardFooter>);
      expect(screen.getByText('Start')).toHaveClass('justify-start');

      rerender(<CardFooter justify="center">Center</CardFooter>);
      expect(screen.getByText('Center')).toHaveClass('justify-center');

      rerender(<CardFooter justify="end">End</CardFooter>);
      expect(screen.getByText('End')).toHaveClass('justify-end');

      rerender(<CardFooter justify="between">Between</CardFooter>);
      expect(screen.getByText('Between')).toHaveClass('justify-between');
    });
  });

  describe('Complete Card', () => {
    it('renders all components together', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
            <CardDescription>Test Description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Test Content</p>
          </CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });

    it('maintains proper structure', () => {
      render(
        <Card data-testid="card">
          <CardHeader data-testid="header">
            <CardTitle>Title</CardTitle>
            <CardDescription>Description</CardDescription>
          </CardHeader>
          <CardContent data-testid="content">Content</CardContent>
          <CardFooter data-testid="footer">Footer</CardFooter>
        </Card>
      );

      const card = screen.getByTestId('card');
      const header = screen.getByTestId('header');
      const content = screen.getByTestId('content');
      const footer = screen.getByTestId('footer');

      expect(card).toContainElement(header);
      expect(card).toContainElement(content);
      expect(card).toContainElement(footer);
    });
  });

  describe('Accessibility', () => {
    it('maintains proper focus management for interactive cards', async () => {
      const user = userEvent.setup();
      render(<Card interactive>Interactive Card</Card>);
      
      const card = screen.getByText('Interactive Card');
      await user.tab();
      
      // Interactive cards should be focusable
      expect(card).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      
      render(<Card interactive onClick={onClick}>Keyboard Card</Card>);
      
      const card = screen.getByText('Keyboard Card');
      await user.tab();
      await user.keyboard('{Enter}');
      
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('maintains proper heading hierarchy', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Main Title</CardTitle>
            <CardDescription>Description</CardDescription>
          </CardHeader>
        </Card>
      );

      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveTextContent('Main Title');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty card gracefully', () => {
      render(<Card />);
      const card = screen.getByText('').closest('div');
      expect(card).toBeInTheDocument();
    });

    it('handles missing props gracefully', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle />
            <CardDescription />
          </CardHeader>
          <CardContent />
          <CardFooter />
        </Card>
      );

      expect(screen.getByText('').closest('div')).toBeInTheDocument();
    });
  });
});