import { describe, expect, it } from 'vitest';
import { formatDurationFa, formatMinutesFa, formatNumberFa, toEn, toFa } from './toFa';

describe('toFa', () => {
  it('converts every ASCII digit', () => {
    expect(toFa('0123456789')).toBe('۰۱۲۳۴۵۶۷۸۹');
  });

  it('accepts numbers as well as strings', () => {
    expect(toFa(1405)).toBe('۱۴۰۵');
    expect(toFa(0)).toBe('۰');
  });

  it('leaves non-digits alone', () => {
    expect(toFa('سطح 3')).toBe('سطح ۳');
    expect(toFa('09:30')).toBe('۰۹:۳۰');
  });

  it('returns an empty string for null and undefined, not "null"', () => {
    expect(toFa(null)).toBe('');
    expect(toFa(undefined)).toBe('');
  });
});

describe('toEn', () => {
  it('reverses Persian digits', () => {
    expect(toEn('۰۹۱۲۳۴۵۶۷۸۹')).toBe('09123456789');
  });

  it('also handles Arabic-Indic digits', () => {
    expect(toEn('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789');
  });

  it('round-trips with toFa', () => {
    expect(toEn(toFa('۱۴۰۵/۰۷/۰۲'.replace(/[۰-۹]/g, (d) => d)))).toBeTruthy();
    expect(toEn(toFa(987654))).toBe('987654');
  });
});

describe('formatNumberFa', () => {
  it('groups thousands with the Persian separator', () => {
    expect(formatNumberFa(1234567)).toBe('۱٬۲۳۴٬۵۶۷');
  });

  it('leaves values under a thousand ungrouped', () => {
    expect(formatNumberFa(840)).toBe('۸۴۰');
  });

  it('keeps the decimal part', () => {
    expect(formatNumberFa(1234.5)).toBe('۱٬۲۳۴.۵');
  });
});

describe('duration and minute labels', () => {
  it('pads MM:SS', () => {
    expect(formatDurationFa(9)).toBe('۰۰:۰۹');
    expect(formatDurationFa(61)).toBe('۰۱:۰۱');
    expect(formatDurationFa(600)).toBe('۱۰:۰۰');
  });

  it('labels minutes in Persian', () => {
    expect(formatMinutesFa(3)).toBe('۳ دقیقه');
  });
});
