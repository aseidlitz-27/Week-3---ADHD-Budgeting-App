# Week 5 Coding Challenge — Submission

**Student:** Anika Seidlitz
**Project:** ADHD Budgeting App (MVP #1) — CI/CD pipeline

---

## Links

1. **GitHub repository:** https://github.com/aseidlitz-27/Week-3---ADHD-Budgeting-App
2. **Live app (Vercel):** https://week-3-adhd-budgeting-app-seven.vercel.app
3. **Database diagram:** https://github.com/aseidlitz-27/Week-3---ADHD-Budgeting-App/blob/main/docs/database-diagram.md
4. **CI workflow:** https://github.com/aseidlitz-27/Week-3---ADHD-Budgeting-App/blob/main/.github/workflows/ci.yml
5. **GitHub Actions runs:** https://github.com/aseidlitz-27/Week-3---ADHD-Budgeting-App/actions
6. **This week's ADR:** https://github.com/aseidlitz-27/Week-3---ADHD-Budgeting-App/blob/main/docs/adr/0010-ci-cd-pipeline-and-skill-gates.md

## Documents

1. _Notion links (Week 2 MVP requirements / use cases & BDD scenarios) — paste here._
2. _Any other document links._

---

## The pipeline at a glance (reference — verify before you submit)

The CI workflow runs on **every push** and on pull requests, with **four checks**:

| Check (GitHub Actions job) | What it does | Which standard it enforces |
| -------------------------- | ------------ | -------------------------- |
| **lint-and-types** | `next lint` (incl. jsx-a11y) + `tsc --noEmit` | coding + accessibility |
| **unit-tests** | `vitest run` — 36 tests from Week 2 use cases / BDD scenarios | catches bugs & regressions in the budget logic |
| **build** | `next build` with placeholder public env | app still compiles / deploy-ready |
| **skills-gate** | `scripts/skills-gate.mjs` — integrity + enforcement of the 5 Week 1 skills | Week 1 Claude Skills |

The two manual test case scenarios and their results are in
`Week 5 Coding Challenge/test-cases.md`.

**Before-you-submit checklist (from the syllabus):**
- [ ] Pushed a change and watched the checks run green on the Actions tab.
- [ ] Broke something on purpose, pushed, and confirmed the pipeline turned red.
- [ ] At least 3 new CI checks on the repo. _(We have 4.)_
- [ ] The Week 1 Claude Skills are checked on every push. _(skills-gate job.)_
- [ ] Ran both manual test case scenarios on the live app and wrote down results.
- [ ] The live app still works after merging.

---

<!--
  ⚠️  The two sections below MUST be written by YOU, by hand, WITHOUT AI.
  Morgan checks. Write at least two full paragraphs in each, in your own words,
  with full technical detail. Reminders of what you actually did (don't copy —
  just jog your memory):
    • What I Did — created the week-5-ci-cd branch; added a GitHub Actions
      workflow that runs on every push with four jobs (lint+types, Vitest unit
      tests, next build, skills gate); wrote 36 unit tests from the Week 2 use
      cases/BDD scenarios for the budget math (safe-to-spend, forecast,
      recurrence, categorize, subscriptions, rewards); vendored the five Week 1
      skills into .claude/skills/ and wrote a gate script that verifies their
      integrity (SHA-256 manifest) and enforces their rules (secret scan,
      tests-must-exist, no heavy imports, a11y via ESLint); ran two manual test
      cases on the live app; proved a failing check turns the pipeline red;
      opened a PR and merged to main.
    • What I Learned — what CI/CD actually is and why "red means stop"; the
      testing pyramid (many fast unit tests, few slow ones); how a test caught a
      real bug (the "netflix"/"tfl" categorizer quirk); why we test by hand even
      with automation; how this helps in team project work.
-->

## What I Did

_Write at least two paragraphs here, in your own words, with full technical
detail. **Do not use AI for this.**_

## What I Learned

_Write at least two paragraphs here: what you learned, what you'd do differently
next time, and how these lessons help in future team project work. **Do not use
AI for this.**_
