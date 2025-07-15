import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
	"inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium text-sm ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden",
	{
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95",
				destructive:
					"bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/95",
				outline:
					"border border-input bg-background hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
				secondary:
					"bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70",
				ghost: "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
				link: "text-primary underline-offset-4 hover:underline active:text-primary/80",
			},
			size: {
				default: "h-10 px-4 py-2",
				sm: "h-9 rounded-md px-3",
				lg: "h-11 rounded-md px-8",
				icon: "h-10 w-10",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
	loading?: boolean;
	loadingText?: string;
	startIcon?: React.ReactNode;
	endIcon?: React.ReactNode;
	ripple?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ 
		className, 
		variant, 
		size, 
		asChild = false, 
		loading = false,
		loadingText,
		startIcon,
		endIcon,
		ripple = true,
		children,
		onClick,
		disabled,
		...props 
	}, ref) => {
		const [rippleCoords, setRippleCoords] = React.useState<{x: number, y: number} | null>(null);
		const [isPressed, setIsPressed] = React.useState(false);
		
		const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
			if (ripple && !disabled && !loading) {
				const rect = e.currentTarget.getBoundingClientRect();
				setRippleCoords({
					x: e.clientX - rect.left,
					y: e.clientY - rect.top
				});
				setIsPressed(true);
				setTimeout(() => {
					setRippleCoords(null);
					setIsPressed(false);
				}, 300);
			}
			onClick?.(e);
		};
		
		const Comp = asChild ? Slot : "button";
		const isDisabled = disabled || loading;
		
		return (
			<Comp
				className={cn(
					buttonVariants({ variant, size }),
					loading && "cursor-not-allowed",
					className
				)}
				ref={ref}
				disabled={isDisabled}
				onClick={handleClick}
				{...props}
			>
				{/* Ripple Effect */}
				{ripple && rippleCoords && (
					<span
						className="absolute inset-0 overflow-hidden rounded-md"
						aria-hidden="true"
					>
						<span
							className="absolute bg-white/30 rounded-full pointer-events-none animate-ping"
							style={{
								left: rippleCoords.x - 10,
								top: rippleCoords.y - 10,
								width: 20,
								height: 20,
								animationDuration: '300ms'
							}}
						/>
					</span>
				)}
				
				{/* Content */}
				<span className="flex items-center gap-2">
					{loading && (
						<Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
					)}
					{!loading && startIcon && (
						<span className="flex-shrink-0" aria-hidden="true">{startIcon}</span>
					)}
					<span className={cn(loading && "opacity-70")}>
						{loading && loadingText ? loadingText : children}
					</span>
					{!loading && endIcon && (
						<span className="flex-shrink-0" aria-hidden="true">{endIcon}</span>
					)}
				</span>
			</Comp>
		);
	},
);
Button.displayName = "Button";

export { Button, buttonVariants };
