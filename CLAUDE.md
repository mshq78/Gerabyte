# GeraByte (گرابایت) — project map for Claude Code

Persian (RTL) microlearning app by Gera Innovation Campus (پردیس نوآوری گرا).
Learner app (mobile-first), organization dashboard (`/org`, desktop-first), Gera admin (`/admin`, not built yet).

## Stack
Vite + React 19 + TypeScript (strict) + Tailwind 4 (`@theme` tokens in `src/index.css`) + React Router 7 + Recharts (lazy).
From Phase 2: Express 5 + TypeScript + Zod + Drizzle ORM + PostgreSQL (Neon), deployed on Vercel.

## Layout
- `src/api`      all data access; every call goes through here (mock or http adapter)
- `src/types`    domain types (API contract until `shared/` takes over in Phase 2)
- `src/features` screens by area: auth, home, path, lesson, exam, league, challenges, rewards, certificates, profile, subscription, notifications, settings, org/*
- `src/shells`   LearnerShell (mobile column) and DashboardShell (desktop)
- `src/lib`      rules.ts (business rules; move to server in Phase 3), jalali, toFa, format, permissions
- `src/mock`     mock data (deleted at the end of Phase 4)
- `shared`       Zod schemas, DTO types and the error map, shared by web and server
- `server`       Express app: routes, services, repositories, policies, dto
- `db`           Drizzle schema, migrations, seed
- `api/index.ts` Vercel entry (the only vendor-specific file); `server/main.ts` is the plain Node entry

## Non-negotiables
- Persian UI, RTL, Persian digits (`toFa`), Jalali dates, Asia/Tehran. Store dates as ISO/UTC.
- No external network at runtime: fonts self-hosted, no CDN, analytics or remote images.
- Tokens only: no raw hex in `.tsx`; type scale `text-meta … text-display`; nothing below 14px (including SVG text); touch targets ≥ 44px at ≤ 768px.
- Never ship demo, mock or preview UI to production builds.
- The server is the authority for auth, RBAC, scope and business rules; UI guards are UX only.
- Identity comes from `/api/me`, never from localStorage. Sessions are opaque, server-side and
  httpOnly; no JWT reaches the browser. Every org repository function takes a required `Scope`.
- Out-of-scope reads answer 404, never 403, so a status code cannot confirm a record exists.
- Managers see only: progress and scores of assigned paths, certificates of those paths, active days. Phones are masked server-side. Never show coins, rewards, personal paths or emails to managers.
- Portability: standard PostgreSQL and a plain Node entry; vendor-specific code (Vercel, Neon) lives in adapters only.

## Commands
`npm run dev | build | typecheck | lint | test | test:server | e2e | check`
(`check` = typecheck + lint + client tests + server tests + build).
`build` also runs `scripts/check-dist.mjs`, which fails if a demo or mock string reached `dist/`.
`build` also runs `scripts/check-no-mocks.mjs`, which fails if a mock adapter reached the bundle
unless `ALLOW_MOCK_STAGING=1` (staging only).
`check` runs the server tests when `TEST_DATABASE_URL` is set and the Playwright suite when `CI`
is set; locally run those with `npm run test:server` and `npm run e2e`. Playwright uses the
browser already on the machine when `/opt/pw-browsers/chromium` exists, so no download step is
needed. Dev accounts are listed in README.md.

## Workflow
Small steps, one concern per commit (conventional commits), branch per phase. Run `npm run check` before finishing. Update this file when the structure changes.
