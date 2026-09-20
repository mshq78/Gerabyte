import { expect, test, type Page } from '@playwright/test';

/**
 * The design standard, asserted against the production build.
 *
 * Personas are injected as a mock session the way the dev demo panel does it:
 * the same localStorage keys src/api/auth.ts reads. There is no server yet, so
 * this is the only login there is.
 */
const BASE_USER = {
  id: 'p-1',
  fullName: 'علیرضا رضایی',
  nickname: 'علیرضا',
  avatarSeed: 'rezaei',
  phone: '۰۹۱۲۳۴۵۶۷۸۹',
  accountType: 'org_member',
  level: 3,
  levelSource: 'org_rank',
  xpTotal: 840,
  coins: 84,
  streakDays: 9,
  bestStreak: 14,
  dailyGoal: 2,
  todayCompletedCount: 1,
  onboardingCompleted: true,
  membership: {
    orgId: 'org-foolad',
    orgName: 'مجتمع فولاد نمونه',
    orgRank: 'supervisor',
    nodePath: ['فولاد نمونه', 'معاونت تولید و عملیات', 'واحد نورد گرم و مقاطع'],
  },
};

const ORG_ADMIN = { ...BASE_USER, id: 'p-admin', roles: ['learner', 'org_admin'] };
const LEARNER = { ...BASE_USER, id: 'p-learner', roles: ['learner'] };

const LEARNER_ROUTES = [
  '/',
  '/path',
  '/league',
  '/challenges',
  '/rewards',
  '/subscription',
  '/profile',
  '/certificates',
  '/notifications',
  '/settings/notifications',
  '/settings/visibility',
];

const ORG_ROUTES = [
  '/org/overview',
  '/org/people',
  '/org/import',
  '/org/assignments',
  '/org/challenges',
  '/org/certificates',
  '/org/effectiveness',
  '/org/subscriptions',
  '/org/reports',
  '/org/settings',
];

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'laptop', width: 1024, height: 768 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'phone', width: 390, height: 844 },
];

/** Everything the app loads must come from its own origin: no CDN, no analytics. */
const APP_ORIGIN = 'http://127.0.0.1:4173';

const MIN_FONT_PX = 14;
const MIN_TAP_PX = 44;
const TOUCH_BREAKPOINT = 768;

async function signIn(page: Page, user: unknown) {
  await page.goto('/login');
  await page.evaluate((u) => {
    localStorage.setItem('gerabyte:session', '1');
    localStorage.setItem('gerabyte:current_user', JSON.stringify(u));
  }, user);
}

interface Audit {
  overflow: number | null;
  tinyText: string[];
  smallTargets: string[];
}

async function auditPage(page: Page): Promise<Audit> {
  return page.evaluate(
    ({ minFont, minTap }) => {
      const describe = (el: Element) => {
        const cls = String((el as HTMLElement).className || '')
          .split(' ')
          .slice(0, 3)
          .join('.');
        return `${el.tagName.toLowerCase()}${cls ? '.' + cls : ''} "${(el.textContent || '').trim().slice(0, 28)}"`;
      };
      const isVisible = (el: Element) => {
        const style = getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        const box = el.getBoundingClientRect();
        return box.width > 0 || box.height > 0;
      };

      // Every element that paints its own text, SVG <text>/<tspan> included.
      const tinyText: string[] = [];
      for (const el of document.querySelectorAll('*')) {
        const paintsText = [...el.childNodes].some(
          (n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim()
        );
        if (!paintsText || !isVisible(el)) continue;
        const size = parseFloat(getComputedStyle(el).fontSize);
        if (size < minFont) tinyText.push(`${describe(el)} @ ${size}px`);
      }

      const smallTargets: string[] = [];
      for (const el of document.querySelectorAll(
        'button, a[href], input:not([type=hidden]), select, textarea'
      )) {
        if (!isVisible(el)) continue;
        const box = el.getBoundingClientRect();
        if (box.height < minTap || box.width < minTap) {
          smallTargets.push(`${describe(el)} @ ${Math.round(box.width)}×${Math.round(box.height)}`);
        }
      }

      const scrollWidth = document.documentElement.scrollWidth;
      return {
        overflow: scrollWidth > window.innerWidth + 1 ? scrollWidth : null,
        tinyText: [...new Set(tinyText)],
        smallTargets: [...new Set(smallTargets)],
      };
    },
    { minFont: MIN_FONT_PX, minTap: MIN_TAP_PX }
  );
}

for (const viewport of VIEWPORTS) {
  test.describe(`${viewport.name} ${viewport.width}×${viewport.height}`, () => {
    test(`every route meets the UI standard`, async ({ page }) => {
      test.setTimeout(240_000);
      await page.setViewportSize(viewport);

      const consoleErrors: string[] = [];
      const foreignRequests: string[] = [];
      page.on('console', (m) => {
        if (m.type() === 'error') consoleErrors.push(`${page.url()} :: ${m.text()}`);
      });
      page.on('pageerror', (e) => consoleErrors.push(`${page.url()} :: ${e.message}`));
      page.on('request', (r) => {
        const target = new URL(r.url());
        if (target.protocol !== 'http:' && target.protocol !== 'https:') return;
        if (target.origin !== APP_ORIGIN) foreignRequests.push(r.url());
      });

      await signIn(page, ORG_ADMIN);

      for (const route of [...LEARNER_ROUTES, ...ORG_ROUTES]) {
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(300);

        expect(new URL(page.url()).pathname, `${route} should not redirect`).toBe(route);

        const audit = await auditPage(page);

        expect(audit.overflow, `${route} scrolls horizontally (${audit.overflow}px)`).toBeNull();
        expect(audit.tinyText, `${route} has text under ${MIN_FONT_PX}px`).toEqual([]);

        if (viewport.width <= TOUCH_BREAKPOINT) {
          expect(audit.smallTargets, `${route} has tap targets under ${MIN_TAP_PX}px`).toEqual([]);
        }
      }

      expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
      expect(
        foreignRequests,
        `requests left the app origin:\n${foreignRequests.join('\n')}`
      ).toEqual([]);
    });
  });
}

test.describe('access control', () => {
  test('a plain learner opening /org is sent back to the learner home', async ({ page }) => {
    await signIn(page, LEARNER);
    await page.goto('/org/overview');
    await page.waitForLoadState('networkidle');
    expect(new URL(page.url()).pathname).toBe('/');
  });

  test('a plain learner cannot reach any /org route', async ({ page }) => {
    test.setTimeout(120_000);
    await signIn(page, LEARNER);
    for (const route of ORG_ROUTES) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      expect(new URL(page.url()).pathname, `${route} must redirect`).toBe('/');
    }
  });

  test('an org admin cannot reach the Gera admin panel', async ({ page }) => {
    await signIn(page, ORG_ADMIN);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    expect(new URL(page.url()).pathname).toBe('/');
  });
});

test.describe('deleted surfaces', () => {
  test('/demo/palette no longer exists', async ({ page }) => {
    await signIn(page, ORG_ADMIN);
    await page.goto('/demo/palette');
    await page.waitForLoadState('networkidle');
    expect(new URL(page.url()).pathname).toBe('/');
    await expect(page.locator('body')).not.toContainText('پالت');
  });

  test('/faq no longer exists', async ({ page }) => {
    await signIn(page, ORG_ADMIN);
    await page.goto('/faq');
    await page.waitForLoadState('networkidle');
    expect(new URL(page.url()).pathname).toBe('/');
  });
});
