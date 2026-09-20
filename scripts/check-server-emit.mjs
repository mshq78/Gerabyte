/**
 * Build-time guard: the server must survive being compiled to JavaScript.
 *
 * Vercel does not bundle the backend — it transpiles `server/`, `db/`,
 * `shared/` and `api/` file by file and hands the result to Node's ESM
 * loader, which does not guess extensions. A missing `.js` on a relative
 * import is invisible to typecheck, lint, vitest and `tsx`, because all four
 * resolve modules the way a bundler does. It is visible only on the
 * deployment, as ERR_MODULE_NOT_FOUND on the first request.
 *
 * That is exactly how Phase 2 shipped a function that died on every call. So:
 * emit the server with tsc, import the emitted entry under plain Node with no
 * loader in the way, and make it answer a real request.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseEnv } from 'node:util';

const ROOT = process.cwd();

function testDatabaseUrl() {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  if (!existsSync('.env')) return null;
  return parseEnv(readFileSync('.env', 'utf8')).TEST_DATABASE_URL || null;
}

const databaseUrl = testDatabaseUrl();
if (!databaseUrl) {
  const message =
    'check: skipping the server emit check — TEST_DATABASE_URL is not set.\n' +
    '       Start one with `docker compose up -d`, then re-run.';
  if (process.env.CI) {
    console.error(message.replace('skipping', 'cannot skip'));
    process.exit(1);
  }
  console.log(message);
  process.exit(0);
}

// The emitted tree has to sit inside the repo: it imports express, drizzle and
// the rest from node_modules, and Node resolves those by walking upwards.
const outDir = mkdtempSync(path.join(ROOT, '.emit-check-'));

function run(command, args, options = {}) {
  return spawnSync(command, args, { stdio: 'inherit', cwd: ROOT, ...options });
}

try {
  const emit = run('npx', [
    'tsc',
    '-p',
    'tsconfig.server.json',
    '--noEmit',
    'false',
    '--declaration',
    'false',
    '--allowImportingTsExtensions',
    'false',
    '--outDir',
    path.relative(ROOT, outDir),
  ]);
  if (emit.status !== 0) {
    console.error('check-server-emit: tsc could not emit the server.');
    process.exit(1);
  }

  // Drive one real request through the emitted app, with no bundler, no tsx
  // and no import hook — the same way the platform loads it.
  const probe = path.join(outDir, 'emit-probe.mjs');
  writeFileSync(
    probe,
    [
      "const { createApp } = await import('./server/app.js');",
      "const { createDatabase } = await import('./db/client.js');",
      'const { db } = createDatabase(process.env.DATABASE_URL, { max: 1 });',
      'const app = createApp({ db });',
      'const server = app.listen(0);',
      "await new Promise((resolve) => server.once('listening', resolve));",
      'const response = await fetch(`http://127.0.0.1:${server.address().port}/api/health`);',
      'const body = await response.json();',
      'server.close();',
      'if (response.status !== 200 || body.status !== "ok") {',
      '  console.error("emitted server answered", response.status, JSON.stringify(body));',
      '  process.exit(1);',
      '}',
      'console.log(`check-server-emit: emitted server answered 200 (${body.passwordHasher}).`);',
      'process.exit(0);',
    ].join('\n')
  );

  const result = run('node', [path.relative(ROOT, probe)], {
    env: {
      ...process.env,
      NODE_ENV: 'test',
      DEPLOY_ENV: 'local',
      DATABASE_URL: databaseUrl,
      APP_ORIGIN: process.env.APP_ORIGIN ?? 'http://localhost:3000',
      SMS_PROVIDER: 'console',
      ALLOW_DEV_OTP: '0',
      LOG_LEVEL: 'silent',
      OTP_HMAC_SECRET: 'emit-check-otp-hmac-secret-at-least-32-chars',
      SESSION_HASH_SECRET: 'emit-check-session-hash-secret-at-least-32-c',
      IP_HASH_SECRET: 'emit-check-ip-hash-secret',
    },
  });

  if (result.status !== 0) {
    console.error(
      'check-server-emit: the emitted server did not start.\n' +
        '       This is the failure Vercel sees and nothing else does — usually a\n' +
        '       relative import missing its .js extension.'
    );
    process.exit(1);
  }
} finally {
  rmSync(outDir, { recursive: true, force: true });
}
