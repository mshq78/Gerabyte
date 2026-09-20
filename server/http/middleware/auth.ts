import type { NextFunction, Request, Response } from 'express';
import type { Database } from '../../../db/client.js';
import type { Permission } from '../../../shared/permissions.js';
import { can } from '../../policies/index.js';
import type { Principal, Scope } from '../../policies/scope.js';
import { resolveScope } from '../../policies/scope.js';
import { loadPrincipal, type PrincipalContext } from '../../repositories/users.js';
import * as sessionService from '../../services/session.js';
import { forbidden, unauthenticated } from '../errors.js';
import { tagPolicy } from '../routePolicy.js';

declare module 'express-serve-static-core' {
  interface Request {
    db: Database;
    auth?: {
      sessionId: string;
      principal: Principal;
      context: PrincipalContext;
    };
    scope?: Scope;
  }
}

/**
 * Resolve the session cookie into a principal, if there is one. Never rejects:
 * public routes still work, and requireAuth does the rejecting.
 */
export function loadSession() {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const token = sessionService.readSessionCookie(req);
      if (!token) {
        next();
        return;
      }
      const session = await sessionService.loadSession(req.db, token);
      if (!session) {
        next();
        return;
      }
      const context = await loadPrincipal(req.db, session.userId);
      req.auth = { sessionId: session.id, principal: context.principal, context };
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireAuth() {
  return tagPolicy((req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      // Clear a cookie that no longer resolves, so the browser stops sending it.
      sessionService.clearSessionCookie(res);
      next(unauthenticated());
      return;
    }
    next();
  }, { kind: 'authenticated' });
}

/**
 * Gate a route on a permission from the shared matrix.
 *
 * The tag is what makes the route show up as decided in the deny-by-default
 * policy test; the check is what makes it true at runtime.
 */
export function requirePermission(permission: Permission) {
  return tagPolicy((req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      next(unauthenticated());
      return;
    }
    if (!can(req.auth.principal, permission)) {
      next(forbidden());
      return;
    }
    next();
  }, { kind: 'permission', permission });
}

/**
 * Attach the organization scope every /api/org route must narrow by. A caller
 * with no resolvable scope is refused here rather than deeper in a query.
 */
export function requireScope() {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      next(unauthenticated());
      return;
    }
    const scope = resolveScope(req.auth.principal);
    if (!scope) {
      next(forbidden());
      return;
    }
    req.scope = scope;
    next();
  };
}
