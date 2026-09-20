import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const appRoleEnum = pgEnum('app_role', [
  'learner',
  'unit_manager',
  'org_admin',
  'gera_admin',
]);

export const orgNodeKindEnum = pgEnum('org_node_kind', ['org', 'deputy', 'unit', 'group']);

export const membershipStatusEnum = pgEnum('membership_status', ['invited', 'active', 'inactive']);

export const orgRankEnum = pgEnum('org_rank', [
  'operator',
  'expert',
  'supervisor',
  'middle_manager',
  'senior_manager',
]);

/**
 * A person. The phone is the identity: normalized to +989XXXXXXXXX and unique.
 * It is the only PII stored here, and it never leaves the server unmasked for a
 * manager-facing route.
 */
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    phone: text('phone').notNull(),
    fullName: text('full_name').notNull(),
    nickname: text('nickname').notNull(),
    avatarSeed: text('avatar_seed').notNull(),
    dailyGoal: smallint('daily_goal').notNull().default(1),
    onboardingCompleted: boolean('onboarding_completed').notNull().default(false),
    disabledAt: timestamp('disabled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('users_phone_key').on(t.phone)]
);

/** Password material, separate from the user row so it is never selected by accident. */
export const credentials = pgTable(
  'credentials',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    passwordHash: text('password_hash'),
    /** Which KDF produced the hash, so we can migrate algorithms later. */
    algorithm: text('algorithm').notNull().default('argon2id'),
    failedAttempts: integer('failed_attempts').notNull().default(0),
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
    passwordUpdatedAt: timestamp('password_updated_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('credentials_locked_until_idx').on(t.lockedUntil)]
);

/**
 * A one-time code in flight. Only the HMAC of (phone|code|codeId) is stored, so
 * a database leak does not hand over live codes.
 */
export const otpCodes = pgTable(
  'otp_codes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    phone: text('phone').notNull(),
    codeHash: text('code_hash').notNull(),
    attempts: smallint('attempts').notNull().default(0),
    maxAttempts: smallint('max_attempts').notNull().default(5),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('otp_codes_phone_created_idx').on(t.phone, t.createdAt),
    index('otp_codes_expires_idx').on(t.expiresAt),
  ]
);

/**
 * An opaque server-side session. The cookie carries a random token; only its
 * HMAC is stored, so the table cannot be replayed if it leaks. Sessions expire
 * on idle (14d) and absolutely (60d), and can be revoked individually.
 */
export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    userAgent: text('user_agent'),
    ipHash: text('ip_hash'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
    /** Idle deadline; slides forward as the session is used. */
    idleExpiresAt: timestamp('idle_expires_at', { withTimezone: true }).notNull(),
    /** Hard deadline; never moves. */
    absoluteExpiresAt: timestamp('absolute_expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('sessions_token_hash_key').on(t.tokenHash),
    index('sessions_user_idx').on(t.userId),
    index('sessions_idle_expires_idx').on(t.idleExpiresAt),
  ]
);

/** Sliding-window counters, keyed by bucket (phone or IP) and action. */
export const rateLimits = pgTable(
  'rate_limits',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    bucket: text('bucket').notNull(),
    action: text('action').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('rate_limits_lookup_idx').on(t.action, t.bucket, t.occurredAt)]
);

/**
 * Append-only. The application role has INSERT and SELECT but not UPDATE or
 * DELETE — see the migration that revokes them.
 */
export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    targetType: text('target_type'),
    targetId: text('target_id'),
    orgId: uuid('org_id').references(() => orgs.id, { onDelete: 'set null' }),
    /** Hashed with IP_HASH_SECRET; the raw address is never stored. */
    ipHash: text('ip_hash'),
    requestId: text('request_id'),
    metadata: jsonb('metadata'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('audit_log_actor_idx').on(t.actorUserId, t.occurredAt),
    index('audit_log_org_idx').on(t.orgId, t.occurredAt),
    index('audit_log_action_idx').on(t.action, t.occurredAt),
  ]
);

export const orgs = pgTable(
  'orgs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('orgs_slug_key').on(t.slug)]
);

/**
 * The organization tree. `path` is a materialized path of node ids joined by
 * '/', with a leading and trailing slash, so a subtree is a single indexed
 * prefix query: path LIKE '<ancestor path>%'.
 */
export const orgNodes = pgTable(
  'org_nodes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    parentId: uuid('parent_id'),
    kind: orgNodeKindEnum('kind').notNull().default('unit'),
    name: text('name').notNull(),
    code: text('code'),
    path: text('path').notNull(),
    depth: smallint('depth').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('org_nodes_org_idx').on(t.orgId),
    index('org_nodes_parent_idx').on(t.parentId),
    // text_pattern_ops makes LIKE 'prefix%' an index range scan.
    index('org_nodes_path_prefix_idx').using('btree', sql`${t.path} text_pattern_ops`),
  ]
);

export const memberships = pgTable(
  'memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    orgId: uuid('org_id')
      .notNull()
      .references(() => orgs.id, { onDelete: 'cascade' }),
    nodeId: uuid('node_id')
      .notNull()
      .references(() => orgNodes.id, { onDelete: 'restrict' }),
    /** Set for invited members before their first login links a user row. */
    invitedPhone: text('invited_phone'),
    personnelCode: text('personnel_code'),
    rank: orgRankEnum('rank'),
    status: membershipStatusEnum('status').notNull().default('invited'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('memberships_org_node_idx').on(t.orgId, t.nodeId),
    index('memberships_user_idx').on(t.userId),
    index('memberships_invited_phone_idx').on(t.invitedPhone),
    uniqueIndex('memberships_org_personnel_code_key')
      .on(t.orgId, t.personnelCode)
      .where(sql`personnel_code is not null`),
    unique('memberships_user_org_key').on(t.userId, t.orgId),
  ]
);

/**
 * A role grant. `orgId` scopes org roles; `nodeId` further scopes a
 * unit_manager to one subtree. gera_admin carries neither.
 */
export const userRoles = pgTable(
  'user_roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: appRoleEnum('role').notNull(),
    orgId: uuid('org_id').references(() => orgs.id, { onDelete: 'cascade' }),
    nodeId: uuid('node_id').references(() => orgNodes.id, { onDelete: 'cascade' }),
    grantedAt: timestamp('granted_at', { withTimezone: true }).notNull().defaultNow(),
    grantedByUserId: uuid('granted_by_user_id'),
  },
  (t) => [
    index('user_roles_user_idx').on(t.userId),
    index('user_roles_org_idx').on(t.orgId),
    // NULLS NOT DISTINCT so a second gera_admin grant (org_id/node_id null)
    // collides instead of silently duplicating.
    unique('user_roles_unique_grant').on(t.userId, t.role, t.orgId, t.nodeId).nullsNotDistinct(),
  ]
);

export const usersRelations = relations(users, ({ one, many }) => ({
  credentials: one(credentials, { fields: [users.id], references: [credentials.userId] }),
  memberships: many(memberships),
  roles: many(userRoles),
  sessions: many(sessions),
}));

export const orgsRelations = relations(orgs, ({ many }) => ({
  nodes: many(orgNodes),
  memberships: many(memberships),
}));

export const orgNodesRelations = relations(orgNodes, ({ one, many }) => ({
  org: one(orgs, { fields: [orgNodes.orgId], references: [orgs.id] }),
  parent: one(orgNodes, { fields: [orgNodes.parentId], references: [orgNodes.id] }),
  memberships: many(memberships),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, { fields: [memberships.userId], references: [users.id] }),
  org: one(orgs, { fields: [memberships.orgId], references: [orgs.id] }),
  node: one(orgNodes, { fields: [memberships.nodeId], references: [orgNodes.id] }),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, { fields: [userRoles.userId], references: [users.id] }),
  org: one(orgs, { fields: [userRoles.orgId], references: [orgs.id] }),
  node: one(orgNodes, { fields: [userRoles.nodeId], references: [orgNodes.id] }),
}));
