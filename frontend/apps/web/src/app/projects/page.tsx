"use client";

export default function ProjectsPage() {
	return (
		<div className="min-h-screen bg-background p-6">
			<div className="container mx-auto">
				<div className="mb-6">
					<button
						onClick={() => (window.location.href = "/")}
						className="mb-4 text-muted-foreground text-sm hover:text-foreground"
					>
						← Back to Home
					</button>
					<h1 className="font-bold text-3xl tracking-tight">CC Projects</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						Browse your Claude Code sessions
					</p>
				</div>

				<div className="py-8 text-center">
					<p className="text-muted-foreground text-sm">
						Projects functionality will be migrated here from the existing Vite
						app.
					</p>
				</div>
			</div>
		</div>
	);
}
