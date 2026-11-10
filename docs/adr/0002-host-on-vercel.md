# ADR-0002: Host the app on Vercel

## Date and status
November 10, 2026. Accepted.

## Context
The app must be live on the internet at a public web address so visitors
anywhere can open it, and new versions must publish automatically when we merge
code. We are a solo student build on a one-week timeline, using Next.js, and we
do not want to run or patch our own servers.

## Options
- Vercel:
  - Good: Made by the team behind Next.js, so Next.js deploys with no custom
    config. Connects to GitHub and publishes a new version on every merge to the
    main branch. Free plan gives a public `*.vercel.app` URL. Runs our server
    code (Route Handlers / Server Components) as managed serverless functions.
  - Bad: Serverless functions are short-lived and stateless, so scheduled work
    (e.g. bill reminders) needs a separate scheduler, not a long-running process.
    Free-plan usage limits.
- Netlify:
  - Good: Also easy Git-based deploys and a free tier.
  - Bad: Next.js App Router support lags slightly behind Vercel; one more layer
    between us and the framework.
- A traditional server (a VM we manage):
  - Good: Full control; long-running processes possible.
  - Bad: We would have to set up, secure, scale, and patch it ourselves — far too
    much for this timeline, and against the "you do not run your own servers"
    goal.

## Decision
Host on **Vercel (free plan)**, connected to the GitHub repository. Vercel builds
and deploys the Next.js app automatically; every merge to `main` publishes a new
version at the public `*.vercel.app` address. Secrets are stored as Vercel
environment variables, never in Git.

## Consequences
- Deploys are automatic: merge a pull request and the live site updates.
- We get a free public URL; no domain purchase needed.
- Server code runs as stateless serverless functions, so any scheduled job
  (such as pre-due bill reminders) must use a scheduler (e.g. Vercel Cron or a
  Supabase scheduled function) — recorded in a later ADR when we build it.
- Environment variables (Supabase keys) live in Vercel settings, keeping secrets
  out of the repository per the Keep Your App Safe checklist.
- Next: connect the repo to Vercel and confirm a successful first deploy once the
  app shell is pushed.
