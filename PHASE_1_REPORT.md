# Phase 1 — cleanup and hardening: final report

Branch `claude/phase-1-cleanup-npxwmn`, ten commits, one concern each.
`npm run check` and `npm run e2e` both pass.

---

## Before / after

| Metric | Before | After | Target |
| --- | ---: | ---: | --- |
| Raw hex in `.tsx` | 56 | **1** | 0 + the certificate QR exception |
| `text-xs\|sm\|base\|lg\|xl\|2xl\|3xl` and `text-[Npx]` | 8 | **0** | 0 |
| `grep -rn "۱۴۰۳" src` | 63 | **0** | 0 |
| Hard-coded ISO date literals | 39 | **0** | — |
| Entry chunk, raw | 698.17 kB | **54.48 kB** | ≤ 350 kB |
| Entry chunk, gzip | 200.58 kB | **16.64 kB** | ≤ 110 kB |
| Learner `/` first load, raw | 757.2 kB | **559.9 kB** | — |
| Learner `/` first load, gzip | 210.9 kB | **170.3 kB** | — |
| ESLint findings | 255 | **0** | 0 warnings |
| Chart SVG text | 10–13 px | **14 px** | ≥ 14 px |
| Tap targets < 44 px at ≤ 768 px | People 24, Settings 38, Challenges 12, Overview 10, Assignments 5, Certificates 9, Subscriptions 4–9 | **0 on every route** | 0 |
| Unit tests | 0 | **74** | — |
| Browser tests | 0 | **9** | — |

Tap-target and font measurements are taken from Chromium against the production
build, across all 21 routes at 1280×800, 1024×768, 768×1024 and 390×844.

### Chunk list

**Before** — one monolith plus Recharts:

```
index-DfrdmcAN.js            698.17 kB │ gzip: 200.58 kB
CategoricalChart-*.js        257.80 kB │ gzip:  80.18 kB
export-*.js                  141.07 kB │ gzip:  40.65 kB
BarChart-*.js                103.61 kB │ gzip:  26.00 kB
index-*.css                   59.03 kB │ gzip:  10.36 kB
… 13 lazy /org screens, 8.6–43.3 kB each
```

**After** — vendors pinned, every route split:

```
index-DofvEMl8.js             54.48 kB │ gzip:  16.64 kB   ← entry
react-BiOlaq-y.js            251.04 kB │ gzip:  79.71 kB   react + react-dom + react-router
motion-Jg27KnDq.js           133.22 kB │ gzip:  43.60 kB
recharts-Bhw7cfu-.js         375.46 kB │ gzip: 107.71 kB   /org only
export-BgkI2arg.js           141.07 kB │ gzip:  40.72 kB   /org only
data-CeQvKH0G.js              54.41 kB │ gzip:  16.62 kB   mock data
index-CfHCh9DY.css            59.24 kB │ gzip:  10.43 kB
… 21 route chunks, 0.1–32.6 kB each
```

Confirmed over the wire: the learner home pulls **no** Recharts and **no**
dashboard chunk.

---

## Changed files by step

### Step 1 — tooling and project map
`package.json`, `package-lock.json` (new), `bun.lock` (deleted), `eslint.config.js` (new),
`.prettierrc.json` (new), `.prettierignore` (new), `vite.config.ts`, `CLAUDE.md` (new),
`metadata.json` (deleted), `.env.example` (deleted) — plus a Prettier pass over 79 files
and a lint pass over 40.

- npm with a lockfile; scripts `dev build preview typecheck lint format test e2e check`.
- ESLint flat config: typescript-eslint + react-hooks + jsx-a11y, `--max-warnings=0`.
- Prettier: single quote, 2 spaces, 100 cols. Vitest on jsdom. Playwright.
- AI Studio leftovers removed; no `GEMINI`/`APP_URL`/`DISABLE_HMR` reference survives.
- 255 ESLint findings cleared: 98 unused bindings, 49 `any` (replaced by an
  `errorMessage(err: unknown)` helper and real types), 45 unlabelled controls,
  26 keyboard-inoperable click handlers, and the rest.

### Step 2 — removing what must never ship
`src/features/demo/` and `src/features/faq/` (deleted), `src/routes.tsx`, `src/shells/*`,
`src/demo/{DemoPanel,DemoTools,OrgSimulatorPanel,personas}.tsx`, `src/components/DevTools.tsx` (new),
`scripts/check-dist.mjs` (new), `src/types/domain.ts`, `src/api/auth.ts`.

- `/demo/palette` and `/faq` gone; the role toggle gone from `DashboardShell`.
- `OrgDemoPanel` moved to `src/demo/OrgSimulatorPanel.tsx`, unmounted from all three screens.
- `src/demo/*` now loads only through a dynamic `import()` inside an
  `import.meta.env.DEV` branch, and only with `?demo=1`. The folder tree-shakes
  out of production entirely — verified by grepping `dist/`.
- The dev panel offers the four required dashboard personas.
- `scripts/check-dist.mjs` runs as part of `build` and fails on `DEMO_ONLY`,
  `mock_jwt`, `PaletteDemo` or `پنل دموی`.

### Step 3 — access control (UX guard only)
`src/lib/permissions.ts` (new), `src/routes.tsx`, `src/features/org/context/ScopeContext.tsx`,
`src/shells/DashboardShell.tsx`, `src/types/org.ts`, four `/org` screens.

- `Permission` union, `can(role, permission)`, `useCan(permission)`, plus
  `resolveOrgRole` / `canOpenDashboard` / `isGeraAdmin`.
- `RequireRole`: `/org/*` needs org_admin or unit_manager, `/admin` needs gera_admin;
  otherwise redirect to `/` with the toast «به این بخش دسترسی ندارید».
- `ScopeContext` reads the role from `user.roles` only. The
  everyone-is-org_admin fallback and the hard-coded `u-nord` are gone; a unit
  manager is scoped to `user.managedNodeId`; org_admin wins when both roles are held.
- Sidebar entries and the three in-screen guards are keyed on permissions.
- `// TODO(server): authoritative RBAC and scope on every endpoint; UI guards are UX only.`
  sits next to all eight guards.

### Step 4 — dates
`src/lib/jalali.ts`, `src/lib/toFa.ts`, `src/mock/{data,org/data}.ts`, `src/api/rewards.ts`,
`src/api/org/{certificates,subscriptions,challengeRequests,client,import}.ts`, six `/org` screens.

- New helpers: `isoDaysFromToday`, `isoHoursFromNow`, `isoMinutesFromNow`,
  `daysSince`, `daysUntil`, `isOverdue`, `formatJalaliYear`,
  `formatJalaliMonthYear`, `formatJalaliNumeric`, `parseJalaliNumeric`, `toEn`.
  All anchored to midday Asia/Tehran (fixed UTC+03:30).
- Assigned = now − 10 days, due = now + 14 days, last active = now − N days,
  report issue dates = today.
- States are computed from dates: at-risk after 7 idle days, inactive after 21,
  an assignment overdue once its due date has passed.
- The two Jalali date inputs round-trip through `parseJalaliNumeric`, which is
  tested against 731 consecutive days.

### Step 5 — privacy
`src/lib/privacy.ts` (new), `src/features/org/screens/{OrgPeopleScreen,OrgPersonDetailScreen}.tsx`,
`src/features/org/utils/export.ts`, `src/api/org/client.ts`.

- `maskPhone()` renders «۰۹۱۲***۴۵۶۷» in the People list, the person report and both exports.
- Email dropped from the person report, its print header and the exports.
- Member search no longer matches on email — matching a hidden field would let a
  manager confirm addresses by probing.
- The report states «این گزارش فقط مسیرهای تخصیصی سازمان را شامل می‌شود.» on
  screen and in print, and shows no coins, rewards or non-assigned paths.

### Step 6 — design standard
`src/index.css`, `src/components/charts/{ChartFrame,RtlTooltip,chartTheme}` (new),
`src/features/org/screens/{OrgOverviewScreen,OrgReportsScreen,OrgPersonDetailScreen,OrgPeopleScreen,OrgAssignmentsScreen}.tsx`,
`src/features/certificates/CertificateDetailScreen.tsx`.

- `--color-chart-1…6` added to `@theme`; every Recharts prop takes `var(--color-…)`.
- `ChartFrame` gives each chart a «نمودار / جدول» switch showing the same numbers
  as a table; `RtlTooltip` puts the tooltip body in its own `dir="rtl"` wrapper.
- RTL recipe applied: chart in a `dir="ltr"` box, time-series X axis `reversed`,
  Y axis `orientation="right"`, Persian digits in tick formatters.
- All SVG text is 14px. The person report's radar chart is gone — the domain bars
  beside it already carried the same five numbers, and Recharts now leaves that route.
- Long domain names use horizontal bars.
- 44×44 floor at ≤768px from an unlayered rule, so desktop density is untouched.
- People and Assignments stack into rows below `md` with filters in a bottom sheet;
  the table and the card grid take over from `md` up.

### Step 7 — performance
`src/routes.tsx`, `vite.config.ts`, `index.html`, `public/favicon.svg` (new).

- All learner routes lazy behind one Suspense boundary with a skeleton fallback.
- `manualChunks` (function form — Rolldown rejects the object form) for
  react/react-router, motion and recharts.
- A self-hosted SVG favicon, so the browser's automatic `/favicon.ico` request
  stops logging a console 404 on every page.

### Step 8 — tests
`src/lib/{rules,jalali,toFa,permissions,privacy}.test.ts`, `src/api/org/import.test.ts`,
`e2e/ui-standards.spec.ts`, `playwright.config.ts`, `scripts/run-e2e-in-ci.mjs`, `CLAUDE.md`.

74 Vitest tests and 9 Playwright tests, as listed in the commit message.
`check` runs Playwright only under `CI`; locally use `npm run e2e`, or
`npm run check:e2e` for both. Documented in `CLAUDE.md`.

---

## Deliberately not done

- **`react-hooks/set-state-in-effect` is off.** Its 16 hits are all
  `useEffect(() => { loadData(); }, [])` — the mount-fetch pattern every screen
  uses. Re-architecting the data layer belongs with the real API in Phase 2, not
  in a cleanup pass. The classic rules (`rules-of-hooks`, `exhaustive-deps`)
  are errors and pass clean.
- **No type-aware ESLint rules.** They need a `project` service and roughly
  double lint time for a codebase with zero remaining `any`.
- **Assignments has no table to keep at ≥768px.** It was a card grid, never a
  table. I added the stacked rows below `md` as specified and left the card grid
  as the ≥`md` view.
- **`motion` (133 kB) still loads on the learner home.** `ByteRow` and `Toast`
  animate; removing it would mean removing animations, which is a visual change
  beyond the listed scope. The stated entry-chunk target is met with a 6× margin
  regardless.
- **Tap targets below 44px at 1024 and 1280** are left alone — the rule is
  scoped to ≤768px, and bumping dense desktop controls would be a redesign.
- **Mock data still ships** in the production bundle (`data-*.js`, 54 kB). That
  is Phase 1 by design; `src/mock` goes at the end of Phase 4.

---

## Risks and things worth knowing

1. **TypeScript was pinned from 7.0.2 down to 5.9.** The 7.0.x npm package is
   the native Go port: its `exports` map resolves to `lib/version.cjs` and it
   ships no JS compiler API at all, so typescript-eslint (and every other
   TS-based tool) cannot load it. Zero-warning linting was a hard requirement,
   so this was unavoidable. The code typechecks identically under both.
   Revisit when typescript-eslint ships TS 7 support.

2. **Two theme tokens were referenced but never defined.** `--color-secondary`
   (7 uses) and `--color-primary-hover` (14 uses) did not exist in `@theme`, so
   those classes silently did nothing — status chips and button hovers were
   inheriting instead of rendering their intended colour. I defined both to
   match the existing palette (`#1f9a8a`, `#1a6295`). **Worth a designer's eye**:
   I inferred the values, nobody specified them.

3. **The touch-target floor is a blanket CSS rule.** It is unlayered so it
   outranks Tailwind utilities, and it coerces layout-less inline anchors and
   buttons to `inline-flex`. I scoped the coercion away from anything already
   declaring `flex`/`grid`/`block`/`hidden` after it collapsed a `flex-col` link,
   and verified all 21 routes at all four viewports afterwards. Still, it is a
   broad rule: new markup at ≤768px inherits it whether or not it wants it.

4. **A unit manager's scope is not actually enforced anywhere but the UI.**
   `ScopeContext` narrows `effectiveUnitId` to `managedNodeId`, but the mock API
   happily returns whatever unit id it is handed. Until the server enforces
   scope, a manager who edits `localStorage` sees everything. Every guard is
   marked with the `TODO(server)` line.

5. **The `remainingDays` fields on the persona subscriptions are still literals**
   that I aligned by hand to their new `endsAt` offsets. They will drift if
   someone edits one and not the other; the real fix is deriving them, which
   belongs with the subscription API in Phase 2.

6. **`parseJalaliNumeric` finds Nowruz by probing** 19–22 March against
   `Intl`'s Persian calendar rather than using a leap-year table. That is correct
   and dependency-free, and the round-trip test covers 731 consecutive days, but
   it is four `Intl` format calls per parse — fine for form input, not for a hot loop.

7. **`/admin` is now unreachable for every seeded persona**, because none carries
   `super_admin`. That is the specified behaviour and the e2e asserts it, but it
   does mean `AdminDashboardScreen` is currently dead UI.
