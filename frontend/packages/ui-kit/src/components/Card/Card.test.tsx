import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';

describe('Card', () => {
  describe('Basic rendering', () => {
    it('renders correctly', () => {
      render(<Card data-testid="card">Card content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveTextContent('Card content');
    });

    it('applies custom className', () => {
      render(<Card className="custom-class" data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-class');
    });

    it('forwards ref correctly', () => {
      const ref = vi.fn();
      render(<Card ref={ref}>Content</Card>);
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLDivElement));
    });
  });

  describe('Variants', () => {
    it('renders default variant', () => {
      render(<Card data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('border-border');
    });

    it('renders elevated variant', () => {
      render(<Card variant="elevated" data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('shadow-md');
    });

    it('renders outlined variant', () => {
      render(<Card variant="outlined" data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('border-2', 'shadow-none');
    });

    it('renders filled variant', () => {
      render(<Card variant="filled" data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('bg-muted');
    });

    it('renders ghost variant', () => {
      render(<Card variant="ghost" data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('bg-transparent', 'border-transparent', 'shadow-none');
    });
  });

  describe('Sizes', () => {
    it('renders small size', () => {
      render(<Card size="sm" data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('p-4');
    });

    it('renders default size', () => {
      render(<Card data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('p-6');
    });

    it('renders large size', () => {
      render(<Card size="lg" data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('p-8');
    });
  });

  describe('Interactive behavior', () => {
    it('renders as non-interactive by default', () => {
      render(<Card data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).not.toHaveAttribute('role');
      expect(card).not.toHaveAttribute('tabindex');
      expect(card).not.toHaveClass('cursor-pointer');
    });

    it('renders as interactive when specified', () => {
      render(<Card interactive data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('role', 'button');
      expect(card).toHaveAttribute('tabIndex', '0');
      expect(card).toHaveAttribute('aria-pressed', 'false');
      expect(card).toHaveClass('cursor-pointer');
    });

    it('handles click events when interactive', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(
        <Card interactive onClick={handleClick} data-testid="card">
          Content
        </Card>
      );
      
      const card = screen.getByTestId('card');
      await user.click(card);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles keyboard events when interactive', async () => {
      const user = userEvent.setup();
      const handleKeyDown = vi.fn();
      
      render(
        <Card interactive onKeyDown={handleKeyDown} data-testid="card">
          Content
        </Card>
      );
      
      const card = screen.getByTestId('card');
      card.focus();
      await user.keyboard('{Enter}');
      expect(handleKeyDown).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes when interactive', () => {
      render(<Card interactive data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('role', 'button');
      expect(card).toHaveAttribute('tabIndex', '0');
      expect(card).toHaveAttribute('aria-pressed', 'false');
    });

    it('is focusable when interactive', () => {
      render(<Card interactive data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      card.focus();
      expect(card).toHaveFocus();
    });

    it('supports custom aria attributes', () => {
      render(
        <Card 
          interactive 
          aria-label="Custom card" 
          aria-describedby="description" 
          data-testid="card"
        >
          Content
        </Card>
      );
      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('aria-label', 'Custom card');
      expect(card).toHaveAttribute('aria-describedby', 'description');
    });
  });
});

describe('CardHeader', () => {
  it('renders correctly', () => {
    render(<CardHeader data-testid="header">Header content</CardHeader>);
    const header = screen.getByTestId('header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveTextContent('Header content');
  });

  it('applies alignment variants', () => {
    render(<CardHeader align="center" data-testid="header">Content</CardHeader>);
    const header = screen.getByTestId('header');
    expect(header).toHaveClass('items-center');
  });

  it('renders with default start alignment', () => {
    render(<CardHeader data-testid="header">Content</CardHeader>);
    const header = screen.getByTestId('header');
    expect(header).toHaveClass('items-start');
  });
});

describe('CardTitle', () => {
  it('renders as h3 by default', () => {
    render(<CardTitle>Title</CardTitle>);
    const title = screen.getByRole('heading', { level: 3 });
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent('Title');
  });

  it('renders with custom heading level', () => {
    render(<CardTitle as="h1">Title</CardTitle>);
    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toBeInTheDocument();
  });

  it('applies size variants', () => {
    render(<CardTitle size="lg" data-testid="title">Title</CardTitle>);
    const title = screen.getByTestId('title');
    expect(title).toHaveClass('text-3xl');
  });

  it('applies default size', () => {
    render(<CardTitle data-testid="title">Title</CardTitle>);
    const title = screen.getByTestId('title');
    expect(title).toHaveClass('text-2xl');
  });
});

describe('CardDescription', () => {
  it('renders correctly', () => {
    render(<CardDescription>Description text</CardDescription>);
    const description = screen.getByText('Description text');
    expect(description).toBeInTheDocument();
    expect(description.tagName).toBe('P');
  });

  it('applies size variants', () => {
    render(<CardDescription size="lg" data-testid="description">Description</CardDescription>);
    const description = screen.getByTestId('description');
    expect(description).toHaveClass('text-base');
  });

  it('applies default styling', () => {
    render(<CardDescription data-testid="description">Description</CardDescription>);
    const description = screen.getByTestId('description');
    expect(description).toHaveClass('text-muted-foreground', 'text-sm');
  });
});

describe('CardContent', () => {
  it('renders correctly', () => {
    render(<CardContent data-testid="content">Content</CardContent>);
    const content = screen.getByTestId('content');
    expect(content).toBeInTheDocument();
    expect(content).toHaveTextContent('Content');
  });

  it('applies default styling', () => {
    render(<CardContent data-testid="content">Content</CardContent>);
    const content = screen.getByTestId('content');
    expect(content).toHaveClass('pt-0');
  });
});

describe('CardFooter', () => {
  it('renders correctly', () => {
    render(<CardFooter data-testid="footer">Footer content</CardFooter>);
    const footer = screen.getByTestId('footer');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveTextContent('Footer content');
  });

  it('applies justify variants', () => {
    render(<CardFooter justify="center" data-testid="footer">Footer</CardFooter>);
    const footer = screen.getByTestId('footer');
    expect(footer).toHaveClass('justify-center');
  });

  it('applies default justify', () => {
    render(<CardFooter data-testid="footer">Footer</CardFooter>);
    const footer = screen.getByTestId('footer');
    expect(footer).toHaveClass('justify-start');
  });
});

describe('Card composition', () => {
  it('renders complete card structure', () => {
    render(
      <Card data-testid="card">
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card content goes here</p>
        </CardContent>
        <CardFooter>
          <button>Action</button>
        </CardFooter>
      </Card>
    );

    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card description')).toBeInTheDocument();
    expect(screen.getByText('Card content goes here')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('maintains semantic structure', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle as="h2">Main Title</CardTitle>
          <CardDescription>Supporting text</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Main content</p>
        </CardContent>
        <CardFooter>
          <button>Primary</button>
          <button>Secondary</button>
        </CardFooter>
      </Card>
    );

    const title = screen.getByRole('heading', { level: 2 });
    expect(title).toHaveTextContent('Main Title');
    
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveTextContent('Primary');
    expect(buttons[1]).toHaveTextContent('Secondary');
  });
});