import type { MeDto, UpdateMeInput } from '../../shared/schemas/me';
import { http } from './http';

/** Profile reads and writes. Everything else on /me arrives in Phase 3. */
export const meApi = {
  async get(): Promise<MeDto> {
    return http.get<MeDto>('/me');
  },

  async update(patch: UpdateMeInput): Promise<MeDto> {
    return http.patch<MeDto>('/me', patch);
  },

  async setDailyGoal(dailyGoal: 1 | 2 | 3): Promise<MeDto> {
    return http.patch<MeDto>('/me', { dailyGoal, onboardingCompleted: true });
  },
};
