import type { AppRole } from './schemas/me.js';

/**
 * The one place a role is turned into what it may do.
 *
 * Both sides import this: the web app to decide what to render and which
 * routes to guard, the server to decide which requests to answer. A second
 * copy of this matrix would drift, and the copy that drifts is always the one
 * guarding the data.
 *
 * The UI guards are a user-experience affordance — they hide a link that would
 * be refused anyway. The server's check is the real one.
 */
export const PERMISSIONS = [
  /** Baseline: may open the organization dashboard at all. */
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
  'org.import.manage',
  'org.subscriptions.manage',
  'org.settings.manage',
  /** Editing the organization tree itself. */
  'org.hierarchy.manage',
  'org.roles.manage',
  /** The Gera platform panel, which is not any organization's data. */
  'admin.panel.read',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/**
 * The single role a set of app roles resolves to for permission purposes.
 *
 * `gera_admin` is deliberately checked first. The Gera team administers the
 * platform, not any one organization's data, so holding it does not grant a
 * way into an organization even alongside an org role.
 */
export type PermissionRole = 'gera_admin' | 'org_admin' | 'unit_manager' | 'learner';

export function resolvePermissionRole(roles: readonly AppRole[] | undefined): PermissionRole {
  const held = roles ?? [];
  if (held.includes('gera_admin')) return 'gera_admin';
  if (held.includes('org_admin')) return 'org_admin';
  if (held.includes('unit_manager')) return 'unit_manager';
  return 'learner';
}

/** A unit manager works inside their own subtree and nowhere else. */
const UNIT_MANAGER_PERMISSIONS = [
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
] as const satisfies readonly Permission[];

/** An org admin gets everything under /org, and nothing outside it. */
const ORG_ADMIN_PERMISSIONS = [
  ...UNIT_MANAGER_PERMISSIONS,
  'org.import.manage',
  'org.subscriptions.manage',
  'org.settings.manage',
  'org.hierarchy.manage',
  'org.roles.manage',
] as const satisfies readonly Permission[];

export const PERMISSION_MATRIX: Readonly<Record<PermissionRole, readonly Permission[]>> = {
  learner: [],
  gera_admin: ['admin.panel.read'],
  unit_manager: UNIT_MANAGER_PERMISSIONS,
  org_admin: ORG_ADMIN_PERMISSIONS,
};

export function permissionsFor(role: PermissionRole): readonly Permission[] {
  return PERMISSION_MATRIX[role];
}

export function roleCan(role: PermissionRole, permission: Permission): boolean {
  return PERMISSION_MATRIX[role].includes(permission);
}

/** Convenience for the common case: app roles straight from `/api/me`. */
export function rolesCan(
  roles: readonly AppRole[] | undefined,
  permission: Permission
): boolean {
  return roleCan(resolvePermissionRole(roles), permission);
}

/** True when the session may open any part of the organization dashboard. */
export function canOpenDashboard(roles: readonly AppRole[] | undefined): boolean {
  return rolesCan(roles, 'org.dashboard.view');
}

/** True when the session may open the Gera admin panel. */
export function canOpenAdminPanel(roles: readonly AppRole[] | undefined): boolean {
  return rolesCan(roles, 'admin.panel.read');
}
