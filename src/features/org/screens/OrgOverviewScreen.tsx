import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  Clock,
  Flame,
  Award,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  ChevronLeft,
  FileSpreadsheet,
  PlusCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
} from 'recharts';
import { useOrgScope } from '../context/ScopeContext';
import { orgApi } from '../../../api/org/client';
import { OrgKpiSummary } from '../../../types/org';
import { toFa } from '../../../lib/format';
import { exportMembersToXlsx } from '../utils/export';
import { ChartFrame } from '../../../components/charts/ChartFrame';
import { RtlTooltip } from '../../../components/charts/RtlTooltip';
import {
  CHART_AXIS_TICK,
  CHART_COLORS,
  CHART_GRID_STROKE,
  faTick,
} from '../../../components/charts/chartTheme';

export const OrgOverviewScreen: React.FC = () => {
  const { currentOrg, userRole, effectiveUnitId, units } = useOrgScope();
  const [kpis, setKpis] = useState<OrgKpiSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    orgApi.getKpis(effectiveUnitId).then((data) => {
      setKpis(data);
      setLoading(false);
    });
  }, [effectiveUnitId]);

  const activeUnitName =
    effectiveUnitId === 'all'
      ? 'تمام سازمان'
      : units.find((u) => u.id === effectiveUnitId)?.name || 'واحد انتخابی';

  const handleQuickExport = async () => {
    const members = await orgApi.getMembers({ unitId: effectiveUnitId });
    await exportMembersToXlsx(members, `شاخص‌های_سازمانی_${currentOrg.name}.xlsx`);
  };

  if (loading || !kpis) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-body font-bold text-ink/70">در حال دریافت اطلاعات داشبورد سازمان...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner / Scope Header */}
      <div className="p-6 rounded-tile bg-surface border border-sunken shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-meta font-black text-primary px-2.5 py-0.5 rounded-pill bg-domain-1-tint">
              {currentOrg.name}
            </span>
            <span className="text-meta text-ink/60 font-medium">·</span>
            <span className="text-meta font-bold text-ink/80">{activeUnitName}</span>
          </div>
          <h2 className="text-title font-black text-ink">
            {userRole === 'unit_manager'
              ? 'سامانه نظارت بر پیشرفت واحد'
              : 'داشبورد جامع یادگیری و توسعه سازمانی'}
          </h2>
          <p className="text-body text-ink/70 mt-1">
            وضعیت لحظه‌ای یادگیری خرد (گرابایت)، انطباق مهارتی و شایستگی‌های شغلی همکاران
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleQuickExport}
            className="min-h-[48px] px-4 py-2.5 rounded-tile bg-canvas hover:bg-sunken border border-sunken text-ink text-meta font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-success" aria-hidden="true" />
            <span>خروجی اکسل</span>
          </button>

          <Link
            to="/org/assignments"
            className="min-h-[48px] px-5 py-2.5 rounded-tile bg-primary hover:bg-primary/90 text-white text-meta font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" aria-hidden="true" />
            <span>تخصیص مأموریت جدید</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid (6 metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* KPI 1 */}
        <div className="p-5 rounded-tile bg-surface border border-sunken shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink/70 mb-3">
            <span className="text-meta font-bold">نرخ انطباق مهارتی</span>
            <div className="w-8 h-8 rounded-pill bg-domain-1-tint text-primary flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-display font-black text-primary">
                {toFa(kpis.complianceRate)}
              </span>
              <span className="text-meta font-bold text-ink/60">٪</span>
            </div>
            <p className="text-meta text-ink/60 mt-1">از کل دروس برنامه‌ریزی‌شده</p>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-5 rounded-tile bg-surface border border-sunken shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink/70 mb-3">
            <span className="text-meta font-bold">فراگیران فعال هفته</span>
            <div className="w-8 h-8 rounded-pill bg-domain-3-tint text-secondary flex items-center justify-center">
              <Users className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-display font-black text-ink">{toFa(kpis.activeThisWeek)}</span>
              <span className="text-meta font-bold text-ink/60">
                از {toFa(kpis.totalMembers)} نفر
              </span>
            </div>
            <p className="text-meta text-success font-bold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {toFa(Math.round((kpis.activeThisWeek / kpis.totalMembers) * 100))}٪ مشارکت فعال
              </span>
            </p>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-5 rounded-tile bg-surface border border-sunken shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink/70 mb-3">
            <span className="text-meta font-bold">مطالعه روزانه</span>
            <div className="w-8 h-8 rounded-pill bg-domain-4-tint text-domain-4 flex items-center justify-center">
              <Clock className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-display font-black text-ink">{toFa(kpis.avgDailyMinutes)}</span>
              <span className="text-meta font-bold text-ink/60">دقیقه</span>
            </div>
            <p className="text-meta text-ink/60 mt-1">میانگین زمان آموزش هر نفر</p>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-5 rounded-tile bg-surface border border-sunken shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink/70 mb-3">
            <span className="text-meta font-bold">پیوستگی زنجیره</span>
            <div className="w-8 h-8 rounded-pill bg-domain-5-tint text-domain-5 flex items-center justify-center">
              <Flame className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-display font-black text-ink">{toFa(kpis.avgStreakDays)}</span>
              <span className="text-meta font-bold text-ink/60">روز متوالی</span>
            </div>
            <p className="text-meta text-ink/60 mt-1">عادت یادگیری پایدار روزانه</p>
          </div>
        </div>

        {/* KPI 5 */}
        <div className="p-5 rounded-tile bg-surface border border-sunken shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink/70 mb-3">
            <span className="text-meta font-bold">گواهینامه‌های رسمی</span>
            <div className="w-8 h-8 rounded-pill bg-domain-2-tint text-danger flex items-center justify-center">
              <Award className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-display font-black text-ink">
                {toFa(kpis.totalCertificatesEarned)}
              </span>
              <span className="text-meta font-bold text-ink/60">مدرک صادره</span>
            </div>
            <p className="text-meta text-ink/60 mt-1">با قابلیت استعلام دیجیتال QR</p>
          </div>
        </div>

        {/* KPI 6 */}
        <div className="p-5 rounded-tile bg-surface border border-sunken shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink/70 mb-3">
            <span className="text-meta font-bold">نیازمند پیگیری</span>
            <div className="w-8 h-8 rounded-pill bg-domain-5-tint text-danger flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-display font-black text-danger">
                {toFa(kpis.atRiskLearnersCount)}
              </span>
              <span className="text-meta font-bold text-ink/60">همکار</span>
            </div>
            <Link
              to="/org/people?status=at_risk"
              className="text-meta font-bold text-primary hover:underline mt-1 inline-flex items-center gap-1"
            >
              <span>مشاهده و ارسال یادآور</span>
              <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trend Chart */}
        <ChartFrame
          title="روند فعالیت هفتگی"
          subtitle="تعداد دروس تکمیل شده در طول ایام هفته"
          badge={
            <span className="text-meta font-bold px-3 py-1 rounded-pill bg-canvas border border-sunken text-ink/70">
              هفته جاری
            </span>
          }
          table={{
            columns: ['روز', 'دروس تکمیل‌شده', 'یادگیرندگان فعال'],
            rows: kpis.weeklyTrend.map((d) => [
              d.dayName,
              toFa(d.completedLessons),
              toFa(d.activeLearners),
            ]),
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={kpis.weeklyTrend}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_GRID_STROKE} />
              {/* Time runs right-to-left: the oldest day sits on the right. */}
              <XAxis dataKey="dayName" reversed tick={CHART_AXIS_TICK} />
              <YAxis orientation="right" tickFormatter={faTick} tick={CHART_AXIS_TICK} />
              <Tooltip
                cursor={{ stroke: CHART_GRID_STROKE }}
                content={
                  <RtlTooltip
                    seriesName="دروس تکمیل شده"
                    formatLabel={(label) => `روز ${label ?? ''}`}
                    formatValue={(value) => `${toFa(String(value ?? 0))} گرابایت`}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="completedLessons"
                stroke="var(--color-chart-1)"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorTrend)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartFrame>

        {/* 5 Domains Mastery Breakdown — horizontal bars, the titles are long */}
        <ChartFrame
          title="پیشرفت در ۵ حوزه شایستگی"
          subtitle="درصد اتمام سرفصل‌ها در حوزه‌های مهارتی گرابایت"
          table={{
            columns: ['حوزه شایستگی', 'نرخ انطباق', 'میانگین نمره'],
            rows: kpis.domainStats.map((d) => [
              d.domainTitle,
              `${toFa(d.completionRate)}٪`,
              toFa(d.avgScore),
            ]),
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={kpis.domainStats}
              layout="vertical"
              margin={{ top: 5, right: 16, left: 16, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={CHART_GRID_STROKE} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={faTick}
                tick={CHART_AXIS_TICK}
              />
              <YAxis
                type="category"
                dataKey="domainTitle"
                orientation="right"
                width={150}
                tick={{ ...CHART_AXIS_TICK, textAnchor: 'start' }}
              />
              <Tooltip
                cursor={{ fill: 'var(--color-canvas)' }}
                content={
                  <RtlTooltip
                    seriesName="نرخ انطباق"
                    formatValue={(value) => `${toFa(String(value ?? 0))}٪`}
                  />
                }
              />
              <Bar dataKey="completionRate" radius={[0, 6, 6, 0]}>
                {kpis.domainStats.map((entry, index) => (
                  <Cell key={entry.domainId} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
      </div>

      {/* Unit Ranking & Comparison Table */}
      <div className="p-6 rounded-tile bg-surface border border-sunken shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-headline font-black text-ink">
              رتبه‌بندی و پیشرفت واحدهای سازمانی
            </h3>
            <p className="text-meta text-ink/60">مقایسه مشارکت و انطباق مهارتی در بخش‌های مختلف</p>
          </div>

          <Link
            to="/org/people"
            className="text-meta font-bold text-primary hover:underline flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>مشاهده فهرست تمام پرسنل</span>
            <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-sunken text-meta font-bold text-ink/60">
                <th className="py-3 px-4">واحد سازمانی</th>
                <th className="py-3 px-4">تعداد همکاران</th>
                <th className="py-3 px-4">میانگین زنجیره</th>
                <th className="py-3 px-4">نرخ انطباق</th>
                <th className="py-3 px-4 text-center">وضعیت عملکرد</th>
                <th className="py-3 px-4 text-left">اقدام</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sunken text-body">
              {kpis.unitRankings.map((unit) => {
                const isHigh = unit.completionRate >= 85;
                const isMed = unit.completionRate >= 75 && unit.completionRate < 85;

                return (
                  <tr key={unit.unitId} className="hover:bg-canvas/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-ink">{unit.unitName}</td>
                    <td className="py-3.5 px-4 text-ink/80">{toFa(unit.memberCount)} نفر</td>
                    <td className="py-3.5 px-4 text-ink/80">{toFa(unit.avgStreak)} روز</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 rounded-full bg-sunken overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${unit.completionRate}%` }}
                          />
                        </div>
                        <span className="text-meta font-bold text-ink">
                          {toFa(unit.completionRate)}٪
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex px-3 py-1 rounded-pill text-meta font-bold ${
                          isHigh
                            ? 'bg-domain-3-tint text-secondary'
                            : isMed
                              ? 'bg-domain-1-tint text-primary'
                              : 'bg-domain-5-tint text-domain-5'
                        }`}
                      >
                        {isHigh ? 'پیشرو' : isMed ? 'پویا' : 'نیازمند همراهی'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-left">
                      <Link
                        to={`/org/people?unit=${unit.unitId}`}
                        className="inline-flex items-center gap-1 text-meta font-bold text-primary hover:text-primary/80 transition-colors"
                      >
                        <span>مشاهده اعضا</span>
                        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
