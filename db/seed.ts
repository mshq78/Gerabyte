import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { createDatabase } from './client';
import * as s from './schema';
import { hashPassword } from '../server/services/password';
import { normalizePhone } from '../shared/schemas/common';

/**
 * Development and staging seed. Refuses to run against NODE_ENV=production.
 *
 * Two organizations exist on purpose: every isolation test needs a second org
 * that the first one's admin must not be able to see.
 *
 * The accounts it creates are documented in README.md. The shared password is
 * development-only and is never used anywhere a real user could reach.
 */
const DEV_PASSWORD = 'gerabyte-dev-1404';

interface NodeSpec {
  key: string;
  name: string;
  kind: 'org' | 'deputy' | 'unit' | 'group';
  code: string;
  children?: NodeSpec[];
}

const FOOLAD_TREE: NodeSpec = {
  key: 'foolad-root',
  name: 'مجتمع فولاد نمونه',
  kind: 'org',
  code: 'FN-000',
  children: [
    {
      key: 'foolad-prod',
      name: 'معاونت تولید و عملیات',
      kind: 'deputy',
      code: 'FN-100',
      children: [
        { key: 'foolad-nord', name: 'واحد نورد گرم و مقاطع', kind: 'unit', code: 'FN-110' },
        { key: 'foolad-cast', name: 'واحد ریخته‌گری', kind: 'unit', code: 'FN-120' },
      ],
    },
    {
      key: 'foolad-quality',
      name: 'معاونت کیفیت',
      kind: 'deputy',
      code: 'FN-200',
      children: [{ key: 'foolad-lab', name: 'آزمایشگاه متالورژی', kind: 'unit', code: 'FN-210' }],
    },
  ],
};

const PETRO_TREE: NodeSpec = {
  key: 'petro-root',
  name: 'پتروشیمی نمونه',
  kind: 'org',
  code: 'PN-000',
  children: [
    {
      key: 'petro-ops',
      name: 'معاونت بهره‌برداری',
      kind: 'deputy',
      code: 'PN-100',
      children: [{ key: 'petro-olefin', name: 'واحد الفین', kind: 'unit', code: 'PN-110' }],
    },
  ],
};

type Db = ReturnType<typeof createDatabase>['db'];

async function insertTree(
  db: Db,
  orgId: string,
  spec: NodeSpec,
  parent: { id: string; path: string; depth: number } | null,
  out: Map<string, string>
): Promise<void> {
  const id = randomUUID();
  const path = parent ? `${parent.path}${id}/` : `/${id}/`;
  const depth = parent ? parent.depth + 1 : 0;

  await db.insert(s.orgNodes).values({
    id,
    orgId,
    parentId: parent?.id ?? null,
    kind: spec.kind,
    name: spec.name,
    code: spec.code,
    path,
    depth,
  });
  out.set(spec.key, id);

  for (const child of spec.children ?? []) {
    await insertTree(db, orgId, child, { id, path, depth }, out);
  }
}

interface PersonSpec {
  phone: string;
  fullName: string;
  nickname: string;
  nodeKey: string;
  rank: 'operator' | 'expert' | 'supervisor' | 'middle_manager' | 'senior_manager';
  personnelCode: string;
  roles: { role: 'learner' | 'unit_manager' | 'org_admin' | 'gera_admin'; nodeKey?: string }[];
  status?: 'invited' | 'active' | 'inactive';
  withPassword?: boolean;
}

const FOOLAD_PEOPLE: PersonSpec[] = [
  {
    phone: '09120000001',
    fullName: 'فریبا رادمنش',
    nickname: 'فریبا',
    nodeKey: 'foolad-root',
    rank: 'senior_manager',
    personnelCode: 'FN-1001',
    roles: [{ role: 'learner' }, { role: 'org_admin' }],
    withPassword: true,
  },
  {
    phone: '09120000002',
    fullName: 'محمدرضا صادقی',
    nickname: 'محمدرضا',
    nodeKey: 'foolad-prod',
    rank: 'middle_manager',
    personnelCode: 'FN-1002',
    roles: [{ role: 'learner' }, { role: 'unit_manager', nodeKey: 'foolad-prod' }],
    withPassword: true,
  },
  {
    phone: '09120000003',
    fullName: 'علیرضا رضایی',
    nickname: 'علیرضا',
    nodeKey: 'foolad-nord',
    rank: 'supervisor',
    personnelCode: 'FN-1003',
    roles: [{ role: 'learner' }, { role: 'unit_manager', nodeKey: 'foolad-nord' }],
    withPassword: true,
  },
  {
    phone: '09120000004',
    fullName: 'زهرا کریمی',
    nickname: 'زهرا',
    nodeKey: 'foolad-nord',
    rank: 'operator',
    personnelCode: 'FN-1004',
    roles: [{ role: 'learner' }],
    withPassword: true,
  },
  {
    phone: '09120000005',
    fullName: 'سپیده رهنما',
    nickname: 'سپیده',
    nodeKey: 'foolad-lab',
    rank: 'expert',
    personnelCode: 'FN-1005',
    roles: [{ role: 'learner' }],
  },
  {
    phone: '09120000006',
    fullName: 'حسین اکبری',
    nickname: 'حسین',
    nodeKey: 'foolad-cast',
    rank: 'operator',
    personnelCode: 'FN-1006',
    roles: [{ role: 'learner' }],
  },
  {
    phone: '09120000007',
    fullName: 'نازنین طاهری',
    nickname: 'نازنین',
    nodeKey: 'foolad-nord',
    rank: 'expert',
    personnelCode: 'FN-1007',
    roles: [],
    status: 'invited',
  },
];

const PETRO_PEOPLE: PersonSpec[] = [
  {
    phone: '09130000001',
    fullName: 'بهنام کیانی',
    nickname: 'بهنام',
    nodeKey: 'petro-root',
    rank: 'senior_manager',
    personnelCode: 'PN-1001',
    roles: [{ role: 'learner' }, { role: 'org_admin' }],
    withPassword: true,
  },
  {
    phone: '09130000002',
    fullName: 'شیرین سعیدی',
    nickname: 'شیرین',
    nodeKey: 'petro-olefin',
    rank: 'operator',
    personnelCode: 'PN-1002',
    roles: [{ role: 'learner' }],
  },
];

async function seedOrg(
  db: Db,
  name: string,
  slug: string,
  tree: NodeSpec,
  people: PersonSpec[],
  passwordHash: string
): Promise<void> {
  const [org] = await db.insert(s.orgs).values({ name, slug }).returning();
  if (!org) throw new Error(`failed to create org ${slug}`);

  const nodeIds = new Map<string, string>();
  await insertTree(db, org.id, tree, null, nodeIds);

  for (const person of people) {
    const phone = normalizePhone(person.phone);
    if (!phone) throw new Error(`seed phone is not valid: ${person.phone}`);
    const nodeId = nodeIds.get(person.nodeKey);
    if (!nodeId) throw new Error(`unknown node key ${person.nodeKey}`);

    const status = person.status ?? 'active';

    // An invited member has no user row yet: the first login links the phone.
    if (status === 'invited') {
      await db.insert(s.memberships).values({
        userId: null,
        orgId: org.id,
        nodeId,
        invitedPhone: phone,
        personnelCode: person.personnelCode,
        rank: person.rank,
        status,
      });
      continue;
    }

    const [user] = await db
      .insert(s.users)
      .values({
        phone,
        fullName: person.fullName,
        nickname: person.nickname,
        avatarSeed: person.personnelCode.toLowerCase(),
        dailyGoal: 2,
        onboardingCompleted: true,
      })
      .returning();
    if (!user) throw new Error(`failed to create user ${person.phone}`);

    if (person.withPassword) {
      await db
        .insert(s.credentials)
        .values({
          userId: user.id,
          passwordHash,
          algorithm: 'argon2id',
          passwordUpdatedAt: new Date(),
        });
    }

    await db.insert(s.memberships).values({
      userId: user.id,
      orgId: org.id,
      nodeId,
      invitedPhone: phone,
      personnelCode: person.personnelCode,
      rank: person.rank,
      status,
      lastActiveAt: new Date(Date.now() - 24 * 3600 * 1000),
    });

    for (const grant of person.roles) {
      await db.insert(s.userRoles).values({
        userId: user.id,
        role: grant.role,
        orgId: grant.role === 'gera_admin' ? null : org.id,
        nodeId: grant.nodeKey ? (nodeIds.get(grant.nodeKey) ?? null) : null,
      });
    }
  }
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('refusing to seed a production database');
  }
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL must be set');

  const { sql, db } = createDatabase(url, { max: 1 });
  try {
    const existing = await db.select({ id: s.orgs.id }).from(s.orgs).limit(1);
    if (existing.length > 0) {
      console.log('seed: data already present, wiping the seedable tables first');
      await sql`TRUNCATE TABLE user_roles, memberships, credentials, sessions, otp_codes, rate_limits, org_nodes, orgs, users RESTART IDENTITY CASCADE`;
    }

    const passwordHash = await hashPassword(DEV_PASSWORD);

    await seedOrg(
      db,
      'مجتمع فولاد نمونه',
      'foolad-nemooneh',
      FOOLAD_TREE,
      FOOLAD_PEOPLE,
      passwordHash
    );
    await seedOrg(db, 'پتروشیمی نمونه', 'petro-nemooneh', PETRO_TREE, PETRO_PEOPLE, passwordHash);

    // A Gera-side administrator belongs to no organization.
    const geraPhone = normalizePhone('09100000000');
    if (!geraPhone) throw new Error('bad gera admin phone');
    const [gera] = await db
      .insert(s.users)
      .values({
        phone: geraPhone,
        fullName: 'مدیر سامانه گرا',
        nickname: 'گرا',
        avatarSeed: 'gera-admin',
        dailyGoal: 1,
        onboardingCompleted: true,
      })
      .returning();
    if (!gera) throw new Error('failed to create gera admin');
    await db
      .insert(s.credentials)
      .values({
        userId: gera.id,
        passwordHash,
        algorithm: 'argon2id',
        passwordUpdatedAt: new Date(),
      });
    await db
      .insert(s.userRoles)
      .values({ userId: gera.id, role: 'gera_admin', orgId: null, nodeId: null });

    const orgCount = await db.select({ id: s.orgs.id }).from(s.orgs);
    const userCount = await db.select({ id: s.users.id }).from(s.users);
    const nodeCount = await db.select({ id: s.orgNodes.id }).from(s.orgNodes);
    console.log(
      `seed: ${orgCount.length} orgs, ${nodeCount.length} nodes, ${userCount.length} users. ` +
        `Dev password for every seeded account: ${DEV_PASSWORD}`
    );

    const admin = await db
      .select()
      .from(s.users)
      .where(eq(s.users.phone, '+989120000001'))
      .limit(1);
    if (admin.length === 0) throw new Error('seed verification failed: org admin missing');
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error('seed failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
