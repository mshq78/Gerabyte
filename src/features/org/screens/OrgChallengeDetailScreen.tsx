import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Trophy,
  ArrowRight,
  Calendar,
  Users,
  Target,
  Gift,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Send,
  RotateCcw,
  Sparkles,
  PartyPopper,
} from 'lucide-react';
import { challengeRequestsApi } from '../../../api/org/challengeRequests';
import { ChallengeRequest, ChallengeRequestStatus } from '../../../types/org';
import { toFa } from '../../../lib/format';
import { useOrgScope } from '../context/ScopeContext';

export const OrgChallengeDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userRole } = useOrgScope();
  const [request, setRequest] = useState<ChallengeRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isCongratulated, setIsCongratulated] = useState(false);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await challengeRequestsApi.getById(id);
      setRequest(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-20 text-body font-bold text-ink/60">
        در حال بارگذاری جزئیات چالش...
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-title font-black text-ink">چالش مورد نظر یافت نشد</h2>
        <Link to="/org/challenges" className="text-primary font-bold text-meta hover:underline">
          بازگشت به فهرست چالش‌ها
        </Link>
      </div>
    );
  }

  const handleWithdraw = async () => {
    try {
      const updated = await challengeRequestsApi.withdraw(
        request.id,
        userRole === 'unit_manager' ? 'مهندس علیرضا رضایی' : 'مهندس محمدرضا صادقی'
      );
      setRequest(updated);
      setActionMessage('درخواست جهت ویرایش مجدد بازپس‌گرفته شد.');
    } catch (err: any) {
      setActionMessage(err.message);
    }
  };

  const handleSubmitAgain = async () => {
    try {
      const updated = await challengeRequestsApi.submit(
        request.id,
        userRole === 'unit_manager' ? 'مهندس علیرضا رضایی' : 'مهندس محمدرضا صادقی'
      );
      setRequest(updated);
      setActionMessage('درخواست به تیم پشتیبانی گرا ارسال گردید.');
    } catch (err: any) {
      setActionMessage(err.message);
    }
  };

  const handleSendCongrats = () => {
    setIsCongratulated(true);
    setActionMessage('پیام تبریک سازمانی به همراه تقدیرنامه دیجیتال برای برندگان ارسال گردید.');
  };

  const targetLabel =
    request.target === 'all'
      ? 'تمام واحدهای سازمان'
      : (request.target as any).unitName || 'واحد مشخص';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 text-ink">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sunken pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/org/challenges"
            className="min-h-[44px] min-w-[44px] p-2 rounded-tile bg-surface hover:bg-canvas border border-sunken text-ink flex items-center justify-center transition-all cursor-pointer"
            aria-label="بازگشت به فهرست چالش‌ها"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-display font-black text-ink">{request.title}</h1>
            </div>
            <p className="text-meta text-ink/70">درخواست‌دهنده: {request.requestedByName}</p>
          </div>
        </div>

        {/* Status Actions */}
        <div className="flex items-center gap-2">
          {(request.status === 'submitted' || request.status === 'in_review') && (
            <button
              onClick={handleWithdraw}
              className="min-h-[44px] px-4 py-2 rounded-tile bg-surface hover:bg-canvas border border-sunken text-danger text-meta font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>بازپس‌گیری جهت ویرایش</span>
            </button>
          )}

          {(request.status === 'draft' || request.status === 'needs_changes') && (
            <button
              onClick={handleSubmitAgain}
              className="min-h-[44px] px-5 py-2 rounded-tile bg-primary hover:bg-primary-hover text-white text-meta font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>ارسال نهایی برای گرا</span>
            </button>
          )}
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-tile bg-domain-3-tint border border-success/30 text-success text-meta font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Main Grid: Overview & Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Columns: Summary & Live/Ended Status */}
        <div className="md:col-span-2 space-y-6">
          {/* Summary Card */}
          <div className="p-6 rounded-sheet bg-surface border border-sunken shadow-xs space-y-4">
            <h2 className="text-title font-black text-ink">مشخصات چالش و اهداف</h2>
            <p className="text-body text-ink/80 leading-relaxed">{request.objective}</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-tile bg-paper border border-sunken text-meta">
              <div>
                <span className="text-ink/50 text-meta block">محدوده:</span>
                <strong className="text-ink block truncate">{targetLabel}</strong>
              </div>
              <div>
                <span className="text-ink/50 text-meta block">تارگت هدف:</span>
                <strong className="text-primary block">
                  {request.goal.type === 'xp'
                    ? `${toFa(request.goal.target)} امتیاز`
                    : request.goal.type === 'lessons'
                      ? `${toFa(request.goal.target)} گرابایت`
                      : `${toFa(request.goal.target)} روز زنجیره`}
                </strong>
              </div>
              <div>
                <span className="text-ink/50 text-meta block">بازه زمانی:</span>
                <strong className="text-ink font-mono block">
                  {toFa(request.startsAt)} تا {toFa(request.endsAt)}
                </strong>
              </div>
            </div>

            {request.notes && (
              <div className="text-meta text-ink/70">
                <strong>ملاحظات اجرایی:</strong> {request.notes}
              </div>
            )}
          </div>

          {/* Approved Prize & Winner Selection Rules (defined by Gera) */}
          {request.approvedPrize ? (
            <div className="p-6 rounded-sheet bg-domain-5-tint/40 border border-coin/40 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-coin">
                <Trophy className="w-6 h-6" />
                <h3 className="text-title font-black text-ink">جایزه نهایی و مصوب گرا</h3>
              </div>
              <div className="space-y-1.5 text-meta">
                <div className="text-body font-black text-ink">{request.approvedPrize.title}</div>
                <div className="text-ink/80 leading-relaxed">
                  {request.approvedPrize.description}
                </div>
                {request.approvedPrize.valueTag && (
                  <span className="inline-block px-2.5 py-0.5 rounded-tile bg-coin/20 text-coin font-black text-meta">
                    {request.approvedPrize.valueTag}
                  </span>
                )}
              </div>

              {request.winnersRule && (
                <div className="pt-3 border-t border-coin/20 text-meta">
                  <span className="text-ink/60 font-bold block">نحوه انتخاب برندگان توسط گرا:</span>
                  <p className="text-ink font-bold mt-0.5">{request.winnersRule}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-5 rounded-sheet bg-surface border border-sunken text-meta space-y-2">
              <span className="text-ink/60 font-bold block">جایزه پیشنهادی اولیه:</span>
              <p className="text-ink font-bold">{request.suggestedPrize || 'تعیین نشده'}</p>
              <p className="text-meta text-ink/60">
                (پس از تأیید درخواست توسط گرا، بسته جوایز نهایی و قواعد اهدا در اینجا درج خواهد شد)
              </p>
            </div>
          )}

          {/* Active Live Progress Stats */}
          {request.status === 'active' && (
            <div className="p-6 rounded-sheet bg-surface border border-sunken shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-title font-black text-ink flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span>آمار زنده رقابت و مشارکت</span>
                </h3>
                <span className="px-3 py-1 rounded-pill bg-domain-3-tint text-success font-black text-meta">
                  در حال برگزاری
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-tile bg-canvas border border-sunken text-center">
                  <div className="text-display font-black text-primary">
                    {toFa(request.live?.joined || 42)}
                  </div>
                  <span className="text-meta text-ink/70 font-bold">نفر پیوسته به ماراتن</span>
                </div>
                <div className="p-4 rounded-tile bg-canvas border border-sunken text-center">
                  <div className="text-display font-black text-success">
                    {toFa(request.live?.completed || 28)}
                  </div>
                  <span className="text-meta text-ink/70 font-bold">نفر موفق به اتمام مأموریت</span>
                </div>
              </div>
            </div>
          )}

          {/* Ended Results & Winners */}
          {request.status === 'ended' && request.result && (
            <div className="p-6 rounded-sheet bg-surface border border-sunken shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary">
                  <PartyPopper className="w-6 h-6 text-coin" />
                  <h3 className="text-title font-black text-ink">نتایج نهایی و برندگان ماراتن</h3>
                </div>
                <button
                  disabled={isCongratulated}
                  onClick={handleSendCongrats}
                  className={`min-h-[44px] px-4 py-2 rounded-tile font-bold text-meta flex items-center gap-1.5 transition-all cursor-pointer ${
                    isCongratulated
                      ? 'bg-domain-3-tint text-success border border-success/30'
                      : 'bg-primary hover:bg-primary-hover text-white shadow-xs'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isCongratulated ? 'پیام تبریک ارسال شد' : 'ارسال تبریک به برندگان'}</span>
                </button>
              </div>

              <div className="space-y-2">
                {request.result.winners.map((winner, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-tile bg-paper border border-sunken flex items-center justify-between text-meta"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-tile bg-domain-5-tint text-coin flex items-center justify-center font-black">
                        #{toFa(idx + 1)}
                      </div>
                      <div>
                        <strong className="text-ink text-body">{winner.name}</strong>
                        <span className="text-ink/60 block text-meta">{winner.unit}</span>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-pill bg-domain-3-tint text-success font-bold text-meta">
                      برنده جایزه گرا
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Column: Timeline of Status & Comments */}
        <div className="space-y-4">
          <div className="p-6 rounded-sheet bg-surface border border-sunken shadow-xs space-y-4">
            <h3 className="text-title font-black text-ink flex items-center gap-2">
              <Clock className="w-5 h-5 text-ink/70" />
              <span>گاه‌شمار بررسی و تغییر وضعیت</span>
            </h3>

            <div className="relative border-r-2 border-sunken mr-2 space-y-6 pr-4">
              {request.timeline.map((step, idx) => (
                <div key={idx} className="relative">
                  {/* Timeline dot */}
                  <div className="absolute -right-[23px] top-1 w-3.5 h-3.5 rounded-full bg-primary border-2 border-surface" />
                  <div className="text-meta font-mono text-ink/50">{toFa(step.at)}</div>
                  <div className="text-meta font-bold text-ink mt-0.5">{step.byName}</div>
                  {step.comment && (
                    <div className="p-2.5 rounded-tile bg-canvas border border-sunken text-meta text-ink/80 mt-1.5 leading-relaxed">
                      {step.comment}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
