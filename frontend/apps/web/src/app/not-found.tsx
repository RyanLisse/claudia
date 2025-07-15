"use client";

import { useRouter } from "next/navigation";

export default function NotFound() {
	const router = useRouter();

	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<div className="text-center">
				<h1 className="mb-4 font-bold text-4xl">404 - Page Not Found</h1>
				<p className="mb-4 text-muted-foreground">
					The page you're looking for doesn't exist.
				</p>
				<button
					onClick={() => router.push("/")}
					className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
				>
					Go Home
				</button>
			</div>
		</div>
	);
}
