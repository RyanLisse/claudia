import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "../../utils";

const badgeVariants = cva(
	"inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
	{
		variants: {
			variant: {
				default:
					"border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
				secondary:
					"border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
				destructive:
					"border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
				success:
					"border-transparent bg-green-500 text-white hover:bg-green-600",
				warning:
					"border-transparent bg-yellow-500 text-white hover:bg-yellow-600",
				outline: "border-current text-foreground",
				ghost:
					"border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground",
			},
			size: {
				default: "px-2.5 py-0.5 text-xs",
				sm: "px-2 py-0.5 text-xs",
				lg: "px-3 py-1 text-sm",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

export interface BadgeProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof badgeVariants> {
	removable?: boolean;
	onRemove?: () => void;
	icon?: React.ReactNode;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(function Badge(
	{
		className,
		variant,
		size,
		removable = false,
		onRemove,
		icon,
		children,
		...props
	},
	ref,
) {
	return (
		<div
			className={cn(badgeVariants({ variant, size }), className)}
			ref={ref}
			{...props}
		>
			{icon && (
				<span className="mr-1" aria-hidden="true">
					{icon}
				</span>
			)}
			{children}
			{removable && (
				<button
					type="button"
					className="ml-1 inline-flex h-3 w-3 items-center justify-center rounded-full hover:bg-black/20 focus:bg-black/20 focus:outline-none dark:focus:bg-white/20 dark:hover:bg-white/20"
					onClick={onRemove}
					aria-label="Remove badge"
				>
					<svg
						className="h-2 w-2"
						stroke="currentColor"
						fill="none"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			)}
		</div>
	);
});

export { Badge, badgeVariants };
