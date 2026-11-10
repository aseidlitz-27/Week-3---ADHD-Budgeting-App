# ADHD Budgeting App

A calm, accessible web app that helps adults with ADHD budget — it does the
remembering, tracking, and timing for you, and helps at the moment you're about
to spend rather than in a monthly report.

Built for the **Tech Fleet AI Development Residency — Week 4 Coding Challenge**,
turning the Week 2 product specifications into a real, working, deployed MVP #1.

## Stack
- **Next.js 14** (App Router) + **React 18** — screens and server code
- **Material UI v5** — accessible component library, themed for WCAG 2.2 AA + COGA
- **Vercel** — hosting and serverless functions (auto-deploy on merge to `main`)
- **Supabase** — PostgreSQL database, Auth, and Row Level Security

See the decisions and their reasoning in [`docs/adr/`](docs/adr).

## Getting started
```bash
npm install
cp .env.local.example .env.local   # then fill in your Supabase values
npm run dev                         # http://localhost:3000
```

## Project structure
```
app/            Next.js App Router pages, layout, and MUI theme
lib/            Shared helpers (Supabase client, data access)
docs/adr/       Architecture Decision Records (read these first)
docs/supabase/  SQL migration files
docs/           Database design and diagram
```

## Accessibility
Every screen targets **WCAG 2.2 Level AA** and follows **W3C COGA** cognitive
accessibility patterns: calm and sparse layouts, high contrast, large touch
targets, visible focus, and no shame-driven mechanics.

## Scope
MVP #1 covers five epics: automatic spending capture & tracking; bills &
proactive reminders; safe-to-spend decision support; onboarding, re-entry &
personalization; and account & data security. See
[`CLAUDE.md`](CLAUDE.md) for the full scope and build rules.

> Data is simulated (seeded fake transactions) — this app uses **fake data only**.
