import { describe, expect, it } from 'vitest';
import { Permission, can, canOpenDashboard, isGeraAdmin, resolveOrgRole } from './permissions';

const ORG_ADMIN_ONLY: Permission[] = [
  'org.import.manage',
  'org.subscriptions.manage',
  'org.settings.manage',
  'org.hierarchy.manage',
];

const SHARED: Permission[] = [
  'org.overview.view',
  'org.people.view',
  'org.person.report.view',
  'org.assignments.manage',
  'org.reports.view',
  'org.certificates.view',
  'org.challengeRequests.manage',
  'org.effectiveness.view',
];

describe('can', () => {
  it('gives an org admin everything under /org', () => {
    for (const p of [...SHARED, ...ORG_ADMIN_ONLY]) {
      expect(can('org_admin', p), p).toBe(true);
    }
  });

  it('gives a unit manager the read and assignment surfaces', () => {
    for (const p of SHARED) {
      expect(can('unit_manager', p), p).toBe(true);
    }
  });

  it('withholds import, subscriptions, settings and hierarchy from a unit manager', () => {
    for (const p of ORG_ADMIN_ONLY) {
      expect(can('unit_manager', p), p).toBe(false);
    }
  });

  it('gives a plain learner nothing at all', () => {
    for (const p of [...SHARED, ...ORG_ADMIN_ONLY]) {
      expect(can('learner', p), p).toBe(false);
    }
  });
});

describe('resolveOrgRole', () => {
  it('reads the role off the session roles', () => {
    expect(resolveOrgRole({ roles: ['learner', 'org_admin'] })).toBe('org_admin');
    expect(resolveOrgRole({ roles: ['learner', 'unit_manager'] })).toBe('unit_manager');
    expect(resolveOrgRole({ roles: ['learner'] })).toBe('learner');
  });

  it('acts as org_admin when a user holds both dashboard roles', () => {
    expect(resolveOrgRole({ roles: ['unit_manager', 'org_admin'] })).toBe('org_admin');
    expect(resolveOrgRole({ roles: ['org_admin', 'unit_manager'] })).toBe('org_admin');
  });

  it('never defaults a role-less session to org_admin', () => {
    expect(resolveOrgRole({})).toBe('learner');
    expect(resolveOrgRole({ roles: [] })).toBe('learner');
    expect(resolveOrgRole({ roles: undefined })).toBe('learner');
  });
});

describe('canOpenDashboard / isGeraAdmin', () => {
  it('lets both dashboard roles in and keeps everyone else out', () => {
    expect(canOpenDashboard({ roles: ['org_admin'] })).toBe(true);
    expect(canOpenDashboard({ roles: ['unit_manager'] })).toBe(true);
    expect(canOpenDashboard({ roles: ['learner'] })).toBe(false);
    expect(canOpenDashboard({})).toBe(false);
  });

  it('gates /admin on gera_admin alone', () => {
    expect(isGeraAdmin({ roles: ['gera_admin'] })).toBe(true);
    expect(isGeraAdmin({ roles: ['org_admin'] })).toBe(false);
    expect(isGeraAdmin({ roles: ['learner', 'unit_manager'] })).toBe(false);
    expect(isGeraAdmin({})).toBe(false);
  });
});
