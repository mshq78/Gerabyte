import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';
import { describe, expect, it } from 'vitest';
import { loadEnv } from './env.js';

/**
 * `.env.example` is the documented first run: `cp .env.example .env`. If it
 * does not satisfy the schema the server validates at boot, that instruction
 * is a lie — and it was, because the example's inline comments were being
 * parsed as part of the values.
 *
 * Parsing it here with the same parser the app uses, through the same schema,
 * is what stops it drifting again.
 */
const EXAMPLE_PATH = resolve(process.cwd(), '.env.example');

function exampleEnv(): Record<string, string> {
  const parsed = parseEnv(readFileSync(EXAMPLE_PATH, 'utf8'));
  return Object.fromEntries(
    Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
  );
}

describe('.env.example', () => {
  it('parses without leaving comments inside the values', () => {
    const example = exampleEnv();
    expect(example.PORT).toBe('4000');
    expect(example.SMS_PROVIDER).toBe('console');
    expect(example.DEPLOY_ENV).toBe('local');
    for (const [key, value] of Object.entries(example)) {
      expect(value, key).not.toContain('#');
    }
  });

  it('satisfies the schema the server boots against', () => {
    // The committed example carries obvious placeholder secrets; a real run
    // supplies its own. Everything else is taken exactly as documented.
    const example = exampleEnv();
    expect(() =>
      loadEnv({
        ...example,
        OTP_HMAC_SECRET: 'test-otp-hmac-secret-at-least-32-characters',
        SESSION_HASH_SECRET: 'test-session-hash-secret-at-least-32-chars',
        IP_HASH_SECRET: 'test-ip-hash-secret',
      })
    ).not.toThrow();
  });

  it('documents every variable the schema requires', () => {
    const documented = new Set(Object.keys(exampleEnv()));
    for (const key of [
      'DATABASE_URL',
      'APP_ORIGIN',
      'OTP_HMAC_SECRET',
      'SESSION_HASH_SECRET',
      'IP_HASH_SECRET',
    ]) {
      expect(documented, key).toContain(key);
    }
  });

  it('never ships a production-unsafe combination as the example', () => {
    // The example is a local file. If someone copies it and flips DEPLOY_ENV,
    // the schema must still refuse — that refusal is the guard rail.
    const example = exampleEnv();
    expect(() =>
      loadEnv({
        ...example,
        DEPLOY_ENV: 'production',
        OTP_HMAC_SECRET: 'test-otp-hmac-secret-at-least-32-characters',
        SESSION_HASH_SECRET: 'test-session-hash-secret-at-least-32-chars',
        IP_HASH_SECRET: 'test-ip-hash-secret',
      })
    ).toThrow(/ALLOW_DEV_OTP|SMS_PROVIDER|APP_ORIGIN/);
  });
});
