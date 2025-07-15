import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../src/components/Modal';
import { Button } from '../src/components/Button';

const meta = {
  title: 'Components/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A flexible modal component built on top of Radix UI Dialog. Supports various sizes, accessibility features, and customization options.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl'],
      description: 'The size of the modal',
    },
    isOpen: {
      control: { type: 'boolean' },
      description: 'Whether the modal is open',
    },
    showCloseButton: {
      control: { type: 'boolean' },
      description: 'Whether to show the close button',
    },
    closeOnOverlayClick: {
      control: { type: 'boolean' },
      description: 'Whether to close when clicking outside',
    },
    closeOnEscape: {
      control: { type: 'boolean' },
      description: 'Whether to close when pressing Escape',
    },
  },
  args: {
    onClose: fn(),
    title: 'Modal Title',
    description: 'This is a modal description',
    children: 'Modal content goes here',
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

// Helper component for interactive stories
const ModalDemo = ({ size = 'lg', ...props }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        size={size}
        {...props}
      >
        {props.children}
      </Modal>
    </div>
  );
};

export const Default: Story = {
  render: (args) => <ModalDemo {...args} />,
};

export const WithComposition: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
      <div>
        <Button onClick={() => setIsOpen(true)}>Open Composed Modal</Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Confirmation"
          description="Are you sure you want to delete this item?"
        >
          <ModalHeader>
            <h2 className="text-lg font-semibold">Custom Header</h2>
            <p className="text-sm text-muted-foreground">
              This is a custom header with additional content.
            </p>
          </ModalHeader>
          <ModalBody>
            <p className="text-sm">
              This action cannot be undone. This will permanently delete the item
              and remove all associated data.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => setIsOpen(false)}>
              Delete
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Modal with composition components for better structure and styling.',
      },
    },
  },
};

export const Sizes: Story = {
  render: () => {
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const sizes = ['sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const;
    
    return (
      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => (
          <div key={size}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveModal(size)}
            >
              {size.toUpperCase()}
            </Button>
            <Modal
              isOpen={activeModal === size}
              onClose={() => setActiveModal(null)}
              size={size}
              title={`${size.toUpperCase()} Modal`}
              description={`This is a ${size} sized modal`}
            >
              <p className="text-sm">
                This modal demonstrates the {size} size variant.
              </p>
            </Modal>
          </div>
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Different modal sizes from small to extra large.',
      },
    },
  },
};

export const NonClosable: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
      <div>
        <Button onClick={() => setIsOpen(true)}>Open Non-Closable Modal</Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Important Notice"
          description="This modal cannot be closed by clicking outside or pressing Escape"
          showCloseButton={false}
          closeOnOverlayClick={false}
          closeOnEscape={false}
        >
          <div className="space-y-4">
            <p className="text-sm">
              This modal demonstrates non-closable behavior. You must use the
              button below to close it.
            </p>
            <Button onClick={() => setIsOpen(false)}>
              I Understand
            </Button>
          </div>
        </Modal>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'A modal that cannot be closed by clicking outside or pressing Escape.',
      },
    },
  },
};

export const FormModal: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
      <div>
        <Button onClick={() => setIsOpen(true)}>Open Form Modal</Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Create New Project"
          description="Enter the details for your new project"
          size="md"
        >
          <form className="space-y-4">
            <div>
              <label htmlFor="project-name" className="block text-sm font-medium mb-1">
                Project Name
              </label>
              <input
                id="project-name"
                type="text"
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter project name"
              />
            </div>
            <div>
              <label htmlFor="project-description" className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                id="project-description"
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter project description"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsOpen(false)}>
                Create Project
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'A modal containing a form with proper focus management and validation.',
      },
    },
  },
};

export const Accessibility: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
      <div>
        <Button onClick={() => setIsOpen(true)}>Open Accessible Modal</Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Accessibility Features"
          description="This modal demonstrates proper accessibility features"
        >
          <div className="space-y-4">
            <ul className="text-sm space-y-2">
              <li>• Focus is trapped within the modal</li>
              <li>• Pressing Tab cycles through focusable elements</li>
              <li>• Pressing Escape closes the modal</li>
              <li>• Screen readers announce the modal title and description</li>
              <li>• Background content is hidden from screen readers</li>
            </ul>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsOpen(false)}>
                Confirm
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Modal with proper accessibility features and focus management.',
      },
    },
  },
};