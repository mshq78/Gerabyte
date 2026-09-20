/**
 * Persian (Jalali) date helpers using standard Intl.DateTimeFormat
 */
import { toFa } from './toFa';

const persianDateFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'Asia/Tehran',
});

const persianShortDateFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  month: 'short',
  day: 'numeric',
  timeZone: 'Asia/Tehran',
});

const persianWeekdayFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  weekday: 'long',
  timeZone: 'Asia/Tehran',
});

const persianTimeFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Asia/Tehran',
});

export function formatJalaliDate(isoStringOrDate?: string | Date): string {
  if (!isoStringOrDate) return '';
  const date = typeof isoStringOrDate === 'string' ? new Date(isoStringOrDate) : isoStringOrDate;
  if (isNaN(date.getTime())) return '';
  return persianDateFormatter.format(date);
}

export function formatJalaliShort(isoStringOrDate?: string | Date): string {
  if (!isoStringOrDate) return '';
  const date = typeof isoStringOrDate === 'string' ? new Date(isoStringOrDate) : isoStringOrDate;
  if (isNaN(date.getTime())) return '';
  return persianShortDateFormatter.format(date);
}

export function formatJalaliWeekday(isoStringOrDate?: string | Date): string {
  if (!isoStringOrDate) return '';
  const date = typeof isoStringOrDate === 'string' ? new Date(isoStringOrDate) : isoStringOrDate;
  if (isNaN(date.getTime())) return '';
  return persianWeekdayFormatter.format(date);
}

export function formatJalaliTime(isoStringOrDate?: string | Date): string {
  if (!isoStringOrDate) return '';
  const date = typeof isoStringOrDate === 'string' ? new Date(isoStringOrDate) : isoStringOrDate;
  if (isNaN(date.getTime())) return '';
  return persianTimeFormatter.format(date);
}

/**
 * Calculate countdown string to Friday 23:59 Asia/Tehran
 */
export function getLeagueCountdownFa(): {
  days: string;
  hours: string;
  minutes: string;
  text: string;
} {
  const now = new Date();
  // Saturday is start of week (day 6 in JS Sunday=0, Saturday=6)
  const currentDay = now.getDay(); // 0 is Sunday, 5 is Friday, 6 is Saturday
  // Days until Friday (5)
  let daysUntilFriday = (5 - currentDay + 7) % 7;
  if (
    daysUntilFriday === 0 &&
    (now.getHours() > 23 || (now.getHours() === 23 && now.getMinutes() >= 59))
  ) {
    daysUntilFriday = 7;
  }

  const target = new Date(now);
  target.setDate(now.getDate() + daysUntilFriday);
  target.setHours(23, 59, 59, 999);

  const diffMs = Math.max(0, target.getTime() - now.getTime());
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  const remainingHours = diffHours % 24;
  const remainingMinutes = Math.floor((diffMs / (1000 * 60)) % 60);

  const text =
    diffDays > 0
      ? `${toFa(diffDays)} روز و ${toFa(remainingHours)} ساعت تا پایان لیگ`
      : `${toFa(remainingHours)} ساعت و ${toFa(remainingMinutes)} دقیقه تا پایان لیگ`;

  return {
    days: toFa(diffDays),
    hours: toFa(remainingHours),
    minutes: toFa(remainingMinutes),
    text,
  };
}

/**
 * Generate 30 days grid for current Jalali month with streak indicators
 */
export interface JalaliCalendarCell {
  day: number;
  isToday: boolean;
  isStreakDay: boolean;
}

export function getJalaliMonthGrid(streakDays: number = 9): JalaliCalendarCell[] {
  // Current month: Shahrivar (31 days)
  const todayDay = 29; // Shahrivar 29
  const totalDays = 31;
  const cells: JalaliCalendarCell[] = [];

  for (let d = 1; d <= totalDays; d++) {
    const isToday = d === todayDay;
    // Streak covers last `streakDays` before and including today
    const isStreakDay = d <= todayDay && d > todayDay - streakDays;
    cells.push({
      day: d,
      isToday,
      isStreakDay,
    });
  }

  return cells;
}

/**
 * Persian days of week Saturday -> Friday
 */
export const PERSIAN_WEEKDAYS = [
  { key: 6, short: 'ش', name: 'شنبه' },
  { key: 0, short: 'ی', name: 'یکشنبه' },
  { key: 1, short: 'د', name: 'دوشنبه' },
  { key: 2, short: 'س', name: 'سه‌شنبه' },
  { key: 3, short: 'چ', name: 'چهارشنبه' },
  { key: 4, short: 'پ', name: 'پنج‌شنبه' },
  { key: 5, short: 'ج', name: 'جمعه' },
];
