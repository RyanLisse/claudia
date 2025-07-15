import type { Meta, StoryObj } from '@storybook/react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '../src/components/Card/Card';
import { 
  Star, 
  User, 
  Settings, 
  Clock, 
  MoreHorizontal, 
  Share2,
  Heart,
  MessageCircle,
  TrendingUp,
  Calendar,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const meta: Meta<typeof Card> = {
  title: 'UI Kit/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A flexible card component built with Class Variance Authority (CVA) for consistent variant management. Includes multiple sub-components for headers, content, and footers with comprehensive accessibility support including ARIA attributes, keyboard navigation, and WCAG 2.1 AA compliance.'
      }
    }
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
      description: 'The size variant of the card'
    },
    variant: {
      control: 'select',
      options: ['default', 'elevated', 'outlined', 'filled', 'ghost'],
      description: 'The visual variant of the card'
    },
    interactive: {
      control: 'boolean',
      description: 'Whether the card should be interactive (clickable)'
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply'
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof Card>;

// Basic Stories
export const Default: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Default Card</CardTitle>
        <CardDescription>This is a basic card with default styling.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content goes here. This is the main area for your content.</p>
      </CardContent>
      <CardFooter>
        <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Action
        </button>
      </CardFooter>
    </Card>
  )
};

export const Simple: Story = {
  render: () => (
    <Card>
      <CardContent>
        <p>A simple card with just content.</p>
      </CardContent>
    </Card>
  )
};

// Size Variants
export const SizeVariants: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
      <Card size="sm">
        <CardHeader>
          <CardTitle size="sm">Small Card</CardTitle>
          <CardDescription size="sm">Compact size variant</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm">Small card content with reduced padding.</p>
        </CardContent>
      </Card>
      
      <Card size="default">
        <CardHeader>
          <CardTitle size="default">Default Card</CardTitle>
          <CardDescription size="default">Standard size variant</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Default card content with standard padding.</p>
        </CardContent>
      </Card>
      
      <Card size="lg">
        <CardHeader>
          <CardTitle size="lg">Large Card</CardTitle>
          <CardDescription size="lg">Spacious size variant</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-lg">Large card content with generous padding.</p>
        </CardContent>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different size variants of the card component showing how padding and content spacing changes.'
      }
    }
  }
};

// Visual Variants
export const VisualVariants: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-6xl">
      <Card variant="default">
        <CardHeader>
          <CardTitle>Default</CardTitle>
          <CardDescription>Standard card appearance</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Default border and shadow styling.</p>
        </CardContent>
      </Card>
      
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Elevated</CardTitle>
          <CardDescription>Enhanced shadow for depth</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Elevated appearance with medium shadow.</p>
        </CardContent>
      </Card>
      
      <Card variant="outlined">
        <CardHeader>
          <CardTitle>Outlined</CardTitle>
          <CardDescription>Prominent border, no shadow</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Strong border with no shadow styling.</p>
        </CardContent>
      </Card>
      
      <Card variant="filled">
        <CardHeader>
          <CardTitle>Filled</CardTitle>
          <CardDescription>Muted background color</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Filled background with subtle styling.</p>
        </CardContent>
      </Card>
      
      <Card variant="ghost">
        <CardHeader>
          <CardTitle>Ghost</CardTitle>
          <CardDescription>Minimal transparent styling</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Transparent background with no borders.</p>
        </CardContent>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different visual variants of the card component showing various styling approaches.'
      }
    }
  }
};

// Interactive Cards
export const InteractiveCards: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
      <Card interactive={true} className="cursor-pointer">
        <CardHeader>
          <CardTitle>Interactive Card</CardTitle>
          <CardDescription>Click me to see hover effects</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This card responds to hover and focus states.</p>
        </CardContent>
      </Card>
      
      <Card interactive={false}>
        <CardHeader>
          <CardTitle>Static Card</CardTitle>
          <CardDescription>Non-interactive card</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This card does not respond to interactions.</p>
        </CardContent>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison between interactive and static card behaviors, including hover and focus states.'
      }
    }
  }
};

// Header Alignments
export const HeaderAlignments: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
      <Card>
        <CardHeader align="start">
          <CardTitle>Left Aligned</CardTitle>
          <CardDescription>Header content aligned to the left</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Content below left-aligned header.</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader align="center">
          <CardTitle>Center Aligned</CardTitle>
          <CardDescription>Header content centered</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Content below centered header.</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader align="end">
          <CardTitle>Right Aligned</CardTitle>
          <CardDescription>Header content aligned to the right</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Content below right-aligned header.</p>
        </CardContent>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different alignment options for card headers.'
      }
    }
  }
};

// Title Semantic Elements
export const TitleSemanticElements: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle as="h1">H1 Title</CardTitle>
          <CardDescription>Main page title</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card with h1 heading for main titles.</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle as="h2">H2 Title</CardTitle>
          <CardDescription>Section title</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card with h2 heading for section titles.</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle as="h3">H3 Title</CardTitle>
          <CardDescription>Subsection title (default)</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card with h3 heading (default semantic level).</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle as="h4">H4 Title</CardTitle>
          <CardDescription>Minor heading</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card with h4 heading for minor sections.</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle as="h5">H5 Title</CardTitle>
          <CardDescription>Sub-minor heading</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card with h5 heading for sub-sections.</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle as="h6">H6 Title</CardTitle>
          <CardDescription>Smallest heading</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card with h6 heading for smallest sections.</p>
        </CardContent>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different semantic heading levels for card titles, important for accessibility and SEO.'
      }
    }
  }
};

// Footer Justification
export const FooterJustification: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Start Justified</CardTitle>
          <CardDescription>Footer content aligned to the left</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card content with start-justified footer.</p>
        </CardContent>
        <CardFooter justify="start">
          <button className="px-4 py-2 bg-blue-500 text-white rounded">Left</button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Center Justified</CardTitle>
          <CardDescription>Footer content centered</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card content with center-justified footer.</p>
        </CardContent>
        <CardFooter justify="center">
          <button className="px-4 py-2 bg-green-500 text-white rounded">Center</button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>End Justified</CardTitle>
          <CardDescription>Footer content aligned to the right</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card content with end-justified footer.</p>
        </CardContent>
        <CardFooter justify="end">
          <button className="px-4 py-2 bg-red-500 text-white rounded">Right</button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Space Between</CardTitle>
          <CardDescription>Footer content with space between</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card content with space-between footer.</p>
        </CardContent>
        <CardFooter justify="between">
          <button className="px-4 py-2 bg-gray-500 text-white rounded">Cancel</button>
          <button className="px-4 py-2 bg-blue-500 text-white rounded">Save</button>
        </CardFooter>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different justification options for card footers, useful for action buttons and controls.'
      }
    }
  }
};

// Real-world Examples
export const RealWorldExamples: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
      {/* User Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>John Doe</CardTitle>
          <CardDescription>Software Engineer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
              JD
            </div>
            <div>
              <p className="text-sm">john.doe@example.com</p>
              <p className="text-xs text-gray-600">Joined 2 years ago</p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <button className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            View Profile
          </button>
        </CardFooter>
      </Card>
      
      {/* Product Card */}
      <Card variant="elevated">
        <CardContent>
          <div className="w-full h-32 bg-gray-200 rounded mb-4 flex items-center justify-center">
            <span className="text-gray-500">Product Image</span>
          </div>
          <CardTitle size="sm">Wireless Headphones</CardTitle>
          <CardDescription>Premium noise-cancelling headphones</CardDescription>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-2xl font-bold">$299</span>
            <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
              Add to Cart
            </button>
          </div>
        </CardContent>
      </Card>
      
      {/* Stats Card */}
      <Card variant="outlined">
        <CardHeader align="center">
          <CardTitle>Monthly Revenue</CardTitle>
          <CardDescription>January 2024</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">$42,350</div>
            <div className="text-sm text-gray-600 mt-1">
              <span className="text-green-600">↑ 12%</span> from last month
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Article Card */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle as="h2">Getting Started with React</CardTitle>
          <CardDescription>
            Learn the fundamentals of React development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 mb-4">
            React is a popular JavaScript library for building user interfaces. In this comprehensive guide, 
            we'll explore the core concepts and best practices for getting started with React development.
          </p>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>By Jane Smith</span>
            <span>•</span>
            <span>5 min read</span>
            <span>•</span>
            <span>Jan 15, 2024</span>
          </div>
        </CardContent>
        <CardFooter justify="between">
          <div className="flex space-x-2">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">React</span>
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">JavaScript</span>
            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">Tutorial</span>
          </div>
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Read More
          </button>
        </CardFooter>
      </Card>
      
      {/* Notification Card */}
      <Card variant="filled">
        <CardHeader>
          <CardTitle size="sm">System Update</CardTitle>
          <CardDescription size="sm">New features available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm">A new version is available with performance improvements and bug fixes.</p>
        </CardContent>
        <CardFooter justify="end">
          <button className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">
            Update Now
          </button>
        </CardFooter>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Real-world examples showing how cards can be used for user profiles, products, statistics, articles, and notifications.'
      }
    }
  }
};

// Responsive Layout
export const ResponsiveLayout: Story = {
  render: () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
      {Array.from({ length: 8 }, (_, i) => (
        <Card key={i} size="sm">
          <CardHeader>
            <CardTitle size="sm">Card {i + 1}</CardTitle>
            <CardDescription size="sm">Responsive card layout</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">This card adapts to different screen sizes.</p>
          </CardContent>
        </Card>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Responsive grid layout showing how cards adapt to different screen sizes.'
      }
    }
  }
};

// Accessibility Features
export const AccessibilityFeatures: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
      <Card interactive={true}>
        <CardHeader>
          <CardTitle as="h2">Accessible Interactive Card</CardTitle>
          <CardDescription>
            This card demonstrates accessibility features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="text-sm space-y-1">
            <li>• Proper heading hierarchy (h2)</li>
            <li>• Keyboard navigation support</li>
            <li>• ARIA attributes for screen readers</li>
            <li>• Focus indicators</li>
          </ul>
        </CardContent>
        <CardFooter>
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            Accessible Button
          </button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle as="h3">Semantic Structure</CardTitle>
          <CardDescription>
            Proper semantic HTML structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-2">
            This card uses semantic HTML elements:
          </p>
          <ul className="text-sm space-y-1">
            <li>• Heading elements (h1-h6)</li>
            <li>• Paragraph elements</li>
            <li>• Proper nesting structure</li>
            <li>• Meaningful content hierarchy</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Accessibility features including proper heading hierarchy, keyboard navigation, and semantic HTML.'
      }
    }
  }
};

// Individual Component Stories
export const JustCard: Story = {
  render: () => (
    <Card>
      <p>Just a card with content</p>
    </Card>
  )
};

export const JustHeader: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Just Header</CardTitle>
        <CardDescription>Card with only header content</CardDescription>
      </CardHeader>
    </Card>
  )
};

export const JustContent: Story = {
  render: () => (
    <Card>
      <CardContent>
        <p>Just content in a card</p>
      </CardContent>
    </Card>
  )
};

export const JustFooter: Story = {
  render: () => (
    <Card>
      <CardFooter>
        <button className="px-4 py-2 bg-blue-500 text-white rounded">
          Just Footer
        </button>
      </CardFooter>
    </Card>
  )
};

// Advanced Real-world Examples
export const SocialMediaCard: Story = {
  render: () => (
    <Card className="max-w-md">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle size="sm">Sarah Johnson</CardTitle>
            <CardDescription size="sm">@sarahj • 2 hours ago</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-800 mb-3">
          Just shipped our new design system! 🚀 The team has been working hard on this for months. 
          Excited to see how it improves our development workflow.
        </p>
        <div className="w-full h-32 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center mb-3">
          <span className="text-gray-500">Design System Preview</span>
        </div>
      </CardContent>
      <CardFooter justify="between">
        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors">
            <Heart className="w-4 h-4" />
            <span className="text-sm">24</span>
          </button>
          <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors">
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">8</span>
          </button>
          <button className="flex items-center space-x-1 text-gray-500 hover:text-green-500 transition-colors">
            <Share2 className="w-4 h-4" />
            <span className="text-sm">Share</span>
          </button>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A social media post card with user avatar, content, image, and interaction buttons.'
      }
    }
  }
};

export const DashboardMetricCard: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      <Card variant="elevated">
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <CardDescription size="sm">Total Users</CardDescription>
              <CardTitle size="lg">12,847</CardTitle>
            </div>
            <div className="p-2 bg-blue-100 rounded-full">
              <User className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-500">+12.5%</span>
            <span className="text-gray-500 ml-1">from last month</span>
          </div>
        </CardContent>
      </Card>
      
      <Card variant="elevated">
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <CardDescription size="sm">Revenue</CardDescription>
              <CardTitle size="lg">$89,432</CardTitle>
            </div>
            <div className="p-2 bg-green-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-500">+8.2%</span>
            <span className="text-gray-500 ml-1">from last month</span>
          </div>
        </CardContent>
      </Card>
      
      <Card variant="elevated">
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <CardDescription size="sm">Active Sessions</CardDescription>
              <CardTitle size="lg">3,247</CardTitle>
            </div>
            <div className="p-2 bg-purple-100 rounded-full">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-500">+5.7%</span>
            <span className="text-gray-500 ml-1">from last hour</span>
          </div>
        </CardContent>
      </Card>
      
      <Card variant="elevated">
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <CardDescription size="sm">Conversion Rate</CardDescription>
              <CardTitle size="lg">24.6%</CardTitle>
            </div>
            <div className="p-2 bg-orange-100 rounded-full">
              <Star className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-500">+2.1%</span>
            <span className="text-gray-500 ml-1">from last week</span>
          </div>
        </CardContent>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Dashboard metric cards showing key performance indicators with icons and trend information.'
      }
    }
  }
};

export const TaskManagementCard: Story = {
  render: () => (
    <div className="max-w-md">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle size="sm">Design System Implementation</CardTitle>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span className="text-xs text-gray-500">In Progress</span>
            </div>
          </div>
          <CardDescription size="sm">
            Create comprehensive component library with Storybook
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm line-through text-gray-500">Set up project structure</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm line-through text-gray-500">Create base components</span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <span className="text-sm">Add Storybook documentation</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-gray-300 rounded"></div>
              <span className="text-sm text-gray-500">Write comprehensive tests</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Progress</span>
              <span className="text-xs text-gray-500">65%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '65%' }}></div>
            </div>
          </div>
        </CardContent>
        <CardFooter justify="between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white">JS</span>
            </div>
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white">MK</span>
            </div>
          </div>
          <div className="flex items-center space-x-1 text-gray-500">
            <Calendar className="w-4 h-4" />
            <span className="text-xs">Due: Dec 15</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A task management card with progress indicators, assignees, and due dates.'
      }
    }
  }
};

export const SettingsCard: Story = {
  render: () => (
    <Card className="max-w-md">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-gray-600" />
          <CardTitle size="sm">Notification Settings</CardTitle>
        </div>
        <CardDescription size="sm">
          Manage how you receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">Email Notifications</div>
              <div className="text-xs text-gray-500">Receive updates via email</div>
            </div>
            <button className="relative inline-flex h-5 w-9 items-center rounded-full bg-blue-500 transition-colors">
              <span className="inline-block h-3 w-3 transform rounded-full bg-white transition-transform translate-x-5"></span>
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">Push Notifications</div>
              <div className="text-xs text-gray-500">Browser notifications</div>
            </div>
            <button className="relative inline-flex h-5 w-9 items-center rounded-full bg-gray-300 transition-colors">
              <span className="inline-block h-3 w-3 transform rounded-full bg-white transition-transform translate-x-1"></span>
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">SMS Notifications</div>
              <div className="text-xs text-gray-500">Text message alerts</div>
            </div>
            <button className="relative inline-flex h-5 w-9 items-center rounded-full bg-blue-500 transition-colors">
              <span className="inline-block h-3 w-3 transform rounded-full bg-white transition-transform translate-x-5"></span>
            </button>
          </div>
        </div>
      </CardContent>
      <CardFooter justify="end">
        <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
          Save Changes
        </button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A settings card with toggle switches and save functionality.'
      }
    }
  }
};

export const LoadingStatesCard: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle size="sm">Loading Content</CardTitle>
          <CardDescription size="sm">Skeleton loading state</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="h-8 bg-gray-200 rounded animate-pulse w-20"></div>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle size="sm">Loading Complete</CardTitle>
          <CardDescription size="sm">Content loaded successfully</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">
            This card shows how content appears after loading is complete. 
            The skeleton states help provide better user experience during loading.
          </p>
        </CardContent>
        <CardFooter>
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Action
          </button>
        </CardFooter>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstration of loading states using skeleton placeholders.'
      }
    }
  }
};

export const ErrorStateCard: Story = {
  render: () => (
    <Card variant="outlined" className="max-w-md border-red-200">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <CardTitle size="sm" className="text-red-700">Error Loading Data</CardTitle>
        </div>
        <CardDescription size="sm" className="text-red-600">
          Unable to fetch the requested information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-red-50 p-3 rounded border border-red-100">
          <p className="text-sm text-red-700">
            The server is currently unavailable. Please check your connection and try again.
          </p>
        </div>
      </CardContent>
      <CardFooter justify="end">
        <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
          Retry
        </button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Error state card with appropriate styling and retry action.'
      }
    }
  }
};

export const PerformanceOptimizedCard: Story = {
  render: () => (
    <div className="space-y-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle size="sm">Performance Optimization</CardTitle>
          <CardDescription size="sm">
            This card demonstrates performance best practices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Lazy loading for images and heavy content</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Memoized components to prevent unnecessary re-renders</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Efficient CSS classes using CVA</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Proper key props for list items</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Accessible markup with proper ARIA attributes</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium mb-2">Performance Metrics:</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Bundle Size:</span>
            <span className="font-mono ml-2">2.3KB gzipped</span>
          </div>
          <div>
            <span className="text-gray-600">Render Time:</span>
            <span className="font-mono ml-2">&lt;1ms</span>
          </div>
          <div>
            <span className="text-gray-600">Accessibility:</span>
            <span className="font-mono ml-2">100% WCAG AA</span>
          </div>
          <div>
            <span className="text-gray-600">Test Coverage:</span>
            <span className="font-mono ml-2">95%+</span>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Performance-optimized card example showing best practices and metrics.'
      }
    }
  }
};