export type Level = 1 | 2 | 3 | 4 | 5; // ۱: آغازگر، ۲: کوشا، ۳: ماهر، ۴: پیشرو، ۵: الهام‌بخش
export type LevelSource = 'org_rank' | 'placement_test' | 'ai_suggestion' | 'manager_override';
export type OrgRank = 'operator' | 'expert' | 'supervisor' | 'middle_manager' | 'senior_manager';

export interface OrgMembership {
  orgId: string;
  orgName: string;
  orgRank: OrgRank;
  nodePath: string[]; // e.g. ['فولاد نمونه', 'معاونت تولید', 'واحد نورد', 'گروه ۲']
}

export interface User {
  id: string;
  fullName: string;
  nickname: string;
  avatarSeed: string;
  phone: string;
  accountType: 'org_member' | 'individual';
  level: Level;
  levelSource: LevelSource;
  aiSuggestedLevel?: {
    level: Level;
    reasons: string[];
    confidence: number;
  };
  xpTotal: number;
  coins: number;
  streakDays: number;
  bestStreak: number;
  dailyGoal: 1 | 2 | 3; // gerabytes per day
  todayCompletedCount: number;
  membership?: OrgMembership; // undefined for individuals
  householdId?: string; // reserved for phase 2 (family accounts), no UI yet
  onboardingCompleted: boolean;
}

export interface Subscription {
  tier: 'free' | 'full';
  source: 'none' | 'personal' | 'org_sponsored';
  sponsorOrgName?: string;
  startsAt?: string;
  endsAt?: string; // ISO
  status: 'active' | 'expiring' | 'expired'; // expiring = 14 days or less
  remainingDays?: number;
}

export interface Entitlements {
  dailyLessonLimit: number | null;
  paidLessonsUnlocked: boolean;
  canEarnCoins: boolean;
  canJoinPrizeChallenges: boolean;
  canTakeCertificateExams: boolean;
}

export interface Domain {
  id: string;
  title: string;
  subtitle: string;
  colorToken: string;
  lightColorToken: string;
  icon: string;
  unitsCount: number;
  totalLessons: number;
}

export interface LearningPath {
  id: string;
  domainId: string;
  title: string;
  levelRange: [Level, Level];
  units: Unit[];
  certificateExamId?: string;
}

export interface Unit {
  id: string;
  title: string;
  summary: string;
  lessons: LessonSummary[];
  checkpointExamId: string;
  order: number;
}

export interface LessonSummary {
  id: string;
  title: string;
  minutes: number;
  xp: number;
  isFree: boolean;
  status: 'locked' | 'available' | 'in_progress' | 'done' | 'paywalled';
  completedAt?: string;
}

// Lesson Cards
export interface BaseCard {
  id: string;
  title?: string;
}

export interface TextCard extends BaseCard {
  type: 'text';
  headline: string;
  content: string[];
  keyTakeaway?: string;
}

export interface VideoCard extends BaseCard {
  type: 'video';
  title: string;
  durationSeconds: number;
  posterTitle: string;
  description: string;
  keyPoints: string[];
}

export interface AudioCard extends BaseCard {
  type: 'audio';
  title: string;
  speaker: string;
  durationSeconds: number;
  waveformSeed: number[];
  transcript: string;
}

export interface InfographicCard extends BaseCard {
  type: 'infographic';
  title: string;
  caption: string;
  items: {
    iconName: string;
    title: string;
    desc: string;
  }[];
}

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  category?: string;
}

export interface FlashcardSet extends BaseCard {
  type: 'flashcards';
  instruction: string;
  cards: FlashcardItem[];
}

export interface ScenarioOption {
  id: string;
  text: string;
  consequence: string;
  isOptimal: boolean;
  feedback: string;
}

export interface ScenarioCard extends BaseCard {
  type: 'scenario';
  situation: string;
  roleContext: string;
  options: ScenarioOption[];
  takeaway: string;
}

export type QuestionKind = 'single' | 'multi' | 'true_false' | 'ordering' | 'scenario';

export interface QuizCard extends BaseCard {
  type: 'quiz';
  kind: QuestionKind;
  prompt: string;
  options: { id: string; text: string }[];
  correctIds: string[];
  explanation: string;
  weight: 1 | 2;
}

export type LessonCard =
  | TextCard
  | VideoCard
  | AudioCard
  | InfographicCard
  | FlashcardSet
  | ScenarioCard
  | QuizCard;

export interface Lesson {
  id: string;
  unitId: string;
  domainId: string;
  title: string;
  estimatedMinutes: number;
  xpReward: number;
  cards: LessonCard[];
}

export interface Question {
  id: string;
  kind: QuestionKind;
  prompt: string;
  options: { id: string; text: string }[];
  correctIds: string[];
  explanation: string;
  weight: 1 | 2;
}

export interface Exam {
  id: string;
  title: string;
  targetDomainTitle: string;
  poolSize: number;
  drawCount: number;
  passMarkPct: number;
  maxAttempts: number;
  cooldownHours: number;
  attemptsUsed: number;
  nextAttemptAt?: string;
  isCertificate: boolean;
  questions: Question[];
}

export type LeagueTier = 'byte' | 'kilobyte' | 'megabyte' | 'gigabyte' | 'terabyte';

export interface LeagueEntry {
  rank: number;
  userId: string;
  displayName: string;
  unitLabel?: string;
  avatarSeed: string;
  weeklyXp: number;
  isMe: boolean;
  movement?: 'up' | 'down' | 'same';
}

export interface LeagueBoard {
  scope: 'org' | 'public';
  tier: LeagueTier;
  tierTitle: string;
  weekEndsAt: string;
  promoteTop: number;
  demoteBottom: number;
  entries: LeagueEntry[];
  myRank: number;
}

export interface TeamBoardEntry {
  rank: number;
  nodeName: string;
  avgWeeklyXp: number;
  participationPct: number;
  membersCount: number;
}

export interface Prize {
  title: string;
  description: string;
  winnersCount: number;
  provider: 'gera' | 'org';
  valueTag?: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  origin: 'gera' | 'org_requested';
  requestedBy?: string; // manager name, approved by Gera
  startsAt: string;
  endsAt: string;
  goal: {
    type: 'lessons' | 'xp' | 'streak' | 'exam';
    target: number;
  };
  prize: Prize;
  state: 'available' | 'joined' | 'completed' | 'expired';
  progress: number;
  participants: number;
  top: LeagueEntry[];
  requiresFullPlan: boolean;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  costCoins: number;
  provider: 'gera' | 'org';
  stock: number;
  artSeed: string;
  category: 'voucher' | 'book' | 'merch' | 'course';
}

export interface RedeemedReward {
  id: string;
  rewardId: string;
  title: string;
  redeemedAt: string;
  voucherCode: string;
  costCoins: number;
  provider: 'gera' | 'org';
  status: 'valid' | 'used';
}

export interface Certificate {
  serial: string;
  title: string;
  domainTitle: string;
  issuedAt: string;
  scorePct: number;
  holderName: string;
  verifyPath: string;
  examId: string;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  category: 'streak' | 'xp' | 'league' | 'exam' | 'special';
}

export interface NotificationPrefs {
  channels: Record<'push' | 'sms' | 'bale' | 'eitaa' | 'telegram' | 'email', boolean>;
  dailyReminderTime: string;
  quietHours: [string, string];
  dailyCap: number;
}

export interface AppNotification {
  id: string;
  kind: 'reminder' | 'league' | 'challenge' | 'reward' | 'system';
  title: string;
  body: string;
  at: string;
  read: boolean;
  link?: string;
}
