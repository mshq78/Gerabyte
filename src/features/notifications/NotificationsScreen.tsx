import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  CheckCheck,
  Calendar,
  Trophy,
  AlertCircle,
  Settings,
} from 'lucide-react';
import { notificationsApi } from '../../api/notifications';
import { AppNotification } from '../../types/domain';
import { useApp } from '../../state/AppContext';
import { formatJalaliShort } from '../../lib/jalali';

export const NotificationsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { setUnreadNotifsCount } = useApp();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'reminder' | 'league' | 'challenge' | 'system'>('all');

  useEffect(() => {
    async function load() {
      const list = await notificationsApi.list();
      setNotifications(list);
    }
    load();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    const updated = await notificationsApi.markRead(id);
    setNotifications(updated);
    setUnreadNotifsCount(updated.filter((n: AppNotification) => !n.read).length);
  };

  const handleMarkAllRead = async () => {
    const updated = await notificationsApi.markAllRead();
    setNotifications(updated);
    setUnreadNotifsCount(0);
  };

  const filtered = notifications.filter(
    (n) => activeFilter === 'all' || n.kind === activeFilter
  );

  const getIcon = (kind: string) => {
    switch (kind) {
      case 'league':
        return <Trophy className="w-5 h-5 text-coin" aria-hidden="true" />;
      case 'challenge':
        return <Calendar className="w-5 h-5 text-coin" aria-hidden="true" />;
      case 'reminder':
        return <Bell className="w-5 h-5 text-primary" aria-hidden="true" />;
      default:
        return <AlertCircle className="w-5 h-5 text-domain-4" aria-hidden="true" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 text-ink">
      {/* Header */}
      <header className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="min-h-[48px] px-3 py-2 rounded-tile text-ink/60 hover:text-ink hover:bg-surface flex items-center gap-1.5 text-meta font-bold cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
          <span>بازگشت</span>
        </button>

        <button
          onClick={() => navigate('/notification-settings')}
          className="min-h-[48px] px-3 py-2 rounded-tile text-ink/60 hover:text-ink hover:bg-surface flex items-center gap-1.5 text-meta font-bold cursor-pointer"
        >
          <Settings className="w-4 h-4" aria-hidden="true" />
          <span>تنظیمات کانال‌ها</span>
        </button>
      </header>

      <div className="flex items-center justify-between">
        <h2 className="text-title font-black text-ink">مرکز پیام و اعلان‌های هوشمند</h2>
        <button
          onClick={handleMarkAllRead}
          className="min-h-[48px] px-2 text-meta font-bold text-primary flex items-center gap-1 hover:underline cursor-pointer"
        >
          <CheckCheck className="w-4 h-4" aria-hidden="true" />
          <span>خواندن همه</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-meta">
        {[
          { id: 'all', label: 'همه' },
          { id: 'reminder', label: 'یادآوری‌ها' },
          { id: 'league', label: 'لیگ و رتبه‌بندی' },
          { id: 'challenge', label: 'چالش‌ها' },
          { id: 'system', label: 'سیستمی و اشتراک' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            className={`min-h-[48px] px-3.5 py-1.5 rounded-tile font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === tab.id
                ? 'bg-primary text-surface shadow-xs'
                : 'bg-surface text-ink/70 border border-sunken hover:bg-canvas'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-meta text-ink/60 bg-surface rounded-tile border border-sunken">
            اعلان جدیدی در این دسته وجود ندارد.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => handleMarkAsRead(item.id)}
              className={`p-3.5 min-h-[48px] rounded-tile border transition-all cursor-pointer flex items-start gap-3 ${
                item.read
                  ? 'bg-surface border-sunken'
                  : 'bg-domain-1-tint/60 border-primary/40 shadow-xs'
              }`}
            >
              <div className="w-10 h-10 rounded-tile bg-surface flex items-center justify-center shrink-0 border border-sunken shadow-2xs mt-0.5">
                {getIcon(item.kind)}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className={`text-body font-bold ${item.read ? 'text-ink' : 'text-primary'}`}>
                    {item.title}
                  </h4>
                  <span className="text-meta text-ink/50 font-mono">
                    {formatJalaliShort(item.at)}
                  </span>
                </div>
                <p className="text-meta text-ink/80 leading-relaxed font-normal">
                  {item.body}
                </p>
              </div>

              {!item.read && (
                <span className="w-2.5 h-2.5 rounded-pill bg-primary shrink-0 mt-2" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
