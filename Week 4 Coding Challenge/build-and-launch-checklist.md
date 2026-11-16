# Build and Launch Checklist — ADHD Budgeting App (MVP #1)

> The 14 steps from the lecture board section "In This Class, This Is How You Launch,"
> checked off against what was actually built and launched. Fake data only.

## Set up your accounts and tools

- [x] **1. Make your free Vercel and Supabase accounts.** Both created on the free plan.
  Vercel account `aseidlitz27-4688`; Supabase project ref `jmpugjsoihoctiatkokr` (eu-west-1, Postgres 17).
- [x] **2. Check that your computer is ready.** Node.js installed and working; `npm run build` passes.
- [x] **3. Gather your saved documents.** Week 2 vision, scope, requirements, epics/features,
  and build plan live in Notion and were used as the source for every chat.

## Build the app on your computer

- [x] **4. Make the project.** Next.js 14 (App Router) + React 18 + Material UI v5, in the
  repo `Week-3---ADHD-Budgeting-App`. First scaffold committed to `main` (`6fcd20c`) and pushed.
- [x] **5. Architect the app.** Three tiers planned — screens (Next.js/MUI), server code
  (Server Actions / Route Handlers), database (Supabase). Plan recorded in the ADRs and `CLAUDE.md`
  before feature code was written.
- [x] **6. Write down your big decisions as ADRs.** `docs/adr/` holds **9 ADRs** (0001 Next.js+MUI,
  0002 Vercel, 0003 Supabase, 0004 simulated aggregator, 0005 auth, 0006 reminders+forecast,
  0007 safe-to-spend, 0008 onboarding/rewards, 0009 data privacy). `CLAUDE.md` carries the
  "read every ADR before changing; write a new ADR for every big decision" rule.
- [x] **7. Design your database tables.** Filled the Database Design Template → `docs/database-design.md`
  (10 tables). Schema saved as SQL migration files; RLS turned on for every table.
- [x] **8. Connect the app to Supabase.** Project created on the free plan. SQL applied and saved as
  migrations in `docs/supabase/migrations/` (`0001_init_schema`, `0002_enable_rls`, `0003_seed_defaults`).
  Keys kept in `.env.local` (git-ignored) — see the Keep Your App Safe Checklist.
- [x] **9. Build one feature at a time.** Sign-up / log-in first (Supabase SSR auth), then every
  MVP #1 feature across the 5 epics, each on its own branch → pull request → merge. New big
  choices got a new ADR first.
- [x] **10. Run and test the app on your computer.** Clicked through every screen. Made two test
  accounts and confirmed one person cannot see the other's data (RLS test passed).

## Launch it on the internet

- [x] **11. Connect your GitHub repository to Vercel.** Repo imported; `NEXT_PUBLIC_SUPABASE_URL`
  and `NEXT_PUBLIC_SUPABASE_ANON_KEY` set in Vercel's environment variables (prod/preview/dev).
- [x] **12. Push your code and let Vercel publish it.** Each merge to `main` auto-deploys.
- [x] **13. Test the live app.** Live at **https://week-3-adhd-budgeting-app-seven.vercel.app** —
  signed up as a new user and tested every MVP #1 feature against the Week 2 epics/features/tasks.
  _(Browser verified. Worth one final pass opening it on your phone to confirm the mobile layout.)_
- [x] **14. Save what you learned.** A factual build log of what was built and decided is saved
  (`AI Dev Residency, Week 3.md`). **The Submission Template is still yours to fill in by hand,
  without AI** — see `Week 4 Coding Challenge/SUBMISSION.md`.

## Move your tickets as you work

- [x] Opened the Backlog Kanban Board from Week 2.
- [x] Moved each ticket to In Progress when started.
- [x] Moved each ticket to Done when the feature worked on the live app.
- [x] **22 of 23** MVP #1 tickets are Done. _One ticket (5.2 data export/erase) is built, live, and
  verified, but its Notion status flip failed on a connector outage — flip that last card to Done
  to finish the board._
