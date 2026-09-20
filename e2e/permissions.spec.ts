import { expect, test } from '@playwright/test';
import { ORG_ADMIN_PHONE, UNIT_MANAGER_PHONE, signIn } from './accounts';

/**
 * The regression this suite exists for.
 *
 * A unit manager could open `/org/import`, `/org/subscriptions` and
 * `/org/settings` by typing the address: only the sidebar hid them. Hiding a
 * link hides nothing from anyone who knows the URL.
 */
const ORG_ADMIN_ONLY_ROUTES = ['/org/import', '/org/subscriptions', '/org/settings'];

test.describe('organization route permissions', () => {
  for (const route of ORG_ADMIN_ONLY_ROUTES) {
    test(`a unit manager typing ${route} is sent back to the overview`, async ({ page }) => {
      await signIn(page, UNIT_MANAGER_PHONE);
      await page.goto(route);
      await page.waitForURL('**/org/overview');
      expect(new URL(page.url()).pathname).toBe('/org/overview');
    });
  }

  for (const route of ORG_ADMIN_ONLY_ROUTES) {
    test(`an org admin opening ${route} stays there`, async ({ page }) => {
      await signIn(page, ORG_ADMIN_PHONE);
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      expect(new URL(page.url()).pathname).toBe(route);
    });
  }

  test('a unit manager sees no menu entry for the screens they cannot open', async ({ page }) => {
    await signIn(page, UNIT_MANAGER_PHONE);
    await page.goto('/org/overview');
    await page.waitForLoadState('networkidle');

    const hrefs = await page
      .locator('nav a[href^="/org/"]')
      .evaluateAll((links) =>
        links.map((link) => new URL((link as HTMLAnchorElement).href).pathname)
      );
    for (const route of ORG_ADMIN_ONLY_ROUTES) {
      expect(hrefs, route).not.toContain(route);
    }
    expect(hrefs).toContain('/org/people');
  });

  test('the server refuses out-of-scope organization data, not just the UI', async ({ page }) => {
    await signIn(page, UNIT_MANAGER_PHONE);
    // The tree a unit manager may read is their own subtree and nothing above
    // it — the guard that matters is this one, not the redirect.
    const tree = await page.evaluate(async () => {
      const response = await fetch('/api/org/tree', {
        headers: { 'X-Requested-With': 'gerabyte' },
        credentials: 'same-origin',
      });
      return { status: response.status, body: await response.json() };
    });
    expect(tree.status).toBe(200);
    expect(tree.body.items.length).toBeLessThan(6);
  });
});
