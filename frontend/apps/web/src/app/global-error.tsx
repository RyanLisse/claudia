"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<html>
			<body>
				<div className="flex min-h-screen items-center justify-center bg-background p-4">
					<Card className="w-full max-w-md">
						<CardHeader className="text-center">
							<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
								<AlertTriangle className="h-8 w-8 text-destructive" />
							</div>
							<CardTitle className="text-2xl font-bold">Application Error</CardTitle>
							<CardDescription>
								A critical error occurred in the application.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{process.env.NODE_ENV === "development" && (
								<div className="rounded-md bg-muted p-3 text-xs">
									<p className="font-mono text-destructive">
										{error.message}
									</p>
									{error.digest && (
										<p className="mt-2 text-muted-foreground">
											Digest: {error.digest}
										</p>
									)}
								</div>
							)}
							<Button
								onClick={() => reset()}
								className="w-full"
								size="default"
							>
								<RefreshCw className="mr-2 h-4 w-4" />
								Try again
							</Button>
						</CardContent>
					</Card>
				</div>
			</body>
		</html>
	);
}