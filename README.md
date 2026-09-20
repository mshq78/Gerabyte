# GeraByte (گرابایت)

Persian (RTL) microlearning app by Gera Innovation Campus (پردیس نوآوری گرا).

- Learner app — mobile-first
- Organization dashboard (`/org`) — desktop-first
- Gera admin (`/admin`) — not built yet

See `CLAUDE.md` for the project map and the non-negotiables, `docs/RUNBOOK.md`
for environments and deploys, and `docs/SECURITY.md` for the threat model.

---

## Running it locally

You need Node 22+ and a PostgreSQL 16 database.

```bash
npm install
cp .env.example .env          # then fill in the secrets, see below
docker compose up -d          # Postgres on :5432, plus a gerabyte_test database
npm run db:migrate
npm run db:seed               # development data; refuses to run in production
npm run dev                   # API on :4000, web on :3000
```

Open http://localhost:3000. Vite proxies `/api` to the API server, so the
browser only ever sees one origin — the same as in production, which is what
makes the cookie and CSRF rules behave identically in both.

Generate the three secrets with `openssl rand -base64 48` each. The app refuses
to start if any of them is missing or too short.

### Commands

| Command               | What it does                                    |
| --------------------- | ----------------------------------------------- |
| `npm run dev`         | API and web together                            |
| `npm run dev:server`  | API only, with reload                           |
| `npm run web`         | Vite only                                       |
| `npm run db:generate` | Generate a migration from `db/schema.ts`        |
| `npm run db:migrate`  | Apply migrations (uses the **unpooled** URL)    |
| `npm run db:seed`     | Development seed data                           |
| `npm run typecheck`   | All three TypeScript projects                   |
| `npm run lint`        | ESLint, zero warnings allowed                   |
| `npm run test`        | Client unit tests (Vitest)                      |
| `npm run test:server` | Server tests against `TEST_DATABASE_URL`        |
| `npm run e2e`         | Playwright UI-standards suite                   |
| `npm run check`       | typecheck + lint + tests + server tests + build |

`check` skips the server tests when `TEST_DATABASE_URL` is unset, and fails
outright if that happens under CI. Playwright runs from `check` only under CI;
run it yourself with `npm run e2e`.

---

## Development accounts

`npm run db:seed` creates two organizations, so cross-organization isolation is
something you can actually try rather than take on trust.

**Password for every seeded account: `gerabyte-dev-1404`**

With `ALLOW_DEV_OTP=1` and `DEPLOY_ENV` other than `production`, the OTP code
`000000` is also accepted. Both are development-only: the server refuses to
boot in production with either that flag or `SMS_PROVIDER=console`.

On the staging deployment these same accounts exist, but the `credentials`
table is empty — sign in with `000000`, not with the password.

### مجتمع فولاد نمونه (Foolad)

Tree: `مجتمع فولاد نمونه` → `معاونت تولید و عملیات` → (`واحد نورد گرم و مقاطع`, `واحد ریخته‌گری`),
and `مجتمع فولاد نمونه` → `معاونت کیفیت` → `آزمایشگاه متالورژی`.

| Phone         | Name          | Roles                                    | Sees                                               |
| ------------- | ------------- | ---------------------------------------- | -------------------------------------------------- |
| `09120000001` | فریبا رادمنش  | learner, **org_admin**                   | The whole organization                             |
| `09120000002` | محمدرضا صادقی | learner, **unit_manager** (معاونت تولید) | That deputy's subtree: 3 nodes, 5 people           |
| `09120000003` | علیرضا رضایی  | learner, **unit_manager** (واحد نورد)    | That one unit: 1 node, 3 people                    |
| `09120000004` | زهرا کریمی    | learner                                  | Learner app only; `/org` redirects to `/`          |
| `09120000005` | سپیده رهنما   | learner                                  | — (no password; OTP only)                          |
| `09120000006` | حسین اکبری    | learner                                  | — (no password; OTP only)                          |
| `09120000007` | —             | —                                        | **Invited**, no user row yet: first login links it |

### پتروشیمی نمونه (Petro) — the isolation check

| Phone         | Name        | Roles                  |
| ------------- | ----------- | ---------------------- |
| `09130000001` | بهنام کیانی | learner, **org_admin** |
| `09130000002` | شیرین سعیدی | learner                |

Signed in as `09130000001`, nothing from Foolad is reachable — not in the tree,
not in the people list, and a direct request for a Foolad person answers 404
rather than 403, so the status code cannot confirm the record exists.

### Gera platform admin

| Phone         | Name            | Roles          |
| ------------- | --------------- | -------------- |
| `09100000000` | مدیر سامانه گرا | **gera_admin** |

`gera_admin` administers the platform, not any one organization's data: it is
refused on `/api/org/*` exactly like a learner. The `/admin` panel it is meant
for is not built yet.

---

## Where things are

```
src/          the React app
  api/        all data access — http.ts is the only door to the API
  features/   screens by area
  lib/        rules, jalali, toFa, permissions, privacy
  mock/       mock data, retired progressively through Phase 4
shared/       Zod schemas, DTO types and the error map, used by both sides
server/       Express app, routes, services, repositories, policies
db/           Drizzle schema, migrations, seed
api/index.ts  Vercel entry — the only vendor-specific file
```
