import {
  resolvePermissionRole,
  roleCan,
  type Permission,
  type PermissionRole,
} from '../../shared/permissions.js';
import type { Principal } from './scope.js';

export * from './scope.js';
export { PERMISSIONS, PERMISSION_MATRIX, permissionsFor } from '../../shared/permissions.js';
export type { Permission, PermissionRole };

/**
 * Can this principal perform this action?
 *
 * The matrix is `shared/permissions.ts`, the same one the web app renders
 * from, so a permission cannot mean one thing in the UI and another here.
 *
 * This answers "is the verb allowed at all". Whether the specific *record* is
 * in reach is a separate question, answered by narrowing every query with a
 * Scope — see policies/scope.ts.
 *
 * TODO(phase-3): resource-level ownership checks land with assignments.
 */
export function can(principal: Principal, permission: Permission): boolean {
  return roleCan(permissionRoleOf(principal), permission);
}

export function permissionRoleOf(principal: Principal): PermissionRole {
  return resolvePermissionRole(principal.roles);
}
