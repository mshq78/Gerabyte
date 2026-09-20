import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { logger } from '../../logger.js';
import { AppError, type ApiErrorBody, type ErrorCode, messageFor } from '../errors.js';

function body(code: ErrorCode, requestId: string, details?: unknown): ApiErrorBody {
  const error: ApiErrorBody['error'] = { code, message: messageFor(code), requestId };
  if (details !== undefined) error.details = details;
  return { error };
}

/**
 * body-parser rejects a request before any handler sees it, and throws an
 * http-errors object rather than one of ours. Left unclassified these came
 * back as 500 INTERNAL and were logged at error level with a stack — a client
 * mistake reported as a server fault, and noise in the error budget.
 */
function classifyBodyError(
  err: unknown
): { status: number; code: ErrorCode; length: number | undefined } | null {
  if (typeof err !== 'object' || err === null || !('type' in err)) return null;
  const candidate = err as { type?: unknown; length?: unknown };
  const length = typeof candidate.length === 'number' ? candidate.length : undefined;

  switch (candidate.type) {
    case 'entity.too.large':
      return { status: 413, code: 'PAYLOAD_TOO_LARGE', length };
    case 'entity.parse.failed':
    case 'entity.verify.failed':
    case 'encoding.unsupported':
    case 'charset.unsupported':
      return { status: 400, code: 'MALFORMED_JSON', length };
    default:
      return null;
  }
}

/** 404 for anything that fell through the router. */
export function notFoundHandler() {
  return (req: Request, res: Response) => {
    res.status(404).json(body('NOT_FOUND', req.requestId));
  };
}

/**
 * The only place an error becomes a response. Stack traces and driver messages
 * never cross the wire: the client gets a stable code, a Persian sentence and
 * the request id to quote.
 */
export function errorHandler() {
  return (err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      next(err);
      return;
    }

    if (err instanceof AppError) {
      if (err.headers) {
        for (const [key, value] of Object.entries(err.headers)) res.setHeader(key, value);
      }
      if (err.status >= 500) {
        logger.error({ requestId: req.requestId, code: err.code }, 'request failed');
      }
      res.status(err.status).json(body(err.code, req.requestId, err.details));
      return;
    }

    const bodyError = classifyBodyError(err);
    if (bodyError) {
      // A body we refused to parse is a client mistake, not a server fault:
      // warn, and never log the body itself — an oversized or malformed
      // request is exactly the kind that carries a password or a code.
      logger.warn(
        { requestId: req.requestId, code: bodyError.code, bytes: bodyError.length },
        'request body refused'
      );
      res.status(bodyError.status).json(body(bodyError.code, req.requestId));
      return;
    }

    if (err instanceof ZodError) {
      // Field names and the failing rule are safe to return; values are not.
      const details = err.issues.map((issue) => ({
        path: issue.path.join('.'),
        code: issue.message,
      }));
      res.status(400).json(body('VALIDATION_FAILED', req.requestId, details));
      return;
    }

    logger.error(
      {
        requestId: req.requestId,
        err: err instanceof Error ? { message: err.message, stack: err.stack } : String(err),
      },
      'unhandled error'
    );
    res.status(500).json(body('INTERNAL', req.requestId));
  };
}
