import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { Eye, EyeOff, Lock, Mail, Search, User, Phone, Calendar, CreditCard, Globe } from "lucide-react";
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
					"A flexible input component with support for labels, descriptions, error states, icons, and addons. Fully accessible with WCAG 2.1 AA compliance and comprehensive keyboard navigation support.",
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
			options: ["text", "email", "password", "number", "tel", "url", "search", "date", "time", "datetime-local"],
			description: "The HTML input type",
		},
		disabled: {
			control: { type: "boolean" },
			description: "Disables the input",
		},
		required: {
			control: { type: "boolean" },
			description: "Makes the input required",
		},
		autoComplete: {
			control: { type: "select" },
			options: ["off", "on", "email", "username", "current-password", "new-password", "name", "tel", "url"],
			description: "Provides autocomplete hints",
		},
	},
	args: {
		onChange: fn(),
		onFocus: fn(),
		onBlur: fn(),
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

export const AccessibilityDemo: Story = {
	render: () => (
		<div className="w-80 space-y-6">
			<Input
				label="Username"
				placeholder="Enter username"
				description="Must be between 3-20 characters"
				leftIcon={<User className="h-4 w-4" />}
				required
				minLength={3}
				maxLength={20}
				aria-describedby="username-help"
			/>
			<Input
				label="Credit Card Number"
				placeholder="1234 5678 9012 3456"
				leftIcon={<CreditCard className="h-4 w-4" />}
				autoComplete="cc-number"
				pattern="[0-9\s]{13,19}"
				aria-describedby="cc-help"
			/>
			<Input
				label="Website URL"
				type="url"
				placeholder="https://example.com"
				leftIcon={<Globe className="h-4 w-4" />}
				autoComplete="url"
				pattern="https://.*"
			/>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "Demonstrates accessibility features including ARIA attributes, pattern validation, and semantic HTML.",
			},
		},
	},
};

export const ValidationStates: Story = {
	render: () => (
		<div className="w-80 space-y-6">
			<Input
				label="Valid Email"
				type="email"
				value="user@example.com"
				success="Email format is valid"
				leftIcon={<Mail className="h-4 w-4" />}
			/>
			<Input
				label="Invalid Email"
				type="email"
				value="invalid-email"
				error="Please enter a valid email address"
				leftIcon={<Mail className="h-4 w-4" />}
			/>
			<Input
				label="Loading State"
				placeholder="Checking availability..."
				leftIcon={<User className="h-4 w-4" />}
				disabled
			/>
			<Input
				label="Required Field"
				placeholder="This field is required"
				required
				error="This field is required"
			/>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "Various validation states and feedback messages.",
			},
		},
	},
};

export const ResponsiveDesign: Story = {
	render: () => (
		<div className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<Input
					label="First Name"
					placeholder="John"
					leftIcon={<User className="h-4 w-4" />}
				/>
				<Input
					label="Last Name"
					placeholder="Doe"
					leftIcon={<User className="h-4 w-4" />}
				/>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Input
					label="Phone"
					type="tel"
					placeholder="(555) 123-4567"
					leftIcon={<Phone className="h-4 w-4" />}
				/>
				<Input
					label="Birthday"
					type="date"
					leftIcon={<Calendar className="h-4 w-4" />}
				/>
				<Input
					label="Website"
					type="url"
					placeholder="https://example.com"
					leftIcon={<Globe className="h-4 w-4" />}
				/>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "Responsive grid layout with inputs of different types.",
			},
		},
	},
};

export const AdvancedInteractions: Story = {
	render: () => {
		const AdvancedForm = () => {
			const [formData, setFormData] = useState({
				search: '',
				email: '',
				password: '',
				confirmPassword: '',
			});
			const [showPassword, setShowPassword] = useState(false);
			const [showConfirmPassword, setShowConfirmPassword] = useState(false);
			const [errors, setErrors] = useState<Record<string, string>>({});

			const handleChange = (field: string, value: string) => {
				setFormData(prev => ({ ...prev, [field]: value }));
				// Clear error when user starts typing
				if (errors[field]) {
					setErrors(prev => ({ ...prev, [field]: '' }));
				}
			};

			const validatePasswords = () => {
				const newErrors: Record<string, string> = {};
				
				if (formData.password && formData.password.length < 8) {
					newErrors.password = 'Password must be at least 8 characters';
				}
				
				if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
					newErrors.confirmPassword = 'Passwords do not match';
				}
				
				setErrors(newErrors);
			};

			return (
				<div className="w-80 space-y-6">
					<Input
						label="Search"
						type="search"
						placeholder="Type to search..."
						value={formData.search}
						onChange={(e) => handleChange('search', e.target.value)}
						leftIcon={<Search className="h-4 w-4" />}
					/>
					<Input
						label="Email"
						type="email"
						placeholder="Enter your email"
						value={formData.email}
						onChange={(e) => handleChange('email', e.target.value)}
						leftIcon={<Mail className="h-4 w-4" />}
						autoComplete="email"
					/>
					<Input
						label="Password"
						type={showPassword ? "text" : "password"}
						placeholder="Enter password"
						value={formData.password}
						onChange={(e) => handleChange('password', e.target.value)}
						onBlur={validatePasswords}
						leftIcon={<Lock className="h-4 w-4" />}
						rightIcon={
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="text-muted-foreground hover:text-foreground"
								aria-label={showPassword ? "Hide password" : "Show password"}
							>
								{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
							</button>
						}
						error={errors.password}
						autoComplete="new-password"
					/>
					<Input
						label="Confirm Password"
						type={showConfirmPassword ? "text" : "password"}
						placeholder="Confirm password"
						value={formData.confirmPassword}
						onChange={(e) => handleChange('confirmPassword', e.target.value)}
						onBlur={validatePasswords}
						leftIcon={<Lock className="h-4 w-4" />}
						rightIcon={
							<button
								type="button"
								onClick={() => setShowConfirmPassword(!showConfirmPassword)}
								className="text-muted-foreground hover:text-foreground"
								aria-label={showConfirmPassword ? "Hide password" : "Show password"}
							>
								{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
							</button>
						}
						error={errors.confirmPassword}
						autoComplete="new-password"
					/>
				</div>
			);
		};

		return <AdvancedForm />;
	},
	parameters: {
		docs: {
			description: {
				story: "Advanced form with state management, validation, and interactive elements.",
			},
		},
	},
};
