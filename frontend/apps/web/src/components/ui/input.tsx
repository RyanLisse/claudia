import type * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const inputVariants = cva(
	"flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] file:inline-flex file:h-7 file:border-0 file:bg-transparent file:font-medium file:text-foreground file:text-sm placeholder:text-muted-foreground/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
	{
		variants: {
			variant: {
				default: "border-input",
				error: "border-destructive ring-destructive/20 dark:ring-destructive/40",
				success: "border-green-500 ring-green-500/20 dark:ring-green-500/40",
				warning: "border-yellow-500 ring-yellow-500/20 dark:ring-yellow-500/40",
			},
			size: {
				default: "h-9 px-3 py-1",
				sm: "h-8 px-2 py-0.5 text-xs",
				lg: "h-10 px-4 py-2",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	}
);

export interface InputProps
	extends React.ComponentProps<"input">,
		VariantProps<typeof inputVariants> {
	// Enhanced props
	label?: string;
	error?: string;
	success?: string;
	warning?: string;
	helperText?: string;
	floatingLabel?: boolean;
	startIcon?: React.ReactNode;
	endIcon?: React.ReactNode;
	clearable?: boolean;
	onClear?: () => void;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	function Input(
		{
			className,
			type,
			variant,
			size,
			label,
			error,
			success,
			warning,
			helperText,
			floatingLabel,
			startIcon,
			endIcon,
			clearable,
			onClear,
			placeholder,
			value,
			...props
		},
		ref
	) {
		const [isFocused, setIsFocused] = React.useState(false);
		const [hasValue, setHasValue] = React.useState(Boolean(value));

		React.useEffect(() => {
			setHasValue(Boolean(value));
		}, [value]);

		const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
			setIsFocused(true);
			props.onFocus?.(e);
		};

		const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
			setIsFocused(false);
			props.onBlur?.(e);
		};

		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			setHasValue(Boolean(e.target.value));
			props.onChange?.(e);
		};

		const handleClear = () => {
			setHasValue(false);
			onClear?.();
		};

		// Determine validation state
		const validationVariant = error
			? "error"
			: success
			? "success"
			: warning
			? "warning"
			: variant || "default";

		const inputElement = (
			<input
				ref={ref}
				type={type}
				value={value}
				placeholder={floatingLabel ? "" : placeholder}
				data-slot="input"
				className={cn(
					inputVariants({ variant: validationVariant, size, className }),
					"focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
					"aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
					type === "search" &&
						"[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none",
					type === "file" &&
						"p-0 pr-3 text-muted-foreground/70 italic file:me-3 file:h-full file:border-0 file:border-input file:border-r file:border-solid file:bg-transparent file:px-3 file:font-medium file:text-foreground file:text-sm file:not-italic",
					startIcon && "pl-10",
					endIcon && "pr-10",
					clearable && hasValue && "pr-10"
				)}
				onFocus={handleFocus}
				onBlur={handleBlur}
				onChange={handleChange}
				aria-invalid={!!error}
				aria-describedby={
					error
						? `${props.id}-error`
						: success
						? `${props.id}-success`
						: warning
						? `${props.id}-warning`
						: helperText
						? `${props.id}-helper`
						: undefined
				}
				{...props}
			/>
		);

		const inputWrapper = (
			<div className="relative">
				{/* Start Icon */}
				{startIcon && (
					<div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
						{startIcon}
					</div>
				)}

				{/* Floating Label */}
				{floatingLabel && label && (
					<label
						htmlFor={props.id}
						className={cn(
							"absolute left-3 transition-all duration-200 pointer-events-none",
							isFocused || hasValue
								? "top-0 -translate-y-1/2 text-xs bg-background px-1 text-foreground"
								: "top-1/2 -translate-y-1/2 text-sm text-muted-foreground",
							startIcon && "left-10"
						)}
					>
						{label}
					</label>
				)}

				{inputElement}

				{/* End Icon */}
				{endIcon && !clearable && (
					<div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
						{endIcon}
					</div>
				)}

				{/* Clear Button */}
				{clearable && hasValue && (
					<button
						type="button"
						onClick={handleClear}
						className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
						aria-label="Clear input"
					>
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<line x1="18" y1="6" x2="6" y2="18"></line>
							<line x1="6" y1="6" x2="18" y2="18"></line>
						</svg>
					</button>
				)}
			</div>
		);

		return (
			<div className="space-y-2">
				{/* Static Label */}
				{!floatingLabel && label && (
					<label
						htmlFor={props.id}
						className="block text-sm font-medium text-foreground"
					>
						{label}
					</label>
				)}

				{inputWrapper}

				{/* Validation and Helper Text */}
				{error && (
					<p
						id={`${props.id}-error`}
						className="text-sm text-destructive flex items-center gap-1"
						role="alert"
					>
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<circle cx="12" cy="12" r="10"></circle>
							<line x1="15" y1="9" x2="9" y2="15"></line>
							<line x1="9" y1="9" x2="15" y2="15"></line>
						</svg>
						{error}
					</p>
				)}

				{success && (
					<p
						id={`${props.id}-success`}
						className="text-sm text-green-600 flex items-center gap-1"
					>
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
							<polyline points="22,4 12,14.01 9,11.01"></polyline>
						</svg>
						{success}
					</p>
				)}

				{warning && (
					<p
						id={`${props.id}-warning`}
						className="text-sm text-yellow-600 flex items-center gap-1"
					>
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
							<line x1="12" y1="9" x2="12" y2="13"></line>
							<line x1="12" y1="17" x2="12.01" y2="17"></line>
						</svg>
						{warning}
					</p>
				)}

				{helperText && !error && !success && !warning && (
					<p
						id={`${props.id}-helper`}
						className="text-sm text-muted-foreground"
					>
						{helperText}
					</p>
				)}
			</div>
		);
	}
);

Input.displayName = "Input";

export { Input };