# ADR-0010: CI/CD pipeline on GitHub Actions with skill gates

## Date and status
November 18, 2026. Accepted.

## Context
The app is built and live on Vercel (ADR-0002). We now need quality assurance
that runs automatically, so that as we keep changing the app we catch new bugs
and regressions before they reach users, and we keep to our coding, accessibility,
and security standards. This is the Week 5 Coding Challenge.

Constraints and inputs:
- The outcome: **every push runs automated checks; a failing check means "do not
  merge"; passing code merged to `main` ships to users via Vercel.**
- We are on **GitHub's free plan**, so we do **not** rely on branch protection to
  block a merge. The rule "red means stop" is followed by hand.
- The checks must come from our own **Week 2 MVP requirements** (use cases and BDD
  scenarios), and our **Week 1 Claude Skills** must be gate-checked on every push.
- Our tested logic (safe-to-spend ADR-0007, forecast ADR-0006, the recurrence
  engine) was only ever verified by hand — there were **no committed tests**.

## Options

### What to test (the testing pyramid)
- Mostly end-to-end browser tests — Bad: slow and brittle; too few, too fragile
  for a solo one-week build.
- **Mostly unit tests over the pure budget logic, plus lint/type-check and a
  build smoke** — Good: fast, cheap, deterministic, and they map directly to our
  BDD scenarios. This is the bottom-heavy pyramid the lecture recommends.
- We deferred Playwright end-to-end tests: higher upkeep than they are worth this
  week. The two end-to-end paths we care about most are covered by the **manual**
  test cases instead (see `Week 5 Coding Challenge/`).

### How to gate-check the Week 1 skills
The skills live in a separate Week 1 repository, which CI here cannot see.
- Git submodule — Bad: extra checkout wiring and a moving external dependency.
- **Vendor copies into this repo** (`.claude/skills/`) — Good: self-contained,
  works offline in CI, and the exact text we gate against is version-controlled
  here.

What "gate-check" means — we chose **both**:
- **Integrity:** a manifest (`.claude/skills/skills.manifest.json`) records the
  SHA-256 of each skill file; the gate fails if a file is missing or changed
  without updating the manifest on purpose.
- **Enforcement:** the mechanically-checkable rules are applied to the code —
  secret scan (security-guard), tests-must-exist (testing-standards), and no
  whole-library heavy imports (performance-guard). Accessibility is enforced as
  ESLint errors via `eslint-plugin-jsx-a11y` (bundled with `eslint-config-next`).

### Test runner
- Jest — heavier setup with Next.js. **Vitest** — Good: near-zero config, native
  TypeScript, resolves our `@/*` path alias, fast. Chosen.

## Decision
Add a single GitHub Actions workflow (`.github/workflows/ci.yml`) that runs
**on every push and every pull request**, with four independent jobs (each is its
own red/green check):

1. **lint-and-types** — `next lint` (includes jsx-a11y accessibility rules) +
   `tsc --noEmit`. Enforces coding and accessibility standards.
2. **unit-tests** — `vitest run` over `test/budget/*`, written from our Week 2
   use cases and BDD scenarios (safe-to-spend, forecast, recurrence, categorize,
   subscriptions, rewards). 36 tests. This also backfills the "was unit-tested"
   claims in ADR-0006/0007 so they are now true in CI.
3. **build** — `next build` with placeholder public env, proving the app still
   compiles and is deploy-ready (our smoke test).
4. **skills-gate** — `node scripts/skills-gate.mjs`, the integrity +
   enforcement check described above.

The build uses placeholder `NEXT_PUBLIC_*` values (not secrets; real values live
in Vercel). The service-role key is never used at build and never enters CI.

On the free plan we do not turn on branch protection; we follow "if the checks
are red, fix them before merging." Merging to `main` triggers the Vercel deploy.

## Consequences
- Quality is checked on every push: lint, types, 36 unit tests, a build, and the
  skill gate. A change that breaks a tested behavior, a type, a lint/a11y rule, a
  skill file, or the build now fails CI.
- Our BDD scenarios are executable, tied back to requirements, and cheap to run.
- The Week 1 skills can no longer be silently deleted or weakened, and their
  security/testing/performance rules are enforced against the code.
- Because there is no branch protection, a red check does not *technically*
  block a merge — the discipline is manual. A later move to a paid plan can turn
  on branch protection to make it automatic (no code change needed).
- New dev dependency: `vitest`. New scripts: `test`, `test:watch`, `typecheck`,
  `skills:gate`.

## Follow-ups (discovered while writing the tests)
- **Categorizer false positive:** `categorizeMerchant` uses plain substring
  matching, so "ne**tfl**ix" matches the Transport keyword "tfl" and is filed
  under Transport, not Entertainment. A test (`test/budget/categorize.test.ts`)
  pins this current behavior and labels it `[known quirk]`. A proper fix is
  word-boundary matching, which deserves its own change and tests.
