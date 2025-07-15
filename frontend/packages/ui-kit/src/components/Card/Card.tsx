import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "../../utils";

const cardVariants = cva(
	"rounded-lg border bg-card text-card-foreground shadow-sm",
	{
		variants: {
			size: {
				sm: "p-4",
				default: "p-6",
				lg: "p-8",
			},
			variant: {
				default: "border-border",
				elevated: "border-border shadow-md",
				outlined: "border-2 border-border shadow-none",
				filled: "bg-muted border-border",
				ghost: "bg-transparent border-transparent shadow-none",
			},
			interactive: {
				true: "cursor-pointer transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
				false: "",
			},
		},
		defaultVariants: {
			size: "default",
			variant: "default",
			interactive: false,
		},
	},
);

const cardHeaderVariants = cva(
	"flex flex-col space-y-1.5",
	{
		variants: {
			align: {
				start: "items-start",
				center: "items-center",
				end: "items-end",
			},
		},
		defaultVariants: {
			align: "start",
		},
	},
);

const cardTitleVariants = cva(
	"font-semibold leading-none tracking-tight",
	{
		variants: {
			size: {
				sm: "text-lg",
				default: "text-2xl",
				lg: "text-3xl",
			},
		},
		defaultVariants: {
			size: "default",
		},
	},
);

const cardDescriptionVariants = cva(
	"text-muted-foreground",
	{
		variants: {
			size: {
				sm: "text-xs",
				default: "text-sm",
				lg: "text-base",
			},
		},
		defaultVariants: {
			size: "default",
		},
	},
);

const cardFooterVariants = cva(
	"flex items-center pt-0",
	{
		variants: {
			justify: {
				start: "justify-start",
				center: "justify-center",
				end: "justify-end",
				between: "justify-between",
			},
		},
		defaultVariants: {
			justify: "start",
		},
	},
);

export interface CardProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof cardVariants> {
	asChild?: boolean;
}

export interface CardHeaderProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof cardHeaderVariants> {}

export interface CardTitleProps
	extends React.HTMLAttributes<HTMLHeadingElement>,
		VariantProps<typeof cardTitleVariants> {
	as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export interface CardDescriptionProps
	extends React.HTMLAttributes<HTMLParagraphElement>,
		VariantProps<typeof cardDescriptionVariants> {}

export interface CardFooterProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof cardFooterVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
	{ className, size, variant, interactive, ...props },
	ref,
) {
	return (
		<div
			ref={ref}
			className={cn(cardVariants({ size, variant, interactive, className }))}
			{...(interactive && {
				role: "button",
				tabIndex: 0,
				"aria-pressed": "false",
			})}
			{...props}
		/>
	);
});

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
	function CardHeader({ className, align, ...props }, ref) {
		return (
			<div
				ref={ref}
				className={cn(cardHeaderVariants({ align }), className)}
				{...props}
			/>
		);
	},
);

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
	function CardTitle({ className, size, as: Component = "h3", ...props }, ref) {
		return (
			<Component
				ref={ref}
				className={cn(cardTitleVariants({ size }), className)}
				{...props}
			/>
		);
	},
);

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
	function CardDescription({ className, size, ...props }, ref) {
		return (
			<p
				ref={ref}
				className={cn(cardDescriptionVariants({ size }), className)}
				{...props}
			/>
		);
	},
);

const CardContent = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(function CardContent({ className, ...props }, ref) {
	return <div ref={ref} className={cn("pt-0", className)} {...props} />;
});

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
	function CardFooter({ className, justify, ...props }, ref) {
		return (
			<div
				ref={ref}
				className={cn(cardFooterVariants({ justify }), className)}
				{...props}
			/>
		);
	},
);

export {
	Card,
	CardHeader,
	CardFooter,
	CardTitle,
	CardDescription,
	CardContent,
	cardVariants,
	cardHeaderVariants,
	cardTitleVariants,
	cardDescriptionVariants,
	cardFooterVariants,
};
