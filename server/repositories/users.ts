import { and, eq, isNull, or } from 'drizzle-orm';
import type { Database } from '../../db/client.js';
import { credentials, memberships, orgNodes, orgs, userRoles, users } from '../../db/schema.js';
import type { AppRole } from '../../shared/schemas/me.js';
import type { Principal } from '../policies/scope.js';

export interface UserRecord {
  id: string;
  phone: string;
  fullName: string;
  nickname: string;
  avatarSeed: string;
  dailyGoal: number;
  onboardingCompleted: boolean;
  disabledAt: Date | null;
}

export async function findByPhone(db: Database, phone: string): Promise<UserRecord | null> {
  const [row] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  return row ?? null;
}

export async function findById(db: Database, id: string): Promise<UserRecord | null> {
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return row ?? null;
}

/**
 * Create the user row for a phone that just proved ownership, and adopt any
 * membership that was pre-created for it by an import.
 */
export async function createFromPhone(
  db: Database,
  phone: string,
  defaults: { fullName?: string; nickname?: string } = {}
): Promise<UserRecord> {
  const invited = await db
    .select({ id: memberships.id, orgId: memberships.orgId })
    .from(memberships)
    .where(and(eq(memberships.invitedPhone, phone), isNull(memberships.userId)))
    .limit(1);

  const [row] = await db
    .insert(users)
    .values({
      phone,
      fullName: defaults.fullName ?? 'کاربر گرابایت',
      nickname: defaults.nickname ?? 'کاربر',
      avatarSeed: phone.slice(-6),
      dailyGoal: 1,
      onboardingCompleted: false,
    })
    .returning();
  if (!row) throw new Error('failed to create user');

  const invite = invited[0];
  if (invite) {
    await db
      .update(memberships)
      .set({ userId: row.id, status: 'active', updatedAt: new Date() })
      .where(eq(memberships.id, invite.id));
    // An invited member is a learner until someone grants them more.
    await db
      .insert(userRoles)
      .values({ userId: row.id, role: 'learner', orgId: invite.orgId, nodeId: null })
      .onConflictDoNothing();
  }

  return row;
}

export async function getPasswordHash(db: Database, userId: string): Promise<string | null> {
  const [row] = await db
    .select({ hash: credentials.passwordHash })
    .from(credentials)
    .where(eq(credentials.userId, userId))
    .limit(1);
  return row?.hash ?? null;
}

export async function setPasswordHash(
  db: Database,
  userId: string,
  hash: string,
  algorithm: string
): Promise<void> {
  const now = new Date();
  await db
    .insert(credentials)
    .values({ userId, passwordHash: hash, algorithm, passwordUpdatedAt: now })
    .onConflictDoUpdate({
      target: credentials.userId,
      set: {
        passwordHash: hash,
        algorithm,
        passwordUpdatedAt: now,
        updatedAt: now,
        failedAttempts: 0,
        lockedUntil: null,
      },
    });
}

export async function updateProfile(
  db: Database,
  userId: string,
  patch: {
    fullName?: string;
    nickname?: string;
    dailyGoal?: number;
    onboardingCompleted?: boolean;
  }
): Promise<void> {
  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.fullName !== undefined) set.fullName = patch.fullName;
  if (patch.nickname !== undefined) set.nickname = patch.nickname;
  if (patch.dailyGoal !== undefined) set.dailyGoal = patch.dailyGoal;
  if (patch.onboardingCompleted !== undefined) set.onboardingCompleted = patch.onboardingCompleted;
  await db.update(users).set(set).where(eq(users.id, userId));
}

export interface PrincipalContext {
  principal: Principal;
  org: { id: string; name: string } | null;
  membership: {
    nodeId: string;
    nodeName: string;
    nodePath: string;
    rank: string | null;
    status: 'invited' | 'active' | 'inactive';
  } | null;
}

/**
 * Assemble everything the authorization layer needs for a user in one place:
 * roles, the organization they act in, their membership node, and the two
 * materialized paths a Scope is built from.
 */
export async function loadPrincipal(db: Database, userId: string): Promise<PrincipalContext> {
  const roleRows = await db
    .select({ role: userRoles.role, orgId: userRoles.orgId, nodeId: userRoles.nodeId })
    .from(userRoles)
    .where(eq(userRoles.userId, userId));

  const roles = [...new Set(roleRows.map((r) => r.role))] as AppRole[];
  const orgId = roleRows.find((r) => r.orgId)?.orgId ?? null;

  const [membershipRow] = await db
    .select({
      nodeId: memberships.nodeId,
      nodeName: orgNodes.name,
      nodePath: orgNodes.path,
      rank: memberships.rank,
      status: memberships.status,
      orgId: memberships.orgId,
      orgName: orgs.name,
    })
    .from(memberships)
    .innerJoin(orgNodes, eq(orgNodes.id, memberships.nodeId))
    .innerJoin(orgs, eq(orgs.id, memberships.orgId))
    .where(eq(memberships.userId, userId))
    .limit(1);

  const effectiveOrgId = orgId ?? membershipRow?.orgId ?? null;

  let orgRootNodeId: string | null = null;
  let orgRootNodePath: string | null = null;
  let orgName: string | null = membershipRow?.orgName ?? null;

  if (effectiveOrgId) {
    const [root] = await db
      .select({ id: orgNodes.id, path: orgNodes.path, name: orgs.name })
      .from(orgNodes)
      .innerJoin(orgs, eq(orgs.id, orgNodes.orgId))
      .where(and(eq(orgNodes.orgId, effectiveOrgId), eq(orgNodes.depth, 0)))
      .limit(1);
    orgRootNodeId = root?.id ?? null;
    orgRootNodePath = root?.path ?? null;
    orgName = orgName ?? root?.name ?? null;
  }

  const managerGrant = roleRows.find((r) => r.role === 'unit_manager' && r.nodeId);
  let managedNodeId: string | null = managerGrant?.nodeId ?? null;
  let managedNodePath: string | null = null;
  if (managedNodeId) {
    const [node] = await db
      .select({ path: orgNodes.path })
      .from(orgNodes)
      .where(eq(orgNodes.id, managedNodeId))
      .limit(1);
    managedNodePath = node?.path ?? null;
    if (!managedNodePath) managedNodeId = null;
  }

  return {
    principal: {
      userId,
      roles,
      orgId: effectiveOrgId,
      managedNodeId,
      managedNodePath,
      orgRootNodeId,
      orgRootNodePath,
    },
    org: effectiveOrgId && orgName ? { id: effectiveOrgId, name: orgName } : null,
    membership: membershipRow
      ? {
          nodeId: membershipRow.nodeId,
          nodeName: membershipRow.nodeName,
          nodePath: membershipRow.nodePath,
          rank: membershipRow.rank,
          status: membershipRow.status,
        }
      : null,
  };
}

/** True when a phone has either a user row or an open invitation. */
export async function phoneIsKnown(db: Database, phone: string): Promise<boolean> {
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.phone, phone))
    .limit(1);
  if (row) return true;
  const [invite] = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(or(eq(memberships.invitedPhone, phone)))
    .limit(1);
  return Boolean(invite);
}
