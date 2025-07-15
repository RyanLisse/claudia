import type { Meta, StoryObj } from '@storybook/react';
import { StatusBadge } from '../src/components/StatusBadge/StatusBadge';

const meta: Meta<typeof StatusBadge> = {
  title: 'UI Kit/StatusBadge',
  component: StatusBadge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile status badge component that displays different states with visual indicators and animations.'
      }
    }
  },
  argTypes: {
    status: {
      control: 'select',
      options: ['idle', 'busy', 'error', 'success'],
      description: 'The status state of the badge'
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'The size variant of the badge'
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply'
    },
    children: {
      control: 'text',
      description: 'Custom content to display instead of the status text'
    },
    'data-testid': {
      control: 'text',
      description: 'Test ID for testing purposes'
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof StatusBadge>;

// Basic Stories
export const Default: Story = {
  args: {
    status: 'idle'
  }
};

export const WithCustomText: Story = {
  args: {
    status: 'busy',
    children: 'Processing...'
  }
};

// Status Variants
export const StatusVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <StatusBadge status="idle" />
        <span className="text-sm text-gray-600">Idle - System is ready</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status="busy" />
        <span className="text-sm text-gray-600">Busy - Processing with animation</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status="error" />
        <span className="text-sm text-gray-600">Error - Something went wrong</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status="success" />
        <span className="text-sm text-gray-600">Success - Operation completed</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different status variants with their visual representations and typical use cases.'
      }
    }
  }
};

// Size Variants
export const SizeVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <StatusBadge status="idle" size="sm" />
        <StatusBadge status="busy" size="sm" />
        <StatusBadge status="error" size="sm" />
        <StatusBadge status="success" size="sm" />
        <span className="text-sm text-gray-600">Small size</span>
      </div>
      <div className="flex items-center gap-4">
        <StatusBadge status="idle" size="md" />
        <StatusBadge status="busy" size="md" />
        <StatusBadge status="error" size="md" />
        <StatusBadge status="success" size="md" />
        <span className="text-sm text-gray-600">Medium size (default)</span>
      </div>
      <div className="flex items-center gap-4">
        <StatusBadge status="idle" size="lg" />
        <StatusBadge status="busy" size="lg" />
        <StatusBadge status="error" size="lg" />
        <StatusBadge status="success" size="lg" />
        <span className="text-sm text-gray-600">Large size</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different size variants of the status badge component.'
      }
    }
  }
};

// Interactive Examples
export const InteractiveExamples: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">System Status Dashboard</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">API Server</span>
              <StatusBadge status="success" />
            </div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">Database</span>
              <StatusBadge status="busy">Syncing</StatusBadge>
            </div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">Cache</span>
              <StatusBadge status="error">Offline</StatusBadge>
            </div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">Queue</span>
              <StatusBadge status="idle">Ready</StatusBadge>
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Task Status List</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-2 border rounded">
            <StatusBadge status="success" size="sm" />
            <span>User authentication implemented</span>
          </div>
          <div className="flex items-center gap-3 p-2 border rounded">
            <StatusBadge status="busy" size="sm">In Progress</StatusBadge>
            <span>Database migration running</span>
          </div>
          <div className="flex items-center gap-3 p-2 border rounded">
            <StatusBadge status="error" size="sm">Failed</StatusBadge>
            <span>Email service configuration</span>
          </div>
          <div className="flex items-center gap-3 p-2 border rounded">
            <StatusBadge status="idle" size="sm">Pending</StatusBadge>
            <span>Frontend deployment</span>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Real-world examples showing how StatusBadge can be used in system dashboards and task management interfaces.'
      }
    }
  }
};

// Animation Showcase
export const AnimationShowcase: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="p-4 border rounded-lg bg-gray-50">
        <h4 className="font-semibold mb-2">Animated Busy State</h4>
        <p className="text-sm text-gray-600 mb-3">
          The busy status includes a pulsing animation to indicate ongoing activity.
        </p>
        <div className="flex items-center gap-4">
          <StatusBadge status="busy" size="sm" />
          <StatusBadge status="busy" size="md" />
          <StatusBadge status="busy" size="lg" />
        </div>
      </div>
      
      <div className="p-4 border rounded-lg">
        <h4 className="font-semibold mb-2">Static States</h4>
        <p className="text-sm text-gray-600 mb-3">
          Other status variants remain static for clear visual hierarchy.
        </p>
        <div className="flex items-center gap-4">
          <StatusBadge status="idle" />
          <StatusBadge status="error" />
          <StatusBadge status="success" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstration of the animation behavior for different status states.'
      }
    }
  }
};

// Custom Styling
export const CustomStyling: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div>
        <h4 className="font-semibold mb-2">Custom CSS Classes</h4>
        <div className="flex items-center gap-4">
          <StatusBadge status="idle" className="shadow-lg" />
          <StatusBadge status="busy" className="border-2 border-blue-500" />
          <StatusBadge status="error" className="bg-red-500 text-white border-red-500" />
          <StatusBadge status="success" className="rounded-none" />
        </div>
      </div>
      
      <div>
        <h4 className="font-semibold mb-2">Custom Content</h4>
        <div className="flex items-center gap-4">
          <StatusBadge status="idle">🟢 Online</StatusBadge>
          <StatusBadge status="busy">⚡ Processing</StatusBadge>
          <StatusBadge status="error">❌ Error</StatusBadge>
          <StatusBadge status="success">✅ Done</StatusBadge>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Examples of how to customize the StatusBadge appearance and content.'
      }
    }
  }
};

// Accessibility Features
export const AccessibilityFeatures: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="p-4 border rounded-lg bg-blue-50">
        <h4 className="font-semibold mb-2">Screen Reader Support</h4>
        <p className="text-sm text-gray-600 mb-3">
          All badges include proper ARIA labels and role attributes for screen readers.
        </p>
        <div className="flex items-center gap-4">
          <StatusBadge status="idle" />
          <StatusBadge status="busy" />
          <StatusBadge status="error" />
          <StatusBadge status="success" />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Each badge has role="status" and aria-label="Status: [status]"
        </p>
      </div>
      
      <div className="p-4 border rounded-lg bg-green-50">
        <h4 className="font-semibold mb-2">Color Contrast</h4>
        <p className="text-sm text-gray-600 mb-3">
          All status variants meet WCAG contrast requirements for accessibility.
        </p>
        <div className="flex items-center gap-4">
          <StatusBadge status="idle" />
          <StatusBadge status="busy" />
          <StatusBadge status="error" />
          <StatusBadge status="success" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Accessibility features built into the StatusBadge component including ARIA support and color contrast compliance.'
      }
    }
  }
};

// Individual Status Stories
export const Idle: Story = {
  args: {
    status: 'idle'
  }
};

export const Busy: Story = {
  args: {
    status: 'busy'
  }
};

export const Error: Story = {
  args: {
    status: 'error'
  }
};

export const Success: Story = {
  args: {
    status: 'success'
  }
};

// Size-specific stories
export const Small: Story = {
  args: {
    status: 'busy',
    size: 'sm'
  }
};

export const Medium: Story = {
  args: {
    status: 'busy',
    size: 'md'
  }
};

export const Large: Story = {
  args: {
    status: 'busy',
    size: 'lg'
  }
};

// Edge Cases
export const EdgeCases: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div>
        <h4 className="font-semibold mb-2">Empty and Null Children</h4>
        <div className="flex items-center gap-4">
          <StatusBadge status="idle">{''}</StatusBadge>
          <StatusBadge status="busy">{null}</StatusBadge>
          <StatusBadge status="error">{undefined}</StatusBadge>
          <StatusBadge status="success">0</StatusBadge>
        </div>
      </div>
      
      <div>
        <h4 className="font-semibold mb-2">Long Content</h4>
        <div className="flex items-center gap-4">
          <StatusBadge status="busy">Very Long Status Message</StatusBadge>
          <StatusBadge status="error" size="sm">This is a very long error message that might wrap</StatusBadge>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Edge cases and unusual content scenarios for the StatusBadge component.'
      }
    }
  }
};