import { OrgCertificateItem } from '../../types/org';
import { isoDaysFromToday } from '../../lib/jalali';

export const INITIAL_ORG_CERTIFICATES: OrgCertificateItem[] = [
  {
    serial: 'GB-2024-FN-0104',
    title: 'مبانی ایمنی صنعتی و کار در ارتفاع خط نورد',
    domainTitle: 'ایمنی و بهداشت حرفه‌ای (HSE)',
    holderId: 'p-1',
    holderName: 'علیرضا رضایی',
    unitId: 'u-nord',
    unitName: 'واحد نورد گرم و مقاطع',
    issuedAt: isoDaysFromToday(-46),
    scorePct: 94,
    pathName: 'مسیر طلایی ایمنی کارگاهی',
  },
  {
    serial: 'GB-2024-FN-0105',
    title: 'اصول بازرسی عیوب متالورژیکی و آزمون‌های غیرمخرب (NDT)',
    domainTitle: 'کنترل کیفیت و متالورژی',
    holderId: 'p-2',
    holderName: 'زهرا کریمی',
    unitId: 'u-lab',
    unitName: 'آزمایشگاه متالورژی و کنترل کیفی',
    issuedAt: isoDaysFromToday(-39),
    scorePct: 98,
    pathName: 'استانداردهای کنترل کیفی شمش و میلگرد',
  },
  {
    serial: 'GB-2024-FN-0106',
    title: 'اصول حل مسئله، ارتباط بین‌فردی و گزارش‌نویسی شیفت',
    domainTitle: 'توسعه فردی و ارتباطات سازمانی',
    holderId: 'p-3',
    holderName: 'محسن اسدی',
    unitId: 'u-nord',
    unitName: 'واحد نورد گرم و مقاطع',
    issuedAt: isoDaysFromToday(-33),
    scorePct: 88,
    pathName: 'مهارت‌های تکمیلی سرپرستی شیفت',
  },
  {
    serial: 'GB-2024-FN-0107',
    title: 'مدیریت و بهینه‌سازی مصرف انرژی در کوره‌های قوس الکتریکی',
    domainTitle: 'فنی و مهندسی',
    holderId: 'p-4',
    holderName: 'سپیده رهنما',
    unitId: 'u-lab',
    unitName: 'آزمایشگاه متالورژی و کنترل کیفی',
    issuedAt: isoDaysFromToday(-26),
    scorePct: 92,
    pathName: 'بهینه‌سازی حرارتی و راندمان کوره',
  },
  {
    serial: 'GB-2024-FN-0108',
    title: 'اصول واکنش اضطراری و اطفای حریق کارگاهی',
    domainTitle: 'ایمنی و بهداشت حرفه‌ای (HSE)',
    holderId: 'p-7',
    holderName: 'مهدی حسینی',
    unitId: 'u-hse',
    unitName: 'واحد بهداشت، ایمنی و محیط زیست (HSE)',
    issuedAt: isoDaysFromToday(-18),
    scorePct: 100,
    pathName: 'فرماندهی حوادث صنعتی',
  },
  {
    serial: 'GB-2024-FN-0109',
    title: 'مبانی نگهداری و تعمیرات پیشگیرانه (PM)',
    domainTitle: 'فنی و مهندسی',
    holderId: 'p-8',
    holderName: 'سارا باقری',
    unitId: 'u-fani',
    unitName: 'معاونت فنی و مهندسی',
    issuedAt: isoDaysFromToday(-9),
    scorePct: 90,
    pathName: 'نگهداری و تعمیرات قابلیت‌اطمینان محور',
  },
];

export const certificatesApi = {
  // TODO(backend): GET /api/v1/org/certificates
  async list(filters?: {
    unitId?: string;
    pathName?: string;
    search?: string;
    role?: string;
  }): Promise<OrgCertificateItem[]> {
    let list = INITIAL_ORG_CERTIFICATES;

    if (filters?.role === 'unit_manager') {
      list = list.filter((c) => c.unitId === 'u-nord');
    } else if (filters?.unitId && filters.unitId !== 'all') {
      list = list.filter((c) => c.unitId === filters.unitId);
    }

    if (filters?.pathName && filters.pathName !== 'all') {
      list = list.filter((c) => c.pathName === filters.pathName);
    }

    if (filters?.search) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.holderName.toLowerCase().includes(q) ||
          c.serial.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.unitName.toLowerCase().includes(q)
      );
    }

    return list;
  },

  // Get distinct path names for filter dropdown
  async getPathNames(): Promise<string[]> {
    const set = new Set(INITIAL_ORG_CERTIFICATES.map((c) => c.pathName));
    return Array.from(set);
  },
};
