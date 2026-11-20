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

## What I Did

I created a new feature branch (`week-5-ci-cd`) off `main` in the ADHD Budgeting
App repository and reviewed `CLAUDE.md` and previous Architecture Decision
Records (ADRs) to align with the existing setup.

Next, I built a GitHub Actions pipeline to automate key checks on every push and
pull request:

- **Code quality and accessibility:** Automated linting and type-checking to enforce
  project standards and accessibility.
- **Automated unit tests:** Added Vitest and wrote 36 unit tests covering core
  budget logic—including safe-to-spend, balance forecasts, recurring
  transactions, categorization, subscriptions, and rewards. When I noticed
  "Netflix" was being categorized under Transport, I documented it as a known
  quirk and logged it in our ADRs rather than silently altering the behavior.
- **Project rules gate:** Built a custom verification script to check our Week 1
  Claude Skills against an integrity manifest and automatically enforce project
  rules (scanning for hard-coded secrets, ensuring tests exist, and blocking
  heavy imports).

Finally, I recorded these decisions in a new ADR, wrote manual test scenarios
(covering account data isolation and safe-to-spend accuracy), and opened Pull
Request #11. Before merging, Claude Code pushed a small regression to confirm
the pipeline would catch it; once the test check failed as expected, I reverted the
change, verified the run turned green again, and merged the PR to trigger an
automatic deployment on Vercel.

## What I Learned

Running the manual test case scenarios revealed concrete room for improvement in
one of the features, which was adjusted right after completing the tests: the
"Catching up on recent changes" call-to-action needed to display dates, categories,
and amounts alongside a clear before-and-after summary.

Looking at the broader learning process, the course provides strong transparency
around what needs to be done and what good results can look like—through live
working sessions, office hours for open questions, and reference materials in Figma
and Notion. Paired with an agile mindset, we are encouraged to jump in at the deep
end rather than trying to understand every piece cohesively before starting the
assignment. Letting go of the need to know everything upfront ("surrendering" to the
process) has consistently left me amazed by the outcomes we can achieve.

At the same time, dealing with high technical complexity while moving at that pace
leaves very little space to integrate and build the ability to articulate the material in a
fluent manner. This raises an important question for my workflow going forward: how
can I organize myself to build stronger articulative skills? One concrete approach I
want to try is "dog feeding" Claude with the given materials beforehand and
prompting it to keep that context in the background while setting accompanying
reflection questions before I start the process—so I am actively processing and
articulating the material along the way rather than only afterward.
