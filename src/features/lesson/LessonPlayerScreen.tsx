import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Play,
  Pause,
  Volume2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  Check,
  Target,
  Clock,
  UserCheck,
} from 'lucide-react';
import { lessonsApi, LessonCompleteResult } from '../../api/lessons';
import { Lesson, LessonCard, QuizCard, ScenarioCard, FlashcardSet } from '../../types/domain';
import { Button } from '../../components/ui/Button';
import { ByteRow } from '../../components/ui/ByteRow';
import { StreakChain } from '../../components/ui/StreakChain';
import { useApp } from '../../state/AppContext';
import { toFa, formatDurationFa } from '../../lib/toFa';

export const LessonPlayerScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, updateUserLocal, entitlements, showToast } = useApp();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Card interactive states
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string[]>>({});
  const [selectedScenarioOption, setSelectedScenarioOption] = useState<string | null>(null);
  const [flippedFlashcards, setFlippedFlashcards] = useState<Record<string, boolean>>({});

  // Mock media states
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoElapsed, setVideoElapsed] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioElapsed, setAudioElapsed] = useState(0);

  // Bottom explanation drawer for quiz / scenario
  const [showExplanation, setShowExplanation] = useState(false);
  const [isLastAnswerCorrect, setIsLastAnswerCorrect] = useState<boolean | null>(null);
  const [explanationText, setExplanationText] = useState('');

  // Completion state
  const [isCompleted, setIsCompleted] = useState(false);
  const [completeResult, setCompleteResult] = useState<LessonCompleteResult | null>(null);
  const [displayedXp, setDisplayedXp] = useState(0);
  const [quizAllCorrectFirstTry, setQuizAllCorrectFirstTry] = useState(true);

  // Timer intervals for mock media
  useEffect(() => {
    let timer: any;
    if (isVideoPlaying) {
      timer = setInterval(() => {
        setVideoElapsed((prev) => (prev < 140 ? prev + 1 : 140));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isVideoPlaying]);

  useEffect(() => {
    let timer: any;
    if (isAudioPlaying) {
      timer = setInterval(() => {
        setAudioElapsed((prev) => (prev < 180 ? prev + 1 : 180));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isAudioPlaying]);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        setLoading(true);
        const data = await lessonsApi.get(id);
        setLesson(data);
      } catch (err: any) {
        showToast(err.message || 'خطا در بارگذاری گرابایت', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, showToast]);

  if (loading || !lesson) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-[#0D3F6B]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#1E6FA8] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold">در حال بارگذاری گرابایت...</p>
        </div>
      </div>
    );
  }

  const totalCards = lesson.cards.length;
  const currentCard = lesson.cards[currentCardIndex];

  // Advance card or submit completion
  const handleNext = async () => {
    // If on quiz/scenario card and hasn't checked explanation yet
    if (currentCard.type === 'quiz') {
      const quiz = currentCard as QuizCard;
      const selected = quizAnswers[quiz.id] || [];

      if (!showExplanation) {
        if (selected.length === 0) {
          showToast('لطفاً پیش از ادامه، پاسخ خود را انتخاب نمایید.', 'info');
          return;
        }

        const isCorrect =
          selected.length === quiz.correctIds.length &&
          selected.every((a) => quiz.correctIds.includes(a));

        if (!isCorrect) {
          setQuizAllCorrectFirstTry(false);
        }

        setIsLastAnswerCorrect(isCorrect);
        setExplanationText(quiz.explanation);
        setShowExplanation(true);
        return;
      }
    }

    if (currentCard.type === 'scenario') {
      const sc = currentCard as ScenarioCard;
      if (!showExplanation) {
        if (!selectedScenarioOption) {
          showToast('لطفاً یک راهکار را انتخاب کنید.', 'info');
          return;
        }
        const opt = sc.options.find((o) => o.id === selectedScenarioOption);
        setIsLastAnswerCorrect(opt?.isOptimal ?? true);
        setExplanationText(opt?.feedback || sc.takeaway);
        setShowExplanation(true);
        return;
      }
    }

    // Reset bottom explanation sheet
    setShowExplanation(false);
    setIsLastAnswerCorrect(null);

    // If more cards exist, advance
    if (currentCardIndex < totalCards - 1) {
      setCurrentCardIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Completed last card!
      await handleCompleteLesson();
    }
  };

  const handleCompleteLesson = async () => {
    try {
      const res = await lessonsApi.complete(lesson.id, {
        perfectQuiz: quizAllCorrectFirstTry,
      });
      setCompleteResult(res);
      updateUserLocal(res.user);
      setIsCompleted(true);

      // Animate XP countup
      let current = 0;
      const target = res.totalXp;
      const step = Math.max(1, Math.floor(target / 15));
      const interval = setInterval(() => {
        current += step;
        if (current >= target) {
          setDisplayedXp(target);
          clearInterval(interval);
        } else {
          setDisplayedXp(current);
        }
      }, 40);
    } catch (err: any) {
      showToast(err.message || 'خطا در ثبت پایان درس', 'error');
    }
  };

  // ==================== COMPLETION VIEW ====================
  if (isCompleted && completeResult) {
    return (
      <div className="min-h-screen bg-[#F2EDE4] flex flex-col justify-between p-6 text-[#0D3F6B] select-none">
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 pt-8">
          {/* Snap celebration circle */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 260 }}
            className="w-24 h-24 rounded-3xl bg-[#2E9E6B] text-white flex items-center justify-center shadow-lg border-4 border-white"
          >
            <Check className="w-14 h-14 stroke-[3]" />
          </motion.div>

          <div>
            <span className="px-3 py-1 rounded-full bg-[#EDF8F6] text-[#2E9E6B] text-xs font-black border border-[#2E9E6B]/30">
              گرابایت با موفقیت تکمیل شد
            </span>
            <h2 className="text-xl font-black mt-2 text-[#0D3F6B]">
              خسته نباشید!
            </h2>
            <p className="text-xs text-[#0D3F6B]/70 mt-1 max-w-xs">
              {lesson.title}
            </p>
          </div>

          {/* XP & Coins Countup Box */}
          <div className="w-full max-w-xs p-4 rounded-2xl bg-white border border-[#E8E1D5] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#0D3F6B]/70">امتیاز تجربه کسب‌شده:</span>
              <span className="text-lg font-black text-[#1E6FA8]">
                + {toFa(displayedXp)} XP
              </span>
            </div>

            {completeResult.coinsEarned > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-[#E8E1D5]">
                <span className="text-xs font-semibold text-[#0D3F6B]/70">سکه‌های دریافتی:</span>
                <span className="text-sm font-black text-[#F2A93B] flex items-center gap-1">
                  + {toFa(completeResult.coinsEarned)} سکه
                </span>
              </div>
            )}
          </div>

          {/* Daily Goal Byte Row Update */}
          <div className="w-full max-w-xs p-4 rounded-2xl bg-white border border-[#E8E1D5] shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#0D3F6B]">پیشرفت هدف امروز</span>
              <span className="font-bold text-[#1E6FA8]">
                {toFa(completeResult.user.todayCompletedCount)} از {toFa(completeResult.user.dailyGoal)}
              </span>
            </div>
            <div className="flex justify-center py-1">
              <ByteRow
                total={completeResult.user.dailyGoal}
                completed={completeResult.user.todayCompletedCount}
                size="md"
                activeColor="#1E6FA8"
                animatedIndex={completeResult.user.todayCompletedCount - 1}
              />
            </div>
          </div>

          {/* Streak Link Status */}
          <div className="flex items-center gap-2 text-xs font-bold bg-white px-4 py-2 rounded-xl border border-[#E8E1D5]">
            <span>زنجیره یادگیری:</span>
            <StreakChain count={completeResult.user.streakDays} size="sm" showLabel={false} />
            {completeResult.streakIncremented && (
              <span className="text-[#2E9E6B] text-[11px]">
                (+۱ پیوند جدید!)
              </span>
            )}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="pt-4 shrink-0 space-y-2">
          <Button
            fullWidth
            size="lg"
            variant="primary"
            onClick={() => navigate('/path')}
            rightIcon={<ChevronLeft className="w-5 h-5 stroke-[2.5]" />}
          >
            ادامه مسیر یادگیری
          </Button>
          <Button
            fullWidth
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
          >
            بازگشت به خانه
          </Button>
        </div>
      </div>
    );
  }

  // ==================== LESSON CARD RENDERERS ====================
  const renderCardContent = (card: LessonCard) => {
    switch (card.type) {
      case 'text':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-black text-[#0D3F6B] leading-snug">
              {card.headline}
            </h3>
            <div className="space-y-3 text-sm leading-[1.8] text-[#0D3F6B]/90 font-medium">
              {card.content.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>
            {card.keyTakeaway && (
              <div className="p-3.5 rounded-2xl bg-[#EAF3F9] border border-[#1E6FA8]/30 text-[#0D3F6B] space-y-1">
                <span className="text-[11px] font-bold text-[#1E6FA8] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>نکته کلیدی</span>
                </span>
                <p className="text-xs font-semibold leading-relaxed">
                  {card.keyTakeaway}
                </p>
              </div>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-[#0D3F6B]">{card.title}</h3>
            {/* Mock Video Player */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#0D3F6B] border border-[#E8E1D5] shadow-sm flex flex-col justify-between p-3 text-white">
              <div className="flex items-center justify-between text-xs">
                <span className="px-2 py-0.5 rounded bg-black/50 text-[10px] font-mono">
                  {formatDurationFa(videoElapsed)} / {formatDurationFa(card.durationSeconds)}
                </span>
                <span className="text-[11px] opacity-80">{card.posterTitle}</span>
              </div>

              {/* Center Play Button */}
              <button
                onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                className="w-14 h-14 rounded-full bg-white/90 text-[#0D3F6B] flex items-center justify-center mx-auto shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                aria-label={isVideoPlaying ? 'توقف ویدیو' : 'پخش ویدیو'}
              >
                {isVideoPlaying ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current translate-x-0.5" />
                )}
              </button>

              {/* Video Timeline bar */}
              <div className="space-y-1">
                <div className="w-full h-1.5 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1E6FA8] transition-all duration-300"
                    style={{ width: `${(videoElapsed / card.durationSeconds) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <p className="text-xs text-[#0D3F6B]/80 leading-relaxed">
              {card.description}
            </p>

            <div className="p-3.5 rounded-2xl bg-white border border-[#E8E1D5] space-y-2">
              <h4 className="text-xs font-bold text-[#0D3F6B]">محورهای کلیدی ویدیو:</h4>
              <ul className="space-y-1.5 text-xs text-[#0D3F6B]/85">
                {card.keyPoints.map((pt, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2E9E6B] shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );

      case 'audio':
        return (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-bold text-[#0D3F6B]">{card.title}</h3>
              <p className="text-xs text-[#0D3F6B]/60 mt-0.5">{card.speaker}</p>
            </div>

            {/* Mock Audio Waveform Player */}
            <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsAudioPlaying(!isAudioPlaying)}
                  className="w-12 h-12 rounded-full bg-[#1E6FA8] text-white flex items-center justify-center shrink-0 hover:bg-[#1A6295] active:scale-95 transition-all shadow-sm"
                  aria-label={isAudioPlaying ? 'توقف پادکست' : 'پخش پادکست'}
                >
                  {isAudioPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current translate-x-0.5" />
                  )}
                </button>

                {/* Animated Waveform bars */}
                <div className="flex-1 flex items-center justify-between gap-1 h-12 px-2 bg-[#FAF8F5] rounded-xl border border-[#E8E1D5]/60">
                  {card.waveformSeed.map((height, idx) => (
                    <motion.div
                      key={idx}
                      className="w-1.5 rounded-full bg-[#1E6FA8]"
                      animate={{
                        height: isAudioPlaying ? [height * 0.4, height, height * 0.4] : height * 0.5,
                      }}
                      transition={{
                        repeat: isAudioPlaying ? Infinity : 0,
                        duration: 0.8 + (idx % 4) * 0.2,
                        ease: 'easeInOut',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-[#0D3F6B]/70 font-mono">
                <span>{formatDurationFa(audioElapsed)}</span>
                <span>{formatDurationFa(card.durationSeconds)}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E1D5] space-y-1.5">
              <span className="text-[11px] font-bold text-[#0D3F6B]/60 flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5" />
                <span>متن کوتاه پادکست:</span>
              </span>
              <p className="text-xs text-[#0D3F6B] leading-relaxed italic">
                «{card.transcript}»
              </p>
            </div>
          </div>
        );

      case 'infographic':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#0D3F6B]">{card.title}</h3>
              <p className="text-xs text-[#0D3F6B]/70 mt-1">{card.caption}</p>
            </div>

            {/* Structured SVG Infographic Pillars */}
            <div className="space-y-3">
              {card.items.map((item, idx) => {
                const colors = ['#1E6FA8', '#1F9A8A', '#7A5BD6'];
                const itemColor = colors[idx % colors.length];

                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-white border border-[#E8E1D5] shadow-xs flex items-start gap-3"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-sm shadow-xs"
                      style={{ backgroundColor: itemColor }}
                    >
                      {idx === 0 ? <Target className="w-5 h-5" /> : idx === 1 ? <Clock className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#0D3F6B]">
                        {item.title}
                      </h4>
                      <p className="text-xs text-[#0D3F6B]/80 mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'flashcards':
        const fcSet = card as FlashcardSet;
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#0D3F6B]">فلش‌کارت‌های مرور مفاهیم</h3>
              <p className="text-xs text-[#0D3F6B]/70 mt-0.5">{fcSet.instruction}</p>
            </div>

            <div className="space-y-3">
              {fcSet.cards.map((fc) => {
                const isFlipped = !!flippedFlashcards[fc.id];
                return (
                  <div
                    key={fc.id}
                    onClick={() =>
                      setFlippedFlashcards((prev) => ({
                        ...prev,
                        [fc.id]: !prev[fc.id],
                      }))
                    }
                    className="min-h-[110px] p-4 rounded-2xl bg-white border-2 border-[#E8E1D5] hover:border-[#1E6FA8]/40 shadow-xs cursor-pointer flex flex-col justify-between transition-all select-none"
                  >
                    <div className="flex items-center justify-between text-[11px] text-[#0D3F6B]/50 font-semibold">
                      <span>{fc.category || 'مرور'}</span>
                      <span className="flex items-center gap-1 text-[#1E6FA8]">
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{isFlipped ? 'روی کارت' : 'پشت کارت'}</span>
                      </span>
                    </div>

                    <div className="my-2">
                      <p className={`text-sm font-bold leading-relaxed ${isFlipped ? 'text-[#1E6FA8]' : 'text-[#0D3F6B]'}`}>
                        {isFlipped ? fc.back : fc.front}
                      </p>
                    </div>

                    <span className="text-[10px] text-[#0D3F6B]/40">
                      ضربه برای وارونه کردن
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'scenario':
        const sc = card as ScenarioCard;
        return (
          <div className="space-y-4">
            <span className="px-2.5 py-0.5 rounded-full bg-[#EAF3F9] text-[#1E6FA8] text-xs font-bold">
              سناریوی واقعی محیط کار
            </span>

            {/* Situation Card */}
            <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] shadow-xs space-y-2">
              <h3 className="font-bold text-sm text-[#0D3F6B]">صورت مسئله:</h3>
              <p className="text-xs text-[#0D3F6B]/85 leading-relaxed">
                {sc.situation}
              </p>
              <div className="pt-2 border-t border-[#E8E1D5] text-xs text-[#0D3F6B]/70 font-semibold">
                نقش شما: {sc.roleContext}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold text-[#0D3F6B]">
                بهترین واکنش در این شرایط چیست؟
              </span>
              {sc.options.map((opt) => {
                const isSelected = selectedScenarioOption === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedScenarioOption(opt.id)}
                    className={`w-full p-3.5 rounded-xl text-right text-xs transition-all border select-none cursor-pointer flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-[#EAF3F9] border-[#1E6FA8] font-bold text-[#0D3F6B] shadow-xs'
                        : 'bg-white border-[#E8E1D5] text-[#0D3F6B]/80 hover:bg-gray-50'
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
        );

      case 'quiz':
        const q = card as QuizCard;
        const currentSelected = quizAnswers[q.id] || [];

        return (
          <div className="space-y-4">
            <span className="px-2.5 py-0.5 rounded-full bg-[#EDF8F6] text-[#1F9A8A] text-xs font-bold">
              ارزیابی مفهومی درس
            </span>

            <h3 className="text-base font-bold text-[#0D3F6B] leading-snug">
              {q.prompt}
            </h3>

            <div className="space-y-2.5 pt-2">
              {q.options.map((opt) => {
                const isSelected = currentSelected.includes(opt.id);

                const handleToggle = () => {
                  if (q.kind === 'multi') {
                    setQuizAnswers((prev) => ({
                      ...prev,
                      [q.id]: isSelected
                        ? currentSelected.filter((item) => item !== opt.id)
                        : [...currentSelected, opt.id],
                    }));
                  } else {
                    setQuizAnswers((prev) => ({
                      ...prev,
                      [q.id]: [opt.id],
                    }));
                  }
                };

                return (
                  <button
                    key={opt.id}
                    onClick={handleToggle}
                    className={`w-full p-3.5 rounded-xl text-right text-xs transition-all border select-none cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'bg-[#EAF3F9] border-[#1E6FA8] font-bold text-[#0D3F6B] shadow-xs'
                        : 'bg-white border-[#E8E1D5] text-[#0D3F6B]/80 hover:bg-gray-50'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 ${
                        q.kind === 'multi' ? 'rounded-md' : 'rounded-full'
                      } border flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'border-[#1E6FA8] bg-[#1E6FA8] text-white' : 'border-[#CFC5B6]'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                    <span className="leading-relaxed">{opt.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F2EDE4] flex flex-col justify-between">
      {/* 1. Top Bar: Close Button + Segmented Progress Bar */}
      <header className="sticky top-0 z-30 bg-[#F2EDE4]/95 backdrop-blur-md px-4 py-3 border-b border-[#E8E1D5]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/path')}
            className="p-2 rounded-xl text-[#0D3F6B]/70 hover:text-[#0D3F6B] hover:bg-white transition-colors"
            aria-label="خروج از درس"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Segmented Progress Row for Cards */}
          <div className="flex-1 flex items-center gap-1">
            {lesson.cards.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 flex-1 rounded-full transition-all duration-200 ${
                  idx <= currentCardIndex ? 'bg-[#1E6FA8]' : 'bg-[#DCD4C7]'
                }`}
              />
            ))}
          </div>

          <span className="text-xs font-bold text-[#0D3F6B]/70 font-mono">
            {toFa(currentCardIndex + 1)}/{toFa(totalCards)}
          </span>
        </div>
      </header>

      {/* 2. Main Card Content Area */}
      <div className="flex-1 p-5 overflow-y-auto max-w-[480px] mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCardIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderCardContent(currentCard)}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 3. Sticky Bottom CTA & Slide-up Explanation */}
      <div className="sticky bottom-0 z-30 bg-white border-t border-[#E8E1D5] shadow-lg">
        {/* Slide-up explanation for answer checks */}
        <AnimatePresence>
          {showExplanation && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`p-4 border-b ${
                isLastAnswerCorrect
                  ? 'bg-[#EDF8F6] border-[#2E9E6B]/30 text-[#2E9E6B]'
                  : 'bg-[#FDF2F0] border-[#D5483F]/30 text-[#D5483F]'
              }`}
            >
              <div className="flex items-center gap-2 mb-1 font-bold text-sm">
                {isLastAnswerCorrect ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>پاسخ صحیح است!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 shrink-0" />
                    <span>نیاز به دقت بیشتر:</span>
                  </>
                )}
              </div>
              <p className="text-xs text-[#0D3F6B]/80 leading-relaxed font-medium">
                {explanationText}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-4 max-w-[480px] mx-auto w-full">
          <Button
            fullWidth
            size="lg"
            variant="primary"
            onClick={handleNext}
            rightIcon={<ChevronLeft className="w-5 h-5 stroke-[2.5]" />}
          >
            {currentCardIndex === totalCards - 1 && !showExplanation && currentCard.type !== 'quiz'
              ? 'تکمیل گرابایت'
              : showExplanation || currentCard.type !== 'quiz' && currentCard.type !== 'scenario'
              ? 'ادامه'
              : 'بررسی پاسخ'}
          </Button>
        </div>
      </div>
    </div>
  );
};
