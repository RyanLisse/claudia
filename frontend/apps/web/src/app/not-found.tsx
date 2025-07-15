"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
	const router = useRouter();

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
						<FileQuestion className="h-8 w-8 text-muted-foreground" />
					</div>
					<CardTitle className="text-2xl font-bold">404 - Page Not Found</CardTitle>
					<CardDescription>
						The page you're looking for doesn't exist or has been moved.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-col gap-2">
						<Button
							onClick={() => router.push("/")}
							className="w-full"
							size="default"
						>
							<Home className="mr-2 h-4 w-4" />
							Go Home
						</Button>
						<Button
							onClick={() => router.back()}
							variant="outline"
							className="w-full"
							size="default"
						>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Go Back
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
