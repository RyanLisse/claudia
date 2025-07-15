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
				default: "",
				elevated: "shadow-md",
				outlined: "border-2",
			},
		},
		defaultVariants: {
			size: "default",
			variant: "default",
		},
	},
);

export interface CardProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof cardVariants> {
	asChild?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
	{ className, size, variant, ...props },
	ref,
) {
	return (
		<div
			ref={ref}
			className={cn(cardVariants({ size, variant, className }))}
			{...props}
		/>
	);
});

const CardHeader = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(function CardHeader({ className, ...props }, ref) {
	return (
		<div
			ref={ref}
			className={cn("flex flex-col space-y-1.5", className)}
			{...props}
		/>
	);
});

const CardTitle = React.forwardRef<
	HTMLHeadingElement,
	React.HTMLAttributes<HTMLHeadingElement> & {
		as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
	}
>(function CardTitle({ className, as: Component = "h3", ...props }, ref) {
	return (
		<Component
			ref={ref}
			className={cn(
				"font-semibold text-2xl leading-none tracking-tight",
				className,
			)}
			{...props}
		/>
	);
});

const CardDescription = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLParagraphElement>
>(function CardDescription({ className, ...props }, ref) {
	return (
		<p
			ref={ref}
			className={cn("text-muted-foreground text-sm", className)}
			{...props}
		/>
	);
});

const CardContent = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(function CardContent({ className, ...props }, ref) {
	return <div ref={ref} className={cn("pt-0", className)} {...props} />;
});

const CardFooter = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(function CardFooter({ className, ...props }, ref) {
	return (
		<div
			ref={ref}
			className={cn("flex items-center pt-0", className)}
			{...props}
		/>
	);
});

export {
	Card,
	CardHeader,
	CardFooter,
	CardTitle,
	CardDescription,
	CardContent,
	cardVariants,
};
