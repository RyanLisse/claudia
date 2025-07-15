import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
	"rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-200",
	{
		variants: {
			variant: {
				default: "border-border",
				outline: "border-2 border-border bg-transparent",
				filled: "border-0 bg-muted",
				elevated: "border-0 shadow-lg",
			},
			size: {
				default: "p-6",
				sm: "p-4",
				lg: "p-8",
				compact: "p-3",
			},
			interactive: {
				true: "cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
				false: "",
			},
			layout: {
				vertical: "flex flex-col",
				horizontal: "flex flex-row items-center gap-4",
				default: "block",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
			interactive: false,
			layout: "default",
		},
	},
);

export interface CardProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof cardVariants> {
	href?: string;
	asChild?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
	function Card({ className, variant, size, interactive, layout, href, asChild, ...props }, ref) {
		const Comp = href ? "a" : "div";
		const isInteractive = interactive || !!href;
		
		return (
			<Comp
				ref={ref}
				href={href}
				className={cn(
					cardVariants({ variant, size, interactive: isInteractive, layout }),
					className,
				)}
				{...props}
			/>
		);
	},
);

const CardHeader = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & {
		centered?: boolean;
	}
>(function CardHeader({ className, centered, ...props }, ref) {
	return (
		<div
			ref={ref}
			className={cn(
				"flex flex-col space-y-1.5 p-6",
				centered && "items-center text-center",
				className
			)}
			{...props}
		/>
	);
});

const CardTitle = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLHeadingElement>
>(function CardTitle({ className, ...props }, ref) {
	return (
		<h3
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
	React.HTMLAttributes<HTMLDivElement> & {
		scrollable?: boolean;
	}
>(function CardContent({ className, scrollable, ...props }, ref) {
	return (
		<div 
			ref={ref} 
			className={cn(
				"p-6 pt-0",
				scrollable && "overflow-y-auto",
				className
			)} 
			{...props} 
		/>
	);
});

const CardFooter = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & {
		justify?: "start" | "center" | "end" | "between" | "around";
	}
>(function CardFooter({ className, justify = "start", ...props }, ref) {
	const justifyClass = {
		start: "justify-start",
		center: "justify-center",
		end: "justify-end",
		between: "justify-between",
		around: "justify-around",
	}[justify];
	
	return (
		<div
			ref={ref}
			className={cn(
				"flex items-center p-6 pt-0",
				justifyClass,
				className
			)}
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
	type CardProps,
};
