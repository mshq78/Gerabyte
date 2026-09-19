import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, Trophy, AlertCircle, Award, ChevronLeft, ShieldCheck } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { toFa, formatNumberFa } from '../../lib/toFa';
import { Avatar } from '../../components/ui/Avatar';
import { StreakChain } from '../../components/ui/StreakChain';
import { ByteRow } from '../../components/ui/ByteRow';
import { Button } from '../../components/ui/Button';
import { LEVEL_NAMES } from '../../lib/format';
import { pathsApi } from '../../api/paths';
import { challengesApi } from '../../api/challenges';
import { meApi } from '../../api/me';
import { Challenge, LessonSummary } from '../../types/domain';

export const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, subscription, updateUserLocal, showToast } = useApp();
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [dismissedAiCard, setDismissedAiCard] = useState(false);
  const [nextLesson, setNextLesson] = useState<LessonSummary | null>(null);

  useEffect(() => {
    // Load resume lesson and active challenge
    async function loadData() {
      try {
        const paths = await pathsApi.list();
        const firstUnit = paths[0]?.units[0];
        const nextAvail = firstUnit?.lessons.find((l) => l.status === 'available' || l.status === 'in_progress') || firstUnit?.lessons[0];
        if (nextAvail) setNextLesson(nextAvail);

        const chs = await challengesApi.list();
        const joined = chs.find((c) => c.state === 'joined') || chs[0];
        if (joined) setActiveChallenge(joined);
      } catch {
        // fallback
      }
    }
    loadData();
  }, []);

  const handleAcceptAiLevel = async () => {
    try {
      const updated = await meApi.acceptLevelSuggestion();
      updateUserLocal(updated);
      showToast('سطح جدید شما با موفقیت تثبیت گردید.', 'success');
      setDismissedAiCard(true);
    } catch {
      showToast('خطا در اعمال سطح جدید.', 'error');
    }
  };

  const handleDismissAiLevel = async () => {
    try {
      await meApi.dismissLevelSuggestion();
      setDismissedAiCard(true);
    } catch {
      setDismissedAiCard(true);
    }
  };

  const levelInfo = LEVEL_NAMES[user.level];

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4">
      {/* 1. Top Bar */}
      <header className="flex items-center justify-between bg-white p-3 rounded-2xl border border-[#E8E1D5] shadow-xs">
        {/* User Identity & Level */}
        <div
          onClick={() => navigate('/profile')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <Avatar seed={user.avatarSeed} size={42} />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-[#0D3F6B] group-hover:text-[#1E6FA8] transition-colors">
                {user.fullName}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="px-2 py-0.5 rounded-md bg-[#EAF3F9] text-[#1E6FA8] text-[11px] font-bold">
                سطح {toFa(user.level)}: {levelInfo.title}
              </span>
            </div>
          </div>
        </div>

        {/* Top Badges: Streak Chain & Coins */}
        <div className="flex items-center gap-2">
          {/* Streak Chain */}
          <StreakChain count={user.streakDays} size="sm" showLabel={false} />

          {/* Coins Badge */}
          <button
            onClick={() => navigate('/rewards')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#FEF6EC] border border-[#F2A93B]/30 cursor-pointer active:scale-95 transition-transform"
            title="موجودی سکه‌های گرابایت"
          >
            <div className="w-4 h-4 rounded-full bg-[#F2A93B] flex items-center justify-center text-white text-[10px] font-black">
              G
            </div>
            <span className="font-bold text-sm text-[#0D3F6B]">
              {toFa(user.coins)}
            </span>
          </button>
        </div>
      </header>

      {/* 2. Expiring / Expired Subscription Alert Card */}
      {subscription.status === 'expiring' && (
        <div className="p-3.5 rounded-2xl bg-[#FEF6EC] border border-[#F2A93B]/40 text-[#0D3F6B] flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#E58A1F] shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-xs">
              تنها {toFa(subscription.remainingDays)} روز تا پایان اشتراک سازمانی
            </h4>
            <p className="text-[11px] text-[#0D3F6B]/80 mt-1 leading-relaxed">
              دستاوردهای شما همواره محفوظ است. برای تداوم دسترسی نامحدود، می‌توانید با اشتراک فردی ادامه دهید.
            </p>
            <button
              onClick={() => navigate('/subscription')}
              className="mt-2 text-xs font-bold text-[#1E6FA8] hover:underline inline-flex items-center gap-1"
            >
              <span>ادامه با اشتراک شخصی</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 3. AI Suggested Level Card (Dismissible) */}
      {!dismissedAiCard && user.aiSuggestedLevel && (
        <div className="p-4 rounded-2xl bg-white border-2 border-[#1E6FA8]/40 shadow-xs text-[#0D3F6B]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#1E6FA8]" />
              <h3 className="font-bold text-sm">پیشنهاد هوشمند ارتقای سطح</h3>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#EAF3F9] text-[#1E6FA8] font-bold">
              سطح {toFa(user.aiSuggestedLevel.level)} ({LEVEL_NAMES[user.aiSuggestedLevel.level].title})
            </span>
          </div>
          <ul className="space-y-1.5 my-3 text-xs text-[#0D3F6B]/85">
            {user.aiSuggestedLevel.reasons.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1E6FA8] mt-1.5 shrink-0" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" onClick={handleAcceptAiLevel}>
              پذیرش سطح پیشنهادی
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDismissAiLevel}>
              بعداً
            </Button>
          </div>
        </div>
      )}

      {/* 4. Daily Goal Byte Row */}
      <section className="p-4 rounded-2xl bg-white border border-[#E8E1D5] shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-[#0D3F6B]">هدف امروز شما</h3>
            <span className="text-xs text-[#0D3F6B]/70">
              ({toFa(user.todayCompletedCount)} از {toFa(user.dailyGoal)} گرابایت)
            </span>
          </div>
          <button
            onClick={() => navigate('/onboarding')}
            className="text-xs font-semibold text-[#1E6FA8] hover:underline"
          >
            تنظیم هدف
          </button>
        </div>

        <div className="flex items-center justify-between pt-1">
          <ByteRow
            total={user.dailyGoal}
            completed={user.todayCompletedCount}
            size="md"
            activeColor="#1E6FA8"
          />

          <span className="text-xs font-semibold text-[#0D3F6B]/80">
            {user.todayCompletedCount >= user.dailyGoal
              ? 'هدف امروز تکمیل شد!'
              : `${toFa(user.dailyGoal - user.todayCompletedCount)} گرابایت تا تکمیل`}
          </span>
        </div>
      </section>

      {/* 5. Resume Path Card with Tactile CTA */}
      <section className="p-5 rounded-2xl bg-gradient-to-b from-white to-[#FAF8F5] border-2 border-[#1E6FA8]/30 shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="px-2.5 py-0.5 rounded-full bg-[#EAF3F9] text-[#1E6FA8] text-xs font-bold">
            ادامه مسیر یادگیری
          </span>
          <span className="text-xs text-[#0D3F6B]/60 font-semibold">
            فصل اول · درس دوم
          </span>
        </div>

        <h3 className="text-base font-bold text-[#0D3F6B] mt-2 mb-1.5 leading-snug">
          {nextLesson?.title || 'شنیدن فعال: تمایز واژه‌ها و پیام در محیط کار'}
        </h3>

        <div className="flex items-center gap-3 text-xs text-[#0D3F6B]/70 mb-5">
          <span className="flex items-center gap-1 font-medium">
            ⏱ {toFa(nextLesson?.minutes || 3)} دقیقه مطالعه
          </span>
          <span>·</span>
          <span className="flex items-center gap-1 font-medium text-[#1E6FA8]">
            + {toFa(nextLesson?.xp || 10)} امتیاز تجربه
          </span>
        </div>

        {/* Tactile Slab Button */}
        <Button
          fullWidth
          size="lg"
          variant="primary"
          onClick={() => navigate(`/lesson/${nextLesson?.id || 'lesson-1-2'}`)}
          rightIcon={<ChevronLeft className="w-5 h-5 stroke-[2.5]" />}
        >
          شروع گرابایت
        </Button>
      </section>

      {/* 6. Active Challenge Strip (if any) */}
      {activeChallenge && (
        <section
          onClick={() => navigate(`/challenges/${activeChallenge.id}`)}
          className="p-4 rounded-2xl bg-white border border-[#E8E1D5] hover:border-[#1E6FA8]/50 shadow-xs cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#E58A1F] bg-[#FEF6EC] px-2 py-0.5 rounded-md">
              {activeChallenge.origin === 'org_requested' ? 'پویش سازمانی فولاد نمونه' : 'چالش رسمی گرا'}
            </span>
            <span className="text-xs text-[#0D3F6B]/60 font-semibold">
              {toFa(activeChallenge.progress)} از {toFa(activeChallenge.goal.target)} روز
            </span>
          </div>

          <h4 className="font-bold text-sm text-[#0D3F6B] line-clamp-1 mb-2">
            {activeChallenge.title}
          </h4>

          <div className="flex items-center justify-between">
            <ByteRow
              total={activeChallenge.goal.target}
              completed={activeChallenge.progress}
              size="sm"
              activeColor="#E58A1F"
            />
            <span className="text-xs font-bold text-[#1E6FA8] flex items-center gap-1">
              <span>مشاهده و ادامه</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </span>
          </div>
        </section>
      )}

      {/* 7. Compact League Standing */}
      <section
        onClick={() => navigate('/league')}
        className="p-4 rounded-2xl bg-white border border-[#E8E1D5] hover:border-[#1E6FA8]/50 shadow-xs cursor-pointer transition-all flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#EAF3F9] text-[#1E6FA8] flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-[#0D3F6B]">لیگ کیلوبایت</h4>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-gray-100 text-[#0D3F6B]">
                رتبه {toFa(12)} از {toFa(30)}
              </span>
            </div>
            <p className="text-xs text-[#0D3F6B]/70 mt-0.5">
              ۴۸ امتیاز تا منطقه صعود به مگابایت
            </p>
          </div>
        </div>

        <ChevronLeft className="w-5 h-5 text-[#0D3F6B]/40" />
      </section>

      {/* 8. Quick Domain Exploration shortcut */}
      <div className="pt-1 flex items-center justify-between text-xs text-[#0D3F6B]/70">
        <span>پردیس نوآوری گرا · نسخه فراگیر سازمانی</span>
        <button
          onClick={() => navigate('/path')}
          className="font-bold text-[#1E6FA8] hover:underline"
        >
          مشاهده تمام مسیرها
        </button>
      </div>
    </div>
  );
};
