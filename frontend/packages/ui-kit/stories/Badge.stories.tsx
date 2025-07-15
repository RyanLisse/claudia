import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { Star, User, Check, Clock } from 'lucide-react'
import { Badge } from '../src/components/Badge'

const meta = {
  title: 'Components/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Display status, labels, or small pieces of information with visual emphasis.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'secondary', 'destructive', 'success', 'warning', 'outline', 'ghost'],
      description: 'The visual style variant of the badge',
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg'],
      description: 'The size of the badge',
    },
    removable: {
      control: { type: 'boolean' },
      description: 'Whether the badge can be removed',
    },
  },
  args: {
    onRemove: fn(),
    children: 'Badge',
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Default',
  },
}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="ghost">Ghost</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different visual variants of badges for various use cases.',
      },
    },
  },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Badge size="sm">Small</Badge>
      <Badge size="default">Default</Badge>
      <Badge size="lg">Large</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different sizes of badges.',
      },
    },
  },
}

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="success" icon={<Check className="h-3 w-3" />}>
        Completed
      </Badge>
      <Badge variant="warning" icon={<Clock className="h-3 w-3" />}>
        Pending
      </Badge>
      <Badge variant="default" icon={<Star className="h-3 w-3" />}>
        Featured
      </Badge>
      <Badge variant="secondary" icon={<User className="h-3 w-3" />}>
        Admin
      </Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Badges with icons for enhanced visual communication.',
      },
    },
  },
}

export const Removable: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge removable variant="default">
        JavaScript
      </Badge>
      <Badge removable variant="secondary">
        React
      </Badge>
      <Badge removable variant="outline">
        TypeScript
      </Badge>
      <Badge removable variant="success">
        Node.js
      </Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Removable badges with close buttons.',
      },
    },
  },
}

export const StatusBadges: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-2">Order Status</h4>
        <div className="flex gap-2">
          <Badge variant="warning" icon={<Clock className="h-3 w-3" />}>
            Processing
          </Badge>
          <Badge variant="info" icon={<Clock className="h-3 w-3" />}>
            Shipped
          </Badge>
          <Badge variant="success" icon={<Check className="h-3 w-3" />}>
            Delivered
          </Badge>
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-medium mb-2">User Roles</h4>
        <div className="flex gap-2">
          <Badge variant="destructive">Admin</Badge>
          <Badge variant="secondary">Moderator</Badge>
          <Badge variant="outline">User</Badge>
          <Badge variant="ghost">Guest</Badge>
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-medium mb-2">Priority Levels</h4>
        <div className="flex gap-2">
          <Badge variant="destructive">Critical</Badge>
          <Badge variant="warning">High</Badge>
          <Badge variant="default">Medium</Badge>
          <Badge variant="secondary">Low</Badge>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Examples of badges used for different status indicators.',
      },
    },
  },
}

export const InteractiveBadges: Story = {
  render: () => {
    const tags = ['React', 'TypeScript', 'JavaScript', 'Node.js', 'CSS']
    
    return (
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Tech Stack</h4>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge 
                key={tag}
                removable 
                variant="outline"
                onRemove={() => console.log(`Removed ${tag}`)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-2">Notifications</h4>
          <div className="flex gap-2">
            <Badge 
              variant="destructive" 
              className="cursor-pointer hover:bg-red-600 transition-colors"
              onClick={() => console.log('Clicked error badge')}
            >
              3 Errors
            </Badge>
            <Badge 
              variant="warning"
              className="cursor-pointer hover:bg-yellow-600 transition-colors"
              onClick={() => console.log('Clicked warning badge')}
            >
              5 Warnings
            </Badge>
          </div>
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive badges that respond to user actions.',
      },
    },
  },
}