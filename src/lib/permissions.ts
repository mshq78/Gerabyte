import { useApp } from '../state/AppContext';
import { User } from '../types/domain';
import { OrgRole } from '../types/org';

/**
 * Everything a dashboard user can be allowed to do.
 *
 * TODO(server): authoritative RBAC and scope on every endpoint; UI guards are UX only.
 */
export type Permission =
  | 'org.overview.view'
  | 'org.people.view'
  | 'org.person.report.view'
  | 'org.assignments.manage'
  | 'org.reports.view'
  | 'org.certificates.view'
  | 'org.challengeRequests.manage'
  | 'org.effectiveness.view'
  | 'org.import.manage'
  | 'org.subscriptions.manage'
  | 'org.settings.manage'
  | 'org.hierarchy.manage';

/** A unit manager works inside their own subtree and nowhere else. */
const UNIT_MANAGER_PERMISSIONS: readonly Permission[] = [
  'org.overview.view',
  'org.people.view',
  'org.person.report.view',
  'org.assignments.manage',
  'org.reports.view',
  'org.certificates.view',
  'org.challengeRequests.manage',
  'org.effectiveness.view',
];

/** An org admin gets everything under /org. */
const ORG_ADMIN_PERMISSIONS: readonly Permission[] = [
  ...UNIT_MANAGER_PERMISSIONS,
  'org.import.manage',
  'org.subscriptions.manage',
  'org.settings.manage',
  'org.hierarchy.manage',
];

export function can(role: OrgRole, permission: Permission): boolean {
  if (role === 'org_admin') return ORG_ADMIN_PERMISSIONS.includes(permission);
  if (role === 'unit_manager') return UNIT_MANAGER_PERMISSIONS.includes(permission);
  return false;
}

/**
 * The dashboard role a session actually carries. `org_admin` wins when a user
 * holds both; anyone else is a plain learner with no dashboard access.
 */
export function resolveOrgRole(user: Pick<User, 'roles'>): OrgRole {
  const roles = user.roles ?? [];
  if (roles.includes('org_admin')) return 'org_admin';
  if (roles.includes('unit_manager')) return 'unit_manager';
  return 'learner';
}

/** True when the session may open any part of the organization dashboard. */
export function canOpenDashboard(user: Pick<User, 'roles'>): boolean {
  return resolveOrgRole(user) !== 'learner';
}

/** True when the session may open the Gera admin panel. */
export function isGeraAdmin(user: Pick<User, 'roles'>): boolean {
  return (user.roles ?? []).includes('super_admin');
}

/**
 * UX-only permission check for the current session.
 *
 * TODO(server): authoritative RBAC and scope on every endpoint; UI guards are UX only.
 */
export function useCan(permission: Permission): boolean {
  const { user } = useApp();
  return can(resolveOrgRole(user), permission);
}
