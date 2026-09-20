import React, { useState, useEffect } from 'react';
import { BarChart3, Plus, Printer, CheckCircle2, HelpCircle } from 'lucide-react';
import { effectivenessApi } from '../../../api/org/effectiveness';
import { EffectivenessReport } from '../../../types/org';
import { toFa } from '../../../lib/format';
import { errorMessage } from '../../../lib/errors';

export const OrgEffectivenessScreen: React.FC = () => {
  const [report, setReport] = useState<EffectivenessReport | null>(null);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [showKpiModal, setShowKpiModal] = useState(false);
  const [showSurveyModal, setShowSurveyModal] = useState(false);

  // New KPI Form State
  const [kpiName, setKpiName] = useState('');
  const [kpiUnit, setKpiUnit] = useState('');
  const [kpiBefore, setKpiBefore] = useState<number>(0);
  const [kpiAfter, setKpiAfter] = useState<number>(0);
  const [kpiHigherIsBetter, setKpiHigherIsBetter] = useState(true);

  // Survey Form State
  const [surveyTitle, setSurveyTitle] = useState('ارزیابی اثربخشی رفتاری شیفت پاییز');
  const [surveyDays, setSurveyDays] = useState(60);

  const [notice, setNotice] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await effectivenessApi.getReport();
      setReport(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddKpi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kpiName.trim()) return;
    try {
      await effectivenessApi.addKpi({
        name: kpiName,
        unit: kpiUnit,
        before: kpiBefore,
        after: kpiAfter,
        higherIsBetter: kpiHigherIsBetter,
      });
      setShowKpiModal(false);
      setNotice(`شاخص «${kpiName}» با موفقیت افزوده شد.`);
      loadData();
    } catch (err) {
      setNotice(errorMessage(err) || 'خطای نامشخص رخ داد.');
    }
  };

  const handleCreateSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await effectivenessApi.createSurvey(surveyTitle, surveyDays);
      setShowSurveyModal(false);
      setNotice(res.message);
      loadData();
    } catch (err) {
      setNotice(errorMessage(err) || 'خطای نامشخص رخ داد.');
    }
  };

  if (loading || !report) {
    return (
      <div className="text-center py-20 text-body font-bold text-ink/60">
        در حال تدوین گزارش اثربخشی کرک‌پاتریک...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 text-ink">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sunken pb-4 print:border-none">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-primary" />
            <h1 className="text-display font-black text-ink">
              گزارش ارزیابی اثربخشی آموزش (مدل کرک‌پاتریک)
            </h1>
          </div>
          <p className="text-body text-ink/70 mt-1">
            سنجش علمی بازدهی سرمایه‌گذاری آموزشی در ۴ سطح: واکنش، یادگیری، رفتار سازمانی و شاخص‌های
            عملیاتی
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden shrink-0">
          <button
            onClick={() => window.print()}
            className="min-h-[44px] px-4 py-2 rounded-tile bg-canvas hover:bg-sunken border border-sunken text-ink font-bold text-meta flex items-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>چاپ گزارش مدیریتی (PDF)</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3.5 rounded-tile bg-domain-3-tint border border-success/30 text-success text-meta font-bold flex items-center gap-2 print:hidden">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Model Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEVEL 1: REACTION */}
        <div className="p-6 rounded-sheet bg-surface border border-sunken shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-sunken pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-tile bg-domain-1-tint text-primary flex items-center justify-center font-black">
                L1
              </div>
              <div>
                <h2 className="text-title font-black text-ink">سطح ۱: واکنش (Reaction)</h2>
                <span className="text-meta text-ink/60">
                  رضایت و نگرش همکاران نسبت به گرابایت‌ها
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-pill bg-domain-3-tint text-success font-black text-meta">
              برگرفته از داده‌های درون‌برنامه
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-tile bg-canvas border border-sunken text-center">
              <div className="text-display font-black text-primary">
                {toFa(report.l1.avgRating)} از ۵
              </div>
              <span className="text-meta text-ink/70 font-bold">میانگین امتیاز کیفی دروس</span>
            </div>
            <div className="p-4 rounded-tile bg-canvas border border-sunken text-center">
              <div className="text-display font-black text-ink">{toFa(report.l1.responses)}</div>
              <span className="text-meta text-ink/70 font-bold">تعداد بازخوردهای ثبت‌شده</span>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <span className="text-meta font-bold text-ink block">
              رضایت به تفکیک حوزه‌های آموزشی:
            </span>
            {report.l1.byDomain.map((d) => (
              <div key={d.domainId} className="flex items-center justify-between text-meta">
                <span className="text-ink/80">
                  {d.domainId === 'hse'
                    ? 'ایمنی و بهداشت حرفه‌ای (HSE)'
                    : d.domainId === 'quality'
                      ? 'کنترل کیفیت و متالورژی'
                      : d.domainId === 'technical'
                        ? 'فنی، مکانیک و نگهداری'
                        : d.domainId === 'communication'
                          ? 'ارتباطات و گزارش‌نویسی شیفت'
                          : 'بهره‌وری فردی'}
                </span>
                <span className="font-mono font-black text-primary">{toFa(d.avg)} ★</span>
              </div>
            ))}
          </div>
        </div>

        {/* LEVEL 2: LEARNING */}
        <div className="p-6 rounded-sheet bg-surface border border-sunken shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-sunken pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-tile bg-domain-4-tint text-domain-4 flex items-center justify-center font-black">
                L2
              </div>
              <div>
                <h2 className="text-title font-black text-ink">سطح ۲: یادگیری (Learning)</h2>
                <span className="text-meta text-ink/60">
                  میزان ارتقای نمرات آزمون‌ها و دانش تخصصی
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-pill bg-domain-3-tint text-success font-black text-meta">
              برگرفته از داده‌های درون‌برنامه
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-tile bg-domain-3-tint/30 border border-success/30 text-center">
              <div className="text-display font-black text-success">
                +{toFa(report.l2.improvementPct)}٪
              </div>
              <span className="text-meta text-ink/80 font-bold">نرخ بهبود نمره پس‌آزمون</span>
            </div>
            <div className="p-4 rounded-tile bg-canvas border border-sunken text-center">
              <div className="text-display font-black text-ink">{toFa(report.l2.sample)}</div>
              <span className="text-meta text-ink/70 font-bold">حجم نمونه همکاران سنجیده‌شده</span>
            </div>
          </div>

          <div className="p-4 rounded-tile bg-paper border border-sunken space-y-2 text-meta">
            <div className="flex items-center justify-between">
              <span className="text-ink/70">میانگین پیش‌آزمون اولیه (تعیین سطح):</span>
              <strong className="font-mono text-ink">{toFa(report.l2.preAvgPct)}٪</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink/70">میانگین آزمون‌های نهایی و گواهینامه‌ها:</span>
              <strong className="font-mono text-success">{toFa(report.l2.postAvgPct)}٪</strong>
            </div>
            <div className="w-full h-3 rounded-full bg-sunken overflow-hidden mt-2">
              <div className="h-full bg-success" style={{ width: `${report.l2.postAvgPct}%` }} />
            </div>
          </div>
        </div>

        {/* LEVEL 3: BEHAVIOR */}
        <div className="p-6 rounded-sheet bg-surface border border-sunken shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-sunken pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-tile bg-domain-5-tint text-coin flex items-center justify-center font-black">
                L3
              </div>
              <div>
                <h2 className="text-title font-black text-ink">سطح ۳: رفتار کاری (Behavior)</h2>
                <span className="text-meta text-ink/60">
                  نظرسنجی ۳۰/۶۰/۹۰ روزه از مدیران مستقیم (Likert ۱ تا ۵)
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-pill bg-domain-5-tint text-coin font-black text-meta">
              نیازمند نظرسنجی دوره‌ای
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-meta font-bold text-ink">
              نرخ مشارکت سرپرستان در نظرسنجی:{' '}
              <strong>{toFa(report.l3.surveyResponseRatePct)}٪</strong>
            </span>
            <button
              onClick={() => setShowSurveyModal(true)}
              className="min-h-[36px] px-3 py-1 rounded-tile bg-canvas hover:bg-sunken border border-sunken text-primary text-meta font-bold print:hidden cursor-pointer"
            >
              ایجاد پرسشنامه جدید
            </button>
          </div>

          <div className="space-y-2.5">
            {report.l3.items.map((item, idx) => (
              <div key={idx} className="p-3 rounded-tile bg-canvas border border-sunken space-y-1">
                <div className="flex items-center justify-between text-meta font-bold">
                  <span className="text-ink leading-relaxed">{item.text}</span>
                  <span className="font-mono text-primary mr-2 shrink-0">
                    {toFa(item.avg)} از ۵
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-sunken overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${(item.avg / 5) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* LEVEL 4: RESULTS */}
        <div className="p-6 rounded-sheet bg-surface border border-sunken shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-sunken pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-tile bg-domain-2-tint text-danger flex items-center justify-center font-black">
                L4
              </div>
              <div>
                <h2 className="text-title font-black text-ink">
                  سطح ۴: نتایج و شاخص‌های سازمانی (Results)
                </h2>
                <span className="text-meta text-ink/60">
                  تغییر شاخص‌های کلیدی عملکرد (KPIs) قبل و بعد از آموزش
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-pill bg-domain-2-tint text-danger font-black text-meta">
              ورودی دستی سازمان
            </span>
          </div>

          {/* Correlation Disclaimer Note */}
          <div className="p-3 rounded-tile bg-domain-1-tint/50 border border-primary/30 text-meta text-ink/80 flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>
              <strong>توجه روش‌شناختی:</strong> تغییرات این شاخص‌ها نشان‌دهنده «همبستگی مثبت
              (Correlation)» بین دوره‌های آموزشی و عملکرد کارگاهی است و اثبات رابطه علیت مطلق
              (Causality) نیاز به مطالعات کنترل‌شده ایزوله دارد.
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-meta font-bold text-ink">شاخص‌های عملیاتی متصل:</span>
            <button
              onClick={() => setShowKpiModal(true)}
              className="min-h-[36px] px-3 py-1 rounded-tile bg-primary hover:bg-primary-hover text-white text-meta font-bold flex items-center gap-1 print:hidden cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>افزودن شاخص جدید</span>
            </button>
          </div>

          <div className="space-y-3">
            {report.l4.kpis.map((kpi) => {
              const diff = kpi.after - kpi.before;
              const isPositiveChange = kpi.higherIsBetter ? diff > 0 : diff < 0;

              return (
                <div
                  key={kpi.id}
                  className="p-3.5 rounded-tile bg-canvas border border-sunken space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-body text-ink">{kpi.name}</strong>
                    <span
                      className={`text-meta font-black px-2 py-0.5 rounded-pill ${
                        isPositiveChange
                          ? 'bg-domain-3-tint text-success'
                          : 'bg-domain-2-tint text-danger'
                      }`}
                    >
                      {isPositiveChange ? 'بهبود عملکرد' : 'تغییر نامطلوب'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-meta">
                    <div className="p-2 rounded-tile bg-surface border border-sunken">
                      <span className="text-ink/60 text-meta block">قبل از آموزش:</span>
                      <strong className="font-mono text-ink">
                        {toFa(kpi.before)} {kpi.unit}
                      </strong>
                    </div>
                    <div className="p-2 rounded-tile bg-surface border border-sunken">
                      <span className="text-ink/60 text-meta block">پس از دوره:</span>
                      <strong className="font-mono text-success">
                        {toFa(kpi.after)} {kpi.unit}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add KPI Modal */}
      {showKpiModal && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-sheet bg-surface border border-sunken shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-sunken pb-3">
              <h3 className="text-title font-black text-ink">افزودن شاخص عملیاتی (سطح ۴)</h3>
              <button onClick={() => setShowKpiModal(false)} className="text-ink/60 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddKpi} className="space-y-4">
              <div>
                <label
                  htmlFor="org-effectiveness-f1"
                  className="block text-meta font-bold text-ink mb-1"
                >
                  نام شاخص عملیاتی:
                </label>
                <input
                  id="org-effectiveness-f1"
                  type="text"
                  placeholder="مثال: نرخ ضایعات کلاف نورد"
                  value={kpiName}
                  onChange={(e) => setKpiName(e.target.value)}
                  className="min-h-[44px] w-full px-3 rounded-tile bg-canvas border border-sunken text-body font-bold text-ink"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="org-effectiveness-f2"
                  className="block text-meta font-bold text-ink mb-1"
                >
                  واحد سنجش:
                </label>
                <input
                  id="org-effectiveness-f2"
                  type="text"
                  placeholder="مثال: درصد وزنی، ساعت در ماه، و..."
                  value={kpiUnit}
                  onChange={(e) => setKpiUnit(e.target.value)}
                  className="min-h-[44px] w-full px-3 rounded-tile bg-canvas border border-sunken text-meta text-ink"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="org-effectiveness-f3"
                    className="block text-meta font-bold text-ink mb-1"
                  >
                    مقدار قبل از دوره:
                  </label>
                  <input
                    id="org-effectiveness-f3"
                    type="number"
                    step="0.1"
                    value={kpiBefore}
                    onChange={(e) => setKpiBefore(Number(e.target.value))}
                    className="min-h-[44px] w-full px-3 rounded-tile bg-canvas border border-sunken text-body font-bold text-ink"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="org-effectiveness-f4"
                    className="block text-meta font-bold text-ink mb-1"
                  >
                    مقدار پس از دوره:
                  </label>
                  <input
                    id="org-effectiveness-f4"
                    type="number"
                    step="0.1"
                    value={kpiAfter}
                    onChange={(e) => setKpiAfter(Number(e.target.value))}
                    className="min-h-[44px] w-full px-3 rounded-tile bg-canvas border border-sunken text-body font-bold text-ink"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-meta text-ink font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={kpiHigherIsBetter}
                    onChange={(e) => setKpiHigherIsBetter(e.target.checked)}
                    className="w-4 h-4 rounded text-primary"
                  />
                  <span>افزایش این عدد به معنای بهبود است (مثبت است)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-sunken">
                <button
                  type="button"
                  onClick={() => setShowKpiModal(false)}
                  className="min-h-[40px] px-4 rounded-tile bg-canvas border border-sunken text-meta font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="min-h-[40px] px-5 rounded-tile bg-primary text-white text-meta font-bold"
                >
                  افزودن به گزارش
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Survey Modal */}
      {showSurveyModal && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-sheet bg-surface border border-sunken shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-sunken pb-3">
              <h3 className="text-title font-black text-ink">ایجاد نظرسنجی اثربخشی رفتاری (L3)</h3>
              <button onClick={() => setShowSurveyModal(false)} className="text-ink/60 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSurvey} className="space-y-4">
              <div>
                <label
                  htmlFor="org-effectiveness-f5"
                  className="block text-meta font-bold text-ink mb-1"
                >
                  عنوان نظرسنجی:
                </label>
                <input
                  id="org-effectiveness-f5"
                  type="text"
                  value={surveyTitle}
                  onChange={(e) => setSurveyTitle(e.target.value)}
                  className="min-h-[44px] w-full px-3 rounded-tile bg-canvas border border-sunken text-meta font-bold text-ink"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="org-effectiveness-f6"
                  className="block text-meta font-bold text-ink mb-1"
                >
                  دوره ارزیابی بعد از آموزش:
                </label>
                <select
                  id="org-effectiveness-f6"
                  value={surveyDays}
                  onChange={(e) => setSurveyDays(Number(e.target.value))}
                  className="min-h-[44px] w-full px-3 rounded-tile bg-canvas border border-sunken text-meta font-bold text-ink"
                >
                  <option value={30}>۳۰ روز پس از اتمام دوره</option>
                  <option value={60}>۶۰ روز پس از اتمام دوره</option>
                  <option value={90}>۹۰ روز پس از اتمام دوره (ارزیابی فصلی)</option>
                </select>
              </div>

              <p className="text-meta text-ink/70">
                پرسشنامه ۵ گزینه‌ای استاندارد بر اساس طیف لیکرت به‌صورت خودکار برای سرپرستان مستقیم
                ارسال خواهد شد.
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-sunken">
                <button
                  type="button"
                  onClick={() => setShowSurveyModal(false)}
                  className="min-h-[40px] px-4 rounded-tile bg-canvas border border-sunken text-meta font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="min-h-[40px] px-5 rounded-tile bg-primary text-white text-meta font-bold"
                >
                  فعال‌سازی پرسشنامه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
