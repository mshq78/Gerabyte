/**
 * `npm run check` runs the Playwright suite in CI, where a browser is always
 * available. Locally it is opt-in via `npm run e2e`, so `check` stays fast.
 */
import { spawnSync } from 'node:child_process';

if (!process.env.CI) {
  console.log('check: skipping Playwright (set CI=1, or run `npm run e2e`).');
  process.exit(0);
}

const result = spawnSync('npx', ['playwright', 'test'], { stdio: 'inherit', shell: false });
process.exit(result.status ?? 1);
