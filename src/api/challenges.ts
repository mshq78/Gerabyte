import { mockRequest } from './client';
import { Challenge } from '../types/domain';
import { MOCK_CHALLENGES } from '../mock/data';

const STORAGE_CHALLENGES_KEY = 'gerabyte:challenges';

function getStoredChallenges(): Challenge[] {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_CHALLENGES_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
  }
  return MOCK_CHALLENGES;
}

function saveChallenges(list: Challenge[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_CHALLENGES_KEY, JSON.stringify(list));
  }
}

export const challengesApi = {
  // TODO(backend): GET /api/v1/challenges
  async list(): Promise<Challenge[]> {
    return mockRequest(() => getStoredChallenges(), { endpoint: '/api/v1/challenges' });
  },

  // TODO(backend): GET /api/v1/challenges/:id
  async get(id: string): Promise<Challenge | null> {
    return mockRequest(
      () => {
        const list = getStoredChallenges();
        return list.find((c) => c.id === id) || list[0];
      },
      { endpoint: `/api/v1/challenges/${id}` }
    );
  },

  // TODO(backend): POST /api/v1/challenges/:id/join
  async join(id: string): Promise<Challenge> {
    return mockRequest(
      () => {
        const list = getStoredChallenges();
        const updated = list.map((c) => {
          if (c.id === id) {
            return {
              ...c,
              state: 'joined' as const,
              participants: c.participants + 1,
            };
          }
          return c;
        });
        saveChallenges(updated);
        return updated.find((c) => c.id === id)!;
      },
      { endpoint: `/api/v1/challenges/${id}/join` }
    );
  },
};
