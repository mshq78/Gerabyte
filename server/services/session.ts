import { and, eq, isNull } from 'drizzle-orm';
import type { CookieOptions, Request, Response } from 'express';
import type { Database } from '../../db/client.js';
import { sessions } from '../../db/schema.js';
import { env, isDeployed } from '../config/env.js';
import { hmacHex, randomToken } from '../util/crypto.js';

/**
 * Sessions are opaque and server-side. The browser holds a random token; the
 * database holds only its HMAC, so a dump of the sessions table cannot be
 * replayed. No JWT ever reaches the browser.
 */
export const IDLE_TIMEOUT_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
export const ABSOLUTE_TIMEOUT_MS = 60 * 24 * 60 * 60 * 1000; // 60 days

/**
 * The __Host- prefix is a browser-enforced guarantee: Secure, Path=/, and no
 * Domain attribute, so a sibling subdomain cannot write the cookie. It requires
 * https, so plain-http development uses the unprefixed name.
 */
export function cookieName(): string {
  // __Host- requires Secure, so it is used on every https deployment —
  // staging included — and not on plain-http local development.
  return isDeployed() ? '__Host-gerabyte_session' : 'gerabyte_session';
}

function cookieOptions(expires: Date): CookieOptions {
  const secure = isDeployed();
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    expires,
  };
}

function tokenHash(token: string): string {
  return hmacHex(env().SESSION_HASH_SECRET, `session:${token}`);
}

export interface CreatedSession {
  id: string;
  token: string;
  idleExpiresAt: Date;
  absoluteExpiresAt: Date;
}

export async function createSession(
  db: Database,
  userId: string,
  meta: { userAgent?: string | null; ipHash?: string | null } = {},
  now: Date = new Date()
): Promise<CreatedSession> {
  const token = randomToken(32);
  const idleExpiresAt = new Date(now.getTime() + IDLE_TIMEOUT_MS);
  const absoluteExpiresAt = new Date(now.getTime() + ABSOLUTE_TIMEOUT_MS);

  const [row] = await db
    .insert(sessions)
    .values({
      userId,
      tokenHash: tokenHash(token),
      userAgent: meta.userAgent?.slice(0, 400) ?? null,
      ipHash: meta.ipHash ?? null,
      createdAt: now,
      lastSeenAt: now,
      idleExpiresAt,
      absoluteExpiresAt,
    })
    .returning({ id: sessions.id });

  if (!row) throw new Error('failed to create session');
  return { id: row.id, token, idleExpiresAt, absoluteExpiresAt };
}

export interface ActiveSession {
  id: string;
  userId: string;
  createdAt: Date;
  lastSeenAt: Date;
  idleExpiresAt: Date;
  absoluteExpiresAt: Date;
  userAgent: string | null;
}

/**
 * Look a token up and slide its idle deadline forward. Returns null for a
 * token that is unknown, revoked, idle-expired or past its absolute deadline —
 * the caller cannot tell which, and does not need to.
 */
export async function loadSession(
  db: Database,
  token: string,
  now: Date = new Date()
): Promise<ActiveSession | null> {
  const [row] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.tokenHash, tokenHash(token)), isNull(sessions.revokedAt)))
    .limit(1);

  if (!row) return null;
  if (row.idleExpiresAt <= now || row.absoluteExpiresAt <= now) return null;

  // Slide the idle window, but never past the absolute deadline.
  const nextIdle = new Date(
    Math.min(now.getTime() + IDLE_TIMEOUT_MS, row.absoluteExpiresAt.getTime())
  );
  await db
    .update(sessions)
    .set({ lastSeenAt: now, idleExpiresAt: nextIdle })
    .where(eq(sessions.id, row.id));

  return {
    id: row.id,
    userId: row.userId,
    createdAt: row.createdAt,
    lastSeenAt: now,
    idleExpiresAt: nextIdle,
    absoluteExpiresAt: row.absoluteExpiresAt,
    userAgent: row.userAgent,
  };
}

export async function revokeSession(
  db: Database,
  sessionId: string,
  userId: string,
  now: Date = new Date()
): Promise<boolean> {
  const rows = await db
    .update(sessions)
    .set({ revokedAt: now })
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId), isNull(sessions.revokedAt)))
    .returning({ id: sessions.id });
  return rows.length > 0;
}

export async function revokeAllSessions(
  db: Database,
  userId: string,
  except: string | null = null,
  now: Date = new Date()
): Promise<void> {
  const rows = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
  for (const row of rows) {
    if (row.id === except) continue;
    await db.update(sessions).set({ revokedAt: now }).where(eq(sessions.id, row.id));
  }
}

export async function listSessions(db: Database, userId: string): Promise<ActiveSession[]> {
  const rows = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)))
    .orderBy(sessions.createdAt);

  const now = new Date();
  return rows
    .filter((r) => r.idleExpiresAt > now && r.absoluteExpiresAt > now)
    .map((r) => ({
      id: r.id,
      userId: r.userId,
      createdAt: r.createdAt,
      lastSeenAt: r.lastSeenAt,
      idleExpiresAt: r.idleExpiresAt,
      absoluteExpiresAt: r.absoluteExpiresAt,
      userAgent: r.userAgent,
    }));
}

export function setSessionCookie(res: Response, token: string, expires: Date): void {
  res.cookie(cookieName(), token, cookieOptions(expires));
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(cookieName(), { ...cookieOptions(new Date(0)), expires: new Date(0) });
}

export function readSessionCookie(req: Request): string | null {
  const jar = (req as Request & { cookies?: Record<string, string> }).cookies;
  const value = jar?.[cookieName()];
  return typeof value === 'string' && value.length > 0 ? value : null;
}
