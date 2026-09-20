import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

declare module 'express-serve-static-core' {
  interface Request {
    requestId: string;
  }
}

/**
 * Every request gets an id, echoed in the response and attached to log lines and
 * audit rows so one incident can be followed across all three.
 */
export function requestId() {
  return (req: Request, res: Response, next: NextFunction) => {
    req.requestId = randomUUID();
    res.setHeader('X-Request-Id', req.requestId);
    next();
  };
}
