// Electric Cloud client configuration
// IMPORTANT: Never expose your Electric secret in client-side code!

export const ELECTRIC_CONFIG = {
	// Base URL for Electric Cloud API
	baseUrl:
		process.env.NEXT_PUBLIC_ELECTRIC_URL || "https://api.electric-sql.cloud",

	// Source ID is safe to expose client-side
	sourceId: process.env.NEXT_PUBLIC_ELECTRIC_SOURCE_ID,

	// API version
	apiVersion: "v1",
} as const;

/**
 * Get the Electric API endpoint for shapes
 * Note: Authentication should be handled server-side
 */
export function getElectricShapeUrl(
	table: string,
	params?: Record<string, string>,
) {
	const url = new URL(
		`${ELECTRIC_CONFIG.baseUrl}/${ELECTRIC_CONFIG.apiVersion}/shape`,
	);

	// Add table parameter
	url.searchParams.set("table", table);

	// Add source_id if available
	if (ELECTRIC_CONFIG.sourceId) {
		url.searchParams.set("source_id", ELECTRIC_CONFIG.sourceId);
	}

	// Add any additional parameters
	if (params) {
		Object.entries(params).forEach(([key, value]) => {
			url.searchParams.set(key, value);
		});
	}

	return url.toString();
}

/**
 * IMPORTANT: Authentication should be handled through your backend!
 *
 * The Electric source secret should NEVER be exposed to the client.
 * Instead, implement one of these patterns:
 *
 * 1. Proxy Pattern: Route requests through your API
 * 2. Token Pattern: Generate temporary auth tokens
 * 3. Edge Function: Use Vercel Edge Functions for auth
 */
export async function fetchElectricShape(
	table: string,
	options?: {
		params?: Record<string, string>;
		authToken?: string; // Token from your backend
	},
) {
	const url = getElectricShapeUrl(table, options?.params);

	const headers: HeadersInit = {
		"Content-Type": "application/json",
	};

	// If you have an auth token from your backend
	if (options?.authToken) {
		headers.Authorization = `Bearer ${options.authToken}`;
	}

	const response = await fetch(url, { headers });

	if (!response.ok) {
		throw new Error(
			`Electric API error: ${response.status} ${response.statusText}`,
		);
	}

	return response.json();
}
