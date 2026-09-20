import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

/**
 * Prefer the Chromium the image already ships. Its build number will not always
 * match the one this @playwright/test expects, and downloading another one is
 * not an option in this environment.
 */
const PREINSTALLED_CHROMIUM = '/opt/pw-browsers/chromium';
const executablePath = existsSync(PREINSTALLED_CHROMIUM) ? PREINSTALLED_CHROMIUM : undefined;

/**
 * UI-standards suite. Runs against the production preview build so what the
 * test measures is what ships. Start it with `npm run e2e`.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    launchOptions: { executablePath },
  },
  // Two servers: the API the app really talks to, and the built SPA.
  // ALLOW_MOCK_STAGING is set because Phase 2 still ships the mock adapters for
  // the modules the server does not serve yet.
  webServer: [
    {
      command: 'npm run dev:server',
      url: 'http://127.0.0.1:4000/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        ...process.env,
        // The suite drives the built app on 4173, so that is the origin the
        // CSRF and CORS checks must accept.
        APP_ORIGIN: 'http://127.0.0.1:4173',
        ALLOW_DEV_OTP: '1',
      },
    },
    {
      command: 'ALLOW_MOCK_STAGING=1 npm run build && npm run preview -- --host 127.0.0.1',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: !process.env.CI,
      timeout: 240_000,
    },
  ],
});
