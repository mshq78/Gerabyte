# Handoff — Phase 2.5, remaining work

Who does what, and what has to be true before anything is merged.

Parts A and B1 are **done and committed** on
`phase-2.5-fixes-and-design-sync`. What follows is B2–B5 and C.

---

## The division

| Work                              | Who         | Why                                             |
| --------------------------------- | ----------- | ----------------------------------------------- |
| B2 `scripts/design-export.mjs`    | agent (IDE) | Mechanical, fully specified, machine-verifiable |
| B4 `scripts/design-diff.mjs`      | agent (IDE) | Same                                            |
| B3 `docs/DESIGN_CONTRACT.md`      | agent (IDE) | Prose against a fixed outline                   |
| B5 `docs/DESIGN_SYNC.md`          | agent (IDE) | Same                                            |
| C docs + `PHASE_2_5_REPORT.md`    | Claude      | It is the account of what happened              |
| Visual redesign                   | AI Studio   | After B2 exists, never before                   |
| Review, security judgement, merge | Claude      | See **The gate**                                |

AI Studio's turn comes only once `npm run design:export` produces a snapshot.
Until then it has no input.

---

## Why delegating here is safe

The invariants are code, not prose. A delegated agent cannot quietly break
them, because `npm run check` runs:

- `tsc -b` across four projects, `eslint --max-warnings=0`
- 101 client tests, 104 server tests
- **`routePolicy.test.ts`** — deny by default: any route without a declared
  policy fails the build
- **`check-server-emit.mjs`** — the emitted JavaScript must boot and answer
- **`check-dist.mjs`** — no demo, mock or design-mode marker in `dist/`
- **`check-no-mocks.mjs`** — no mock adapter in a production bundle
- **`check-design-mode.mjs`** — no design build for staging or production

Green is necessary, not sufficient. What it cannot judge is in **The gate**.

---

## B2 — `npm run design:export -- --out <dir>`

Writes a standalone frontend-only Vite + React + TS + Tailwind project.

**Includes:** `src/`, `shared/`, `public/`, `index.html`, a simplified
`vite.config.ts` (aliases kept, **no proxy**), the `tsconfig` files it needs,
a `package.json` with frontend dependencies only and scripts `dev`, `build`,
`typecheck`, and `.env` containing `VITE_DESIGN_MODE=1`.

**Excludes, absolutely:** `server/`, `db/`, `api/`, `docs/`, `e2e/`,
`scripts/`, every `.env*` from this repo, `vercel.json`, the reports.

**Also writes:** `DESIGN_CONTRACT.md` (copied from `docs/`), an empty
`DESIGN_CHANGELOG.md`, a short `README.md` on running it in AI Studio, and
`design-baseline.json` = `{ sourceCommit, exportedAt, files: { path: sha256 } }`.

**Secret scan — the part that matters.** Scan every emitted file and fail on
anything resembling a credential. At minimum: `postgres://`, `postgresql://`,
`npg_`, `-pooler.`, `.neon.tech`, `sk-`, `ghp_`, `vercel_blob_`,
`BEGIN * PRIVATE KEY`, any `*_SECRET`/`*_API_KEY`/`*_TOKEN` assignment with a
non-empty value, and any base64-looking run of 40+ characters. A scan that
cannot fail is worthless — include a test that plants a fake credential in a
temp tree and asserts a non-zero exit.

**Self-verification, in a temp copy:** `npm ci`, `npm run typecheck`,
`npm run build`, then start the dev server in design mode **with no backend
running** and assert the UI standards hold there too: no horizontal overflow,
no text under 14px, tap targets ≥44px at ≤768px, no console errors, no
request to any origin but its own.

**Pushes nothing.** It writes the folder and prints the commands to publish
it. Publishing is a human decision.

## B4 — `npm run design:diff -- --design <path-to-Gerabyte-clone>`

Compares that working tree against `design-baseline.json`, writes
`design-diff.md`, and **never edits this repo**.

Classify every changed/added/removed file as:

- **allowed** — `src/index.css`, `src/components/**`, `src/shells/**`,
  presentational markup inside `src/features/**/*Screen.tsx`, new
  presentational components and SVG assets
- **config** — `package.json`, `vite.config.ts`, `tsconfig*`
- **forbidden** — `src/api/**`, `src/types/**`, `shared/**`, `src/state/**`,
  `src/lib/rules.ts`, `src/lib/permissions.ts`, `src/design/**`, route guards
  and paths in `src/routes.tsx`, any test, any backend code or dependency

Also report: new dependencies; for each allowed change, whether this repo's
copy has also moved since `sourceCommit` (**conflict risk**, via `git diff`
against that commit); and the full `DESIGN_CHANGELOG.md` including its
**DATA NEEDS** section.

## B3 / B5 — the two documents

`docs/DESIGN_CONTRACT.md` is written for the designer and the tool: what may
change, what must not, the standards that still apply (tokens only, type
scale, nothing under 14px, targets ≥44px at ≤768px, Persian digits, RTL,
Jalali, no external network), and the rule that every change is logged in
`DESIGN_CHANGELOG.md` with a DATA NEEDS section.

`docs/DESIGN_SYNC.md` documents the loop: export → publish → design →
`design:diff` → port on `design-port-N` → `npm run check` + Playwright.
Carry the rule in bold: **AI Studio output is never merged wholesale; the
diff report is the gate.**

---

## The gate — what Claude checks that CI cannot

Bring back a branch, not files. `git diff main...<branch>` is the unit of
review.

1. **Does the secret scan actually fail?** Plant a credential, run it. A scan
   that always passes is the most dangerous line of code in this repo.
2. **Is the export really backend-free?** `grep -rE 'server/|db/|drizzle|
postgres|express' <out>` should find nothing but incidental words.
3. **Is the permission matrix still in exactly one place?** `shared/` has it;
   nothing else may define one.
4. **Did anything touch `src/api/**`, `src/state/**`, `shared/**`,
   `src/lib/permissions.ts`, or a route guard?** Those are forbidden to the
   design loop and suspicious anywhere else.
5. **Does design mode still fail to build for a deployment?** Both refusals,
   both directions.
6. **Did any test get weakened rather than satisfied?** A deleted assertion is
   a finding.

---

## Working with Claude economically

- Send a **branch name or a diff stat**, not file contents. Claude reads what
  it needs.
- Run `npm run check` **first**. Only bring what fails, or what needs
  judgement rather than a verdict.
- Batch the work: B2+B3+B4+B5 in one pass, then one review — not four.
- Don't ask Claude to re-read files it wrote in the same session.
- For the design port later: the `design-diff.md` report is the input. Do not
  paste the design repo's diff.
