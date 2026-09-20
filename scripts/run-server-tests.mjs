/**
 * The server suite needs a real Postgres. When TEST_DATABASE_URL is absent we
 * skip loudly rather than fail: a frontend-only contributor should still be
 * able to run `npm run check`. CI always sets it, so coverage is never silently
 * lost where it matters.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

function testDatabaseUrl() {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  if (!existsSync('.env')) return null;
  // Node's parser, so an inline comment in .env stays a comment.
  return parseEnv(readFileSync('.env', 'utf8')).TEST_DATABASE_URL || null;
}

const url = testDatabaseUrl();
if (!url) {
  const message =
    'check: skipping the server tests — TEST_DATABASE_URL is not set.\n' +
    '       Start one with `docker compose up -d`, then `npm run test:server`.';
  if (process.env.CI) {
    console.error(message.replace('skipping', 'cannot skip'));
    process.exit(1);
  }
  console.log(message);
  process.exit(0);
}

const result = spawnSync('npx', ['vitest', 'run', '--config', 'vitest.server.config.ts'], {
  stdio: 'inherit',
  env: { ...process.env, TEST_DATABASE_URL: url },
});
process.exit(result.status ?? 1);
