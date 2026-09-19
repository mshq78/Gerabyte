import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Subscription, Entitlements } from '../types/domain';
import { getStoredUser, setStoredUser } from '../api/auth';
import { getStoredSubscription, saveSubscription } from '../api/subscription';
import { computeEntitlements } from '../lib/rules';
import { MOCK_PERSONAS } from '../mock/data';
import { notificationsApi } from '../api/notifications';

interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  user: User;
  subscription: Subscription;
  entitlements: Entitlements;
  refreshUser: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  updateUserLocal: (updater: Partial<User> | ((prev: User) => User)) => void;
  setSubscriptionLocal: (sub: Subscription) => void;
  unreadNotifsCount: number;
  setUnreadNotifsCount: (count: number) => void;
  refreshNotifsCount: () => Promise<void>;
  isOffline: boolean;
  toast: ToastState | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  activePersonaIndex: number;
  switchPersona: (index: number) => void;
  advanceDay: () => void;
  endWeek: () => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(() => getStoredUser());
  const [subscription, setSubscription] = useState<Subscription>(() => getStoredSubscription());
  const [unreadNotifsCount, setUnreadNotifsCount] = useState<number>(3);
  const [isOffline, setIsOffline] = useState<boolean>(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const [toast, setToast] = useState<ToastState | null>(null);
  const [activePersonaIndex, setActivePersonaIndex] = useState<number>(0);

  // Online / Offline listener
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

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.id === id ? null : curr));
    }, 3800);
  }, []);

  const refreshUser = useCallback(async () => {
    const u = getStoredUser();
    setUser(u);
  }, []);

  const refreshSubscription = useCallback(async () => {
    const s = getStoredSubscription();
    setSubscription(s);
  }, []);

  const refreshNotifsCount = useCallback(async () => {
    try {
      const list = await notificationsApi.list();
      setUnreadNotifsCount(list.filter((n) => !n.read).length);
    } catch {
      // ignore
    }
  }, []);

  const updateUserLocal = useCallback((updater: Partial<User> | ((prev: User) => User)) => {
    setUser((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      setStoredUser(next);
      return next;
    });
  }, []);

  const setSubscriptionLocal = useCallback((sub: Subscription) => {
    setSubscription(sub);
    saveSubscription(sub);
  }, []);

  const switchPersona = useCallback((index: number) => {
    const persona = MOCK_PERSONAS[index];
    if (!persona) return;
    setActivePersonaIndex(index);
    setUser(persona.user);
    setStoredUser(persona.user);
    setSubscription(persona.subscription);
    saveSubscription(persona.subscription);
    showToast(`پرسونای «${persona.label}» بارگذاری شد.`, 'info');
  }, [showToast]);

  const advanceDay = useCallback(() => {
    setUser((prev) => {
      const goalMet = prev.todayCompletedCount >= prev.dailyGoal;
      const nextStreak = goalMet ? prev.streakDays + 1 : Math.max(0, prev.streakDays);
      const updated: User = {
        ...prev,
        todayCompletedCount: 0,
        streakDays: nextStreak,
        bestStreak: Math.max(prev.bestStreak, nextStreak),
      };
      setStoredUser(updated);
      return updated;
    });

    setSubscription((prev) => {
      if (prev.remainingDays !== undefined && prev.remainingDays > 0) {
        const nextDays = prev.remainingDays - 1;
        const updated: Subscription = {
          ...prev,
          remainingDays: nextDays,
          status: nextDays <= 0 ? 'expired' : nextDays <= 14 ? 'expiring' : 'active',
        };
        saveSubscription(updated);
        return updated;
      }
      return prev;
    });

    showToast('یک روز به جلو حرکت کردید. هدف روزانه ریست شد.', 'success');
  }, [showToast]);

  const endWeek = useCallback(() => {
    setUser((prev) => {
      // Award weekly league reward or reset
      const updated: User = {
        ...prev,
        xpTotal: prev.xpTotal + 50,
        coins: prev.coins + 5,
      };
      setStoredUser(updated);
      return updated;
    });
    showToast('هفته لیگ به پایان رسید و نتایج محاسبه شد (+۵۰ تجربه هفتگی).', 'success');
  }, [showToast]);

  const resetAllData = useCallback(() => {
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith('gerabyte:'));
      keys.forEach((k) => localStorage.removeItem(k));
    }
    const defaultPersona = MOCK_PERSONAS[0];
    setUser(defaultPersona.user);
    setStoredUser(defaultPersona.user);
    setSubscription(defaultPersona.subscription);
    saveSubscription(defaultPersona.subscription);
    setActivePersonaIndex(0);
    showToast('تمام داده‌های محلی ریست و بازیابی شدند.', 'info');
  }, [showToast]);

  const entitlements = computeEntitlements(subscription);

  return (
    <AppContext.Provider
      value={{
        user,
        subscription,
        entitlements,
        refreshUser,
        refreshSubscription,
        updateUserLocal,
        setSubscriptionLocal,
        unreadNotifsCount,
        setUnreadNotifsCount,
        refreshNotifsCount,
        isOffline,
        toast,
        showToast,
        activePersonaIndex,
        switchPersona,
        advanceDay,
        endWeek,
        resetAllData,
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
