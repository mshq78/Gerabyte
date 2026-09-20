import type { Request } from 'express';
import type { ZodType } from 'zod';

/** Parse and narrow a request body, letting ZodError reach the error handler. */
export function parseBody<T>(schema: ZodType<T>, req: Request): T {
  return schema.parse(req.body);
}

/** Parse and narrow a query string. */
export function parseQuery<T>(schema: ZodType<T>, req: Request): T {
  return schema.parse(req.query);
}
