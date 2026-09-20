import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { MeDto, UpdateMeInput } from '../../shared/schemas/me';
import { authApi } from '../api/auth';
import { meApi } from '../api/meApi';
import { setUnauthorizedHandler } from '../api/http';
import { getStoredSubscription, saveSubscription } from '../api/subscription';
import { computeEntitlements } from '../lib/rules';
import { notificationsApi } from '../api/notifications';
import { composeUser, saveMockProgress } from '../api/mockUser';
import type { Entitlements, Subscription, User } from '../types/domain';

interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

/**
 * `me` is the single source of truth for identity, and it comes from the
 * server. There is no stored user and no session flag in localStorage any more:
 * the session is an httpOnly cookie the page cannot read, so the only honest
 * answer to "who am I?" is whatever /api/me last said.
 */
interface AppContextType {
  me: MeDto | null;
  /**
   * MOCK_ONLY: real identity merged with mock progress, for the learner screens
   * that still read XP, coins and streaks. Never used for authorization —
   * `me.roles` is. Retired in Phase 3.
   */
  user: User;
  updateUserLocal: (updater: Partial<User> | ((prev: User) => User)) => void;
  /** False until the first /api/me call settles, so guards do not flash. */
  ready: boolean;
  isAuthenticated: boolean;
  refreshMe: () => Promise<MeDto | null>;
  updateMe: (patch: UpdateMeInput) => Promise<MeDto>;
  signOut: () => Promise<void>;

  // Still mock-backed until Phase 3 moves them to the server.
  subscription: Subscription;
  setSubscriptionLocal: (sub: Subscription) => void;
  entitlements: Entitlements;
  refreshSubscription: () => Promise<void>;

  unreadNotifsCount: number;
  setUnreadNotifsCount: (count: number) => void;
  refreshNotifsCount: () => Promise<void>;

  isOffline: boolean;
  toast: ToastState | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [me, setMe] = useState<MeDto | null>(null);
  const [ready, setReady] = useState(false);
  const [subscription, setSubscription] = useState<Subscription>(() => getStoredSubscription());
  const [unreadNotifsCount, setUnreadNotifsCount] = useState<number>(0);
  const [isOffline, setIsOffline] = useState<boolean>(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const [toast, setToast] = useState<ToastState | null>(null);
  const [user, setUser] = useState<User>(() => composeUser(null));

  const showToast = useCallback((message: string, type: ToastState['type'] = 'info') => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => setToast((curr) => (curr?.id === id ? null : curr)), 3800);
  }, []);

  const refreshMe = useCallback(async () => {
    const next = await authApi.me();
    setMe(next);
    setUser(composeUser(next));
    setReady(true);
    return next;
  }, []);

  const updateMe = useCallback(async (patch: UpdateMeInput) => {
    const next = await meApi.update(patch);
    setMe(next);
    setUser(composeUser(next));
    return next;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setMe(null);
      setUser(composeUser(null));
    }
  }, []);

  // A 401 from anywhere means the session is gone: drop the identity so the
  // route guards redirect on the next render.
  const updateUserLocal = useCallback((updater: Partial<User> | ((prev: User) => User)) => {
    setUser((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      saveMockProgress(next);
      return next;
    });
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setMe(null);
      setUser(composeUser(null));
    });
    return () => setUnauthorizedHandler(() => {});
  }, []);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshSubscription = useCallback(async () => {
    setSubscription(getStoredSubscription());
  }, []);

  const refreshNotifsCount = useCallback(async () => {
    try {
      const list = await notificationsApi.list();
      setUnreadNotifsCount(list.filter((n) => !n.read).length);
    } catch {
      // A notification badge is never worth surfacing an error for.
    }
  }, []);

  const setSubscriptionLocal = useCallback((sub: Subscription) => {
    setSubscription(sub);
    saveSubscription(sub);
  }, []);

  const entitlements = computeEntitlements(subscription);

  return (
    <AppContext.Provider
      value={{
        me,
        user,
        updateUserLocal,
        ready,
        isAuthenticated: me !== null,
        refreshMe,
        updateMe,
        signOut,
        subscription,
        setSubscriptionLocal,
        entitlements,
        refreshSubscription,
        unreadNotifsCount,
        setUnreadNotifsCount,
        refreshNotifsCount,
        isOffline,
        toast,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
