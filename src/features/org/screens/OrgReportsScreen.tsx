import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Printer,
  TrendingUp,
  BarChart3,
  Award,
  AlertTriangle,
  Download,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { useOrgScope } from '../context/ScopeContext';
import { orgApi } from '../../../api/org/client';
import { OrgKpiSummary, OrgMember } from '../../../types/org';
import { toFa } from '../../../lib/format';
import { exportMembersToXlsx } from '../utils/export';

export const OrgReportsScreen: React.FC = () => {
  const { currentOrg, effectiveUnitId, units } = useOrgScope();
  const [kpis, setKpis] = useState<OrgKpiSummary | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      orgApi.getKpis(effectiveUnitId),
      orgApi.getMembers({ unitId: effectiveUnitId }),
    ]).then(([kpiData, memberData]) => {
      setKpis(kpiData);
      setMembers(memberData);
      setLoading(false);
    });
  }, [effectiveUnitId]);

  const handleExportAll = async () => {
    await exportMembersToXlsx(members, `گزارش_تحلیلی_جامع_${currentOrg.name}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading || !kpis) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const atRiskMembers = members.filter((m) => m.status === 'at_risk');

  return (
    <div className="space-y-8">
      {/* Top Banner (hidden in print) */}
      <div className="print:hidden p-6 rounded-tile bg-surface border border-sunken shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-title font-black text-ink">گزارش‌های تحلیلی و مدیریتی سازمان</h2>
          <p className="text-body text-ink/70 mt-1">
            ارزیابی اثربخشی آموزش‌ها، نرخ رشد شایستگی‌ها و وضعیت آمادگی سازمانی {currentOrg.name}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportAll}
            className="min-h-[48px] px-4 py-2.5 rounded-tile bg-canvas hover:bg-sunken border border-sunken text-ink text-meta font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-success" aria-hidden="true" />
            <span>خروجی جامع اکسل</span>
          </button>

          <button
            onClick={handlePrint}
            className="min-h-[48px] px-4 py-2.5 rounded-tile bg-primary hover:bg-primary/90 text-white text-meta font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" aria-hidden="true" />
            <span>چاپ گزارش مدیریتی (PDF)</span>
          </button>
        </div>
      </div>

      {/* Official Print Header */}
      <div className="hidden print:block border-b-2 border-ink pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-ink">
              گزارش رسمی تحلیلی آموزش و شایستگی‌های سازمان
            </h1>
            <p className="text-sm text-ink/70">سامانه یادگیری پیوسته گرابایت · {currentOrg.name}</p>
          </div>
          <div className="text-left text-xs text-ink/80 space-y-1">
            <div>تاریخ تنظیم گزارش: ۱۴۰۳/۰۷/۰۲</div>
            <div>جامعه آماری: {toFa(members.length)} نفر</div>
          </div>
        </div>
      </div>

      {/* High-Level Analytical Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 print:grid-cols-3">
        <div className="p-5 rounded-tile bg-surface border border-sunken shadow-xs">
          <span className="text-meta font-bold text-ink/60 flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span>میانگین نرخ انطباق کل</span>
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-display font-black text-primary">
              {toFa(kpis.complianceRate)}
            </span>
            <span className="text-meta font-bold text-ink/60">٪</span>
          </div>
          <p className="text-meta text-ink/60 mt-1">شاخص کلی فراگیری سرفصل‌های مصوب</p>
        </div>

        <div className="p-5 rounded-tile bg-surface border border-sunken shadow-xs">
          <span className="text-meta font-bold text-ink/60 flex items-center gap-1.5 mb-2">
            <TrendingUp className="w-4 h-4 text-success" />
            <span>شاخص تعامل فعال</span>
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-display font-black text-ink">
              {toFa(Math.round((kpis.activeThisWeek / kpis.totalMembers) * 100))}
            </span>
            <span className="text-meta font-bold text-ink/60">٪</span>
          </div>
          <p className="text-meta text-ink/60 mt-1">نسبت همکاران دارای فعالیت مستمر هفتگی</p>
        </div>

        <div className="p-5 rounded-tile bg-surface border border-sunken shadow-xs">
          <span className="text-meta font-bold text-ink/60 flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-4 h-4 text-danger" />
            <span>شاخص افت و ریزش یادگیری</span>
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-display font-black text-danger">
              {toFa(Math.round((kpis.atRiskLearnersCount / kpis.totalMembers) * 100))}
            </span>
            <span className="text-meta font-bold text-ink/60">٪</span>
          </div>
          <p className="text-meta text-ink/60 mt-1">
            {toFa(kpis.atRiskLearnersCount)} نفر نیازمند ارسال پیام یادآوری یا همراهی سرپرست
          </p>
        </div>
      </div>

      {/* Domain Coverage Bar Chart */}
      <div className="p-6 rounded-tile bg-surface border border-sunken shadow-xs">
        <h3 className="text-headline font-black text-ink mb-1">
          میانگین امتیازات آزمون‌ها در حوزه‌های ۵گانه
        </h3>
        <p className="text-meta text-ink/60 mb-6">
          تحلیل تسلط دانش تخصصی پرسنل بر اساس نتایج آزمون‌های چک‌پوینت
        </p>

        <div className="h-64 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={kpis.domainStats}
              margin={{ top: 10, right: 20, left: -10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E1D5" />
              <XAxis dataKey="domainTitle" tick={{ fill: '#0D3F6B', fontSize: 11 }} interval={0} />
              <YAxis domain={[0, 100]} tick={{ fill: '#0D3F6B', fontSize: 12 }} />
              <Tooltip
                formatter={(val: any) => [`${toFa(val)} از ۱۰۰`, 'میانگین نمره']}
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E8E1D5',
                  borderRadius: '12px',
                  fontFamily: 'Vazirmatn',
                  direction: 'rtl',
                }}
              />
              <Bar dataKey="avgScore" radius={[6, 6, 0, 0]}>
                {kpis.domainStats.map((entry, index) => (
                  <Cell key={`cell-domain-${index}`} fill={entry.colorToken} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* At-Risk Cohort Analysis Table */}
      {atRiskMembers.length > 0 && (
        <div className="p-6 rounded-tile bg-surface border border-sunken shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-headline font-black text-danger flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <span>تحلیل پرسنل نیازمند توجه و مداخله آموزشی</span>
              </h3>
              <p className="text-meta text-ink/60 mt-0.5">
                همکارانی که زنجیره یادگیری‌شان متوقف شده یا کمتر از ۵۰٪ سرفصل‌ها را پیش برده‌اند
              </p>
            </div>
            <span className="text-meta font-bold px-3 py-1 rounded-pill bg-domain-5-tint text-danger">
              {toFa(atRiskMembers.length)} نفر
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-sunken text-meta font-bold text-ink/60">
                  <th className="py-2.5 px-3">نام همکار</th>
                  <th className="py-2.5 px-3">واحد سازمانی</th>
                  <th className="py-2.5 px-3">سطح مهارت</th>
                  <th className="py-2.5 px-3">درصد انطباق</th>
                  <th className="py-2.5 px-3">آخرین فعالیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sunken text-body">
                {atRiskMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-canvas/50">
                    <td className="py-3 px-3 font-bold text-ink">{m.fullName}</td>
                    <td className="py-3 px-3 text-ink/70">{m.unitName}</td>
                    <td className="py-3 px-3 text-ink/80">سطح {toFa(m.level)}</td>
                    <td className="py-3 px-3 font-bold text-danger">{toFa(m.complianceRate)}٪</td>
                    <td className="py-3 px-3 text-ink/60">{m.lastActiveAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
