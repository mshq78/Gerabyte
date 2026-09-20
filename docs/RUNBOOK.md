# Runbook

Environments, deploys, migrations and the things that go wrong.

No secret value appears in this file. Secrets live in Vercel's environment
variables and in the Neon console, and nowhere else.

---

## Environments

| Environment | Where                                 | `DEPLOY_ENV` | Database (Neon branch) |
| ----------- | ------------------------------------- | ------------ | ---------------------- |
| local       | your machine, `npm run dev`           | `local`      | local Postgres 16      |
| preview     | one per git branch, created by Vercel | `staging`    | Neon `staging`         |
| staging     | https://gerabyte.vercel.app           | `staging`    | Neon `staging`         |
| production  | not created yet                       | `production` | Neon `production`      |

`DEPLOY_ENV` — not `NODE_ENV` — is what the security gates read. Vercel sets
`NODE_ENV=production` on every deployment including staging, so gating on it
would either block staging or force us to lie about it and lose the production
build. `DEPLOY_ENV` is explicit and says what we actually mean:

- `production` refuses to boot with `ALLOW_DEV_OTP`, with
  `SMS_PROVIDER=console`, or with a non-https `APP_ORIGIN`.
- anything other than `local` sets the `__Host-` cookie prefix and `Secure`.
- anything other than `production` adds `X-Robots-Tag: noindex, nofollow`.

### Cloud resources

- **Vercel** — team `gerabyte`, project `gerabyte`
  (`prj_FL0e4SQXnQ5VQtrofbmJCEa2EVuJ`). Vercel Authentication (SSO protection)
  is **on**: every deployment, staging included, is behind the team login. Keep
  it on until there is a real production domain.
- **Neon** — project `gerabyte` (`winter-darkness-24928445`), region
  `aws-us-east-2`, Postgres 17. Branch `staging`
  (`br-fancy-mode-b4saatcn`), database `gerabyte`, role `gerabyte_app`.
  Pooled host `ep-bold-cherry-b4xhcn08-pooler.c-6.us-east-2.aws.neon.tech`;
  the direct host is the same name without `-pooler`.

The older Neon project `geradb` (`dawn-dream-86280570`) belongs to a previous
app and is not used by GeraByte. Leave it alone.

---

## Vercel environment variables

Set on the project, targets **Production** and **Preview**. `APP_ORIGIN` is the
exception: see _Preview deployments_ below.

| Key                     | Target       | Type      | Value                                             |
| ----------------------- | ------------ | --------- | ------------------------------------------------- |
| `DEPLOY_ENV`            | prod+preview | plain     | `staging`                                         |
| `APP_ORIGIN`            | prod only    | plain     | `https://gerabyte.vercel.app`                     |
| `SMS_PROVIDER`          | prod+preview | plain     | `console`                                         |
| `LOG_LEVEL`             | prod+preview | plain     | `info`                                            |
| `TRUST_PROXY_HOPS`      | prod+preview | plain     | `1`                                               |
| `DATABASE_URL`          | prod+preview | sensitive | Neon `staging` **pooled** URL, `?sslmode=require` |
| `DATABASE_URL_UNPOOLED` | prod+preview | sensitive | Neon `staging` **direct** URL, `?sslmode=require` |
| `OTP_HMAC_SECRET`       | prod+preview | sensitive | `openssl rand -base64 48`                         |
| `SESSION_HASH_SECRET`   | prod+preview | sensitive | `openssl rand -base64 48`                         |
| `IP_HASH_SECRET`        | prod+preview | sensitive | `openssl rand -base64 32`                         |
| `ALLOW_MOCK_STAGING`    | prod+preview | plain     | `1` — **Phase 2 only**, see below                 |
| `ALLOW_DEV_OTP`         | prod+preview | plain     | `1` — **staging demo only**, see below            |

Do **not** set `NODE_ENV` (Vercel owns it) or `PORT` (serverless has no port).

`ALLOW_DEV_OTP=1` makes the OTP `000000` valid. It is on so the staging demo can
be signed into without an SMS provider, and it is defensible only because
staging sits behind Vercel Authentication and carries no real data. Delete it
the moment either of those stops being true. It can never reach production by
accident: the server refuses to boot with `DEPLOY_ENV=production` and this flag
set.

`ALLOW_MOCK_STAGING=1` is set, and has to be for now: XP, leagues, exams,
subscriptions and notifications are still mock-backed, so `npm run build` fails
without it — which is the point of the check. It is the single variable that
must be **deleted** when `DEPLOY_ENV` flips to `production`; leaving it there
would let mock data ship to real users.

Strip `channel_binding=require` from the Neon URL. Neon's console adds it, but
it is a libpq parameter and postgres.js does not implement `SCRAM-SHA-256-PLUS`.
Keep `sslmode=require`.

Two variables predate this project and are unused: `GEMINI_API_KEY` and
`APP_URL`, both left over from the AI Studio scaffold. Delete them when
convenient — nothing reads them.

### Preview deployments

`APP_ORIGIN` is deliberately **not** set for the Preview target, because every
branch gets its own URL and CSRF compares the request Origin against it exactly.
`api/index.ts` fills it from Vercel's `VERCEL_BRANCH_URL` instead, so the branch
URL — the one a pull request links to — works. The unique per-deployment URL
(`...-abc123-team.vercel.app`) will answer 403 on any write; open the branch URL.

---

## Deploying

Vercel builds from git. `npm run build` runs `vite build`, then
`scripts/check-dist.mjs` (fails if a demo or mock string reached `dist/`) and
`scripts/check-no-mocks.mjs` (fails if a mock adapter reached the bundle). A
deploy that fails `check-dist` is meant to fail. A deploy that fails
`check-no-mocks` is telling you a mock adapter reached the bundle:
`ALLOW_MOCK_STAGING=1` is the staging answer, and the production answer is to
replace the adapter.

`vercel.json` routes `/api/*` to the single Express function and everything else
to `index.html`, and sets the security headers at the edge so static responses
carry them too. Its `X-Robots-Tag: noindex, nofollow` entry covers the whole
site and must be **removed** when a real production domain goes live — the
application only sets that header for itself, and only when
`DEPLOY_ENV !== production`.

### After a deploy

```bash
curl -s https://gerabyte.vercel.app/api/health | jq
```

Expect `status: "ok"`, `database: "ok"`, `deployEnv: "staging"` and
`passwordHasher: "argon2id"`. `database: "unreachable"` answers 503 and means
the Neon URL or the Neon compute, not the app.

Behind Vercel Authentication that curl returns the SSO page instead. Either open
the URL in a browser you are logged into, or use a
[protection bypass token](https://vercel.com/docs/deployment-protection) and
send it as `x-vercel-protection-bypass`.

---

## Migrations

**Never at request time.** Migrations run from a machine with direct TCP access
to Postgres, against the **unpooled** URL.

```bash
npm run db:generate      # after editing db/schema.ts — writes db/migrations/
npm run db:migrate       # applies anything unapplied
```

`db/migrate.ts` reads `DATABASE_URL_UNPOOLED`, falling back to `DATABASE_URL`.
PgBouncer cannot hold the advisory lock drizzle takes, so the pooled URL is the
wrong one here even when it appears to work.

To migrate staging from your machine:

```bash
DATABASE_URL_UNPOOLED='<Neon staging direct URL>' npm run db:migrate
```

Staging is already at `0001_audit_log_append_only`. Both rows are recorded in
`drizzle.__drizzle_migrations`, so the command above is a no-op until there is a
new migration.

### If you are somewhere without TCP 5432

Some sandboxes only allow outbound HTTPS, which Neon's Postgres port is not.
Apply the migration SQL through the Neon console's SQL editor (or the Neon MCP
`run_sql_transaction`), then insert the bookkeeping rows so drizzle knows:

```sql
CREATE SCHEMA IF NOT EXISTS drizzle;
CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
  id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint
);
INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
VALUES ('<sha256 of the .sql file>', <the "when" value from meta/_journal.json>);
```

`hash` is `sha256sum db/migrations/<file>.sql` — the whole file, verbatim.

---

## Seeding

`npm run db:seed` builds two organizations, nine people and the roles that make
cross-organization isolation testable. It refuses to run with
`NODE_ENV=production`.

**Staging carries the seed's organizations, people and roles, but no
passwords.** The `credentials` table is empty on purpose: a database reachable
from anywhere with its connection string should not be pre-loaded with a
documented password. Sign in with the OTP `000000` instead (see
`ALLOW_DEV_OTP` above).

To put the passwords there anyway, or to re-seed from scratch, run the real
seed from a machine with direct TCP access:

```bash
DATABASE_URL='<Neon staging pooled URL>' npm run db:seed
```

`SMS_PROVIDER=console` also writes every issued code to the Vercel runtime log
under `devOtp`. Between that and the dev OTP, anyone who reaches staging can
sign in as anyone — which is the reason staging stays behind Vercel
Authentication, and the reason none of this survives `DEPLOY_ENV=production`.

---

## Going to production

In order:

1. Create a Neon branch `production` from `staging` (console → Branches → New).
   It copies the schema; it will not copy data that is not there.
2. Point `DATABASE_URL` / `DATABASE_URL_UNPOOLED` for the Production target at
   that branch, and give staging its own values on the Preview target.
3. Attach the real domain to the Vercel project and set `APP_ORIGIN` to it.
4. Get Kavenegar credentials, set `SMS_PROVIDER=kavenegar` and
   `KAVENEGAR_API_KEY`, and **test the outbound call from a deployed function
   first** — a Vercel region reaching an Iranian SMS provider is the single
   assumption in this stack that has not been verified.
5. Generate fresh `OTP_HMAC_SECRET`, `SESSION_HASH_SECRET` and `IP_HASH_SECRET`
   for production. Do not reuse staging's.
6. Set `DEPLOY_ENV=production`. Boot now fails on `ALLOW_DEV_OTP`, on
   `SMS_PROVIDER=console` and on a non-https `APP_ORIGIN` — that is the check
   working.
7. Delete `ALLOW_MOCK_STAGING` and `ALLOW_DEV_OTP`, and remove the
   `X-Robots-Tag` entry from `vercel.json`.
8. Turn Vercel Authentication off only once the above is done.

---

## When something breaks

**Every request 403s.** CSRF. The browser's Origin does not equal `APP_ORIGIN`,
or the client did not send `X-Requested-With: gerabyte`. Compare the deployment
URL you opened against the `APP_ORIGIN` value.

**Login works, then every request is 401.** The session cookie is not coming
back. On https the cookie is named `__Host-gerabyte_session`, which the browser
refuses unless it is `Secure`, `Path=/` and has no `Domain`. A proxy that
rewrites the cookie domain will silently drop it.

**`Invalid environment configuration` on the first request.** Read the list; it
names every variable that failed and why. This is the intended behaviour — the
function is refusing to serve rather than run misconfigured.

**429 with `Retry-After`.** The rate limiter. Buckets are per phone and per IP,
sliding-window, stored in Postgres (`rate_limits`), so a cold start does not
reset them. Wait it out; do not raise the limits to make a test pass.

**A write to `audit_log` fails with `42501`.** It is append-only: `UPDATE`,
`DELETE` and `TRUNCATE` all raise. Nothing should be attempting them.

**Server logs look empty.** pino redacts phones, OTP codes, cookies,
authorization headers and passwords by design. `LOG_LEVEL=debug` adds volume,
not PII.
