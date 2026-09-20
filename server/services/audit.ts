import type { Database } from '../../db/client.js';
import { auditLog } from '../../db/schema.js';
import { logger } from '../logger.js';

/**
 * Every action worth reconstructing later. Adding a case here is cheaper than
 * wishing you had it during an incident.
 */
export const AUDIT_ACTIONS = [
  'auth.otp.requested',
  'auth.otp.verified',
  'auth.otp.failed',
  'auth.login.succeeded',
  'auth.login.failed',
  'auth.logout',
  'auth.password.set',
  'auth.password.locked',
  'session.revoked',
  'role.granted',
  'role.revoked',
  'org.person.viewed',
  'org.people.exported',
  'org.import.completed',
  'org.challenge.approved',
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export interface AuditEntry {
  action: AuditAction;
  actorUserId?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  orgId?: string | null;
  ipHash?: string | null;
  requestId?: string | null;
  /** Never put a phone, a code or a token in here. */
  metadata?: Record<string, unknown> | null;
}

/**
 * Append one row. Auditing must never break the request it is recording, so a
 * write failure is logged and swallowed rather than surfaced.
 */
export async function record(db: Database, entry: AuditEntry): Promise<void> {
  try {
    await db.insert(auditLog).values({
      action: entry.action,
      actorUserId: entry.actorUserId ?? null,
      targetType: entry.targetType ?? null,
      targetId: entry.targetId ?? null,
      orgId: entry.orgId ?? null,
      ipHash: entry.ipHash ?? null,
      requestId: entry.requestId ?? null,
      metadata: entry.metadata ?? null,
    });
  } catch (error) {
    logger.error(
      { action: entry.action, err: error instanceof Error ? error.message : String(error) },
      'audit write failed'
    );
  }
}
