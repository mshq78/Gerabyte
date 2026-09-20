import { and, eq, gte, sql } from 'drizzle-orm';
import type { Database } from '../../db/client.js';
import { rateLimits } from '../../db/schema.js';
import { rateLimited } from '../http/errors.js';

export interface LimitRule {
  action: string;
  /** Window length in seconds. */
  windowSeconds: number;
  /** How many events are allowed inside the window. */
  max: number;
}

/**
 * Every limit in the system, in one place.
 *
 * Postgres-backed rather than in-memory: serverless functions are per-instance,
 * so an in-memory counter would reset on every cold start and be trivially
 * bypassed by fanning requests across instances.
 */
export const LIMITS = {
  otpRequestPerPhone: { action: 'otp.request.phone', windowSeconds: 3600, max: 5 },
  otpRequestPerIp: { action: 'otp.request.ip', windowSeconds: 3600, max: 20 },
  otpResendCooldown: { action: 'otp.request.cooldown', windowSeconds: 60, max: 1 },
  otpVerifyPerIp: { action: 'otp.verify.ip', windowSeconds: 3600, max: 40 },
  loginPerPhone: { action: 'login.phone', windowSeconds: 3600, max: 5 },
  loginPerIp: { action: 'login.ip', windowSeconds: 3600, max: 20 },
} as const satisfies Record<string, LimitRule>;

export interface RateLimitVerdict {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Sliding window: count the events already inside the window, and record this
 * one only if it fits. A rejected attempt is not recorded, so a caller cannot
 * extend their own lockout indefinitely by hammering it.
 */
export async function consume(
  db: Database,
  rule: LimitRule,
  bucket: string,
  now: Date = new Date()
): Promise<RateLimitVerdict> {
  const windowStart = new Date(now.getTime() - rule.windowSeconds * 1000);

  const rows = await db
    .select({ occurredAt: rateLimits.occurredAt })
    .from(rateLimits)
    .where(
      and(
        eq(rateLimits.action, rule.action),
        eq(rateLimits.bucket, bucket),
        gte(rateLimits.occurredAt, windowStart)
      )
    )
    .orderBy(rateLimits.occurredAt)
    .limit(rule.max + 1);

  if (rows.length >= rule.max) {
    const oldest = rows[0]?.occurredAt ?? now;
    const retryAfterMs = oldest.getTime() + rule.windowSeconds * 1000 - now.getTime();
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  await db.insert(rateLimits).values({ action: rule.action, bucket, occurredAt: now });
  return { allowed: true, remaining: rule.max - rows.length - 1, retryAfterSeconds: 0 };
}

/** Consume a limit or throw the 429 with Retry-After. */
export async function enforce(
  db: Database,
  rule: LimitRule,
  bucket: string,
  now: Date = new Date()
): Promise<void> {
  const verdict = await consume(db, rule, bucket, now);
  if (!verdict.allowed) throw rateLimited(verdict.retryAfterSeconds);
}

/** Clear a bucket, e.g. after a successful login. */
export async function reset(db: Database, rule: LimitRule, bucket: string): Promise<void> {
  await db
    .delete(rateLimits)
    .where(and(eq(rateLimits.action, rule.action), eq(rateLimits.bucket, bucket)));
}

/** Housekeeping: drop rows older than the longest window we use. */
export async function pruneExpired(db: Database, olderThanSeconds = 7200): Promise<void> {
  await db
    .delete(rateLimits)
    .where(sql`${rateLimits.occurredAt} < now() - make_interval(secs => ${olderThanSeconds})`);
}
