import { Level, OrgRank, LeagueTier } from '../types/domain';
export { toFa, formatNumberFa, formatDurationFa } from './toFa';

export const LEVEL_NAMES: Record<Level, { title: string; subtitle: string; minXp: number }> = {
  1: { title: 'آغازگر', subtitle: 'پایه‌ریزی مهارت‌های اولیه', minXp: 0 },
  2: { title: 'کوشا', subtitle: 'تثبیت الگوهای یادگیری', minXp: 250 },
  3: { title: 'ماهر', subtitle: 'تسلط و بکارگیری کاربردی', minXp: 600 },
  4: { title: 'پیشرو', subtitle: 'الگودهی و حل مسائل پیچیده', minXp: 1200 },
  5: { title: 'الهام‌بخش', subtitle: 'رهبری فکری و اثرگذاری جمعی', minXp: 2200 },
};

export const ORG_RANK_NAMES: Record<OrgRank, string> = {
  operator: 'اپراتور / کارشناس اجرایی',
  expert: 'کارشناس تخصصی',
  supervisor: 'سرپرست و مسئول بخش',
  middle_manager: 'مدیر میانی',
  senior_manager: 'مدیر ارشد',
};

export const LEAGUE_TIER_INFO: Record<
  LeagueTier,
  { title: string; enTitle: string; color: string; borderTone: string; order: number }
> = {
  byte: { title: 'لیگ بایت', enTitle: 'Byte', color: '#1E6FA8', borderTone: '#EAF3F9', order: 1 },
  kilobyte: {
    title: 'لیگ کیلوبایت',
    enTitle: 'Kilobyte',
    color: '#1F9A8A',
    borderTone: '#EDF8F6',
    order: 2,
  },
  megabyte: {
    title: 'لیگ مگابایت',
    enTitle: 'Megabyte',
    color: '#7A5BD6',
    borderTone: '#F2EFFF',
    order: 3,
  },
  gigabyte: {
    title: 'لیگ گیگابایت',
    enTitle: 'Gigabyte',
    color: '#F2A93B',
    borderTone: '#FEF6EC',
    order: 4,
  },
  terabyte: {
    title: 'لیگ ترابایت',
    enTitle: 'Terabyte',
    color: '#E2665A',
    borderTone: '#FDF2F0',
    order: 5,
  },
};

export const CARD_TYPE_NAMES: Record<string, string> = {
  text: 'متن مفهومی',
  video: 'ویدیو آموزشی',
  audio: 'پادکست صوتی',
  infographic: 'اینفوگرافیک تحلیلی',
  flashcards: 'فلش‌کارت مرور',
  scenario: 'سناریوی کاربردی',
  quiz: 'ارزیابی کوتاه',
};
