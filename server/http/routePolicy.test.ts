import { beforeAll, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import { PERMISSIONS } from '../../shared/permissions.js';
import { setupTestApp } from '../testing/harness.js';
import { collectRoutes } from './routePolicy.js';

/**
 * Deny by default.
 *
 * This is the test that makes the rule real: a route added without saying who
 * may call it fails here. There is no way to ship an endpoint without having
 * answered the question, and no way to answer it by accident — `public` needs
 * a written reason.
 */
describe('route policy', () => {
  let app: Express;

  beforeAll(async () => {
    ({ app } = await setupTestApp());
  });

  it('finds the routes the app actually serves', () => {
    const routes = collectRoutes(app);
    const paths = routes.map((r) => `${r.method} ${r.path}`);

    // A sanity check on the walker itself: if it silently found nothing, every
    // other assertion in this file would pass while proving nothing.
    expect(paths).toContain('GET /api/health');
    expect(paths).toContain('POST /api/auth/login');
    expect(paths).toContain('GET /api/me');
    expect(paths).toContain('GET /api/org/tree');
    expect(routes.length).toBeGreaterThanOrEqual(11);
  });

  it('declares a policy for every route', () => {
    const undeclared = collectRoutes(app)
      .filter((r) => r.policy === null)
      .map((r) => `${r.method} ${r.path}`);

    expect(
      undeclared,
      'every route must declare publicRoute(reason), requireAuth() or requirePermission(...)'
    ).toEqual([]);
  });

  it('gives every public route a written reason', () => {
    for (const route of collectRoutes(app)) {
      if (route.policy?.kind !== 'public') continue;
      expect(route.policy.reason.length, `${route.method} ${route.path}`).toBeGreaterThan(20);
    }
  });

  it('only gates routes on permissions that exist in the shared matrix', () => {
    for (const route of collectRoutes(app)) {
      if (route.policy?.kind !== 'permission') continue;
      expect(PERMISSIONS, `${route.method} ${route.path}`).toContain(route.policy.permission);
    }
  });

  it('keeps every /api/org route behind a permission', () => {
    const orgRoutes = collectRoutes(app).filter((r) => r.path.startsWith('/api/org'));
    expect(orgRoutes.length).toBeGreaterThan(0);
    for (const route of orgRoutes) {
      expect(route.policy?.kind, `${route.method} ${route.path}`).toBe('permission');
    }
  });
});
