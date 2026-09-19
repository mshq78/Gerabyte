import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Trophy, AlertCircle, ChevronLeft, ChevronDown } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { toFa } from '../../lib/toFa';
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
  const [isAiCardExpanded, setIsAiCardExpanded] = useState(false);
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
    <div className="flex-1 flex flex-col p-4 space-y-4 text-ink">
      {/* 1. Top Bar */}
      <header className="flex items-center justify-between bg-surface p-3 rounded-tile border border-sunken shadow-xs">
        {/* User Identity & Level */}
        <div
          onClick={() => navigate('/profile')}
          className="flex items-center gap-3 cursor-pointer group select-none min-h-[48px]"
        >
          <Avatar seed={user.avatarSeed} size={44} />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-body text-ink group-hover:text-primary transition-colors">
                {user.fullName}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="px-2 py-0.5 rounded-tile bg-domain-1-tint text-primary text-meta font-bold">
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
            className="inline-flex items-center gap-1.5 min-h-[48px] px-2.5 py-1 rounded-tile bg-domain-5-tint border border-coin/30 cursor-pointer active:scale-95 transition-transform"
            title="موجودی سکه‌های گرابایت"
            aria-label={`موجودی سکه‌های گرابایت: ${toFa(user.coins)} سکه`}
          >
            <div className="w-5 h-5 rounded-pill bg-coin flex items-center justify-center text-surface text-meta font-black">
              G
            </div>
            <span className="font-bold text-body text-ink">
              {toFa(user.coins)}
            </span>
          </button>
        </div>
      </header>

      {/* 2. Expiring / Expired Subscription Alert Card */}
      {subscription.status === 'expiring' && (
        <div className="p-3.5 rounded-tile bg-domain-5-tint border border-coin/40 text-ink flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-domain-5 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <h4 className="font-bold text-body">
              تنها {toFa(subscription.remainingDays)} روز تا پایان اشتراک سازمانی
            </h4>
            <p className="text-meta text-ink/80 mt-1 leading-relaxed">
              دستاوردهای شما همواره محفوظ است. برای تداوم دسترسی نامحدود، می‌توانید با اشتراک فردی ادامه دهید.
            </p>
            <button
              onClick={() => navigate('/subscription')}
              className="mt-2 min-h-[48px] text-meta font-bold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>ادامه با اشتراک شخصی</span>
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* 3. AI Suggested Level Banner (Compact one-line, expandable) */}
      {!dismissedAiCard && user.aiSuggestedLevel && (
        <div className="rounded-tile bg-surface border border-primary/40 shadow-xs text-ink overflow-hidden transition-all">
          <button
            onClick={() => setIsAiCardExpanded((prev) => !prev)}
            className="w-full min-h-[48px] px-3.5 py-2 flex items-center justify-between text-right cursor-pointer hover:bg-domain-1-tint/30 transition-colors"
            aria-expanded={isAiCardExpanded}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
              <span className="font-bold text-body text-ink">
                پیشنهاد سطح {toFa(user.aiSuggestedLevel.level)} آماده است
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-primary">
              <span className="text-meta font-bold">
                {LEVEL_NAMES[user.aiSuggestedLevel.level].title}
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  isAiCardExpanded ? 'rotate-180' : 'rotate-0'
                }`}
                aria-hidden="true"
              />
            </div>
          </button>

          {isAiCardExpanded && (
            <div className="p-3.5 pt-1 border-t border-sunken space-y-3 bg-domain-1-tint/20">
              <ul className="space-y-1.5 text-body text-ink/85">
                {user.aiSuggestedLevel.reasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-pill bg-primary mt-2 shrink-0" />
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
        </div>
      )}

      {/* 4. Daily Goal Byte Row */}
      <section className="p-4 rounded-tile bg-surface border border-sunken shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-title text-ink">هدف امروز شما</h3>
            <span className="text-meta text-ink/70">
              ({toFa(user.todayCompletedCount)} از {toFa(user.dailyGoal)} گرابایت)
            </span>
          </div>
          <button
            onClick={() => navigate('/onboarding')}
            className="min-h-[48px] px-2 flex items-center text-meta font-semibold text-primary hover:underline cursor-pointer"
          >
            تنظیم هدف
          </button>
        </div>

        <div className="flex items-center justify-between pt-1">
          <ByteRow
            total={user.dailyGoal}
            completed={user.todayCompletedCount}
            size="md"
            activeColor="var(--color-primary)"
          />

          <span className="text-meta font-semibold text-ink/80">
            {user.todayCompletedCount >= user.dailyGoal
              ? 'هدف امروز تکمیل شد!'
              : `${toFa(user.dailyGoal - user.todayCompletedCount)} گرابایت تا تکمیل`}
          </span>
        </div>
      </section>

      {/* 5. Resume Path Card with Tactile CTA */}
      <section className="p-5 rounded-tile bg-surface border-2 border-primary/30 shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="px-2.5 py-0.5 rounded-pill bg-domain-1-tint text-primary text-meta font-bold">
            ادامه مسیر یادگیری
          </span>
          <span className="text-meta text-ink/60 font-semibold">
            فصل اول · درس دوم
          </span>
        </div>

        <h3 className="text-read font-bold text-ink mt-2 mb-1.5 leading-snug">
          {nextLesson?.title || 'شنیدن فعال: تمایز واژه‌ها و پیام در محیط کار'}
        </h3>

        <div className="flex items-center gap-3 text-meta text-ink/70 mb-5">
          <span className="flex items-center gap-1 font-medium">
            ⏱ {toFa(nextLesson?.minutes || 3)} دقیقه مطالعه
          </span>
          <span>·</span>
          <span className="flex items-center gap-1 font-medium text-primary">
            + {toFa(nextLesson?.xp || 10)} امتیاز تجربه
          </span>
        </div>

        {/* Tactile Slab Button */}
        <Button
          fullWidth
          size="lg"
          variant="primary"
          onClick={() => navigate(`/lesson/${nextLesson?.id || 'lesson-1-2'}`)}
          rightIcon={<ChevronLeft className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />}
        >
          شروع گرابایت
        </Button>
      </section>

      {/* 6. Active Challenge Strip (if any) */}
      {activeChallenge && (
        <section
          onClick={() => navigate(`/challenges/${activeChallenge.id}`)}
          className="p-4 rounded-tile bg-surface border border-sunken hover:border-primary/50 shadow-xs cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-meta font-bold text-domain-5 bg-domain-5-tint px-2 py-0.5 rounded-tile">
              {activeChallenge.origin === 'org_requested' ? 'پویش سازمانی فولاد نمونه' : 'چالش رسمی گرا'}
            </span>
            <span className="text-meta text-ink/60 font-semibold">
              {toFa(activeChallenge.progress)} از {toFa(activeChallenge.goal.target)} روز
            </span>
          </div>

          <h4 className="font-bold text-body text-ink line-clamp-1 mb-2">
            {activeChallenge.title}
          </h4>

          <div className="flex items-center justify-between">
            <ByteRow
              total={activeChallenge.goal.target}
              completed={activeChallenge.progress}
              size="sm"
              activeColor="var(--color-domain-5)"
            />
            <span className="text-meta font-bold text-primary flex items-center gap-1">
              <span>مشاهده و ادامه</span>
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </span>
          </div>
        </section>
      )}

      {/* 7. Compact League Standing */}
      <section
        onClick={() => navigate('/league')}
        className="p-4 rounded-tile bg-surface border border-sunken hover:border-primary/50 shadow-xs cursor-pointer transition-all flex items-center justify-between min-h-[48px]"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-tile bg-domain-1-tint text-primary flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6 stroke-[2.2]" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-body text-ink">لیگ کیلوبایت</h4>
              <span className="text-meta font-bold px-2 py-0.5 rounded-tile bg-sunken/60 text-ink">
                رتبه {toFa(12)} از {toFa(30)}
              </span>
            </div>
            <p className="text-meta text-ink/70 mt-0.5">
              ۴۸ امتیاز تا منطقه صعود به مگابایت
            </p>
          </div>
        </div>

        <ChevronLeft className="w-5 h-5 text-ink/40" aria-hidden="true" />
      </section>

      {/* 8. Quick Domain Exploration shortcut */}
      <div className="pt-1 flex items-center justify-between text-meta text-ink/70">
        <span>پردیس نوآوری گرا · نسخه فراگیر سازمانی</span>
        <button
          onClick={() => navigate('/path')}
          className="min-h-[48px] px-2 flex items-center font-bold text-primary hover:underline cursor-pointer"
        >
          مشاهده تمام مسیرها
        </button>
      </div>
    </div>
  );
};
