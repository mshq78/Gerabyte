import type { Principal } from './scope';
import { hasRole } from './scope';

export * from './scope';

/**
 * Every action the API gates on. The central list is the point: a new endpoint
 * adds an action here rather than inventing its own role check inline.
 */
export type Action =
  | 'org.tree.read'
  | 'org.people.read'
  | 'org.person.read'
  | 'org.people.export'
  | 'org.import.manage'
  | 'org.subscriptions.manage'
  | 'org.settings.manage'
  | 'org.roles.manage'
  | 'admin.panel.read';

/** Actions available to a unit manager, inside their own subtree only. */
const UNIT_MANAGER_ACTIONS: readonly Action[] = [
  'org.tree.read',
  'org.people.read',
  'org.person.read',
  'org.people.export',
];

/** Everything under /org. */
const ORG_ADMIN_ACTIONS: readonly Action[] = [
  ...UNIT_MANAGER_ACTIONS,
  'org.import.manage',
  'org.subscriptions.manage',
  'org.settings.manage',
  'org.roles.manage',
];

/**
 * Can this principal perform this action?
 *
 * This answers "is the verb allowed at all". Whether the specific *record* is
 * in reach is a separate question, answered by narrowing every query with a
 * Scope — see policies/scope.ts.
 *
 * TODO(phase-3): resource-level ownership checks land with assignments.
 */
export function can(principal: Principal, action: Action): boolean {
  if (hasRole(principal, 'gera_admin')) {
    // The Gera team administers the platform, not any one organization's data.
    return action === 'admin.panel.read';
  }
  if (hasRole(principal, 'org_admin')) return ORG_ADMIN_ACTIONS.includes(action);
  if (hasRole(principal, 'unit_manager')) return UNIT_MANAGER_ACTIONS.includes(action);
  return false;
}
