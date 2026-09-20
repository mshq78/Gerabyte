import type { AppRole } from '../../shared/schemas/me';

/**
 * The scope every organization query must be narrowed by.
 *
 * `nodePath` is the materialized path of the subtree root the caller may see.
 * An org_admin gets the organization root; a unit_manager gets their own node.
 * Because every repository function takes a `Scope` as a required argument,
 * forgetting to narrow a query is a compile-time error rather than a leak.
 */
export interface Scope {
  readonly orgId: string;
  readonly nodePath: string;
  readonly rootNodeId: string;
}

/** The identity attached to a request once the session is resolved. */
export interface Principal {
  userId: string;
  roles: AppRole[];
  /** Organization the caller acts in, when they have an org role. */
  orgId: string | null;
  /** Subtree root for a unit_manager; null for every other role. */
  managedNodeId: string | null;
  managedNodePath: string | null;
  /** Root node of the caller's organization. */
  orgRootNodeId: string | null;
  orgRootNodePath: string | null;
}

export function hasRole(principal: Principal, role: AppRole): boolean {
  return principal.roles.includes(role);
}

/**
 * The scope a caller may read the organization through, or null when they have
 * none. org_admin outranks unit_manager when a user holds both.
 */
export function resolveScope(principal: Principal): Scope | null {
  if (hasRole(principal, 'org_admin')) {
    if (!principal.orgId || !principal.orgRootNodePath || !principal.orgRootNodeId) return null;
    return {
      orgId: principal.orgId,
      nodePath: principal.orgRootNodePath,
      rootNodeId: principal.orgRootNodeId,
    };
  }

  if (hasRole(principal, 'unit_manager')) {
    if (!principal.orgId || !principal.managedNodePath || !principal.managedNodeId) return null;
    return {
      orgId: principal.orgId,
      nodePath: principal.managedNodePath,
      rootNodeId: principal.managedNodeId,
    };
  }

  return null;
}

/** True when `candidatePath` is inside the scope's subtree (inclusive). */
export function pathWithinScope(scope: Scope, candidatePath: string): boolean {
  return candidatePath.startsWith(scope.nodePath);
}
