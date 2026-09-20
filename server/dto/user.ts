import { maskPhoneE164 } from '../../shared/schemas/common.js';
import type { MeDto, SessionDto } from '../../shared/schemas/me.js';
import type { PrincipalContext, UserRecord } from '../repositories/users.js';
import type { ActiveSession } from '../services/session.js';

/**
 * Explicit whitelists. A database row is never returned directly, so adding a
 * column cannot accidentally start exposing it.
 */
export function toMeDto(
  user: UserRecord,
  context: PrincipalContext,
  options: { hasPassword: boolean }
): MeDto {
  const goal = user.dailyGoal === 2 || user.dailyGoal === 3 ? user.dailyGoal : 1;
  return {
    id: user.id,
    fullName: user.fullName,
    nickname: user.nickname,
    avatarSeed: user.avatarSeed,
    // Even a user's own phone comes back masked; the client never needs it whole.
    phoneMasked: maskPhoneE164(user.phone),
    dailyGoal: goal,
    onboardingCompleted: user.onboardingCompleted,
    hasPassword: options.hasPassword,
    roles: context.principal.roles,
    org: context.org,
    membership: context.membership
      ? {
          nodeId: context.membership.nodeId,
          nodeName: context.membership.nodeName,
          // The path is ids; the client only needs to know how deep it sits.
          nodePath: context.membership.nodePath.split('/').filter(Boolean),
          rank: context.membership.rank,
          status: context.membership.status,
        }
      : null,
    managedNodeId: context.principal.managedNodeId,
  };
}

export function toSessionDto(session: ActiveSession, currentSessionId: string): SessionDto {
  return {
    id: session.id,
    createdAt: session.createdAt.toISOString(),
    lastSeenAt: session.lastSeenAt.toISOString(),
    expiresAt: session.idleExpiresAt.toISOString(),
    userAgent: session.userAgent,
    current: session.id === currentSessionId,
  };
}
