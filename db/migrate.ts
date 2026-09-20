import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { createDatabase } from './client';

/**
 * Migrations always use the direct (unpooled) connection, and always run as a
 * deploy step — never at request time.
 */
async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL_UNPOOLED or DATABASE_URL must be set');

  const { sql, db } = createDatabase(url, { max: 1 });
  try {
    await migrate(db, { migrationsFolder: './db/migrations' });
    console.log('migrations applied');
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error('migration failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
