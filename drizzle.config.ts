import { defineConfig } from 'drizzle-kit';

/**
 * Migrations run against the DIRECT (unpooled) connection: PgBouncer in
 * transaction mode cannot hold the advisory locks and DDL session state that
 * migrations need. Never run these at request time.
 */
export default defineConfig({
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? '',
  },
  strict: true,
  verbose: true,
});
