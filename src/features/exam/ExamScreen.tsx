import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  X,
  Award,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';
import { examsApi, ExamSubmitResult } from '../../api/exams';
import { Exam } from '../../types/domain';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../state/AppContext';
import { toFa } from '../../lib/toFa';

export const ExamScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useApp();

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ExamSubmitResult | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        setLoading(true);
        const data = await examsApi.get(id);
        setExam(data);
      } catch (err: any) {
        showToast(err.message || 'خطا در بارگذاری آزمون', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, showToast]);

  if (loading || !exam) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6 text-ink">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-pill animate-spin mx-auto" />
          <p className="text-body font-bold">در حال آماده‌سازی سوالات آزمون...</p>
        </div>
      </div>
    );
  }

  // 1. RULES & START SCREEN
  if (!hasStarted && !result) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col justify-between p-5 text-ink">
        <header className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 rounded-tile text-ink/60 hover:text-ink hover:bg-surface flex items-center justify-center cursor-pointer"
            aria-label="بازگشت"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
          <span className="text-meta font-bold text-primary bg-domain-1-tint px-3 py-1 rounded-pill">
            {exam.isCertificate ? 'آزمون اعطای گواهینامه' : 'ارزیابی فصلی'}
          </span>
        </header>

        <div className="flex-1 flex flex-col justify-center space-y-5 max-w-sm mx-auto w-full py-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-sheet bg-domain-5-tint text-coin flex items-center justify-center mx-auto border border-coin/40 shadow-xs">
              <Award className="w-9 h-9 stroke-[2.2]" aria-hidden="true" />
            </div>
            <h2 className="text-headline font-black text-ink">{exam.title}</h2>
            <p className="text-meta text-ink/70">{exam.targetDomainTitle}</p>
          </div>

          {/* Rules Card */}
          <div className="p-4 rounded-tile bg-surface border border-sunken shadow-xs space-y-3 text-body">
            <h3 className="font-bold text-title text-ink border-b border-sunken pb-2">
              ضوابط و شرایط برگزاری آزمون:
            </h3>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                حد نصاب قبولی: <strong>حداقل {toFa(exam.passMarkPct)}٪ نمره کل</strong>
              </span>
            </div>

            <div className="flex items-start gap-2.5">
              <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                تعداد سوالات انتخابی تصادفی از بانک سوالات: <strong>{toFa(exam.drawCount)} سوال</strong>
              </span>
            </div>

            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-coin shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                سوالات سناریومحور دارای <strong>ضریب ۲×</strong> در محاسبه نمره هستند.
              </span>
            </div>

            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-danger shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                حداکثر دفعات مجاز: <strong>{toFa(exam.maxAttempts)} نوبت</strong> با دوره خنک‌سازی {toFa(exam.cooldownHours)} ساعته
              </span>
            </div>
          </div>

          <div className="text-meta text-ink/70 text-center leading-relaxed">
            پس از پایان آزمون، تحلیل و بازخورد تفصیلی گزینه‌های صحیح و نادرست نمایش داده خواهد شد.
          </div>
        </div>

        <div className="pt-3 max-w-sm mx-auto w-full">
          <Button
            fullWidth
            size="lg"
            variant="primary"
            onClick={() => setHasStarted(true)}
            rightIcon={<ChevronLeft className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />}
          >
            شروع آزمون رسمی
          </Button>
        </div>
      </div>
    );
  }

  // 2. RESULTS & REVIEW SCREEN
  if (result) {
    return (
      <div className="min-h-screen bg-canvas p-5 text-ink space-y-5">
        <header className="flex items-center justify-between">
          <button
            onClick={() => navigate('/path')}
            className="w-12 h-12 rounded-tile text-ink/60 hover:text-ink hover:bg-surface flex items-center justify-center cursor-pointer"
            aria-label="بستن نتایج"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
          <span className="text-meta font-bold text-ink/70">نتیجه ارزیابی</span>
        </header>

        {/* Outcome Card */}
        <div className="p-5 rounded-sheet bg-surface border border-sunken shadow-xs text-center space-y-3 max-w-md mx-auto">
          <div
            className={`w-16 h-16 rounded-sheet flex items-center justify-center mx-auto text-surface shadow-md ${
              result.passed ? 'bg-success' : 'bg-danger'
            }`}
          >
            {result.passed ? (
              <FileCheck className="w-9 h-9 stroke-[2.5]" aria-hidden="true" />
            ) : (
              <XCircle className="w-9 h-9 stroke-[2.5]" aria-hidden="true" />
            )}
          </div>

          <div>
            <span
              className={`px-3 py-1 rounded-pill text-meta font-bold border ${
                result.passed
                  ? 'bg-domain-3-tint text-success border-success/30'
                  : 'bg-danger-tint text-danger border-danger/30'
              }`}
            >
              {result.passed ? 'تبریک! آزمون با موفقیت گذرانده شد' : 'عدم احراز حدنصاب قبولی'}
            </span>
            <h2 className="text-headline font-black mt-2 text-ink">
              نمره کسب‌شده: {toFa(result.scorePct)}٪
            </h2>
            <p className="text-meta text-ink/70 mt-1">
              (پاسخ صحیح به {toFa(result.correctCount)} از {toFa(result.totalQuestions)} سوال)
            </p>
          </div>

          {result.passed && result.certificateSerial && (
            <div className="p-3.5 rounded-tile bg-domain-5-tint border border-coin/40 text-ink space-y-1 text-meta">
              <span className="font-bold text-coin">گواهینامه رسمی صادر گردید:</span>
              <p className="font-mono font-bold text-body tracking-wider text-ink">
                {result.certificateSerial}
              </p>
              <button
                onClick={() => navigate(`/certificates/${result.certificateSerial}`)}
                className="mt-2 min-h-[48px] px-3 flex items-center justify-center text-meta font-bold text-primary underline mx-auto cursor-pointer"
              >
                مشاهده و دانلود گواهینامه معتبر با QR
              </button>
            </div>
          )}
        </div>

        {/* Detailed Questions Review */}
        <div className="space-y-3 max-w-md mx-auto">
          <h3 className="font-bold text-title text-ink">مرور و تحلیل تک‌تک سوالات:</h3>
          {result.questionReviews.map((rev, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-tile bg-surface border text-body space-y-2 ${
                rev.isCorrect ? 'border-success/40' : 'border-danger/40'
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  {rev.isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-success" aria-hidden="true" />
                  ) : (
                    <XCircle className="w-5 h-5 text-danger" aria-hidden="true" />
                  )}
                  <span>سوال {toFa(idx + 1)}</span>
                </span>
                <span className="text-meta text-ink/60">
                  ضریب {toFa(rev.question.weight)}×
                </span>
              </div>
              <p className="font-semibold text-ink">{rev.question.prompt}</p>
              <div className="p-2.5 rounded-tile bg-paper text-ink/80 leading-relaxed font-medium text-meta">
                <strong>تحلیل: </strong> {rev.question.explanation}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 max-w-md mx-auto safe-bottom">
          <Button fullWidth size="lg" onClick={() => navigate('/path')}>
            بازگشت به مسیر یادگیری
          </Button>
        </div>
      </div>
    );
  }

  // 3. ACTIVE QUESTION RUNNER
  const totalQuestions = exam.questions.length;
  const currentQ = exam.questions[currentQuestionIndex];
  const currentSelected = userAnswers[currentQ.id] || [];

  const handleSelectOption = (optId: string) => {
    if (currentQ.kind === 'multi') {
      setUserAnswers((prev) => ({
        ...prev,
        [currentQ.id]: currentSelected.includes(optId)
          ? currentSelected.filter((id) => id !== optId)
          : [...currentSelected, optId],
      }));
    } else {
      setUserAnswers((prev) => ({
        ...prev,
        [currentQ.id]: [optId],
      }));
    }
  };

  const handleSubmitExam = async () => {
    try {
      setIsSubmitting(true);
      const res = await examsApi.submit(exam.id, userAnswers);
      setResult(res);
      showToast(res.passed ? 'آزمون با قبولی ثبت شد!' : 'ارزیابی به پایان رسید.', 'info');
    } catch (err: any) {
      showToast(err.message || 'خطا در ثبت نتایج آزمون', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-between p-4 text-ink">
      {/* Top Bar */}
      <header className="flex items-center gap-3 py-2">
        <button
          onClick={() => navigate('/path')}
          className="w-12 h-12 rounded-tile text-ink/60 hover:text-ink hover:bg-surface flex items-center justify-center cursor-pointer"
          aria-label="خروج از آزمون"
        >
          <X className="w-6 h-6" aria-hidden="true" />
        </button>
        <div className="flex-1 h-2 bg-sunken-dark rounded-pill overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
        <span className="text-meta font-bold text-ink font-mono">
          {toFa(currentQuestionIndex + 1)} / {toFa(totalQuestions)}
        </span>
      </header>

      {/* Question Card */}
      <div className="flex-1 py-4 space-y-4 max-w-sm mx-auto w-full">
        <div className="flex items-center justify-between text-meta">
          <span className="px-2.5 py-0.5 rounded-pill bg-domain-1-tint text-primary font-bold">
            سوال {toFa(currentQuestionIndex + 1)}
          </span>
          {currentQ.weight > 1 && (
            <span className="text-meta font-bold text-coin bg-domain-5-tint px-2 py-0.5 rounded-tile">
              سناریو با ضریب ۲×
            </span>
          )}
        </div>

        <h3 className="text-read font-bold text-ink leading-snug">
          {currentQ.prompt}
        </h3>

        <div className="space-y-2.5 pt-2">
          {currentQ.options.map((opt) => {
            const isSelected = currentSelected.includes(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => handleSelectOption(opt.id)}
                className={`w-full min-h-[48px] p-4 rounded-tile text-right text-meta transition-all border select-none cursor-pointer flex items-start gap-3 ${
                  isSelected
                    ? 'bg-domain-1-tint border-primary font-bold text-ink shadow-xs'
                    : 'bg-surface border-sunken text-ink/85 hover:bg-canvas'
                }`}
              >
                <span
                  className={`w-4 h-4 ${
                    currentQ.kind === 'multi' ? 'rounded-tile' : 'rounded-pill'
                  } border flex items-center justify-center shrink-0 mt-0.5 ${
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

      {/* Bottom Navigation */}
      <div className="pt-3 max-w-sm mx-auto w-full flex items-center gap-3 safe-bottom">
        {currentQuestionIndex > 0 && (
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
          >
            قبلی
          </Button>
        )}

        <Button
          fullWidth
          size="lg"
          variant="primary"
          isLoading={isSubmitting}
          onClick={() => {
            if (currentQuestionIndex < totalQuestions - 1) {
              setCurrentQuestionIndex((prev) => prev + 1);
            } else {
              handleSubmitExam();
            }
          }}
          rightIcon={<ChevronLeft className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />}
        >
          {currentQuestionIndex === totalQuestions - 1 ? 'ارسال پاسخ‌ها و مشاهده نتیجه' : 'سوال بعدی'}
        </Button>
      </div>
    </div>
  );
};
