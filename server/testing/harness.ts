import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { sql } from 'drizzle-orm';
import type { Express } from 'express';
import request from 'supertest';
import { createDatabase, type Database } from '../../db/client.js';
import * as schema from '../../db/schema.js';
import { createApp } from '../app.js';
import { setSmsProviderForTests, type SmsProvider } from '../services/sms/index.js';

export const APP_ORIGIN = 'http://localhost:3000';
export const CSRF_HEADERS = {
  'X-Requested-With': 'gerabyte',
  Origin: APP_ORIGIN,
} as const;

let handle: { sql: ReturnType<typeof createDatabase>['sql']; db: Database } | null = null;
let app: Express | null = null;

/** Codes captured from the SMS provider, so tests can use the real code. */
export const sentCodes: { phone: string; code: string }[] = [];

const capturingSmsProvider: SmsProvider = {
  name: 'capture',
  async sendOtp(phone, code) {
    sentCodes.push({ phone, code });
  },
};

export async function setupTestApp(): Promise<{ app: Express; db: Database }> {
  if (!handle) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set');
    handle = createDatabase(url, { max: 4 });
    await migrate(handle.db, { migrationsFolder: './db/migrations' });
  }
  if (!app) {
    app = createApp({ db: handle.db });
    setSmsProviderForTests(capturingSmsProvider);
  }
  return { app, db: handle.db };
}

export async function teardownTestApp(): Promise<void> {
  if (handle) {
    await handle.sql.end({ timeout: 5 });
    handle = null;
    app = null;
  }
}

/**
 * Wipe everything between tests. audit_log is append-only for good reason, so
 * the trigger is dropped and restored around the truncate rather than weakened.
 */
export async function resetDatabase(): Promise<void> {
  if (!handle) throw new Error('call setupTestApp() first');
  sentCodes.length = 0;
  await handle.sql`ALTER TABLE audit_log DISABLE TRIGGER audit_log_no_mutate`;
  await handle.sql`ALTER TABLE audit_log DISABLE TRIGGER audit_log_no_truncate`;
  await handle.sql`TRUNCATE TABLE audit_log, user_roles, memberships, credentials, sessions,
    otp_codes, rate_limits, org_nodes, orgs, users RESTART IDENTITY CASCADE`;
  await handle.sql`ALTER TABLE audit_log ENABLE TRIGGER audit_log_no_mutate`;
  await handle.sql`ALTER TABLE audit_log ENABLE TRIGGER audit_log_no_truncate`;
}

export function db(): Database {
  if (!handle) throw new Error('call setupTestApp() first');
  return handle.db;
}

export function rawSql() {
  if (!handle) throw new Error('call setupTestApp() first');
  return handle.sql;
}

/** A supertest agent that keeps cookies, as a browser would. */
export function agent(express: Express) {
  return request.agent(express);
}

export async function countAudit(action: string): Promise<number> {
  const rows = await db()
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.auditLog)
    .where(sql`${schema.auditLog.action} = ${action}`);
  return rows[0]?.n ?? 0;
}
