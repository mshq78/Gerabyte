import {
  canOpenAdminPanel,
  resolvePermissionRole,
  roleCan,
  type Permission,
  type PermissionRole,
} from '../../shared/permissions';
import { useApp } from '../state/AppContext';
import { User } from '../types/domain';
import { OrgRole } from '../types/org';

/**
 * The web app's view of the permission matrix.
 *
 * The matrix itself lives in `shared/permissions.ts` and is the same object
 * the server checks against — this module only adapts it to React and to the
 * app's own `User`/`OrgRole` types.
 *
 * Every guard here is UX only. The server refuses the request regardless.
 */
export type { Permission, PermissionRole };
export {
  canOpenAdminPanel,
  canOpenDashboard,
  permissionsFor,
  roleCan,
} from '../../shared/permissions';

export function can(role: PermissionRole, permission: Permission): boolean {
  return roleCan(role, permission);
}

/**
 * The dashboard role a session carries, for display and for the mock adapters
 * that still take an `OrgRole`. `gera_admin` is not an organization role, so
 * it resolves to `learner` here — it has no place inside `/org`.
 */
export function resolveOrgRole(user: Pick<User, 'roles'>): OrgRole {
  const role = resolvePermissionRole(user.roles);
  return role === 'org_admin' || role === 'unit_manager' ? role : 'learner';
}

/** True when the session may open the Gera admin panel. */
export function isGeraAdmin(user: Pick<User, 'roles'>): boolean {
  return canOpenAdminPanel(user.roles);
}

/** UX-only permission check for the current session. */
export function useCan(permission: Permission): boolean {
  const { me } = useApp();
  return roleCan(resolvePermissionRole(me?.roles), permission);
}

/** The permission role of the current session, for conditional rendering. */
export function usePermissionRole(): PermissionRole {
  const { me } = useApp();
  return resolvePermissionRole(me?.roles);
}
