import { mockRequest } from './client';
import { AppNotification } from '../types/domain';
import { MOCK_NOTIFICATIONS } from '../mock/data';

const STORAGE_NOTIF_KEY = 'gerabyte:notifications';

function getStoredNotifications(): AppNotification[] {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_NOTIF_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
  }
  return MOCK_NOTIFICATIONS;
}

function saveNotifications(items: AppNotification[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_NOTIF_KEY, JSON.stringify(items));
  }
}

export const notificationsApi = {
  // TODO(backend): GET /api/v1/notifications
  async list(): Promise<AppNotification[]> {
    return mockRequest(() => getStoredNotifications(), { endpoint: '/api/v1/notifications' });
  },

  // TODO(backend): PATCH /api/v1/notifications/:id/read
  async markRead(id: string): Promise<AppNotification[]> {
    return mockRequest(() => {
      const items = getStoredNotifications();
      const updated = items.map((n) => (n.id === id ? { ...n, read: true } : n));
      saveNotifications(updated);
      return updated;
    }, { endpoint: `/api/v1/notifications/${id}/read` });
  },

  // TODO(backend): POST /api/v1/notifications/mark-all-read
  async markAllRead(): Promise<AppNotification[]> {
    return mockRequest(() => {
      const items = getStoredNotifications();
      const updated = items.map((n) => ({ ...n, read: true }));
      saveNotifications(updated);
      return updated;
    }, { endpoint: '/api/v1/notifications/mark-all-read' });
  },
};
