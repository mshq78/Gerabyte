/**
 * Utilities for Persian digits and formatting
 */

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toFa(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  return str.replace(/[0-9]/g, (w) => FA_DIGITS[+w]);
}

/**
 * Format number with Persian thousands separator «٬»
 */
export function formatNumberFa(value: number | string): string {
  if (value === null || value === undefined) return '';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return toFa(value);

  const parts = num.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '٬');
  return toFa(parts.join('.'));
}

/**
 * Format seconds to MM:SS with Persian digits
 */
export function formatDurationFa(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const mStr = m < 10 ? `۰${toFa(m)}` : toFa(m);
  const sStr = s < 10 ? `۰${toFa(s)}` : toFa(s);
  return `${mStr}:${sStr}`;
}

/**
 * Format minutes label e.g. ۳ دقیقه
 */
export function formatMinutesFa(minutes: number): string {
  return `${toFa(minutes)} دقیقه`;
}
