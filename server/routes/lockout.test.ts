import { eq } from 'drizzle-orm';
import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import * as schema from '../../db/schema.js';
import { MAX_FAILED_ATTEMPTS } from '../services/lockout.js';
import { createMember, createOrg, TEST_PASSWORD } from '../testing/fixtures.js';
import {
  CSRF_HEADERS,
  countAudit,
  db,
  rawSql,
  resetDatabase,
  setupTestApp,
  teardownTestApp,
} from '../testing/harness.js';

/**
 * Per-account lockout on password login.
 *
 * The rate limiter caps attempts per phone and per IP, but it hands the
 * allowance back every hour, forever. This binds the cost to the account, so
 * a sustained campaign against one person stops rather than merely slows.
 */
const PHONE = '09120000001';
const UNKNOWN_PHONE = '09129999999';
const WRONG = 'definitely-not-the-password';

let app: Express;

beforeAll(async () => {
  ({ app } = await setupTestApp());
});
afterAll(teardownTestApp);
beforeEach(resetDatabase);

async function seedMember() {
  const org = await createOrg('سازمان آزمایشی', 'test-org', [
    { key: 'root', parent: null },
    { key: 'unit', parent: 'root' },
  ]);
  return createMember(org, { phone: PHONE, nodeKey: 'unit', withPassword: true });
}

function attempt(phone: string, password: string) {
  return request(app).post('/api/auth/login').set(CSRF_HEADERS).send({ phone, password });
}

/**
 * The per-phone and per-IP limits would fire long before the eighth password
 * attempt. They have their own tests; the lockout is what is under test here.
 */
async function clearRateLimits() {
  await rawSql()`TRUNCATE TABLE rate_limits`;
}

async function failTimes(times: number) {
  for (let i = 0; i < times; i += 1) {
    await clearRateLimits();
    await attempt(PHONE, WRONG);
  }
  await clearRateLimits();
}

async function credentialRow() {
  const [row] = await db()
    .select({
      failedAttempts: schema.credentials.failedAttempts,
      lockedUntil: schema.credentials.lockedUntil,
    })
    .from(schema.credentials)
    .limit(1);
  return row;
}

describe('password lockout', () => {
  it('locks the account after eight consecutive wrong passwords', async () => {
    await seedMember();
    await failTimes(MAX_FAILED_ATTEMPTS);

    const row = await credentialRow();
    expect(row?.failedAttempts).toBe(MAX_FAILED_ATTEMPTS);
    expect(row?.lockedUntil).toBeInstanceOf(Date);
    expect(row!.lockedUntil!.getTime()).toBeGreaterThan(Date.now());
  });

  it('does not lock before the eighth', async () => {
    await seedMember();
    await failTimes(MAX_FAILED_ATTEMPTS - 1);

    const row = await credentialRow();
    expect(row?.failedAttempts).toBe(MAX_FAILED_ATTEMPTS - 1);
    expect(row?.lockedUntil).toBeNull();

    // And the right password still works at the seventh failure.
    const res = await attempt(PHONE, TEST_PASSWORD);
    expect(res.status).toBe(200);
  });

  it('refuses the correct password while the account is locked', async () => {
    await seedMember();
    await failTimes(MAX_FAILED_ATTEMPTS);

    const res = await attempt(PHONE, TEST_PASSWORD);
    expect(res.status).toBe(401);
    // The same answer as a wrong password: saying "locked" would confirm the
    // account exists and tell an attacker their guessing is working.
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('accepts the correct password once the lock expires, and clears the count', async () => {
    const member = await seedMember();
    await failTimes(MAX_FAILED_ATTEMPTS);

    // Move the deadline into the past rather than waiting fifteen minutes.
    await db()
      .update(schema.credentials)
      .set({ lockedUntil: new Date(Date.now() - 1000) })
      .where(eq(schema.credentials.userId, member.userId));

    const res = await attempt(PHONE, TEST_PASSWORD);
    expect(res.status).toBe(200);

    const row = await credentialRow();
    expect(row?.failedAttempts).toBe(0);
    expect(row?.lockedUntil).toBeNull();
  });

  it('leaves OTP login working while the password is locked', async () => {
    await seedMember();
    await failTimes(MAX_FAILED_ATTEMPTS);

    // Locking OTP too would hand anyone who knows a phone number a way to
    // keep its owner out of their own account.
    const res = await request(app)
      .post('/api/auth/otp/request')
      .set(CSRF_HEADERS)
      .send({ phone: PHONE });

    expect(res.status).toBe(200);
    expect(res.body.codeId).toBeTruthy();
  });

  it('is indistinguishable from a phone that has no account', async () => {
    await seedMember();

    await clearRateLimits();
    const unknown = await attempt(UNKNOWN_PHONE, WRONG);

    await failTimes(MAX_FAILED_ATTEMPTS);
    const locked = await attempt(PHONE, TEST_PASSWORD);

    expect(unknown.status).toBe(locked.status);
    expect(unknown.body.error.code).toBe(locked.body.error.code);
    expect(Object.keys(unknown.body.error).sort()).toEqual(Object.keys(locked.body.error).sort());
  });

  it('never creates a credential row for a phone that has no account', async () => {
    await seedMember();
    const before = await db().select({ userId: schema.credentials.userId }).from(schema.credentials);

    await clearRateLimits();
    await attempt(UNKNOWN_PHONE, WRONG);

    const after = await db().select({ userId: schema.credentials.userId }).from(schema.credentials);
    expect(after.length).toBe(before.length);
  });

  it('audits the lockout once, when it happens', async () => {
    await seedMember();
    await failTimes(MAX_FAILED_ATTEMPTS - 1);
    expect(await countAudit('auth.password.locked')).toBe(0);

    await attempt(PHONE, WRONG);
    expect(await countAudit('auth.password.locked')).toBe(1);
  });

  it('does not extend the lock by guessing while locked', async () => {
    await seedMember();
    await failTimes(MAX_FAILED_ATTEMPTS);
    const first = await credentialRow();

    await clearRateLimits();
    await attempt(PHONE, WRONG);
    const second = await credentialRow();

    // Otherwise an attacker could hold the lock open forever.
    expect(second?.failedAttempts).toBe(first?.failedAttempts);
    expect(second?.lockedUntil?.getTime()).toBe(first?.lockedUntil?.getTime());
  });
});
