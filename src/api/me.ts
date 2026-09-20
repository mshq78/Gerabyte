import { mockRequest } from './client';
import { User, NotificationPrefs, Level, Badge } from '../types/domain';
import { getStoredUser, setStoredUser } from './mockUser';
import { MOCK_BADGES } from '../mock/data';

const STORAGE_PREFS_KEY = 'gerabyte:notif_prefs';

const defaultPrefs: NotificationPrefs = {
  channels: {
    push: true,
    sms: true,
    bale: true,
    eitaa: false,
    telegram: false,
    email: false,
  },
  dailyReminderTime: '09:00',
  quietHours: ['22:00', '07:00'],
  dailyCap: 2,
};

export const meApi = {
  // TODO(backend): GET /api/v1/me
  async get(): Promise<User> {
    return mockRequest(
      () => {
        return getStoredUser();
      },
      { endpoint: '/api/v1/me' }
    );
  },

  // TODO(backend): PATCH /api/v1/me/daily-goal
  async setDailyGoal(goal: 1 | 2 | 3): Promise<User> {
    return mockRequest(
      () => {
        const current = getStoredUser();
        const updated: User = { ...current, dailyGoal: goal, onboardingCompleted: true };
        setStoredUser(updated);
        return updated;
      },
      { endpoint: '/api/v1/me/daily-goal' }
    );
  },

  // TODO(backend): GET /api/v1/me/notification-prefs
  async getNotificationPrefs(): Promise<NotificationPrefs> {
    return mockRequest(
      () => {
        if (typeof window !== 'undefined') {
          const raw = localStorage.getItem(STORAGE_PREFS_KEY);
          if (raw) {
            try {
              return JSON.parse(raw);
            } catch {
              // fallback
            }
          }
        }
        return defaultPrefs;
      },
      { endpoint: '/api/v1/me/notification-prefs' }
    );
  },

  // TODO(backend): PUT /api/v1/me/notification-prefs
  async updateNotificationPrefs(prefs: NotificationPrefs): Promise<NotificationPrefs> {
    return mockRequest(
      () => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_PREFS_KEY, JSON.stringify(prefs));
        }
        return prefs;
      },
      { endpoint: '/api/v1/me/notification-prefs' }
    );
  },

  // TODO(backend): POST /api/v1/me/level/accept-suggestion
  async acceptLevelSuggestion(): Promise<User> {
    return mockRequest(
      () => {
        const current = getStoredUser();
        if (!current.aiSuggestedLevel) return current;
        const updated: User = {
          ...current,
          level: current.aiSuggestedLevel.level,
          levelSource: 'ai_suggestion',
          aiSuggestedLevel: undefined,
        };
        setStoredUser(updated);
        return updated;
      },
      { endpoint: '/api/v1/me/level/accept-suggestion' }
    );
  },

  // TODO(backend): POST /api/v1/me/level/dismiss-suggestion
  async dismissLevelSuggestion(): Promise<User> {
    return mockRequest(
      () => {
        const current = getStoredUser();
        const updated: User = {
          ...current,
          aiSuggestedLevel: undefined,
        };
        setStoredUser(updated);
        return updated;
      },
      { endpoint: '/api/v1/me/level/dismiss-suggestion' }
    );
  },

  // TODO(backend): PATCH /api/v1/me/level
  async setLevelManually(level: Level): Promise<User> {
    return mockRequest(
      () => {
        const current = getStoredUser();
        const updated: User = {
          ...current,
          level,
          levelSource: 'placement_test',
          aiSuggestedLevel: undefined,
        };
        setStoredUser(updated);
        return updated;
      },
      { endpoint: '/api/v1/me/level' }
    );
  },

  // TODO(backend): GET /api/v1/me/badges
  async getBadges(): Promise<Badge[]> {
    return mockRequest(
      () => {
        return MOCK_BADGES;
      },
      { endpoint: '/api/v1/me/badges' }
    );
  },
};
