import type { Page } from '@playwright/test';

/**
 * Accounts created by `npm run db:seed`. The suite signs in through the real
 * API, the same way a person does — there is no persona switcher.
 */
export const SEED_PASSWORD = 'gerabyte-dev-1404';
export const ORG_ADMIN_PHONE = '09120000001';
export const UNIT_MANAGER_PHONE = '09120000003';
export const LEARNER_PHONE = '09120000004';

export async function signIn(page: Page, phone: string): Promise<void> {
  await page.goto('/login');
  const result = await page.evaluate(
    async ({ phone, password }) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'gerabyte' },
        credentials: 'same-origin',
        body: JSON.stringify({ phone, password }),
      });
      return { status: response.status, body: await response.text() };
    },
    { phone, password: SEED_PASSWORD }
  );
  if (result.status !== 200) {
    throw new Error(`sign-in failed for ${phone}: ${result.status} ${result.body}`);
  }
}
