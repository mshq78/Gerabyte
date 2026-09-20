import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { logger } from '../../logger';
import { AppError, type ApiErrorBody, type ErrorCode, messageFor } from '../errors';

function body(code: ErrorCode, requestId: string, details?: unknown): ApiErrorBody {
  const error: ApiErrorBody['error'] = { code, message: messageFor(code), requestId };
  if (details !== undefined) error.details = details;
  return { error };
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
