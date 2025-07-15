import type { Meta, StoryObj } from "@storybook/react";
import { Calendar, Heart, MessageCircle, Share } from "lucide-react";
import { Button } from "../src/components/Button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../src/components/Card";

const meta = {
	title: "Components/Card",
	component: Card,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"A flexible card component for displaying content in a contained, organized manner. Includes header, content, and footer sections.",
			},
		},
	},
	tags: ["autodocs"],
	argTypes: {
		size: {
			control: { type: "select" },
			options: ["sm", "default", "lg"],
			description: "The padding size of the card",
		},
		variant: {
			control: { type: "select" },
			options: ["default", "elevated", "outlined"],
			description: "The visual variant of the card",
		},
	},
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<Card className="w-80">
			<CardHeader>
				<CardTitle>Card Title</CardTitle>
				<CardDescription>Card description goes here</CardDescription>
			</CardHeader>
			<CardContent>
				<p>This is the main content of the card.</p>
			</CardContent>
			<CardFooter>
				<Button>Action</Button>
			</CardFooter>
		</Card>
	),
};

export const Sizes: Story = {
	render: () => (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
			<Card size="sm" className="w-64">
				<CardHeader>
					<CardTitle as="h4">Small Card</CardTitle>
					<CardDescription>Compact size with less padding</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-sm">Small card content with minimal spacing.</p>
				</CardContent>
			</Card>

			<Card size="default" className="w-64">
				<CardHeader>
					<CardTitle>Default Card</CardTitle>
					<CardDescription>Standard size with normal padding</CardDescription>
				</CardHeader>
				<CardContent>
					<p>Default card content with standard spacing.</p>
				</CardContent>
			</Card>

			<Card size="lg" className="w-64">
				<CardHeader>
					<CardTitle>Large Card</CardTitle>
					<CardDescription>Spacious size with extra padding</CardDescription>
				</CardHeader>
				<CardContent>
					<p>Large card content with generous spacing.</p>
				</CardContent>
			</Card>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "Different padding sizes for cards.",
			},
		},
	},
};

export const Variants: Story = {
	render: () => (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
			<Card variant="default" className="w-64">
				<CardHeader>
					<CardTitle>Default</CardTitle>
					<CardDescription>Standard card style</CardDescription>
				</CardHeader>
				<CardContent>
					<p>Basic card with subtle shadow.</p>
				</CardContent>
			</Card>

			<Card variant="elevated" className="w-64">
				<CardHeader>
					<CardTitle>Elevated</CardTitle>
					<CardDescription>Enhanced shadow for prominence</CardDescription>
				</CardHeader>
				<CardContent>
					<p>Elevated card with stronger shadow.</p>
				</CardContent>
			</Card>

			<Card variant="outlined" className="w-64">
				<CardHeader>
					<CardTitle>Outlined</CardTitle>
					<CardDescription>Prominent border style</CardDescription>
				</CardHeader>
				<CardContent>
					<p>Outlined card with thicker border.</p>
				</CardContent>
			</Card>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "Different visual variants of cards.",
			},
		},
	},
};

export const BlogPost: Story = {
	render: () => (
		<Card className="w-96">
			<CardHeader>
				<div className="mb-2 flex items-center space-x-2 text-muted-foreground text-sm">
					<Calendar className="h-4 w-4" />
					<span>March 15, 2024</span>
				</div>
				<CardTitle>Getting Started with React</CardTitle>
				<CardDescription>
					Learn the fundamentals of React and start building modern web
					applications.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<p className="text-muted-foreground text-sm">
					React is a powerful JavaScript library for building user interfaces.
					In this guide, we'll cover the basics and help you create your first
					component.
				</p>
			</CardContent>
			<CardFooter className="flex justify-between">
				<div className="flex space-x-2">
					<Button variant="ghost" size="sm">
						<Heart className="mr-2 h-4 w-4" />
						24
					</Button>
					<Button variant="ghost" size="sm">
						<MessageCircle className="mr-2 h-4 w-4" />8
					</Button>
				</div>
				<Button variant="ghost" size="sm">
					<Share className="h-4 w-4" />
				</Button>
			</CardFooter>
		</Card>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Example of a blog post card with metadata, actions, and social interactions.",
			},
		},
	},
};

export const ProductCard: Story = {
	render: () => (
		<Card className="w-80">
			<CardHeader className="pb-3">
				<div className="mb-3 flex aspect-video items-center justify-center rounded-md bg-muted">
					<span className="text-muted-foreground">Product Image</span>
				</div>
				<CardTitle>Wireless Headphones</CardTitle>
				<CardDescription>Premium noise-cancelling headphones</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex items-center justify-between">
					<div className="font-bold text-2xl">$299.99</div>
					<div className="text-muted-foreground text-sm line-through">
						$399.99
					</div>
				</div>
				<p className="mt-2 text-muted-foreground text-sm">
					25% off limited time offer
				</p>
			</CardContent>
			<CardFooter className="flex space-x-2">
				<Button className="flex-1">Add to Cart</Button>
				<Button variant="outline" size="icon">
					<Heart className="h-4 w-4" />
				</Button>
			</CardFooter>
		</Card>
	),
	parameters: {
		docs: {
			description: {
				story: "Example of a product card with image, pricing, and actions.",
			},
		},
	},
};

export const StatCard: Story = {
	render: () => (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">Total Revenue</CardTitle>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						className="h-4 w-4 text-muted-foreground"
					>
						<path d="M12 2v20m5-5l-5 5-5-5" />
					</svg>
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">$45,231.89</div>
					<p className="text-muted-foreground text-xs">
						+20.1% from last month
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">Subscriptions</CardTitle>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						className="h-4 w-4 text-muted-foreground"
					>
						<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
						<circle cx="9" cy="7" r="4" />
						<path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
					</svg>
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">+2350</div>
					<p className="text-muted-foreground text-xs">
						+180.1% from last month
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">Sales</CardTitle>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						className="h-4 w-4 text-muted-foreground"
					>
						<rect width="20" height="14" x="2" y="5" rx="2" />
						<path d="M2 10h20" />
					</svg>
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">+12,234</div>
					<p className="text-muted-foreground text-xs">+19% from last month</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">Active Now</CardTitle>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						className="h-4 w-4 text-muted-foreground"
					>
						<path d="M22 12h-4l-3 9L9 3l-3 9H2" />
					</svg>
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">+573</div>
					<p className="text-muted-foreground text-xs">+201 since last hour</p>
				</CardContent>
			</Card>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "Example of dashboard statistics cards with icons and metrics.",
			},
		},
	},
};
