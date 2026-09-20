/**
 * Utilities for Persian digits and formatting
 */

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toFa(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  return str.replace(/[0-9]/g, (w) => FA_DIGITS[+w]);
}

/** Turn Persian and Arabic-Indic digits back into ASCII digits. */
export function toEn(value: string): string {
  return value
    .replace(/[\u06f0-\u06f9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660));
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
