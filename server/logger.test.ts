import { Writable } from 'node:stream';
import pino from 'pino';
import { describe, expect, it } from 'vitest';
import { REDACTION_PLACEHOLDER } from './logger';

/**
 * The redaction list is the only thing standing between a debug log line and a
 * phone number in a log aggregator, so it gets its own test.
 */
function captureLogger() {
  const lines: string[] = [];
  const sink = new Writable({
    write(chunk, _enc, cb) {
      lines.push(String(chunk));
      cb();
    },
  });

  // Same configuration as server/logger.ts, pointed at a buffer.
  const log = pino(
    {
      level: 'debug',
      redact: {
        paths: [
          'req.headers.cookie',
          'req.headers.authorization',
          'res.headers["set-cookie"]',
          'phone',
          '*.phone',
          'req.body.phone',
          'body.phone',
          'code',
          '*.code',
          'req.body.code',
          'otp',
          '*.otp',
          'password',
          '*.password',
          'req.body.password',
          'req.body.newPassword',
          'req.body.currentPassword',
          'token',
          '*.token',
          'sessionToken',
          'apiKey',
          '*.apiKey',
        ],
        censor: REDACTION_PLACEHOLDER,
      },
      base: undefined,
    },
    sink
  );

  return { log, lines };
}

describe('log redaction', () => {
  it('redacts a phone number at the top level and one level down', () => {
    const { log, lines } = captureLogger();
    log.info({ phone: '+989123456789', user: { phone: '+989123456789' } }, 'sign-in');

    const output = lines.join('');
    expect(output).not.toContain('989123456789');
    expect(output).toContain(REDACTION_PLACEHOLDER);
  });

  it('redacts an OTP code', () => {
    const { log, lines } = captureLogger();
    log.info({ code: '483920', otp: '483920' }, 'otp issued');
    expect(lines.join('')).not.toContain('483920');
  });

  it('redacts passwords, tokens and api keys', () => {
    const { log, lines } = captureLogger();
    log.info(
      {
        password: 'hunter2',
        token: 'sess_abc123',
        apiKey: 'kv-secret',
        nested: { password: 'hunter2', token: 'sess_abc123', apiKey: 'kv-secret' },
      },
      'secrets'
    );
    const output = lines.join('');
    for (const secret of ['hunter2', 'sess_abc123', 'kv-secret']) {
      expect(output, secret).not.toContain(secret);
    }
  });

  it('redacts cookie and authorization headers', () => {
    const { log, lines } = captureLogger();
    log.info(
      {
        req: {
          headers: {
            cookie: 'gerabyte_session=super-secret-token',
            authorization: 'Bearer super-secret-token',
          },
        },
      },
      'incoming'
    );
    expect(lines.join('')).not.toContain('super-secret-token');
  });

  it('redacts a request body carrying a phone and a code', () => {
    const { log, lines } = captureLogger();
    log.info({ req: { body: { phone: '+989123456789', code: '483920' } } }, 'verify');
    const output = lines.join('');
    expect(output).not.toContain('989123456789');
    expect(output).not.toContain('483920');
  });

  it('still logs the fields that are safe', () => {
    const { log, lines } = captureLogger();
    log.info({ requestId: 'abc-123', statusCode: 200 }, 'request completed');
    const output = lines.join('');
    expect(output).toContain('abc-123');
    expect(output).toContain('request completed');
  });
});
