import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type Database = ReturnType<typeof createDatabase>['db'];

/**
 * Neon's pooled endpoint runs PgBouncer in transaction mode, which cannot hold
 * server-side prepared statements across checkouts — hence `prepare: false`.
 * Migrations use the unpooled URL instead and never run at request time.
 */
export function createDatabase(connectionString: string, { max = 5 }: { max?: number } = {}) {
  const sql = postgres(connectionString, {
    max,
    prepare: false,
    idle_timeout: 20,
    connect_timeout: 10,
    onnotice: () => {},
  });
  const db = drizzle(sql, { schema });
  return { sql, db };
}
