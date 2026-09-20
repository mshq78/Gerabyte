/**
 * Persian (Jalali) date helpers using standard Intl.DateTimeFormat
 */
import { toEn, toFa } from './toFa';

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

export const TEHRAN_TIME_ZONE = 'Asia/Tehran';

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

const tehranDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TEHRAN_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Today's calendar date in Tehran, as [year, month, day] in the Gregorian calendar. */
function tehranToday(now: Date = new Date()): [number, number, number] {
  const [y, m, d] = tehranDateFormatter.format(now).split('-').map(Number);
  return [y, m, d];
}

/**
 * ISO timestamp for midday in Tehran, `days` from today (negative = the past).
 * Pinning to midday keeps the rendered Jalali day stable whatever the time of
 * day the app is opened. Tehran is a fixed UTC+03:30 with no DST, so 12:00
 * local is 08:30 UTC.
 */
export function isoDaysFromToday(days: number, now: Date = new Date()): string {
  const [y, m, d] = tehranToday(now);
  return new Date(Date.UTC(y, m - 1, d + days, 8, 30, 0, 0)).toISOString();
}

/** ISO timestamp `hours` from this moment (negative = the past). */
export function isoHoursFromNow(hours: number, now: Date = new Date()): string {
  return new Date(now.getTime() + hours * HOUR_MS).toISOString();
}

/** ISO timestamp `minutes` from this moment (negative = the past). */
export function isoMinutesFromNow(minutes: number, now: Date = new Date()): string {
  return new Date(now.getTime() + minutes * MINUTE_MS).toISOString();
}

/** Whole days between `iso` and now; positive when `iso` is in the past. */
export function daysSince(iso: string, now: Date = new Date()): number {
  const then = new Date(iso);
  if (isNaN(then.getTime())) return 0;
  return Math.floor((now.getTime() - then.getTime()) / (24 * HOUR_MS));
}

/** Whole days from now until `iso`; negative once `iso` has passed. */
export function daysUntil(iso: string, now: Date = new Date()): number {
  return -daysSince(iso, now);
}

/** True when a due date has passed. */
export function isOverdue(dueIso: string, now: Date = new Date()): boolean {
  return daysUntil(dueIso, now) < 0;
}

const persianMonthYearFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  year: 'numeric',
  month: 'long',
  timeZone: TEHRAN_TIME_ZONE,
});

/** e.g. «مهر ۱۴۰۵» — the Jalali month and year of an ISO timestamp. */
export function formatJalaliMonthYear(isoStringOrDate?: string | Date): string {
  if (!isoStringOrDate) return '';
  const date = typeof isoStringOrDate === 'string' ? new Date(isoStringOrDate) : isoStringOrDate;
  if (isNaN(date.getTime())) return '';
  return persianMonthYearFormatter.format(date);
}

const persianYearFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  year: 'numeric',
  timeZone: TEHRAN_TIME_ZONE,
});

const persianNumericFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: TEHRAN_TIME_ZONE,
});

/** The Jalali year of an ISO timestamp, e.g. «۱۴۰۵». */
export function formatJalaliYear(isoStringOrDate?: string | Date): string {
  if (!isoStringOrDate) return '';
  const date = typeof isoStringOrDate === 'string' ? new Date(isoStringOrDate) : isoStringOrDate;
  if (isNaN(date.getTime())) return '';
  return persianYearFormatter.format(date);
}

/** Numeric Jalali date, e.g. «۱۴۰۵/۰۷/۰۲» — the format the date inputs expect. */
export function formatJalaliNumeric(isoStringOrDate?: string | Date): string {
  if (!isoStringOrDate) return '';
  const date = typeof isoStringOrDate === 'string' ? new Date(isoStringOrDate) : isoStringOrDate;
  if (isNaN(date.getTime())) return '';
  return persianNumericFormatter.format(date).replace(/\u200f/g, '');
}

const jalaliPartsFormatter = new Intl.DateTimeFormat('en-u-ca-persian-nu-latn', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  timeZone: TEHRAN_TIME_ZONE,
});

/** The Jalali [year, month, day] a moment falls on in Tehran. */
function jalaliParts(date: Date): [number, number, number] {
  const parts = jalaliPartsFormatter.formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return [get('year'), get('month'), get('day')];
}

/** Days in each Jalali month; the 12th is 29 or 30 depending on the leap year. */
function jalaliDayOfYear(month: number, day: number): number {
  const before = month <= 7 ? (month - 1) * 31 : 6 * 31 + (month - 7) * 30;
  return before + day;
}

/**
 * Parse a numeric Jalali date («۱۴۰۵/۰۷/۰۲» or «1405/7/2») into an ISO timestamp
 * at midday Tehran. Returns null when the string is not a valid Jalali date.
 *
 * Anchors on Farvardin 1 of that year — found by probing the four Gregorian days
 * the Persian new year can fall on — then counts forward, so it needs no table.
 */
export function parseJalaliNumeric(value: string): string | null {
  const match = toEn(value).match(/^\s*(\d{3,4})\D+(\d{1,2})\D+(\d{1,2})\s*$/);
  if (!match) return null;
  const jYear = Number(match[1]);
  const jMonth = Number(match[2]);
  const jDay = Number(match[3]);
  if (jMonth < 1 || jMonth > 12 || jDay < 1 || jDay > 31) return null;

  let nowruz: Date | null = null;
  for (let day = 19; day <= 22; day++) {
    const candidate = new Date(Date.UTC(jYear + 621, 2, day, 8, 30, 0, 0));
    const [y, m, d] = jalaliParts(candidate);
    if (y === jYear && m === 1 && d === 1) {
      nowruz = candidate;
      break;
    }
  }
  if (!nowruz) return null;

  const target = new Date(nowruz.getTime() + (jalaliDayOfYear(jMonth, jDay) - 1) * 24 * HOUR_MS);
  const [y, m, d] = jalaliParts(target);
  if (y !== jYear || m !== jMonth || d !== jDay) return null;
  return target.toISOString();
}

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
