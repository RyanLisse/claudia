import { useCallback, useState } from "react";

export interface ErrorInfo {
	message: string;
	stack?: string;
	componentStack?: string;
	timestamp: number;
	digest?: string;
	action?: string;
	url?: string;
	userAgent?: string;
}

export function useErrorBoundary() {
	const [error, setError] = useState<ErrorInfo | null>(null);

	const captureError = useCallback((error: Error, errorInfo?: { componentStack?: string; action?: string }) => {
		const errorDetails: ErrorInfo = {
			message: error.message,
			stack: error.stack,
			componentStack: errorInfo?.componentStack,
			timestamp: Date.now(),
			digest: (error as any).digest,
			action: errorInfo?.action,
			url: typeof window !== "undefined" ? window.location.href : undefined,
			userAgent: typeof window !== "undefined" ? window.navigator.userAgent : undefined,
		};

		setError(errorDetails);
		
		// Log to console for debugging
		console.error("Error caught by boundary:", error, errorInfo);
		
		// Report to error tracking service if available
		if (typeof window !== "undefined" && window.gtag) {
			window.gtag("event", "exception", {
				description: error.message,
				fatal: false,
			});
		}

		// Report to Sentry if available
		if (typeof window !== "undefined" && (window as any).Sentry) {
			(window as any).Sentry.captureException(error, {
				extra: errorDetails,
			});
		}
	}, []);

	const clearError = useCallback(() => {
		setError(null);
	}, []);

	const throwError = useCallback((error: Error) => {
		throw error;
	}, []);

	return {
		error,
		captureError,
		clearError,
		throwError,
		hasError: error !== null,
	};
}

export function useAsyncError() {
	const [, setError] = useState<Error | null>(null);

	return useCallback((error: Error) => {
		setError(() => {
			throw error;
		});
	}, []);
}