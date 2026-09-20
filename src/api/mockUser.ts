import type { MeDto } from '../../shared/schemas/me';
import type { User } from '../types/domain';
import { MOCK_PERSONAS } from '../mock/data';

/**
 * MOCK_ONLY bridge, retired in Phase 3.
 *
 * Identity — who you are, your roles, your organization — comes from the server
 * via /api/me. Everything gamified (XP, coins, streaks, level) is still mock
 * data, because the learning engine is not built yet.
 *
 * This module stitches the two together so the learner screens keep working:
 * real identity fields always win over the mock ones, and nothing here is ever
 * consulted for an authorization decision.
 */
const STORAGE_KEY_PROGRESS = 'gerabyte:mock_progress';

function baseUser(): User {
  const persona = MOCK_PERSONAS[0];
  if (!persona) throw new Error('mock personas are missing');
  return persona.user;
}

function storedProgress(): Partial<User> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROGRESS);
    return raw ? (JSON.parse(raw) as Partial<User>) : {};
  } catch {
    return {};
  }
}

export function saveMockProgress(patch: Partial<User>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify({ ...storedProgress(), ...patch }));
  } catch {
    // Progress is mock data; losing it is not worth an error.
  }
}

/**
 * Build the `User` the learner screens expect from the real identity plus the
 * mock progress. Server fields overwrite mock ones, never the other way round.
 */
export function composeUser(me: MeDto | null): User {
  const base = { ...baseUser(), ...storedProgress() };
  if (!me) return base;

  return {
    ...base,
    id: me.id,
    fullName: me.fullName,
    nickname: me.nickname,
    avatarSeed: me.avatarSeed,
    // Masked: the raw number never reaches the client.
    phone: me.phoneMasked,
    dailyGoal: me.dailyGoal,
    onboardingCompleted: me.onboardingCompleted,
    accountType: me.org ? 'org_member' : 'individual',
    roles: me.roles,
    ...(me.managedNodeId ? { managedNodeId: me.managedNodeId } : {}),
    ...(me.org && me.membership
      ? {
          membership: {
            orgId: me.org.id,
            orgName: me.org.name,
            orgRank: (me.membership.rank ?? 'operator') as User['membership'] extends undefined
              ? never
              : NonNullable<User['membership']>['orgRank'],
            nodePath: [me.org.name, me.membership.nodeName],
          },
        }
      : { membership: undefined }),
  };
}

/**
 * MOCK_ONLY: the user object the remaining mock API modules read and write.
 * Kept separate from the real identity so the two never blur.
 */
export function getStoredUser(): User {
  return composeUser(null);
}

export function setStoredUser(user: User): void {
  saveMockProgress(user);
}
