# Security

What GeraByte defends against, how, and what is still open. Phase 2 scope:
identity, sessions, roles, scoped organization reads, audit and rate limiting.
Learning content, XP, exams, subscriptions and payments are not here yet.

---

## The one rule

**The server is the authority.** Every UI guard in `src/` is a user-experience
affordance — it hides a link that would 403 anyway. Nothing in the browser is
trusted: not a role, not an org id, not a node id, not a flag in localStorage.
If a check exists only on the client, it does not exist.

---

## Threat model

Who we are actually defending against, in the order they matter:

1. **A signed-in manager reaching beyond their unit.** The most likely real
   incident, and the one the scope machinery exists for. A unit manager who
   edits a URL must learn nothing about a sibling unit.
2. **A signed-in user of another organization.** Cross-organization reads must
   be impossible, and must not even confirm that a record exists.
3. **Phone-number brute force.** Iranian mobile numbers are guessable and the
   OTP space is a million codes. Both ends need limits.
4. **A stolen database dump.** Session tokens and OTP codes must be useless to
   whoever holds it.
5. **A hostile page in the user's browser.** Cross-site requests that ride the
   session cookie.

Out of scope for now: a compromised Vercel or Neon account, a malicious
administrator, and denial of service beyond per-phone and per-IP limits.

---

## Identity and sessions

Sessions are **opaque and server-side**. The browser holds a 32-byte random
token in a cookie; the database holds only `HMAC(SESSION_HASH_SECRET, token)`.
A dump of the `sessions` table cannot be replayed. No JWT ever reaches the
browser, and there is no client-readable identity: `/api/me` is the only answer
to "who am I?".

The cookie is `httpOnly`, `SameSite=Lax`, `Path=/`, and on every https
deployment it is `Secure` and named `__Host-gerabyte_session`. The `__Host-`
prefix is browser-enforced: no `Domain` attribute, so a sibling subdomain cannot
write it.

Two deadlines, both enforced server-side:

- **idle** — 14 days, slid forward on use but never past the absolute deadline.
- **absolute** — 60 days, not extendable.

Sessions are listable (`GET /api/me/sessions`) and revocable
(`DELETE /api/me/sessions/:id`). Revocation is immediate: the next request
carrying that token finds `revoked_at` set and is 401. Setting a password
revokes every other session.

Rotating `SESSION_HASH_SECRET` signs everybody out. That is the intended
emergency control.

---

## One-time codes

Six digits, 120-second TTL. Only `HMAC(OTP_HMAC_SECRET, "otp:phone:codeId:code")`
is stored — binding the hash to both the phone and that specific code id, so a
hash from one request cannot be replayed against another. Comparison is
constant time. Issuing a new code retires any code still in flight for that
phone, so only the newest works.

Five verify attempts per code; the fifth failure retires the code entirely.
Consumption is a conditional `UPDATE … WHERE consumed_at IS NULL`, so two
concurrent verifies of the same code cannot both win.

**No user enumeration.** `POST /api/auth/otp/request` answers identically for a
registered and an unregistered phone — same status, same shape, same timing
class. The function that issues a code does not know whether an account exists.

Development bypass: code `000000` is accepted only when `DEPLOY_ENV` is not
`production` **and** `ALLOW_DEV_OTP=1`. Production refuses to boot with that
flag set, and it is not set on any deployment.

---

## Passwords

argon2id via `@node-rs/argon2` (m=19456 KiB, t=2, p=1), minimum 8 characters.
The service probes the native binding at startup and falls back to scrypt
(`$scrypt$N=..,r=..,p=..$salt$hash`) if it cannot run, so a platform without the
native module degrades instead of failing. `/api/health` reports which one is
live; on Vercel it is argon2id.

The `algorithm` column records which KDF produced each hash, so migrating to a
different one later is a rehash-on-login, not a password reset for everyone.

Password brute force is bounded by the same limiter as OTP: 5 attempts per phone
per hour, 20 per IP per hour. The `credentials.failed_attempts` and
`locked_until` columns exist for a per-account lockout but are **not yet
enforced** — see *Known gaps*.

---

## Rate limiting

Sliding windows stored in Postgres, keyed by phone and by IP:

| Bucket               | Window | Max |
| -------------------- | ------ | --- |
| OTP request / phone  | 1 h    | 5   |
| OTP request / IP     | 1 h    | 20  |
| OTP resend cooldown  | 60 s   | 1   |
| OTP verify / IP      | 1 h    | 40  |
| Login / phone        | 1 h    | 5   |
| Login / IP           | 1 h    | 20  |

Postgres rather than memory, deliberately: serverless instances are
per-invocation, so an in-memory counter resets on every cold start and is
bypassed by fanning requests across instances. Over the limit answers **429**
with `Retry-After`. A rejected attempt is not itself recorded, so a caller
cannot extend their own lockout by hammering it.

---

## CSRF

Three independent layers on every state-changing request:

1. `SameSite=Lax` on the session cookie.
2. `X-Requested-With: gerabyte`. A cross-site form or `<img>` cannot set a
   custom header, and a `fetch` that does triggers a preflight we never answer.
3. `Origin` — or `Referer` when `Origin` is absent — must equal `APP_ORIGIN`.

Any of 2 or 3 failing is a 403. Neither header present is also a 403: a browser
always sends one for a cross-site state-changing request, so we refuse rather
than guess.

There is no cross-origin client, so there is no permissive CORS. A request whose
`Origin` is not ours is refused outright rather than answered without the
headers.

---

## Authorization, scope and isolation

Roles: `learner`, `unit_manager`, `org_admin`, `gera_admin`, stored as
`user_roles(user_id, role, org_id, node_id)`. A user may hold several.

The organization tree is a **materialized path** (`/uuid/uuid/`) with a
`text_pattern_ops` index, so "everything under this node" is one indexed prefix
scan rather than a recursive query.

Every organization repository function takes a required `Scope`
(`{ orgId, nodePath, rootNodeId }`). It is a required argument, so an unscoped
query is a **compile-time error** — you cannot forget it, only pass the wrong
one, and the wrong one is what the isolation tests check. The scope is resolved
from the principal on the server; nothing from the request body contributes to
it. `org_admin` outranks `unit_manager` and scopes to the org root.

**Out-of-scope reads answer 404, never 403.** A status code must not confirm
that a record exists. Asking for a person in another organization looks exactly
like asking for a person who does not exist.

`gera_admin` administers the platform, not any organization's data: it is
refused on `/api/org/*` exactly like a learner.

---

## What a manager may see

Managers see progress and scores for assigned paths, certificates for those
paths, and active days. They do **not** see coins, rewards, personal paths or
email addresses. Phone numbers are masked server-side (`۰۹۱۲***۴۵۶۷`) before
they leave the process.

DTOs are explicit whitelists built field by field. A database row is never
returned directly, so adding a column to a table cannot leak it through an
endpoint.

Every individual person report view writes an `org.person.viewed` audit row.
Looking at one person's record is an action with a name and an actor.

---

## Audit log

Append-only, in the strong sense. `UPDATE`, `DELETE` and `TRUNCATE` all raise
`42501`:

- `REVOKE UPDATE, DELETE, TRUNCATE … FROM PUBLIC` — defence in depth for any
  non-owner role the app connects as later.
- a **row** trigger on `UPDATE OR DELETE`, because a table owner bypasses its
  own table privileges and `REVOKE` alone would be theatre.
- a **statement** trigger on `TRUNCATE`, because row triggers never see it.

All three are verified by tests and were re-verified against the staging
database after migrating it.

Recorded: OTP requests, login success and failure, logout, session revocation,
role grants and revocations, individual report views, exports, imports and
approvals. Stored per row: actor, action, target type and id, org, a **hashed**
IP (salted with `IP_HASH_SECRET` — raw addresses are never stored), the request
id and the timestamp.

An audit write failure is logged and swallowed. Auditing must never break the
request it is recording.

---

## Logging

pino, with redaction of cookies, `authorization` and `set-cookie` headers,
phones (including `req.body.phone`), OTP codes, passwords and session tokens.
No PII in logs, by construction rather than by discipline — there is a test
that asserts a log line containing a phone and a code comes out redacted.

The one deliberate exception is the console SMS provider, which writes the code
under a field name the redaction list does not cover. That is exactly why
`DEPLOY_ENV=production` refuses to boot with `SMS_PROVIDER=console`, and why
staging stays behind Vercel Authentication.

---

## Transport and headers

helmet, plus the same set at the edge in `vercel.json` so static responses carry
them too:

- CSP: `default-src 'self'`, `script-src 'self'`, `object-src 'none'`,
  `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`,
  `upgrade-insecure-requests`. `style-src` allows `'unsafe-inline'` because
  Tailwind and the chart library both inject style attributes at runtime.
  `connect-src 'self'` — the app makes no external requests at runtime, fonts
  included.
- HSTS `max-age=63072000; includeSubDomains`
- `Referrer-Policy: same-origin`
- `Permissions-Policy` denying accelerometer, camera, geolocation, gyroscope,
  magnetometer, microphone, payment and usb
- `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  COOP and CORP `same-origin`
- `X-Robots-Tag: noindex, nofollow` everywhere except a real production
  deployment

JSON bodies are capped at 32 kB. Errors are generic: a stable English code and a
Persian message from a single map, never a stack trace or a driver message.
Every request carries an id, which appears in the log and in the audit row.

---

## Secrets

Three, all validated at boot and all required: `OTP_HMAC_SECRET` (≥32 chars),
`SESSION_HASH_SECRET` (≥32), `IP_HASH_SECRET` (≥16). Generate with
`openssl rand -base64 48`. They live in Vercel's environment variables, marked
sensitive, and in `.env` locally. They are not in the repository and must never
be.

Only `VITE_*` variables reach the browser, and none of them is a secret.

Rotation: `SESSION_HASH_SECRET` signs everyone out, `OTP_HMAC_SECRET`
invalidates codes in flight, `IP_HASH_SECRET` makes old audit IP hashes
incomparable with new ones. All three are survivable; plan for the first two.

---

## Known gaps

Honest list, all Phase 3 or later:

- **Per-account lockout is not enforced.** `credentials.failed_attempts` and
  `locked_until` exist and are indexed, but only the rate limiter is currently
  in the path. A distributed attacker with many IPs is still bounded to 5
  attempts per phone per hour, so this is a hardening item, not a hole.
- **Kavenegar egress from Vercel is untested.** A Vercel region reaching an
  Iranian SMS provider is the one assumption in this stack nobody has verified.
  Test it before it matters.
- **Staging runs `SMS_PROVIDER=console`,** which writes OTP codes to the
  runtime log. Acceptable only because staging is behind Vercel Authentication.
- **Everything outside identity and org reads is still mock-backed** — XP,
  leagues, exams, subscriptions, notifications. Those adapters ship only with
  `ALLOW_MOCK_STAGING=1`; a production build fails if one reaches the bundle.
- **Business rules still live in `src/lib/rules.ts`,** on the client. They move
  to the server in Phase 3. Nothing security-relevant depends on them today.
- **No refresh-token rotation or device binding.** Opaque sessions with idle and
  absolute deadlines are the whole story for now.
- **No 2FA beyond the OTP itself,** and no account-recovery flow.

## Reporting

Security issues go to the Gera Innovation Campus team directly, not into a
public issue.
