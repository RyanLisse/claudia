import type { Meta, StoryObj } from '@storybook/react';
import { Alert, AlertTitle, AlertDescription } from './alert';
import { AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';

const meta = {
	title: 'Components/Alert',
	component: Alert,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	argTypes: {
		variant: {
			control: 'select',
			options: ['default', 'destructive', 'success', 'warning', 'info'],
		},
		dismissible: {
			control: 'boolean',
		},
		autoHide: {
			control: 'boolean',
		},
		autoHideDelay: {
			control: 'number',
		},
	},
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic variants
export const Default: Story = {
	args: {
		children: (
			<>
				<AlertTitle>Default Alert</AlertTitle>
				<AlertDescription>
					This is a default alert message with some information.
				</AlertDescription>
			</>
		),
	},
};

export const Destructive: Story = {
	args: {
		variant: 'destructive',
		children: (
			<>
				<AlertTitle>Error</AlertTitle>
				<AlertDescription>
					Something went wrong. Please try again later.
				</AlertDescription>
			</>
		),
	},
};

export const Success: Story = {
	args: {
		variant: 'success',
		children: (
			<>
				<AlertTitle>Success</AlertTitle>
				<AlertDescription>
					Your action was completed successfully!
				</AlertDescription>
			</>
		),
	},
};

export const Warning: Story = {
	args: {
		variant: 'warning',
		children: (
			<>
				<AlertTitle>Warning</AlertTitle>
				<AlertDescription>
					Please be careful with this action as it cannot be undone.
				</AlertDescription>
			</>
		),
	},
};

export const Info: Story = {
	args: {
		variant: 'info',
		children: (
			<>
				<AlertTitle>Information</AlertTitle>
				<AlertDescription>
					Here's some helpful information about this feature.
				</AlertDescription>
			</>
		),
	},
};

// Dismissible alerts
export const Dismissible: Story = {
	args: {
		dismissible: true,
		children: (
			<>
				<AlertTitle>Dismissible Alert</AlertTitle>
				<AlertDescription>
					You can close this alert by clicking the X button.
				</AlertDescription>
			</>
		),
	},
};

export const DismissibleSuccess: Story = {
	args: {
		variant: 'success',
		dismissible: true,
		children: (
			<>
				<AlertTitle>Success!</AlertTitle>
				<AlertDescription>
					Your settings have been saved successfully.
				</AlertDescription>
			</>
		),
	},
};

// Auto-hide alerts
export const AutoHide: Story = {
	args: {
		autoHide: true,
		autoHideDelay: 3000,
		variant: 'info',
		children: (
			<>
				<AlertTitle>Auto-hide Alert</AlertTitle>
				<AlertDescription>
					This alert will automatically disappear in 3 seconds.
				</AlertDescription>
			</>
		),
	},
};

// Custom icons
export const CustomIcon: Story = {
	args: {
		icon: <CheckCircle className="h-4 w-4" />,
		variant: 'success',
		children: (
			<>
				<AlertTitle>Custom Icon</AlertTitle>
				<AlertDescription>
					This alert uses a custom icon instead of the default one.
				</AlertDescription>
			</>
		),
	},
};

// Simple alerts (no title)
export const SimpleAlert: Story = {
	args: {
		variant: 'info',
		children: (
			<AlertDescription>
				This is a simple alert with just a description.
			</AlertDescription>
		),
	},
};

export const SimpleError: Story = {
	args: {
		variant: 'destructive',
		dismissible: true,
		children: (
			<AlertDescription>
				Invalid email address. Please check your input.
			</AlertDescription>
		),
	},
};

// Interactive examples
export const AllVariants: Story = {
	render: () => (
		<div className="space-y-4 w-full max-w-2xl">
			<Alert>
				<AlertTitle>Default Alert</AlertTitle>
				<AlertDescription>
					This is a default alert message.
				</AlertDescription>
			</Alert>
			<Alert variant="destructive">
				<AlertTitle>Error</AlertTitle>
				<AlertDescription>
					Something went wrong.
				</AlertDescription>
			</Alert>
			<Alert variant="success">
				<AlertTitle>Success</AlertTitle>
				<AlertDescription>
					Operation completed successfully.
				</AlertDescription>
			</Alert>
			<Alert variant="warning">
				<AlertTitle>Warning</AlertTitle>
				<AlertDescription>
					Please proceed with caution.
				</AlertDescription>
			</Alert>
			<Alert variant="info">
				<AlertTitle>Information</AlertTitle>
				<AlertDescription>
					Here's some helpful information.
				</AlertDescription>
			</Alert>
		</div>
	),
};

export const DismissibleVariants: Story = {
	render: () => (
		<div className="space-y-4 w-full max-w-2xl">
			<Alert dismissible>
				<AlertTitle>Dismissible Default</AlertTitle>
				<AlertDescription>
					You can close this alert.
				</AlertDescription>
			</Alert>
			<Alert variant="success" dismissible>
				<AlertTitle>Dismissible Success</AlertTitle>
				<AlertDescription>
					Success message that can be dismissed.
				</AlertDescription>
			</Alert>
			<Alert variant="warning" dismissible>
				<AlertTitle>Dismissible Warning</AlertTitle>
				<AlertDescription>
					Warning that can be closed.
				</AlertDescription>
			</Alert>
		</div>
	),
};

export const SimpleMessages: Story = {
	render: () => (
		<div className="space-y-4 w-full max-w-2xl">
			<Alert>
				<AlertDescription>
					Your session will expire in 5 minutes.
				</AlertDescription>
			</Alert>
			<Alert variant="success">
				<AlertDescription>
					File uploaded successfully.
				</AlertDescription>
			</Alert>
			<Alert variant="destructive" dismissible>
				<AlertDescription>
					Network error. Please check your connection.
				</AlertDescription>
			</Alert>
		</div>
	),
};