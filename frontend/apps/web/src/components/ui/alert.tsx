import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const alertVariants = cva(
	"relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground transition-all duration-200",
	{
		variants: {
			variant: {
				default: "bg-background text-foreground border-border",
				destructive:
					"border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive bg-destructive/10",
				success:
					"border-green-500/50 text-green-700 dark:border-green-500/50 dark:text-green-400 [&>svg]:text-green-600 dark:[&>svg]:text-green-400 bg-green-50 dark:bg-green-950/50",
				warning:
					"border-yellow-500/50 text-yellow-700 dark:border-yellow-500/50 dark:text-yellow-400 [&>svg]:text-yellow-600 dark:[&>svg]:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/50",
				info:
					"border-blue-500/50 text-blue-700 dark:border-blue-500/50 dark:text-blue-400 [&>svg]:text-blue-600 dark:[&>svg]:text-blue-400 bg-blue-50 dark:bg-blue-950/50",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

const Alert = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & 
	VariantProps<typeof alertVariants> & {
		dismissible?: boolean;
		onDismiss?: () => void;
		icon?: React.ReactNode;
		autoHide?: boolean;
		autoHideDelay?: number;
	}
>(function Alert({ 
	className, 
	variant, 
	dismissible = false, 
	onDismiss, 
	icon,
	autoHide = false,
	autoHideDelay = 5000,
	children,
	...props 
}, ref) {
	const [isVisible, setIsVisible] = React.useState(true);
	const [isAnimating, setIsAnimating] = React.useState(false);
	
	React.useEffect(() => {
		if (autoHide && autoHideDelay > 0) {
			const timer = setTimeout(() => {
				handleDismiss();
			}, autoHideDelay);
			
			return () => clearTimeout(timer);
		}
	}, [autoHide, autoHideDelay]);
	
	const handleDismiss = () => {
		setIsAnimating(true);
		setTimeout(() => {
			setIsVisible(false);
			onDismiss?.();
		}, 200);
	};
	
	const getDefaultIcon = () => {
		switch (variant) {
			case "destructive":
				return <AlertCircle className="h-4 w-4" />;
			case "success":
				return <CheckCircle className="h-4 w-4" />;
			case "warning":
				return <AlertTriangle className="h-4 w-4" />;
			case "info":
				return <Info className="h-4 w-4" />;
			default:
				return <AlertCircle className="h-4 w-4" />;
		}
	};
	
	if (!isVisible) return null;
	
	return (
		<div
			ref={ref}
			role="alert"
			aria-live="polite"
			className={cn(
				alertVariants({ variant }),
				isAnimating && "animate-out slide-out-to-right-full duration-200",
				className
			)}
			{...props}
		>
			{icon || getDefaultIcon()}
			<div className="flex-1">{children}</div>
			{dismissible && (
				<button
					onClick={handleDismiss}
					className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
					aria-label="Dismiss alert"
				>
					<X className="h-4 w-4" />
				</button>
			)}
		</div>
	);
});

const AlertTitle = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLHeadingElement>
>(function AlertTitle({ className, ...props }, ref) {
	return (
		<h5
			ref={ref}
			className={cn("mb-1 font-medium leading-none tracking-tight", className)}
			{...props}
		/>
	);
});

const AlertDescription = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLParagraphElement>
>(function AlertDescription({ className, ...props }, ref) {
	return (
		<div
			ref={ref}
			className={cn("text-sm [&_p]:leading-relaxed", className)}
			{...props}
		/>
	);
});

export { Alert, AlertTitle, AlertDescription };