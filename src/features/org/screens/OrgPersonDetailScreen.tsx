import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronRight,
  Printer,
  CheckCircle2,
  Clock,
  Flame,
  Award,
  Briefcase,
  Phone,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { orgApi } from '../../../api/org/client';
import { OrgMember, OrgRole } from '../../../types/org';
import { toFa } from '../../../lib/format';
import { Avatar } from '../../../components/ui/Avatar';
import { useOrgScope } from '../context/ScopeContext';
import { useApp } from '../../../state/AppContext';
import { formatJalaliDate } from '../../../lib/jalali';
import { maskPhone } from '../../../lib/privacy';

export const OrgPersonDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { canManageAllUnits, currentOrg } = useOrgScope();
  const { showToast } = useApp();

  const [member, setMember] = useState<OrgMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    orgApi.getMemberById(id).then((data) => {
      setMember(data);
      setLoading(false);
    });
  }, [id]);

  const handleRoleChange = async (newRole: OrgRole) => {
    if (!member) return;
    try {
      const updated = await orgApi.updateMemberRole(member.id, newRole);
      setMember(updated);
      showToast(
        `نقش کاربری به «${newRole === 'org_admin' ? 'مدیر ارشد' : newRole === 'unit_manager' ? 'مدیر واحد' : 'یادگیرنده'}» تغییر یافت.`,
        'success'
      );
    } catch {
      showToast('خطا در تغییر نقش کاربر', 'error');
    }
  };

  const handleStatusChange = async (newStatus: 'active' | 'inactive' | 'at_risk') => {
    if (!member) return;
    try {
      const updated = await orgApi.updateMemberStatus(member.id, newStatus);
      setMember(updated);
      showToast('وضعیت فعالیت همکار به‌روزرسانی شد.', 'success');
    } catch {
      showToast('خطا در تغییر وضعیت', 'error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="p-8 text-center bg-surface rounded-tile border border-sunken">
        <h3 className="text-title font-black text-ink mb-2">همکار مورد نظر یافت نشد</h3>
        <p className="text-body text-ink/70 mb-4">
          ممکن است شناسه پرسنلی تغییر کرده یا حذف شده باشد.
        </p>
        <Link
          to="/org/people"
          className="min-h-[48px] px-5 py-2.5 rounded-tile bg-primary text-white text-meta font-bold inline-flex items-center gap-2"
        >
          <span>بازگشت به فهرست همکاران</span>
        </Link>
      </div>
    );
  }

  // Per-domain mastery, shown as bars
  const domainScores = [
    { domain: 'شایستگی‌های فردی', score: member.domainMastery['domain-1'] || 75 },
    { domain: 'خانواده و تعادل', score: member.domainMastery['domain-2'] || 70 },
    { domain: 'اخلاق حرفه‌ای', score: member.domainMastery['domain-3'] || 85 },
    { domain: 'توسعه فردی', score: member.domainMastery['domain-4'] || 80 },
    { domain: 'فرهنگ ایمنی', score: member.domainMastery['domain-5'] || 90 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Print Action (hidden in print) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-meta text-ink/60">
          <Link to="/org/people" className="hover:text-ink font-bold flex items-center gap-1">
            <span>همکاران</span>
          </Link>
          <ChevronRight className="w-4 h-4 rotate-180" />
          <span className="text-ink font-bold">{member.fullName}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="min-h-[48px] px-4 py-2.5 rounded-tile bg-surface hover:bg-canvas border border-sunken text-ink text-meta font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4 text-primary" aria-hidden="true" />
            <span>چاپ کارنامه رسمی (PDF)</span>
          </button>
        </div>
      </div>

      {/* Printable Official Header (visible only in print) */}
      <div className="hidden print:block border-b-2 border-ink pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-headline font-black text-ink">
              سامانه ارزیابی و آموزش پیوسته سازمانی گرابایت
            </h1>
            <p className="text-meta text-ink/70">کارنامه رسمی پیشرفت و انطباق شایستگی‌های شغلی</p>
          </div>
          <div className="text-left text-meta text-ink/80 space-y-1">
            <div>سازمان: {currentOrg.name}</div>
            <div>تاریخ صدور گزارش: {formatJalaliDate(new Date())}</div>
            <div>شناسه یکتای استعلام: GB-REP-{member.id}</div>
          </div>
        </div>
        <p className="text-meta text-ink/70 pt-2">
          این گزارش فقط مسیرهای تخصیصی سازمان را شامل می‌شود.
        </p>
      </div>

      {/* Scope of this report, on screen as well as in print */}
      <p className="print:hidden text-meta text-ink/70 p-3 rounded-tile bg-canvas border border-sunken">
        این گزارش فقط مسیرهای تخصیصی سازمان را شامل می‌شود.
      </p>

      {/* Member Profile Overview Card */}
      <div className="p-6 rounded-tile bg-surface border border-sunken shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 print:border print:p-4">
        <div className="flex items-center gap-4">
          <Avatar seed={member.avatarSeed} name={member.fullName} size="lg" />
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-headline font-black text-ink">{member.fullName}</h2>
              <span className="text-meta px-2.5 py-0.5 rounded-pill bg-canvas border border-sunken font-bold text-ink">
                سطح {toFa(member.level)}
              </span>
              <span
                className={`text-meta px-2.5 py-0.5 rounded-pill font-bold ${
                  member.status === 'active'
                    ? 'bg-domain-3-tint text-secondary'
                    : member.status === 'at_risk'
                      ? 'bg-domain-5-tint text-domain-5'
                      : 'bg-canvas text-ink/60 border border-sunken'
                }`}
              >
                {member.status === 'active'
                  ? 'فعال'
                  : member.status === 'at_risk'
                    ? 'نیازمند همراهی'
                    : 'غیرفعال'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-meta text-ink/70">
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-ink/40" />
                <span>{member.unitName}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-ink/40" />
                <span dir="ltr">{maskPhone(member.phone)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Status & Role Controls (hidden in print) */}
        {canManageAllUnits && (
          <div className="print:hidden flex flex-wrap items-center gap-3 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-sunken">
            <div className="flex flex-col gap-1">
              <span className="text-meta font-bold text-ink/60">نقش در سامانه:</span>
              <select
                value={member.role}
                onChange={(e) => handleRoleChange(e.target.value as OrgRole)}
                className="min-h-[44px] px-3 py-1.5 text-meta font-bold bg-canvas rounded-tile border border-sunken focus:outline-none focus:border-primary text-ink"
              >
                <option value="learner">یادگیرنده سازمانی</option>
                <option value="unit_manager">مدیر واحد</option>
                <option value="org_admin">مدیر ارشد سازمان</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-meta font-bold text-ink/60">وضعیت فعالیت:</span>
              <select
                value={member.status}
                onChange={(e) => handleStatusChange(e.target.value as OrgMember['status'])}
                className="min-h-[44px] px-3 py-1.5 text-meta font-bold bg-canvas rounded-tile border border-sunken focus:outline-none focus:border-primary text-ink"
              >
                <option value="active">فعال و پویا</option>
                <option value="at_risk">نیازمند توجه</option>
                <option value="inactive">غیرفعال</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards for Employee */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:grid-cols-4">
        <div className="p-4 rounded-tile bg-surface border border-sunken shadow-xs">
          <span className="text-meta font-bold text-ink/60 flex items-center gap-1.5 mb-1">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span>نرخ انطباق مهارتی</span>
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-headline font-black text-primary">
              {toFa(member.complianceRate)}
            </span>
            <span className="text-meta font-bold text-ink/60">٪</span>
          </div>
          <p className="text-meta text-ink/50 mt-1">
            {toFa(member.completedLessonsCount)} از {toFa(member.totalAssignedLessons)} گرابایت
          </p>
        </div>

        <div className="p-4 rounded-tile bg-surface border border-sunken shadow-xs">
          <span className="text-meta font-bold text-ink/60 flex items-center gap-1.5 mb-1">
            <Flame className="w-4 h-4 text-domain-5" />
            <span>زنجیره پیوسته</span>
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-headline font-black text-ink">{toFa(member.streakDays)}</span>
            <span className="text-meta font-bold text-ink/60">روز متوالی</span>
          </div>
          <p className="text-meta text-ink/50 mt-1">مطالعه روزانه پیوسته</p>
        </div>

        <div className="p-4 rounded-tile bg-surface border border-sunken shadow-xs">
          <span className="text-meta font-bold text-ink/60 flex items-center gap-1.5 mb-1">
            <Award className="w-4 h-4 text-danger" />
            <span>گواهینامه‌های رسمی</span>
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-headline font-black text-ink">
              {toFa(member.certificatesCount)}
            </span>
            <span className="text-meta font-bold text-ink/60">گواهینامه</span>
          </div>
          <p className="text-meta text-ink/50 mt-1">دارای کد اعتبارسنجی</p>
        </div>

        <div className="p-4 rounded-tile bg-surface border border-sunken shadow-xs">
          <span className="text-meta font-bold text-ink/60 flex items-center gap-1.5 mb-1">
            <Clock className="w-4 h-4 text-secondary" />
            <span>مجموع امتیاز (XP)</span>
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-headline font-black text-ink">{toFa(member.xpTotal)}</span>
            <span className="text-meta font-bold text-ink/60">امتیاز</span>
          </div>
          <p className="text-meta text-ink/50 mt-1">
            آخرین فعالیت: {formatJalaliDate(member.lastActiveAt)}
          </p>
        </div>
      </div>

      {/* Domain Mastery — the bars carry this data on their own now */}
      <div className="grid grid-cols-1 gap-6">
        {/* Detailed Domain Mastery List */}
        <div className="p-6 rounded-tile bg-surface border border-sunken shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-headline font-black text-ink mb-1">تفکیک نمرات ارزیابی حوزه‌ها</h3>
            <p className="text-meta text-ink/60 mb-4">عملکرد فردی در برابر استانداردهای سازمان</p>

            <div className="space-y-4">
              {domainScores.map((d, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-meta font-bold">
                    <span className="text-ink">{d.domain}</span>
                    <span className="text-primary">{toFa(d.score)}٪</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-sunken overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${d.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-sunken flex items-center justify-between text-meta text-ink/70">
            <span>میانگین شایستگی سازمانی:</span>
            <span className="font-bold text-ink">
              {toFa(
                Math.round(
                  domainScores.reduce((acc, curr) => acc + curr.score, 0) / domainScores.length
                )
              )}
              ٪
            </span>
          </div>
        </div>
      </div>

      {/* Official Stamp & Signatures Box (visible in print) */}
      <div className="hidden print:block pt-8 mt-8 border-t border-sunken">
        <div className="grid grid-cols-3 gap-8 text-center text-meta">
          <div className="space-y-8">
            <div className="font-bold text-ink">مهر و امضای سرپرست مستقیم</div>
            <div className="h-16 border-b border-dashed border-ink/40" />
          </div>
          <div className="space-y-8">
            <div className="font-bold text-ink">مدیریت آموزش و توسعه سرمایه انسانی</div>
            <div className="h-16 border-b border-dashed border-ink/40" />
          </div>
          <div className="flex flex-col items-center justify-center space-y-2">
            <QRCodeSVG value={`https://gerabyte.ir/verify/${member.id}`} size={64} />
            <span className="text-meta text-ink/60">بارکد استعلام اعتبار کارنامه</span>
          </div>
        </div>
      </div>
    </div>
  );
};
