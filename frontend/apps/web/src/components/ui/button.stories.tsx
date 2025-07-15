import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';
import { Heart, Download, ArrowRight, Plus } from 'lucide-react';

const meta = {
	title: 'Components/Button',
	component: Button,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	argTypes: {
		variant: {
			control: 'select',
			options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
		},
		size: {
			control: 'select',
			options: ['default', 'sm', 'lg', 'icon'],
		},
		loading: {
			control: 'boolean',
		},
		ripple: {
			control: 'boolean',
		},
	},
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic variants
export const Default: Story = {
	args: {
		children: 'Button',
	},
};

export const Destructive: Story = {
	args: {
		variant: 'destructive',
		children: 'Delete',
	},
};

export const Outline: Story = {
	args: {
		variant: 'outline',
		children: 'Outline',
	},
};

export const Secondary: Story = {
	args: {
		variant: 'secondary',
		children: 'Secondary',
	},
};

export const Ghost: Story = {
	args: {
		variant: 'ghost',
		children: 'Ghost',
	},
};

export const Link: Story = {
	args: {
		variant: 'link',
		children: 'Link',
	},
};

// Sizes
export const Small: Story = {
	args: {
		size: 'sm',
		children: 'Small',
	},
};

export const Large: Story = {
	args: {
		size: 'lg',
		children: 'Large',
	},
};

export const Icon: Story = {
	args: {
		size: 'icon',
		children: <Heart className="h-4 w-4" />,
	},
};

// Loading states
export const Loading: Story = {
	args: {
		loading: true,
		children: 'Loading',
	},
};

export const LoadingWithText: Story = {
	args: {
		loading: true,
		loadingText: 'Processing...',
		children: 'Submit',
	},
};

// With icons
export const WithStartIcon: Story = {
	args: {
		startIcon: <Download className="h-4 w-4" />,
		children: 'Download',
	},
};

export const WithEndIcon: Story = {
	args: {
		endIcon: <ArrowRight className="h-4 w-4" />,
		children: 'Next',
	},
};

export const WithBothIcons: Story = {
	args: {
		startIcon: <Plus className="h-4 w-4" />,
		endIcon: <ArrowRight className="h-4 w-4" />,
		children: 'Add Item',
	},
};

// States
export const Disabled: Story = {
	args: {
		disabled: true,
		children: 'Disabled',
	},
};

export const DisabledWithIcon: Story = {
	args: {
		disabled: true,
		startIcon: <Heart className="h-4 w-4" />,
		children: 'Disabled',
	},
};

// Ripple effect
export const WithRipple: Story = {
	args: {
		ripple: true,
		children: 'Click for Ripple',
	},
};

export const WithoutRipple: Story = {
	args: {
		ripple: false,
		children: 'No Ripple',
	},
};

// Complex examples
export const CallToAction: Story = {
	args: {
		size: 'lg',
		startIcon: <Plus className="h-4 w-4" />,
		children: 'Get Started',
		ripple: true,
	},
};

export const DestructiveAction: Story = {
	args: {
		variant: 'destructive',
		startIcon: <Heart className="h-4 w-4" />,
		children: 'Delete Account',
		ripple: true,
	},
};

// Interactive examples
export const InteractiveGroup: Story = {
	render: () => (
		<div className="flex gap-4 flex-wrap">
			<Button variant="default">Primary</Button>
			<Button variant="outline">Secondary</Button>
			<Button variant="ghost">Tertiary</Button>
			<Button variant="link">Link</Button>
		</div>
	),
};

export const SizeComparison: Story = {
	render: () => (
		<div className="flex gap-4 items-center">
			<Button size="sm">Small</Button>
			<Button size="default">Default</Button>
			<Button size="lg">Large</Button>
			<Button size="icon">
				<Heart className="h-4 w-4" />
			</Button>
		</div>
	),
};

export const LoadingStates: Story = {
	render: () => (
		<div className="flex gap-4 flex-wrap">
			<Button loading>Loading</Button>
			<Button loading loadingText="Saving..." variant="outline">
				Save
			</Button>
			<Button loading variant="destructive">
				Delete
			</Button>
		</div>
	),
};

export const IconVariations: Story = {
	render: () => (
		<div className="flex gap-4 flex-wrap">
			<Button startIcon={<Download className="h-4 w-4" />}>
				Download
			</Button>
			<Button endIcon={<ArrowRight className="h-4 w-4" />}>
				Next
			</Button>
			<Button
				startIcon={<Plus className="h-4 w-4" />}
				endIcon={<ArrowRight className="h-4 w-4" />}
			>
				Add & Continue
			</Button>
		</div>
	),
};