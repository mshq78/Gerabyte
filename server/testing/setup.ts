/**
 * Loads .env for the server test suite, then forces the test-only values that
 * must never be inherited from a developer's shell.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadDotEnv(): void {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
    for (const line of raw.split('\n')) {
      const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
      if (!match) continue;
      const [, key, value] = match;
      if (key && process.env[key] === undefined) {
        process.env[key] = value?.replace(/^["']|["']$/g, '') ?? '';
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
