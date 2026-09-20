import { OrgUnit, OrgMember, PathAssignment, OrgKpiSummary, OrgRole } from '../../types/org';
import { orgApi as orgHttpApi } from '../orgApi';
import type { OrgNodeDto, OrgPersonDto } from '../../../shared/schemas/org';
import {
  MOCK_ORG_UNITS,
  getMockOrgMembers,
  getMockPathAssignments,
  getMockOrgKpis,
} from '../../mock/org/data';

// Local storage key for persistent org state during session
const STORAGE_KEY_MEMBERS = 'gerabyte_org_members_v2';
const STORAGE_KEY_ASSIGNMENTS = 'gerabyte_org_assignments_v2';

function getStoredMembers(): OrgMember[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MEMBERS);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  const initial = getMockOrgMembers();
  try {
    localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(initial));
  } catch {
    // ignore
  }
  return initial;
}

function saveStoredMembers(members: OrgMember[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(members));
  } catch {
    // ignore
  }
}

function getStoredAssignments(): PathAssignment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ASSIGNMENTS);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  const initial = getMockPathAssignments();
  try {
    localStorage.setItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(initial));
  } catch {
    // ignore
  }
  return initial;
}

function saveStoredAssignments(list: PathAssignment[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(list));
  } catch {
    // ignore
  }
}

/**
 * Adapters from the server DTOs to the shapes the dashboard screens still use.
 *
 * Phase-3 fields (xp, compliance, streaks, certificates, domain mastery) have
 * no server source yet and are filled with neutral placeholders rather than
 * invented numbers, so nothing on screen claims to be real when it is not.
 */
function toOrgUnit(node: OrgNodeDto): OrgUnit {
  return {
    id: node.id,
    name: node.name,
    code: '',
    parentId: node.parentId,
    memberCount: node.memberCount,
    managerName: '',
    managerId: '',
    level: node.depth,
  };
}

function toOrgMember(person: OrgPersonDto): OrgMember {
  return {
    id: person.id,
    fullName: person.fullName,
    nickname: person.nickname,
    avatarSeed: person.avatarSeed,
    // The server never sends an email, and managers must never see one.
    email: '',
    phone: person.phoneMasked,
    unitId: person.nodeId,
    unitName: person.nodeName,
    rank: person.rank ?? 'operator',
    level: 1,
    role: 'learner',
    status: person.status === 'invited' ? 'inactive' : person.status,
    xpTotal: 0,
    streakDays: 0,
    todayCompleted: false,
    totalAssignedLessons: 0,
    completedLessonsCount: 0,
    complianceRate: 0,
    lastActiveAt: person.joinedAt,
    certificatesCount: 0,
    domainMastery: {},
  };
}

export const orgApi = {
  /**
   * REAL: the organization tree comes from the server, already narrowed to the
   * caller's scope. A manager cannot see a node the server did not send.
   */
  async getUnits(): Promise<OrgUnit[]> {
    const tree = await orgHttpApi.tree();
    return tree.items.map(toOrgUnit);
  },

  /**
   * REAL identity, mock progress.
   *
   * The people list, the scope and the masked phones come from the server.
   * XP, compliance and streaks are still mock values keyed by membership id,
   * because the learning engine lands in Phase 3.
   */
  async getMembers(params?: {
    unitId?: string;
    search?: string;
    status?: string;
    role?: string;
  }): Promise<OrgMember[]> {
    const page = await orgHttpApi.people({
      ...(params?.unitId && params.unitId !== 'all' ? { nodeId: params.unitId } : {}),
      ...(params?.search ? { q: params.search } : {}),
      ...(params?.status && params.status !== 'all'
        ? { status: params.status as 'invited' | 'active' | 'inactive' }
        : {}),
    });
    return page.items.map(toOrgMember);
  },

  async getMembersMock(params?: {
    unitId?: string;
    search?: string;
    status?: string;
    role?: string;
  }): Promise<OrgMember[]> {
    let list = getStoredMembers();

    if (params?.unitId && params.unitId !== 'all') {
      list = list.filter((m) => m.unitId === params.unitId);
    }

    if (params?.status && params.status !== 'all') {
      list = list.filter((m) => m.status === params.status);
    }

    if (params?.role && params.role !== 'all') {
      list = list.filter((m) => m.role === params.role);
    }

    if (params?.search) {
      const q = params.search.trim().toLowerCase();
      // Email is never shown in the dashboard, so it is not searchable either:
      // matching on a hidden field lets a manager confirm addresses by probing.
      list = list.filter(
        (m) =>
          m.fullName.toLowerCase().includes(q) ||
          m.nickname.toLowerCase().includes(q) ||
          m.phone.includes(q) ||
          m.unitName.toLowerCase().includes(q)
      );
    }

    return list;
  },

  /** REAL: the server decides whether this person is in the caller's scope. */
  async getMemberById(id: string): Promise<OrgMember | null> {
    try {
      const summary = await orgHttpApi.personSummary(id);
      return toOrgMember(summary);
    } catch {
      // Out of scope, or gone. Either way the caller sees "not found".
      return null;
    }
  },

  async updateMemberRole(id: string, role: OrgRole): Promise<OrgMember> {
    const members = getStoredMembers();
    const idx = members.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error('کاربر سازمانی یافت نشد');
    members[idx].role = role;
    saveStoredMembers(members);
    return members[idx];
  },

  async updateMemberStatus(
    id: string,
    status: 'active' | 'inactive' | 'at_risk'
  ): Promise<OrgMember> {
    const members = getStoredMembers();
    const idx = members.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error('کاربر سازمانی یافت نشد');
    members[idx].status = status;
    saveStoredMembers(members);
    return members[idx];
  },

  async bulkUpdateStatus(
    ids: string[],
    status: 'active' | 'inactive' | 'at_risk'
  ): Promise<number> {
    const members = getStoredMembers();
    let count = 0;
    members.forEach((m) => {
      if (ids.includes(m.id)) {
        m.status = status;
        count++;
      }
    });
    saveStoredMembers(members);
    return count;
  },

  async bulkAssignUnit(ids: string[], unitId: string): Promise<number> {
    const unit = MOCK_ORG_UNITS.find((u) => u.id === unitId);
    if (!unit) throw new Error('واحد سازمانی یافت نشد');

    const members = getStoredMembers();
    let count = 0;
    members.forEach((m) => {
      if (ids.includes(m.id)) {
        m.unitId = unit.id;
        m.unitName = unit.name;
        count++;
      }
    });
    saveStoredMembers(members);
    return count;
  },

  async getAssignments(unitId?: string): Promise<PathAssignment[]> {
    const list = getStoredAssignments();
    if (unitId && unitId !== 'all') {
      return list.filter((a) => a.targetType === 'all' || a.targetId === unitId);
    }
    return list;
  },

  async createAssignment(data: {
    title: string;
    description: string;
    domainId: string;
    domainTitle: string;
    targetType: 'all' | 'unit' | 'individual';
    targetId: string;
    targetName: string;
    mandatory: boolean;
    dueDate: string;
  }): Promise<PathAssignment> {
    const members = getStoredMembers();
    const targetCount =
      data.targetType === 'all'
        ? members.length
        : data.targetType === 'unit'
          ? members.filter((m) => m.unitId === data.targetId).length
          : 1;

    const newAssignment: PathAssignment = {
      id: `asg-${Date.now()}`,
      ...data,
      assignedDate: new Date().toISOString(),
      status: 'active',
      totalAssigned: targetCount,
      completedCount: 0,
      inProgressCount: targetCount,
    };

    const list = getStoredAssignments();
    list.unshift(newAssignment);
    saveStoredAssignments(list);
    return newAssignment;
  },

  async getKpis(unitId: string | 'all' = 'all'): Promise<OrgKpiSummary> {
    return getMockOrgKpis(unitId);
  },

  resetData(): void {
    localStorage.removeItem(STORAGE_KEY_MEMBERS);
    localStorage.removeItem(STORAGE_KEY_ASSIGNMENTS);
  },
};
