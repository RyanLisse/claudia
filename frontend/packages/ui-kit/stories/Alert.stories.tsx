import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { 
  AlertCircle, 
  CheckCircle, 
  Info, 
  XCircle, 
  AlertTriangle,
  Download,
  Settings,
  RefreshCw,
  Bell,
  Shield,
  Clock,
  Users,
  Database,
  Wifi,
  WifiOff,
  Server,
  Globe,
  Lock,
  Unlock,
  Upload,
  FileText,
  CreditCard,
  Zap,
  Heart,
  Star,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Camera,
  Image,
  Video,
  Music,
  Headphones,
  Mic,
  Volume2,
  VolumeX,
  Battery,
  BatteryLow,
  Signal,
  Bluetooth,
  Smartphone,
  Laptop,
  Monitor,
  Printer,
  HardDrive,
  Cpu,
  MemoryStick,
  Router,
  Gamepad2,
  Bookmark,
  Search,
  Filter,
  SortAsc,
  BarChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Truck,
  Home,
  Building,
  Store,
  Factory,
  Briefcase,
  GraduationCap,
  Award,
  Target,
  Flag,
  Gift,
  Cake,
  Coffee,
  Pizza,
  Utensils,
  Car,
  Bike,
  Plane,
  Train,
  Bus,
  Ship,
  Anchor,
  Compass,
  Map,
  Navigation,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudSnow,
  Thermometer,
  Droplets,
  Wind,
  Eye,
  EyeOff,
  Lightbulb,
  Flashlight,
  Candle,
  Flame,
  Snowflake,
  Leaf,
  Tree,
  Flower,
  Seedling,
  Bug,
  Bird,
  Fish,
  Rabbit,
  Cat,
  Dog,
  Smile,
  Frown,
  Meh,
  Angry,
  Laugh,
  Crying,
  Thinking,
  Sleeping,
  Winking,
  Kissing
} from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "../src/components/Alert";

const meta = {
	title: "Components/Alert",
	component: Alert,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Display important information to users with appropriate visual styling and accessibility features.",
			},
		},
	},
	tags: ["autodocs"],
	argTypes: {
		variant: {
			control: { type: "select" },
			options: ["default", "success", "warning", "error", "info"],
			description: "The visual style variant of the alert",
		},
		dismissible: {
			control: { type: "boolean" },
			description: "Whether the alert can be dismissed",
		},
		title: {
			control: { type: "text" },
			description: "Optional title for the alert",
		},
	},
	args: {
		onDismiss: fn(),
	},
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		children: "This is a default alert message.",
	},
};

export const Variants: Story = {
	render: () => (
		<div className="w-96 space-y-4">
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
				story: "Different visual variants of alerts for various message types.",
			},
		},
	},
};

export const WithTitle: Story = {
	render: () => (
		<div className="w-96 space-y-4">
			<Alert variant="success" title="Payment Successful">
				<AlertDescription>
					Your payment has been processed successfully. You will receive a
					confirmation email shortly.
				</AlertDescription>
			</Alert>

			<Alert variant="error" title="Authentication Failed">
				<AlertDescription>
					Invalid credentials. Please check your username and password and try
					again.
				</AlertDescription>
			</Alert>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "Alerts with titles for more structured messaging.",
			},
		},
	},
};

export const Dismissible: Story = {
	render: () => (
		<div className="w-96 space-y-4">
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
				story: "Alerts that can be dismissed by the user.",
			},
		},
	},
};

export const ComplexContent: Story = {
	render: () => (
		<div className="w-96 space-y-4">
			<Alert variant="error" title="Validation Errors">
				<AlertDescription>
					<p className="mb-2">Please fix the following errors:</p>
					<ul className="list-inside list-disc space-y-1">
						<li>Email address is required</li>
						<li>Password must be at least 8 characters</li>
						<li>Phone number format is invalid</li>
					</ul>
				</AlertDescription>
			</Alert>

			<Alert variant="success" title="Account Created" dismissible>
				<AlertDescription>
					<p>Your account has been successfully created!</p>
					<p className="mt-2">Next steps:</p>
					<ol className="mt-1 list-inside list-decimal space-y-1">
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
				story:
					"Alerts with complex content including lists and multiple paragraphs.",
			},
		},
	},
};

export const Accessibility: Story = {
	render: () => (
		<div className="w-96 space-y-4">
			<Alert variant="error" title="Screen Reader Friendly">
				<AlertDescription>
					This alert uses proper ARIA roles and is announced to screen readers
					as an alert. The role="alert" attribute ensures immediate announcement
					of critical information.
				</AlertDescription>
			</Alert>

			<Alert variant="info" dismissible title="Keyboard Navigation">
				<AlertDescription>
					The dismiss button is keyboard accessible and has proper focus
					management. Press Tab to focus the dismiss button, then Enter or Space
					to close.
				</AlertDescription>
			</Alert>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Alerts demonstrating accessibility features like ARIA roles and keyboard navigation.",
			},
		},
	},
};

export const WithIcons: Story = {
	render: () => (
		<div className="w-96 space-y-4">
			<Alert variant="success" title="Data Saved">
				<CheckCircle className="h-4 w-4" />
				<AlertDescription>
					Your changes have been saved successfully to the database.
				</AlertDescription>
			</Alert>

			<Alert variant="error" title="Connection Failed">
				<WifiOff className="h-4 w-4" />
				<AlertDescription>
					Unable to connect to the server. Please check your network connection.
				</AlertDescription>
			</Alert>

			<Alert variant="warning" title="Storage Almost Full">
				<HardDrive className="h-4 w-4" />
				<AlertDescription>
					You're using 85% of your storage quota. Consider deleting old files.
				</AlertDescription>
			</Alert>

			<Alert variant="info" title="New Feature Available">
				<Lightbulb className="h-4 w-4" />
				<AlertDescription>
					We've added new collaboration features to enhance your workflow.
				</AlertDescription>
			</Alert>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "Alerts with icons for enhanced visual communication and context.",
			},
		},
	},
};

export const SystemNotifications: Story = {
	render: () => (
		<div className="w-96 space-y-4">
			<Alert variant="success" title="System Update Complete">
				<Download className="h-4 w-4" />
				<AlertDescription>
					System has been updated to version 2.1.3. New features are now available.
				</AlertDescription>
			</Alert>

			<Alert variant="warning" title="Scheduled Maintenance">
				<Settings className="h-4 w-4" />
				<AlertDescription>
					System maintenance scheduled for tonight at 2:00 AM EST. Expect brief downtime.
				</AlertDescription>
			</Alert>

			<Alert variant="error" title="Server Error">
				<Server className="h-4 w-4" />
				<AlertDescription>
					Database connection timeout. Our team has been notified and is working on a fix.
				</AlertDescription>
			</Alert>

			<Alert variant="info" title="Security Update" dismissible>
				<Shield className="h-4 w-4" />
				<AlertDescription>
					New security features have been enabled. Review your privacy settings.
				</AlertDescription>
			</Alert>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "System-level notifications with appropriate icons and messaging.",
			},
		},
	},
};

export const UserActions: Story = {
	render: () => (
		<div className="w-96 space-y-4">
			<Alert variant="success" title="Welcome Back!">
				<Users className="h-4 w-4" />
				<AlertDescription>
					You've successfully logged in. Last login was yesterday at 3:45 PM.
				</AlertDescription>
			</Alert>

			<Alert variant="info" title="Profile Updated">
				<User className="h-4 w-4" />
				<AlertDescription>
					Your profile information has been updated successfully.
				</AlertDescription>
			</Alert>

			<Alert variant="warning" title="Password Expires Soon">
				<Lock className="h-4 w-4" />
				<AlertDescription>
					Your password will expire in 3 days. Update it now to avoid service interruption.
				</AlertDescription>
			</Alert>

			<Alert variant="error" title="Account Locked">
				<AlertTriangle className="h-4 w-4" />
				<AlertDescription>
					Account temporarily locked due to multiple failed login attempts. Try again in 15 minutes.
				</AlertDescription>
			</Alert>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "User action feedback with contextual icons and clear messaging.",
			},
		},
	},
};

export const FormValidation: Story = {
	render: () => (
		<div className="w-96 space-y-4">
			<Alert variant="error" title="Form Validation Failed">
				<XCircle className="h-4 w-4" />
				<AlertDescription>
					<p className="mb-2">Please correct the following errors:</p>
					<ul className="list-inside list-disc space-y-1 text-sm">
						<li>Email address is required</li>
						<li>Password must be at least 8 characters</li>
						<li>Terms of service must be accepted</li>
					</ul>
				</AlertDescription>
			</Alert>

			<Alert variant="warning" title="Incomplete Profile">
				<AlertCircle className="h-4 w-4" />
				<AlertDescription>
					Some profile fields are missing. Complete your profile to unlock all features.
				</AlertDescription>
			</Alert>

			<Alert variant="success" title="Form Submitted">
				<CheckCircle className="h-4 w-4" />
				<AlertDescription>
					Your application has been submitted successfully. We'll review it within 2 business days.
				</AlertDescription>
			</Alert>

			<Alert variant="info" title="Auto-save Enabled">
				<RefreshCw className="h-4 w-4" />
				<AlertDescription>
					Your changes are being saved automatically every 30 seconds.
				</AlertDescription>
			</Alert>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "Form validation feedback with detailed error messages and status updates.",
			},
		},
	},
};

export const EcommerceFlow: Story = {
	render: () => (
		<div className="w-96 space-y-4">
			<Alert variant="success" title="Added to Cart">
				<ShoppingCart className="h-4 w-4" />
				<AlertDescription>
					Product has been added to your cart. 3 items in cart, total: $299.99
				</AlertDescription>
			</Alert>

			<Alert variant="info" title="Free Shipping Available">
				<Truck className="h-4 w-4" />
				<AlertDescription>
					Add $25.00 more to qualify for free shipping on your order.
				</AlertDescription>
			</Alert>

			<Alert variant="warning" title="Low Stock Alert">
				<Package className="h-4 w-4" />
				<AlertDescription>
					Only 2 items left in stock. Order soon to avoid disappointment.
				</AlertDescription>
			</Alert>

			<Alert variant="success" title="Order Confirmed" dismissible>
				<CheckCircle className="h-4 w-4" />
				<AlertDescription>
					Order #12345 confirmed. Estimated delivery: March 15-17, 2024
				</AlertDescription>
			</Alert>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "E-commerce related alerts for shopping cart, orders, and inventory.",
			},
		},
	},
};

export const InteractiveExamples: Story = {
	render: () => {
		const InteractiveDemo = () => {
			const [alerts, setAlerts] = useState([
				{ id: 1, variant: 'info', title: 'Welcome!', message: 'This is a dismissible alert.', visible: true },
				{ id: 2, variant: 'success', title: 'Success!', message: 'Operation completed successfully.', visible: true },
				{ id: 3, variant: 'warning', title: 'Warning!', message: 'Please review before proceeding.', visible: true }
			]);

			const dismissAlert = (id: number) => {
				setAlerts(prev => prev.map(alert => 
					alert.id === id ? { ...alert, visible: false } : alert
				));
			};

			const restoreAlerts = () => {
				setAlerts(prev => prev.map(alert => ({ ...alert, visible: true })));
			};

			return (
				<div className="w-96 space-y-4">
					<div className="space-y-3">
						{alerts.filter(alert => alert.visible).map(alert => (
							<Alert 
								key={alert.id} 
								variant={alert.variant as any} 
								title={alert.title}
								dismissible
								onDismiss={() => dismissAlert(alert.id)}
							>
								<AlertDescription>{alert.message}</AlertDescription>
							</Alert>
						))}
					</div>
					
					{alerts.some(alert => !alert.visible) && (
						<button
							onClick={restoreAlerts}
							className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
						>
							Restore Dismissed Alerts
						</button>
					)}
				</div>
			);
		};

		return <InteractiveDemo />;
	},
	parameters: {
		docs: {
			description: {
				story: "Interactive demo showing alert dismissal and restoration functionality.",
			},
		},
	},
};

export const LoadingStates: Story = {
	render: () => (
		<div className="w-96 space-y-4">
			<Alert variant="info" title="Processing Payment">
				<RefreshCw className="h-4 w-4 animate-spin" />
				<AlertDescription>
					Please wait while we process your payment. This may take a few moments.
				</AlertDescription>
			</Alert>

			<Alert variant="info" title="Uploading Files">
				<Upload className="h-4 w-4" />
				<AlertDescription>
					Uploading 3 files... 75% complete. Please don't close this window.
				</AlertDescription>
			</Alert>

			<Alert variant="info" title="Syncing Data">
				<RefreshCw className="h-4 w-4 animate-spin" />
				<AlertDescription>
					Synchronizing your data with the cloud. This process may take up to 2 minutes.
				</AlertDescription>
			</Alert>

			<Alert variant="warning" title="Connection Slow">
				<Signal className="h-4 w-4" />
				<AlertDescription>
					Slow network detected. Some features may be limited until connection improves.
				</AlertDescription>
			</Alert>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "Loading states and progress indicators with appropriate animations.",
			},
		},
	},
};

export const ResponsiveDesign: Story = {
	render: () => (
		<div className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<Alert variant="success" title="Mobile Optimized">
					<Smartphone className="h-4 w-4" />
					<AlertDescription>
						This alert adapts to different screen sizes automatically.
					</AlertDescription>
				</Alert>

				<Alert variant="info" title="Responsive Grid">
					<Monitor className="h-4 w-4" />
					<AlertDescription>
						Alerts scale properly in responsive grid layouts.
					</AlertDescription>
				</Alert>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Alert variant="warning" title="Tablet View">
					<Laptop className="h-4 w-4" />
					<AlertDescription>
						Optimized for tablet viewing experience.
					</AlertDescription>
				</Alert>

				<Alert variant="error" title="Desktop First">
					<Monitor className="h-4 w-4" />
					<AlertDescription>
						Enhanced desktop experience with full features.
					</AlertDescription>
				</Alert>

				<Alert variant="info" title="Cross Platform">
					<Globe className="h-4 w-4" />
					<AlertDescription>
						Works consistently across all devices and platforms.
					</AlertDescription>
				</Alert>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "Responsive alert layouts that adapt to different screen sizes.",
			},
		},
	},
};

export const AdvancedFeatures: Story = {
	render: () => {
		const AdvancedDemo = () => {
			const [notification, setNotification] = useState<{
				variant: string;
				title: string;
				message: string;
				icon: React.ReactNode;
				show: boolean;
			}>({ variant: 'info', title: '', message: '', icon: null, show: false });

			const showNotification = (type: string) => {
				const notifications = {
					security: {
						variant: 'warning',
						title: 'Security Alert',
						message: 'Suspicious login attempt detected from new device. Please verify your identity.',
						icon: <Shield className="h-4 w-4" />
					},
					achievement: {
						variant: 'success',
						title: 'Achievement Unlocked!',
						message: 'Congratulations! You\'ve completed 100 tasks this month.',
						icon: <Award className="h-4 w-4" />
					},
					reminder: {
						variant: 'info',
						title: 'Reminder',
						message: 'You have a meeting scheduled in 15 minutes. Don\'t forget to prepare!',
						icon: <Clock className="h-4 w-4" />
					},
					critical: {
						variant: 'error',
						title: 'Critical System Error',
						message: 'Database connection lost. All unsaved changes may be lost. Please save immediately.',
						icon: <AlertTriangle className="h-4 w-4" />
					}
				};

				setNotification({ ...notifications[type], show: true });
			};

			return (
				<div className="w-96 space-y-4">
					<div className="grid grid-cols-2 gap-2">
						<button
							onClick={() => showNotification('security')}
							className="px-3 py-2 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 transition-colors"
						>
							Security Alert
						</button>
						<button
							onClick={() => showNotification('achievement')}
							className="px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
						>
							Achievement
						</button>
						<button
							onClick={() => showNotification('reminder')}
							className="px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
						>
							Reminder
						</button>
						<button
							onClick={() => showNotification('critical')}
							className="px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
						>
							Critical Error
						</button>
					</div>

					{notification.show && (
						<Alert 
							variant={notification.variant as any} 
							title={notification.title}
							dismissible
							onDismiss={() => setNotification(prev => ({ ...prev, show: false }))}
						>
							{notification.icon}
							<AlertDescription>{notification.message}</AlertDescription>
						</Alert>
					)}
				</div>
			);
		};

		return <AdvancedDemo />;
	},
	parameters: {
		docs: {
			description: {
				story: "Advanced interactive features with dynamic content and user-triggered notifications.",
			},
		},
	},
};
