import { EffectivenessReport } from '../../types/org';

const STORAGE_KEY_EFFECTIVENESS = 'gerabyte_org_effectiveness_v1';

export const INITIAL_EFFECTIVENESS_REPORT: EffectivenessReport = {
  l1: {
    avgRating: 4.74,
    responses: 1840,
    byDomain: [
      { domainId: 'hse', avg: 4.85 },
      { domainId: 'quality', avg: 4.78 },
      { domainId: 'technical', avg: 4.69 },
      { domainId: 'communication', avg: 4.72 },
      { domainId: 'productivity', avg: 4.66 },
    ],
  },
  l2: {
    preAvgPct: 54.2,
    postAvgPct: 83.6,
    improvementPct: 29.4,
    sample: 620,
  },
  l3: {
    surveyResponseRatePct: 88,
    items: [
      { text: 'رعایت پروتکل‌های ایمنی فردی و استفاده از تجهیزات حفاظت فردی در خط', avg: 4.6 },
      { text: 'کیفیت و دقت ثبت گزارش‌های وقایع شیفت و تحویل کار', avg: 4.2 },
      { text: 'مهارت در شناسایی سریع عیوب سطحی قبل از ورود به مرحله بسته‌بندی', avg: 4.4 },
      { text: 'همکاری بین‌واحدی و مشارکت در حل تعارض‌های شیفتی', avg: 4.1 },
      { text: 'کاهش اتلاف زمان استارت مجدد خط پس از توقف‌های برنامه‌ریزی‌شده', avg: 4.3 },
    ],
  },
  l4: {
    kpis: [
      {
        id: 'kpi-1',
        name: 'نرخ حوادث ناشی از کار (ضریب تکرار حادثه)',
        unit: 'حادثه در میلیون نفر-ساعت',
        before: 4.8,
        after: 2.1,
        higherIsBetter: false,
      },
      {
        id: 'kpi-2',
        name: 'درصد ضایعات و دوباره‌کاری میلگرد',
        unit: 'درصد وزنی تولید',
        before: 3.4,
        after: 1.8,
        higherIsBetter: false,
      },
      {
        id: 'kpi-3',
        name: 'راندمان زمانی بهره‌برداری از خط نورد گرم (OEE)',
        unit: 'درصد راندمان کلی',
        before: 72.5,
        after: 81.3,
        higherIsBetter: true,
      },
    ],
  },
};

export const effectivenessApi = {
  // TODO(backend): GET /api/v1/org/effectiveness
  async getReport(): Promise<EffectivenessReport> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_EFFECTIVENESS);
      if (raw) return JSON.parse(raw);
    } catch {
      // fallback
    }
    return INITIAL_EFFECTIVENESS_REPORT;
  },

  // TODO(backend): POST /api/v1/org/effectiveness/kpi
  async addKpi(kpi: {
    name: string;
    unit: string;
    before: number;
    after: number;
    higherIsBetter: boolean;
  }): Promise<EffectivenessReport> {
    const report = await this.getReport();
    const newKpi = {
      id: `kpi-${Date.now()}`,
      ...kpi,
    };
    report.l4.kpis.push(newKpi);
    localStorage.setItem(STORAGE_KEY_EFFECTIVENESS, JSON.stringify(report));
    return report;
  },

  // TODO(backend): POST /api/v1/org/effectiveness/survey
  async createSurvey(surveyTitle: string, targetDays: number): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `پرسشنامه ارزیابی رفتار سازمانی ۳۶۰ درجه («${surveyTitle}» - دوره ${targetDays} روزه) برای ۱۲ مدیر شیفت و سرپرست فعال گردید.`,
    };
  },
};
