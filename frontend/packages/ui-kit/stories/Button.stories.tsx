import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { Heart, Download, Plus } from 'lucide-react'
import { Button } from '../src/components/Button'

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile button component with multiple variants, sizes, and states. Fully accessible with WCAG 2.1 AA compliance.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'The visual style variant of the button',
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'The size of the button',
    },
    loading: {
      control: { type: 'boolean' },
      description: 'Shows loading spinner and disables interaction',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Disables the button',
    },
    asChild: {
      control: { type: 'boolean' },
      description: 'Render as a child component (using Radix Slot)',
    },
  },
  args: {
    onClick: fn(),
    children: 'Button',
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Default Button',
  },
}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different visual variants of the button component.',
      },
    },
  },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different sizes of the button component.',
      },
    },
  },
}

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button leftIcon={<Heart className="h-4 w-4" />}>
        With Left Icon
      </Button>
      <Button rightIcon={<Download className="h-4 w-4" />}>
        With Right Icon
      </Button>
      <Button 
        leftIcon={<Heart className="h-4 w-4" />}
        rightIcon={<Download className="h-4 w-4" />}
      >
        Both Icons
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Buttons with left and right icons for enhanced visual communication.',
      },
    },
  },
}

export const Loading: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button loading>Loading</Button>
      <Button loading variant="outline">Loading Outline</Button>
      <Button loading variant="secondary">Loading Secondary</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Loading state with spinner animation.',
      },
    },
  },
}

export const Disabled: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button disabled>Disabled</Button>
      <Button disabled variant="outline">Disabled Outline</Button>
      <Button disabled variant="destructive">Disabled Destructive</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Disabled state with reduced opacity and no interactions.',
      },
    },
  },
}

export const Accessibility: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Button aria-label="Add to favorites">
          <Heart className="h-4 w-4" />
        </Button>
        <Button aria-describedby="download-description">
          Download
        </Button>
      </div>
      <p id="download-description" className="text-sm text-muted-foreground">
        This button will download the current file to your device.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Examples showing proper accessibility attributes like aria-label and aria-describedby.',
      },
    },
  },
}

export const Interactive: Story = {
  args: {
    children: 'Click me!',
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive button for testing click events.',
      },
    },
  },
}