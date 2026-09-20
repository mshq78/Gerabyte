import { and, asc, count, desc, eq, ilike, inArray, like, or, sql, type SQL } from 'drizzle-orm';
import type { Database } from '../../db/client.js';
import { memberships, orgNodes, users } from '../../db/schema.js';
import type { MembershipStatus, OrgRankValue, PeopleQuery } from '../../shared/schemas/org.js';
import { PAGE_SIZE } from '../../shared/schemas/common.js';
import type { Scope } from '../policies/scope.js';

/**
 * Every function here takes a `Scope` as its first argument, by design.
 *
 * A caller cannot express "all people" — the type system will not let them. The
 * scope becomes a `path LIKE '<subtree>%'` predicate plus an org_id equality,
 * so cross-organization reads are impossible even if a node id is guessed.
 */

/** Escape a materialized path for safe use as a LIKE prefix. */
function likePrefix(path: string): string {
  return `${path.replace(/([\\%_])/g, '\\$1')}%`;
}

function scopePredicate(scope: Scope): SQL {
  const predicate = and(
    eq(orgNodes.orgId, scope.orgId),
    like(orgNodes.path, likePrefix(scope.nodePath))
  );
  if (!predicate) throw new Error('scope predicate could not be built');
  return predicate;
}

export interface OrgNodeRow {
  id: string;
  parentId: string | null;
  name: string;
  kind: 'org' | 'deputy' | 'unit' | 'group';
  depth: number;
  path: string;
  memberCount: number;
}

/** The subtree the caller may see, with a member count per node. */
export async function listNodes(db: Database, scope: Scope): Promise<OrgNodeRow[]> {
  const rows = await db
    .select({
      id: orgNodes.id,
      parentId: orgNodes.parentId,
      name: orgNodes.name,
      kind: orgNodes.kind,
      depth: orgNodes.depth,
      path: orgNodes.path,
      memberCount: sql<number>`(
        select count(*)::int from ${memberships} m
        where m.node_id = ${orgNodes.id} and m.status <> 'inactive'
      )`,
    })
    .from(orgNodes)
    .where(scopePredicate(scope))
    .orderBy(asc(orgNodes.path));

  return rows;
}

/** Resolve a node the caller named, refusing anything outside their scope. */
export async function findNodeInScope(
  db: Database,
  scope: Scope,
  nodeId: string
): Promise<OrgNodeRow | null> {
  const [row] = await db
    .select({
      id: orgNodes.id,
      parentId: orgNodes.parentId,
      name: orgNodes.name,
      kind: orgNodes.kind,
      depth: orgNodes.depth,
      path: orgNodes.path,
      memberCount: sql<number>`0::int`,
    })
    .from(orgNodes)
    .where(and(scopePredicate(scope), eq(orgNodes.id, nodeId)))
    .limit(1);
  return row ?? null;
}

export interface PersonRow {
  id: string;
  userId: string | null;
  fullName: string;
  nickname: string;
  avatarSeed: string;
  /** Canonical phone. Masked by the DTO layer before it leaves the server. */
  phone: string | null;
  personnelCode: string | null;
  rank: OrgRankValue | null;
  status: MembershipStatus;
  nodeId: string;
  nodeName: string;
  nodePath: string;
  joinedAt: Date;
  lastActiveAt: Date | null;
}

export interface PeopleResult {
  items: PersonRow[];
  total: number;
}

export async function listPeople(
  db: Database,
  scope: Scope,
  query: PeopleQuery
): Promise<PeopleResult> {
  const filters: (SQL | undefined)[] = [scopePredicate(scope), eq(memberships.orgId, scope.orgId)];

  if (query.nodeId) {
    // Narrow further, but only to a node already inside the scope.
    const node = await findNodeInScope(db, scope, query.nodeId);
    if (!node) return { items: [], total: 0 };
    filters.push(like(orgNodes.path, likePrefix(node.path)));
  }
  if (query.status) filters.push(eq(memberships.status, query.status));
  if (query.rank) filters.push(eq(memberships.rank, query.rank));
  if (query.q) {
    const term = `%${query.q.replace(/([\\%_])/g, '\\$1')}%`;
    // Deliberately not searchable by phone or email: matching a field the
    // caller cannot see lets them confirm it by probing.
    filters.push(
      or(
        ilike(users.fullName, term),
        ilike(users.nickname, term),
        ilike(memberships.personnelCode, term)
      )
    );
  }

  const where = and(...filters.filter((f): f is SQL => Boolean(f)));

  const orderColumn =
    query.sort === 'joinedAt'
      ? memberships.joinedAt
      : query.sort === 'unit'
        ? orgNodes.name
        : users.fullName;
  const order = query.dir === 'desc' ? desc(orderColumn) : asc(orderColumn);

  const offset = (query.page - 1) * PAGE_SIZE;

  const items = await db
    .select({
      id: memberships.id,
      userId: memberships.userId,
      fullName: sql<string>`coalesce(${users.fullName}, 'دعوت‌شده')`,
      nickname: sql<string>`coalesce(${users.nickname}, '')`,
      avatarSeed: sql<string>`coalesce(${users.avatarSeed}, '')`,
      phone: sql<string | null>`coalesce(${users.phone}, ${memberships.invitedPhone})`,
      personnelCode: memberships.personnelCode,
      rank: memberships.rank,
      status: memberships.status,
      nodeId: memberships.nodeId,
      nodeName: orgNodes.name,
      nodePath: orgNodes.path,
      joinedAt: memberships.joinedAt,
      lastActiveAt: memberships.lastActiveAt,
    })
    .from(memberships)
    .innerJoin(orgNodes, eq(orgNodes.id, memberships.nodeId))
    .leftJoin(users, eq(users.id, memberships.userId))
    .where(where)
    .orderBy(order, asc(memberships.id))
    .limit(PAGE_SIZE)
    .offset(offset);

  const [totalRow] = await db
    .select({ value: count() })
    .from(memberships)
    .innerJoin(orgNodes, eq(orgNodes.id, memberships.nodeId))
    .leftJoin(users, eq(users.id, memberships.userId))
    .where(where);

  return { items, total: totalRow?.value ?? 0 };
}

/**
 * One person, by membership id, inside the scope.
 *
 * Returns null — not a 403 — for anyone outside it, so the caller cannot use
 * this endpoint to discover that a membership exists elsewhere.
 */
export async function findPersonInScope(
  db: Database,
  scope: Scope,
  membershipId: string
): Promise<PersonRow | null> {
  const [row] = await db
    .select({
      id: memberships.id,
      userId: memberships.userId,
      fullName: sql<string>`coalesce(${users.fullName}, 'دعوت‌شده')`,
      nickname: sql<string>`coalesce(${users.nickname}, '')`,
      avatarSeed: sql<string>`coalesce(${users.avatarSeed}, '')`,
      phone: sql<string | null>`coalesce(${users.phone}, ${memberships.invitedPhone})`,
      personnelCode: memberships.personnelCode,
      rank: memberships.rank,
      status: memberships.status,
      nodeId: memberships.nodeId,
      nodeName: orgNodes.name,
      nodePath: orgNodes.path,
      joinedAt: memberships.joinedAt,
      lastActiveAt: memberships.lastActiveAt,
    })
    .from(memberships)
    .innerJoin(orgNodes, eq(orgNodes.id, memberships.nodeId))
    .leftJoin(users, eq(users.id, memberships.userId))
    .where(
      and(
        scopePredicate(scope),
        eq(memberships.orgId, scope.orgId),
        eq(memberships.id, membershipId)
      )
    )
    .limit(1);

  return row ?? null;
}

/** Node names along a path, for breadcrumbs on the person summary. */
export async function namesForPath(db: Database, scope: Scope, path: string): Promise<string[]> {
  const ids = path.split('/').filter(Boolean);
  if (ids.length === 0) return [];
  const rows = await db
    .select({ id: orgNodes.id, name: orgNodes.name, path: orgNodes.path })
    .from(orgNodes)
    .where(and(eq(orgNodes.orgId, scope.orgId), inArray(orgNodes.id, ids)))
    .orderBy(asc(orgNodes.depth));
  return rows.map((r) => r.name);
}
