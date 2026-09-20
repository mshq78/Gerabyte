import pino from 'pino';
import { env } from './config/env.js';

/**
 * Paths scrubbed before anything is written. Phones, OTP codes, passwords,
 * cookies and authorization headers must never appear in a log line, in
 * production or anywhere else.
 */
const REDACTED_PATHS = [
  'req.headers.cookie',
  'req.headers.authorization',
  'req.headers["x-api-key"]',
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
];

export const REDACTION_PLACEHOLDER = '[redacted]';

export const logger = pino({
  level: env().LOG_LEVEL,
  redact: { paths: REDACTED_PATHS, censor: REDACTION_PLACEHOLDER },
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
});

export type Logger = typeof logger;
