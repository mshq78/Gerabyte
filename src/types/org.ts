import { Level, OrgRank, Prize } from './domain';

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

export type OrgScope = 'all' | { unitId: string; unitName?: string; includeChildren?: boolean };

export type ChallengeRequestStatus =
  | 'draft'
  | 'submitted'
  | 'in_review'
  | 'needs_changes'
  | 'approved'
  | 'rejected'
  | 'active'
  | 'ended';

export interface ChallengeRequest {
  id: string;
  title: string;
  objective: string;
  target: OrgScope;
  levelFilter?: Level[];
  goal: { type: 'lessons' | 'xp' | 'streak' | 'exam'; target: number };
  startsAt: string;
  endsAt: string;
  suggestedPrize?: string;
  notes?: string;
  status: ChallengeRequestStatus;
  requestedByName: string;
  estimatedParticipants: number;
  timeline: { at: string; status: ChallengeRequestStatus; byName: string; comment?: string }[];
  approvedPrize?: Prize;
  winnersRule?: string; // defined by Gera on approval
  live?: { joined: number; completed: number };
  result?: { participants: number; completed: number; winners: { name: string; unit: string }[] };
}

export interface ImportRowError {
  row: number;
  column: string;
  message: string;
  hint?: string;
}

export interface ImportJob {
  id: string;
  fileName: string;
  rowCount: number;
  validRows: number;
  errorRows: number;
  status: 'validating' | 'ready' | 'importing' | 'done' | 'failed';
  errors: ImportRowError[];
  options: {
    autoCreateNodes: boolean;
    sponsorship?: { months: number; startsAt: string };
    sendInviteSms: boolean;
  };
  result?: { added: number; updated: number; skipped: number; failed: number };
}

export interface SeatSummary {
  purchased: number;
  sponsoredActive: number;
  expiring14d: number;
  expired: number;
  convertedPersonal: number;
  unassigned: number;
}

export interface EffectivenessReport {
  l1: { avgRating: number; responses: number; byDomain: { domainId: string; avg: number }[] };
  l2: { preAvgPct: number; postAvgPct: number; improvementPct: number; sample: number };
  l3: { surveyResponseRatePct: number; items: { text: string; avg: number }[] }; // manager survey, Likert 1–5
  l4: { kpis: { id: string; name: string; unit: string; before: number; after: number; higherIsBetter: boolean }[] };
}

export interface OrgCertificateItem {
  serial: string;
  title: string;
  domainTitle: string;
  holderId: string;
  holderName: string;
  unitId: string;
  unitName: string;
  issuedAt: string;
  scorePct: number;
  pathName: string;
}

export interface OrgRenewalRequest {
  id: string;
  requestedAt: string;
  seatsCount: number;
  durationMonths: number;
  status: 'pending' | 'approved' | 'invoiced';
  requestedByName: string;
}

export interface OrgReminderPolicy {
  maxRemindersPerDay: number;
  quietHoursStart: string;
  quietHoursEnd: string;
  autoNudgeInactiveDays: number;
}
