import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Layers,
} from 'lucide-react';
import { challengeRequestsApi } from '../api/org/challengeRequests';
import { subscriptionsApi } from '../api/org/subscriptions';
import { ChallengeRequest, SeatSummary } from '../types/org';
import { toFa } from '../lib/format';
import { errorMessage } from '../lib/errors';

export const OrgSimulatorPanel: React.FC<{ onRequestChanged?: () => void }> = ({
  onRequestChanged,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [latestRequest, setLatestRequest] = useState<ChallengeRequest | null>(null);
  const [seatSummary, setSeatSummary] = useState<SeatSummary | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const requests = await challengeRequestsApi.list();
      const pendingOrActive =
        requests.find(
          (r) =>
            r.status === 'submitted' || r.status === 'in_review' || r.status === 'needs_changes'
        ) || requests[0];
      setLatestRequest(pendingOrActive || null);
      const summary = await subscriptionsApi.getSummary();
      setSeatSummary(summary);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async () => {
    if (!latestRequest) return;
    setLoading(true);
    try {
      await challengeRequestsApi.approveByGera(latestRequest.id);
      setActionMessage(
        `چالش «${latestRequest.title}» توسط گرا تأیید شد و در اپلیکیشن یادگیرندگان منتشر گردید!`
      );
      await loadData();
      onRequestChanged?.();
    } catch (err) {
      setActionMessage(errorMessage(err) || 'خطا در تأیید');
    } finally {
      setLoading(false);
    }
  };

  const handleNeedsChanges = async () => {
    if (!latestRequest) return;
    setLoading(true);
    try {
      await challengeRequestsApi.needsChangesByGera(
        latestRequest.id,
        'لطفاً بازه زمانی چالش را حداقل به ۱۴ روز افزایش داده و هدف امتیاز را دقیق‌تر نمایید.'
      );
      setActionMessage(`درخواست اصلاح برای چالش «${latestRequest.title}» ارسال شد.`);
      await loadData();
      onRequestChanged?.();
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!latestRequest) return;
    setLoading(true);
    try {
      await challengeRequestsApi.rejectByGera(
        latestRequest.id,
        'با توجه به برگزاری آزمون جامع ایمنی در این ماه، با برگزاری موازی این چالش موافقت نگردید.'
      );
      setActionMessage(`چالش «${latestRequest.title}» رد شد.`);
      await loadData();
      onRequestChanged?.();
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNearlyFullSeats = async () => {
    if (!seatSummary) return;
    setLoading(true);
    try {
      const isCurrentlyFull = seatSummary.unassigned <= 5;
      const updated = await subscriptionsApi.setDemoNearlyFull(!isCurrentlyFull);
      setSeatSummary(updated);
      setActionMessage(
        !isCurrentlyFull
          ? 'سهمیه‌های خالی به ۲ سهمیه کاهش یافت (جهت آزمایش خطای محدودیت سهمیه در بارگذاری گروهی).'
          : 'سهمیه‌های خالی به حالت عادی (۲۸۰ سهمیه) بازگردانی شد.'
      );
      onRequestChanged?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="print:hidden fixed bottom-4 left-4 z-40 max-w-sm w-full transition-all">
      <div className="bg-surface/95 backdrop-blur-md border border-primary/40 rounded-sheet shadow-lg overflow-hidden">
        {/* Toggle Bar */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2.5 bg-primary/10 hover:bg-primary/15 flex items-center justify-between text-meta font-black text-primary transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span>پنل دموی داوران (شبیه‌ساز اقدامات گرا)</span>
          </div>
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>

        {isOpen && (
          <div className="p-4 space-y-3.5 text-meta text-ink">
            {actionMessage && (
              <div className="p-2.5 rounded-tile bg-domain-3-tint text-success font-bold text-meta border border-success/30 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{actionMessage}</span>
              </div>
            )}

            {/* B2 / B9: Gera Approval Actions */}
            <div className="space-y-2 border-b border-sunken pb-3">
              <div className="flex items-center justify-between font-bold">
                <span className="text-ink/70">بررسی درخواست چالش توسط گرا:</span>
                <span className="text-primary font-mono text-meta">
                  {latestRequest ? latestRequest.status : 'یافت نشد'}
                </span>
              </div>

              {latestRequest ? (
                <div className="p-2 rounded-tile bg-canvas border border-sunken space-y-1 text-meta">
                  <div className="font-bold text-ink truncate">{latestRequest.title}</div>
                  <div className="text-ink/60">درخواست‌دهنده: {latestRequest.requestedByName}</div>
                </div>
              ) : (
                <div className="text-ink/60">درخواستی در صف بررسی نیست.</div>
              )}

              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <button
                  disabled={loading || !latestRequest}
                  onClick={handleApprove}
                  className="min-h-[36px] px-2 py-1 rounded-tile bg-success hover:bg-success/90 text-white font-bold text-meta flex items-center justify-center gap-1 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                  title="تأیید توسط گرا و انتشار مستقیم در اپلیکیشن یادگیرنده"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>تأیید</span>
                </button>
                <button
                  disabled={loading || !latestRequest}
                  onClick={handleNeedsChanges}
                  className="min-h-[36px] px-2 py-1 rounded-tile bg-domain-5-tint text-coin hover:bg-coin/20 border border-coin/40 font-bold text-meta flex items-center justify-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
                  title="درخواست اصلاحات به مدیر"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>اصلاح</span>
                </button>
                <button
                  disabled={loading || !latestRequest}
                  onClick={handleReject}
                  className="min-h-[36px] px-2 py-1 rounded-tile bg-domain-2-tint text-danger hover:bg-danger/20 border border-danger/40 font-bold text-meta flex items-center justify-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
                  title="رد درخواست"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>رد</span>
                </button>
              </div>
            </div>

            {/* B9: Seat Pool Limit Switcher */}
            <div className="space-y-2">
              <div className="flex items-center justify-between font-bold">
                <span className="text-ink/70">تست ظرفیت سهمیه‌ها (Import):</span>
                <span className="font-mono text-primary">
                  {seatSummary ? `${toFa(seatSummary.unassigned)} سهمیه خالی` : '...'}
                </span>
              </div>

              <button
                disabled={loading}
                onClick={handleToggleNearlyFullSeats}
                className={`min-h-[38px] w-full px-3 py-1.5 rounded-tile border font-bold text-meta flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  seatSummary && seatSummary.unassigned <= 5
                    ? 'bg-danger text-white border-danger shadow-xs'
                    : 'bg-canvas hover:bg-sunken border-sunken text-ink'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>
                  {seatSummary && seatSummary.unassigned <= 5
                    ? 'فعال: سهمیه تقریباً پر (۲ سهمیه) - بازگردانی'
                    : 'شبیه‌سازی سهمیه پر (کاهش به ۲ سهمیه)'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
