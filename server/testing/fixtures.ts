import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import * as schema from '../../db/schema';
import { normalizePhone } from '../../shared/schemas/common';
import { hashPassword } from '../services/password';
import { db } from './harness';

export const TEST_PASSWORD = 'test-password-1404';

export interface SeededOrg {
  orgId: string;
  nodes: Record<string, { id: string; path: string }>;
}

/**
 * Build an organization tree. `spec` maps a key to its parent key (or null for
 * the root), so a test can describe just the shape it needs.
 */
export async function createOrg(
  name: string,
  slug: string,
  spec: { key: string; parent: string | null; kind?: 'org' | 'deputy' | 'unit' }[]
): Promise<SeededOrg> {
  const [org] = await db().insert(schema.orgs).values({ name, slug }).returning();
  if (!org) throw new Error('failed to create org');

  const nodes: SeededOrg['nodes'] = {};
  for (const node of spec) {
    const id = randomUUID();
    const parent = node.parent ? nodes[node.parent] : undefined;
    if (node.parent && !parent) throw new Error(`parent ${node.parent} must be declared first`);
    const path = parent ? `${parent.path}${id}/` : `/${id}/`;
    const depth = parent ? path.split('/').filter(Boolean).length - 1 : 0;

    await db()
      .insert(schema.orgNodes)
      .values({
        id,
        orgId: org.id,
        parentId: parent?.id ?? null,
        kind: node.kind ?? (node.parent ? 'unit' : 'org'),
        name: node.key,
        path,
        depth,
      });
    nodes[node.key] = { id, path };
  }

  return { orgId: org.id, nodes };
}

export interface SeededUser {
  userId: string;
  membershipId: string;
  phone: string;
}

export async function createMember(
  org: SeededOrg,
  options: {
    phone: string;
    fullName?: string;
    nodeKey: string;
    roles?: { role: 'learner' | 'unit_manager' | 'org_admin' | 'gera_admin'; nodeKey?: string }[];
    withPassword?: boolean;
    personnelCode?: string;
  }
): Promise<SeededUser> {
  const phone = normalizePhone(options.phone);
  if (!phone) throw new Error(`bad fixture phone: ${options.phone}`);
  const node = org.nodes[options.nodeKey];
  if (!node) throw new Error(`unknown node ${options.nodeKey}`);

  const [user] = await db()
    .insert(schema.users)
    .values({
      phone,
      fullName: options.fullName ?? 'کاربر آزمایشی',
      nickname: 'آزمایشی',
      avatarSeed: phone.slice(-6),
      dailyGoal: 1,
      onboardingCompleted: true,
    })
    .returning();
  if (!user) throw new Error('failed to create user');

  if (options.withPassword) {
    await db()
      .insert(schema.credentials)
      .values({
        userId: user.id,
        passwordHash: await hashPassword(TEST_PASSWORD),
        algorithm: 'argon2id',
        passwordUpdatedAt: new Date(),
      });
  }

  const [membership] = await db()
    .insert(schema.memberships)
    .values({
      userId: user.id,
      orgId: org.orgId,
      nodeId: node.id,
      invitedPhone: phone,
      personnelCode: options.personnelCode ?? phone.slice(-5),
      rank: 'operator',
      status: 'active',
      lastActiveAt: new Date(),
    })
    .returning({ id: schema.memberships.id });
  if (!membership) throw new Error('failed to create membership');

  for (const grant of options.roles ?? [{ role: 'learner' as const }]) {
    const grantNode = grant.nodeKey ? org.nodes[grant.nodeKey] : undefined;
    if (grant.nodeKey && !grantNode) throw new Error(`unknown grant node ${grant.nodeKey}`);
    await db()
      .insert(schema.userRoles)
      .values({
        userId: user.id,
        role: grant.role,
        orgId: grant.role === 'gera_admin' ? null : org.orgId,
        nodeId: grantNode?.id ?? null,
      });
  }

  return { userId: user.id, membershipId: membership.id, phone };
}

/** A membership with no user row yet, as a bulk import leaves it. */
export async function createInvite(
  org: SeededOrg,
  options: { phone: string; nodeKey: string; personnelCode?: string }
): Promise<{ membershipId: string; phone: string }> {
  const phone = normalizePhone(options.phone);
  if (!phone) throw new Error(`bad fixture phone: ${options.phone}`);
  const node = org.nodes[options.nodeKey];
  if (!node) throw new Error(`unknown node ${options.nodeKey}`);

  const [membership] = await db()
    .insert(schema.memberships)
    .values({
      userId: null,
      orgId: org.orgId,
      nodeId: node.id,
      invitedPhone: phone,
      personnelCode: options.personnelCode ?? phone.slice(-5),
      rank: 'expert',
      status: 'invited',
    })
    .returning({ id: schema.memberships.id });
  if (!membership) throw new Error('failed to create invite');
  return { membershipId: membership.id, phone };
}

export async function findUserByPhone(phone: string) {
  const normalized = normalizePhone(phone);
  if (!normalized) throw new Error('bad phone');
  const [row] = await db()
    .select()
    .from(schema.users)
    .where(eq(schema.users.phone, normalized))
    .limit(1);
  return row ?? null;
}
