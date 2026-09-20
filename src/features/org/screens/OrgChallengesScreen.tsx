import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Plus,
  Search,
  Calendar,
  Award,
  AlertCircle,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';
import { challengeRequestsApi } from '../../../api/org/challengeRequests';
import { ChallengeRequest, ChallengeRequestStatus } from '../../../types/org';
import { useOrgScope } from '../context/ScopeContext';
import { toFa } from '../../../lib/format';

const STATUS_LABELS: Record<
  ChallengeRequestStatus | 'all',
  { label: string; bg: string; text: string; border: string }
> = {
  all: { label: 'همه وضعیت‌ها', bg: 'bg-canvas', text: 'text-ink', border: 'border-sunken' },
  draft: { label: 'پیش‌نویس', bg: 'bg-paper', text: 'text-ink/70', border: 'border-sunken' },
  submitted: {
    label: 'ارسال‌شده',
    bg: 'bg-domain-1-tint',
    text: 'text-primary',
    border: 'border-primary/30',
  },
  in_review: {
    label: 'در بررسی گرا',
    bg: 'bg-domain-4-tint',
    text: 'text-domain-4',
    border: 'border-domain-4/30',
  },
  needs_changes: {
    label: 'نیاز به اصلاح',
    bg: 'bg-domain-5-tint',
    text: 'text-coin',
    border: 'border-coin/40',
  },
  approved: {
    label: 'تأیید شده',
    bg: 'bg-domain-3-tint',
    text: 'text-success',
    border: 'border-success/30',
  },
  rejected: {
    label: 'رد شده',
    bg: 'bg-domain-2-tint',
    text: 'text-danger',
    border: 'border-danger/30',
  },
  active: {
    label: 'در حال برگزاری (فعال)',
    bg: 'bg-domain-3-tint',
    text: 'text-success',
    border: 'border-success/40',
  },
  ended: { label: 'پایان‌یافته', bg: 'bg-sunken', text: 'text-ink/60', border: 'border-sunken' },
};

export const OrgChallengesScreen: React.FC = () => {
  const { userRole } = useOrgScope();
  const [requests, setRequests] = useState<ChallengeRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<ChallengeRequestStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const list = await challengeRequestsApi.list({
        status: statusFilter,
        role: userRole,
        managerName: userRole === 'unit_manager' ? 'علیرضا رضایی' : undefined,
      });
      setRequests(list);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, userRole]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredRequests = requests.filter((r) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.objective.toLowerCase().includes(q) ||
      r.requestedByName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 text-ink">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sunken pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-7 h-7 text-coin" />
            <h1 className="text-display font-black text-ink">چالش‌های سازمانی</h1>
          </div>
          <p className="text-body text-ink/70 mt-1">
            تعریف و پیشنهاد رویدادها و ماراتن‌های رقابتی مهارتی برای پرسنل؛ با تأمین و نظارت جوایز
            توسط گرا
          </p>
        </div>

        <Link
          to="/org/challenges/new"
          className="min-h-[48px] px-5 py-2.5 rounded-tile bg-primary hover:bg-primary-hover text-white text-meta font-black flex items-center justify-center gap-2 transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>درخواست چالش جدید</span>
        </Link>
      </div>

      {/* Info Card: Gera Prize Policy */}
      <div className="p-4 rounded-sheet bg-domain-1-tint/50 border border-primary/20 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="text-meta text-ink/90 leading-relaxed">
          <strong>سازوکار جوایز و داوری گرا:</strong> مدیران سازمان اهداف و مأموریت‌های چالش را بر
          اساس نیازهای عملیاتی پیشنهاد می‌دهند. تیم آموزشی گرا درخواست را ارزیابی کرده و{' '}
          <strong>جوایز فیزیکی یا معنوی نهایی را رأساً تأمین و تضمین می‌نماید</strong> تا حداکثر
          اشتیاق سازمانی ایجاد گردد.
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {(
            [
              'all',
              'active',
              'in_review',
              'submitted',
              'needs_changes',
              'approved',
              'ended',
              'draft',
            ] as (ChallengeRequestStatus | 'all')[]
          ).map((s) => {
            const config = STATUS_LABELS[s];
            const isSelected = statusFilter === s;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-pill text-meta font-bold whitespace-nowrap transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-surface text-ink/70 hover:bg-canvas border-sunken'
                }`}
              >
                {config.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute right-3 top-3 text-ink/40" />
          <input
            type="text"
            placeholder="جستجوی عنوان یا درخواست‌دهنده..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-h-[44px] w-full pl-3 pr-9 py-2 rounded-tile bg-surface border border-sunken text-meta font-bold text-ink focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Challenges List Grid */}
      {loading ? (
        <div className="text-center py-16 text-ink/60 font-bold text-body">
          در حال بارگذاری چالش‌ها...
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-16 p-6 rounded-sheet bg-surface border border-sunken space-y-3">
          <Trophy className="w-12 h-12 text-ink/30 mx-auto" />
          <h3 className="text-title font-black text-ink">چالشی با این مشخصات یافت نشد</h3>
          <p className="text-meta text-ink/60">
            می‌توانید با فیلتر دیگری جستجو کنید یا چالش جدیدی ثبت نمایید.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRequests.map((req) => {
            const statusConfig = STATUS_LABELS[req.status];
            const targetLabel =
              req.target === 'all' ? 'کل سازمان' : req.target.unitName || 'واحد مشخص';

            return (
              <div
                key={req.id}
                className="p-5 rounded-sheet bg-surface border border-sunken hover:border-primary/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                {/* Card Header */}
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-meta font-black px-2.5 py-1 rounded-pill border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                    >
                      {statusConfig.label}
                    </span>
                    <span className="text-meta text-ink/60 flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {toFa(req.startsAt)} تا {toFa(req.endsAt)}
                      </span>
                    </span>
                  </div>

                  <h3 className="text-title font-black text-ink line-clamp-1">{req.title}</h3>
                  <p className="text-meta text-ink/70 line-clamp-2 leading-relaxed">
                    {req.objective}
                  </p>
                </div>

                {/* Metrics & Scope */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-tile bg-paper border border-sunken text-meta">
                  <div>
                    <span className="text-ink/50 text-meta block">مخاطبان:</span>
                    <strong className="text-ink truncate block">{targetLabel}</strong>
                  </div>
                  <div>
                    <span className="text-ink/50 text-meta block">تارگت هدف:</span>
                    <strong className="text-primary block">
                      {req.goal.type === 'xp'
                        ? `${toFa(req.goal.target)} امتیاز`
                        : req.goal.type === 'lessons'
                          ? `${toFa(req.goal.target)} گرابایت`
                          : `${toFa(req.goal.target)} روز زنجیره`}
                    </strong>
                  </div>
                  <div>
                    <span className="text-ink/50 text-meta block">مشارکت‌کنندگان:</span>
                    <strong className="text-ink block">
                      {req.live
                        ? `${toFa(req.live.joined)} نفر`
                        : `${toFa(req.estimatedParticipants)} نفر (تخمین)`}
                    </strong>
                  </div>
                </div>

                {/* Prize & Gera Note */}
                <div className="text-meta space-y-1">
                  <div className="flex items-center gap-1.5 text-coin font-bold">
                    <Award className="w-4 h-4 shrink-0" />
                    <span className="truncate">
                      {req.approvedPrize
                        ? `جایزه مصوب گرا: ${req.approvedPrize.title}`
                        : `پیشنهاد جایزه: ${req.suggestedPrize || 'تعیین نشده'}`}
                    </span>
                  </div>

                  {req.timeline.length > 0 && req.timeline[req.timeline.length - 1].comment && (
                    <div className="p-2 rounded-tile bg-canvas border border-sunken text-meta text-ink/80 flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span className="line-clamp-1">
                        {req.timeline[req.timeline.length - 1].comment}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="pt-2 border-t border-sunken flex items-center justify-between">
                  <span className="text-meta text-ink/60">
                    ثبت توسط: <strong>{req.requestedByName}</strong>
                  </span>

                  <Link
                    to={`/org/challenges/${req.id}`}
                    className="min-h-[44px] px-4 py-2 rounded-tile bg-canvas hover:bg-sunken border border-sunken text-primary font-bold text-meta flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>مشاهده و پیگیری</span>
                    <ChevronLeft className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Demo Panel for review */}
    </div>
  );
};
