import { eq, sql } from 'drizzle-orm';
import type { Database } from '../../db/client.js';
import { credentials } from '../../db/schema.js';

/**
 * Per-account lockout for password login.
 *
 * The rate limiter already caps attempts per phone and per IP, but it is a
 * sliding window over requests: an attacker spread across many addresses
 * still gets the per-phone allowance back every hour, forever. This binds the
 * cost to the account instead, so a sustained guessing campaign against one
 * person stops rather than merely slows.
 *
 * OTP login is deliberately untouched. Locking it too would hand anyone who
 * knows a phone number a way to keep its owner out of their own account.
 */
export const MAX_FAILED_ATTEMPTS = 8;
export const FIRST_LOCK_MINUTES = 15;
export const REPEAT_LOCK_MINUTES = 60;

export interface CredentialState {
  userId: string;
  passwordHash: string | null;
  failedAttempts: number;
  lockedUntil: Date | null;
}

/**
 * The credential row, or null. Always issues exactly one query so that the
 * "no such account" path costs the same as the "wrong password" path.
 */
export async function loadCredential(
  db: Database,
  userId: string
): Promise<CredentialState | null> {
  const [row] = await db
    .select({
      userId: credentials.userId,
      passwordHash: credentials.passwordHash,
      failedAttempts: credentials.failedAttempts,
      lockedUntil: credentials.lockedUntil,
    })
    .from(credentials)
    .where(eq(credentials.userId, userId))
    .limit(1);
  return row ?? null;
}

/**
 * The same query shape for a phone that has no account at all, so an attacker
 * cannot tell the two apart by how long the answer took. The id is a constant
 * that cannot collide with a real one.
 */
const ABSENT_USER_ID = '00000000-0000-0000-0000-000000000000';

export function loadCredentialForUnknownUser(db: Database): Promise<CredentialState | null> {
  return loadCredential(db, ABSENT_USER_ID);
}

export function isLocked(credential: CredentialState | null, now: Date = new Date()): boolean {
  return credential?.lockedUntil ? credential.lockedUntil > now : false;
}

export interface FailureOutcome {
  failedAttempts: number;
  /** Set when this failure is the one that locked the account. */
  lockedUntil: Date | null;
}

/**
 * Count one wrong password, and lock the account on every eighth one.
 *
 * The counter is not reset by a lockout, so the second lockout is the longer
 * one: 8 failures buys 15 minutes, 16 buys an hour, and so does every eight
 * after that. A correct password clears the whole thing.
 */
export async function recordFailure(
  db: Database,
  userId: string,
  now: Date = new Date()
): Promise<FailureOutcome> {
  const [row] = await db
    .insert(credentials)
    .values({ userId, failedAttempts: 1, updatedAt: now })
    .onConflictDoUpdate({
      target: credentials.userId,
      set: {
        failedAttempts: sql`${credentials.failedAttempts} + 1`,
        updatedAt: now,
      },
    })
    .returning({ failedAttempts: credentials.failedAttempts });

  const failedAttempts = row?.failedAttempts ?? 1;
  if (failedAttempts % MAX_FAILED_ATTEMPTS !== 0) {
    return { failedAttempts, lockedUntil: null };
  }

  const minutes = failedAttempts === MAX_FAILED_ATTEMPTS ? FIRST_LOCK_MINUTES : REPEAT_LOCK_MINUTES;
  const lockedUntil = new Date(now.getTime() + minutes * 60 * 1000);
  await db
    .update(credentials)
    .set({ lockedUntil, updatedAt: now })
    .where(eq(credentials.userId, userId));

  return { failedAttempts, lockedUntil };
}

/** A correct password clears the counter and any lock. */
export async function recordSuccess(db: Database, userId: string): Promise<void> {
  await db
    .update(credentials)
    .set({ failedAttempts: 0, lockedUntil: null, updatedAt: new Date() })
    .where(eq(credentials.userId, userId));
}
