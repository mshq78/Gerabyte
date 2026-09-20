import cookieParser from 'cookie-parser';
import express, { type Express } from 'express';
import pinoHttp from 'pino-http';
import type { Database } from '../db/client.js';
import { createDatabase } from '../db/client.js';
import { env } from './config/env.js';
import { logger } from './logger.js';
import { errorHandler, notFoundHandler } from './http/middleware/errorHandler.js';
import { loadSession } from './http/middleware/auth.js';
import { requestId } from './http/middleware/requestId.js';
import { mountRouter } from './http/routePolicy.js';
import {
  csrfGuard,
  extraSecurityHeaders,
  sameOriginOnly,
  securityHeaders,
} from './http/middleware/security.js';
import { authRouter } from './routes/auth.js';
import { healthRouter } from './routes/health.js';
import { meRouter } from './routes/me.js';
import { orgRouter } from './routes/org.js';

/** Bodies are small JSON documents; anything larger is refused outright. */
const JSON_BODY_LIMIT = '32kb';

export interface AppDeps {
  db: Database;
}

let lazyDb: Database | null = null;

/** The process-wide pool, created on first use so importing the app is cheap. */
export function defaultDatabase(): Database {
  if (!lazyDb) {
    // Serverless keeps a small pool per instance; a big one just exhausts Neon.
    lazyDb = createDatabase(env().DATABASE_URL, { max: 5 }).db;
  }
  return lazyDb;
}

export function createApp(deps: AppDeps): Express {
  const app = express();

  // Vercel puts exactly one proxy in front of us; trusting more would let a
  // client forge X-Forwarded-For and defeat the per-IP rate limits.
  app.set('trust proxy', env().TRUST_PROXY_HOPS);
  app.disable('x-powered-by');
  app.set('etag', false);

  app.use(requestId());
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => (req as { requestId?: string }).requestId ?? 'unknown',
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
      // Only the fields we know are safe; the full req/res would carry headers.
      serializers: {
        req: (req) => ({ method: req.method, url: req.url }),
        res: (res) => ({ statusCode: res.statusCode }),
      },
    })
  );

  app.use(securityHeaders());
  app.use(extraSecurityHeaders());
  app.use(sameOriginOnly());
  app.use(express.json({ limit: JSON_BODY_LIMIT }));
  app.use(express.urlencoded({ extended: false, limit: JSON_BODY_LIMIT }));
  app.use(cookieParser());

  app.use((req, _res, next) => {
    req.db = deps.db;
    next();
  });

  mountRouter(app, '/api/health', healthRouter());

  // Everything past this point is state-changing-aware: CSRF first, then the
  // session, so a forged request is rejected before it can touch a session.
  app.use(csrfGuard());
  app.use(loadSession());

  mountRouter(app, '/api/auth', authRouter());
  mountRouter(app, '/api/me', meRouter());
  mountRouter(app, '/api/org', orgRouter());

  app.use(notFoundHandler());
  app.use(errorHandler());

  return app;
}
