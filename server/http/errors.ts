import { ERROR_MESSAGES, type ApiErrorBody, type ErrorCode } from '../../shared/errors.js';

export type { ApiErrorBody, ErrorCode };
export { ERROR_MESSAGES };

export class AppError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly details?: unknown;
  readonly headers?: Record<string, string>;

  constructor(
    status: number,
    code: ErrorCode,
    options: { details?: unknown; headers?: Record<string, string> } = {}
  ) {
    super(code);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    if (options.details !== undefined) this.details = options.details;
    if (options.headers) this.headers = options.headers;
  }
}

export const badRequest = (code: ErrorCode = 'BAD_REQUEST', details?: unknown) =>
  new AppError(400, code, { details });
export const unauthenticated = (code: ErrorCode = 'UNAUTHENTICATED') => new AppError(401, code);
export const forbidden = (code: ErrorCode = 'FORBIDDEN') => new AppError(403, code);

/**
 * Anything a caller is not allowed to see reads as "not found", so a 403 never
 * confirms that a record exists in an organization they cannot reach.
 */
export const notFound = (code: ErrorCode = 'NOT_FOUND') => new AppError(404, code);

export const rateLimited = (retryAfterSeconds: number) =>
  new AppError(429, 'RATE_LIMITED', {
    headers: { 'Retry-After': String(Math.max(1, Math.ceil(retryAfterSeconds))) },
  });

export function messageFor(code: ErrorCode): string {
  return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.INTERNAL;
}
