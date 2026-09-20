# Phase 2 — Backend foundation and real authentication

Branch `phase-2-backend`, nine commits on top of the Phase 1 head.
`npm run check` passes: typecheck, lint (zero warnings), 74 client tests,
75 server tests, production build with both bundle guards.

---

## Read this first: the precondition was false

The brief opened with _"Prompt 1 is merged into main."_ It is not. `main` is
still the pre-Phase-1 code; Phase 1 lives on `claude/phase-1-cleanup-npxwmn`
and has never been merged.

Rather than branch Phase 2 off an unmerged `main` — which would have discarded
every Phase 1 change and produced a branch that cannot be reviewed — I branched
`phase-2-backend` off the Phase 1 head. That is the conservative reading, but
it has a consequence you need to know about:

**`phase-2-backend` contains Phase 1 as well.** Merge Phase 1 first, or merge
`phase-2-backend` and get both. Do not merge Phase 2 expecting only Phase 2.

---

## What exists now

Eleven endpoints, all under `/api`:

| Method   | Path                      | Who                     |
| -------- | ------------------------- | ----------------------- |
| `GET`    | `/health`                 | anyone                  |
| `POST`   | `/auth/otp/request`       | anyone, rate limited    |
| `POST`   | `/auth/otp/verify`        | anyone, rate limited    |
| `POST`   | `/auth/login`             | anyone, rate limited    |
| `POST`   | `/auth/password`          | signed in               |
| `POST`   | `/auth/logout`            | signed in               |
| `GET`    | `/me`                     | signed in               |
| `PATCH`  | `/me`                     | signed in               |
| `GET`    | `/me/sessions`            | signed in               |
| `DELETE` | `/me/sessions/:id`        | signed in, own sessions |
| `GET`    | `/org/tree`               | manager or org admin    |
| `GET`    | `/org/people`             | manager or org admin    |
| `GET`    | `/org/people/:id/summary` | manager or org admin    |

Ten tables: `orgs`, `org_nodes`, `users`, `credentials`, `memberships`,
`user_roles`, `sessions`, `otp_codes`, `rate_limits`, `audit_log`. Two
migrations, both applied to the staging database.

---

## By step

### 1 — Repo structure and config

`shared/`, `server/`, `db/`, `api/index.ts`, `server/main.ts`. Four TypeScript
projects (`base`, `app`, `server`, `e2e`) under one solution `tsconfig.json`,
with path aliases `@shared/*`, `@server/*`, `@db/*`, `@/*`.

`.env.example` documents every variable with its purpose.
`docker-compose.yml` brings up Postgres 16 plus a second `gerabyte_test`
database. Scripts added: `dev:server`, `dev` (both at once), `test:server`,
`db:generate`, `db:migrate`, `db:seed`.

`noUncheckedIndexedAccess` is on for the **server project only**. Turning it on
repo-wide surfaced 81 pre-existing errors in `src/`; fixing those is a Phase 1
cleanup that was not in this brief, and the value of the flag is highest where
untrusted input is indexed.

### 2 — Schema v1 and seed

`db/schema.ts`, `db/migrations/0000_v1_identity_and_org.sql` and
`0001_audit_log_append_only.sql`, `db/seed.ts`.

The organization tree is a **materialized path** (`/uuid/uuid/`) with a
`text_pattern_ops` index, so a subtree query is one indexed prefix scan.

`0001` makes `audit_log` append-only three ways: `REVOKE UPDATE, DELETE,
TRUNCATE … FROM PUBLIC`, a row trigger on `UPDATE OR DELETE`, and a statement
trigger on `TRUNCATE`. The REVOKE alone is not enough — a table owner bypasses
its own privileges — and a row trigger never sees `TRUNCATE`. All three raise
`42501`, verified by test and again against the staging database.

The seed builds two organizations so isolation is testable rather than assumed:
مجتمع فولاد نمونه (6 nodes, 7 people) and پتروشیمی نمونه (3 nodes, 2 people),
plus a Gera platform admin and one **invited** membership with no user row, so
the first-login linking path has something to link. Accounts are documented in
`README.md`. The seed refuses to run with `NODE_ENV=production`.

### 3 — Authentication and identity

`server/routes/auth.ts`, `server/routes/me.ts`, and the services behind them.

Sessions are opaque and server-side; the database stores only
`HMAC(SESSION_HASH_SECRET, token)`. Cookie is httpOnly, `SameSite=Lax`,
`Secure` and `__Host-` prefixed on every https deployment. 14-day idle window
slid on use but never past a 60-day absolute deadline. Listable, revocable, and
a password change revokes every other session.

OTP is six digits, 120-second TTL, stored as
`HMAC(secret, "otp:phone:codeId:code")` — bound to the phone _and_ that code id
so a hash cannot be replayed across requests. Constant-time compare, five
attempts, 60-second resend cooldown, atomic consume. The request endpoint
answers identically whether or not the account exists; the function that issues
the code does not know.

Passwords: argon2id (m=19456, t=2, p=1) via `@node-rs/argon2`. Errors come from
one map in `shared/errors.ts` — stable English codes, Persian messages — used
by both the server and `src/api/http.ts`.

### 4 — One scoped resource, end to end

`server/policies/`, `server/repositories/org.ts`, `server/routes/org.ts`,
`server/dto/`.

`Scope` (`{ orgId, nodePath, rootNodeId }`) is a **required argument** on every
organization repository function, so an unscoped query does not compile. It is
resolved from the principal on the server; nothing in the request contributes
to it.

Out-of-scope reads answer **404, not 403**. A status code must never confirm
that a record exists.

DTOs are built field by field. Phones are masked before they leave the process.
Managers get progress, scores, certificates and active days for assigned paths —
never coins, rewards, personal paths or email. Every individual summary view
writes an `org.person.viewed` audit row.

### 5 — Frontend wiring

`src/api/http.ts` is the only door to the API: `credentials: 'same-origin'`,
always sends `X-Requested-With: gerabyte`, maps error codes to Persian, and
clears the identity on any 401.

`AppContext` was rewritten around `/api/me`. The `gerabyte:session` flag and
the stored user object are gone — identity is whatever the server last said,
and a `ready` gate stops the route guards flashing. Auth, `/me` and the org
tree/people screens are real HTTP; everything else still calls its mock
adapter through a clearly marked `MOCK_ONLY` bridge that overlays real identity
onto mock progress.

`scripts/check-no-mocks.mjs` fails a build whose bundle still contains a mock
marker unless `ALLOW_MOCK_STAGING=1`. The login screen is six boxes now, driven
by `OTP_LENGTH`. `src/demo/` is deleted.

### 6 — Tests

75 server tests across five files:

| File                            | Tests | Covers                                                                             |
| ------------------------------- | ----- | ---------------------------------------------------------------------------------- |
| `server/routes/auth.test.ts`    | 23    | OTP issue/verify/expiry/attempts, cooldown, limits, no enumeration, password login |
| `server/routes/session.test.ts` | 16    | cookie flags, idle and absolute expiry, revocation, CSRF                           |
| `server/routes/org.test.ts`     | 25    | RBAC, scope, cross-org isolation, 404-not-403, masking, audit rows                 |
| `server/logger.test.ts`         | 6     | redaction of phones, codes, cookies, authorization                                 |
| `db/auditLog.test.ts`           | 5     | append-only under UPDATE, DELETE and TRUNCATE                                      |

Plus 74 client unit tests and 10 Playwright tests, which now sign in against
the real API rather than a stubbed session. `check` runs the server tests when
`TEST_DATABASE_URL` is set and fails outright if that is missing under CI.

### 7 — Deployment skeleton

`vercel.json`, `docs/RUNBOOK.md`, `docs/SECURITY.md`, `GET /api/health`.

Created with the Neon and Vercel MCP tools:

- Neon project **`gerabyte`** (`winter-darkness-24928445`), `aws-us-east-2`,
  Postgres 17. Branch `staging` (`br-fancy-mode-b4saatcn`), database
  `gerabyte`, role `gerabyte_app`. Both migrations applied: 10 tables, 33
  indexes, 11 foreign keys, 4 enums, both audit triggers, and the two
  `drizzle.__drizzle_migrations` rows so `npm run db:migrate` from a machine
  with TCP access is a clean no-op.
- Eleven environment variables on the Vercel project `gerabyte`, secrets marked
  sensitive and generated fresh — staging does not share a secret with any
  developer's `.env`.

The pre-existing Neon project `geradb` belongs to the older _gerav1_ app and
was deliberately left untouched.

Deploying it found a real bug that no test could have caught. Vercel
transpiles `server/`, `db/`, `shared/` and `api/` **file by file** rather than
bundling them, and Node's ESM loader does not guess extensions, so the first
request died with `ERR_MODULE_NOT_FOUND: Cannot find module
'/var/task/server/app'`. Every backend relative import now carries an explicit
`.js` extension, directory imports included (`./sms` → `./sms/index.js`). tsx,
Vite and vitest all resolve a `.js` specifier back to its `.ts` source, so
nothing changed locally — what changed is that the emitted output is loadable.
Verified by emitting the server to JavaScript with `tsc` and driving a request
through the emitted `api/index.js` under plain Node, with no bundler involved:
`{"status":200,"body":{"status":"ok","database":"ok",…,"passwordHasher":"argon2id"}}`.

**What I could and could not verify on the deployment itself.** The edge
headers are confirmed live — CSP, HSTS, `Referrer-Policy: same-origin`, the
Permissions-Policy, COOP, CORP, `X-Robots-Tag: noindex, nofollow` and
`Cache-Control: no-store` on `/api/*` all came back on a real response. The
`/api/health` body did not: this container has no general outbound HTTP, and
the deployment sits behind Vercel Authentication, so the only tool that can
reach it stops at the SSO redirect. Creating a standing protection-bypass
secret would have got me a green tick at the cost of a permanent credential on
your project, which is the wrong trade for this phase. Run the one-liner in
`docs/RUNBOOK.md` from a browser you are logged into and you will have the
confirmation in a second.

---

## Decisions I changed, and why

Everything else follows the brief's defaults. Three departures:

**1. Security gates key off `DEPLOY_ENV`, not `NODE_ENV`.**
Vercel sets `NODE_ENV=production` on every deployment, staging included. Gating
on it would either refuse to deploy staging at all or force us to lie about
`NODE_ENV` and lose the production build. `DEPLOY_ENV` (`local | staging |
production`) is explicit. `production` still refuses `ALLOW_DEV_OTP`,
`SMS_PROVIDER=console` and a non-https `APP_ORIGIN` — the refusals are intact,
they are just keyed on a variable that means what it says.

**2. `__Host-` and `Secure` apply to every https deployment, not only
production.** The brief said production; staging is also https and also holds
real sessions, so there is no reason to weaken it there.

**3. Staging is deliberately left unseeded.** The seed sets one documented
password on every account. A database reachable from anywhere with its
connection string should not come pre-loaded with known credentials. The exact
command is in the runbook; run it when you want to demo.

Two things the brief allowed that I did **not** do: argon2id runs natively on
Vercel, so the scrypt fallback stayed a fallback (it is still implemented and
`/api/health` reports which one is live); and `ALLOW_DEV_OTP` is not set on any
deployment.

---

## Exact Vercel environment variables

Project `gerabyte` (`prj_FL0e4SQXnQ5VQtrofbmJCEa2EVuJ`), team `gerabyte`.
All eleven are set on **Production + Preview**, except `APP_ORIGIN`.

| Key                     | Target        | Type      | Value                                         |
| ----------------------- | ------------- | --------- | --------------------------------------------- |
| `DEPLOY_ENV`            | prod+preview  | plain     | `staging`                                     |
| `APP_ORIGIN`            | **prod only** | plain     | `https://gerabyte.vercel.app`                 |
| `SMS_PROVIDER`          | prod+preview  | plain     | `console`                                     |
| `LOG_LEVEL`             | prod+preview  | plain     | `info`                                        |
| `TRUST_PROXY_HOPS`      | prod+preview  | plain     | `1`                                           |
| `ALLOW_MOCK_STAGING`    | prod+preview  | plain     | `1` — delete this when going to production    |
| `DATABASE_URL`          | prod+preview  | sensitive | Neon `staging` pooled URL, `?sslmode=require` |
| `DATABASE_URL_UNPOOLED` | prod+preview  | sensitive | Neon `staging` direct URL, `?sslmode=require` |
| `OTP_HMAC_SECRET`       | prod+preview  | sensitive | 48 random bytes, base64                       |
| `SESSION_HASH_SECRET`   | prod+preview  | sensitive | 48 random bytes, base64                       |
| `IP_HASH_SECRET`        | prod+preview  | sensitive | 32 random bytes, base64                       |

`APP_ORIGIN` is **not** set for Preview on purpose: every branch gets its own
URL and CSRF compares the Origin exactly. `api/index.ts` fills it from
`VERCEL_BRANCH_URL` instead, so the branch URL a pull request links to works.

Strip `channel_binding=require` from Neon's connection string — it is a libpq
parameter and postgres.js does not implement `SCRAM-SHA-256-PLUS`. Keep
`sslmode=require`.

Two leftovers from the AI Studio scaffold, `GEMINI_API_KEY` and `APP_URL`, are
still on the project. Nothing reads them; delete when convenient.

---

## Manual steps left for you

1. **Merge Phase 1.** See the top of this report.
2. **Seed staging** if you want to demo it:
   `DATABASE_URL='<Neon staging pooled URL>' npm run db:seed`.
3. **Get Kavenegar credentials** and set `SMS_PROVIDER=kavenegar` plus
   `KAVENEGAR_API_KEY`. Test the outbound call from a _deployed_ function
   before relying on it.
4. **Create the Neon `production` branch** when production is real. I could not
   create it from this session — the tool call was refused — so it is a console
   click: Branches → New branch, parent `staging`, name `production`.
5. **Attach the real domain** and set `APP_ORIGIN` to it.
6. **Keep Vercel Authentication on** until steps 3–5 are done.

The full going-to-production checklist is in `docs/RUNBOOK.md`.

---

## Known gaps

- **Kavenegar egress from Vercel is untested.** A Vercel region reaching an
  Iranian SMS provider is the one assumption in this stack nobody has verified.
  If it fails, the fix is a small proxy or a different provider, not a redesign
  — `SmsProvider` is a two-method interface.
- **Per-account lockout is not enforced.** `credentials.failed_attempts` and
  `locked_until` exist and are indexed, but only the rate limiter is in the
  path today. A single phone is still capped at 5 attempts an hour.
- **Staging runs `SMS_PROVIDER=console`,** so OTP codes appear in the Vercel
  runtime log. Acceptable only because staging is behind Vercel Authentication.
- **Preview deployments answer 403 on writes if you open the per-deployment
  URL** rather than the branch URL. Documented; fixing it properly needs a
  multi-origin CSRF allowlist, which is more machinery than a preview deserves.
- **`ALLOW_MOCK_STAGING=1` is on the Vercel project.** It has to be until the
  remaining adapters are real. It is the one variable that must be deleted
  before production.
- **Business rules still run on the client** (`src/lib/rules.ts`). Phase 3.
- **Everything outside identity and org reads is still mock-backed** — XP,
  leagues, exams, certificates, subscriptions, notifications.
- **`/admin` does not exist.** `gera_admin` is defined, audited and refused on
  `/api/org/*`, and has nowhere to go yet.
- **Nothing guards the emitted-JavaScript path.** The extension bug above was
  invisible to typecheck, lint and every test, because all three resolve
  modules the way a bundler does. A `scripts/check-server-emit.mjs` that emits
  the server with `tsc` and imports the result under plain Node would catch the
  whole class in about ten seconds. I did not add it — it is outside this
  brief — but it is the cheapest insurance in the repository.
