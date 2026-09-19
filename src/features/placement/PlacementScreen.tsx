import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  ChevronLeft,
  Award,
  Check,
  HelpCircle,
} from 'lucide-react';
import { placementApi, PlacementTestResult } from '../../api/placement';
import { Question, Level } from '../../types/domain';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../state/AppContext';
import { toFa } from '../../lib/toFa';
import { LEVEL_NAMES } from '../../lib/format';

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
      } catch (err: any) {
        showToast(err.message || 'خطا در بارگذاری سوالات تعیین سطح', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [showToast]);

  if (loading || questions.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-[#0D3F6B]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#1E6FA8] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold">در حال بارگذاری آزمون تطبیقی تعیین سطح...</p>
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
      } catch (err: any) {
        showToast(err.message || 'خطا در ثبت نتایج تعیین سطح', 'error');
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
      <div className="min-h-screen bg-[#F2EDE4] p-5 flex flex-col justify-between text-[#0D3F6B]">
        <div className="my-auto py-6 max-w-sm mx-auto w-full space-y-4">
          <div className="p-6 rounded-3xl bg-white border border-[#E8E1D5] shadow-lg text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-[#EAF3F9] text-[#1E6FA8] flex items-center justify-center mx-auto shadow-xs border border-[#1E6FA8]/30">
              <Sparkles className="w-9 h-9 stroke-[2.2]" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-[#EAF3F9] text-[#1E6FA8] text-xs font-bold">
                تحلیل هوشمند تعیین سطح
              </span>
              <h2 className="text-xl font-black mt-2">
                سطح پیشنهادی: {suggestedInfo.title} (سطح {toFa(result.suggestedLevel)})
              </h2>
              <p className="text-xs text-[#0D3F6B]/60 mt-1">
                اطمینان سیستم: {toFa(Math.round(result.confidence * 100))}٪
              </p>
            </div>

            {/* Reasons List */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E1D5] text-right space-y-2 text-xs">
              <span className="font-bold text-[#0D3F6B] block mb-1">
                دلایل پیشنهاد این سطح:
              </span>
              {result.reasons.map((r: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2 text-[#0D3F6B]/85">
                  <CheckCircle2 className="w-4 h-4 text-[#2E9E6B] shrink-0 mt-0.5" />
                  <span>{r}</span>
                </div>
              ))}
            </div>

            {/* Manual Level Selection Option */}
            {isChoosingManual && (
              <div className="pt-2 border-t border-[#E8E1D5] space-y-2 text-right">
                <span className="text-xs font-bold block">
                  انتخاب سطح دیگر به سلیقه خودتان:
                </span>
                {([1, 2, 3, 4, 5] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => handleAcceptLevel(lvl)}
                    className="w-full p-2.5 rounded-xl border border-[#E8E1D5] hover:bg-[#EAF3F9] text-xs font-bold flex items-center justify-between transition-colors"
                  >
                    <span>سطح {toFa(lvl)}: {LEVEL_NAMES[lvl].title}</span>
                    <ChevronLeft className="w-4 h-4 text-[#1E6FA8]" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 max-w-sm mx-auto w-full space-y-2">
          <Button
            fullWidth
            size="lg"
            variant="primary"
            onClick={() => handleAcceptLevel(result.suggestedLevel)}
            rightIcon={<ChevronLeft className="w-5 h-5 stroke-[2.5]" />}
          >
            پذیرش سطح پیشنهادی (سطح {toFa(result.suggestedLevel)})
          </Button>

          {!isChoosingManual && (
            <Button
              fullWidth
              variant="ghost"
              size="sm"
              onClick={() => setIsChoosingManual(true)}
            >
              انتخاب سطح دیگر
            </Button>
          )}
        </div>
      </div>
    );
  }

  // QUESTION RUNNER
  return (
    <div className="min-h-screen bg-[#F2EDE4] p-5 flex flex-col justify-between text-[#0D3F6B]">
      {/* Stepper */}
      <header className="py-2 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-[#0D3F6B]/70">
          <span>آزمون تطبیقی تعیین سطح گرا</span>
          <span>سوال {toFa(currentIndex + 1)} از {toFa(questions.length)}</span>
        </div>
        <div className="h-2 bg-[#DCD4C7] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1E6FA8] transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </header>

      {/* Question Card */}
      <div className="my-auto py-4 max-w-sm mx-auto w-full space-y-4">
        <div className="p-6 rounded-3xl bg-white border border-[#E8E1D5] shadow-lg space-y-4">
          <span className="text-[11px] font-bold text-[#1E6FA8] bg-[#EAF3F9] px-2.5 py-0.5 rounded-md">
            شایستگی‌های شغلی و فردی
          </span>

          <h3 className="text-base font-bold text-[#0D3F6B] leading-snug">
            {currentQ.prompt}
          </h3>

          <div className="space-y-2.5 pt-2">
            {currentQ.options.map((opt) => {
              const isSelected = selectedAnswer === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectOption(opt.id)}
                  className={`w-full p-4 rounded-2xl text-right text-xs transition-all border select-none cursor-pointer flex items-start gap-3 ${
                    isSelected
                      ? 'bg-[#EAF3F9] border-[#1E6FA8] font-bold text-[#0D3F6B] shadow-xs'
                      : 'bg-[#FAF8F5] border-[#E8E1D5] text-[#0D3F6B]/85 hover:bg-gray-50'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected ? 'border-[#1E6FA8] bg-[#1E6FA8] text-white' : 'border-[#CFC5B6]'
                    }`}
                  >
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                  <span className="leading-relaxed">{opt.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="pt-2 max-w-sm mx-auto w-full">
        <Button
          fullWidth
          size="lg"
          variant="primary"
          isLoading={isSubmitting}
          onClick={handleNext}
          rightIcon={<ChevronLeft className="w-5 h-5 stroke-[2.5]" />}
        >
          {currentIndex < questions.length - 1 ? 'سوال بعدی' : 'مشاهده تحلیل و تعیین سطح'}
        </Button>
      </div>
    </div>
  );
};
