import type { Express } from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  createInvite,
  createMember,
  createOrg,
  TEST_PASSWORD,
  type SeededOrg,
} from '../testing/fixtures';
import {
  CSRF_HEADERS,
  agent,
  countAudit,
  resetDatabase,
  setupTestApp,
  teardownTestApp,
} from '../testing/harness';

let app: Express;

beforeAll(async () => {
  ({ app } = await setupTestApp());
});
afterAll(teardownTestApp);
beforeEach(resetDatabase);

const ORG_ROUTES = ['/api/org/tree', '/api/org/people'];

/**
 * Two organizations, each with a nested tree, so both subtree scoping and
 * cross-organization isolation are testable in one fixture.
 *
 *   foolad: root > prod > (nord, cast), root > quality > lab
 *   petro : root > ops > olefin
 */
async function seedTwoOrgs() {
  const foolad = await createOrg('فولاد', 'foolad', [
    { key: 'root', parent: null },
    { key: 'prod', parent: 'root', kind: 'deputy' },
    { key: 'nord', parent: 'prod' },
    { key: 'cast', parent: 'prod' },
    { key: 'quality', parent: 'root', kind: 'deputy' },
    { key: 'lab', parent: 'quality' },
  ]);

  const petro = await createOrg('پتروشیمی', 'petro', [
    { key: 'root', parent: null },
    { key: 'ops', parent: 'root', kind: 'deputy' },
    { key: 'olefin', parent: 'ops' },
  ]);

  const orgAdmin = await createMember(foolad, {
    phone: '09120000001',
    fullName: 'مدیر سازمان',
    nodeKey: 'root',
    roles: [{ role: 'learner' }, { role: 'org_admin' }],
    withPassword: true,
  });
  const prodManager = await createMember(foolad, {
    phone: '09120000002',
    fullName: 'مدیر تولید',
    nodeKey: 'prod',
    roles: [{ role: 'learner' }, { role: 'unit_manager', nodeKey: 'prod' }],
    withPassword: true,
  });
  const nordManager = await createMember(foolad, {
    phone: '09120000003',
    fullName: 'سرپرست نورد',
    nodeKey: 'nord',
    roles: [{ role: 'learner' }, { role: 'unit_manager', nodeKey: 'nord' }],
    withPassword: true,
  });
  const nordLearner = await createMember(foolad, {
    phone: '09120000004',
    fullName: 'یادگیرنده نورد',
    nodeKey: 'nord',
    roles: [{ role: 'learner' }],
    withPassword: true,
  });
  const labLearner = await createMember(foolad, {
    phone: '09120000005',
    fullName: 'کارشناس آزمایشگاه',
    nodeKey: 'lab',
    roles: [{ role: 'learner' }],
  });
  const castLearner = await createMember(foolad, {
    phone: '09120000006',
    fullName: 'اپراتور ریخته‌گری',
    nodeKey: 'cast',
    roles: [{ role: 'learner' }],
  });
  const invited = await createInvite(foolad, { phone: '09120000007', nodeKey: 'nord' });

  const petroAdmin = await createMember(petro, {
    phone: '09130000001',
    fullName: 'مدیر پتروشیمی',
    nodeKey: 'root',
    roles: [{ role: 'learner' }, { role: 'org_admin' }],
    withPassword: true,
  });
  const petroLearner = await createMember(petro, {
    phone: '09130000002',
    fullName: 'اپراتور الفین',
    nodeKey: 'olefin',
    roles: [{ role: 'learner' }],
  });

  const geraAdmin = await createMember(foolad, {
    phone: '09100000000',
    fullName: 'مدیر گرا',
    nodeKey: 'root',
    roles: [{ role: 'gera_admin' }],
    withPassword: true,
  });

  return {
    foolad,
    petro,
    orgAdmin,
    prodManager,
    nordManager,
    nordLearner,
    labLearner,
    castLearner,
    invited,
    petroAdmin,
    petroLearner,
    geraAdmin,
  };
}

async function signIn(phone: string) {
  const a = agent(app);
  const res = await a
    .post('/api/auth/login')
    .set(CSRF_HEADERS)
    .send({ phone, password: TEST_PASSWORD });
  if (res.status !== 200) throw new Error(`sign-in failed for ${phone}: ${res.status}`);
  return a;
}

function nodeNames(body: { items: { name: string }[] }): string[] {
  return body.items.map((n) => n.name).sort();
}

function personNames(body: { items: { fullName: string }[] }): string[] {
  return body.items.map((p) => p.fullName).sort();
}

describe('RBAC: who may reach /api/org at all', () => {
  it('refuses a learner on every org route', async () => {
    await seedTwoOrgs();
    const a = await signIn('09120000004');
    for (const route of ORG_ROUTES) {
      const res = await a.get(route);
      expect(res.status, route).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    }
  });

  it('refuses an anonymous caller with 401, not 403', async () => {
    await seedTwoOrgs();
    for (const route of ORG_ROUTES) {
      const res = await agent(app).get(route);
      expect(res.status, route).toBe(401);
    }
  });

  it('refuses a gera_admin: platform administration is not org data access', async () => {
    await seedTwoOrgs();
    const a = await signIn('09100000000');
    for (const route of ORG_ROUTES) {
      expect((await a.get(route)).status, route).toBe(403);
    }
  });
});

describe('scope: the tree a caller may see', () => {
  it('gives an org admin the whole organization', async () => {
    await seedTwoOrgs();
    const a = await signIn('09120000001');
    const res = await a.get('/api/org/tree');
    expect(res.status).toBe(200);
    expect(nodeNames(res.body)).toEqual(['cast', 'lab', 'nord', 'prod', 'quality', 'root'].sort());
  });

  it('gives a deputy manager their own subtree only', async () => {
    await seedTwoOrgs();
    const a = await signIn('09120000002');
    const res = await a.get('/api/org/tree');
    expect(nodeNames(res.body)).toEqual(['cast', 'nord', 'prod'].sort());
    expect(nodeNames(res.body)).not.toContain('root');
    expect(nodeNames(res.body)).not.toContain('lab');
  });

  it('gives a unit manager a single node', async () => {
    await seedTwoOrgs();
    const a = await signIn('09120000003');
    const res = await a.get('/api/org/tree');
    expect(nodeNames(res.body)).toEqual(['nord']);
  });

  it('never leaks the other organization into a tree', async () => {
    await seedTwoOrgs();
    const a = await signIn('09130000001');
    const res = await a.get('/api/org/tree');
    expect(nodeNames(res.body)).toEqual(['olefin', 'ops', 'root'].sort());
    expect(JSON.stringify(res.body)).not.toContain('nord');
  });
});

describe('scope: the people a caller may list', () => {
  it('lists the whole organization for an org admin', async () => {
    await seedTwoOrgs();
    const a = await signIn('09120000001');
    const res = await a.get('/api/org/people');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(8);
    expect(personNames(res.body)).toContain('کارشناس آزمایشگاه');
  });

  it('lists only the subtree for a deputy manager', async () => {
    await seedTwoOrgs();
    const a = await signIn('09120000002');
    const res = await a.get('/api/org/people');
    const names = personNames(res.body);
    expect(names).toContain('مدیر تولید');
    expect(names).toContain('یادگیرنده نورد');
    expect(names).toContain('اپراتور ریخته‌گری');
    expect(names).not.toContain('کارشناس آزمایشگاه');
    expect(names).not.toContain('مدیر سازمان');
  });

  it('lists only their own unit for a unit manager', async () => {
    await seedTwoOrgs();
    const a = await signIn('09120000003');
    const res = await a.get('/api/org/people');
    const names = personNames(res.body);
    expect(names).toContain('سرپرست نورد');
    expect(names).toContain('یادگیرنده نورد');
    expect(names).not.toContain('اپراتور ریخته‌گری');
  });

  it('never returns a person from the other organization', async () => {
    await seedTwoOrgs();
    const a = await signIn('09130000001');
    const res = await a.get('/api/org/people');
    const names = personNames(res.body);
    expect(names).toEqual(['اپراتور الفین', 'مدیر پتروشیمی'].sort());
    expect(JSON.stringify(res.body)).not.toContain('فولاد');
  });

  it('ignores a nodeId filter pointing outside the scope', async () => {
    const seeded = await seedTwoOrgs();
    const a = await signIn('09120000003');
    const res = await a.get(`/api/org/people?nodeId=${seeded.foolad.nodes.lab!.id}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0);
  });

  it('ignores a nodeId filter pointing at the other organization', async () => {
    const seeded = await seedTwoOrgs();
    const a = await signIn('09120000001');
    const res = await a.get(`/api/org/people?nodeId=${seeded.petro.nodes.olefin!.id}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0);
  });

  it('paginates at 25 per page', async () => {
    await seedTwoOrgs();
    const a = await signIn('09120000001');
    const res = await a.get('/api/org/people');
    expect(res.body.pageSize).toBe(25);
    expect(res.body.page).toBe(1);
    expect(res.body.totalPages).toBe(1);
  });

  it('searches by name but not by phone', async () => {
    await seedTwoOrgs();
    const a = await signIn('09120000001');

    const byName = await a.get('/api/org/people').query({ q: 'آزمایشگاه' });
    expect(personNames(byName.body)).toEqual(['کارشناس آزمایشگاه']);

    // A manager cannot confirm a phone number by probing the search box.
    const byPhone = await a.get('/api/org/people').query({ q: '09120000005' });
    expect(byPhone.body.items).toHaveLength(0);
  });
});

describe('privacy: what a manager DTO may contain', () => {
  it('masks every phone in the people list', async () => {
    await seedTwoOrgs();
    const a = await signIn('09120000001');
    const res = await a.get('/api/org/people');

    for (const person of res.body.items) {
      expect(person.phoneMasked).toMatch(/^\d{4}\*\*\*\d{4}$/);
      expect(person).not.toHaveProperty('phone');
      expect(person).not.toHaveProperty('email');
    }
    const serialized = JSON.stringify(res.body);
    expect(serialized).not.toMatch(/\+989\d{9}/);
    expect(serialized).not.toMatch(/09\d{9}/);
  });

  it('masks the phone on the person summary and carries the scope note', async () => {
    const seeded = await seedTwoOrgs();
    const a = await signIn('09120000003');
    const res = await a.get(`/api/org/people/${seeded.nordLearner.membershipId}/summary`);

    expect(res.status).toBe(200);
    expect(res.body.phoneMasked).toBe('0912***0004');
    expect(res.body.scopeNote).toContain('مسیرهای تخصیصی');
    expect(JSON.stringify(res.body)).not.toMatch(/\+989\d{9}/);
  });

  it('never exposes coins, rewards or personal paths to a manager', async () => {
    const seeded = await seedTwoOrgs();
    const a = await signIn('09120000003');
    const res = await a.get(`/api/org/people/${seeded.nordLearner.membershipId}/summary`);

    for (const forbidden of ['coins', 'rewards', 'xpTotal', 'email', 'personalPaths']) {
      expect(res.body, forbidden).not.toHaveProperty(forbidden);
    }
  });

  it('masks the phone of a member who has not signed in yet', async () => {
    const seeded = await seedTwoOrgs();
    const a = await signIn('09120000003');
    const res = await a.get(`/api/org/people/${seeded.invited.membershipId}/summary`);
    expect(res.status).toBe(200);
    expect(res.body.phoneMasked).toBe('0912***0007');
    expect(res.body.status).toBe('invited');
  });
});

describe('scope: the person summary', () => {
  it('lets a manager open someone inside their subtree', async () => {
    const seeded = await seedTwoOrgs();
    const a = await signIn('09120000003');
    const res = await a.get(`/api/org/people/${seeded.nordLearner.membershipId}/summary`);
    expect(res.status).toBe(200);
    expect(res.body.fullName).toBe('یادگیرنده نورد');
  });

  it('answers 404, not 403, for someone outside the subtree', async () => {
    const seeded = await seedTwoOrgs();
    const a = await signIn('09120000003');
    const res = await a.get(`/api/org/people/${seeded.labLearner.membershipId}/summary`);
    // 403 would confirm the record exists; 404 says nothing either way.
    expect(res.status).toBe(404);
  });

  it('answers 404 across organizations in both directions', async () => {
    const seeded = await seedTwoOrgs();

    const fooladAdmin = await signIn('09120000001');
    expect(
      (await fooladAdmin.get(`/api/org/people/${seeded.petroLearner.membershipId}/summary`)).status
    ).toBe(404);

    const petroAdmin = await signIn('09130000001');
    expect(
      (await petroAdmin.get(`/api/org/people/${seeded.nordLearner.membershipId}/summary`)).status
    ).toBe(404);
  });

  it('writes one audit row per individual report opened', async () => {
    const seeded = await seedTwoOrgs();
    const a = await signIn('09120000003');

    expect(await countAudit('org.person.viewed')).toBe(0);
    await a.get(`/api/org/people/${seeded.nordLearner.membershipId}/summary`);
    expect(await countAudit('org.person.viewed')).toBe(1);
    await a.get(`/api/org/people/${seeded.nordLearner.membershipId}/summary`);
    expect(await countAudit('org.person.viewed')).toBe(2);
  });

  it('does not audit a refused view', async () => {
    const seeded = await seedTwoOrgs();
    const a = await signIn('09120000003');
    await a.get(`/api/org/people/${seeded.labLearner.membershipId}/summary`);
    expect(await countAudit('org.person.viewed')).toBe(0);
  });
});

describe('scope resolution', () => {
  it('treats a user holding both roles as an org admin', async () => {
    const foolad: SeededOrg = await createOrg('فولاد', 'foolad', [
      { key: 'root', parent: null },
      { key: 'prod', parent: 'root', kind: 'deputy' },
      { key: 'nord', parent: 'prod' },
    ]);
    await createMember(foolad, {
      phone: '09120000001',
      fullName: 'هر دو نقش',
      nodeKey: 'root',
      roles: [{ role: 'org_admin' }, { role: 'unit_manager', nodeKey: 'nord' }],
      withPassword: true,
    });

    const a = await signIn('09120000001');
    const res = await a.get('/api/org/tree');
    expect(nodeNames(res.body)).toEqual(['nord', 'prod', 'root'].sort());
  });
});
