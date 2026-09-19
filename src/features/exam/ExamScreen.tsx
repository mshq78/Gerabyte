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
  const { user, updateUserLocal, showToast } = useApp();

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
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-[#0D3F6B]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#1E6FA8] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold">در حال آماده‌سازی سوالات آزمون...</p>
        </div>
      </div>
    );
  }

  // 1. RULES & START SCREEN
  if (!hasStarted && !result) {
    return (
      <div className="min-h-screen bg-[#F2EDE4] flex flex-col justify-between p-5 text-[#0D3F6B]">
        <header className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl text-[#0D3F6B]/60 hover:text-[#0D3F6B] hover:bg-white"
            aria-label="بازگشت"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="text-xs font-bold text-[#1E6FA8] bg-[#EAF3F9] px-3 py-1 rounded-full">
            {exam.isCertificate ? 'آزمون اعطای گواهینامه' : 'ارزیابی فصلی'}
          </span>
        </header>

        <div className="flex-1 flex flex-col justify-center space-y-5 max-w-sm mx-auto w-full py-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-3xl bg-[#FEF6EC] text-[#F2A93B] flex items-center justify-center mx-auto border border-[#F2A93B]/40 shadow-xs">
              <Award className="w-9 h-9 stroke-[2.2]" />
            </div>
            <h2 className="text-lg font-black text-[#0D3F6B]">{exam.title}</h2>
            <p className="text-xs text-[#0D3F6B]/70">{exam.targetDomainTitle}</p>
          </div>

          {/* Rules Card */}
          <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] shadow-xs space-y-3 text-xs">
            <h3 className="font-bold text-sm text-[#0D3F6B] border-b border-[#E8E1D5] pb-2">
              ضوابط و شرایط برگزاری آزمون:
            </h3>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#1E6FA8] shrink-0 mt-0.5" />
              <span>
                حد نصاب قبولی: <strong>حداقل {toFa(exam.passMarkPct)}٪ نمره کل</strong>
              </span>
            </div>

            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-[#1E6FA8] shrink-0 mt-0.5" />
              <span>
                تعداد سوالات انتخابی تصادفی از بانک سوالات: <strong>{toFa(exam.drawCount)} سوال</strong>
              </span>
            </div>

            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-[#E58A1F] shrink-0 mt-0.5" />
              <span>
                سوالات سناریومحور دارای <strong>ضریب ۲×</strong> در محاسبه نمره هستند.
              </span>
            </div>

            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-[#D5483F] shrink-0 mt-0.5" />
              <span>
                حداکثر دفعات مجاز: <strong>{toFa(exam.maxAttempts)} نوبت</strong> با دوره خنک‌سازی {toFa(exam.cooldownHours)} ساعته
              </span>
            </div>
          </div>

          <div className="text-[11px] text-[#0D3F6B]/70 text-center leading-relaxed">
            پس از پایان آزمون، تحلیل و بازخورد تفصیلی گزینه‌های صحیح و نادرست نمایش داده خواهد شد.
          </div>
        </div>

        <div className="pt-3">
          <Button
            fullWidth
            size="lg"
            variant="primary"
            onClick={() => setHasStarted(true)}
            rightIcon={<ChevronLeft className="w-5 h-5 stroke-[2.5]" />}
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
      <div className="min-h-screen bg-[#F2EDE4] p-5 text-[#0D3F6B] space-y-5">
        <header className="flex items-center justify-between">
          <button
            onClick={() => navigate('/path')}
            className="p-2 rounded-xl text-[#0D3F6B]/60 hover:text-[#0D3F6B] hover:bg-white"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="text-xs font-bold text-[#0D3F6B]/70">نتیجه ارزیابی</span>
        </header>

        {/* Outcome Card */}
        <div className="p-5 rounded-3xl bg-white border border-[#E8E1D5] shadow-xs text-center space-y-3">
          <div
            className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto text-white shadow-md ${
              result.passed ? 'bg-[#2E9E6B]' : 'bg-[#D5483F]'
            }`}
          >
            {result.passed ? (
              <FileCheck className="w-9 h-9 stroke-[2.5]" />
            ) : (
              <XCircle className="w-9 h-9 stroke-[2.5]" />
            )}
          </div>

          <div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                result.passed
                  ? 'bg-[#EDF8F6] text-[#2E9E6B] border-[#2E9E6B]/30'
                  : 'bg-[#FDF2F0] text-[#D5483F] border-[#D5483F]/30'
              }`}
            >
              {result.passed ? 'تبریک! آزمون با موفقیت گذرانده شد' : 'عدم احراز حدنصاب قبولی'}
            </span>
            <h2 className="text-2xl font-black mt-2">
              نمره کسب‌شده: {toFa(result.scorePct)}٪
            </h2>
            <p className="text-xs text-[#0D3F6B]/70 mt-1">
              (پاسخ صحیح به {toFa(result.correctCount)} از {toFa(result.totalQuestions)} سوال)
            </p>
          </div>

          {result.passed && result.certificateSerial && (
            <div className="p-3.5 rounded-2xl bg-[#FEF6EC] border border-[#F2A93B]/40 text-[#0D3F6B] space-y-1 text-xs">
              <span className="font-bold text-[#E58A1F]">گواهینامه رسمی صادر گردید:</span>
              <p className="font-mono font-bold text-sm tracking-wider text-[#0D3F6B]">
                {result.certificateSerial}
              </p>
              <button
                onClick={() => navigate(`/certificates/${result.certificateSerial}`)}
                className="mt-2 text-xs font-bold text-[#1E6FA8] underline block mx-auto"
              >
                مشاهده و دانلود گواهینامه معتبر با QR
              </button>
            </div>
          )}
        </div>

        {/* Detailed Questions Review */}
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-[#0D3F6B]">مرور و تحلیل تک‌تک سوالات:</h3>
          {result.questionReviews.map((rev, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl bg-white border text-xs space-y-2 ${
                rev.isCorrect ? 'border-[#2E9E6B]/40' : 'border-[#D5483F]/40'
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  {rev.isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 text-[#2E9E6B]" />
                  ) : (
                    <XCircle className="w-4 h-4 text-[#D5483F]" />
                  )}
                  <span>سوال {toFa(idx + 1)}</span>
                </span>
                <span className="text-[10px] text-[#0D3F6B]/60">
                  ضریب {toFa(rev.question.weight)}×
                </span>
              </div>
              <p className="font-semibold text-[#0D3F6B]">{rev.question.prompt}</p>
              <div className="p-2.5 rounded-xl bg-[#FAF8F5] text-[#0D3F6B]/80 leading-relaxed font-medium">
                <strong>تحلیل: </strong> {rev.question.explanation}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2">
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
    <div className="min-h-screen bg-[#F2EDE4] flex flex-col justify-between p-4">
      {/* Top Bar */}
      <header className="flex items-center gap-3 py-2">
        <button
          onClick={() => navigate('/path')}
          className="p-2 rounded-xl text-[#0D3F6B]/60 hover:text-[#0D3F6B] hover:bg-white"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex-1 h-2 bg-[#DCD4C7] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1E6FA8] transition-all"
            style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
        <span className="text-xs font-bold text-[#0D3F6B] font-mono">
          {toFa(currentQuestionIndex + 1)} / {toFa(totalQuestions)}
        </span>
      </header>

      {/* Question Card */}
      <div className="flex-1 py-4 space-y-4 max-w-sm mx-auto w-full">
        <div className="flex items-center justify-between text-xs">
          <span className="px-2.5 py-0.5 rounded-full bg-[#EAF3F9] text-[#1E6FA8] font-bold">
            سوال {toFa(currentQuestionIndex + 1)}
          </span>
          {currentQ.weight > 1 && (
            <span className="text-[11px] font-bold text-[#E58A1F] bg-[#FEF6EC] px-2 py-0.5 rounded-md">
              سناریو با ضریب ۲×
            </span>
          )}
        </div>

        <h3 className="text-base font-bold text-[#0D3F6B] leading-snug">
          {currentQ.prompt}
        </h3>

        <div className="space-y-2.5 pt-2">
          {currentQ.options.map((opt) => {
            const isSelected = currentSelected.includes(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => handleSelectOption(opt.id)}
                className={`w-full p-4 rounded-2xl text-right text-xs transition-all border select-none cursor-pointer flex items-start gap-3 ${
                  isSelected
                    ? 'bg-[#EAF3F9] border-[#1E6FA8] font-bold text-[#0D3F6B] shadow-xs'
                    : 'bg-white border-[#E8E1D5] text-[#0D3F6B]/85 hover:bg-gray-50'
                }`}
              >
                <span
                  className={`w-4 h-4 ${
                    currentQ.kind === 'multi' ? 'rounded-md' : 'rounded-full'
                  } border flex items-center justify-center shrink-0 mt-0.5 ${
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

      {/* Bottom Navigation */}
      <div className="pt-3 max-w-sm mx-auto w-full flex items-center gap-3">
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
          rightIcon={<ChevronLeft className="w-5 h-5 stroke-[2.5]" />}
        >
          {currentQuestionIndex === totalQuestions - 1 ? 'ارسال پاسخ‌ها و مشاهده نتیجه' : 'سوال بعدی'}
        </Button>
      </div>
    </div>
  );
};
