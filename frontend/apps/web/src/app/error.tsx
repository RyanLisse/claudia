"use client";

import { useRouter } from "next/navigation";

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	const router = useRouter();

	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<div className="text-center">
				<h1 className="mb-4 font-bold text-4xl">Something went wrong!</h1>
				<p className="mb-4 text-muted-foreground">
					An error occurred while loading this page.
				</p>
				<div className="space-x-4">
					<button
						onClick={() => reset()}
						className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
					>
						Try again
					</button>
					<button
						onClick={() => router.push("/")}
						className="rounded bg-secondary px-4 py-2 text-secondary-foreground hover:bg-secondary/90"
					>
						Go Home
					</button>
				</div>
			</div>
		</div>
	);
}
