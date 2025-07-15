import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { Eye, EyeOff, Lock, Mail, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "../src/components/Input";

const meta = {
	title: "Components/Input",
	component: Input,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"A flexible input component with support for labels, descriptions, error states, icons, and addons. Fully accessible with WCAG 2.1 AA compliance.",
			},
		},
	},
	tags: ["autodocs"],
	argTypes: {
		size: {
			control: { type: "select" },
			options: ["sm", "default", "lg"],
			description: "The size of the input",
		},
		variant: {
			control: { type: "select" },
			options: ["default", "error", "success"],
			description: "The visual variant of the input",
		},
		type: {
			control: { type: "select" },
			options: ["text", "email", "password", "number", "tel", "url", "search"],
			description: "The HTML input type",
		},
		disabled: {
			control: { type: "boolean" },
			description: "Disables the input",
		},
	},
	args: {
		onChange: fn(),
		placeholder: "Enter text...",
	},
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		placeholder: "Default input",
	},
};

export const WithLabel: Story = {
	args: {
		label: "Email address",
		placeholder: "Enter your email",
		type: "email",
	},
};

export const WithDescription: Story = {
	args: {
		label: "Username",
		description: "Choose a unique username that will be visible to other users",
		placeholder: "Enter username",
	},
};

export const Sizes: Story = {
	render: () => (
		<div className="w-80 space-y-4">
			<Input size="sm" placeholder="Small input" />
			<Input size="default" placeholder="Default input" />
			<Input size="lg" placeholder="Large input" />
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "Different sizes of the input component.",
			},
		},
	},
};

export const WithIcons: Story = {
	render: () => (
		<div className="w-80 space-y-4">
			<Input
				leftIcon={<Search className="h-4 w-4" />}
				placeholder="Search..."
				type="search"
			/>
			<Input
				leftIcon={<Mail className="h-4 w-4" />}
				placeholder="Email address"
				type="email"
			/>
			<Input
				leftIcon={<Lock className="h-4 w-4" />}
				placeholder="Password"
				type="password"
			/>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "Inputs with left icons for visual enhancement and context.",
			},
		},
	},
};

export const WithAddons: Story = {
	render: () => (
		<div className="w-80 space-y-4">
			<Input
				leftAddon="https://"
				placeholder="yoursite.com"
				label="Website URL"
			/>
			<Input rightAddon=".com" placeholder="domain" label="Domain name" />
			<Input
				leftAddon="$"
				rightAddon="USD"
				placeholder="0.00"
				type="number"
				label="Price"
			/>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "Inputs with text addons on the left or right side.",
			},
		},
	},
};

export const ErrorState: Story = {
	args: {
		label: "Email address",
		placeholder: "Enter your email",
		error: "Please enter a valid email address",
		type: "email",
		value: "invalid-email",
	},
};

export const SuccessState: Story = {
	args: {
		label: "Username",
		placeholder: "Enter username",
		success: "Username is available!",
		value: "john_doe",
	},
};

export const Disabled: Story = {
	args: {
		label: "Disabled input",
		placeholder: "Cannot edit this",
		disabled: true,
		value: "Disabled value",
	},
};

export const PasswordToggle: Story = {
	render: () => {
		const PasswordInput = () => {
			const [showPassword, setShowPassword] = useState(false);

			return (
				<div className="w-80">
					<Input
						type={showPassword ? "text" : "password"}
						label="Password"
						placeholder="Enter your password"
						rightIcon={
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="text-muted-foreground hover:text-foreground"
								aria-label={showPassword ? "Hide password" : "Show password"}
							>
								{showPassword ? (
									<EyeOff className="h-4 w-4" />
								) : (
									<Eye className="h-4 w-4" />
								)}
							</button>
						}
					/>
				</div>
			);
		};

		return <PasswordInput />;
	},
	parameters: {
		docs: {
			description: {
				story:
					"Example of a password input with show/hide toggle functionality.",
			},
		},
	},
};

export const FormExample: Story = {
	render: () => (
		<div className="w-80 space-y-6">
			<Input label="First name" placeholder="John" required />
			<Input label="Last name" placeholder="Doe" required />
			<Input
				label="Email"
				type="email"
				placeholder="john@example.com"
				description="We'll never share your email with anyone"
				leftIcon={<Mail className="h-4 w-4" />}
				required
			/>
			<Input
				label="Phone number"
				type="tel"
				placeholder="(555) 123-4567"
				leftAddon="+1"
			/>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "Example of multiple inputs in a form layout.",
			},
		},
	},
};
