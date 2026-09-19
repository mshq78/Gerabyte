import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  Clock,
  Bell,
  Compass,
  CheckCircle2,
  ChevronLeft,
  Check,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ByteRow } from '../../components/ui/ByteRow';
import { useApp } from '../../state/AppContext';
import { meApi } from '../../api/me';
import { toFa } from '../../lib/toFa';

export const OnboardingScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUserLocal, showToast } = useApp();

  const [step, setStep] = useState(1);
  const [dailyGoal, setDailyGoal] = useState<number>(user.dailyGoal || 2);
  const [reminderTime, setReminderTime] = useState('08:30');
  const [selectedDomains, setSelectedDomains] = useState<string[]>([
    'شایستگی‌های فردی و سازمانی',
    'فرهنگ ایمنی',
  ]);
  const [isSaving, setIsSaving] = useState(false);

  const totalSteps = user.accountType === 'individual' ? 4 : 3;

  const handleFinish = async () => {
    try {
      setIsSaving(true);
      const updated = await meApi.setDailyGoal(dailyGoal as 1 | 2 | 3);
      updateUserLocal(updated);
      showToast('تنظیمات یادگیری با موفقیت اعمال گردید.', 'success');
      navigate('/placement');
    } catch {
      navigate('/placement');
    } finally {
      setIsSaving(false);
    }
  };

  const domainOptions = [
    'شایستگی‌های فردی و سازمانی',
    'خانواده و تعادل کار و زندگی',
    'اخلاق حرفه‌ای و مسئولیت اجتماعی',
    'توسعه فردی و مهارت‌های نرم',
    'فرهنگ ایمنی، بهداشت و محیط زیست (HSE)',
  ];

  return (
    <div className="min-h-screen bg-canvas p-5 flex flex-col justify-between text-ink">
      {/* Top Stepper Header */}
      <header className="py-2 space-y-2">
        <div className="flex items-center justify-between text-meta font-bold text-ink/70">
          <span>شخصی‌سازی تجربه گرابایت</span>
          <span>گام {toFa(step)} از {toFa(totalSteps)}</span>
        </div>
        <div className="flex items-center gap-1.5 h-1.5 bg-sunken-dark rounded-pill overflow-hidden">
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <div
              key={idx}
              className={`h-full flex-1 transition-all ${
                idx + 1 <= step ? 'bg-primary' : 'bg-transparent'
              }`}
            />
          ))}
        </div>
      </header>

      {/* Main Step Container */}
      <div className="my-auto py-6 max-w-sm mx-auto w-full">
        {/* STEP 1: DAILY GOAL */}
        {step === 1 && (
          <div className="p-6 rounded-sheet bg-surface border border-sunken shadow-lg space-y-4 text-center">
            <div className="w-14 h-14 rounded-tile bg-domain-1-tint text-primary flex items-center justify-center mx-auto shadow-xs">
              <Target className="w-7 h-7 stroke-[2.2]" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-headline font-black text-ink">
                هدف مطالعه روزانه شما
              </h2>
              <p className="text-meta text-ink/70 mt-1">
                هر گرابایت تنها ۳ دقیقه زمان نیاز دارد:
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {[
                { count: 1, title: '۱ گرابایت در روز (۳ دقیقه)', desc: 'آهسته و پیوسته' },
                { count: 2, title: '۲ گرابایت در روز (۶ دقیقه)', desc: 'استاندارد و توصیه‌شده', popular: true },
                { count: 3, title: '۳ گرابایت در روز (۹ دقیقه)', desc: 'پیشرفت پرشتاب' },
              ].map((opt) => (
                <div
                  key={opt.count}
                  onClick={() => setDailyGoal(opt.count)}
                  className={`p-3.5 min-h-[48px] rounded-tile border-2 transition-all cursor-pointer text-right flex items-center justify-between ${
                    dailyGoal === opt.count
                      ? 'border-primary bg-domain-1-tint shadow-xs'
                      : 'border-sunken bg-surface hover:bg-canvas'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-body text-ink">{opt.title}</h4>
                      {opt.popular && (
                        <span className="text-meta font-bold px-1.5 py-0.5 rounded-pill bg-primary text-surface">
                          پیشنهادی
                        </span>
                      )}
                    </div>
                    <p className="text-meta text-ink/60 mt-0.5">{opt.desc}</p>
                  </div>
                  <ByteRow total={opt.count} completed={opt.count} size="sm" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: REMINDER TIME */}
        {step === 2 && (
          <div className="p-6 rounded-sheet bg-surface border border-sunken shadow-lg space-y-4 text-center">
            <div className="w-14 h-14 rounded-tile bg-domain-5-tint text-coin flex items-center justify-center mx-auto shadow-xs">
              <Clock className="w-7 h-7 stroke-[2.2]" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-headline font-black text-ink">
                زمان یادآوری مطالعه
              </h2>
              <p className="text-meta text-ink/70 mt-1">
                بهترین زمان روز برای ۳ دقیقه یادگیری متمرکز شما چه ساعتی است؟
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              {[
                { time: '08:30', label: '۰۸:۳۰ صبح (آغاز روز کاری)' },
                { time: '12:30', label: '۱۲:۳۰ ظهر (زمان استراحت و ناهار)' },
                { time: '17:00', label: '۱۷:۰۰ عصر (پایان شیفت کاری)' },
                { time: '20:30', label: '۲۰:۳۰ شب (زمان آرامش خانه)' },
              ].map((t) => (
                <button
                  key={t.time}
                  onClick={() => setReminderTime(t.time)}
                  className={`w-full min-h-[48px] p-3.5 rounded-tile border text-right text-meta font-bold transition-all flex items-center justify-between cursor-pointer ${
                    reminderTime === t.time
                      ? 'border-primary bg-domain-1-tint text-primary'
                      : 'border-sunken bg-surface text-ink hover:bg-canvas'
                  }`}
                >
                  <span>{t.label}</span>
                  {reminderTime === t.time && <Check className="w-4 h-4" aria-hidden="true" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: NOTIFICATIONS EXPLANATION */}
        {step === 3 && (
          <div className="p-6 rounded-sheet bg-surface border border-sunken shadow-lg space-y-4 text-center">
            <div className="w-14 h-14 rounded-tile bg-domain-3-tint text-success flex items-center justify-center mx-auto shadow-xs">
              <Bell className="w-7 h-7 stroke-[2.2]" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-headline font-black text-ink">
                یادآوری‌های هوشمند و محترمانه
              </h2>
              <p className="text-meta text-ink/70 mt-1">
                سیاست ارتباطی گرابایت:
              </p>
            </div>

            <div className="p-4 rounded-tile bg-paper border border-sunken text-right space-y-2.5 text-body text-ink/85">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" aria-hidden="true" />
                <span>حداکثر ۱ تا ۲ پیام مختصر در روز</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" aria-hidden="true" />
                <span>رعایت ساعات سکوت شبانه بدون مزاحمت</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" aria-hidden="true" />
                <span>پیام‌های محترمانه و به دور از لحن تقصیرآمیز یا آزاردهنده</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: INTEREST DOMAINS (Individuals only) */}
        {step === 4 && (
          <div className="p-6 rounded-sheet bg-surface border border-sunken shadow-lg space-y-4 text-center">
            <div className="w-14 h-14 rounded-tile bg-domain-4-tint text-domain-4 flex items-center justify-center mx-auto shadow-xs">
              <Compass className="w-7 h-7 stroke-[2.2]" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-headline font-black text-ink">
                حوزه‌های مورد علاقه
              </h2>
              <p className="text-meta text-ink/70 mt-1">
                علاقه‌مندی‌های اصلی خود را انتخاب کنید:
              </p>
            </div>

            <div className="space-y-2 text-right pt-1">
              {domainOptions.map((dom) => {
                const isSelected = selectedDomains.includes(dom);
                return (
                  <button
                    key={dom}
                    onClick={() => {
                      setSelectedDomains((prev) =>
                        isSelected
                          ? prev.filter((d) => d !== dom)
                          : [...prev, dom]
                      );
                    }}
                    className={`w-full min-h-[48px] p-3 rounded-tile border text-meta font-bold transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-domain-4 bg-domain-4-tint text-domain-4'
                        : 'border-sunken bg-surface text-ink hover:bg-canvas'
                    }`}
                  >
                    <span>{dom}</span>
                    {isSelected && <Check className="w-4 h-4" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav CTA */}
      <div className="pt-2 max-w-sm mx-auto w-full safe-bottom">
        {step < totalSteps ? (
          <Button
            fullWidth
            size="lg"
            variant="primary"
            onClick={() => setStep((s) => s + 1)}
            rightIcon={<ChevronLeft className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />}
          >
            گام بعدی
          </Button>
        ) : (
          <Button
            fullWidth
            size="lg"
            variant="primary"
            isLoading={isSaving}
            onClick={handleFinish}
            rightIcon={<ChevronLeft className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />}
          >
            تکمیل و ورود به آزمون تعیین سطح
          </Button>
        )}
      </div>
    </div>
  );
};
