import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from "lucide-react";
import * as React from "react";
import { cn } from "../../utils";
import { Button } from "../Button";

const alertVariants = cva(
	"relative w-full rounded-lg border p-4 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:top-4 [&>svg]:left-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
	{
		variants: {
			variant: {
				default: "border bg-background text-foreground",
				success:
					"border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200",
				warning:
					"border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
				error:
					"border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
				info: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

const iconMap = {
	default: null,
	success: CheckCircle,
	warning: AlertTriangle,
	error: AlertCircle,
	info: Info,
};

export interface AlertProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof alertVariants> {
	dismissible?: boolean;
	onDismiss?: () => void;
	icon?: React.ReactNode;
	title?: string;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
	{
		className,
		variant = "default",
		dismissible = false,
		onDismiss,
		icon,
		title,
		children,
		...props
	},
	ref,
) {
	const [isVisible, setIsVisible] = React.useState(true);

	const handleDismiss = () => {
		setIsVisible(false);
		onDismiss?.();
	};

	if (!isVisible) return null;

	const IconComponent = iconMap[variant!];
	const alertIcon =
		icon || (IconComponent && <IconComponent className="h-4 w-4" />);

	return (
		<div
			ref={ref}
			role="alert"
			className={cn(alertVariants({ variant }), className)}
			{...props}
		>
			{alertIcon}
			<div className="flex-1">
				{title && (
					<h5 className="mb-1 font-medium leading-none tracking-tight">
						{title}
					</h5>
				)}
				<div className="text-sm [&_p]:leading-relaxed">{children}</div>
			</div>
			{dismissible && (
				<Button
					variant="ghost"
					size="sm"
					className="absolute top-2 right-2 h-6 w-6 p-0"
					onClick={handleDismiss}
					aria-label="Dismiss alert"
				>
					<X className="h-3 w-3" />
				</Button>
			)}
		</div>
	);
});

const AlertTitle = React.forwardRef<
	HTMLHeadingElement,
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

export { Alert, AlertTitle, AlertDescription, alertVariants };
