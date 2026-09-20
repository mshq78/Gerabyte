import type { MeDto } from '../../shared/schemas/me';
import type { OrgNodeDto, OrgPersonDto } from '../../shared/schemas/org';

/**
 * Seed data for design mode, shaped exactly like the real DTOs in `shared/`.
 *
 * A designer needs states, not a database: a learner on their first day, one
 * deep into a streak, a manager with a subtree, an admin with a whole
 * organization. Everything here is invented; none of it resembles a real
 * person.
 */
export const DESIGN_PERSONA_IDS = [
  'new-learner',
  'active-learner',
  'free-individual',
  'unit-manager',
  'org-admin',
] as const;

export type DesignPersonaId = (typeof DESIGN_PERSONA_IDS)[number];

export interface DesignPersona {
  id: DesignPersonaId;
  label: string;
  description: string;
  me: MeDto;
}

const ORG = { id: 'org-foolad', name: 'مجتمع فولاد نمونه' };

const ROOT_NODE = 'node-root';
const DEPUTY_NODE = 'node-deputy';
const UNIT_NODE = 'node-unit';
const CASTING_NODE = 'node-casting';

function base(overrides: Partial<MeDto>): MeDto {
  return {
    id: 'design-user',
    fullName: 'کاربر نمونه',
    nickname: 'نمونه',
    avatarSeed: 'design-1',
    phoneMasked: '۰۹۱۲***۰۰۰۱',
    dailyGoal: 2,
    onboardingCompleted: true,
    hasPassword: true,
    roles: ['learner'],
    org: ORG,
    membership: {
      nodeId: UNIT_NODE,
      nodeName: 'واحد نورد گرم و مقاطع',
      nodePath: ['مجتمع فولاد نمونه', 'معاونت تولید و عملیات', 'واحد نورد گرم و مقاطع'],
      rank: 'operator',
      status: 'active',
    },
    managedNodeId: null,
    ...overrides,
  };
}

export const DESIGN_PERSONAS: readonly DesignPersona[] = [
  {
    id: 'new-learner',
    label: 'یادگیرنده تازه‌وارد',
    description: 'روز اول: بدون پیشرفت، بدون استریک، آنبوردینگ ناتمام',
    me: base({
      id: 'design-new-learner',
      fullName: 'نگار تازه‌کار',
      nickname: 'نگار',
      avatarSeed: 'design-new',
      onboardingCompleted: false,
      hasPassword: false,
      dailyGoal: 1,
    }),
  },
  {
    id: 'active-learner',
    label: 'یادگیرنده فعال',
    description: 'استریک، لیگ، و اشتراک سازمانی نزدیک به پایان',
    me: base({
      id: 'design-active-learner',
      fullName: 'مهدی کوشا',
      nickname: 'مهدی',
      avatarSeed: 'design-active',
      dailyGoal: 3,
    }),
  },
  {
    id: 'free-individual',
    label: 'کاربر آزاد (بدون سازمان)',
    description: 'بدون سازمان و بدون اشتراک: همه‌چیز قفل',
    me: base({
      id: 'design-free',
      fullName: 'سارا مستقل',
      nickname: 'سارا',
      avatarSeed: 'design-free',
      org: null,
      membership: null,
    }),
  },
  {
    id: 'unit-manager',
    label: 'مدیر واحد',
    description: 'فقط زیردرخت خودش: یک واحد و سه نفر',
    me: base({
      id: 'design-unit-manager',
      fullName: 'علیرضا رضایی',
      nickname: 'علیرضا',
      avatarSeed: 'design-um',
      roles: ['learner', 'unit_manager'],
      managedNodeId: UNIT_NODE,
      membership: {
        nodeId: UNIT_NODE,
        nodeName: 'واحد نورد گرم و مقاطع',
        nodePath: ['مجتمع فولاد نمونه', 'معاونت تولید و عملیات', 'واحد نورد گرم و مقاطع'],
        rank: 'supervisor',
        status: 'active',
      },
    }),
  },
  {
    id: 'org-admin',
    label: 'مدیر ارشد سازمان',
    description: 'کل سازمان: چهار گره و شش نفر',
    me: base({
      id: 'design-org-admin',
      fullName: 'فریبا رادمنش',
      nickname: 'فریبا',
      avatarSeed: 'design-admin',
      roles: ['learner', 'org_admin'],
      membership: {
        nodeId: ROOT_NODE,
        nodeName: 'مجتمع فولاد نمونه',
        nodePath: ['مجتمع فولاد نمونه'],
        rank: 'senior_manager',
        status: 'active',
      },
    }),
  },
];

export const DEFAULT_PERSONA: DesignPersonaId = 'org-admin';

export function personaById(id: string): DesignPersona {
  return DESIGN_PERSONAS.find((p) => p.id === id) ?? DESIGN_PERSONAS[DESIGN_PERSONAS.length - 1]!;
}

/** The whole tree. A unit manager sees only the subtree under their node. */
export const DESIGN_NODES: readonly OrgNodeDto[] = [
  {
    id: ROOT_NODE,
    parentId: null,
    name: 'مجتمع فولاد نمونه',
    kind: 'org',
    depth: 0,
    memberCount: 6,
  },
  {
    id: DEPUTY_NODE,
    parentId: ROOT_NODE,
    name: 'معاونت تولید و عملیات',
    kind: 'deputy',
    depth: 1,
    memberCount: 4,
  },
  {
    id: UNIT_NODE,
    parentId: DEPUTY_NODE,
    name: 'واحد نورد گرم و مقاطع',
    kind: 'unit',
    depth: 2,
    memberCount: 3,
  },
  {
    id: CASTING_NODE,
    parentId: DEPUTY_NODE,
    name: 'واحد ریخته‌گری',
    kind: 'unit',
    depth: 2,
    memberCount: 1,
  },
];

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export const DESIGN_PEOPLE: readonly OrgPersonDto[] = [
  {
    id: 'p-1',
    fullName: 'زهرا کریمی',
    nickname: 'زهرا',
    avatarSeed: 'p1',
    phoneMasked: '۰۹۱۲***۰۰۰۴',
    personnelCode: 'FN-1004',
    rank: 'operator',
    status: 'active',
    nodeId: UNIT_NODE,
    nodeName: 'واحد نورد گرم و مقاطع',
    joinedAt: daysAgo(210),
  },
  {
    id: 'p-2',
    fullName: 'علیرضا رضایی',
    nickname: 'علیرضا',
    avatarSeed: 'p2',
    phoneMasked: '۰۹۱۲***۰۰۰۳',
    personnelCode: 'FN-1003',
    rank: 'supervisor',
    status: 'active',
    nodeId: UNIT_NODE,
    nodeName: 'واحد نورد گرم و مقاطع',
    joinedAt: daysAgo(400),
  },
  {
    id: 'p-3',
    fullName: 'نوید مقدم',
    nickname: 'نوید',
    avatarSeed: 'p3',
    phoneMasked: '۰۹۱۲***۰۰۰۷',
    personnelCode: 'FN-1007',
    rank: 'expert',
    status: 'invited',
    nodeId: UNIT_NODE,
    nodeName: 'واحد نورد گرم و مقاطع',
    joinedAt: daysAgo(3),
  },
  {
    id: 'p-4',
    fullName: 'حسین اکبری',
    nickname: 'حسین',
    avatarSeed: 'p4',
    phoneMasked: '۰۹۱۲***۰۰۰۶',
    personnelCode: 'FN-1006',
    rank: 'operator',
    status: 'inactive',
    nodeId: CASTING_NODE,
    nodeName: 'واحد ریخته‌گری',
    joinedAt: daysAgo(150),
  },
  {
    id: 'p-5',
    fullName: 'محمدرضا صادقی',
    nickname: 'محمدرضا',
    avatarSeed: 'p5',
    phoneMasked: '۰۹۱۲***۰۰۰۲',
    personnelCode: 'FN-1002',
    rank: 'middle_manager',
    status: 'active',
    nodeId: DEPUTY_NODE,
    nodeName: 'معاونت تولید و عملیات',
    joinedAt: daysAgo(620),
  },
  {
    id: 'p-6',
    fullName: 'فریبا رادمنش',
    nickname: 'فریبا',
    avatarSeed: 'p6',
    phoneMasked: '۰۹۱۲***۰۰۰۱',
    personnelCode: 'FN-1001',
    rank: 'senior_manager',
    status: 'active',
    nodeId: ROOT_NODE,
    nodeName: 'مجتمع فولاد نمونه',
    joinedAt: daysAgo(900),
  },
];

/** The node ids a persona may see, mirroring the server's subtree scope. */
export function visibleNodeIds(persona: DesignPersona): string[] {
  const root = persona.me.managedNodeId ?? ROOT_NODE;
  const out: string[] = [];
  const walk = (id: string) => {
    out.push(id);
    for (const node of DESIGN_NODES) if (node.parentId === id) walk(node.id);
  };
  walk(root);
  return out;
}
