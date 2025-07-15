import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Initialize Neon database connection
const sql = neon(process.env.DATABASE_URL || "");

// Create Drizzle instance with full schema
export const db = drizzle(sql, { schema });

// Export all schema types for convenience
export * from "./schema";
export { sql };
