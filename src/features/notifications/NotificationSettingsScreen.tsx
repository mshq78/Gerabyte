import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Clock,
  Moon,
  Shield,
} from 'lucide-react';
import { meApi } from '../../api/me';
import { NotificationPrefs } from '../../types/domain';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../state/AppContext';
import { toFa } from '../../lib/toFa';

const RESPECTFUL_SAMPLE_MESSAGES = [
  '۳ دقیقه خلوت امروز برای مرور شایستگی‌های شغلی آماده است. هر زمان فرصت داشتید در کنارتان هستیم.',
  'مسیر پیوستگی شما ثبت شده است؛ هر زمان آماده بودید، یک گام کوتاه امروز بردارید.',
  'سلام! یادگیری امروز منتظر تمرکز دلنشین شماست؛ حتی یک گرابایت هم کافیست.',
];

export const NotificationSettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const p = await meApi.getNotificationPrefs();
        setPrefs(p);
      } catch {
        showToast('خطا در دریافت تنظیمات', 'error');
      }
    }
    load();
  }, [showToast]);

  if (!prefs) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6 text-ink">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-pill animate-spin" />
      </div>
    );
  }

  const handleToggleChannel = (channel: keyof NotificationPrefs['channels']) => {
    setPrefs((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        channels: {
          ...prev.channels,
          [channel]: !prev.channels[channel],
        },
      };
    });
  };

  const handleSave = async () => {
    if (!prefs) return;
    try {
      setIsSaving(true);
      await meApi.updateNotificationPrefs(prefs);
      showToast('تنظیمات یادآوری با موفقیت ذخیره شد.', 'success');
    } catch {
      showToast('خطا در ذخیره تنظیمات.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const channelsList: Array<{ key: keyof NotificationPrefs['channels']; label: string; note: string }> = [
    { key: 'push', label: 'نوتیفیکیشن مرورگر و گوشی (Push)', note: 'مسیر اول و سریع' },
    { key: 'bale', label: 'پیام‌رسان بله (Bale)', note: 'ارسال از طریق بات رسمی گرا' },
    { key: 'eitaa', label: 'پیام‌رسان ایتا (Eitaa)', note: 'ارسال شناسه درس' },
    { key: 'telegram', label: 'تلگرام (Telegram)', note: 'بات پشتیبان' },
    { key: 'sms', label: 'پیامک سازمانی (SMS)', note: 'فقط برای هشدارهای بحرانی زنجیره' },
    { key: 'email', label: 'رایانامه (Email)', note: 'گزارش هفتگی' },
  ];

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 text-ink">
      {/* Top Bar */}
      <header className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="min-h-[48px] px-3 py-2 rounded-tile text-ink/60 hover:text-ink hover:bg-surface flex items-center gap-1 text-meta font-bold cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
          <span>بازگشت</span>
        </button>
        <span className="text-meta font-bold text-primary bg-domain-1-tint px-3 py-1.5 rounded-pill">
          تنظیمات ارتباطی
        </span>
      </header>

      <h2 className="text-title font-black text-ink">کانال‌های دریافت یادآوری و زمان‌بندی</h2>

      {/* Failover note banner */}
      <div className="p-3.5 rounded-tile bg-domain-1-tint border border-primary/30 text-meta text-ink space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-primary">
          <Shield className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>سیاست جایگزینی خودکار (Fallback Policy):</span>
        </div>
        <p className="text-meta leading-relaxed">
          «اگر یک مسیر به هر دلیل در دسترس یا پاسخگو نبود، سامانه به ترتیب اولویت از مسیر فعال بعدی استفاده می‌کند تا پیوستگی یادگیری شما حفظ شود.»
        </p>
      </div>

      {/* 1. Channel Toggles */}
      <div className="p-4 rounded-sheet bg-surface border border-sunken shadow-xs space-y-3">
        <h3 className="font-bold text-body text-ink">کانال‌های فعال ارسال:</h3>
        <div className="space-y-2.5">
          {channelsList.map((ch) => {
            const isEnabled = prefs.channels[ch.key];
            return (
              <div
                key={ch.key}
                onClick={() => handleToggleChannel(ch.key)}
                className="flex items-center justify-between p-3 rounded-tile hover:bg-canvas cursor-pointer transition-colors min-h-[48px]"
              >
                <div>
                  <span className="text-body font-bold block text-ink">{ch.label}</span>
                  <span className="text-meta text-ink/60">{ch.note}</span>
                </div>

                {/* Custom Toggle Switch */}
                <div
                  className={`w-12 h-6 rounded-pill transition-colors relative flex items-center px-0.5 ${
                    isEnabled ? 'bg-primary' : 'bg-sunken-darker'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-pill bg-surface shadow-xs transition-transform ${
                      isEnabled ? '-translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Timing & Quiet Hours */}
      <div className="p-4 rounded-sheet bg-surface border border-sunken shadow-xs space-y-3 text-body">
        <h3 className="font-bold text-body text-ink">زمان‌بندی و ساعات سکوت:</h3>

        <div className="flex items-center justify-between min-h-[48px]">
          <span className="flex items-center gap-1.5 font-semibold text-meta">
            <Clock className="w-4 h-4 text-primary" aria-hidden="true" />
            ساعت یادآوری روزانه:
          </span>
          <select
            value={prefs.dailyReminderTime}
            onChange={(e) => setPrefs({ ...prefs, dailyReminderTime: e.target.value })}
            className="min-h-[48px] px-3 py-1.5 rounded-tile border border-sunken bg-paper font-mono font-bold text-meta outline-none cursor-pointer"
          >
            <option value="08:30">۰۸:۳۰ صبح</option>
            <option value="09:00">۰۹:۰۰ صبح</option>
            <option value="12:30">۱۲:۳۰ ظهر</option>
            <option value="17:00">۱۷:۰۰ عصر</option>
            <option value="20:00">۲۰:۰۰ شب</option>
            <option value="21:30">۲۱:۳۰ شب</option>
          </select>
        </div>

        <div className="flex items-center justify-between border-t border-sunken pt-2.5 min-h-[48px]">
          <span className="flex items-center gap-1.5 font-semibold text-meta">
            <Moon className="w-4 h-4 text-domain-4" aria-hidden="true" />
            ساعات سکوت شبانه (عدم ارسال پیام):
          </span>
          <span className="font-mono font-bold text-meta text-ink/80">
            {toFa(prefs.quietHours[0])} تا {toFa(prefs.quietHours[1])}
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-sunken pt-2.5 min-h-[48px]">
          <span className="text-meta">سقف روزانه پیام‌های یادآوری:</span>
          <span className="font-bold text-primary text-meta">
            حداکثر {toFa(prefs.dailyCap)} پیام در روز
          </span>
        </div>
      </div>

      {/* 3. Sample Respectful Messages Preview */}
      <div className="p-4 rounded-sheet bg-surface border border-sunken shadow-xs space-y-2.5">
        <h3 className="font-bold text-body text-ink">
          پیش‌نمایش لحن پیام‌های یادآوری گرا (محترمانه و غیرسرزنش‌گر):
        </h3>
        <p className="text-meta text-ink/70">
          پیام‌های گرابایت هرگز حس تقصیر یا فشار روانی ایجاد نمی‌کنند:
        </p>

        <div className="space-y-2 text-meta pt-1">
          {RESPECTFUL_SAMPLE_MESSAGES.map((msg, idx) => (
            <div
              key={idx}
              className="p-3 rounded-tile bg-paper border border-sunken text-ink/90 leading-relaxed font-medium"
            >
              «{msg}»
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-2">
        <Button
          fullWidth
          size="lg"
          variant="primary"
          isLoading={isSaving}
          onClick={handleSave}
        >
          ذخیره تنظیمات اعلان
        </Button>
      </div>
    </div>
  );
};
