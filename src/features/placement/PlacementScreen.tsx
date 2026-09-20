import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, CheckCircle2, ChevronLeft } from 'lucide-react';
import { placementApi, PlacementTestResult } from '../../api/placement';
import { Question, Level } from '../../types/domain';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../state/AppContext';
import { toFa } from '../../lib/toFa';
import { LEVEL_NAMES } from '../../lib/format';
import { errorMessage } from '../../lib/errors';

export const PlacementScreen: React.FC = () => {
  const navigate = useNavigate();
  const { updateUserLocal, showToast } = useApp();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<PlacementTestResult | null>(null);

  // Manual level override state
  const [isChoosingManual, setIsChoosingManual] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await placementApi.start();
        setQuestions(res.questions);
      } catch (err) {
        showToast(errorMessage(err) || 'خطا در بارگذاری سوالات تعیین سطح', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [showToast]);

  if (loading || questions.length === 0) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6 text-ink">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-pill animate-spin mx-auto" />
          <p className="text-body font-bold">در حال بارگذاری آزمون تطبیقی تعیین سطح...</p>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const selectedAnswer = answers[currentQ.id];

  const handleSelectOption = (optId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optId,
    }));
  };

  const handleNext = async () => {
    if (!selectedAnswer) {
      showToast('لطفاً پیش از رفتن به سوال بعد، پاسخ خود را انتخاب نمایید.', 'info');
      return;
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Submit placement test!
      try {
        setIsSubmitting(true);
        const res = await placementApi.submit(answers);
        setResult(res);
      } catch (err) {
        showToast(errorMessage(err) || 'خطا در ثبت نتایج تعیین سطح', 'error');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleAcceptLevel = (levelToSet: Level) => {
    updateUserLocal({ level: levelToSet, levelSource: 'placement_test' });
    showToast(`سطح ${toFa(levelToSet)} با موفقیت انتخاب شد. به گرابایت خوش آمدید!`, 'success');
    navigate('/');
  };

  // RESULT VIEW
  if (result) {
    const suggestedInfo = LEVEL_NAMES[result.suggestedLevel];

    return (
      <div className="min-h-screen bg-canvas p-5 flex flex-col justify-between text-ink">
        <div className="my-auto py-6 max-w-sm mx-auto w-full space-y-4">
          <div className="p-6 rounded-sheet bg-surface border border-sunken shadow-lg text-center space-y-4">
            <div className="w-16 h-16 rounded-sheet bg-domain-1-tint text-primary flex items-center justify-center mx-auto shadow-xs border border-primary/30">
              <Sparkles className="w-9 h-9 stroke-[2.2]" aria-hidden="true" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-pill bg-domain-1-tint text-primary text-meta font-bold">
                تحلیل هوشمند تعیین سطح
              </span>
              <h2 className="text-headline font-black mt-2">
                سطح پیشنهادی: {suggestedInfo.title} (سطح {toFa(result.suggestedLevel)})
              </h2>
              <p className="text-meta text-ink/60 mt-1">
                اطمینان سیستم: {toFa(Math.round(result.confidence * 100))}٪
              </p>
            </div>

            {/* Reasons List */}
            <div className="p-4 rounded-tile bg-paper border border-sunken text-right space-y-2 text-body">
              <span className="font-bold text-ink block mb-1 text-meta">
                دلایل پیشنهاد این سطح:
              </span>
              {result.reasons.map((r: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2 text-ink/85">
                  <CheckCircle2
                    className="w-4 h-4 text-success shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>{r}</span>
                </div>
              ))}
            </div>

            {/* Manual Level Selection Option */}
            {isChoosingManual && (
              <div className="pt-2 border-t border-sunken space-y-2 text-right">
                <span className="text-meta font-bold block">انتخاب سطح دیگر به سلیقه خودتان:</span>
                {([1, 2, 3, 4, 5] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => handleAcceptLevel(lvl)}
                    className="w-full min-h-[48px] p-3 rounded-tile border border-sunken hover:bg-domain-1-tint text-meta font-bold flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>
                      سطح {toFa(lvl)}: {LEVEL_NAMES[lvl].title}
                    </span>
                    <ChevronLeft className="w-4 h-4 text-primary" aria-hidden="true" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 max-w-sm mx-auto w-full space-y-2 safe-bottom">
          <Button
            fullWidth
            size="lg"
            variant="primary"
            onClick={() => handleAcceptLevel(result.suggestedLevel)}
            rightIcon={<ChevronLeft className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />}
          >
            پذیرش سطح پیشنهادی (سطح {toFa(result.suggestedLevel)})
          </Button>

          {!isChoosingManual && (
            <Button fullWidth variant="ghost" size="sm" onClick={() => setIsChoosingManual(true)}>
              انتخاب سطح دیگر
            </Button>
          )}
        </div>
      </div>
    );
  }

  // QUESTION RUNNER
  return (
    <div className="min-h-screen bg-canvas p-5 flex flex-col justify-between text-ink">
      {/* Stepper */}
      <header className="py-2 space-y-2">
        <div className="flex items-center justify-between text-meta font-bold text-ink/70">
          <span>آزمون تطبیقی تعیین سطح گرا</span>
          <span>
            سوال {toFa(currentIndex + 1)} از {toFa(questions.length)}
          </span>
        </div>
        <div className="h-2 bg-sunken-dark rounded-pill overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </header>

      {/* Question Card */}
      <div className="my-auto py-4 max-w-sm mx-auto w-full space-y-4">
        <div className="p-6 rounded-sheet bg-surface border border-sunken shadow-lg space-y-4">
          <span className="text-meta font-bold text-primary bg-domain-1-tint px-2.5 py-0.5 rounded-tile">
            شایستگی‌های شغلی و فردی
          </span>

          <h3 className="text-read font-bold text-ink leading-snug">{currentQ.prompt}</h3>

          <div className="space-y-2.5 pt-2">
            {currentQ.options.map((opt) => {
              const isSelected = selectedAnswer === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectOption(opt.id)}
                  className={`w-full min-h-[48px] p-4 rounded-tile text-right text-meta transition-all border select-none cursor-pointer flex items-start gap-3 ${
                    isSelected
                      ? 'bg-domain-1-tint border-primary font-bold text-ink shadow-xs'
                      : 'bg-paper border-sunken text-ink/85 hover:bg-canvas'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-pill border flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected ? 'border-primary bg-primary text-surface' : 'border-sunken-darker'
                    }`}
                  >
                    {isSelected && <span className="w-1.5 h-1.5 rounded-pill bg-surface" />}
                  </span>
                  <span className="leading-relaxed">{opt.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="pt-2 max-w-sm mx-auto w-full safe-bottom">
        <Button
          fullWidth
          size="lg"
          variant="primary"
          isLoading={isSubmitting}
          onClick={handleNext}
          rightIcon={<ChevronLeft className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />}
        >
          {currentIndex < questions.length - 1 ? 'سوال بعدی' : 'مشاهده تحلیل و تعیین سطح'}
        </Button>
      </div>
    </div>
  );
};
