import { z } from 'zod';
import { paginationSchema } from './common';

export const ORG_NODE_KINDS = ['org', 'deputy', 'unit', 'group'] as const;
export type OrgNodeKind = (typeof ORG_NODE_KINDS)[number];

export const MEMBERSHIP_STATUSES = ['invited', 'active', 'inactive'] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

export const ORG_RANKS = [
  'operator',
  'expert',
  'supervisor',
  'middle_manager',
  'senior_manager',
] as const;
export type OrgRankValue = (typeof ORG_RANKS)[number];

export const peopleQuerySchema = paginationSchema.extend({
  q: z.string().trim().max(120).optional(),
  nodeId: z.uuid().optional(),
  status: z.enum(MEMBERSHIP_STATUSES).optional(),
  rank: z.enum(ORG_RANKS).optional(),
  sort: z.enum(['name', 'joinedAt', 'unit']).default('name'),
  dir: z.enum(['asc', 'desc']).default('asc'),
});
export type PeopleQuery = z.infer<typeof peopleQuerySchema>;

/** A node of the org tree, as returned to a manager. */
export interface OrgNodeDto {
  id: string;
  parentId: string | null;
  name: string;
  kind: OrgNodeKind;
  depth: number;
  memberCount: number;
}

/**
 * A person as a manager sees them. Phones are masked here, on the server; the
 * raw number never leaves the database for a manager-facing route.
 */
export interface OrgPersonDto {
  id: string;
  fullName: string;
  nickname: string;
  avatarSeed: string;
  phoneMasked: string;
  personnelCode: string | null;
  rank: OrgRankValue | null;
  status: MembershipStatus;
  nodeId: string;
  nodeName: string;
  joinedAt: string;
}

/** The person summary a manager may open. No coins, rewards or personal paths. */
export interface OrgPersonSummaryDto extends OrgPersonDto {
  nodePath: string[];
  lastActiveAt: string | null;
  /** Scope reminder rendered on the report. */
  scopeNote: string;
}

export const SCOPE_NOTE = 'این گزارش فقط مسیرهای تخصیصی سازمان را شامل می‌شود.';
