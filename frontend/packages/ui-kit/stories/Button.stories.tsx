import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { 
  Download, 
  Heart, 
  Plus, 
  Save,
  Edit3,
  Trash2,
  RefreshCw,
  Search,
  Settings,
  ArrowRight,
  Check,
  X,
  Mail,
  Phone,
  Share2,
  Copy,
  ExternalLink,
  ChevronDown,
  Lock,
  Unlock,
  Play,
  Pause,
  Stop
} from "lucide-react";
import { Button } from "../src/components/Button";

const meta = {
	title: "Components/Button",
	component: Button,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"A comprehensive button component built with Class Variance Authority (CVA) for consistent variant management. Features multiple variants (default, destructive, outline, secondary, ghost, link), sizes (sm, default, lg, icon), and states (loading, disabled) with full WCAG 2.1 AA accessibility compliance including proper ARIA attributes, keyboard navigation, and focus management.",
			},
		},
	},
	tags: ["autodocs"],
	argTypes: {
		variant: {
			control: { type: "select" },
			options: [
				"default",
				"destructive",
				"outline",
				"secondary",
				"ghost",
				"link",
			],
			description: "The visual style variant of the button",
		},
		size: {
			control: { type: "select" },
			options: ["default", "sm", "lg", "icon"],
			description: "The size of the button",
		},
		loading: {
			control: { type: "boolean" },
			description: "Shows loading spinner and disables interaction",
		},
		disabled: {
			control: { type: "boolean" },
			description: "Disables the button",
		},
		asChild: {
			control: { type: "boolean" },
			description: "Render as a child component (using Radix Slot)",
		},
	},
	args: {
		onClick: fn(),
		children: "Button",
	},
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		children: "Default Button",
	},
};

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
				story: "Different visual variants of the button component.",
			},
		},
	},
};

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
				story: "Different sizes of the button component.",
			},
		},
	},
};

export const WithIcons: Story = {
	render: () => (
		<div className="flex flex-wrap gap-4">
			<Button leftIcon={<Heart className="h-4 w-4" />}>With Left Icon</Button>
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
				story:
					"Buttons with left and right icons for enhanced visual communication.",
			},
		},
	},
};

export const Loading: Story = {
	render: () => (
		<div className="flex gap-4">
			<Button loading>Loading</Button>
			<Button loading variant="outline">
				Loading Outline
			</Button>
			<Button loading variant="secondary">
				Loading Secondary
			</Button>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "Loading state with spinner animation.",
			},
		},
	},
};

export const Disabled: Story = {
	render: () => (
		<div className="flex gap-4">
			<Button disabled>Disabled</Button>
			<Button disabled variant="outline">
				Disabled Outline
			</Button>
			<Button disabled variant="destructive">
				Disabled Destructive
			</Button>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "Disabled state with reduced opacity and no interactions.",
			},
		},
	},
};

export const Accessibility: Story = {
	render: () => (
		<div className="space-y-4">
			<div className="flex gap-4">
				<Button aria-label="Add to favorites">
					<Heart className="h-4 w-4" />
				</Button>
				<Button aria-describedby="download-description">Download</Button>
			</div>
			<p id="download-description" className="text-muted-foreground text-sm">
				This button will download the current file to your device.
			</p>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Examples showing proper accessibility attributes like aria-label and aria-describedby.",
			},
		},
	},
};

export const Interactive: Story = {
	args: {
		children: "Click me!",
	},
	parameters: {
		docs: {
			description: {
				story: "Interactive button for testing click events.",
			},
		},
	},
};

// Real-world examples
export const FormButtons: Story = {
	render: () => (
		<div className="space-y-4">
			<div className="flex gap-2">
				<Button leftIcon={<Save className="h-4 w-4" />} variant="default">
					Save Changes
				</Button>
				<Button variant="outline">Cancel</Button>
			</div>
			<div className="flex gap-2">
				<Button leftIcon={<Check className="h-4 w-4" />} variant="default">
					Submit
				</Button>
				<Button variant="ghost">Reset</Button>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "Common button combinations used in forms with save, cancel, submit, and reset actions.",
			},
		},
	},
};

export const CrudOperations: Story = {
	render: () => (
		<div className="space-y-4">
			<div className="flex gap-2">
				<Button leftIcon={<Plus className="h-4 w-4" />} variant="default">
					Create New
				</Button>
				<Button leftIcon={<Edit3 className="h-4 w-4" />} variant="outline">
					Edit
				</Button>
				<Button leftIcon={<Trash2 className="h-4 w-4" />} variant="destructive">
					Delete
				</Button>
			</div>
			<div className="flex gap-2">
				<Button leftIcon={<RefreshCw className="h-4 w-4" />} variant="ghost">
					Refresh
				</Button>
				<Button leftIcon={<Copy className="h-4 w-4" />} variant="ghost">
					Duplicate
				</Button>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "CRUD operation buttons with appropriate icons and variants for create, read, update, and delete actions.",
			},
		},
	},
};

export const NavigationButtons: Story = {
	render: () => (
		<div className="space-y-4">
			<div className="flex gap-2">
				<Button rightIcon={<ArrowRight className="h-4 w-4" />} variant="default">
					Next
				</Button>
				<Button variant="outline">Previous</Button>
			</div>
			<div className="flex gap-2">
				<Button leftIcon={<ExternalLink className="h-4 w-4" />} variant="link">
					Learn More
				</Button>
				<Button rightIcon={<ChevronDown className="h-4 w-4" />} variant="ghost">
					Options
				</Button>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "Navigation buttons with directional icons for multi-step processes and external links.",
			},
		},
	},
};

export const CommunicationButtons: Story = {
	render: () => (
		<div className="space-y-4">
			<div className="flex gap-2">
				<Button leftIcon={<Mail className="h-4 w-4" />} variant="default">
					Send Email
				</Button>
				<Button leftIcon={<Phone className="h-4 w-4" />} variant="outline">
					Call
				</Button>
			</div>
			<div className="flex gap-2">
				<Button leftIcon={<Share2 className="h-4 w-4" />} variant="ghost">
					Share
				</Button>
				<Button leftIcon={<MessageCircle className="h-4 w-4" />} variant="ghost">
					Message
				</Button>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "Communication buttons for email, phone, sharing, and messaging actions.",
			},
		},
	},
};

export const SecurityButtons: Story = {
	render: () => (
		<div className="space-y-4">
			<div className="flex gap-2">
				<Button leftIcon={<Lock className="h-4 w-4" />} variant="default">
					Lock Account
				</Button>
				<Button leftIcon={<Unlock className="h-4 w-4" />} variant="outline">
					Unlock
				</Button>
			</div>
			<div className="flex gap-2">
				<Button leftIcon={<Settings className="h-4 w-4" />} variant="ghost">
					Security Settings
				</Button>
				<Button leftIcon={<X className="h-4 w-4" />} variant="destructive">
					Revoke Access
				</Button>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "Security-related buttons for account management and access control.",
			},
		},
	},
};

export const MediaControls: Story = {
	render: () => (
		<div className="space-y-4">
			<div className="flex gap-2">
				<Button size="icon" variant="default">
					<Play className="h-4 w-4" />
				</Button>
				<Button size="icon" variant="outline">
					<Pause className="h-4 w-4" />
				</Button>
				<Button size="icon" variant="destructive">
					<Stop className="h-4 w-4" />
				</Button>
			</div>
			<div className="flex gap-2">
				<Button leftIcon={<Play className="h-4 w-4" />} variant="default">
					Play Video
				</Button>
				<Button leftIcon={<Pause className="h-4 w-4" />} variant="outline">
					Pause
				</Button>
				<Button leftIcon={<Stop className="h-4 w-4" />} variant="ghost">
					Stop
				</Button>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "Media control buttons for play, pause, and stop functionality with both icon and text variants.",
			},
		},
	},
};

export const ResponsiveButtons: Story = {
	render: () => (
		<div className="space-y-4">
			<div className="flex flex-col sm:flex-row gap-2">
				<Button className="w-full sm:w-auto" variant="default">
					Mobile Full Width
				</Button>
				<Button className="w-full sm:w-auto" variant="outline">
					Desktop Auto Width
				</Button>
			</div>
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
				<Button size="sm" variant="default">Small</Button>
				<Button size="default" variant="default">Default</Button>
				<Button size="lg" variant="default">Large</Button>
				<Button size="icon" variant="default">
					<Plus className="h-4 w-4" />
				</Button>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "Responsive button layouts that adapt to different screen sizes with flexible widths and grid arrangements.",
			},
		},
	},
};

export const LoadingStates: Story = {
	render: () => (
		<div className="space-y-4">
			<div className="flex gap-2">
				<Button loading variant="default">
					Saving...
				</Button>
				<Button loading variant="outline">
					Loading...
				</Button>
				<Button loading variant="destructive">
					Deleting...
				</Button>
			</div>
			<div className="flex gap-2">
				<Button loading leftIcon={<Save className="h-4 w-4" />} variant="default">
					Saving Changes
				</Button>
				<Button loading leftIcon={<RefreshCw className="h-4 w-4" />} variant="ghost">
					Refreshing Data
				</Button>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "Loading states for different button variants during async operations.",
			},
		},
	},
};

export const ActionToolbar: Story = {
	render: () => (
		<div className="space-y-4">
			<div className="flex items-center gap-1 p-2 bg-gray-50 rounded-lg">
				<Button size="sm" variant="ghost">
					<Save className="h-4 w-4" />
				</Button>
				<Button size="sm" variant="ghost">
					<Edit3 className="h-4 w-4" />
				</Button>
				<Button size="sm" variant="ghost">
					<Copy className="h-4 w-4" />
				</Button>
				<div className="w-px h-4 bg-gray-300 mx-1" />
				<Button size="sm" variant="ghost">
					<Trash2 className="h-4 w-4" />
				</Button>
			</div>
			<div className="flex items-center gap-1 p-2 bg-gray-100 rounded-lg">
				<Button size="sm" variant="outline">
					<Search className="h-4 w-4" />
				</Button>
				<Button size="sm" variant="outline">
					<Settings className="h-4 w-4" />
				</Button>
				<Button size="sm" variant="outline">
					<RefreshCw className="h-4 w-4" />
				</Button>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "Toolbar layouts with icon buttons grouped together for common actions.",
			},
		},
	},
};

export const ButtonGroupsWithStates: Story = {
	render: () => (
		<div className="space-y-4">
			<div className="flex gap-2">
				<Button variant="default" className="flex-1">
					Primary Action
				</Button>
				<Button variant="outline" className="flex-1">
					Secondary Action
				</Button>
			</div>
			<div className="flex gap-2">
				<Button variant="default" disabled>
					Disabled Primary
				</Button>
				<Button variant="outline" disabled>
					Disabled Secondary
				</Button>
				<Button variant="destructive" disabled>
					Disabled Destructive
				</Button>
			</div>
			<div className="flex gap-2">
				<Button variant="ghost" className="opacity-50 cursor-not-allowed">
					Inactive
				</Button>
				<Button variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
					Success State
				</Button>
				<Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
					Error State
				</Button>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "Button groups with different states including disabled, inactive, success, and error states.",
			},
		},
	},
};

export const PerformanceOptimized: Story = {
	render: () => (
		<div className="space-y-4">
			<div className="flex gap-2">
				<Button 
					onClick={() => console.log('Optimized click handler')}
					className="transition-all duration-200 hover:scale-105"
					variant="default"
				>
					Smooth Animation
				</Button>
				<Button 
					onClick={() => console.log('Debounced action')}
					className="will-change-transform"
					variant="outline"
				>
					Debounced Action
				</Button>
			</div>
			<div className="flex gap-2">
				<Button 
					className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
					variant="default"
				>
					Enhanced Focus
				</Button>
				<Button 
					className="active:scale-95 transform transition-transform"
					variant="ghost"
				>
					Touch Feedback
				</Button>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "Performance-optimized buttons with smooth animations, proper focus states, and touch feedback.",
			},
		},
	},
};
