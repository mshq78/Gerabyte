import { z } from 'zod';

export const APP_ROLES = ['learner', 'unit_manager', 'org_admin', 'gera_admin'] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const updateMeSchema = z.object({
  fullName: z.string().trim().min(3, 'NAME_TOO_SHORT').max(120).optional(),
  nickname: z.string().trim().min(1).max(60).optional(),
  dailyGoal: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  onboardingCompleted: z.boolean().optional(),
});
export type UpdateMeInput = z.infer<typeof updateMeSchema>;

/** What /api/me returns. An explicit whitelist: never a database row. */
export interface MeDto {
  id: string;
  fullName: string;
  nickname: string;
  avatarSeed: string;
  phoneMasked: string;
  dailyGoal: 1 | 2 | 3;
  onboardingCompleted: boolean;
  hasPassword: boolean;
  roles: AppRole[];
  org: { id: string; name: string } | null;
  membership: {
    nodeId: string;
    nodeName: string;
    nodePath: string[];
    rank: string | null;
    status: 'invited' | 'active' | 'inactive';
  } | null;
  /** Root of the subtree a unit_manager may see; null for every other role. */
  managedNodeId: string | null;
}

export interface SessionDto {
  id: string;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  userAgent: string | null;
  current: boolean;
}
