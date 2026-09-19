import { mockRequest } from './client';
import { User } from '../types/domain';
import { MOCK_PERSONAS } from '../mock/data';

const STORAGE_KEY_USER = 'gerabyte:current_user';

export function getStoredUser(): User {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
  }
  return MOCK_PERSONAS[0].user;
}

export function setStoredUser(user: User): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  }
}

export const authApi = {
  // TODO(backend): POST /api/v1/auth/otp/request
  async requestOtp(phone: string): Promise<{ success: boolean; resendSeconds: number; message: string }> {
    return mockRequest(() => {
      if (!phone || phone.length < 10) {
        throw new Error('شماره موبایل وارد شده معتبر نیست.');
      }
      return {
        success: true,
        resendSeconds: 60,
        message: 'کد تایید ۵ رقمی ارسال گردید (در نسخه پیش‌نمایش هر کدی پذیرفته می‌شود).',
      };
    }, { endpoint: '/api/v1/auth/otp/request' });
  },

  // TODO(backend): POST /api/v1/auth/otp/verify
  async verifyOtp(phone: string, code: string): Promise<{ user: User; token: string; isNewUser: boolean }> {
    return mockRequest(() => {
      if (!code || code.trim().length !== 5) {
        throw new Error('کد تایید باید ۵ رقم باشد.');
      }
      const currentUser = getStoredUser();
      const updatedUser: User = {
        ...currentUser,
        phone,
      };
      setStoredUser(updatedUser);
      return {
        user: updatedUser,
        token: 'mock_jwt_token_gerabyte_' + Date.now(),
        isNewUser: !updatedUser.onboardingCompleted,
      };
    }, { endpoint: '/api/v1/auth/otp/verify' });
  },

  // TODO(backend): POST /api/v1/auth/login-password
  async loginWithPassword(phone: string, _password: string): Promise<{ user: User; token: string }> {
    return mockRequest(() => {
      if (!phone || phone.length < 10) {
        throw new Error('شماره موبایل نامعتبر است.');
      }
      const currentUser = getStoredUser();
      return {
        user: currentUser,
        token: 'mock_jwt_token_gerabyte_' + Date.now(),
      };
    }, { endpoint: '/api/v1/auth/login-password' });
  },

  // TODO(backend): POST /api/v1/auth/logout
  async logout(): Promise<{ success: boolean }> {
    return mockRequest(() => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('gerabyte:auth_token');
      }
      return { success: true };
    }, { endpoint: '/api/v1/auth/logout' });
  },
};
