/**
 * Business rules (rules.ts)
 * NOTE: In production, these calculations execute server-side.
 * They are encapsulated here to make backend handoff straightforward.
 */
import { User, Subscription, Entitlements, Level } from '../types/domain';
import { LEVEL_NAMES } from './format';

export const RULES = {
  XP_LESSON_BASE: 10,
  XP_LESSON_PERFECT_BONUS: 5,
  XP_CHECKPOINT_PASS: 20,
  XP_CERTIFICATE_EXAM_PASS: 50,
  XP_DAILY_GOAL_BONUS: 10,
  XP_DAILY_CAP: 150,

  COINS_PER_XP: 0.1, // 1 coin per 10 XP
  CERTIFICATE_PASS_MARK_PCT: 80,
  LEAGUE_PROMOTE_TOP: 7,
  LEAGUE_DEMOTE_BOTTOM: 5,
  LEAGUE_BOARD_SIZE: 30,
};

/**
 * Compute entitlements based on subscription tier and status
 * // TODO(backend): GET /me/entitlements or inside JWT / session claims
 */
export function computeEntitlements(subscription: Subscription): Entitlements {
  const isFullActive =
    subscription.tier === 'full' &&
    (subscription.status === 'active' || subscription.status === 'expiring');

  if (isFullActive) {
    return {
      dailyLessonLimit: null, // Unlimited
      paidLessonsUnlocked: true,
      canEarnCoins: true,
      canJoinPrizeChallenges: true,
      canTakeCertificateExams: true,
    };
  }

  // Free Tier
  return {
    dailyLessonLimit: 1, // 1 gerabyte per day
    paidLessonsUnlocked: false,
    canEarnCoins: false,
    canJoinPrizeChallenges: false,
    canTakeCertificateExams: false,
  };
}

/**
 * Calculate next level progression
 */
export function getLevelProgress(user: User): {
  currentLevel: Level;
  currentTitle: string;
  nextLevel: Level | null;
  nextTitle: string | null;
  currentLevelMinXp: number;
  nextLevelMinXp: number;
  progressPct: number;
  neededXp: number;
} {
  const current = user.level;
  const currentInfo = LEVEL_NAMES[current];
  const nextLevel = current < 5 ? ((current + 1) as Level) : null;

  if (!nextLevel) {
    return {
      currentLevel: current,
      currentTitle: currentInfo.title,
      nextLevel: null,
      nextTitle: null,
      currentLevelMinXp: currentInfo.minXp,
      nextLevelMinXp: currentInfo.minXp,
      progressPct: 100,
      neededXp: 0,
    };
  }

  const nextInfo = LEVEL_NAMES[nextLevel];
  const range = nextInfo.minXp - currentInfo.minXp;
  const currentProgress = Math.max(0, user.xpTotal - currentInfo.minXp);
  const progressPct = Math.min(100, Math.round((currentProgress / range) * 100));
  const neededXp = Math.max(0, nextInfo.minXp - user.xpTotal);

  return {
    currentLevel: current,
    currentTitle: currentInfo.title,
    nextLevel,
    nextTitle: nextInfo.title,
    currentLevelMinXp: currentInfo.minXp,
    nextLevelMinXp: nextInfo.minXp,
    progressPct,
    neededXp,
  };
}
