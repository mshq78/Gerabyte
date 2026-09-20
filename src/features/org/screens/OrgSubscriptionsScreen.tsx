import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Clock,
  Calendar,
  AlertTriangle,
  Send,
  CheckCircle2,
  TrendingUp,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import {
  subscriptionsApi,
  ExpiringMemberItem,
  MonthlySponsorshipDistribution,
} from '../../../api/org/subscriptions';
import { SeatSummary, OrgRenewalRequest } from '../../../types/org';
import { useOrgScope } from '../context/ScopeContext';
import { toFa } from '../../../lib/format';
import { errorMessage } from '../../../lib/errors';

export const OrgSubscriptionsScreen: React.FC = () => {
  const { userRole } = useOrgScope();
  const [summary, setSummary] = useState<SeatSummary | null>(null);
  const [distribution, setDistribution] = useState<MonthlySponsorshipDistribution[]>([]);
  const [expiringMembers, setExpiringMembers] = useState<ExpiringMemberItem[]>([]);
  const [renewalRequests, setRenewalRequests] = useState<OrgRenewalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state for new renewal request
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [renewalSeats, setRenewalSeats] = useState<number>(500);
  const [renewalDuration, setRenewalDuration] = useState<number>(6);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sum, dist, exp, ren] = await Promise.all([
        subscriptionsApi.getSummary(),
        subscriptionsApi.getMonthlyDistribution(),
        subscriptionsApi.getExpiringMembers(),
        subscriptionsApi.getRenewalRequests(),
      ]);
      setSummary(sum);
      setDistribution(dist);
      setExpiringMembers(exp);
      setRenewalRequests(ren);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (userRole === 'unit_manager') {
    return (
      <div className="p-8 text-center space-y-4 max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-full bg-domain-2-tint text-danger flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-title font-black text-ink">دسترسی محدود به مدیر کل سازمان</h2>
        <p className="text-body text-ink/70">
          مشاهده اطلاعات مالی، سهمیه‌ها و صدور درخواست تمدید اشتراک‌های سازمانی تنها در اختیار مدیر
          کل سازمان است.
        </p>
      </div>
    );
  }

  const handleSendReminder = async (memberId: string) => {
    try {
      const res = await subscriptionsApi.sendRenewalReminder(memberId);
      setActionNotice(res.message);
      loadData();
    } catch (err) {
      setActionNotice(errorMessage(err) || 'خطای نامشخص رخ داد.');
    }
  };

  const handleCreateRenewalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await subscriptionsApi.createRenewalRequest({
        seatsCount: renewalSeats,
        durationMonths: renewalDuration,
        requestedByName: 'مهندس محمدرضا صادقی',
      });
      setShowRenewalModal(false);
      setActionNotice('درخواست تمدید سازمانی با موفقیت ثبت گردید و برای واحد فروش گرا ارسال شد.');
      loadData();
    } catch (err) {
      setActionNotice(errorMessage(err) || 'خطای نامشخص رخ داد.');
    }
  };

  if (loading || !summary) {
    return (
      <div className="text-center py-20 text-ink/60 font-bold text-body">
        در حال بارگذاری وضعیت اشتراک‌ها...
      </div>
    );
  }

  // Calculate stacked byte row percentages
  const total = summary.purchased || 5000;
  const pctActive = Math.round((summary.sponsoredActive / total) * 100);
  const pctExp14 = Math.round((summary.expiring14d / total) * 100);
  const pctConverted = Math.round((summary.convertedPersonal / total) * 100);
  const pctUnassigned = Math.max(1, 100 - (pctActive + pctExp14 + pctConverted));

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 text-ink">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sunken pb-4">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-primary" />
            <h1 className="text-display font-black text-ink">
              مدیریت سهمیه‌ها و اشتراک‌های سازمانی
            </h1>
          </div>
          <p className="text-body text-ink/70 mt-1">
            پایش وضعیت سهمیه‌های فعال، پیش‌بینی تاریخ‌های انقضا، نرخ وفاداری و تمدید شخصی کارکنان
          </p>
        </div>

        <button
          onClick={() => setShowRenewalModal(true)}
          className="min-h-[48px] px-5 py-2.5 rounded-tile bg-primary hover:bg-primary-hover text-white text-meta font-black flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>درخواست تمدید یا افزایش سهمیه</span>
        </button>
      </div>

      {actionNotice && (
        <div className="p-3.5 rounded-tile bg-domain-3-tint border border-success/30 text-success text-meta font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* 1. Stacked Byte Row */}
      <div className="p-6 rounded-sheet bg-surface border border-sunken shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-title font-black text-ink">توزیع سهمیه‌های ۵،۰۰۰ نفری مجتمع</h2>
          <span className="text-meta text-ink/70 font-mono">
            کل سهمیه خریداری‌شده: <strong>{toFa(summary.purchased)} کاربر</strong>
          </span>
        </div>

        {/* The Stacked Bar */}
        <div className="w-full h-8 rounded-tile overflow-hidden flex shadow-inner bg-sunken">
          <div
            style={{ width: `${pctActive}%` }}
            className="bg-primary hover:opacity-90 transition-all flex items-center justify-center text-white text-meta font-black truncate px-1"
            title={`اشتراک‌های فعال و پایدار: ${toFa(summary.sponsoredActive)}`}
          >
            {toFa(summary.sponsoredActive)} فعال
          </div>
          <div
            style={{ width: `${pctExp14}%` }}
            className="bg-coin hover:opacity-90 transition-all flex items-center justify-center text-ink text-meta font-black truncate px-1"
            title={`انقضا در ۱۴ روز آینده: ${toFa(summary.expiring14d)}`}
          >
            {toFa(summary.expiring14d)}
          </div>
          <div
            style={{ width: `${pctConverted}%` }}
            className="bg-success hover:opacity-90 transition-all flex items-center justify-center text-white text-meta font-black truncate px-1"
            title={`تمدید شخصی پس از پایان سازمان: ${toFa(summary.convertedPersonal)}`}
          >
            {toFa(summary.convertedPersonal)}
          </div>
          <div
            style={{ width: `${pctUnassigned}%` }}
            className="bg-paper hover:opacity-90 transition-all flex items-center justify-center text-ink/70 text-meta font-bold truncate px-1 border-r border-sunken"
            title={`سهمیه‌های آزاد و تخصیص‌نیافته: ${toFa(summary.unassigned)}`}
          >
            {toFa(summary.unassigned)} خالی
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-meta font-bold">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-primary" />
            <span>اشتراک‌های فعال سازمانی ({toFa(summary.sponsoredActive)})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-coin" />
            <span>انقضا در ۱۴ روز آینده ({toFa(summary.expiring14d)})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-success" />
            <span>تبدیل به اشتراک شخصی ({toFa(summary.convertedPersonal)})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-paper border border-sunken" />
            <span>سهمیه‌های آزاد جهت تخصیص ({toFa(summary.unassigned)})</span>
          </div>
        </div>
      </div>

      {/* 2. Conversion Insight & Monthly Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Conversion Insight Card */}
        <div className="p-6 rounded-sheet bg-domain-3-tint/30 border border-success/30 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-success">
              <TrendingUp className="w-6 h-6" />
              <h3 className="text-title font-black text-ink">شاخص وفاداری و تمدید شخصی</h3>
            </div>
            <p className="text-meta text-ink/80 leading-relaxed">
              ارزیابی علاقه واقعی همکاران به یادگیری، فراتر از الزامات اداری:
            </p>
            <div className="p-4 rounded-tile bg-surface border border-success/30 text-center space-y-1">
              <div className="text-display font-black text-success">۳۸.۴٪</div>
              <span className="text-meta text-ink/70 font-bold">نرخ تمدید خودجوش پرسنل</span>
            </div>
            <div className="text-body text-ink/90 font-bold leading-relaxed">
              «از ۵۰۰ نفری که اشتراک سازمانی‌شان تمام شد،{' '}
              <strong className="text-success">{toFa(summary.convertedPersonal)} نفر</strong> خودشان
              به‌صورت شخصی تمدید کردند.»
            </div>
          </div>
          <p className="text-meta text-ink/50 pt-2 border-t border-success/20">
            * بر اساس موازین حفظ حریم خصوصی، صرفاً آمار تجمعی گزارش شده و اسامی اشخاص منتشر نمی‌شود.
          </p>
        </div>

        {/* Monthly Distribution Table & Visuals */}
        <div className="md:col-span-2 p-6 rounded-sheet bg-surface border border-sunken shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-title font-black text-ink flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <span>پیش‌بینی موعد انقضای اشتراک‌ها برحسب ماه</span>
            </h3>
            <span className="text-meta text-ink/60 font-mono">سال ۱۴۰۳</span>
          </div>

          <div className="space-y-3">
            {distribution.map((dist, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-meta font-bold">
                  <span className="text-ink">{dist.monthName}</span>
                  <span className="text-primary font-mono">
                    {toFa(dist.count)} نفر ({toFa(dist.percentage)}٪)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-sunken overflow-hidden">
                  <div
                    className="h-full bg-primary/80 rounded-full"
                    style={{ width: `${dist.percentage * 3.5}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Expiring Members List & Actions */}
      <div className="p-6 rounded-sheet bg-surface border border-sunken shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-title font-black text-ink flex items-center gap-2">
              <Clock className="w-5 h-5 text-coin" />
              <span>همکاران در آستانه انقضای اشتراک (کمتر از ۱۴ روز)</span>
            </h3>
            <p className="text-meta text-ink/60 mt-0.5">
              امکان ارسال پیامک یادآوری تمدید سازمانی با رعایت سقف مجاز (حداکثر ۱ بار در روز برای هر
              فرد)
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-tile border border-sunken">
          <table className="w-full text-right text-meta">
            <thead className="bg-canvas border-b border-sunken text-ink/70">
              <tr>
                <th className="p-3">نام و نام خانوادگی</th>
                <th className="p-3">واحد سازمانی</th>
                <th className="p-3">رده</th>
                <th className="p-3">روزهای باقیمانده</th>
                <th className="p-3">تاریخ انقضا</th>
                <th className="p-3">وضعیت یادآوری امروز</th>
                <th className="p-3">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sunken">
              {expiringMembers.map((member) => (
                <tr key={member.id} className="hover:bg-canvas">
                  <td className="p-3 font-bold text-ink">{member.fullName}</td>
                  <td className="p-3 text-ink/80">{member.unitName}</td>
                  <td className="p-3 text-ink/70">{member.rank}</td>
                  <td className="p-3">
                    <span className="font-mono font-black text-danger px-2 py-0.5 rounded-pill bg-domain-2-tint">
                      {toFa(member.daysRemaining)} روز
                    </span>
                  </td>
                  <td className="p-3 font-mono text-ink/70">{toFa(member.sponsorshipEndsAt)}</td>
                  <td className="p-3">
                    {member.remindersCountToday >= 1 ? (
                      <span className="text-meta text-success font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> ارسال شده (
                        {member.lastReminderSentAt || 'امروز'})
                      </span>
                    ) : (
                      <span className="text-meta text-ink/50">ارسال نشده</span>
                    )}
                  </td>
                  <td className="p-3">
                    <button
                      disabled={member.remindersCountToday >= 1}
                      onClick={() => handleSendReminder(member.id)}
                      className="min-h-[36px] px-3 py-1 rounded-tile bg-surface hover:bg-canvas border border-sunken text-primary text-meta font-bold flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
                      title={
                        member.remindersCountToday >= 1
                          ? 'سقف ارسال روزانه پر شده است'
                          : 'ارسال پیامک یادآوری تمدید سازمانی'
                      }
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>ارسال یادآوری</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Renewal Requests History */}
      <div className="p-6 rounded-sheet bg-surface border border-sunken shadow-xs space-y-4">
        <h3 className="text-title font-black text-ink">سوابق درخواست‌های تمدید سازمانی</h3>

        <div className="overflow-x-auto rounded-tile border border-sunken">
          <table className="w-full text-right text-meta">
            <thead className="bg-canvas border-b border-sunken text-ink/70">
              <tr>
                <th className="p-3">شناسه</th>
                <th className="p-3">تاریخ ثبت</th>
                <th className="p-3">تعداد سهمیه</th>
                <th className="p-3">مدت زمان</th>
                <th className="p-3">ثبت‌کننده</th>
                <th className="p-3">وضعیت پیگیری</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sunken">
              {renewalRequests.map((req) => (
                <tr key={req.id} className="hover:bg-canvas">
                  <td className="p-3 font-mono font-bold text-ink">{req.id}</td>
                  <td className="p-3 font-mono">{toFa(req.requestedAt)}</td>
                  <td className="p-3 font-mono text-primary font-bold">
                    {toFa(req.seatsCount)} سهمیه
                  </td>
                  <td className="p-3">{toFa(req.durationMonths)} ماهه</td>
                  <td className="p-3 text-ink/80">{req.requestedByName}</td>
                  <td className="p-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-pill text-meta font-bold ${
                        req.status === 'approved'
                          ? 'bg-domain-3-tint text-success'
                          : req.status === 'invoiced'
                            ? 'bg-domain-1-tint text-primary'
                            : 'bg-domain-5-tint text-coin'
                      }`}
                    >
                      {req.status === 'approved'
                        ? 'تأیید و فعال‌شده'
                        : req.status === 'invoiced'
                          ? 'پیش‌فاکتور صادرشده'
                          : 'در حال بررسی توسط گرا'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Renewal Request Modal Dialog */}
      {showRenewalModal && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg p-6 rounded-sheet bg-surface border border-sunken shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-sunken pb-3">
              <h3 className="text-title font-black text-ink">ثبت درخواست تمدید سازمانی</h3>
              <button
                onClick={() => setShowRenewalModal(false)}
                className="text-ink/60 hover:text-ink text-body font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRenewalRequest} className="space-y-4">
              <div>
                <label
                  htmlFor="org-subscriptions-f1"
                  className="block text-meta font-bold text-ink mb-1.5"
                >
                  تعداد سهمیه مورد نیاز:
                </label>
                <select
                  id="org-subscriptions-f1"
                  value={renewalSeats}
                  onChange={(e) => setRenewalSeats(Number(e.target.value))}
                  className="min-h-[48px] w-full px-4 rounded-tile bg-canvas border border-sunken text-body font-bold text-ink focus:outline-none focus:border-primary"
                >
                  <option value={200}>۲۰۰ سهمیه</option>
                  <option value={500}>۵۰۰ سهمیه (پیشنهاد دوره‌ای)</option>
                  <option value={1000}>۱،۰۰۰ سهمیه</option>
                  <option value={2500}>۲،۵۰۰ سهمیه</option>
                  <option value={5000}>۵،۰۰۰ سهمیه (کل سازمان)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="org-subscriptions-f2"
                  className="block text-meta font-bold text-ink mb-1.5"
                >
                  مدت زمان تمدید:
                </label>
                <select
                  id="org-subscriptions-f2"
                  value={renewalDuration}
                  onChange={(e) => setRenewalDuration(Number(e.target.value))}
                  className="min-h-[48px] w-full px-4 rounded-tile bg-canvas border border-sunken text-body font-bold text-ink focus:outline-none focus:border-primary"
                >
                  <option value={3}>۳ ماهه</option>
                  <option value={6}>۶ ماهه</option>
                  <option value={12}>۱۲ ماهه (یک ساله با تخفیف سازمانی)</option>
                </select>
              </div>

              <div className="p-3.5 rounded-tile bg-paper border border-sunken text-meta text-ink/80 flex items-start gap-2">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>
                  پس از ثبت، کارشناس سازمانی گرا ظرف ۲ ساعت کاری جهت هماهنگی و صدور پیش‌فاکتور با
                  شما تماس خواهد گرفت.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-sunken">
                <button
                  type="button"
                  onClick={() => setShowRenewalModal(false)}
                  className="min-h-[44px] px-4 rounded-tile bg-canvas hover:bg-sunken border border-sunken text-ink text-meta font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-6 rounded-tile bg-primary hover:bg-primary-hover text-white text-meta font-black shadow-xs cursor-pointer"
                >
                  ارسال درخواست به گرا
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
