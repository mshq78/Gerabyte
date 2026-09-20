import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import type { AppRole } from '../../../shared/schemas/me.js';
import type { Principal } from '../../policies/scope.js';
import { errorHandler } from './errorHandler.js';
import { requirePermission } from './auth.js';

/**
 * The permission gate on its own.
 *
 * `/api/org/*` only needs permissions a unit manager happens to hold, so the
 * route tests cannot show what happens when one is missing. This does: the
 * same middleware, a principal with each role, on a permission that is
 * org_admin only.
 */
function principal(roles: AppRole[]): Principal {
  return {
    userId: '00000000-0000-0000-0000-000000000001',
    roles,
    orgId: '00000000-0000-0000-0000-0000000000a1',
    managedNodeId: null,
    managedNodePath: null,
    orgRootNodeId: '00000000-0000-0000-0000-0000000000b1',
    orgRootNodePath: '/00000000-0000-0000-0000-0000000000b1/',
  };
}

function appFor(roles: AppRole[] | null) {
  const app = express();
  app.use((req, _res, next) => {
    if (roles) {
      req.auth = {
        sessionId: 'session',
        principal: principal(roles),
        context: { principal: principal(roles) } as never,
      };
    }
    next();
  });
  app.get('/settings', requirePermission('org.settings.manage'), (_req, res) => {
    res.json({ reached: true });
  });
  app.get('/people', requirePermission('org.people.read'), (_req, res) => {
    res.json({ reached: true });
  });
  app.use(errorHandler());
  return app;
}

describe('requirePermission', () => {
  it('lets an org admin through to an org-admin-only permission', async () => {
    const res = await request(appFor(['learner', 'org_admin'])).get('/settings');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ reached: true });
  });

  it('refuses a unit manager a permission they do not hold', async () => {
    const res = await request(appFor(['learner', 'unit_manager'])).get('/settings');
    expect(res.status).toBe(403);
    expect(res.body.error?.code).toBe('FORBIDDEN');
  });

  it('still lets that unit manager through on a permission they do hold', async () => {
    const res = await request(appFor(['learner', 'unit_manager'])).get('/people');
    expect(res.status).toBe(200);
  });

  it('refuses a plain learner everything', async () => {
    for (const path of ['/settings', '/people']) {
      const res = await request(appFor(['learner'])).get(path);
      expect(res.status, path).toBe(403);
    }
  });

  it('refuses a platform admin organization data', async () => {
    for (const path of ['/settings', '/people']) {
      const res = await request(appFor(['gera_admin'])).get(path);
      expect(res.status, path).toBe(403);
    }
  });

  it('answers 401, not 403, when there is no session at all', async () => {
    const res = await request(appFor(null)).get('/people');
    expect(res.status).toBe(401);
  });
});
