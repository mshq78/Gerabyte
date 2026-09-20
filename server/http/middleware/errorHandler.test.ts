import type { Express } from 'express';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { ERROR_MESSAGES } from '../../../shared/errors.js';
import { CSRF_HEADERS, setupTestApp } from '../../testing/harness.js';

/**
 * A body the server refuses to parse is the caller's mistake. It used to come
 * back as 500 INTERNAL, logged at error level with a stack — which is both a
 * lie about whose fault it is and noise in the error budget.
 */
describe('request body errors', () => {
  let app: Express;

  beforeAll(async () => {
    ({ app } = await setupTestApp());
  });

  it('answers 413 for a body over the limit', async () => {
    // The limit is 32kb; this is comfortably past it.
    const oversized = JSON.stringify({ phone: '09120000001', padding: 'x'.repeat(64 * 1024) });

    const res = await request(app)
      .post('/api/auth/login')
      .set(CSRF_HEADERS)
      .set('Content-Type', 'application/json')
      .send(oversized);

    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
    expect(res.body.error.message).toBe(ERROR_MESSAGES.PAYLOAD_TOO_LARGE);
    expect(res.body.error.requestId).toBeTruthy();
  });

  it('answers 400 for malformed JSON', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set(CSRF_HEADERS)
      .set('Content-Type', 'application/json')
      .send('{"phone": "09120000001",,,}');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('MALFORMED_JSON');
    expect(res.body.error.message).toBe(ERROR_MESSAGES.MALFORMED_JSON);
  });

  it('answers 400 for a body that is not JSON at all', async () => {
    const res = await request(app)
      .post('/api/auth/otp/request')
      .set(CSRF_HEADERS)
      .set('Content-Type', 'application/json')
      .send('not json');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('MALFORMED_JSON');
  });

  it('never echoes the rejected body back to the caller', async () => {
    const secret = 'topsecretpassword';
    const res = await request(app)
      .post('/api/auth/login')
      .set(CSRF_HEADERS)
      .set('Content-Type', 'application/json')
      .send(`{"password": "${secret}",,}`);

    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).not.toContain(secret);
  });

  it('still validates a well-formed body normally', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set(CSRF_HEADERS)
      .send({ phone: 'not-a-phone', password: 'short' });

    // Reaches the schema rather than the body parser: a different failure.
    expect(res.status).toBe(400);
    expect(res.body.error.code).not.toBe('MALFORMED_JSON');
    expect(res.body.error.code).not.toBe('PAYLOAD_TOO_LARGE');
  });
});
