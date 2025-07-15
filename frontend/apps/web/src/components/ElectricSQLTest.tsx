"use client";

import { useShape } from "@electric-sql/react";

interface TestItem {
	id: string;
	name: string;
	created_at: string;
}

export function ElectricSQLTest() {
	// Test Electric SQL connection with a simple shape
	const { data, isLoading, error } = useShape<TestItem>({
		url: `${process.env.NEXT_PUBLIC_ELECTRIC_URL}/v1/shape`,
		params: {
			table: "items", // Replace with an actual table from your Neon database
			source_id: process.env.NEXT_PUBLIC_ELECTRIC_SOURCE_ID,
		},
	});

	if (isLoading) {
		return (
			<div className="rounded-lg border p-4">
				<h3 className="mb-2 font-semibold text-lg">Electric SQL Test</h3>
				<p className="text-muted-foreground">
					Loading data from Electric SQL...
				</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="rounded-lg border border-destructive p-4">
				<h3 className="mb-2 font-semibold text-destructive text-lg">
					Electric SQL Error
				</h3>
				<p className="text-muted-foreground text-sm">
					Error connecting to Electric SQL: {error.message}
				</p>
				<div className="mt-2 text-muted-foreground text-xs">
					<p>URL: {process.env.NEXT_PUBLIC_ELECTRIC_URL}</p>
					<p>Source ID: {process.env.NEXT_PUBLIC_ELECTRIC_SOURCE_ID}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="rounded-lg border p-4">
			<h3 className="mb-2 font-semibold text-lg">Electric SQL Test</h3>
			<p className="mb-4 text-muted-foreground text-sm">
				Connected to Electric SQL successfully!
			</p>

			<div className="space-y-2">
				<p className="text-sm">
					<strong>Records found:</strong> {data?.length || 0}
				</p>

				{data && data.length > 0 ? (
					<div className="max-h-40 overflow-y-auto">
						<pre className="rounded bg-muted p-2 text-xs">
							{JSON.stringify(data.slice(0, 3), null, 2)}
						</pre>
					</div>
				) : (
					<p className="text-muted-foreground text-sm">
						No data found. Make sure you have a table called 'items' in your
						Neon database.
					</p>
				)}
			</div>

			<div className="mt-4 text-muted-foreground text-xs">
				<p>Electric URL: {process.env.NEXT_PUBLIC_ELECTRIC_URL}</p>
				<p>
					Source ID:{" "}
					{process.env.NEXT_PUBLIC_ELECTRIC_SOURCE_ID?.substring(0, 8)}...
				</p>
			</div>
		</div>
	);
}
