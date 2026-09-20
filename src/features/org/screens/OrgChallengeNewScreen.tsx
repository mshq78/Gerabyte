import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Trophy,
  ArrowRight,
  Send,
  Save,
  Calendar,
  Users,
  Target,
  Gift,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { challengeRequestsApi } from '../../../api/org/challengeRequests';
import { useOrgScope } from '../context/ScopeContext';
import { toFa } from '../../../lib/format';
import { Level } from '../../../types/domain';
import { errorMessage } from '../../../lib/errors';

export const OrgChallengeNewScreen: React.FC = () => {
  const navigate = useNavigate();
  const { units, userRole } = useOrgScope();

  // Form State
  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState('');
  const [targetScope, setTargetScope] = useState<'all' | string>('all');
  const [selectedLevels, setSelectedLevels] = useState<Level[]>([1, 2, 3, 4, 5]);
  const [goalType, setGoalType] = useState<'lessons' | 'xp' | 'streak' | 'exam'>('xp');
  const [goalTarget, setGoalTarget] = useState<number>(500);
  const [startsAt, setStartsAt] = useState('۱۴۰۳/۰۷/۱۵');
  const [endsAt, setEndsAt] = useState('۱۴۰۳/۰۷/۲۹');
  const [suggestedPrize, setSuggestedPrize] = useState('');
  const [notes, setNotes] = useState('');

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Live estimate of participants
  const estimateParticipants = () => {
    let base = 0;
    if (targetScope === 'all') {
      base = 150;
    } else {
      const u = units.find((x) => x.id === targetScope);
      base = u ? u.memberCount * 4 : 25;
    }
    // adjust for level filter
    const factor = selectedLevels.length / 5;
    return Math.max(5, Math.round(base * factor));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!title.trim() || title.trim().length < 5) {
      errs.title = 'عنوان چالش الزامی است و باید حداقل ۵ نویسه باشد.';
    }

    if (!objective.trim() || objective.trim().length < 15) {
      errs.objective = 'هدف چالش (دلیل برگزاری) الزامی است و باید حداقل ۱۵ نویسه باشد.';
    }

    if (!goalTarget || goalTarget <= 0) {
      errs.goalTarget = 'مقدار عددی هدف باید بزرگ‌تر از صفر باشد.';
    }

    if (!startsAt.trim() || !endsAt.trim()) {
      errs.dates = 'تاریخ شروع و پایان شمسی الزامی است.';
    } else {
      // Days difference check: min 3 days, max 30 days
      // For Jalali format mock validation
      const sDay = parseInt(startsAt.split('/')[2] || '1', 10);
      const eDay = parseInt(endsAt.split('/')[2] || '1', 10);
      const diff = eDay >= sDay ? eDay - sDay : eDay + 30 - sDay;
      if (diff < 3 || diff > 30) {
        errs.dates = 'طول مدت برگزاری چالش باید حداقل ۳ روز و حداکثر ۳۰ روز باشد.';
      }
    }

    if (selectedLevels.length === 0) {
      errs.levels = 'حداقل یک سطح شایستگی باید انتخاب شود.';
    }

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (status: 'draft' | 'submitted') => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const targetObj =
        targetScope === 'all'
          ? 'all'
          : {
              unitId: targetScope,
              unitName: units.find((u) => u.id === targetScope)?.name || 'واحد مشخص',
              includeChildren: true,
            };

      await challengeRequestsApi.create({
        title,
        objective,
        target: targetObj,
        levelFilter: selectedLevels,
        goal: { type: goalType, target: goalTarget },
        startsAt,
        endsAt,
        suggestedPrize,
        notes,
        requestedByName: userRole === 'unit_manager' ? 'مهندس علیرضا رضایی' : 'مهندس محمدرضا صادقی',
        status,
      });

      navigate('/org/challenges');
    } catch (err) {
      setValidationErrors({ general: errorMessage(err) || 'خطا در ثبت درخواست' });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLevel = (lvl: Level) => {
    if (selectedLevels.includes(lvl)) {
      setSelectedLevels(selectedLevels.filter((l) => l !== lvl));
    } else {
      setSelectedLevels([...selectedLevels, lvl].sort());
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 text-ink">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-sunken pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/org/challenges"
            className="min-h-[44px] min-w-[44px] p-2 rounded-tile bg-surface hover:bg-canvas border border-sunken text-ink flex items-center justify-center transition-all cursor-pointer"
            aria-label="بازگشت به چالش‌ها"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-display font-black text-ink">درخواست برگزاری چالش سازمانی</h1>
            <p className="text-meta text-ink/70">
              طراحی هدفمند چالش‌های مهارتی، افزایش نرخ مشارکت کارکنان و ارسال جهت تصویب و تأمین
              جایزه توسط گرا
            </p>
          </div>
        </div>
      </div>

      {validationErrors.general && (
        <div className="p-4 rounded-tile bg-domain-2-tint border border-danger/30 text-danger text-meta font-bold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{validationErrors.general}</span>
        </div>
      )}

      {/* Form Sections */}
      <div className="space-y-6">
        {/* Section 1: Title and Objective */}
        <section className="p-6 rounded-sheet bg-surface border border-sunken shadow-xs space-y-4">
          <h2 className="text-title font-black text-ink flex items-center gap-2">
            <Trophy className="w-5 h-5 text-coin" />
            <span>۱. عنوان و هدف آموزشی چالش</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="org-challenge-new-f1"
                className="block text-meta font-bold text-ink mb-1.5"
              >
                عنوان چالش <span className="text-danger">*</span>
              </label>
              <input
                id="org-challenge-new-f1"
                type="text"
                placeholder="مثال: ماراتن دقت در ابعاد و استانداردهای نورد میلگرد"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`min-h-[48px] w-full px-4 py-2 rounded-tile bg-canvas border text-body font-bold text-ink focus:outline-none ${
                  validationErrors.title ? 'border-danger' : 'border-sunken focus:border-primary'
                }`}
              />
              {validationErrors.title && (
                <p className="text-meta text-danger font-bold mt-1">{validationErrors.title}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="org-challenge-new-f2"
                className="block text-meta font-bold text-ink mb-1.5"
              >
                هدف چالش (چرا این چالش نیاز است؟) <span className="text-danger">*</span>
              </label>
              <textarea
                id="org-challenge-new-f2"
                rows={3}
                placeholder="توضیح دهید این چالش چه معضل عملیاتی، ایمنی یا خطایی را در خط تولید یا فرایند حل می‌کند..."
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                className={`w-full p-4 rounded-tile bg-canvas border text-body font-medium text-ink focus:outline-none ${
                  validationErrors.objective
                    ? 'border-danger'
                    : 'border-sunken focus:border-primary'
                }`}
              />
              {validationErrors.objective && (
                <p className="text-meta text-danger font-bold mt-1">{validationErrors.objective}</p>
              )}
            </div>
          </div>
        </section>

        {/* Section 2: Target Audience & Tree Picker */}
        <section className="p-6 rounded-sheet bg-surface border border-sunken shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-title font-black text-ink flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span>۲. گروه هدف و مخاطبان</span>
            </h2>
            <div className="text-meta font-black text-primary px-3 py-1 rounded-pill bg-domain-1-tint">
              تخمین مخاطبان: {toFa(estimateParticipants())} نفر
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="org-challenge-new-f3"
                className="block text-meta font-bold text-ink mb-1.5"
              >
                انتخاب واحد / بخش
              </label>
              <select
                id="org-challenge-new-f3"
                value={targetScope}
                onChange={(e) => setTargetScope(e.target.value)}
                className="min-h-[48px] w-full px-3 py-2 rounded-tile bg-canvas border border-sunken text-meta font-bold text-ink focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="all">تمام واحدهای سازمان (سراسری)</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p id="org-challenge-new-f4" className="block text-meta font-bold text-ink mb-1.5">
                فیلتر سطوح شایستگی
              </p>
              <div
                className="flex items-center gap-2 pt-1 flex-wrap"
                role="group"
                aria-labelledby="org-challenge-new-f4"
              >
                {([1, 2, 3, 4, 5] as Level[]).map((lvl) => {
                  const active = selectedLevels.includes(lvl);
                  return (
                    <button
                      type="button"
                      key={lvl}
                      onClick={() => toggleLevel(lvl)}
                      className={`min-h-[40px] px-3 rounded-tile text-meta font-bold border transition-all cursor-pointer ${
                        active
                          ? 'bg-primary text-white border-primary shadow-xs'
                          : 'bg-canvas text-ink/70 border-sunken hover:bg-sunken'
                      }`}
                    >
                      سطح {toFa(lvl)}
                    </button>
                  );
                })}
              </div>
              {validationErrors.levels && (
                <p className="text-meta text-danger font-bold mt-1">{validationErrors.levels}</p>
              )}
            </div>
          </div>
        </section>

        {/* Section 3: Goal Type and Target */}
        <section className="p-6 rounded-sheet bg-surface border border-sunken shadow-xs space-y-4">
          <h2 className="text-title font-black text-ink flex items-center gap-2">
            <Target className="w-5 h-5 text-success" />
            <span>۳. نوع هدف و تارگت موفقیت</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="org-challenge-new-f5"
                className="block text-meta font-bold text-ink mb-1.5"
              >
                معیار سنجش پیروزی
              </label>
              <select
                id="org-challenge-new-f5"
                value={goalType}
                onChange={(e) =>
                  setGoalType(e.target.value as 'lessons' | 'xp' | 'streak' | 'exam')
                }
                className="min-h-[48px] w-full px-3 py-2 rounded-tile bg-canvas border border-sunken text-meta font-bold text-ink focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="xp">کسب امتیاز تجربی (XP)</option>
                <option value="lessons">تکمیل تعداد گرابایت مشخص</option>
                <option value="streak">حفظ زنجیره مطالعه مستمر (روز)</option>
                <option value="exam">قبولی در آزمون جامع مهارتی</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="org-challenge-new-f6"
                className="block text-meta font-bold text-ink mb-1.5"
              >
                مقدار هدف عددی <span className="text-danger">*</span>
              </label>
              <input
                id="org-challenge-new-f6"
                type="number"
                value={goalTarget}
                onChange={(e) => setGoalTarget(Number(e.target.value))}
                className="min-h-[48px] w-full px-4 py-2 rounded-tile bg-canvas border border-sunken text-body font-bold text-ink focus:outline-none focus:border-primary"
              />
              {validationErrors.goalTarget && (
                <p className="text-meta text-danger font-bold mt-1">
                  {validationErrors.goalTarget}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Section 4: Jalali Duration */}
        <section className="p-6 rounded-sheet bg-surface border border-sunken shadow-xs space-y-4">
          <h2 className="text-title font-black text-ink flex items-center gap-2">
            <Calendar className="w-5 h-5 text-domain-4" />
            <span>۴. بازه زمانی برگزاری (حداقل ۳ و حداکثر ۳۰ روز)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="org-challenge-new-f7"
                className="block text-meta font-bold text-ink mb-1.5"
              >
                تاریخ شروع (شمسی)
              </label>
              <input
                id="org-challenge-new-f7"
                type="text"
                placeholder="۱۴۰۳/۰۷/۱۵"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="min-h-[48px] w-full px-4 py-2 rounded-tile bg-canvas border border-sunken text-body font-mono text-ink focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label
                htmlFor="org-challenge-new-f8"
                className="block text-meta font-bold text-ink mb-1.5"
              >
                تاریخ پایان (شمسی)
              </label>
              <input
                id="org-challenge-new-f8"
                type="text"
                placeholder="۱۴۰۳/۰۷/۲۹"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="min-h-[48px] w-full px-4 py-2 rounded-tile bg-canvas border border-sunken text-body font-mono text-ink focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          {validationErrors.dates && (
            <p className="text-meta text-danger font-bold mt-1">{validationErrors.dates}</p>
          )}
        </section>

        {/* Section 5: Suggested Prize and Notes */}
        <section className="p-6 rounded-sheet bg-surface border border-sunken shadow-xs space-y-4">
          <h2 className="text-title font-black text-ink flex items-center gap-2">
            <Gift className="w-5 h-5 text-coin" />
            <span>۵. جایزه پیشنهادی و توضیحات اجرایی</span>
          </h2>

          <div className="p-3.5 rounded-tile bg-domain-5-tint/40 border border-coin/30 text-meta text-ink/80 flex items-start gap-2.5">
            <Sparkles className="w-5 h-5 text-coin shrink-0 mt-0.5" />
            <span>
              <strong>تعهد تأمین جایزه توسط گرا:</strong> شما می‌توانید هدیه مورد نظر یا مناسب با
              روحیه واحد را پیشنهاد دهید. تیم پشتیبانی گرا پس از ارزیابی، جایزه نهایی را تأمین،
              بسته‌بندی و تضمین می‌نماید.
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="org-challenge-new-f9"
                className="block text-meta font-bold text-ink mb-1.5"
              >
                جایزه پیشنهادی به گرا (اختیاری)
              </label>
              <input
                id="org-challenge-new-f9"
                type="text"
                placeholder="مثال: هندبوک تخصصی متالورژی ASM + ست هدیه گرا"
                value={suggestedPrize}
                onChange={(e) => setSuggestedPrize(e.target.value)}
                className="min-h-[48px] w-full px-4 py-2 rounded-tile bg-canvas border border-sunken text-body font-bold text-ink focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label
                htmlFor="org-challenge-new-f10"
                className="block text-meta font-bold text-ink mb-1.5"
              >
                یادداشت‌ها و شرایط اجرایی خاص (اختیاری)
              </label>
              <textarea
                id="org-challenge-new-f10"
                rows={2}
                placeholder="مثلاً ملاحظات مربوط به شیفت‌های چرخشی، نحوه هماهنگی سالن آزمون و..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-4 rounded-tile bg-canvas border border-sunken text-meta font-medium text-ink focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </section>
      </div>

      {/* Sticky Bottom Save Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-surface/95 backdrop-blur-md border-t border-sunken p-4 z-30 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="hidden sm:block text-meta text-ink/70">
            تخمین مخاطبان فعال: <strong>{toFa(estimateParticipants())} نفر</strong>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              disabled={submitting}
              onClick={() => handleSave('draft')}
              className="min-h-[48px] px-5 py-2.5 rounded-tile bg-surface hover:bg-canvas border border-sunken text-ink text-meta font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>ذخیره پیش‌نویس</span>
            </button>

            <button
              disabled={submitting}
              onClick={() => handleSave('submitted')}
              className="min-h-[48px] px-6 py-2.5 rounded-tile bg-primary hover:bg-primary-hover text-white text-meta font-black flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>ارسال برای گرا</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
