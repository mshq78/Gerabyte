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
import { toFa } from '../../lib/toFa';

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
        return <Trophy className="w-5 h-5 text-[#F2A93B]" />;
      case 'challenge':
        return <Calendar className="w-5 h-5 text-[#E58A1F]" />;
      case 'reminder':
        return <Bell className="w-5 h-5 text-[#1E6FA8]" />;
      default:
        return <AlertCircle className="w-5 h-5 text-[#7A5BD6]" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 text-[#0D3F6B]">
      {/* Header */}
      <header className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl text-[#0D3F6B]/60 hover:text-[#0D3F6B] hover:bg-white flex items-center gap-1 text-xs font-bold"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت</span>
        </button>

        <button
          onClick={() => navigate('/notification-settings')}
          className="p-2 rounded-xl text-[#0D3F6B]/60 hover:text-[#0D3F6B] hover:bg-white flex items-center gap-1.5 text-xs font-bold"
        >
          <Settings className="w-4 h-4" />
          <span>تنظیمات کانال‌ها</span>
        </button>
      </header>

      <div className="flex items-center justify-between">
        <h2 className="text-base font-black">مرکز پیام و اعلان‌های هوشمند</h2>
        <button
          onClick={handleMarkAllRead}
          className="text-xs font-bold text-[#1E6FA8] flex items-center gap-1 hover:underline"
        >
          <CheckCheck className="w-4 h-4" />
          <span>خواندن همه</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 text-xs">
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
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeFilter === tab.id
                ? 'bg-[#1E6FA8] text-white shadow-xs'
                : 'bg-white text-[#0D3F6B]/70 border border-[#E8E1D5]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#0D3F6B]/60 bg-white rounded-2xl border border-[#E8E1D5]">
            اعلان جدیدی در این دسته وجود ندارد.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => handleMarkAsRead(item.id)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                item.read
                  ? 'bg-white border-[#E8E1D5]'
                  : 'bg-[#EAF3F9]/60 border-[#1E6FA8]/40 shadow-xs'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 border border-[#E8E1D5] shadow-2xs mt-0.5">
                {getIcon(item.kind)}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className={`text-xs font-bold ${item.read ? 'text-[#0D3F6B]' : 'text-[#1E6FA8]'}`}>
                    {item.title}
                  </h4>
                  <span className="text-[10px] text-[#0D3F6B]/50 font-mono">
                    {formatJalaliShort(item.at)}
                  </span>
                </div>
                <p className="text-xs text-[#0D3F6B]/80 leading-relaxed font-normal">
                  {item.body}
                </p>
              </div>

              {!item.read && (
                <span className="w-2 h-2 rounded-full bg-[#1E6FA8] shrink-0 mt-2" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
