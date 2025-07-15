import { type NextRequest, NextResponse } from "next/server";

// For static export, we need to handle API routes differently
export const dynamic = "force-static";
export const revalidate = false;

// IMPORTANT: Electric secret should only be accessed server-side
const ELECTRIC_SECRET = process.env.ELECTRIC_SECRET;
const ELECTRIC_SOURCE_ID = process.env.ELECTRIC_SOURCE_ID;
const ELECTRIC_API_URL =
	process.env.ELECTRIC_URL || "https://api.electric-sql.cloud";

/**
 * API route to proxy Electric Cloud requests with authentication
 * This keeps your Electric secret secure on the server
 */
export async function GET(request: NextRequest) {
	try {
		// Get query parameters from the request
		const searchParams = request.nextUrl.searchParams;
		const table = searchParams.get("table");

		if (!table) {
			return NextResponse.json(
				{ error: "Table parameter is required" },
				{ status: 400 },
			);
		}

		if (!ELECTRIC_SOURCE_ID || !ELECTRIC_SECRET) {
			return NextResponse.json(
				{ error: "Electric Cloud not configured" },
				{ status: 500 },
			);
		}

		// Build Electric API URL with authentication
		const electricUrl = new URL(`${ELECTRIC_API_URL}/v1/shape`);

		// Copy all query parameters
		searchParams.forEach((value, key) => {
			if (key !== "source_id" && key !== "secret") {
				electricUrl.searchParams.set(key, value);
			}
		});

		// Add authentication
		electricUrl.searchParams.set("source_id", ELECTRIC_SOURCE_ID);
		electricUrl.searchParams.set("secret", ELECTRIC_SECRET);

		// Fetch from Electric Cloud
		const response = await fetch(electricUrl.toString(), {
			headers: {
				Accept: "application/json",
			},
		});

		if (!response.ok) {
			const _errorText = await response.text();
			return NextResponse.json(
				{ error: "Failed to fetch from Electric Cloud" },
				{ status: response.status },
			);
		}

		// Return the data
		const data = await response.json();
		return NextResponse.json(data);
	} catch (_error) {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

/**
 * Handle streaming/long-polling for live updates
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { table, live, handle, offset } = body;

		if (!table) {
			return NextResponse.json(
				{ error: "Table parameter is required" },
				{ status: 400 },
			);
		}

		if (!ELECTRIC_SOURCE_ID || !ELECTRIC_SECRET) {
			return NextResponse.json(
				{ error: "Electric Cloud not configured" },
				{ status: 500 },
			);
		}

		// Build URL for live updates
		const electricUrl = new URL(`${ELECTRIC_API_URL}/v1/shape`);
		electricUrl.searchParams.set("table", table);
		electricUrl.searchParams.set("source_id", ELECTRIC_SOURCE_ID);
		electricUrl.searchParams.set("secret", ELECTRIC_SECRET);

		if (live) electricUrl.searchParams.set("live", "true");
		if (handle) electricUrl.searchParams.set("handle", handle);
		if (offset) electricUrl.searchParams.set("offset", offset);

		const response = await fetch(electricUrl.toString());

		if (!response.ok) {
			return NextResponse.json(
				{ error: "Failed to fetch from Electric Cloud" },
				{ status: response.status },
			);
		}

		const data = await response.json();
		return NextResponse.json(data);
	} catch (_error) {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
