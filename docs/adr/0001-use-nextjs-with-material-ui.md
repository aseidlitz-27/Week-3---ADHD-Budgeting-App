# ADR-0001: Use Next.js with Material UI

## Date and status
November 10, 2026. Accepted.

## Context
We are building the ADHD Budgeting App: a three-tier web app that must run on
the internet so anyone can open it. We need both the screens people see and the
server code that talks to the database. Our audience is adults with ADHD, so the
interface must meet WCAG 2.2 Level AA and follow W3C COGA cognitive-accessibility
patterns (calm, sparse, predictable screens). We need a framework that gives us
accessible UI building blocks and a place to run server code, and that deploys
cleanly to Vercel.

## Options
- Plain React (Create React App / Vite):
  - Good: Simple to start; full control over the setup.
  - Bad: Only covers the screens. We would need a separate project and host for
    the server code, which is more moving parts for a one-week build.
- Next.js (App Router):
  - Good: Holds the screens and the server code in one project. First-class
    support on Vercel (the host the syllabus requires). Server Components keep
    secrets on the server.
  - Bad: We must learn which code runs in the browser ("use client") and which
    runs on the server.
- UI library choice — Material UI vs. building components by hand:
  - Material UI — Good: Accessible components out of the box (focus states,
    ARIA, keyboard support) that give us a head start on WCAG 2.2 AA; a central
    theme lets us enforce one calm, high-contrast, large-touch-target style.
  - Material UI — Bad: A design-system look we must theme to feel calm rather
    than busy; adds dependencies.
  - By hand — Good: Total control. Bad: We would have to build and test
    accessibility ourselves, which is slow and risky for this timeline.

## Decision
Use **Next.js (App Router) with Material UI**. Next.js covers two of our three
tiers (screens + server code) in one project that deploys to Vercel, and
Material UI gives us accessible components plus a single theme we can tune for
ADHD-friendly, COGA-aligned, WCAG 2.2 AA screens. We pin **Next.js 14 with
React 18 and Material UI v5** for stability over the build week, using the
official `@mui/material-nextjs` App Router integration so styles render
correctly on the server.

## Consequences
- We learn where code runs — in the browser or on the server — and mark client
  components with `"use client"`.
- Material UI's theme file needs a `"use client"` line at the top.
- Accessibility work starts from accessible defaults instead of from zero, but
  we still verify contrast, focus order, and touch-target size against WCAG 2.2 AA.
- We get one central theme (`app/theme.ts`) that every screen inherits, so a
  calm, consistent look is enforced in one place.
- Next: wire the MUI theme + `AppRouterCacheProvider` into the root layout, then
  build screens feature by feature.
