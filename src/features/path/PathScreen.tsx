import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, CheckCircle2, ChevronLeft } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { pathsApi } from '../../api/paths';
import { Domain, LearningPath, Unit, LessonSummary } from '../../types/domain';
import { SquircleNode } from '../../components/ui/SquircleNode';
import { Sheet } from '../../components/ui/Sheet';
import { Button } from '../../components/ui/Button';
import { toFa } from '../../lib/toFa';

export const PathScreen: React.FC = () => {
  const navigate = useNavigate();
  const { entitlements } = useApp();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [activeDomainId, setActiveDomainId] = useState<string>('domain-1');
  const [activePath, setActivePath] = useState<LearningPath | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<{
    lesson: LessonSummary;
    unitTitle: string;
    isCheckpoint?: boolean;
    isCertificate?: boolean;
    examId?: string;
  } | null>(null);
  const [isUpsellSheetOpen, setIsUpsellSheetOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const domList = await pathsApi.listDomains();
        setDomains(domList);
        const path = await pathsApi.get(activeDomainId);
        setActivePath(path);
      } catch {
        // fallback
      }
    }
    load();
  }, [activeDomainId]);

  const activeDomain = domains.find((d) => d.id === activeDomainId) || domains[0];

  const handleNodeClick = (
    lesson: LessonSummary,
    unit: Unit,
    options?: { isCheckpoint?: boolean; isCertificate?: boolean; examId?: string }
  ) => {
    // Check if paywalled under free plan
    if (!lesson.isFree && !entitlements.paidLessonsUnlocked) {
      setIsUpsellSheetOpen(true);
      return;
    }

    if (lesson.status === 'locked') {
      return;
    }

    setSelectedLesson({
      lesson,
      unitTitle: unit.title,
      isCheckpoint: options?.isCheckpoint,
      isCertificate: options?.isCertificate,
      examId: options?.examId,
    });
  };

  const handleStartActivity = () => {
    if (!selectedLesson) return;
    const { lesson, isCheckpoint, isCertificate, examId } = selectedLesson;
    setSelectedLesson(null);

    if (isCertificate && examId) {
      navigate(`/exam/${examId}`);
    } else if (isCheckpoint && examId) {
      navigate(`/exam/${examId}`);
    } else {
      navigate(`/lesson/${lesson.id}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col text-ink">
      {/* 1. Merged Sticky Header (Domain selector + Unit status) */}
      <header className="sticky top-0 z-30 bg-surface border-b border-sunken p-2.5 shadow-xs">
        {/* Domain chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {domains.map((dom) => {
            const isActive = dom.id === activeDomainId;
            return (
              <button
                key={dom.id}
                onClick={() => setActiveDomainId(dom.id)}
                className={`shrink-0 min-h-[44px] sm:min-h-[48px] px-3.5 py-2 rounded-tile text-meta font-bold transition-all select-none cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-primary text-surface shadow-xs'
                    : 'bg-canvas text-ink/80 hover:bg-surface border border-sunken'
                }`}
              >
                <span>{dom.title}</span>
              </button>
            );
          })}
        </div>

        {/* Compact Unit Banner */}
        {activePath?.units[0] && (
          <div className="mt-1.5 pt-2 border-t border-sunken flex items-center justify-between text-meta">
            <div className="flex items-center gap-2 truncate">
              <span className="font-bold text-primary bg-domain-1-tint px-2 py-0.5 rounded-tile shrink-0">
                فصل {toFa(activePath.units[0].order)}: {activePath.units[0].title}
              </span>
            </div>
            <span className="text-meta text-ink/70 font-semibold shrink-0">
              {toFa(activePath.units[0].lessons.filter((l) => l.status === 'done').length)} از{' '}
              {toFa(activePath.units[0].lessons.length)} درس
            </span>
          </div>
        )}
      </header>

      {/* 2. Units and Winding Vertical Path */}
      <div className="flex-1 px-4 py-4 space-y-10">
        {activePath?.units.map((unit, uIdx) => (
          <div key={unit.id} className="relative">
            {/* Subsequent Unit Divider Banner */}
            {uIdx > 0 && (
              <div className="p-3 rounded-tile bg-surface border border-sunken shadow-xs mb-6 flex items-center justify-between text-meta">
                <span className="font-bold text-primary bg-domain-1-tint px-2 py-0.5 rounded-tile">
                  فصل {toFa(unit.order)}: {unit.title}
                </span>
                <span className="text-ink/70 font-semibold">
                  {toFa(unit.lessons.filter((l) => l.status === 'done').length)} از{' '}
                  {toFa(unit.lessons.length)} درس
                </span>
              </div>
            )}

            {/* Winding Nodes */}
            <div className="relative flex flex-col items-center gap-10 py-2">
              {unit.lessons.map((lesson, lIdx) => {
                // Alternating offset for winding path
                const offsetClass =
                  lIdx % 3 === 0
                    ? 'translate-x-0'
                    : lIdx % 3 === 1
                      ? '-translate-x-10'
                      : 'translate-x-10';

                // Free vs Paid status
                const isPaywalled = !lesson.isFree && !entitlements.paidLessonsUnlocked;
                const status = isPaywalled ? 'paywalled' : lesson.status;

                return (
                  <div key={lesson.id} className={`transition-transform ${offsetClass}`}>
                    <SquircleNode
                      index={lIdx + 1}
                      status={status}
                      minutes={lesson.minutes}
                      xp={lesson.xp}
                      accentColor="var(--color-primary)"
                      label={lesson.title}
                      onClick={() => handleNodeClick(lesson, unit)}
                    />
                  </div>
                );
              })}

              {/* Unit Checkpoint Quiz Node */}
              {unit.checkpointExamId && (
                <div className="pt-2">
                  <SquircleNode
                    index={unit.lessons.length + 1}
                    status={unit.lessons.every((l) => l.status === 'done') ? 'available' : 'locked'}
                    isCheckpoint
                    accentColor="var(--color-domain-4)"
                    label="ارزیابی چک‌پوینت این فصل"
                    onClick={() =>
                      handleNodeClick(
                        {
                          id: unit.checkpointExamId,
                          title: `ارزیابی جامع فصل ${toFa(unit.order)}`,
                          minutes: 8,
                          xp: 20,
                          isFree: true,
                          status: 'available',
                        },
                        unit,
                        { isCheckpoint: true, examId: unit.checkpointExamId }
                      )
                    }
                  />
                </div>
              )}
            </div>
          </div>
        ))}

        {/* 4. Domain Final Certificate Exam Node */}
        {activePath?.certificateExamId && (
          <div className="pt-6 pb-8 flex flex-col items-center justify-center border-t-2 border-dashed border-sunken-darker">
            <span className="text-meta font-bold text-coin bg-domain-5-tint px-3 py-1 rounded-pill mb-3 border border-coin/40">
              آزمون اعطای گواهینامه رسمی
            </span>
            <SquircleNode
              index={99}
              status={entitlements.canTakeCertificateExams ? 'available' : 'paywalled'}
              isCertificate
              accentColor="var(--color-coin)"
              label="گواهینامه تخصصی پردیس گرا"
              onClick={() => {
                if (!entitlements.canTakeCertificateExams) {
                  setIsUpsellSheetOpen(true);
                  return;
                }
                setSelectedLesson({
                  lesson: {
                    id: activePath.certificateExamId!,
                    title: `آزمون جامع گواهینامه ${activeDomain.title}`,
                    minutes: 15,
                    xp: 50,
                    isFree: false,
                    status: 'available',
                  },
                  unitTitle: 'آزمون رسمی اعطای گواهینامه',
                  isCertificate: true,
                  examId: activePath.certificateExamId,
                });
              }}
            />
          </div>
        )}
      </div>

      {/* Lesson Details Bottom Sheet */}
      <Sheet
        isOpen={!!selectedLesson}
        onClose={() => setSelectedLesson(null)}
        title={
          selectedLesson?.isCertificate
            ? 'آزمون گواهینامه رسمی'
            : selectedLesson?.isCheckpoint
              ? 'ارزیابی فصلی'
              : 'مشخصات گرابایت'
        }
        subtitle={selectedLesson?.unitTitle}
      >
        {selectedLesson && (
          <div className="space-y-4 text-ink">
            <h3 className="font-bold text-title leading-snug">{selectedLesson.lesson.title}</h3>

            <div className="grid grid-cols-2 gap-3 py-2">
              <div className="p-3 rounded-tile bg-paper border border-sunken flex flex-col">
                <span className="text-meta text-ink/60 font-medium">مدت زمان تخمینی</span>
                <span className="text-body font-bold mt-1 text-ink">
                  ⏱ {toFa(selectedLesson.lesson.minutes)} دقیقه
                </span>
              </div>
              <div className="p-3 rounded-tile bg-domain-1-tint border border-primary/20 flex flex-col">
                <span className="text-meta text-primary font-medium">پاداش تجربه</span>
                <span className="text-body font-bold mt-1 text-primary">
                  + {toFa(selectedLesson.lesson.xp)} XP
                </span>
              </div>
            </div>

            {selectedLesson.lesson.status === 'done' ? (
              <div className="p-3 rounded-tile bg-domain-3-tint border border-success/40 text-success text-meta font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span>
                  شما این درس را قبلاً با موفقیت گذرانده‌اید (مرور مجدد شامل امتیاز نخواهد بود).
                </span>
              </div>
            ) : (
              <p className="text-meta text-ink/80 leading-relaxed">
                این گرابایت شامل مفاهیم تعاملی، صوت کاربردی و ارزیابی سناریویی است.
              </p>
            )}

            <div className="pt-2">
              <Button
                fullWidth
                size="lg"
                onClick={handleStartActivity}
                rightIcon={<ChevronLeft className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />}
              >
                {selectedLesson.lesson.status === 'done'
                  ? 'مرور دوباره گرابایت'
                  : 'شروع یادگیری (۳ دقیقه)'}
              </Button>
            </div>
          </div>
        )}
      </Sheet>

      {/* Paywall Upsell Sheet */}
      <Sheet
        isOpen={isUpsellSheetOpen}
        onClose={() => setIsUpsellSheetOpen(false)}
        title="دسترسی ویژه اشتراک کامل"
        subtitle="این درس و آزمون‌های گواهینامه مختص اعضای اشتراک کامل هستند"
      >
        <div className="space-y-4 text-ink">
          <div className="w-12 h-12 rounded-tile bg-domain-5-tint text-coin flex items-center justify-center mx-auto mb-2 border border-coin/30">
            <Lock className="w-6 h-6 stroke-[2.5]" aria-hidden="true" />
          </div>

          <p className="text-body text-center leading-relaxed font-semibold">
            با ارتقا به اشتراک کامل، تمام دروس تخصصی، آزمون‌های صدور گواهینامه و دریافت سکه‌های
            جوایز بازگشایی می‌شوند.
          </p>

          <div className="space-y-2 py-1 text-body">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success shrink-0" aria-hidden="true" />
              <span>دسترسی نامحدود به تمامی دروس و حوزه‌های پنج‌گانه</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success shrink-0" aria-hidden="true" />
              <span>امکان شرکت در آزمون‌های صدور گواهینامه معتبر با کد اصالت</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success shrink-0" aria-hidden="true" />
              <span>کسب سکه و تبدیل به جوایز فیزیکی و اعتباری</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Button
              fullWidth
              size="lg"
              variant="accent"
              onClick={() => {
                setIsUpsellSheetOpen(false);
                navigate('/subscription');
              }}
            >
              مشاهده پلن‌ها و ارتقای اشتراک
            </Button>
            <Button fullWidth variant="ghost" size="sm" onClick={() => setIsUpsellSheetOpen(false)}>
              انصراف
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
};
