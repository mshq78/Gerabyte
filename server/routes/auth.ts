import { Router } from 'express';
import {
  otpRequestSchema,
  otpVerifySchema,
  passwordLoginSchema,
  setPasswordSchema,
  type OtpRequestResult,
} from '../../shared/schemas/auth.js';
import { env } from '../config/env.js';
import { AppError, badRequest, unauthenticated } from '../http/errors.js';
import { requireAuth } from '../http/middleware/auth.js';
import { parseBody } from '../http/validate.js';
import * as audit from '../services/audit.js';
import * as otpService from '../services/otp.js';
import { hashPassword, verifyPassword, describeHasher } from '../services/password.js';
import * as rateLimit from '../services/rateLimit.js';
import * as sessionService from '../services/session.js';
import * as usersRepo from '../repositories/users.js';
import { hashIp } from '../util/crypto.js';

export function authRouter(): Router {
  const router = Router();

  /**
   * POST /api/auth/otp/request
   *
   * The response is byte-for-byte identical whether or not the phone belongs to
   * an account: same shape, same timings on the happy path, always a codeId.
   * That is what stops this endpoint being a user-enumeration oracle.
   */
  router.post('/otp/request', async (req, res, next) => {
    try {
      const { phone } = parseBody(otpRequestSchema, req);
      const ip = req.ip;
      const ipHash = hashIp(env().IP_HASH_SECRET, ip);

      const cooldown = await otpService.resendCooldownRemaining(req.db, phone);
      if (cooldown > 0) throw otpService.cooldownError(cooldown);

      await rateLimit.enforce(req.db, rateLimit.LIMITS.otpRequestPerPhone, `phone:${phone}`);
      await rateLimit.enforce(req.db, rateLimit.LIMITS.otpRequestPerIp, `ip:${ip ?? 'unknown'}`);

      const issued = await otpService.issueOtp(req.db, phone);

      await audit.record(req.db, {
        action: 'auth.otp.requested',
        targetType: 'phone',
        // The audit log records the code id, never the phone or the code.
        targetId: issued.codeId,
        ipHash,
        requestId: req.requestId,
      });

      const body: OtpRequestResult = {
        codeId: issued.codeId,
        expiresInSeconds: otpService.OTP_TTL_SECONDS,
        resendAfterSeconds: otpService.OTP_RESEND_COOLDOWN_SECONDS,
      };
      res.status(200).json(body);
    } catch (error) {
      next(error);
    }
  });

  /** POST /api/auth/otp/verify — exchanges a valid code for a session. */
  router.post('/otp/verify', async (req, res, next) => {
    try {
      const { phone, codeId, code } = parseBody(otpVerifySchema, req);
      const ip = req.ip;
      const ipHash = hashIp(env().IP_HASH_SECRET, ip);

      await rateLimit.enforce(req.db, rateLimit.LIMITS.otpVerifyPerIp, `ip:${ip ?? 'unknown'}`);

      const outcome = await otpService.verifyOtp(req.db, phone, codeId, code);
      if (!outcome.ok) {
        await audit.record(req.db, {
          action: 'auth.otp.failed',
          targetType: 'otp',
          targetId: codeId,
          ipHash,
          requestId: req.requestId,
          metadata: { reason: outcome.code },
        });
        throw new AppError(400, outcome.code);
      }

      // Only now does the phone become an identity. An unknown phone that
      // proved ownership gets an account, adopting any pending invitation.
      let user = await usersRepo.findByPhone(req.db, phone);
      if (!user) user = await usersRepo.createFromPhone(req.db, phone);
      if (user.disabledAt) throw new AppError(403, 'ACCOUNT_DISABLED');

      const session = await sessionService.createSession(req.db, user.id, {
        userAgent: req.get('user-agent') ?? null,
        ipHash,
      });
      sessionService.setSessionCookie(res, session.token, session.idleExpiresAt);

      await rateLimit.reset(req.db, rateLimit.LIMITS.loginPerPhone, `phone:${phone}`);
      await audit.record(req.db, {
        action: 'auth.otp.verified',
        actorUserId: user.id,
        ipHash,
        requestId: req.requestId,
      });
      await audit.record(req.db, {
        action: 'auth.login.succeeded',
        actorUserId: user.id,
        ipHash,
        requestId: req.requestId,
        metadata: { method: 'otp' },
      });

      res.status(200).json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/auth/login — password login.
   *
   * Shares OTP's limits and answers identically for an unknown phone and a
   * wrong password, so neither reveals whether an account exists.
   */
  router.post('/login', async (req, res, next) => {
    try {
      const { phone, password } = parseBody(passwordLoginSchema, req);
      const ip = req.ip;
      const ipHash = hashIp(env().IP_HASH_SECRET, ip);

      await rateLimit.enforce(req.db, rateLimit.LIMITS.loginPerPhone, `phone:${phone}`);
      await rateLimit.enforce(req.db, rateLimit.LIMITS.loginPerIp, `ip:${ip ?? 'unknown'}`);

      const user = await usersRepo.findByPhone(req.db, phone);
      const hash = user ? await usersRepo.getPasswordHash(req.db, user.id) : null;
      // Run the verify even without a user so the timing does not distinguish
      // "no such account" from "wrong password".
      const ok = await verifyPassword(hash, password);

      if (!user || !ok) {
        await audit.record(req.db, {
          action: 'auth.login.failed',
          actorUserId: user?.id ?? null,
          ipHash,
          requestId: req.requestId,
          metadata: { method: 'password' },
        });
        throw new AppError(401, 'INVALID_CREDENTIALS');
      }
      if (user.disabledAt) throw new AppError(403, 'ACCOUNT_DISABLED');

      const session = await sessionService.createSession(req.db, user.id, {
        userAgent: req.get('user-agent') ?? null,
        ipHash,
      });
      sessionService.setSessionCookie(res, session.token, session.idleExpiresAt);

      await rateLimit.reset(req.db, rateLimit.LIMITS.loginPerPhone, `phone:${phone}`);
      await audit.record(req.db, {
        action: 'auth.login.succeeded',
        actorUserId: user.id,
        ipHash,
        requestId: req.requestId,
        metadata: { method: 'password' },
      });

      res.status(200).json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/auth/password — set or change the password for the signed-in user.
   * Changing an existing password requires the current one.
   */
  router.post('/password', requireAuth(), async (req, res, next) => {
    try {
      const auth = req.auth;
      if (!auth) throw unauthenticated();
      const { currentPassword, newPassword } = parseBody(setPasswordSchema, req);

      const existing = await usersRepo.getPasswordHash(req.db, auth.principal.userId);
      if (existing) {
        if (!currentPassword) throw badRequest('CURRENT_PASSWORD_REQUIRED');
        if (!(await verifyPassword(existing, currentPassword))) {
          throw new AppError(401, 'INVALID_CREDENTIALS');
        }
      }

      const hash = await hashPassword(newPassword);
      await usersRepo.setPasswordHash(req.db, auth.principal.userId, hash, await describeHasher());

      // A password change signs every other device out.
      await sessionService.revokeAllSessions(req.db, auth.principal.userId, auth.sessionId);

      await audit.record(req.db, {
        action: 'auth.password.set',
        actorUserId: auth.principal.userId,
        ipHash: hashIp(env().IP_HASH_SECRET, req.ip),
        requestId: req.requestId,
        metadata: { changed: Boolean(existing) },
      });

      res.status(200).json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  /** POST /api/auth/logout — revokes the current session. Idempotent. */
  router.post('/logout', async (req, res, next) => {
    try {
      if (req.auth) {
        await sessionService.revokeSession(req.db, req.auth.sessionId, req.auth.principal.userId);
        await audit.record(req.db, {
          action: 'auth.logout',
          actorUserId: req.auth.principal.userId,
          ipHash: hashIp(env().IP_HASH_SECRET, req.ip),
          requestId: req.requestId,
        });
      }
      sessionService.clearSessionCookie(res);
      res.status(200).json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
