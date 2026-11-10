# CLAUDE.md — ADHD Budgeting App

Read every ADR in `docs/adr` before making changes, and write a new ADR for every big decision.

## What this is
A three-tier web app that helps adults with ADHD budget. Built for the Tech Fleet
AI Development Residency, Week 4 Coding Challenge. It turns the Week 2 product
specifications into a real, working, deployed web app (MVP #1).

## Stack (see ADRs for the "why")
- **Frontend:** Next.js 14 (App Router) + React 18 + Material UI v5 — `docs/adr/0001`
- **Hosting / server:** Vercel (free plan), auto-deploy on merge to `main` — `docs/adr/0002`
- **Database / auth:** Supabase (managed PostgreSQL + Auth + Row Level Security) — `docs/adr/0003`
- **Bank data:** simulated aggregator with seeded fake transactions (no live Plaid) — `docs/adr/0004`

## Non-negotiable product principles (from Week 2 specs)
- **Accessibility first:** every screen meets WCAG 2.2 AA and follows W3C COGA
  patterns — calm, sparse, predictable, high-contrast, large touch targets. This
  is cross-cutting across all five epics.
- **Carry the load, don't demand discipline:** the app does the remembering,
  tracking, and timing; it never shames the user for a lapse.

## MVP #1 scope (what to build — 5 epics / 18 features / 23 tasks)
1. Automatic Spending Capture & Tracking
2. Bills, Deadlines & Proactive Reminders
3. Safe-to-Spend Decision Support
4. Onboarding, Re-entry & Personalization
5. Account & Data Security

Out of scope: native mobile, savings goals, debt payoff, shared/household
accounts, in-app education, retiree flows, investment/credit.

## Hard requirements
- People can sign up and log in. Each person sees **only their own** data (enforce
  with Supabase Row Level Security on every table; test with two accounts).
- Every feature saves to Supabase and reads back (data survives logout/login).
- No secret keys in the repo. Use fake data only.
- Every database change is a SQL migration file in `docs/supabase/migrations`.
- A database diagram lives in `docs/`.

## Working rules
- Build one feature at a time; move its Backlog/Kanban ticket to Done when it
  works on the live app.
- Put changes on a branch and open a pull request; merge to `main` to deploy.
