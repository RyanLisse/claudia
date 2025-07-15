import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { Alert, AlertTitle, AlertDescription } from '../src/components/Alert'

const meta = {
  title: 'Components/Alert',
  component: Alert,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Display important information to users with appropriate visual styling and accessibility features.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'success', 'warning', 'error', 'info'],
      description: 'The visual style variant of the alert',
    },
    dismissible: {
      control: { type: 'boolean' },
      description: 'Whether the alert can be dismissed',
    },
    title: {
      control: { type: 'text' },
      description: 'Optional title for the alert',
    },
  },
  args: {
    onDismiss: fn(),
  },
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'This is a default alert message.',
  },
}

export const Variants: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <Alert>
        <AlertDescription>
          This is a default alert with some important information.
        </AlertDescription>
      </Alert>
      
      <Alert variant="success">
        <AlertDescription>
          Success! Your action was completed successfully.
        </AlertDescription>
      </Alert>
      
      <Alert variant="warning">
        <AlertDescription>
          Warning: Please review your input before proceeding.
        </AlertDescription>
      </Alert>
      
      <Alert variant="error">
        <AlertDescription>
          Error: Something went wrong. Please try again.
        </AlertDescription>
      </Alert>
      
      <Alert variant="info">
        <AlertDescription>
          Info: Here's some helpful information for you.
        </AlertDescription>
      </Alert>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different visual variants of alerts for various message types.',
      },
    },
  },
}

export const WithTitle: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <Alert variant="success" title="Payment Successful">
        <AlertDescription>
          Your payment has been processed successfully. You will receive a confirmation email shortly.
        </AlertDescription>
      </Alert>
      
      <Alert variant="error" title="Authentication Failed">
        <AlertDescription>
          Invalid credentials. Please check your username and password and try again.
        </AlertDescription>
      </Alert>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Alerts with titles for more structured messaging.',
      },
    },
  },
}

export const Dismissible: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <Alert variant="info" dismissible title="Welcome!">
        <AlertDescription>
          This is a dismissible alert. Click the X button to close it.
        </AlertDescription>
      </Alert>
      
      <Alert variant="warning" dismissible>
        <AlertDescription>
          This warning can be dismissed once you've read it.
        </AlertDescription>
      </Alert>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Alerts that can be dismissed by the user.',
      },
    },
  },
}

export const ComplexContent: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <Alert variant="error" title="Validation Errors">
        <AlertDescription>
          <p className="mb-2">Please fix the following errors:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Email address is required</li>
            <li>Password must be at least 8 characters</li>
            <li>Phone number format is invalid</li>
          </ul>
        </AlertDescription>
      </Alert>
      
      <Alert variant="success" title="Account Created" dismissible>
        <AlertDescription>
          <p>Your account has been successfully created!</p>
          <p className="mt-2">
            Next steps:
          </p>
          <ol className="list-decimal list-inside mt-1 space-y-1">
            <li>Verify your email address</li>
            <li>Complete your profile</li>
            <li>Start exploring the platform</li>
          </ol>
        </AlertDescription>
      </Alert>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Alerts with complex content including lists and multiple paragraphs.',
      },
    },
  },
}

export const Accessibility: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <Alert variant="error" title="Screen Reader Friendly">
        <AlertDescription>
          This alert uses proper ARIA roles and is announced to screen readers as an alert.
          The role="alert" attribute ensures immediate announcement of critical information.
        </AlertDescription>
      </Alert>
      
      <Alert variant="info" dismissible title="Keyboard Navigation">
        <AlertDescription>
          The dismiss button is keyboard accessible and has proper focus management.
          Press Tab to focus the dismiss button, then Enter or Space to close.
        </AlertDescription>
      </Alert>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Alerts demonstrating accessibility features like ARIA roles and keyboard navigation.',
      },
    },
  },
}