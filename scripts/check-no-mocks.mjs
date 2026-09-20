/**
 * Build-time guard: a production bundle must not carry the mock API adapters.
 *
 * Phase 2 still ships mocks for the modules the server does not serve yet
 * (lessons, exams, leagues, rewards, subscriptions, notifications), so this
 * gate is not enforcing yet — it is enforced the moment ALLOW_MOCK_STAGING is
 * unset, which is what a production deploy must do. Staging sets it to 1 and
 * ships noindex instead.
 */
import { readFileSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

const DIST = path.resolve(process.cwd(), 'dist');

/** Strings that only exist inside a mock adapter. */
const MOCK_MARKERS = ['MOCK_ONLY', 'gerabyte:mock_progress', 'خطای شبیه‌سازی‌شده شبکه'];

const allowMocks = process.env.ALLOW_MOCK_STAGING === '1';

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (/\.(js|css|html)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const files = await walk(DIST).catch(() => {
  console.error(`check-no-mocks: ${DIST} not found — run the build first.`);
  process.exit(1);
});

const hits = [];
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  for (const marker of MOCK_MARKERS) {
    if (text.includes(marker)) hits.push({ file: path.relative(process.cwd(), file), marker });
  }
}

if (hits.length === 0) {
  console.log('check-no-mocks: no mock adapter reached the bundle.');
  process.exit(0);
}

if (allowMocks) {
  console.warn(
    `check-no-mocks: ${hits.length} mock marker(s) in the bundle, allowed by ALLOW_MOCK_STAGING=1.\n` +
      '                This build is for staging only and must not be promoted to production.'
  );
  process.exit(0);
}

console.error('check-no-mocks: mock adapters reached a production bundle:');
for (const hit of hits) console.error(`  ${hit.file}: ${hit.marker}`);
console.error(
  '\nPhase 2 still needs the mocks the server does not replace yet.\n' +
    'Set ALLOW_MOCK_STAGING=1 for a staging build, and keep it unset for production.'
);
process.exit(1);
