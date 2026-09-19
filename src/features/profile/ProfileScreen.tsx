import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  Zap,
  CheckCircle2,
  Calendar as CalendarIcon,
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
import { meApi } from '../../api/me';
import { Badge, Level } from '../../types/domain';

export const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, subscription, unreadNotifsCount } = useApp();
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    let active = true;
    meApi.getBadges().then((res) => {
      if (active) setBadges(res);
    });
    return () => {
      active = false;
    };
  }, []);

  const currentLevelInfo = LEVEL_NAMES[user.level];
  const nextLevel = Math.min(5, user.level + 1) as Level;
  const nextLevelInfo = LEVEL_NAMES[nextLevel];

  // Jalali streak calendar calculation
  const calendarGrid = getJalaliMonthGrid(user.streakDays);

  const xpInLevel = user.xpTotal % 500;
  const xpToNextLevel = 500;

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 text-ink">
      {/* 1. Header Profile Card */}
      <header className="p-5 rounded-sheet bg-surface border border-sunken shadow-xs relative overflow-hidden space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <Avatar seed={user.avatarSeed} size={56} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-title font-black text-ink">
                  {user.fullName}
                </h2>
              </div>
              <p className="text-meta text-ink/60 font-mono mt-0.5">
                {toFa(user.phone)}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="px-2.5 py-0.5 rounded-tile bg-domain-1-tint text-primary text-meta font-bold">
                  سطح {toFa(user.level)}: {currentLevelInfo.title}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/notifications')}
            className="w-12 h-12 rounded-tile text-ink/60 hover:text-ink hover:bg-canvas flex items-center justify-center relative cursor-pointer"
            aria-label="اعلان‌ها"
          >
            <Bell className="w-5 h-5" aria-hidden="true" />
            {unreadNotifsCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-pill bg-danger" />
            )}
          </button>
        </div>

        {/* Level XP Progress Bar */}
        <div className="space-y-1.5 pt-1 border-t border-sunken">
          <div className="flex items-center justify-between text-meta">
            <span className="font-semibold text-ink/70">پیشرفت تا سطح بعدی</span>
            <span className="font-bold text-primary">
              {toFa(xpInLevel)} از {toFa(xpToNextLevel)} XP
            </span>
          </div>
          <div className="h-2.5 bg-sunken rounded-pill overflow-hidden">
            <div
              className="h-full bg-primary rounded-pill transition-all duration-300"
              style={{ width: `${(xpInLevel / xpToNextLevel) * 100}%` }}
            />
          </div>
          <p className="text-meta text-ink/60 text-left">
            هدف بعدی: سطح {toFa(nextLevel)} ({nextLevelInfo.title})
          </p>
        </div>
      </header>

      {/* 2. Stats Grid */}
      <section className="grid grid-cols-2 gap-2.5">
        <div className="p-3.5 rounded-tile bg-surface border border-sunken shadow-xs flex items-center gap-3 min-h-[48px]">
          <div className="w-10 h-10 rounded-tile bg-domain-1-tint text-primary flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 stroke-[2.2]" aria-hidden="true" />
          </div>
          <div>
            <span className="text-meta text-ink/60 block">مجموع امتیاز</span>
            <span className="text-body font-black text-ink">
              {toFa(user.xpTotal)} XP
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-tile bg-surface border border-sunken shadow-xs flex items-center gap-3 min-h-[48px]">
          <div className="w-10 h-10 rounded-tile bg-domain-5-tint text-coin flex items-center justify-center shrink-0">
            <StreakChain count={user.bestStreak} size="sm" showLabel={false} />
          </div>
          <div>
            <span className="text-meta text-ink/60 block">بهترین زنجیره</span>
            <span className="text-body font-black text-ink">
              {toFa(user.bestStreak)} روز
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-tile bg-surface border border-sunken shadow-xs flex items-center gap-3 min-h-[48px]">
          <div className="w-10 h-10 rounded-tile bg-domain-3-tint text-success flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 stroke-[2.2]" aria-hidden="true" />
          </div>
          <div>
            <span className="text-meta text-ink/60 block">سکه افتخار</span>
            <span className="text-body font-black text-ink">
              {toFa(user.coins)} سکه
            </span>
          </div>
        </div>

        <div
          onClick={() => navigate('/certificates')}
          className="p-3.5 rounded-tile bg-surface border border-sunken hover:border-primary/40 shadow-xs flex items-center gap-3 cursor-pointer min-h-[48px]"
        >
          <div className="w-10 h-10 rounded-tile bg-domain-4-tint text-domain-4 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 stroke-[2.2]" aria-hidden="true" />
          </div>
          <div>
            <span className="text-meta text-ink/60 block">گواهینامه‌ها</span>
            <span className="text-body font-black text-ink">
              مشاهده مدارک
            </span>
          </div>
        </div>
      </section>

      {/* 3. Jalali Month Streak Calendar */}
      <section className="p-4 rounded-sheet bg-surface border border-sunken shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-primary" aria-hidden="true" />
            <h3 className="font-bold text-body">تقویم استمرار و زنجیره (شهریور ۱۴۰۵)</h3>
          </div>
          <StreakChain count={user.streakDays} size="sm" showLabel={false} />
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1.5 text-center pt-1">
          {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((day, idx) => (
            <span key={idx} className="text-meta text-ink/50 font-bold py-1">
              {day}
            </span>
          ))}

          {calendarGrid.map((cell: JalaliCalendarCell, idx: number) => (
            <div
              key={idx}
              className={`aspect-square rounded-tile flex items-center justify-center text-meta font-bold transition-all ${
                cell.isStreakDay
                  ? 'bg-domain-5-tint text-coin border border-coin/40 shadow-2xs font-black'
                  : cell.isToday
                  ? 'border-2 border-primary text-primary'
                  : 'bg-paper text-ink/60'
              }`}
            >
              {toFa(cell.day)}
            </div>
          ))}
        </div>
      </section>

      {/* 4. Badges Collection */}
      <section className="p-4 rounded-sheet bg-surface border border-sunken shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-body">نشان‌های افتخار و دستاورد</h3>
          <span className="text-meta text-primary font-bold">
            {toFa(badges.filter((b) => b.unlockedAt).length)} از {toFa(badges.length)}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          {badges.map((b) => {
            const isUnlocked = !!b.unlockedAt;
            return (
              <div
                key={b.id}
                className={`p-2.5 rounded-tile flex flex-col items-center text-center transition-all ${
                  isUnlocked
                    ? 'bg-domain-5-tint border border-coin/30'
                    : 'bg-paper opacity-50 border border-sunken'
                }`}
                title={b.description}
              >
                <div className="w-10 h-10 rounded-tile bg-surface flex items-center justify-center text-meta font-black shadow-2xs mb-1 text-primary">
                  {b.icon[0]}
                </div>
                <span className="text-meta font-bold text-ink leading-tight line-clamp-1">
                  {b.title}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Memberships & Multi-Level Org Hierarchy */}
      <section className="p-4 rounded-sheet bg-surface border border-sunken shadow-xs space-y-3">
        <h3 className="font-bold text-body">عضویت‌ها و سازمان</h3>

        {user.accountType === 'org_member' && user.membership ? (
          <div className="p-3.5 rounded-tile bg-paper border border-sunken space-y-2">
            <div className="flex items-center gap-2 text-meta font-bold text-primary">
              <Building2 className="w-4 h-4" aria-hidden="true" />
              <span>سازمان متصل: {user.membership.orgName}</span>
            </div>

            {/* 4-level hierarchy path */}
            <div className="flex items-center flex-wrap gap-1 text-meta text-ink/80 font-medium">
              {user.membership.nodePath.map((step: string, idx: number) => (
                <React.Fragment key={idx}>
                  <span className="px-2 py-0.5 rounded-tile bg-surface border border-sunken">
                    {step}
                  </span>
                  {idx < user.membership!.nodePath.length - 1 && (
                    <span className="text-ink/40">‹</span>
                  )}
                </React.Fragment>
              ))}
            </div>

            <p className="text-meta text-ink/70 pt-1">
              رده سازمانی: <strong>{user.membership.orgRank}</strong>
            </p>
          </div>
        ) : (
          <div className="p-3.5 rounded-tile bg-paper border border-sunken flex items-center gap-2 text-meta text-ink">
            <UserIcon className="w-4 h-4 text-primary" aria-hidden="true" />
            <span>حساب کاربری مستقل (فردی)</span>
          </div>
        )}

        {/* Disabled Family Row */}
        <div className="p-3 rounded-tile bg-paper border border-dashed border-sunken-darker flex items-center justify-between opacity-70">
          <div className="flex items-center gap-2 text-meta">
            <Lock className="w-4 h-4 text-ink/60" aria-hidden="true" />
            <span className="font-semibold text-ink/70">عضویت خانواده گرابایت</span>
          </div>
          <span className="px-2 py-0.5 rounded-pill bg-sunken text-ink/60 text-meta font-bold">
            به‌زودی
          </span>
        </div>
      </section>

      {/* 6. Subscription Card */}
      <section className="p-4 rounded-sheet bg-surface border border-sunken shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-body">وضعیت اشتراک</h3>
            <p className="text-meta text-ink/70 mt-0.5">
              {subscription.source === 'org_sponsored'
                ? `اشتراک سازمانی (${subscription.sponsorOrgName || 'فولاد نمونه'})`
                : subscription.tier === 'full'
                ? 'اشتراک کامل فردی'
                : 'طرح پایه (رایگان)'}
            </p>
          </div>
          <span
            className={`text-meta font-bold px-2.5 py-1 rounded-pill ${
              subscription.status === 'active'
                ? 'bg-domain-3-tint text-success'
                : subscription.status === 'expiring'
                ? 'bg-domain-5-tint text-coin'
                : 'bg-sunken text-ink'
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
          rightIcon={<ChevronLeft className="w-4 h-4" aria-hidden="true" />}
        >
          مدیریت اشتراک و ارتقا
        </Button>
      </section>

      {/* Settings / Notifications quick link */}
      <div className="pt-2 flex items-center justify-between text-meta">
        <button
          onClick={() => navigate('/notification-settings')}
          className="min-h-[48px] flex items-center font-bold text-primary hover:underline cursor-pointer"
        >
          تنظیمات زمان یادآوری و کانال‌ها
        </button>
        <button
          onClick={() => navigate('/login')}
          className="min-h-[48px] flex items-center font-bold text-danger gap-1 hover:underline cursor-pointer"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          <span>خروج از حساب</span>
        </button>
      </div>
    </div>
  );
};
