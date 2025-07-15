import type { Meta, StoryObj } from '@storybook/react';
import { LoadingSpinner } from '../src/components/LoadingSpinner';

const meta: Meta<typeof LoadingSpinner> = {
  title: 'UI Kit/LoadingSpinner',
  component: LoadingSpinner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A customizable loading spinner component built with CSS animations for smooth performance. Features multiple sizes and accessibility support with proper ARIA attributes and semantic HTML roles for screen readers and WCAG 2.1 AA compliance.'
      }
    }
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'The size of the loading spinner'
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply'
    },
    'data-testid': {
      control: 'text',
      description: 'Test ID for testing purposes'
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof LoadingSpinner>;

// Basic Stories
export const Default: Story = {};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner size="sm" />
        <span className="text-sm text-gray-600">Small</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner size="md" />
        <span className="text-sm text-gray-600">Medium</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner size="lg" />
        <span className="text-sm text-gray-600">Large</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different sizes of the loading spinner component.'
      }
    }
  }
};

export const CustomColors: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner 
          size="md" 
          className="border-gray-300 border-t-blue-600" 
        />
        <span className="text-sm text-gray-600">Default Blue</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner 
          size="md" 
          className="border-gray-300 border-t-green-600" 
        />
        <span className="text-sm text-gray-600">Green</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner 
          size="md" 
          className="border-gray-300 border-t-red-600" 
        />
        <span className="text-sm text-gray-600">Red</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner 
          size="md" 
          className="border-gray-300 border-t-purple-600" 
        />
        <span className="text-sm text-gray-600">Purple</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Loading spinners with different color themes using custom className.'
      }
    }
  }
};

export const InlineWithText: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <LoadingSpinner size="sm" />
        <span>Loading...</span>
      </div>
      <div className="flex items-center gap-2">
        <LoadingSpinner size="sm" className="border-gray-300 border-t-green-600" />
        <span>Saving changes...</span>
      </div>
      <div className="flex items-center gap-2">
        <LoadingSpinner size="sm" className="border-gray-300 border-t-red-600" />
        <span>Processing...</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Loading spinners used inline with text for contextual loading states.'
      }
    }
  }
};

export const ButtonLoadingStates: Story = {
  render: () => (
    <div className="flex gap-4">
      <button 
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
        disabled
      >
        <LoadingSpinner size="sm" className="border-blue-200 border-t-white" />
        Loading...
      </button>
      <button 
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md disabled:opacity-50"
        disabled
      >
        <LoadingSpinner size="sm" className="border-green-200 border-t-white" />
        Saving...
      </button>
      <button 
        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md disabled:opacity-50"
        disabled
      >
        <LoadingSpinner size="sm" className="border-red-200 border-t-white" />
        Deleting...
      </button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Loading spinners integrated into buttons for async action states.'
      }
    }
  }
};

export const CardLoadingStates: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
      <div className="border rounded-lg p-6 bg-white shadow-sm">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <LoadingSpinner size="md" className="mb-2 mx-auto" />
            <p className="text-sm text-gray-600">Loading content...</p>
          </div>
        </div>
      </div>
      <div className="border rounded-lg p-6 bg-white shadow-sm">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mb-2 mx-auto border-gray-300 border-t-green-600" />
            <p className="text-sm text-gray-600">Fetching data...</p>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Loading spinners used in card components for content loading states.'
      }
    }
  }
};

export const OverlayLoadingStates: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="relative border rounded-lg p-6 bg-white shadow-sm">
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="md" className="mb-2 mx-auto" />
            <p className="text-sm text-gray-600">Loading...</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
        </div>
      </div>
      <div className="relative border rounded-lg p-6 bg-white shadow-sm">
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mb-2 mx-auto border-white/30 border-t-white" />
            <p className="text-sm text-white">Processing...</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Loading spinners used as overlays on top of content during loading states.'
      }
    }
  }
};

export const ResponsiveSpinners: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center gap-2">
          <LoadingSpinner size="sm" className="sm:hidden" />
          <LoadingSpinner size="md" className="hidden sm:block" />
          <span>Responsive spinner</span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4 text-center">
          <LoadingSpinner size="sm" className="mb-2 mx-auto sm:hidden" />
          <LoadingSpinner size="md" className="mb-2 mx-auto hidden sm:block lg:hidden" />
          <LoadingSpinner size="lg" className="mb-2 mx-auto hidden lg:block" />
          <p className="text-sm text-gray-600">Mobile: sm, Tablet: md, Desktop: lg</p>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <LoadingSpinner size="md" className="mb-2 mx-auto" />
          <p className="text-sm text-gray-600">Fixed medium size</p>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <LoadingSpinner size="lg" className="mb-2 mx-auto" />
          <p className="text-sm text-gray-600">Fixed large size</p>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Loading spinners that adapt to different screen sizes using responsive design principles.'
      }
    }
  }
};

export const AccessibilityDemo: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Accessibility Features</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <LoadingSpinner 
              size="md" 
              data-testid="accessible-spinner"
            />
            <div>
              <p className="font-medium">Proper ARIA attributes</p>
              <p className="text-sm text-gray-600">
                Includes role="status" and aria-label="Loading" for screen readers
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LoadingSpinner size="md" />
            <div>
              <p className="font-medium">Semantic HTML</p>
              <p className="text-sm text-gray-600">
                Uses proper div element with appropriate roles
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LoadingSpinner size="md" />
            <div>
              <p className="font-medium">Keyboard navigation</p>
              <p className="text-sm text-gray-600">
                Doesn't interfere with keyboard navigation flow
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates accessibility features including ARIA attributes, semantic HTML, and screen reader support.'
      }
    }
  }
};

export const PerformanceOptimized: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Features</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <LoadingSpinner 
              size="md" 
              className="will-change-transform"
            />
            <div>
              <p className="font-medium">CSS Animation</p>
              <p className="text-sm text-gray-600">
                Uses CSS animations for smooth, hardware-accelerated spinning
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LoadingSpinner size="md" />
            <div>
              <p className="font-medium">Minimal DOM impact</p>
              <p className="text-sm text-gray-600">
                Lightweight component with minimal DOM footprint
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LoadingSpinner size="md" />
            <div>
              <p className="font-medium">Efficient rendering</p>
              <p className="text-sm text-gray-600">
                Optimized for high-frequency updates and re-renders
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Performance-optimized loading spinner with CSS animations and minimal DOM impact.'
      }
    }
  }
};

export const ThemeVariations: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border rounded-lg text-center">
          <LoadingSpinner size="md" className="mb-2 mx-auto border-gray-300 border-t-blue-600" />
          <p className="text-sm text-gray-600">Light Theme</p>
        </div>
        <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg text-center">
          <LoadingSpinner size="md" className="mb-2 mx-auto border-gray-600 border-t-blue-400" />
          <p className="text-sm text-gray-300">Dark Theme</p>
        </div>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <LoadingSpinner size="md" className="mb-2 mx-auto border-blue-200 border-t-blue-600" />
          <p className="text-sm text-blue-600">Blue Theme</p>
        </div>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
          <LoadingSpinner size="md" className="mb-2 mx-auto border-green-200 border-t-green-600" />
          <p className="text-sm text-green-600">Green Theme</p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
          <LoadingSpinner size="md" className="mb-2 mx-auto border-red-200 border-t-red-600" />
          <p className="text-sm text-red-600">Red Theme</p>
        </div>
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-center">
          <LoadingSpinner size="md" className="mb-2 mx-auto border-purple-200 border-t-purple-600" />
          <p className="text-sm text-purple-600">Purple Theme</p>
        </div>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
          <LoadingSpinner size="md" className="mb-2 mx-auto border-yellow-200 border-t-yellow-600" />
          <p className="text-sm text-yellow-600">Yellow Theme</p>
        </div>
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg text-center">
          <LoadingSpinner size="md" className="mb-2 mx-auto border-indigo-200 border-t-indigo-600" />
          <p className="text-sm text-indigo-600">Indigo Theme</p>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Loading spinners with different theme variations for various design contexts.'
      }
    }
  }
};