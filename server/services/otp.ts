import { and, desc, eq, gt, isNull, sql } from 'drizzle-orm';
import type { Database } from '../../db/client';
import { otpCodes } from '../../db/schema';
import { OTP_LENGTH } from '../../shared/schemas/auth';
import { env, isProductionDeployment } from '../config/env';
import { AppError } from '../http/errors';
import { hmacHex, randomNumericCode, safeEqualHex } from '../util/crypto';
import { smsProvider } from './sms';

export const OTP_TTL_SECONDS = 120;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

/** The fixed code the dev provider accepts, when explicitly enabled. */
export const DEV_OTP_CODE = '0'.repeat(OTP_LENGTH);

/**
 * The stored value binds the code to both the phone and this specific code id,
 * so a hash from one request cannot be replayed against another.
 */
function hashCode(phone: string, codeId: string, code: string): string {
  return hmacHex(env().OTP_HMAC_SECRET, `otp:${phone}:${codeId}:${code}`);
}

export interface IssuedOtp {
  codeId: string;
  expiresAt: Date;
}

/**
 * Create a code, store only its HMAC, and hand it to the SMS provider.
 *
 * The caller must have already enforced the rate limits; this function does not
 * know whether an account exists, which is what keeps the response identical
 * for a registered and an unregistered phone.
 */
export async function issueOtp(
  db: Database,
  phone: string,
  now: Date = new Date()
): Promise<IssuedOtp> {
  const code = randomNumericCode(OTP_LENGTH);
  const expiresAt = new Date(now.getTime() + OTP_TTL_SECONDS * 1000);

  // Any code still in flight for this phone is retired, so only the newest works.
  await db
    .update(otpCodes)
    .set({ consumedAt: now })
    .where(and(eq(otpCodes.phone, phone), isNull(otpCodes.consumedAt)));

  const [row] = await db
    .insert(otpCodes)
    .values({
      phone,
      // Placeholder: the real hash needs the generated id, set immediately below.
      codeHash: 'pending',
      maxAttempts: OTP_MAX_ATTEMPTS,
      expiresAt,
      createdAt: now,
    })
    .returning({ id: otpCodes.id });

  if (!row) throw new Error('failed to issue otp');

  await db
    .update(otpCodes)
    .set({ codeHash: hashCode(phone, row.id, code) })
    .where(eq(otpCodes.id, row.id));

  await smsProvider().sendOtp(phone, code);

  return { codeId: row.id, expiresAt };
}

export type OtpVerifyOutcome =
  { ok: true } | { ok: false; code: 'OTP_INVALID' | 'OTP_EXPIRED' | 'OTP_TOO_MANY_ATTEMPTS' };

/**
 * Verify a code and consume it on success.
 *
 * Comparison is constant time. A wrong code burns one of the five attempts; the
 * fifth failure retires the code entirely so it cannot be brute-forced further.
 */
export async function verifyOtp(
  db: Database,
  phone: string,
  codeId: string,
  submitted: string,
  now: Date = new Date()
): Promise<OtpVerifyOutcome> {
  // Never on a production deployment, and only when explicitly switched on.
  const devBypass = !isProductionDeployment() && env().ALLOW_DEV_OTP && submitted === DEV_OTP_CODE;

  const [row] = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.id, codeId), eq(otpCodes.phone, phone)))
    .limit(1);

  if (!row) return { ok: false, code: 'OTP_INVALID' };
  if (row.consumedAt) return { ok: false, code: 'OTP_INVALID' };
  if (row.expiresAt <= now) return { ok: false, code: 'OTP_EXPIRED' };
  if (row.attempts >= row.maxAttempts) return { ok: false, code: 'OTP_TOO_MANY_ATTEMPTS' };

  const matches = devBypass || safeEqualHex(row.codeHash, hashCode(phone, codeId, submitted));

  if (!matches) {
    const attempts = row.attempts + 1;
    const exhausted = attempts >= row.maxAttempts;
    await db
      .update(otpCodes)
      .set({ attempts, consumedAt: exhausted ? now : null })
      .where(eq(otpCodes.id, row.id));
    return { ok: false, code: exhausted ? 'OTP_TOO_MANY_ATTEMPTS' : 'OTP_INVALID' };
  }

  // Consume atomically: a concurrent verify of the same code must not also win.
  const consumed = await db
    .update(otpCodes)
    .set({ consumedAt: now, attempts: row.attempts + 1 })
    .where(and(eq(otpCodes.id, row.id), isNull(otpCodes.consumedAt)))
    .returning({ id: otpCodes.id });

  if (consumed.length === 0) return { ok: false, code: 'OTP_INVALID' };
  return { ok: true };
}

/**
 * Seconds a caller must wait before another code may be sent to this phone,
 * or 0 if they may send now.
 */
export async function resendCooldownRemaining(
  db: Database,
  phone: string,
  now: Date = new Date()
): Promise<number> {
  const [row] = await db
    .select({ createdAt: otpCodes.createdAt })
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.phone, phone),
        gt(otpCodes.createdAt, new Date(now.getTime() - OTP_RESEND_COOLDOWN_SECONDS * 1000))
      )
    )
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);

  if (!row) return 0;
  const elapsed = (now.getTime() - row.createdAt.getTime()) / 1000;
  return Math.max(0, Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - elapsed));
}

export function cooldownError(retryAfterSeconds: number): AppError {
  return new AppError(429, 'OTP_RESEND_COOLDOWN', {
    headers: { 'Retry-After': String(Math.max(1, retryAfterSeconds)) },
  });
}

/** Housekeeping: drop codes that expired a while ago. */
export async function pruneExpiredCodes(db: Database): Promise<void> {
  await db.delete(otpCodes).where(sql`${otpCodes.expiresAt} < now() - interval '1 day'`);
}
