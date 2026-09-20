import type { Express } from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import * as schema from '../../db/schema.js';
import { ABSOLUTE_TIMEOUT_MS, IDLE_TIMEOUT_MS } from '../services/session.js';
import { createMember, createOrg, TEST_PASSWORD } from '../testing/fixtures.js';
import {
  CSRF_HEADERS,
  agent,
  countAudit,
  db,
  resetDatabase,
  setupTestApp,
  teardownTestApp,
} from '../testing/harness.js';

let app: Express;
const PHONE = '09120000001';

beforeAll(async () => {
  ({ app } = await setupTestApp());
});
afterAll(teardownTestApp);
beforeEach(resetDatabase);

async function signedIn() {
  const org = await createOrg('سازمان', 'org', [
    { key: 'root', parent: null },
    { key: 'unit', parent: 'root' },
  ]);
  const member = await createMember(org, { phone: PHONE, nodeKey: 'unit', withPassword: true });
  const a = agent(app);
  const res = await a
    .post('/api/auth/login')
    .set(CSRF_HEADERS)
    .send({ phone: PHONE, password: TEST_PASSWORD });
  if (res.status !== 200) throw new Error(`login failed: ${res.status}`);
  return { a, org, member };
}

describe('session lifecycle', () => {
  it('stores only a hash of the token, never the token itself', async () => {
    const { a } = await signedIn();
    const cookie = (await a.get('/api/me')).request.cookies ?? '';
    const [row] = await db().select().from(schema.sessions);
    expect(row).toBeDefined();
    expect(row?.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    if (typeof cookie === 'string' && cookie.includes('=')) {
      const token = cookie.split('=')[1]?.split(';')[0] ?? '';
      if (token) expect(row?.tokenHash).not.toContain(token);
    }
  });

  it('rejects a request once the session is revoked', async () => {
    const { a } = await signedIn();
    expect((await a.get('/api/me')).status).toBe(200);

    const sessions = await a.get('/api/me/sessions');
    const id = sessions.body.items[0].id;
    const revoked = await a.delete(`/api/me/sessions/${id}`).set(CSRF_HEADERS);
    expect(revoked.status).toBe(200);

    expect((await a.get('/api/me')).status).toBe(401);
    expect(await countAudit('session.revoked')).toBe(1);
  });

  it('logs out and refuses the cookie afterwards', async () => {
    const { a } = await signedIn();
    const out = await a.post('/api/auth/logout').set(CSRF_HEADERS);
    expect(out.status).toBe(200);
    expect((await a.get('/api/me')).status).toBe(401);
    expect(await countAudit('auth.logout')).toBe(1);
  });

  it('rejects a session past its idle deadline', async () => {
    const { a } = await signedIn();
    await db()
      .update(schema.sessions)
      .set({ idleExpiresAt: new Date(Date.now() - 1000) });
    expect((await a.get('/api/me')).status).toBe(401);
  });

  it('rejects a session past its absolute deadline even if recently used', async () => {
    const { a } = await signedIn();
    await db()
      .update(schema.sessions)
      .set({
        idleExpiresAt: new Date(Date.now() + IDLE_TIMEOUT_MS),
        absoluteExpiresAt: new Date(Date.now() - 1000),
      });
    expect((await a.get('/api/me')).status).toBe(401);
  });

  it('sets both deadlines to the documented windows', async () => {
    await signedIn();
    const [row] = await db().select().from(schema.sessions);
    expect(row).toBeDefined();
    const idleDays = (row!.idleExpiresAt.getTime() - row!.createdAt.getTime()) / 86_400_000;
    const absDays = (row!.absoluteExpiresAt.getTime() - row!.createdAt.getTime()) / 86_400_000;
    expect(Math.round(idleDays)).toBe(IDLE_TIMEOUT_MS / 86_400_000);
    expect(Math.round(absDays)).toBe(ABSOLUTE_TIMEOUT_MS / 86_400_000);
  });

  it('slides the idle deadline forward but never past the absolute one', async () => {
    const { a } = await signedIn();
    const cap = new Date(Date.now() + 60_000);
    await db().update(schema.sessions).set({ absoluteExpiresAt: cap });

    await a.get('/api/me');
    const [row] = await db().select().from(schema.sessions);
    expect(row!.idleExpiresAt.getTime()).toBeLessThanOrEqual(cap.getTime());
  });

  it('lists sessions and marks the current one', async () => {
    const { a } = await signedIn();
    const res = await a.get('/api/me/sessions');
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].current).toBe(true);
    // The token must not be in the listing.
    expect(JSON.stringify(res.body)).not.toContain('tokenHash');
  });

  it('cannot revoke another user’s session', async () => {
    const { a, org } = await signedIn();
    const other = await createMember(org, {
      phone: '09121112222',
      nodeKey: 'unit',
      withPassword: true,
    });
    const b = agent(app);
    await b
      .post('/api/auth/login')
      .set(CSRF_HEADERS)
      .send({ phone: other.phone, password: TEST_PASSWORD });

    const mine = await a.get('/api/me/sessions');
    const res = await b.delete(`/api/me/sessions/${mine.body.items[0].id}`).set(CSRF_HEADERS);
    expect(res.status).toBe(404);
    expect((await a.get('/api/me')).status).toBe(200);
  });

  it('revokes every other session when the password changes', async () => {
    const { a } = await signedIn();
    const b = agent(app);
    await b
      .post('/api/auth/login')
      .set(CSRF_HEADERS)
      .send({ phone: PHONE, password: TEST_PASSWORD });
    expect((await b.get('/api/me')).status).toBe(200);

    const res = await a
      .post('/api/auth/password')
      .set(CSRF_HEADERS)
      .send({ currentPassword: TEST_PASSWORD, newPassword: 'a-new-long-password' });
    expect(res.status).toBe(200);

    expect((await a.get('/api/me')).status).toBe(200);
    expect((await b.get('/api/me')).status).toBe(401);
  });

  it('requires the current password to change an existing one', async () => {
    const { a } = await signedIn();
    const res = await a
      .post('/api/auth/password')
      .set(CSRF_HEADERS)
      .send({ newPassword: 'another-long-password' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('CURRENT_PASSWORD_REQUIRED');
  });

  it('rejects a password shorter than eight characters', async () => {
    const { a } = await signedIn();
    const res = await a
      .post('/api/auth/password')
      .set(CSRF_HEADERS)
      .send({ currentPassword: TEST_PASSWORD, newPassword: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
  });
});

describe('/api/me', () => {
  it('returns a whitelisted payload with a masked phone', async () => {
    const { a } = await signedIn();
    const res = await a.get('/api/me');
    expect(res.status).toBe(200);
    expect(res.body.phoneMasked).toBe('0912***0001');
    expect(JSON.stringify(res.body)).not.toContain('+989120000001');
    expect(res.body).not.toHaveProperty('phone');
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('updates the profile through PATCH', async () => {
    const { a } = await signedIn();
    const res = await a
      .patch('/api/me')
      .set(CSRF_HEADERS)
      .send({ fullName: 'نام تازه', dailyGoal: 3, onboardingCompleted: true });
    expect(res.status).toBe(200);
    expect(res.body.fullName).toBe('نام تازه');
    expect(res.body.dailyGoal).toBe(3);
    expect(res.body.onboardingCompleted).toBe(true);
  });

  it('refuses an unauthenticated read', async () => {
    const res = await agent(app).get('/api/me');
    expect(res.status).toBe(401);
  });

  it('refuses a forged session cookie', async () => {
    const res = await agent(app).get('/api/me').set('Cookie', 'gerabyte_session=not-a-real-token');
    expect(res.status).toBe(401);
  });
});
