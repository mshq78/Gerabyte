import { describe, expect, it } from 'vitest';
import {
  PERMISSIONS,
  PERMISSION_MATRIX,
  canOpenAdminPanel,
  canOpenDashboard,
  permissionsFor,
  resolvePermissionRole,
  roleCan,
  rolesCan,
  type Permission,
} from './permissions';

const ORG_ADMIN_ONLY: Permission[] = [
  'org.import.manage',
  'org.subscriptions.manage',
  'org.settings.manage',
  'org.hierarchy.manage',
  'org.roles.manage',
];

const SHARED_WITH_UNIT_MANAGER: Permission[] = [
  'org.dashboard.view',
  'org.tree.read',
  'org.people.read',
  'org.person.read',
  'org.people.export',
  'org.assignments.manage',
  'org.reports.view',
  'org.certificates.view',
  'org.challenges.manage',
  'org.effectiveness.view',
];

describe('the matrix', () => {
  it('covers every permission exactly once between the two org roles', () => {
    const covered = [...SHARED_WITH_UNIT_MANAGER, ...ORG_ADMIN_ONLY, 'admin.panel.read'];
    expect([...PERMISSIONS].sort()).toEqual(covered.sort());
  });

  it('gives an org admin everything under /org', () => {
    for (const p of [...SHARED_WITH_UNIT_MANAGER, ...ORG_ADMIN_ONLY]) {
      expect(roleCan('org_admin', p), p).toBe(true);
    }
  });

  it('gives a unit manager the read, assignment and challenge surfaces', () => {
    for (const p of SHARED_WITH_UNIT_MANAGER) {
      expect(roleCan('unit_manager', p), p).toBe(true);
    }
  });

  it('withholds import, subscriptions, settings, hierarchy and roles from a unit manager', () => {
    for (const p of ORG_ADMIN_ONLY) {
      expect(roleCan('unit_manager', p), p).toBe(false);
    }
  });

  it('gives a plain learner nothing at all', () => {
    expect(permissionsFor('learner')).toEqual([]);
    for (const p of PERMISSIONS) {
      expect(roleCan('learner', p), p).toBe(false);
    }
  });

  it('keeps an org role out of the platform panel and gera_admin out of org data', () => {
    expect(roleCan('org_admin', 'admin.panel.read')).toBe(false);
    expect(roleCan('unit_manager', 'admin.panel.read')).toBe(false);
    expect(permissionsFor('gera_admin')).toEqual(['admin.panel.read']);
    for (const p of PERMISSIONS) {
      if (p === 'admin.panel.read') continue;
      expect(roleCan('gera_admin', p), p).toBe(false);
    }
  });

  it('never lets a unit manager hold more than an org admin', () => {
    for (const p of PERMISSION_MATRIX.unit_manager) {
      expect(PERMISSION_MATRIX.org_admin, p).toContain(p);
    }
  });
});

describe('resolvePermissionRole', () => {
  it('reads the role off the session roles', () => {
    expect(resolvePermissionRole(['learner', 'org_admin'])).toBe('org_admin');
    expect(resolvePermissionRole(['learner', 'unit_manager'])).toBe('unit_manager');
    expect(resolvePermissionRole(['learner'])).toBe('learner');
  });

  it('acts as org_admin when a user holds both dashboard roles', () => {
    expect(resolvePermissionRole(['unit_manager', 'org_admin'])).toBe('org_admin');
    expect(resolvePermissionRole(['org_admin', 'unit_manager'])).toBe('org_admin');
  });

  it('never defaults a role-less session to org_admin', () => {
    expect(resolvePermissionRole([])).toBe('learner');
    expect(resolvePermissionRole(undefined)).toBe('learner');
  });

  it('treats gera_admin as the platform role even alongside an org role', () => {
    // Holding the platform role must not become a second way into an
    // organization's data. The server has always resolved it this way.
    expect(resolvePermissionRole(['gera_admin', 'org_admin'])).toBe('gera_admin');
    expect(rolesCan(['gera_admin', 'org_admin'], 'org.people.read')).toBe(false);
  });
});

describe('canOpenDashboard / canOpenAdminPanel', () => {
  it('lets both dashboard roles in and keeps everyone else out', () => {
    expect(canOpenDashboard(['org_admin'])).toBe(true);
    expect(canOpenDashboard(['unit_manager'])).toBe(true);
    expect(canOpenDashboard(['learner'])).toBe(false);
    expect(canOpenDashboard(['gera_admin'])).toBe(false);
    expect(canOpenDashboard(undefined)).toBe(false);
  });

  it('gates /admin on gera_admin alone', () => {
    expect(canOpenAdminPanel(['gera_admin'])).toBe(true);
    expect(canOpenAdminPanel(['org_admin'])).toBe(false);
    expect(canOpenAdminPanel(['learner', 'unit_manager'])).toBe(false);
    expect(canOpenAdminPanel(undefined)).toBe(false);
  });
});
