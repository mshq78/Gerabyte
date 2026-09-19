import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  Zap,
  CheckCircle2,
  Calendar as CalendarIcon,
  Shield,
  ChevronLeft,
  Building2,
  Lock,
  User as UserIcon,
  LogOut,
  Bell,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { Avatar } from '../../components/ui/Avatar';
import { StreakChain } from '../../components/ui/StreakChain';
import { Button } from '../../components/ui/Button';
import { toFa } from '../../lib/toFa';
import { LEVEL_NAMES } from '../../lib/format';
import { getJalaliMonthGrid, JalaliCalendarCell } from '../../lib/jalali';
import { MOCK_BADGES } from '../../mock/data';
import { Level } from '../../types/domain';

export const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, subscription, unreadNotifsCount } = useApp();

  const currentLevelInfo = LEVEL_NAMES[user.level];
  const nextLevel = Math.min(5, user.level + 1) as Level;
  const nextLevelInfo = LEVEL_NAMES[nextLevel];

  // Jalali streak calendar calculation
  const calendarGrid = getJalaliMonthGrid(user.streakDays);

  const xpInLevel = user.xpTotal % 500;
  const xpToNextLevel = 500;

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 text-[#0D3F6B]">
      {/* 1. Header Profile Card */}
      <header className="p-5 rounded-3xl bg-white border border-[#E8E1D5] shadow-xs relative overflow-hidden space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <Avatar seed={user.avatarSeed} size={56} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-[#0D3F6B]">
                  {user.fullName}
                </h2>
              </div>
              <p className="text-xs text-[#0D3F6B]/60 font-mono mt-0.5">
                {toFa(user.phone)}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="px-2.5 py-0.5 rounded-md bg-[#EAF3F9] text-[#1E6FA8] text-[11px] font-bold">
                  سطح {toFa(user.level)}: {currentLevelInfo.title}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/notifications')}
            className="p-2 rounded-xl text-[#0D3F6B]/60 hover:text-[#0D3F6B] hover:bg-gray-100 relative"
            aria-label="اعلان‌ها"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifsCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#D5483F]" />
            )}
          </button>
        </div>

        {/* Level XP Progress Bar */}
        <div className="space-y-1.5 pt-1 border-t border-[#E8E1D5]">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#0D3F6B]/70">پیشرفت تا سطح بعدی</span>
            <span className="font-bold text-[#1E6FA8]">
              {toFa(xpInLevel)} از {toFa(xpToNextLevel)} XP
            </span>
          </div>
          <div className="h-2.5 bg-[#E8E1D5] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1E6FA8] rounded-full transition-all duration-300"
              style={{ width: `${(xpInLevel / xpToNextLevel) * 100}%` }}
            />
          </div>
          <p className="text-[10px] text-[#0D3F6B]/60 text-left">
            هدف بعدی: سطح {toFa(nextLevel)} ({nextLevelInfo.title})
          </p>
        </div>
      </header>

      {/* 2. Stats Grid */}
      <section className="grid grid-cols-2 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-white border border-[#E8E1D5] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EAF3F9] text-[#1E6FA8] flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-[11px] text-[#0D3F6B]/60 block">مجموع امتیاز</span>
            <span className="text-base font-black text-[#0D3F6B]">
              {toFa(user.xpTotal)} XP
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-[#E8E1D5] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FEF6EC] text-[#F2A93B] flex items-center justify-center shrink-0">
            <StreakChain count={user.bestStreak} size="sm" showLabel={false} />
          </div>
          <div>
            <span className="text-[11px] text-[#0D3F6B]/60 block">بهترین زنجیره</span>
            <span className="text-base font-black text-[#0D3F6B]">
              {toFa(user.bestStreak)} روز
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-[#E8E1D5] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EDF8F6] text-[#2E9E6B] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-[11px] text-[#0D3F6B]/60 block">سکه افتخار</span>
            <span className="text-base font-black text-[#0D3F6B]">
              {toFa(user.coins)} سکه
            </span>
          </div>
        </div>

        <div
          onClick={() => navigate('/certificates')}
          className="p-3.5 rounded-2xl bg-white border border-[#E8E1D5] hover:border-[#1E6FA8]/40 shadow-xs flex items-center gap-3 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-[#F2EFFF] text-[#7A5BD6] flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-[11px] text-[#0D3F6B]/60 block">گواهینامه‌ها</span>
            <span className="text-base font-black text-[#0D3F6B]">
              مشاهده مدارک
            </span>
          </div>
        </div>
      </section>

      {/* 3. Jalali Month Streak Calendar */}
      <section className="p-4 rounded-3xl bg-white border border-[#E8E1D5] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-[#1E6FA8]" />
            <h3 className="font-bold text-xs">تقویم استمرار و زنجیره (شهریور ۱۴۰۵)</h3>
          </div>
          <StreakChain count={user.streakDays} size="sm" showLabel={false} />
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1.5 text-center pt-1">
          {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((day, idx) => (
            <span key={idx} className="text-[10px] text-[#0D3F6B]/50 font-bold py-1">
              {day}
            </span>
          ))}

          {calendarGrid.map((cell: JalaliCalendarCell, idx: number) => (
            <div
              key={idx}
              className={`aspect-square rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                cell.isStreakDay
                  ? 'bg-[#FEF6EC] text-[#E58A1F] border border-[#F2A93B]/40 shadow-2xs font-black'
                  : cell.isToday
                  ? 'border-2 border-[#1E6FA8] text-[#1E6FA8]'
                  : 'bg-[#FAF8F5] text-[#0D3F6B]/60'
              }`}
            >
              {toFa(cell.day)}
            </div>
          ))}
        </div>
      </section>

      {/* 4. Badges Collection (12 Badges) */}
      <section className="p-4 rounded-3xl bg-white border border-[#E8E1D5] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs">نشان‌های افتخار و دستاورد</h3>
          <span className="text-xs text-[#1E6FA8] font-bold">
            {toFa(MOCK_BADGES.filter((b) => b.unlockedAt).length)} از {toFa(MOCK_BADGES.length)}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          {MOCK_BADGES.map((b) => {
            const isUnlocked = !!b.unlockedAt;
            return (
              <div
                key={b.id}
                className={`p-2.5 rounded-2xl flex flex-col items-center text-center transition-all ${
                  isUnlocked
                    ? 'bg-[#FEF6EC] border border-[#F2A93B]/30'
                    : 'bg-[#FAF8F5] opacity-50 border border-[#E8E1D5]'
                }`}
                title={b.description}
              >
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xs font-black shadow-2xs mb-1 text-[#1E6FA8]">
                  {b.icon[0]}
                </div>
                <span className="text-[10px] font-bold text-[#0D3F6B] leading-tight line-clamp-1">
                  {b.title}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Memberships & Multi-Level Org Hierarchy */}
      <section className="p-4 rounded-3xl bg-white border border-[#E8E1D5] shadow-xs space-y-3">
        <h3 className="font-bold text-xs">عضویت‌ها و سازمان</h3>

        {user.accountType === 'org_member' && user.membership ? (
          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E1D5] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1E6FA8]">
              <Building2 className="w-4 h-4" />
              <span>سازمان متصل: {user.membership.orgName}</span>
            </div>

            {/* 4-level hierarchy path */}
            <div className="flex items-center flex-wrap gap-1 text-[11px] text-[#0D3F6B]/80 font-medium">
              {user.membership.nodePath.map((step: string, idx: number) => (
                <React.Fragment key={idx}>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-[#E8E1D5]">
                    {step}
                  </span>
                  {idx < user.membership!.nodePath.length - 1 && (
                    <span className="text-[#0D3F6B]/40">‹</span>
                  )}
                </React.Fragment>
              ))}
            </div>

            <p className="text-[11px] text-[#0D3F6B]/70 pt-1">
              رده سازمانی: <strong>{user.membership.orgRank}</strong>
            </p>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E1D5] flex items-center gap-2 text-xs text-[#0D3F6B]">
            <UserIcon className="w-4 h-4 text-[#1E6FA8]" />
            <span>حساب کاربری مستقل (فردی)</span>
          </div>
        )}

        {/* Disabled Family Row */}
        <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-dashed border-[#CFC5B6] flex items-center justify-between opacity-70">
          <div className="flex items-center gap-2 text-xs">
            <Lock className="w-4 h-4 text-[#0D3F6B]/60" />
            <span className="font-semibold text-[#0D3F6B]/70">عضویت خانواده گرابایت</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-gray-200 text-[#0D3F6B]/60 text-[10px] font-bold">
            به‌زودی
          </span>
        </div>
      </section>

      {/* 6. Subscription Card */}
      <section className="p-4 rounded-3xl bg-white border border-[#E8E1D5] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-xs">وضعیت اشتراک</h3>
            <p className="text-xs text-[#0D3F6B]/70 mt-0.5">
              {subscription.source === 'org_sponsored'
                ? `اشتراک سازمانی (${subscription.sponsorOrgName || 'فولاد نمونه'})`
                : subscription.tier === 'full'
                ? 'اشتراک کامل فردی'
                : 'طرح پایه (رایگان)'}
            </p>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              subscription.status === 'active'
                ? 'bg-[#EDF8F6] text-[#2E9E6B]'
                : subscription.status === 'expiring'
                ? 'bg-[#FEF6EC] text-[#E58A1F]'
                : 'bg-gray-100 text-[#0D3F6B]'
            }`}
          >
            {subscription.status === 'active' && subscription.remainingDays
              ? `${toFa(subscription.remainingDays)} روز مانده`
              : subscription.status === 'expiring' && subscription.remainingDays
              ? `تنها ${toFa(subscription.remainingDays)} روز مانده`
              : 'منقضی شده'}
          </span>
        </div>

        <Button
          fullWidth
          size="sm"
          variant="secondary"
          onClick={() => navigate('/subscription')}
          rightIcon={<ChevronLeft className="w-4 h-4" />}
        >
          مدیریت اشتراک و ارتقا
        </Button>
      </section>

      {/* Settings / Notifications quick link */}
      <div className="pt-2 flex items-center justify-between text-xs">
        <button
          onClick={() => navigate('/notification-settings')}
          className="font-bold text-[#1E6FA8] hover:underline"
        >
          تنظیمات زمان یادآوری و کانال‌ها
        </button>
        <button
          onClick={() => navigate('/login')}
          className="font-bold text-[#D5483F] flex items-center gap-1 hover:underline"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>خروج از حساب</span>
        </button>
      </div>
    </div>
  );
};
