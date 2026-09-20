import { mockRequest } from './client';
import { Lesson, User } from '../types/domain';
import { MOCK_LESSONS, MOCK_LESSON_SHOWCASE } from '../mock/data';
import { getStoredUser, setStoredUser } from './auth';
import { subscriptionApi } from './subscription';
import { computeEntitlements, RULES } from '../lib/rules';
import { pathsApi, saveStoredPaths, getStoredPaths } from './paths';

export interface LessonCompleteResult {
  lessonId: string;
  xpEarned: number;
  bonusXp: number;
  totalXp: number;
  coinsEarned: number;
  streakIncremented: boolean;
  dailyGoalMet: boolean;
  user: User;
}

export const lessonsApi = {
  // TODO(backend): GET /api/v1/lessons/:id
  async get(id: string): Promise<Lesson> {
    return mockRequest(
      () => {
        if (MOCK_LESSONS[id]) {
          return MOCK_LESSONS[id];
        }
        // Look up real lesson title from path data (LessonSummary.title)
        const allPaths = getStoredPaths();
        let realTitle = '';
        for (const p of allPaths) {
          for (const u of p.units) {
            const found = u.lessons.find((l) => l.id === id);
            if (found) {
              realTitle = found.title;
              break;
            }
          }
          if (realTitle) break;
        }

        // Return showcase or adapted version using real lesson title
        return {
          ...MOCK_LESSON_SHOWCASE,
          id,
          title: realTitle || 'گرابایت کاربردی: مهارت‌های پیشرفته',
        };
      },
      { endpoint: `/api/v1/lessons/${id}` }
    );
  },

  // TODO(backend): POST /api/v1/lessons/:id/complete
  async complete(id: string, result: { perfectQuiz: boolean }): Promise<LessonCompleteResult> {
    return mockRequest(
      async () => {
        const user = getStoredUser();
        const subscription = await subscriptionApi.get();
        const entitlements = computeEntitlements(subscription);

        const basePathList = await pathsApi.list();
        let alreadyDone = false;

        // Update path status
        const updatedPaths = basePathList.map((p) => ({
          ...p,
          units: p.units.map((u) => {
            let foundCurrent = false;
            const newLessons = u.lessons.map((l, idx) => {
              if (l.id === id) {
                if (l.status === 'done') alreadyDone = true;
                foundCurrent = true;
                return { ...l, status: 'done' as const, completedAt: new Date().toISOString() };
              }
              if (foundCurrent && idx > 0 && l.status === 'locked') {
                foundCurrent = false;
                return { ...l, status: 'available' as const };
              }
              return l;
            });
            return { ...u, lessons: newLessons };
          }),
        }));
        saveStoredPaths(updatedPaths);

        let xpEarned = 0;
        let bonusXp = 0;
        let coinsEarned = 0;

        if (!alreadyDone) {
          xpEarned = RULES.XP_LESSON_BASE;
          if (result.perfectQuiz) {
            bonusXp = RULES.XP_LESSON_PERFECT_BONUS;
          }
        }

        const totalLessonXp = xpEarned + bonusXp;
        if (entitlements.canEarnCoins && totalLessonXp > 0) {
          coinsEarned = Math.round(totalLessonXp * RULES.COINS_PER_XP);
        }

        const newTodayCount = user.todayCompletedCount + 1;
        const dailyGoalMet = newTodayCount >= user.dailyGoal;
        let streakIncremented = false;
        let newStreak = user.streakDays;

        if (dailyGoalMet && user.todayCompletedCount < user.dailyGoal) {
          newStreak += 1;
          streakIncremented = true;
        }

        const updatedUser: User = {
          ...user,
          xpTotal: user.xpTotal + totalLessonXp,
          coins: user.coins + coinsEarned,
          todayCompletedCount: newTodayCount,
          streakDays: newStreak,
          bestStreak: Math.max(user.bestStreak, newStreak),
        };

        setStoredUser(updatedUser);

        return {
          lessonId: id,
          xpEarned,
          bonusXp,
          totalXp: totalLessonXp,
          coinsEarned,
          streakIncremented,
          dailyGoalMet,
          user: updatedUser,
        };
      },
      { endpoint: `/api/v1/lessons/${id}/complete` }
    );
  },
};
