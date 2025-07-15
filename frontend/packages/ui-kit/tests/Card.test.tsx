import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter,
  type CardProps,
  type CardHeaderProps,
  type CardTitleProps,
  type CardDescriptionProps,
  type CardFooterProps
} from '../src/components/Card/Card';

describe('Card Component Suite', () => {
  describe('Card', () => {
    describe('Basic Rendering', () => {
      it('renders with default props', () => {
        render(<Card data-testid="card">Default Card</Card>);
        
        const card = screen.getByTestId('card');
        expect(card).toBeInTheDocument();
        expect(card).toHaveTextContent('Default Card');
      });

      it('renders with custom children', () => {
        render(
          <Card data-testid="card">
            <div>Custom content</div>
          </Card>
        );
        
        const card = screen.getByTestId('card');
        expect(card).toHaveTextContent('Custom content');
      });

      it('applies default classes', () => {
        render(<Card data-testid="card">Content</Card>);
        
        const card = screen.getByTestId('card');
        expect(card).toHaveClass(
          'rounded-lg',
          'border',
          'bg-card',
          'text-card-foreground',
          'shadow-sm'
        );
      });
    });

    describe('Size Variants', () => {
      it('renders small size variant', () => {
        render(<Card size="sm" data-testid="card">Small</Card>);
        
        const card = screen.getByTestId('card');
        expect(card).toHaveClass('p-4');
      });

      it('renders default size variant', () => {
        render(<Card size="default" data-testid="card">Default</Card>);
        
        const card = screen.getByTestId('card');
        expect(card).toHaveClass('p-6');
      });

      it('renders large size variant', () => {
        render(<Card size="lg" data-testid="card">Large</Card>);
        
        const card = screen.getByTestId('card');
        expect(card).toHaveClass('p-8');
      });

      it('defaults to default size when not specified', () => {
        render(<Card data-testid="card">Content</Card>);
        
        const card = screen.getByTestId('card');
        expect(card).toHaveClass('p-6');
      });
    });

    describe('Visual Variants', () => {
      it('renders default variant', () => {
        render(<Card variant="default" data-testid="card">Default</Card>);
        
        const card = screen.getByTestId('card');
        expect(card).toHaveClass('border-border');
      });

      it('renders elevated variant', () => {
        render(<Card variant="elevated" data-testid="card">Elevated</Card>);
        
        const card = screen.getByTestId('card');
        expect(card).toHaveClass('border-border', 'shadow-md');
      });

      it('renders outlined variant', () => {
        render(<Card variant="outlined" data-testid="card">Outlined</Card>);
        
        const card = screen.getByTestId('card');
        expect(card).toHaveClass('border-2', 'border-border', 'shadow-none');
      });

      it('renders filled variant', () => {
        render(<Card variant="filled" data-testid="card">Filled</Card>);
        
        const card = screen.getByTestId('card');
        expect(card).toHaveClass('bg-muted', 'border-border');
      });

      it('renders ghost variant', () => {
        render(<Card variant="ghost" data-testid="card">Ghost</Card>);
        
        const card = screen.getByTestId('card');
        expect(card).toHaveClass('bg-transparent', 'border-transparent', 'shadow-none');
      });
    });

    describe('Interactive Behavior', () => {
      it('applies interactive styles when interactive=true', () => {
        render(<Card interactive={true} data-testid="card">Interactive</Card>);
        
        const card = screen.getByTestId('card');
        expect(card).toHaveClass('cursor-pointer', 'transition-colors');
        expect(card).toHaveAttribute('role', 'button');
        expect(card).toHaveAttribute('tabIndex', '0');
        expect(card).toHaveAttribute('aria-pressed', 'false');
      });

      it('does not apply interactive styles when interactive=false', () => {
        render(<Card interactive={false} data-testid="card">Non-interactive</Card>);
        
        const card = screen.getByTestId('card');
        expect(card).not.toHaveClass('cursor-pointer');
        expect(card).not.toHaveAttribute('role');
        expect(card).not.toHaveAttribute('tabIndex');
      });

      it('handles click events when interactive', () => {
        const handleClick = vi.fn();
        render(
          <Card interactive={true} onClick={handleClick} data-testid="card">
            Clickable
          </Card>
        );
        
        const card = screen.getByTestId('card');
        fireEvent.click(card);
        expect(handleClick).toHaveBeenCalledTimes(1);
      });

      it('handles keyboard events when interactive', () => {
        const handleKeyDown = vi.fn();
        render(
          <Card interactive={true} onKeyDown={handleKeyDown} data-testid="card">
            Keyboard accessible
          </Card>
        );
        
        const card = screen.getByTestId('card');
        fireEvent.keyDown(card, { key: 'Enter' });
        expect(handleKeyDown).toHaveBeenCalledTimes(1);
      });
    });

    describe('Custom Styling', () => {
      it('applies custom className', () => {
        render(<Card className="custom-class" data-testid="card">Custom</Card>);
        
        const card = screen.getByTestId('card');
        expect(card).toHaveClass('custom-class');
      });

      it('maintains base classes with custom className', () => {
        render(<Card className="custom-class" data-testid="card">Custom</Card>);
        
        const card = screen.getByTestId('card');
        expect(card).toHaveClass('rounded-lg', 'border', 'custom-class');
      });
    });
  });

  describe('CardHeader', () => {
    describe('Basic Rendering', () => {
      it('renders with default props', () => {
        render(<CardHeader data-testid="card-header">Header</CardHeader>);
        
        const header = screen.getByTestId('card-header');
        expect(header).toBeInTheDocument();
        expect(header).toHaveTextContent('Header');
      });

      it('applies default classes', () => {
        render(<CardHeader data-testid="card-header">Header</CardHeader>);
        
        const header = screen.getByTestId('card-header');
        expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5');
      });
    });

    describe('Alignment Variants', () => {
      it('renders start alignment (default)', () => {
        render(<CardHeader align="start" data-testid="card-header">Start</CardHeader>);
        
        const header = screen.getByTestId('card-header');
        expect(header).toHaveClass('items-start');
      });

      it('renders center alignment', () => {
        render(<CardHeader align="center" data-testid="card-header">Center</CardHeader>);
        
        const header = screen.getByTestId('card-header');
        expect(header).toHaveClass('items-center');
      });

      it('renders end alignment', () => {
        render(<CardHeader align="end" data-testid="card-header">End</CardHeader>);
        
        const header = screen.getByTestId('card-header');
        expect(header).toHaveClass('items-end');
      });

      it('defaults to start alignment when not specified', () => {
        render(<CardHeader data-testid="card-header">Default</CardHeader>);
        
        const header = screen.getByTestId('card-header');
        expect(header).toHaveClass('items-start');
      });
    });

    describe('Custom Styling', () => {
      it('applies custom className', () => {
        render(<CardHeader className="custom-header" data-testid="card-header">Custom</CardHeader>);
        
        const header = screen.getByTestId('card-header');
        expect(header).toHaveClass('custom-header');
      });
    });
  });

  describe('CardTitle', () => {
    describe('Basic Rendering', () => {
      it('renders with default props', () => {
        render(<CardTitle data-testid="card-title">Title</CardTitle>);
        
        const title = screen.getByTestId('card-title');
        expect(title).toBeInTheDocument();
        expect(title).toHaveTextContent('Title');
      });

      it('applies default classes', () => {
        render(<CardTitle data-testid="card-title">Title</CardTitle>);
        
        const title = screen.getByTestId('card-title');
        expect(title).toHaveClass('font-semibold', 'leading-none', 'tracking-tight');
      });

      it('renders as h3 by default', () => {
        render(<CardTitle data-testid="card-title">Title</CardTitle>);
        
        const title = screen.getByTestId('card-title');
        expect(title.tagName).toBe('H3');
      });
    });

    describe('Size Variants', () => {
      it('renders small size variant', () => {
        render(<CardTitle size="sm" data-testid="card-title">Small</CardTitle>);
        
        const title = screen.getByTestId('card-title');
        expect(title).toHaveClass('text-lg');
      });

      it('renders default size variant', () => {
        render(<CardTitle size="default" data-testid="card-title">Default</CardTitle>);
        
        const title = screen.getByTestId('card-title');
        expect(title).toHaveClass('text-2xl');
      });

      it('renders large size variant', () => {
        render(<CardTitle size="lg" data-testid="card-title">Large</CardTitle>);
        
        const title = screen.getByTestId('card-title');
        expect(title).toHaveClass('text-3xl');
      });

      it('defaults to default size when not specified', () => {
        render(<CardTitle data-testid="card-title">Title</CardTitle>);
        
        const title = screen.getByTestId('card-title');
        expect(title).toHaveClass('text-2xl');
      });
    });

    describe('Semantic HTML Elements', () => {
      it('renders as h1 when specified', () => {
        render(<CardTitle as="h1" data-testid="card-title">H1 Title</CardTitle>);
        
        const title = screen.getByTestId('card-title');
        expect(title.tagName).toBe('H1');
      });

      it('renders as h2 when specified', () => {
        render(<CardTitle as="h2" data-testid="card-title">H2 Title</CardTitle>);
        
        const title = screen.getByTestId('card-title');
        expect(title.tagName).toBe('H2');
      });

      it('renders as h4 when specified', () => {
        render(<CardTitle as="h4" data-testid="card-title">H4 Title</CardTitle>);
        
        const title = screen.getByTestId('card-title');
        expect(title.tagName).toBe('H4');
      });

      it('renders as h5 when specified', () => {
        render(<CardTitle as="h5" data-testid="card-title">H5 Title</CardTitle>);
        
        const title = screen.getByTestId('card-title');
        expect(title.tagName).toBe('H5');
      });

      it('renders as h6 when specified', () => {
        render(<CardTitle as="h6" data-testid="card-title">H6 Title</CardTitle>);
        
        const title = screen.getByTestId('card-title');
        expect(title.tagName).toBe('H6');
      });
    });

    describe('Custom Styling', () => {
      it('applies custom className', () => {
        render(<CardTitle className="custom-title" data-testid="card-title">Custom</CardTitle>);
        
        const title = screen.getByTestId('card-title');
        expect(title).toHaveClass('custom-title');
      });
    });
  });

  describe('CardDescription', () => {
    describe('Basic Rendering', () => {
      it('renders with default props', () => {
        render(<CardDescription data-testid="card-description">Description</CardDescription>);
        
        const description = screen.getByTestId('card-description');
        expect(description).toBeInTheDocument();
        expect(description).toHaveTextContent('Description');
      });

      it('applies default classes', () => {
        render(<CardDescription data-testid="card-description">Description</CardDescription>);
        
        const description = screen.getByTestId('card-description');
        expect(description).toHaveClass('text-muted-foreground');
      });

      it('renders as paragraph element', () => {
        render(<CardDescription data-testid="card-description">Description</CardDescription>);
        
        const description = screen.getByTestId('card-description');
        expect(description.tagName).toBe('P');
      });
    });

    describe('Size Variants', () => {
      it('renders small size variant', () => {
        render(<CardDescription size="sm" data-testid="card-description">Small</CardDescription>);
        
        const description = screen.getByTestId('card-description');
        expect(description).toHaveClass('text-xs');
      });

      it('renders default size variant', () => {
        render(<CardDescription size="default" data-testid="card-description">Default</CardDescription>);
        
        const description = screen.getByTestId('card-description');
        expect(description).toHaveClass('text-sm');
      });

      it('renders large size variant', () => {
        render(<CardDescription size="lg" data-testid="card-description">Large</CardDescription>);
        
        const description = screen.getByTestId('card-description');
        expect(description).toHaveClass('text-base');
      });

      it('defaults to default size when not specified', () => {
        render(<CardDescription data-testid="card-description">Description</CardDescription>);
        
        const description = screen.getByTestId('card-description');
        expect(description).toHaveClass('text-sm');
      });
    });

    describe('Custom Styling', () => {
      it('applies custom className', () => {
        render(<CardDescription className="custom-description" data-testid="card-description">Custom</CardDescription>);
        
        const description = screen.getByTestId('card-description');
        expect(description).toHaveClass('custom-description');
      });
    });
  });

  describe('CardContent', () => {
    describe('Basic Rendering', () => {
      it('renders with default props', () => {
        render(<CardContent data-testid="card-content">Content</CardContent>);
        
        const content = screen.getByTestId('card-content');
        expect(content).toBeInTheDocument();
        expect(content).toHaveTextContent('Content');
      });

      it('applies default classes', () => {
        render(<CardContent data-testid="card-content">Content</CardContent>);
        
        const content = screen.getByTestId('card-content');
        expect(content).toHaveClass('pt-0');
      });

      it('renders as div element', () => {
        render(<CardContent data-testid="card-content">Content</CardContent>);
        
        const content = screen.getByTestId('card-content');
        expect(content.tagName).toBe('DIV');
      });
    });

    describe('Custom Styling', () => {
      it('applies custom className', () => {
        render(<CardContent className="custom-content" data-testid="card-content">Custom</CardContent>);
        
        const content = screen.getByTestId('card-content');
        expect(content).toHaveClass('custom-content');
      });

      it('maintains base classes with custom className', () => {
        render(<CardContent className="custom-content" data-testid="card-content">Custom</CardContent>);
        
        const content = screen.getByTestId('card-content');
        expect(content).toHaveClass('pt-0', 'custom-content');
      });
    });
  });

  describe('CardFooter', () => {
    describe('Basic Rendering', () => {
      it('renders with default props', () => {
        render(<CardFooter data-testid="card-footer">Footer</CardFooter>);
        
        const footer = screen.getByTestId('card-footer');
        expect(footer).toBeInTheDocument();
        expect(footer).toHaveTextContent('Footer');
      });

      it('applies default classes', () => {
        render(<CardFooter data-testid="card-footer">Footer</CardFooter>);
        
        const footer = screen.getByTestId('card-footer');
        expect(footer).toHaveClass('flex', 'items-center', 'pt-0');
      });
    });

    describe('Justify Variants', () => {
      it('renders start justification (default)', () => {
        render(<CardFooter justify="start" data-testid="card-footer">Start</CardFooter>);
        
        const footer = screen.getByTestId('card-footer');
        expect(footer).toHaveClass('justify-start');
      });

      it('renders center justification', () => {
        render(<CardFooter justify="center" data-testid="card-footer">Center</CardFooter>);
        
        const footer = screen.getByTestId('card-footer');
        expect(footer).toHaveClass('justify-center');
      });

      it('renders end justification', () => {
        render(<CardFooter justify="end" data-testid="card-footer">End</CardFooter>);
        
        const footer = screen.getByTestId('card-footer');
        expect(footer).toHaveClass('justify-end');
      });

      it('renders between justification', () => {
        render(<CardFooter justify="between" data-testid="card-footer">Between</CardFooter>);
        
        const footer = screen.getByTestId('card-footer');
        expect(footer).toHaveClass('justify-between');
      });

      it('defaults to start justification when not specified', () => {
        render(<CardFooter data-testid="card-footer">Default</CardFooter>);
        
        const footer = screen.getByTestId('card-footer');
        expect(footer).toHaveClass('justify-start');
      });
    });

    describe('Custom Styling', () => {
      it('applies custom className', () => {
        render(<CardFooter className="custom-footer" data-testid="card-footer">Custom</CardFooter>);
        
        const footer = screen.getByTestId('card-footer');
        expect(footer).toHaveClass('custom-footer');
      });
    });
  });

  describe('Component Integration', () => {
    it('renders complete card with all components', () => {
      render(
        <Card data-testid="complete-card">
          <CardHeader data-testid="header">
            <CardTitle data-testid="title">Complete Card</CardTitle>
            <CardDescription data-testid="description">
              This is a complete card with all components
            </CardDescription>
          </CardHeader>
          <CardContent data-testid="content">
            <p>This is the main content of the card.</p>
          </CardContent>
          <CardFooter data-testid="footer">
            <button>Action</button>
          </CardFooter>
        </Card>
      );

      const card = screen.getByTestId('complete-card');
      const header = screen.getByTestId('header');
      const title = screen.getByTestId('title');
      const description = screen.getByTestId('description');
      const content = screen.getByTestId('content');
      const footer = screen.getByTestId('footer');

      expect(card).toBeInTheDocument();
      expect(card).toContainElement(header);
      expect(card).toContainElement(content);
      expect(card).toContainElement(footer);
      expect(header).toContainElement(title);
      expect(header).toContainElement(description);
    });

    it('maintains proper semantic structure', () => {
      render(
        <Card data-testid="semantic-card">
          <CardHeader>
            <CardTitle as="h2">Semantic Title</CardTitle>
            <CardDescription>Semantic description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Semantic content</p>
          </CardContent>
          <CardFooter>
            <button>Semantic action</button>
          </CardFooter>
        </Card>
      );

      const card = screen.getByTestId('semantic-card');
      const title = screen.getByRole('heading', { level: 2 });
      const button = screen.getByRole('button');

      expect(card).toContainElement(title);
      expect(card).toContainElement(button);
    });

    it('handles multiple cards in a container', () => {
      render(
        <div data-testid="cards-container">
          <Card data-testid="card-1">
            <CardTitle>Card 1</CardTitle>
          </Card>
          <Card data-testid="card-2">
            <CardTitle>Card 2</CardTitle>
          </Card>
          <Card data-testid="card-3">
            <CardTitle>Card 3</CardTitle>
          </Card>
        </div>
      );

      const container = screen.getByTestId('cards-container');
      const cards = screen.getAllByTestId(/card-\d/);

      expect(cards).toHaveLength(3);
      cards.forEach(card => {
        expect(container).toContainElement(card);
      });
    });
  });

  describe('Performance', () => {
    it('renders multiple cards efficiently', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 50; i++) {
        const { unmount } = render(
          <Card key={i}>
            <CardHeader>
              <CardTitle>Card {i}</CardTitle>
              <CardDescription>Description {i}</CardDescription>
            </CardHeader>
            <CardContent>Content {i}</CardContent>
            <CardFooter>Footer {i}</CardFooter>
          </Card>
        );
        unmount();
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should render 50 cards in under 1 second
    });

    it('maintains consistent performance across variants', () => {
      const variants = ['default', 'elevated', 'outlined', 'filled', 'ghost'] as const;
      const timings: number[] = [];

      variants.forEach(variant => {
        const startTime = performance.now();
        
        for (let i = 0; i < 20; i++) {
          const { unmount } = render(
            <Card variant={variant} key={i}>
              <CardContent>Content {i}</CardContent>
            </Card>
          );
          unmount();
        }
        
        const endTime = performance.now();
        timings.push(endTime - startTime);
      });

      // All variants should have similar performance
      const maxTiming = Math.max(...timings);
      const minTiming = Math.min(...timings);
      expect(maxTiming - minTiming).toBeLessThan(100); // Difference should be less than 100ms
    });
  });

  describe('Accessibility', () => {
    it('maintains proper focus management for interactive cards', () => {
      render(
        <Card interactive={true} data-testid="interactive-card">
          <CardTitle>Interactive Card</CardTitle>
        </Card>
      );

      const card = screen.getByTestId('interactive-card');
      expect(card).toHaveAttribute('tabIndex', '0');
      expect(card).toHaveAttribute('role', 'button');
    });

    it('supports keyboard navigation', () => {
      const handleKeyDown = vi.fn();
      render(
        <Card interactive={true} onKeyDown={handleKeyDown} data-testid="keyboard-card">
          <CardTitle>Keyboard Card</CardTitle>
        </Card>
      );

      const card = screen.getByTestId('keyboard-card');
      fireEvent.keyDown(card, { key: 'Space' });
      expect(handleKeyDown).toHaveBeenCalled();
    });

    it('maintains proper heading hierarchy', () => {
      render(
        <div>
          <Card>
            <CardTitle as="h1">Main Title</CardTitle>
          </Card>
          <Card>
            <CardTitle as="h2">Secondary Title</CardTitle>
          </Card>
          <Card>
            <CardTitle as="h3">Tertiary Title</CardTitle>
          </Card>
        </div>
      );

      const h1 = screen.getByRole('heading', { level: 1 });
      const h2 = screen.getByRole('heading', { level: 2 });
      const h3 = screen.getByRole('heading', { level: 3 });

      expect(h1).toHaveTextContent('Main Title');
      expect(h2).toHaveTextContent('Secondary Title');
      expect(h3).toHaveTextContent('Tertiary Title');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty card gracefully', () => {
      render(<Card data-testid="empty-card" />);
      
      const card = screen.getByTestId('empty-card');
      expect(card).toBeInTheDocument();
      expect(card).toBeEmptyDOMElement();
    });

    it('handles mixed content types', () => {
      render(
        <Card data-testid="mixed-card">
          <CardTitle>Title</CardTitle>
          {null}
          <CardContent>Content</CardContent>
          {undefined}
          <CardFooter>Footer</CardFooter>
        </Card>
      );

      const card = screen.getByTestId('mixed-card');
      expect(card).toHaveTextContent('Title');
      expect(card).toHaveTextContent('Content');
      expect(card).toHaveTextContent('Footer');
    });

    it('handles very long content', () => {
      const longContent = 'A'.repeat(1000);
      render(
        <Card data-testid="long-card">
          <CardContent>{longContent}</CardContent>
        </Card>
      );

      const card = screen.getByTestId('long-card');
      expect(card).toHaveTextContent(longContent);
    });

    it('handles deeply nested content', () => {
      render(
        <Card data-testid="nested-card">
          <CardContent>
            <div>
              <div>
                <div>
                  <span>Deeply nested content</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );

      const card = screen.getByTestId('nested-card');
      expect(card).toHaveTextContent('Deeply nested content');
    });
  });
});