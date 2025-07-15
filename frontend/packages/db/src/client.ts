import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

// Migration helper
export async function runMigrations() {
  const { migrate } = await import('drizzle-orm/neon-http/migrator');
  await migrate(db, { migrationsFolder: './drizzle' });
}

// Export SQL client for raw queries
export { sql };