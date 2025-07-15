import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';
import { Button } from './button';
import { Heart, Star, Share, MoreVertical } from 'lucide-react';

const meta = {
	title: 'Components/Card',
	component: Card,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	argTypes: {
		variant: {
			control: 'select',
			options: ['default', 'outline', 'filled', 'elevated'],
		},
		size: {
			control: 'select',
			options: ['default', 'sm', 'lg', 'compact'],
		},
		interactive: {
			control: 'boolean',
		},
		layout: {
			control: 'select',
			options: ['default', 'vertical', 'horizontal'],
		},
	},
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic card
export const Default: Story = {
	args: {
		children: (
			<>
				<CardHeader>
					<CardTitle>Card Title</CardTitle>
					<CardDescription>
						This is a description of the card content.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p>This is the main content of the card.</p>
				</CardContent>
				<CardFooter>
					<Button>Action</Button>
				</CardFooter>
			</>
		),
	},
};

// Variants
export const Outline: Story = {
	args: {
		variant: 'outline',
		children: (
			<>
				<CardHeader>
					<CardTitle>Outline Card</CardTitle>
					<CardDescription>
						This card has an outline variant.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p>Content with outline styling.</p>
				</CardContent>
			</>
		),
	},
};

export const Filled: Story = {
	args: {
		variant: 'filled',
		children: (
			<>
				<CardHeader>
					<CardTitle>Filled Card</CardTitle>
					<CardDescription>
						This card has a filled background.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p>Content with filled styling.</p>
				</CardContent>
			</>
		),
	},
};

export const Elevated: Story = {
	args: {
		variant: 'elevated',
		children: (
			<>
				<CardHeader>
					<CardTitle>Elevated Card</CardTitle>
					<CardDescription>
						This card has an elevated shadow.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p>Content with elevated styling.</p>
				</CardContent>
			</>
		),
	},
};

// Sizes
export const Small: Story = {
	args: {
		size: 'sm',
		children: (
			<>
				<CardHeader>
					<CardTitle>Small Card</CardTitle>
					<CardDescription>Compact card with less padding.</CardDescription>
				</CardHeader>
				<CardContent>
					<p>Small content area.</p>
				</CardContent>
			</>
		),
	},
};

export const Large: Story = {
	args: {
		size: 'lg',
		children: (
			<>
				<CardHeader>
					<CardTitle>Large Card</CardTitle>
					<CardDescription>Spacious card with more padding.</CardDescription>
				</CardHeader>
				<CardContent>
					<p>Large content area with more breathing room.</p>
				</CardContent>
			</>
		),
	},
};

export const Compact: Story = {
	args: {
		size: 'compact',
		children: (
			<>
				<CardHeader>
					<CardTitle>Compact Card</CardTitle>
				</CardHeader>
				<CardContent>
					<p>Minimal padding for dense layouts.</p>
				</CardContent>
			</>
		),
	},
};

// Interactive
export const Interactive: Story = {
	args: {
		interactive: true,
		children: (
			<>
				<CardHeader>
					<CardTitle>Interactive Card</CardTitle>
					<CardDescription>
						This card responds to hover and click events.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p>Click me to see the interaction!</p>
				</CardContent>
			</>
		),
	},
};

export const LinkCard: Story = {
	args: {
		href: '#',
		children: (
			<>
				<CardHeader>
					<CardTitle>Link Card</CardTitle>
					<CardDescription>
						This card acts as a link.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p>Click anywhere to navigate.</p>
				</CardContent>
			</>
		),
	},
};

// Layouts
export const Horizontal: Story = {
	args: {
		layout: 'horizontal',
		className: 'w-full max-w-md',
		children: (
			<>
				<div className="flex-shrink-0 w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
					<Heart className="h-8 w-8 text-muted-foreground" />
				</div>
				<div className="min-w-0 flex-1">
					<CardHeader className="p-0">
						<CardTitle className="text-base">Horizontal Card</CardTitle>
						<CardDescription>
							Content flows horizontally.
						</CardDescription>
					</CardHeader>
				</div>
			</>
		),
	},
};

// Advanced examples
export const ProductCard: Story = {
	render: () => (
		<Card className="w-72" interactive>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle>Product Name</CardTitle>
					<button className="p-1 hover:bg-accent rounded-sm">
						<MoreVertical className="h-4 w-4" />
					</button>
				</div>
				<CardDescription>
					A great product description that tells you everything you need to know.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<span className="text-2xl font-bold">$29.99</span>
						<div className="flex items-center gap-1">
							<Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
							<span className="text-sm">4.5</span>
						</div>
					</div>
					<div className="flex gap-2">
						<span className="px-2 py-1 bg-muted rounded text-xs">Tag 1</span>
						<span className="px-2 py-1 bg-muted rounded text-xs">Tag 2</span>
					</div>
				</div>
			</CardContent>
			<CardFooter className="gap-2">
				<Button className="flex-1">Add to Cart</Button>
				<Button variant="outline" size="icon">
					<Heart className="h-4 w-4" />
				</Button>
				<Button variant="outline" size="icon">
					<Share className="h-4 w-4" />
				</Button>
			</CardFooter>
		</Card>
	),
};

export const UserCard: Story = {
	render: () => (
		<Card className="w-80">
			<CardHeader centered>
				<div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl mb-4">
					JD
				</div>
				<CardTitle>John Doe</CardTitle>
				<CardDescription>Frontend Developer</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground">Location</span>
						<span>San Francisco, CA</span>
					</div>
					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground">Experience</span>
						<span>5+ years</span>
					</div>
					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground">Skills</span>
						<span>React, TypeScript</span>
					</div>
				</div>
			</CardContent>
			<CardFooter justify="between">
				<Button variant="outline">View Profile</Button>
				<Button>Connect</Button>
			</CardFooter>
		</Card>
	),
};

export const StatCard: Story = {
	render: () => (
		<Card size="compact" className="w-48">
			<CardContent className="p-4">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-sm font-medium text-muted-foreground">Total Sales</p>
						<p className="text-2xl font-bold">$12,345</p>
					</div>
					<div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
						<span className="text-green-600 text-sm">↑</span>
					</div>
				</div>
				<p className="text-xs text-muted-foreground mt-2">+12% from last month</p>
			</CardContent>
		</Card>
	),
};

// Layout examples
export const CardGrid: Story = {
	render: () => (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
			<Card>
				<CardHeader>
					<CardTitle>Card 1</CardTitle>
					<CardDescription>First card in the grid</CardDescription>
				</CardHeader>
				<CardContent>
					<p>Content for the first card.</p>
				</CardContent>
			</Card>
			<Card variant="outline">
				<CardHeader>
					<CardTitle>Card 2</CardTitle>
					<CardDescription>Second card in the grid</CardDescription>
				</CardHeader>
				<CardContent>
					<p>Content for the second card.</p>
				</CardContent>
			</Card>
			<Card variant="filled">
				<CardHeader>
					<CardTitle>Card 3</CardTitle>
					<CardDescription>Third card in the grid</CardDescription>
				</CardHeader>
				<CardContent>
					<p>Content for the third card.</p>
				</CardContent>
			</Card>
		</div>
	),
};

export const VariantShowcase: Story = {
	render: () => (
		<div className="space-y-6 w-full max-w-2xl">
			<Card>
				<CardHeader>
					<CardTitle>Default Card</CardTitle>
					<CardDescription>Standard card with default styling</CardDescription>
				</CardHeader>
				<CardContent>
					<p>This is the default card variant.</p>
				</CardContent>
			</Card>
			<Card variant="outline">
				<CardHeader>
					<CardTitle>Outline Card</CardTitle>
					<CardDescription>Card with outline border</CardDescription>
				</CardHeader>
				<CardContent>
					<p>This is the outline card variant.</p>
				</CardContent>
			</Card>
			<Card variant="filled">
				<CardHeader>
					<CardTitle>Filled Card</CardTitle>
					<CardDescription>Card with filled background</CardDescription>
				</CardHeader>
				<CardContent>
					<p>This is the filled card variant.</p>
				</CardContent>
			</Card>
			<Card variant="elevated">
				<CardHeader>
					<CardTitle>Elevated Card</CardTitle>
					<CardDescription>Card with elevated shadow</CardDescription>
				</CardHeader>
				<CardContent>
					<p>This is the elevated card variant.</p>
				</CardContent>
			</Card>
		</div>
	),
};