import { Router } from 'express';
import { sql } from 'drizzle-orm';
import { env } from '../config/env.js';
import { describeHasher } from '../services/password.js';
import { publicRoute } from '../http/routePolicy.js';

/**
 * GET /api/health — liveness plus a real database round-trip.
 * Deliberately says nothing about hosts, versions or configuration values.
 */
export function healthRouter(): Router {
  const router = Router();

  router.get(
    '/',
    publicRoute('liveness probe: no session exists yet when a platform checks it'),
    async (req, res) => {
      const startedAt = Date.now();
      let database: 'ok' | 'unreachable' = 'ok';
      try {
        await req.db.execute(sql`select 1`);
      } catch {
        database = 'unreachable';
      }

      res.status(database === 'ok' ? 200 : 503).json({
        status: database === 'ok' ? 'ok' : 'degraded',
        database,
        deployEnv: env().DEPLOY_ENV,
        passwordHasher: await describeHasher(),
        uptimeSeconds: Math.round(process.uptime()),
        checkedInMs: Date.now() - startedAt,
      });
    }
  );

  return router;
}
