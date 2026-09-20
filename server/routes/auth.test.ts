import type { Express } from 'express';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import * as schema from '../../db/schema.js';
import { OTP_MAX_ATTEMPTS } from '../services/otp.js';
import { LIMITS } from '../services/rateLimit.js';
import {
  createInvite,
  createMember,
  createOrg,
  findUserByPhone,
  TEST_PASSWORD,
} from '../testing/fixtures.js';
import {
  APP_ORIGIN,
  CSRF_HEADERS,
  agent,
  countAudit,
  db,
  resetDatabase,
  sentCodes,
  setupTestApp,
  teardownTestApp,
} from '../testing/harness.js';

let app: Express;

const KNOWN_PHONE = '09120000001';
const UNKNOWN_PHONE = '09129999999';

beforeAll(async () => {
  ({ app } = await setupTestApp());
});
afterAll(teardownTestApp);
beforeEach(resetDatabase);

async function seedOrgWithMember() {
  const org = await createOrg('سازمان آزمایشی', 'test-org', [
    { key: 'root', parent: null },
    { key: 'unit', parent: 'root' },
  ]);
  const member = await createMember(org, {
    phone: KNOWN_PHONE,
    nodeKey: 'unit',
    withPassword: true,
  });
  return { org, member };
}

function codeFor(phone: string): string {
  const entry = [...sentCodes].reverse().find((c) => c.phone.endsWith(phone.slice(-9)));
  if (!entry) throw new Error(`no code was sent to ${phone}`);
  return entry.code;
}

async function requestOtp(a: ReturnType<typeof agent>, phone: string) {
  return a.post('/api/auth/otp/request').set(CSRF_HEADERS).send({ phone });
}

describe('CSRF', () => {
  it('rejects a state-changing request with no X-Requested-With header', async () => {
    const res = await agent(app)
      .post('/api/auth/otp/request')
      .set('Origin', APP_ORIGIN)
      .send({ phone: KNOWN_PHONE });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('CSRF_FAILED');
  });

  it('rejects a request whose Origin is not the app origin', async () => {
    const res = await agent(app)
      .post('/api/auth/otp/request')
      .set('X-Requested-With', 'gerabyte')
      .set('Origin', 'https://evil.example')
      .send({ phone: KNOWN_PHONE });
    expect(res.status).toBe(403);
  });

  it('rejects a request whose Referer is not the app origin', async () => {
    const res = await agent(app)
      .post('/api/auth/otp/request')
      .set('X-Requested-With', 'gerabyte')
      .set('Referer', 'https://evil.example/page')
      .send({ phone: KNOWN_PHONE });
    expect(res.status).toBe(403);
  });

  it('rejects a state-changing request with neither Origin nor Referer', async () => {
    const res = await agent(app)
      .post('/api/auth/otp/request')
      .set('X-Requested-With', 'gerabyte')
      .send({ phone: KNOWN_PHONE });
    expect(res.status).toBe(403);
  });

  it('allows a GET without the header', async () => {
    const res = await agent(app).get('/api/health');
    expect(res.status).toBe(200);
  });
});

describe('OTP request', () => {
  it('does not reveal whether an account exists', async () => {
    await seedOrgWithMember();

    const known = await requestOtp(agent(app), KNOWN_PHONE);
    const unknown = await requestOtp(agent(app), UNKNOWN_PHONE);

    expect(known.status).toBe(unknown.status);
    expect(Object.keys(known.body).sort()).toEqual(Object.keys(unknown.body).sort());
    expect(known.body.expiresInSeconds).toBe(unknown.body.expiresInSeconds);
    expect(known.body.resendAfterSeconds).toBe(unknown.body.resendAfterSeconds);
    // Both must hand back a usable code id; neither may hint at the difference.
    expect(known.body.codeId).toMatch(/^[0-9a-f-]{36}$/);
    expect(unknown.body.codeId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('never stores the code in clear text', async () => {
    await seedOrgWithMember();
    const res = await requestOtp(agent(app), KNOWN_PHONE);
    const code = codeFor(KNOWN_PHONE);

    const [row] = await db()
      .select()
      .from(schema.otpCodes)
      .where(eq(schema.otpCodes.id, res.body.codeId));

    expect(row).toBeDefined();
    expect(row?.codeHash).not.toContain(code);
    expect(row?.codeHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('enforces the 60 second resend cooldown', async () => {
    await seedOrgWithMember();
    const a = agent(app);
    const first = await requestOtp(a, KNOWN_PHONE);
    expect(first.status).toBe(200);

    const second = await requestOtp(a, KNOWN_PHONE);
    expect(second.status).toBe(429);
    expect(second.body.error.code).toBe('OTP_RESEND_COOLDOWN');
    expect(Number(second.headers['retry-after'])).toBeGreaterThan(0);
  });

  it('limits codes per phone per hour', async () => {
    await seedOrgWithMember();
    const max = LIMITS.otpRequestPerPhone.max;

    // Step past the cooldown by ageing each code as it is created.
    for (let i = 0; i < max; i++) {
      const res = await requestOtp(agent(app), KNOWN_PHONE);
      expect(res.status, `request ${i + 1} of ${max}`).toBe(200);
      await db()
        .update(schema.otpCodes)
        .set({ createdAt: new Date(Date.now() - 10 * 60_000) });
    }

    const blocked = await requestOtp(agent(app), KNOWN_PHONE);
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('RATE_LIMITED');
  });

  it('limits codes per IP per hour across different phones', async () => {
    await seedOrgWithMember();
    const max = LIMITS.otpRequestPerIp.max;

    for (let i = 0; i < max; i++) {
      const res = await requestOtp(agent(app), `0912100${String(i).padStart(4, '0')}`);
      expect(res.status, `request ${i + 1}`).toBe(200);
      await db()
        .update(schema.otpCodes)
        .set({ createdAt: new Date(Date.now() - 10 * 60_000) });
    }

    const blocked = await requestOtp(agent(app), '09121119999');
    expect(blocked.status).toBe(429);
  });

  it('writes an audit row that contains no phone and no code', async () => {
    await seedOrgWithMember();
    await requestOtp(agent(app), KNOWN_PHONE);
    const code = codeFor(KNOWN_PHONE);

    const rows = await db().select().from(schema.auditLog);
    expect(rows).toHaveLength(1);
    const serialized = JSON.stringify(rows[0]);
    expect(serialized).not.toContain(code);
    expect(serialized).not.toContain('989120000001');
    expect(serialized).not.toContain('09120000001');
  });
});

describe('OTP verify', () => {
  it('signs in with a correct code and sets a hardened cookie', async () => {
    await seedOrgWithMember();
    const a = agent(app);
    const requested = await requestOtp(a, KNOWN_PHONE);

    const res = await a
      .post('/api/auth/otp/verify')
      .set(CSRF_HEADERS)
      .send({ phone: KNOWN_PHONE, codeId: requested.body.codeId, code: codeFor(KNOWN_PHONE) });

    expect(res.status).toBe(200);
    const cookie = res.headers['set-cookie']?.[0] ?? '';
    expect(cookie).toContain('gerabyte_session=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Path=/');

    const me = await a.get('/api/me');
    expect(me.status).toBe(200);
  });

  it('locks the code after five wrong attempts', async () => {
    await seedOrgWithMember();
    const a = agent(app);
    const requested = await requestOtp(a, KNOWN_PHONE);
    const codeId = requested.body.codeId;

    for (let attempt = 1; attempt < OTP_MAX_ATTEMPTS; attempt++) {
      const res = await a
        .post('/api/auth/otp/verify')
        .set(CSRF_HEADERS)
        .send({ phone: KNOWN_PHONE, codeId, code: '111111' });
      expect(res.body.error.code, `attempt ${attempt}`).toBe('OTP_INVALID');
    }

    const fifth = await a
      .post('/api/auth/otp/verify')
      .set(CSRF_HEADERS)
      .send({ phone: KNOWN_PHONE, codeId, code: '111111' });
    expect(fifth.body.error.code).toBe('OTP_TOO_MANY_ATTEMPTS');

    // Even the right code is dead once the attempts are spent.
    const correct = await a
      .post('/api/auth/otp/verify')
      .set(CSRF_HEADERS)
      .send({ phone: KNOWN_PHONE, codeId, code: codeFor(KNOWN_PHONE) });
    expect(correct.status).toBe(400);
    expect(correct.body.error.code).not.toBe('OK');
  });

  it('rejects an expired code', async () => {
    await seedOrgWithMember();
    const a = agent(app);
    const requested = await requestOtp(a, KNOWN_PHONE);

    await db()
      .update(schema.otpCodes)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(schema.otpCodes.id, requested.body.codeId));

    const res = await a
      .post('/api/auth/otp/verify')
      .set(CSRF_HEADERS)
      .send({ phone: KNOWN_PHONE, codeId: requested.body.codeId, code: codeFor(KNOWN_PHONE) });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('OTP_EXPIRED');
  });

  it('refuses to reuse a code that already signed someone in', async () => {
    await seedOrgWithMember();
    const a = agent(app);
    const requested = await requestOtp(a, KNOWN_PHONE);
    const code = codeFor(KNOWN_PHONE);

    const first = await a
      .post('/api/auth/otp/verify')
      .set(CSRF_HEADERS)
      .send({ phone: KNOWN_PHONE, codeId: requested.body.codeId, code });
    expect(first.status).toBe(200);

    const replay = await agent(app)
      .post('/api/auth/otp/verify')
      .set(CSRF_HEADERS)
      .send({ phone: KNOWN_PHONE, codeId: requested.body.codeId, code });
    expect(replay.status).toBe(400);
    expect(replay.body.error.code).toBe('OTP_INVALID');
  });

  it('refuses a code issued for a different phone', async () => {
    await seedOrgWithMember();
    const a = agent(app);
    const requested = await requestOtp(a, KNOWN_PHONE);

    const res = await a
      .post('/api/auth/otp/verify')
      .set(CSRF_HEADERS)
      .send({ phone: '09121110000', codeId: requested.body.codeId, code: codeFor(KNOWN_PHONE) });
    expect(res.status).toBe(400);
  });

  it('does not accept 000000 when ALLOW_DEV_OTP is off', async () => {
    await seedOrgWithMember();
    const a = agent(app);
    const requested = await requestOtp(a, KNOWN_PHONE);

    const res = await a
      .post('/api/auth/otp/verify')
      .set(CSRF_HEADERS)
      .send({ phone: KNOWN_PHONE, codeId: requested.body.codeId, code: '000000' });
    expect(res.status).toBe(400);
  });

  it('creates an account for an unknown phone that proved ownership', async () => {
    const a = agent(app);
    const requested = await requestOtp(a, UNKNOWN_PHONE);

    const res = await a
      .post('/api/auth/otp/verify')
      .set(CSRF_HEADERS)
      .send({ phone: UNKNOWN_PHONE, codeId: requested.body.codeId, code: codeFor(UNKNOWN_PHONE) });

    expect(res.status).toBe(200);
    expect(await findUserByPhone(UNKNOWN_PHONE)).not.toBeNull();
  });

  it('links an invited membership on first login', async () => {
    const org = await createOrg('سازمان آزمایشی', 'test-org', [
      { key: 'root', parent: null },
      { key: 'unit', parent: 'root' },
    ]);
    const invite = await createInvite(org, { phone: '09121234567', nodeKey: 'unit' });

    const a = agent(app);
    const requested = await requestOtp(a, '09121234567');
    const res = await a
      .post('/api/auth/otp/verify')
      .set(CSRF_HEADERS)
      .send({ phone: '09121234567', codeId: requested.body.codeId, code: codeFor('09121234567') });
    expect(res.status).toBe(200);

    const [membership] = await db()
      .select()
      .from(schema.memberships)
      .where(eq(schema.memberships.id, invite.membershipId));
    expect(membership?.userId).not.toBeNull();
    expect(membership?.status).toBe('active');
  });
});

describe('password login', () => {
  it('signs in with the right password', async () => {
    await seedOrgWithMember();
    const res = await agent(app)
      .post('/api/auth/login')
      .set(CSRF_HEADERS)
      .send({ phone: KNOWN_PHONE, password: TEST_PASSWORD });
    expect(res.status).toBe(200);
  });

  it('answers identically for a wrong password and an unknown account', async () => {
    await seedOrgWithMember();
    const wrong = await agent(app)
      .post('/api/auth/login')
      .set(CSRF_HEADERS)
      .send({ phone: KNOWN_PHONE, password: 'not-the-password' });
    const missing = await agent(app)
      .post('/api/auth/login')
      .set(CSRF_HEADERS)
      .send({ phone: UNKNOWN_PHONE, password: 'not-the-password' });

    expect(wrong.status).toBe(401);
    expect(missing.status).toBe(401);
    expect(wrong.body).toEqual({
      ...missing.body,
      error: { ...missing.body.error, requestId: wrong.body.error.requestId },
    });
  });

  it('shares the per-phone limit with OTP', async () => {
    await seedOrgWithMember();
    for (let i = 0; i < LIMITS.loginPerPhone.max; i++) {
      await agent(app)
        .post('/api/auth/login')
        .set(CSRF_HEADERS)
        .send({ phone: KNOWN_PHONE, password: 'wrong' });
    }
    const blocked = await agent(app)
      .post('/api/auth/login')
      .set(CSRF_HEADERS)
      .send({ phone: KNOWN_PHONE, password: TEST_PASSWORD });
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers['retry-after'])).toBeGreaterThan(0);
  });

  it('records a failure and a success in the audit log', async () => {
    await seedOrgWithMember();
    await agent(app)
      .post('/api/auth/login')
      .set(CSRF_HEADERS)
      .send({ phone: KNOWN_PHONE, password: 'wrong' });
    await agent(app)
      .post('/api/auth/login')
      .set(CSRF_HEADERS)
      .send({ phone: KNOWN_PHONE, password: TEST_PASSWORD });

    expect(await countAudit('auth.login.failed')).toBe(1);
    expect(await countAudit('auth.login.succeeded')).toBe(1);
  });
});
