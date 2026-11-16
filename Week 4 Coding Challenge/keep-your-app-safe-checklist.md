# Keep Your App Safe Checklist — ADHD Budgeting App

> The GitHub repository is **public** — anyone can read every file in it. This checklist was
> run against the actual repo and Supabase/Vercel setup before and after pushing.

## Keep your keys secret

- [x] My Supabase keys are in `.env.local`, not in my code. The app reads them from environment
  variables; no key is hard-coded.
- [x] My `.gitignore` lists the env files (`.env*` and `.env*.local`), so Git never uploads them.
  Verified: `.env.local` has **never** been committed to history. Only `.env.local.example`
  (placeholder values, no real key) is tracked.
- [x] My keys are in Vercel's environment variable settings (`NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`), so the live app can use them.
- [x] The Supabase secret key (service_role) is **never used in the browser** and is not in the
  app at all. The whole app runs on the public anon key plus Row Level Security, so every request
  is still scoped to the signed-in user. No code path uses a service_role key.
- [x] No secret **app** key ever went to GitHub, so none needed rotating.
  **Note:** a Supabase *personal access token* (`sbp_…`, a management/CLI token — not an app key
  and never in the repo) was pasted into chat during setup and has since been **revoked**, which is
  the right response. ⚠️ A copy of that token is still sitting in plain text in the Notion page
  "Claude Code – AI Dev Residency" (Resources section) — delete it there even though it's revoked.

## Keep people's information private

- [x] RLS is turned on for **every** table (all 10). See `docs/database-design.md` and
  `docs/supabase/migrations/0002_enable_rls.sql`.
- [x] Each person can see and change only their own rows (`user_id = auth.uid()`, and
  `id = auth.uid()` for `profiles`), across read / create / update / delete.
- [x] Tested with two accounts — neither could see or change the other's information.

## Use fake data only

- [x] All test data is made up — simulated bank accounts and seeded fake transactions
  (ADR-0004). No real financial data is used.
- [x] No real bank or card information is ever entered into the app. There is no live bank
  connection (no Plaid); the "connect bank" flow seeds fake transactions.

## Ask Claude to check

- [x] Ran a security pass for exposed keys, tables without access rules, and places where one
  person could see another's data. Findings: no secrets in tracked code; RLS present on all
  tables; two-account isolation verified.
