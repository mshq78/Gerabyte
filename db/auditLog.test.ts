import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { auditLog } from './schema.js';
import {
  db,
  rawSql,
  resetDatabase,
  setupTestApp,
  teardownTestApp,
} from '../server/testing/harness.js';

/**
 * The audit log is the record of last resort. If the application can rewrite
 * it, it is worth very little, so the database itself enforces append-only.
 */
beforeAll(async () => {
  await setupTestApp();
});
afterAll(teardownTestApp);
beforeEach(resetDatabase);

async function seedRow() {
  await db().insert(auditLog).values({ action: 'auth.login.succeeded' });
}

describe('audit_log is append-only', () => {
  it('accepts an INSERT', async () => {
    await seedRow();
    const rows = await db().select().from(auditLog);
    expect(rows).toHaveLength(1);
  });

  it('rejects an UPDATE from the application role', async () => {
    await seedRow();
    await expect(rawSql()`UPDATE audit_log SET action = 'tampered'`).rejects.toThrow(
      /append-only/i
    );

    const rows = await db().select().from(auditLog);
    expect(rows[0]?.action).toBe('auth.login.succeeded');
  });

  it('rejects a DELETE from the application role', async () => {
    await seedRow();
    await expect(rawSql()`DELETE FROM audit_log`).rejects.toThrow(/append-only/i);
    expect(await db().select().from(auditLog)).toHaveLength(1);
  });

  it('rejects a TRUNCATE, which row triggers alone would miss', async () => {
    await seedRow();
    await expect(rawSql()`TRUNCATE TABLE audit_log`).rejects.toThrow(/append-only/i);
    expect(await db().select().from(auditLog)).toHaveLength(1);
  });

  it('raises insufficient_privilege (42501), not a generic error', async () => {
    await seedRow();
    try {
      await rawSql()`DELETE FROM audit_log`;
      throw new Error('the delete should not have succeeded');
    } catch (error) {
      expect((error as { code?: string }).code).toBe('42501');
    }
  });
});
