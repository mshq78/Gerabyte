import { describe, expect, it } from 'vitest';
import {
  daysSince,
  daysUntil,
  formatJalaliDate,
  formatJalaliNumeric,
  formatJalaliYear,
  isOverdue,
  isoDaysFromToday,
  isoHoursFromNow,
  isoMinutesFromNow,
  parseJalaliNumeric,
} from './jalali';

describe('relative ISO helpers', () => {
  it('produces valid ISO strings in UTC', () => {
    for (const offset of [-365, -1, 0, 1, 365]) {
      const iso = isoDaysFromToday(offset);
      expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(Number.isNaN(new Date(iso).getTime())).toBe(false);
    }
  });

  it('moves exactly one day per step', () => {
    const a = new Date(isoDaysFromToday(0)).getTime();
    const b = new Date(isoDaysFromToday(1)).getTime();
    expect(b - a).toBe(24 * 60 * 60 * 1000);
  });

  it('puts negative offsets in the past and positive ones in the future', () => {
    expect(new Date(isoDaysFromToday(-10)).getTime()).toBeLessThan(Date.now());
    expect(new Date(isoDaysFromToday(14)).getTime()).toBeGreaterThan(Date.now());
  });

  it('offsets hours and minutes from the exact moment', () => {
    const now = new Date('2026-09-20T12:00:00.000Z');
    expect(isoHoursFromNow(-3, now)).toBe('2026-09-20T09:00:00.000Z');
    expect(isoMinutesFromNow(45, now)).toBe('2026-09-20T12:45:00.000Z');
  });
});

describe('daysSince / daysUntil / isOverdue', () => {
  const now = new Date('2026-09-20T12:00:00.000Z');

  it('counts whole days elapsed', () => {
    expect(daysSince('2026-09-10T12:00:00.000Z', now)).toBe(10);
    expect(daysSince('2026-09-20T12:00:00.000Z', now)).toBe(0);
  });

  it('is the mirror of daysUntil', () => {
    expect(daysUntil('2026-10-04T12:00:00.000Z', now)).toBe(14);
    expect(daysUntil('2026-09-10T12:00:00.000Z', now)).toBe(-10);
  });

  it('treats a passed due date as overdue and a future one as not', () => {
    expect(isOverdue('2026-09-19T12:00:00.000Z', now)).toBe(true);
    expect(isOverdue('2026-09-21T12:00:00.000Z', now)).toBe(false);
  });

  it('returns 0 rather than NaN for an unparseable date', () => {
    expect(daysSince('not-a-date', now)).toBe(0);
  });
});

describe('Jalali formatting', () => {
  it('formats a known Gregorian date as its Jalali equivalent', () => {
    // 2026-09-20 is 1405/06/29 in the Persian calendar.
    expect(formatJalaliNumeric('2026-09-20T12:00:00.000Z')).toBe('۱۴۰۵/۰۶/۲۹');
    expect(formatJalaliYear('2026-09-20T12:00:00.000Z')).toBe('۱۴۰۵');
  });

  it('renders Persian digits and a Persian month name', () => {
    const long = formatJalaliDate('2026-09-20T12:00:00.000Z');
    expect(long).toMatch(/[۰-۹]/);
    expect(long).not.toMatch(/[0-9]/);
  });

  it('returns an empty string for missing or invalid input', () => {
    expect(formatJalaliDate(undefined)).toBe('');
    expect(formatJalaliDate('nonsense')).toBe('');
    expect(formatJalaliNumeric('')).toBe('');
  });
});

describe('parseJalaliNumeric', () => {
  it('round-trips every day across two years', () => {
    for (let offset = -365; offset <= 365; offset++) {
      const iso = isoDaysFromToday(offset);
      const fa = formatJalaliNumeric(iso);
      const back = parseJalaliNumeric(fa);
      expect(back, `offset ${offset} (${fa})`).not.toBeNull();
      expect(formatJalaliNumeric(back!), `offset ${offset}`).toBe(fa);
    }
  });

  it('accepts ASCII digits and single-digit months', () => {
    expect(parseJalaliNumeric('1405/6/29')).toBe(parseJalaliNumeric('۱۴۰۵/۰۶/۲۹'));
  });

  it('rejects malformed and out-of-range dates', () => {
    expect(parseJalaliNumeric('')).toBeNull();
    expect(parseJalaliNumeric('abc')).toBeNull();
    expect(parseJalaliNumeric('۱۴۰۵/۱۳/۰۱')).toBeNull();
    expect(parseJalaliNumeric('۱۴۰۵/۰۱/۳۲')).toBeNull();
    expect(parseJalaliNumeric('۱۴۰۵/۰۷/۳۱')).toBeNull();
  });
});
