import { Router } from 'express';
import { z } from 'zod';
import { updateMeSchema } from '../../shared/schemas/me';
import { env } from '../config/env';
import { notFound, unauthenticated } from '../http/errors';
import { requireAuth } from '../http/middleware/auth';
import { parseBody } from '../http/validate';
import { toMeDto, toSessionDto } from '../dto/user';
import * as usersRepo from '../repositories/users';
import * as audit from '../services/audit';
import * as sessionService from '../services/session';
import { hashIp } from '../util/crypto';

export function meRouter(): Router {
  const router = Router();
  router.use(requireAuth());

  /** GET /api/me — the whole client identity, in one whitelisted payload. */
  router.get('/', async (req, res, next) => {
    try {
      const auth = req.auth;
      if (!auth) throw unauthenticated();
      const user = await usersRepo.findById(req.db, auth.principal.userId);
      if (!user) throw unauthenticated();
      const hasPassword = Boolean(await usersRepo.getPasswordHash(req.db, user.id));
      res.json(toMeDto(user, auth.context, { hasPassword }));
    } catch (error) {
      next(error);
    }
  });

  /** PATCH /api/me — name, nickname, daily goal, onboarding completion. */
  router.patch('/', async (req, res, next) => {
    try {
      const auth = req.auth;
      if (!auth) throw unauthenticated();
      const patch = parseBody(updateMeSchema, req);
      await usersRepo.updateProfile(req.db, auth.principal.userId, patch);

      const user = await usersRepo.findById(req.db, auth.principal.userId);
      if (!user) throw unauthenticated();
      const context = await usersRepo.loadPrincipal(req.db, user.id);
      const hasPassword = Boolean(await usersRepo.getPasswordHash(req.db, user.id));
      res.json(toMeDto(user, context, { hasPassword }));
    } catch (error) {
      next(error);
    }
  });

  /** GET /api/me/sessions — every live session, so a user can spot an intruder. */
  router.get('/sessions', async (req, res, next) => {
    try {
      const auth = req.auth;
      if (!auth) throw unauthenticated();
      const list = await sessionService.listSessions(req.db, auth.principal.userId);
      res.json({ items: list.map((s) => toSessionDto(s, auth.sessionId)) });
    } catch (error) {
      next(error);
    }
  });

  /** DELETE /api/me/sessions/:id — revoke one, including the current one. */
  router.delete('/sessions/:id', async (req, res, next) => {
    try {
      const auth = req.auth;
      if (!auth) throw unauthenticated();
      const id = z.uuid().parse(req.params.id);

      const revoked = await sessionService.revokeSession(req.db, id, auth.principal.userId);
      if (!revoked) throw notFound();

      await audit.record(req.db, {
        action: 'session.revoked',
        actorUserId: auth.principal.userId,
        targetType: 'session',
        targetId: id,
        ipHash: hashIp(env().IP_HASH_SECRET, req.ip),
        requestId: req.requestId,
      });

      if (id === auth.sessionId) sessionService.clearSessionCookie(res);
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
