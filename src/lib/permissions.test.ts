import { describe, expect, it } from 'vitest';
import { ORG_NAV_ITEMS, ORG_ROUTES } from '../features/org/nav';
import { PERMISSIONS } from '../../shared/permissions';
import { can, isGeraAdmin, resolveOrgRole } from './permissions';

// The matrix itself is tested in shared/permissions.test.ts, next to where it
// lives. This file covers the web app's adapter over it, and the nav table
// that both the sidebar and the router are generated from.

describe('resolveOrgRole', () => {
  it('reads the organization role off the session roles', () => {
    expect(resolveOrgRole({ roles: ['learner', 'org_admin'] })).toBe('org_admin');
    expect(resolveOrgRole({ roles: ['learner', 'unit_manager'] })).toBe('unit_manager');
    expect(resolveOrgRole({ roles: ['learner'] })).toBe('learner');
  });

  it('acts as org_admin when a user holds both dashboard roles', () => {
    expect(resolveOrgRole({ roles: ['unit_manager', 'org_admin'] })).toBe('org_admin');
  });

  it('never defaults a role-less session to org_admin', () => {
    expect(resolveOrgRole({})).toBe('learner');
    expect(resolveOrgRole({ roles: [] })).toBe('learner');
    expect(resolveOrgRole({ roles: undefined })).toBe('learner');
  });

  it('is not an organization role for a platform admin', () => {
    expect(resolveOrgRole({ roles: ['gera_admin'] })).toBe('learner');
    expect(isGeraAdmin({ roles: ['gera_admin'] })).toBe(true);
    expect(isGeraAdmin({ roles: ['org_admin'] })).toBe(false);
  });
});

describe('the org nav table', () => {
  it('names a real permission for every route', () => {
    for (const route of ORG_ROUTES) {
      expect(PERMISSIONS, route.path).toContain(route.permission);
    }
  });

  it('has no duplicate paths', () => {
    const paths = ORG_ROUTES.map((r) => r.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('shows a unit manager only what they may open', () => {
    const visible = ORG_NAV_ITEMS.filter((item) => can('unit_manager', item.permission)).map(
      (item) => item.path
    );
    expect(visible).not.toContain('/org/import');
    expect(visible).not.toContain('/org/subscriptions');
    expect(visible).not.toContain('/org/settings');
    expect(visible).toContain('/org/overview');
    expect(visible).toContain('/org/people');
  });

  it('shows an org admin every menu entry', () => {
    for (const item of ORG_NAV_ITEMS) {
      expect(can('org_admin', item.permission), item.path).toBe(true);
    }
  });

  it('guards the three URLs a unit manager could previously reach by typing', () => {
    // The regression this whole step exists for: these were reachable by URL
    // because only the sidebar hid them.
    for (const path of ['/org/import', '/org/subscriptions', '/org/settings']) {
      const route = ORG_ROUTES.find((r) => r.path === path);
      expect(route, path).toBeDefined();
      expect(can('unit_manager', route!.permission), path).toBe(false);
    }
  });
});
