import { describe, expect, it } from 'vitest';
import { RULES, computeEntitlements, getLevelProgress } from './rules';
import { LEVEL_NAMES } from './format';
import type { Level, Subscription, User } from '../types/domain';

const baseUser: User = {
  id: 'u-1',
  fullName: 'زهرا کریمی',
  nickname: 'زهرا',
  avatarSeed: 'karimi',
  phone: '09123456789',
  accountType: 'individual',
  level: 1,
  levelSource: 'placement_test',
  xpTotal: 0,
  coins: 0,
  streakDays: 0,
  bestStreak: 0,
  dailyGoal: 1,
  todayCompletedCount: 0,
  onboardingCompleted: true,
};

const sub = (over: Partial<Subscription> = {}): Subscription => ({
  tier: 'free',
  source: 'none',
  status: 'active',
  ...over,
});

describe('RULES: XP and coins', () => {
  it('keeps the XP awards and the daily cap consistent', () => {
    expect(RULES.XP_LESSON_BASE).toBe(10);
    expect(RULES.XP_LESSON_PERFECT_BONUS).toBe(5);
    expect(RULES.XP_CHECKPOINT_PASS).toBe(20);
    expect(RULES.XP_CERTIFICATE_EXAM_PASS).toBe(50);
    // A single action must never blow the daily cap on its own.
    const biggestSingleAward = RULES.XP_CERTIFICATE_EXAM_PASS;
    expect(biggestSingleAward).toBeLessThan(RULES.XP_DAILY_CAP);
  });

  it('mints one coin per ten XP', () => {
    expect(RULES.COINS_PER_XP).toBeCloseTo(0.1);
    expect(Math.floor(100 * RULES.COINS_PER_XP)).toBe(10);
    expect(Math.floor(RULES.XP_LESSON_BASE * RULES.COINS_PER_XP)).toBe(1);
  });

  it('promotes fewer learners than it demotes across a board', () => {
    expect(RULES.LEAGUE_PROMOTE_TOP + RULES.LEAGUE_DEMOTE_BOTTOM).toBeLessThan(
      RULES.LEAGUE_BOARD_SIZE
    );
  });
});

describe('computeEntitlements', () => {
  it('unlocks everything for an active full plan', () => {
    const e = computeEntitlements(sub({ tier: 'full', status: 'active' }));
    expect(e).toEqual({
      dailyLessonLimit: null,
      paidLessonsUnlocked: true,
      canEarnCoins: true,
      canJoinPrizeChallenges: true,
      canTakeCertificateExams: true,
    });
  });

  it('still unlocks everything while a full plan is expiring', () => {
    expect(computeEntitlements(sub({ tier: 'full', status: 'expiring' })).paidLessonsUnlocked).toBe(
      true
    );
  });

  it('locks an expired full plan back down to free', () => {
    const e = computeEntitlements(sub({ tier: 'full', status: 'expired' }));
    expect(e.dailyLessonLimit).toBe(1);
    expect(e.paidLessonsUnlocked).toBe(false);
    expect(e.canEarnCoins).toBe(false);
  });

  it('caps a free plan at one lesson a day and blocks the paid surfaces', () => {
    const e = computeEntitlements(sub());
    expect(e.dailyLessonLimit).toBe(1);
    expect(e.canJoinPrizeChallenges).toBe(false);
    expect(e.canTakeCertificateExams).toBe(false);
  });
});

describe('getLevelProgress', () => {
  it('reports 0% at the exact floor of a level', () => {
    const p = getLevelProgress({ ...baseUser, level: 2, xpTotal: LEVEL_NAMES[2].minXp });
    expect(p.progressPct).toBe(0);
    expect(p.nextLevel).toBe(3);
    expect(p.neededXp).toBe(LEVEL_NAMES[3].minXp - LEVEL_NAMES[2].minXp);
  });

  it('reports 100% and no remaining XP once the next floor is reached', () => {
    const p = getLevelProgress({ ...baseUser, level: 2, xpTotal: LEVEL_NAMES[3].minXp });
    expect(p.progressPct).toBe(100);
    expect(p.neededXp).toBe(0);
  });

  it('lands halfway through a level', () => {
    const mid = (LEVEL_NAMES[1].minXp + LEVEL_NAMES[2].minXp) / 2;
    expect(getLevelProgress({ ...baseUser, level: 1, xpTotal: mid }).progressPct).toBe(50);
  });

  it('never goes below 0 or above 100, whatever the XP', () => {
    for (const level of [1, 2, 3, 4, 5] as Level[]) {
      for (const xpTotal of [-500, 0, 10_000]) {
        const p = getLevelProgress({ ...baseUser, level, xpTotal });
        expect(p.progressPct).toBeGreaterThanOrEqual(0);
        expect(p.progressPct).toBeLessThanOrEqual(100);
        expect(p.neededXp).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('tops out at level 5 with no next level', () => {
    const p = getLevelProgress({ ...baseUser, level: 5, xpTotal: 3000 });
    expect(p.nextLevel).toBeNull();
    expect(p.nextTitle).toBeNull();
    expect(p.progressPct).toBe(100);
    expect(p.currentTitle).toBe(LEVEL_NAMES[5].title);
  });
});
