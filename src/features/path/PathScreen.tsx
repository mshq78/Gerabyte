import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Sparkles, Award, CheckCircle2, ChevronLeft, AlertCircle } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { pathsApi } from '../../api/paths';
import { Domain, LearningPath, Unit, LessonSummary } from '../../types/domain';
import { SquircleNode } from '../../components/ui/SquircleNode';
import { Sheet } from '../../components/ui/Sheet';
import { Button } from '../../components/ui/Button';
import { toFa } from '../../lib/toFa';

export const PathScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, entitlements, subscription } = useApp();
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
    <div className="flex-1 flex flex-col">
      {/* 1. Sticky Domain Selector Tabs */}
      <header className="sticky top-0 z-30 bg-[#F2EDE4]/95 backdrop-blur-md border-b border-[#E8E1D5] py-2.5 px-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {domains.map((dom) => {
            const isActive = dom.id === activeDomainId;
            return (
              <button
                key={dom.id}
                onClick={() => setActiveDomainId(dom.id)}
                className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all select-none cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#1E6FA8] text-white shadow-xs'
                    : 'bg-white text-[#0D3F6B]/80 hover:bg-gray-100 border border-[#E8E1D5]'
                }`}
              >
                <span>{dom.title}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* 2. Active Domain Overview Banner */}
      {activeDomain && (
        <div
          className="px-5 py-4 text-[#0D3F6B] border-b border-[#E8E1D5]"
          style={{ backgroundColor: activeDomain.lightColorToken }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-black tracking-tight"
              style={{ color: activeDomain.colorToken }}
            >
              مسیر یادگیری گرابایت
            </span>
            <span className="text-xs text-[#0D3F6B]/60 font-semibold">
              {toFa(activeDomain.totalLessons)} درس · {toFa(activeDomain.unitsCount)} فصل
            </span>
          </div>
          <h2 className="text-lg font-bold mt-1 text-[#0D3F6B]">
            {activeDomain.title}
          </h2>
          <p className="text-xs text-[#0D3F6B]/80 mt-0.5 leading-relaxed">
            {activeDomain.subtitle}
          </p>
        </div>
      )}

      {/* 3. Units and Winding Vertical Path */}
      <div className="flex-1 px-4 py-6 space-y-12">
        {activePath?.units.map((unit, uIdx) => (
          <div key={unit.id} className="relative">
            {/* Sticky Unit Header Banner */}
            <div className="sticky top-14 z-20 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-[#E8E1D5] shadow-xs mb-8">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#1E6FA8] bg-[#EAF3F9] px-2 py-0.5 rounded-md">
                  فصل {toFa(unit.order)}
                </span>
                <span className="text-xs text-[#0D3F6B]/70 font-semibold">
                  {toFa(unit.lessons.filter((l) => l.status === 'done').length)} از {toFa(unit.lessons.length)} درس تکمیل‌شده
                </span>
              </div>
              <h3 className="font-bold text-sm text-[#0D3F6B] mt-1.5">{unit.title}</h3>
              <p className="text-xs text-[#0D3F6B]/75 mt-0.5">{unit.summary}</p>
            </div>

            {/* Winding Nodes with SVG connecting line */}
            <div className="relative flex flex-col items-center gap-10 py-2">
              {unit.lessons.map((lesson, lIdx) => {
                // Calculate slight horizontal alternating offset for winding aesthetic
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
                      accentColor={activeDomain?.colorToken || '#1E6FA8'}
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
                    accentColor="#7A5BD6"
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
          <div className="pt-6 pb-8 flex flex-col items-center justify-center border-t-2 border-dashed border-[#CFC5B6]">
            <span className="text-xs font-bold text-[#F2A93B] bg-[#FEF6EC] px-3 py-1 rounded-full mb-3 border border-[#F2A93B]/40">
              آزمون اعطای گواهینامه رسمی
            </span>
            <SquircleNode
              index={99}
              status={entitlements.canTakeCertificateExams ? 'available' : 'paywalled'}
              isCertificate
              accentColor="#F2A93B"
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
        title={selectedLesson?.isCertificate ? 'آزمون گواهینامه رسمی' : selectedLesson?.isCheckpoint ? 'ارزیابی فصلی' : 'مشخصات گرابایت'}
        subtitle={selectedLesson?.unitTitle}
      >
        {selectedLesson && (
          <div className="space-y-4 text-[#0D3F6B]">
            <h3 className="font-bold text-base leading-snug">
              {selectedLesson.lesson.title}
            </h3>

            <div className="grid grid-cols-2 gap-3 py-2">
              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E1D5] flex flex-col">
                <span className="text-xs text-[#0D3F6B]/60 font-medium">مدت زمان تخمینی</span>
                <span className="text-sm font-bold mt-1 text-[#0D3F6B]">
                  ⏱ {toFa(selectedLesson.lesson.minutes)} دقیقه
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#EAF3F9] border border-[#1E6FA8]/20 flex flex-col">
                <span className="text-xs text-[#1E6FA8] font-medium">پاداش تجربه</span>
                <span className="text-sm font-bold mt-1 text-[#1E6FA8]">
                  + {toFa(selectedLesson.lesson.xp)} XP
                </span>
              </div>
            </div>

            {selectedLesson.lesson.status === 'done' ? (
              <div className="p-3 rounded-xl bg-[#EDF8F6] border border-[#2E9E6B]/40 text-[#2E9E6B] text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>شما این درس را قبلاً با موفقیت گذرانده‌اید (مرور مجدد شامل امتیاز نخواهد بود).</span>
              </div>
            ) : (
              <p className="text-xs text-[#0D3F6B]/80 leading-relaxed">
                این گرابایت شامل مفاهیم تعاملی، صوت کاربردی و ارزیابی سناریویی است.
              </p>
            )}

            <div className="pt-2">
              <Button
                fullWidth
                size="lg"
                onClick={handleStartActivity}
                rightIcon={<ChevronLeft className="w-5 h-5 stroke-[2.5]" />}
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
        <div className="space-y-4 text-[#0D3F6B]">
          <div className="w-12 h-12 rounded-2xl bg-[#FEF6EC] text-[#F2A93B] flex items-center justify-center mx-auto mb-2 border border-[#F2A93B]/30">
            <Lock className="w-6 h-6 stroke-[2.5]" />
          </div>

          <p className="text-sm text-center leading-relaxed font-semibold">
            با ارتقا به اشتراک کامل، تمام دروس تخصصی، آزمون‌های صدور گواهینامه و دریافت سکه‌های جوایز بازگشایی می‌شوند.
          </p>

          <div className="space-y-2 py-1 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2E9E6B] shrink-0" />
              <span>دسترسی نامحدود به تمامی دروس و حوزه‌های پنج‌گانه</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2E9E6B] shrink-0" />
              <span>امکان شرکت در آزمون‌های صدور گواهینامه معتبر با کد اصالت</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2E9E6B] shrink-0" />
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
            <Button
              fullWidth
              variant="ghost"
              size="sm"
              onClick={() => setIsUpsellSheetOpen(false)}
            >
              انصراف
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
};
