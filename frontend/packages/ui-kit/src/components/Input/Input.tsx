import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "../../utils";

// React 19 compatible ID generation hook
const useInputId = () => {
	const id =
		React.useId?.() ||
		React.useMemo(() => `input-${Math.random().toString(36).substr(2, 9)}`, []);
	return id;
};

const inputVariants = cva(
	"flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
	{
		variants: {
			size: {
				sm: "h-8 px-2 text-xs",
				default: "h-10",
				lg: "h-12 px-4 text-base",
			},
			variant: {
				default: "",
				error: "border-destructive focus-visible:ring-destructive",
				success: "border-green-500 focus-visible:ring-green-500",
			},
		},
		defaultVariants: {
			size: "default",
			variant: "default",
		},
	},
);

export interface InputProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
		VariantProps<typeof inputVariants> {
	label?: string;
	description?: string;
	error?: string;
	success?: string;
	leftIcon?: React.ReactNode;
	rightIcon?: React.ReactNode;
	leftAddon?: React.ReactNode;
	rightAddon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
	{
		className,
		type = "text",
		size = "default",
		variant,
		label,
		description,
		error,
		success,
		leftIcon,
		rightIcon,
		leftAddon,
		rightAddon,
		id: providedId,
		...props
	},
	ref,
) {
	const generatedId = useInputId();
	const id = providedId || generatedId;
	const descriptionId = description ? `${id}-description` : undefined;
	const errorId = error ? `${id}-error` : undefined;
	const successId = success ? `${id}-success` : undefined;

	// Determine variant based on error/success states
	const resolvedVariant = error ? "error" : success ? "success" : variant;

	const inputElement = (
		<div className="relative">
			{leftIcon && (
				<div className="-translate-y-1/2 absolute top-1/2 left-3 text-muted-foreground">
					{leftIcon}
				</div>
			)}
			<input
				type={type}
				className={cn(
					inputVariants({ size, variant: resolvedVariant }),
					leftIcon && "pl-10",
					rightIcon && "pr-10",
					className,
				)}
				ref={ref}
				id={id}
				aria-describedby={
					[descriptionId, errorId, successId].filter(Boolean).join(" ") ||
					undefined
				}
				aria-invalid={error ? "true" : undefined}
				{...props}
			/>
			{rightIcon && (
				<div className="-translate-y-1/2 absolute top-1/2 right-3 text-muted-foreground">
					{rightIcon}
				</div>
			)}
		</div>
	);

	const wrappedInput =
		leftAddon || rightAddon ? (
			<div className="flex">
				{leftAddon && (
					<div className="inline-flex items-center rounded-l-md border border-input border-r-0 bg-muted px-3 text-muted-foreground text-sm">
						{leftAddon}
					</div>
				)}
				<div
					className={cn(
						"flex-1",
						leftAddon && "[&>div>input]:rounded-l-none",
						rightAddon && "[&>div>input]:rounded-r-none",
					)}
				>
					{inputElement}
				</div>
				{rightAddon && (
					<div className="inline-flex items-center rounded-r-md border border-input border-l-0 bg-muted px-3 text-muted-foreground text-sm">
						{rightAddon}
					</div>
				)}
			</div>
		) : (
			inputElement
		);

	if (!label && !description && !error && !success) {
		return wrappedInput;
	}

	return (
		<div className="space-y-2">
			{label && (
				<label
					htmlFor={id}
					className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
				>
					{label}
				</label>
			)}
			{description && (
				<p id={descriptionId} className="text-muted-foreground text-sm">
					{description}
				</p>
			)}
			{wrappedInput}
			{error && (
				<p id={errorId} className="text-destructive text-sm" role="alert">
					{error}
				</p>
			)}
			{success && !error && (
				<p id={successId} className="text-green-600 text-sm">
					{success}
				</p>
			)}
		</div>
	);
});

export { Input, inputVariants };
