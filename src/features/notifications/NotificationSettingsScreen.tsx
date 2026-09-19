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
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-[#0D3F6B]">
        <div className="w-8 h-8 border-4 border-[#1E6FA8] border-t-transparent rounded-full animate-spin" />
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
    <div className="flex-1 flex flex-col p-4 space-y-4 text-[#0D3F6B]">
      {/* Top Bar */}
      <header className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl text-[#0D3F6B]/60 hover:text-[#0D3F6B] hover:bg-white flex items-center gap-1 text-xs font-bold"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت</span>
        </button>
        <span className="text-xs font-bold text-[#1E6FA8] bg-[#EAF3F9] px-3 py-1 rounded-full">
          تنظیمات ارتباطی
        </span>
      </header>

      <h2 className="text-base font-black">کانال‌های دریافت یادآوری و زمان‌بندی</h2>

      {/* Failover note banner */}
      <div className="p-3.5 rounded-2xl bg-[#EAF3F9] border border-[#1E6FA8]/30 text-xs text-[#0D3F6B] space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-[#1E6FA8]">
          <Shield className="w-4 h-4 shrink-0" />
          <span>سیاست جایگزینی خودکار (Fallback Policy):</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          «اگر یک مسیر به هر دلیل در دسترس یا پاسخگو نبود، سامانه به ترتیب اولویت از مسیر فعال بعدی استفاده می‌کند تا پیوستگی یادگیری شما حفظ شود.»
        </p>
      </div>

      {/* 1. Channel Toggles */}
      <div className="p-4 rounded-3xl bg-white border border-[#E8E1D5] shadow-xs space-y-3">
        <h3 className="font-bold text-xs">کانال‌های فعال ارسال:</h3>
        <div className="space-y-2.5">
          {channelsList.map((ch) => {
            const isEnabled = prefs.channels[ch.key];
            return (
              <div
                key={ch.key}
                onClick={() => handleToggleChannel(ch.key)}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div>
                  <span className="text-xs font-bold block">{ch.label}</span>
                  <span className="text-[10px] text-[#0D3F6B]/60">{ch.note}</span>
                </div>

                {/* Custom Toggle Switch */}
                <div
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                    isEnabled ? 'bg-[#1E6FA8]' : 'bg-[#DCD4C7]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                      isEnabled ? '-translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Timing & Quiet Hours */}
      <div className="p-4 rounded-3xl bg-white border border-[#E8E1D5] shadow-xs space-y-3 text-xs">
        <h3 className="font-bold text-xs">زمان‌بندی و ساعات سکوت:</h3>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-semibold">
            <Clock className="w-4 h-4 text-[#1E6FA8]" />
            ساعت یادآوری روزانه:
          </span>
          <select
            value={prefs.dailyReminderTime}
            onChange={(e) => setPrefs({ ...prefs, dailyReminderTime: e.target.value })}
            className="px-3 py-1.5 rounded-xl border border-[#E8E1D5] bg-[#FAF8F5] font-mono font-bold text-xs outline-none"
          >
            <option value="08:30">۰۸:۳۰ صبح</option>
            <option value="09:00">۰۹:۰۰ صبح</option>
            <option value="12:30">۱۲:۳۰ ظهر</option>
            <option value="17:00">۱۷:۰۰ عصر</option>
            <option value="20:00">۲۰:۰۰ شب</option>
            <option value="21:30">۲۱:۳۰ شب</option>
          </select>
        </div>

        <div className="flex items-center justify-between border-t border-[#E8E1D5] pt-2.5">
          <span className="flex items-center gap-1.5 font-semibold">
            <Moon className="w-4 h-4 text-[#7A5BD6]" />
            ساعات سکوت شبانه (عدم ارسال پیام):
          </span>
          <span className="font-mono font-bold text-[11px] text-[#0D3F6B]/80">
            {toFa(prefs.quietHours[0])} تا {toFa(prefs.quietHours[1])}
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-[#E8E1D5] pt-2.5">
          <span>سقف روزانه پیام‌های یادآوری:</span>
          <span className="font-bold text-[#1E6FA8]">
            حداکثر {toFa(prefs.dailyCap)} پیام در روز
          </span>
        </div>
      </div>

      {/* 3. Sample Respectful Messages Preview (Prompt §6: respectful, never guilt-tripping) */}
      <div className="p-4 rounded-3xl bg-white border border-[#E8E1D5] shadow-xs space-y-2.5">
        <h3 className="font-bold text-xs text-[#0D3F6B]">
          پیش‌نمایش لحن پیام‌های یادآوری گرا (محترمانه و غیرسرزنش‌گر):
        </h3>
        <p className="text-[11px] text-[#0D3F6B]/70">
          پیام‌های گرابایت هرگز حس تقصیر یا فشار روانی ایجاد نمی‌کنند:
        </p>

        <div className="space-y-2 text-xs pt-1">
          {RESPECTFUL_SAMPLE_MESSAGES.map((msg, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E1D5] text-[#0D3F6B]/90 leading-relaxed font-medium"
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
