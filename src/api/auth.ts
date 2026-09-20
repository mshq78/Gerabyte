import type { OtpRequestResult, SetPasswordInput } from '../../shared/schemas/auth';
import type { MeDto, SessionDto } from '../../shared/schemas/me';
import { http } from './http';

/**
 * Real authentication. There is no client-side session flag any more: the
 * session lives in an httpOnly cookie the browser cannot read, and "am I signed
 * in?" is answered by /api/me, never by localStorage.
 */
export const authApi = {
  /**
   * Ask for a code. The answer is the same whether or not the phone has an
   * account, so nothing here tells the caller which it was.
   */
  async requestOtp(phone: string): Promise<OtpRequestResult> {
    return http.post<OtpRequestResult>(
      '/auth/otp/request',
      { phone },
      {
        allowUnauthenticated: true,
      }
    );
  },

  async verifyOtp(phone: string, codeId: string, code: string): Promise<void> {
    await http.post('/auth/otp/verify', { phone, codeId, code }, { allowUnauthenticated: true });
  },

  async loginWithPassword(phone: string, password: string): Promise<void> {
    await http.post('/auth/login', { phone, password }, { allowUnauthenticated: true });
  },

  async setPassword(input: SetPasswordInput): Promise<void> {
    await http.post('/auth/password', input);
  },

  async logout(): Promise<void> {
    await http.post('/auth/logout', undefined, { allowUnauthenticated: true });
  },

  /** The current identity, or null when there is no live session. */
  async me(): Promise<MeDto | null> {
    try {
      return await http.get<MeDto>('/me', { allowUnauthenticated: true });
    } catch {
      return null;
    }
  },

  async sessions(): Promise<SessionDto[]> {
    const res = await http.get<{ items: SessionDto[] }>('/me/sessions');
    return res.items;
  },

  async revokeSession(id: string): Promise<void> {
    await http.delete(`/me/sessions/${id}`);
  },
};
