import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { User, Subscription, Entitlements } from '../types/domain';
import { getStoredUser, setStoredUser } from '../api/auth';
import { getStoredSubscription, saveSubscription } from '../api/subscription';
import { computeEntitlements } from '../lib/rules';
import { notificationsApi } from '../api/notifications';

interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  user: User;
  setUser: (user: User) => void;
  subscription: Subscription;
  setSubscription: (sub: Subscription) => void;
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

  const entitlements = computeEntitlements(subscription);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        subscription,
        setSubscription,
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
