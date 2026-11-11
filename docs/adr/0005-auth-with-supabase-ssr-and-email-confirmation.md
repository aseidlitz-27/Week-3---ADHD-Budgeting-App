# ADR-0005: Authentication with Supabase SSR and email confirmation

## Date and status
November 11, 2026. Accepted.

## Context
MVP #1 requires sign-up, log-in, log-out, and password reset, with each person
seeing only their own data. We use Next.js (App Router) and Supabase (ADR-0003).
Sessions must work across Server Components, Route Handlers, and middleware, and
must survive a page refresh. We also had to decide whether new accounts require
email confirmation.

## Options
- Session storage — `@supabase/ssr` (cookie-based) vs the plain browser SDK
  (localStorage):
  - `@supabase/ssr` — Good: the session lives in cookies, so the server (and
    middleware) can read it, protect routes, and render per-user pages. Bad: more
    setup (browser client, server client, middleware).
  - localStorage SDK — Good: simplest. Bad: the server can't see the session, so
    no real route protection or server-side data fetching.
- Email confirmation — on vs off:
  - On — Good: more production-like; proves the address. Bad: the user must click
    a link before logging in; on Supabase's free tier the built-in email is
    rate-limited and the email templates cannot be customized.
  - Off — Good: instant sign-up, easiest demo. Bad: less realistic.
- Confirmation link handling — custom `token_hash` template vs the default email
  with a `/auth/callback` code exchange:
  - Custom template — blocked: template modification is not available on the free
    tier with the default email provider.
  - Default email + `/auth/callback` — Works on the free tier with no template
    changes; the link returns a `code` we exchange for a session (PKCE).

## Decision
Use **`@supabase/ssr`** with cookie-based sessions: a browser client, a server
client, and middleware that refreshes the session and guards `/dashboard`.
**Email confirmation is ON** (chosen for realism). Because the free tier blocks
template customization, we rely on Supabase's **default confirmation email** and
handle its redirect in **`/auth/callback`**, which calls
`exchangeCodeForSession` and then forwards the user on. Password reset uses the
same callback, then `/reset-password`.

## Consequences
- Protected routes and per-user Server Component data fetching work, because the
  server can read the session cookie.
- New users must confirm by email before logging in. Free-tier email is
  rate-limited (a few per hour), which is fine for the demo but not for volume;
  a custom SMTP provider can be added later to lift limits and brand the email.
- The confirmation code exchange assumes the email is opened in the same browser
  the sign-up started in (PKCE). This is the normal case for our demo.
- We never build password storage ourselves; Supabase Auth + RLS (ADR-0003)
  enforce "each person sees only their own data," which we verified with a
  two-account test.
