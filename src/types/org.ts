import { Level, OrgRank } from './domain';

export type OrgRole = 'org_admin' | 'unit_manager' | 'learner';

export interface OrgUnit {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
  memberCount: number;
  managerName: string;
  managerId: string;
  level: number; // Hierarchy depth (0 = top-level organization, 1 = department, 2 = sub-unit)
}

export interface OrgMember {
  id: string;
  fullName: string;
  nickname: string;
  avatarSeed: string;
  email: string;
  phone: string;
  unitId: string;
  unitName: string;
  rank: OrgRank;
  level: Level;
  role: OrgRole;
  status: 'active' | 'inactive' | 'at_risk';
  xpTotal: number;
  streakDays: number;
  todayCompleted: boolean;
  totalAssignedLessons: number;
  completedLessonsCount: number;
  complianceRate: number; // 0 to 100
  lastActiveAt: string;
  certificatesCount: number;
  domainMastery: Record<string, number>; // domainId -> score (0-100)
}

export interface PathAssignment {
  id: string;
  title: string;
  description: string;
  domainId: string;
  domainTitle: string;
  targetType: 'all' | 'unit' | 'individual';
  targetId: string;
  targetName: string;
  mandatory: boolean;
  assignedDate: string;
  dueDate: string;
  status: 'active' | 'completed' | 'overdue';
  totalAssigned: number;
  completedCount: number;
  inProgressCount: number;
}

export interface OrgKpiSummary {
  totalMembers: number;
  activeThisWeek: number;
  complianceRate: number;
  avgDailyMinutes: number;
  avgStreakDays: number;
  totalCertificatesEarned: number;
  atRiskLearnersCount: number;
  weeklyTrend: {
    dayName: string;
    completedLessons: number;
    activeLearners: number;
  }[];
  domainStats: {
    domainId: string;
    domainTitle: string;
    avgScore: number;
    completionRate: number;
    colorToken: string;
  }[];
  unitRankings: {
    unitId: string;
    unitName: string;
    memberCount: number;
    completionRate: number;
    avgStreak: number;
  }[];
}

export interface ScopeContextType {
  currentOrg: { id: string; name: string };
  userRole: OrgRole;
  availableRoles: OrgRole[];
  setUserRole: (role: OrgRole) => void;
  selectedUnitId: string | 'all';
  setSelectedUnitId: (unitId: string | 'all') => void;
  units: OrgUnit[];
  canManageAllUnits: boolean;
  effectiveUnitId: string | 'all';
}
