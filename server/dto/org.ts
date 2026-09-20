import { maskPhoneE164 } from '../../shared/schemas/common.js';
import {
  SCOPE_NOTE,
  type OrgNodeDto,
  type OrgPersonDto,
  type OrgPersonSummaryDto,
} from '../../shared/schemas/org.js';
import type { OrgNodeRow, PersonRow } from '../repositories/org.js';

/**
 * Explicit whitelists again. The phone is masked here, on the server, so the
 * raw number never reaches a manager even if a repository selects it.
 */
export function toOrgNodeDto(row: OrgNodeRow): OrgNodeDto {
  return {
    id: row.id,
    parentId: row.parentId,
    name: row.name,
    kind: row.kind,
    depth: row.depth,
    memberCount: row.memberCount,
  };
}

export function toOrgPersonDto(row: PersonRow): OrgPersonDto {
  return {
    id: row.id,
    fullName: row.fullName,
    nickname: row.nickname,
    avatarSeed: row.avatarSeed,
    phoneMasked: row.phone ? maskPhoneE164(row.phone) : '',
    personnelCode: row.personnelCode,
    rank: row.rank,
    status: row.status,
    nodeId: row.nodeId,
    nodeName: row.nodeName,
    joinedAt: row.joinedAt.toISOString(),
  };
}

/**
 * The manager-facing person summary.
 *
 * Carries progress-shaped fields only. Coins, rewards, personal (non-assigned)
 * paths and email are not in the type, so they cannot be added by accident.
 */
export function toOrgPersonSummaryDto(row: PersonRow, nodePath: string[]): OrgPersonSummaryDto {
  return {
    ...toOrgPersonDto(row),
    nodePath,
    lastActiveAt: row.lastActiveAt ? row.lastActiveAt.toISOString() : null,
    scopeNote: SCOPE_NOTE,
  };
}
