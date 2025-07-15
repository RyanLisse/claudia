"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	const router = useRouter();

	// Log error to console for debugging
	useEffect(() => {
		console.error("Application Error:", error);
	}, [error]);

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
						<AlertTriangle className="h-8 w-8 text-destructive" />
					</div>
					<CardTitle className="text-2xl font-bold">Something went wrong!</CardTitle>
					<CardDescription>
						An unexpected error occurred while loading this page.
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
					<div className="flex flex-col gap-2">
						<Button
							onClick={() => reset()}
							className="w-full"
							size="default"
						>
							<RefreshCw className="mr-2 h-4 w-4" />
							Try again
						</Button>
						<Button
							onClick={() => router.push("/")}
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
