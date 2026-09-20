import { z } from 'zod';

/**
 * Iranian mobile numbers are stored and compared in one canonical form:
 * +989XXXXXXXXX. Everything the user can type — Persian or Arabic-Indic digits,
 * 09…, 9…, 0098…, +98…, spaces, dashes, parentheses — normalises to it.
 */
export const E164_IR_MOBILE = /^\+989\d{9}$/;

const FA_DIGIT_OFFSET = 0x06f0;
const AR_DIGIT_OFFSET = 0x0660;

export function normalizePhone(input: string): string | null {
  if (!input) return null;
  let s = String(input)
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - FA_DIGIT_OFFSET))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - AR_DIGIT_OFFSET))
    .replace(/[\s\-()._]/g, '');

  if (s.startsWith('00')) s = `+${s.slice(2)}`;
  if (s.startsWith('+98')) s = s.slice(3);
  else if (s.startsWith('98') && s.length === 12) s = s.slice(2);
  else if (s.startsWith('0')) s = s.slice(1);

  if (!/^9\d{9}$/.test(s)) return null;
  return `+98${s}`;
}

/** Accepts anything a person might type and yields the canonical form. */
export const phoneSchema = z
  .string()
  .trim()
  .min(1)
  .transform((value, ctx) => {
    const normalized = normalizePhone(value);
    if (!normalized) {
      ctx.addIssue({ code: 'custom', message: 'INVALID_PHONE' });
      return z.NEVER;
    }
    return normalized;
  });

/** Mask a canonical phone for any manager-facing payload: ۰۹۱۲***۴۵۶۷ shape. */
export function maskPhoneE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7) return '***';
  const national = digits.startsWith('98') ? `0${digits.slice(2)}` : digits;
  return `${national.slice(0, 4)}***${national.slice(-4)}`;
}

export const uuidSchema = z.uuid();

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.literal(25).default(25),
});
export type Pagination = z.infer<typeof paginationSchema>;

export const PAGE_SIZE = 25;

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
