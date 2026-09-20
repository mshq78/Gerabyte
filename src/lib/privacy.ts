import { toEn, toFa } from './toFa';

/**
 * Mask a phone number for display: «۰۹۱۲***۴۵۶۷».
 *
 * Managers never need the full number, so the dashboard shows this everywhere.
 * TODO(server): the API masks phones before they leave the database; this is
 * the UI's second line of defence, not the first.
 */
export function maskPhone(phone?: string | null): string {
  if (!phone) return '';
  const digits = toEn(String(phone)).replace(/\D/g, '');
  if (digits.length < 7) return toFa(digits);
  return `${toFa(digits.slice(0, 4))}***${toFa(digits.slice(-4))}`;
}
