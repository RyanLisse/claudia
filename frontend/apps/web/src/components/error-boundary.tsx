"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error?: Error;
	errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
	public state: State = {
		hasError: false,
	};

	public static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error("ErrorBoundary caught an error:", error, errorInfo);
		
		this.setState({
			error,
			errorInfo,
		});

		// Report to error tracking service if available
		if (typeof window !== "undefined" && window.gtag) {
			window.gtag("event", "exception", {
				description: error.message,
				fatal: false,
			});
		}
	}

	public render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<div className="flex min-h-[400px] items-center justify-center p-4">
					<Card className="w-full max-w-md">
						<CardHeader className="text-center">
							<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
								<AlertTriangle className="h-8 w-8 text-destructive" />
							</div>
							<CardTitle className="text-xl font-bold">Something went wrong</CardTitle>
							<CardDescription>
								An error occurred in this component.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{process.env.NODE_ENV === "development" && this.state.error && (
								<div className="rounded-md bg-muted p-3 text-xs">
									<p className="font-mono text-destructive">
										{this.state.error.message}
									</p>
									{this.state.error.stack && (
										<pre className="mt-2 text-muted-foreground overflow-auto">
											{this.state.error.stack}
										</pre>
									)}
								</div>
							)}
							<div className="flex flex-col gap-2">
								<Button
									onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
									className="w-full"
									size="default"
								>
									<RefreshCw className="mr-2 h-4 w-4" />
									Try again
								</Button>
								<Button
									onClick={() => window.location.href = "/"}
									variant="outline"
									className="w-full"
									size="default"
								>
									<Home className="mr-2 h-4 w-4" />
									Go Home
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			);
		}

		return this.props.children;
	}
}

// Functional component wrapper for easier use
export function withErrorBoundary<T extends Record<string, any>>(
	Component: React.ComponentType<T>,
	fallback?: ReactNode
) {
	return function WrappedComponent(props: T) {
		return (
			<ErrorBoundary fallback={fallback}>
				<Component {...props} />
			</ErrorBoundary>
		);
	};
}