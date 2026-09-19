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
    <div className="min-h-screen bg-[#F2EDE4] p-5 flex flex-col justify-between text-[#0D3F6B]">
      {/* Top Stepper Header */}
      <header className="py-2 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-[#0D3F6B]/70">
          <span>شخصی‌سازی تجربه گرابایت</span>
          <span>گام {toFa(step)} از {toFa(totalSteps)}</span>
        </div>
        <div className="flex items-center gap-1.5 h-1.5 bg-[#DCD4C7] rounded-full overflow-hidden">
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <div
              key={idx}
              className={`h-full flex-1 transition-all ${
                idx + 1 <= step ? 'bg-[#1E6FA8]' : 'bg-transparent'
              }`}
            />
          ))}
        </div>
      </header>

      {/* Main Step Container */}
      <div className="my-auto py-6 max-w-sm mx-auto w-full">
        {/* STEP 1: DAILY GOAL */}
        {step === 1 && (
          <div className="p-6 rounded-3xl bg-white border border-[#E8E1D5] shadow-lg space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#EAF3F9] text-[#1E6FA8] flex items-center justify-center mx-auto shadow-xs">
              <Target className="w-7 h-7 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#0D3F6B]">
                هدف مطالعه روزانه شما
              </h2>
              <p className="text-xs text-[#0D3F6B]/70 mt-1">
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
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer text-right flex items-center justify-between ${
                    dailyGoal === opt.count
                      ? 'border-[#1E6FA8] bg-[#EAF3F9] shadow-xs'
                      : 'border-[#E8E1D5] bg-white hover:bg-gray-50'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-[#0D3F6B]">{opt.title}</h4>
                      {opt.popular && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#1E6FA8] text-white">
                          پیشنهادی
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#0D3F6B]/60 mt-0.5">{opt.desc}</p>
                  </div>
                  <ByteRow total={opt.count} completed={opt.count} size="sm" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: REMINDER TIME */}
        {step === 2 && (
          <div className="p-6 rounded-3xl bg-white border border-[#E8E1D5] shadow-lg space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#FEF6EC] text-[#F2A93B] flex items-center justify-center mx-auto shadow-xs">
              <Clock className="w-7 h-7 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#0D3F6B]">
                زمان یادآوری مطالعه
              </h2>
              <p className="text-xs text-[#0D3F6B]/70 mt-1">
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
                  className={`w-full p-3.5 rounded-xl border text-right text-xs font-bold transition-all flex items-center justify-between ${
                    reminderTime === t.time
                      ? 'border-[#1E6FA8] bg-[#EAF3F9] text-[#1E6FA8]'
                      : 'border-[#E8E1D5] bg-white text-[#0D3F6B]'
                  }`}
                >
                  <span>{t.label}</span>
                  {reminderTime === t.time && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: NOTIFICATIONS EXPLANATION */}
        {step === 3 && (
          <div className="p-6 rounded-3xl bg-white border border-[#E8E1D5] shadow-lg space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#EDF8F6] text-[#2E9E6B] flex items-center justify-center mx-auto shadow-xs">
              <Bell className="w-7 h-7 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#0D3F6B]">
                یادآوری‌های هوشمند و محترمانه
              </h2>
              <p className="text-xs text-[#0D3F6B]/70 mt-1">
                سیاست ارتباطی گرابایت:
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8F5] text-right space-y-2.5 text-xs text-[#0D3F6B]/85">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2E9E6B] shrink-0 mt-0.5" />
                <span>حداکثر ۱ تا ۲ پیام مختصر در روز</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2E9E6B] shrink-0 mt-0.5" />
                <span>رعایت ساعات سکوت شبانه بدون مزاحمت</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2E9E6B] shrink-0 mt-0.5" />
                <span>پیام‌های محترمانه و به دور از لحن تقصیرآمیز یا آزاردهنده</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: INTEREST DOMAINS (Individuals only) */}
        {step === 4 && (
          <div className="p-6 rounded-3xl bg-white border border-[#E8E1D5] shadow-lg space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#F2EFFF] text-[#7A5BD6] flex items-center justify-center mx-auto shadow-xs">
              <Compass className="w-7 h-7 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#0D3F6B]">
                حوزه‌های مورد علاقه
              </h2>
              <p className="text-xs text-[#0D3F6B]/70 mt-1">
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
                    className={`w-full p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-[#7A5BD6] bg-[#F2EFFF] text-[#7A5BD6]'
                        : 'border-[#E8E1D5] bg-white text-[#0D3F6B]'
                    }`}
                  >
                    <span>{dom}</span>
                    {isSelected && <Check className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav CTA */}
      <div className="pt-2 max-w-sm mx-auto w-full">
        {step < totalSteps ? (
          <Button
            fullWidth
            size="lg"
            variant="primary"
            onClick={() => setStep((s) => s + 1)}
            rightIcon={<ChevronLeft className="w-5 h-5 stroke-[2.5]" />}
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
            rightIcon={<ChevronLeft className="w-5 h-5 stroke-[2.5]" />}
          >
            تکمیل و ورود به آزمون تعیین سطح
          </Button>
        )}
      </div>
    </div>
  );
};
