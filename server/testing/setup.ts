/**
 * Loads .env for the server test suite, then forces the test-only values that
 * must never be inherited from a developer's shell.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';

/**
 * Node's own .env parser, not a regex of ours.
 *
 * The hand-written one kept everything after the `=`, so a documented line
 * like `PORT=4000  # plain Node entry only` became the literal string
 * "4000  # plain Node entry only" — which meant the documented first run,
 * `cp .env.example .env`, failed the entire server suite on a comment.
 */
function loadDotEnv(): void {
  try {
    const parsed = parseEnv(readFileSync(resolve(process.cwd(), '.env'), 'utf8'));
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string' && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch {
    // No .env: CI supplies the variables directly.
  }
}

loadDotEnv();

process.env.NODE_ENV = 'test';
process.env.APP_ORIGIN = process.env.APP_ORIGIN ?? 'http://localhost:3000';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? '';
process.env.DATABASE_URL_UNPOOLED = process.env.DATABASE_URL;
process.env.SMS_PROVIDER = 'console';
process.env.ALLOW_DEV_OTP = '0';
process.env.LOG_LEVEL = 'silent';
process.env.OTP_HMAC_SECRET =
  process.env.OTP_HMAC_SECRET ?? 'test-otp-hmac-secret-at-least-32-characters';
process.env.SESSION_HASH_SECRET =
  process.env.SESSION_HASH_SECRET ?? 'test-session-hash-secret-at-least-32-chars';
process.env.IP_HASH_SECRET = process.env.IP_HASH_SECRET ?? 'test-ip-hash-secret';

if (!process.env.DATABASE_URL) {
  throw new Error('TEST_DATABASE_URL (or DATABASE_URL) must be set to run the server tests');
}
