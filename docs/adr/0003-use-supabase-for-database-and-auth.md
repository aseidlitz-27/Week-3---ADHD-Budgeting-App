# ADR-0003: Use Supabase for the database and authentication

## Date and status
November 10, 2026. Accepted.

## Context
The app must save each person's information and read it back later — if you log
out and log back in, your data is still there. People must be able to sign up and
log in, and **each person must see only their own information**. We need a
database plus authentication that works with Next.js on Vercel, without running
our own database server, and that can enforce per-user data isolation.

## Options
- Supabase (managed PostgreSQL + Auth):
  - Good: A real relational database (PostgreSQL) that fits our connected data
    (users, accounts, transactions, bills). Built-in authentication (sign-up,
    sign-in, password reset). **Row Level Security (RLS)** enforces "see only
    your own rows" in the database itself, not just in the app code. Free plan;
    hosted for us. SQL migrations we can save in the repo.
  - Bad: Free projects pause after ~7 days of inactivity (click "Resume"). We
    must write RLS policies carefully, since RLS defaults to deny.
- Firebase (Firestore + Auth):
  - Good: Easy auth; generous free tier.
  - Bad: Document database, not relational — a poorer fit for our clearly related
    tables; security rules are a separate language; weaker SQL/migration story.
- A database we host ourselves (e.g. Postgres on a VM):
  - Good: Full control.
  - Bad: We would run, secure, back up, and patch it — too much for this timeline
    and against the "do not run your own servers" goal.

## Decision
Use **Supabase**: managed PostgreSQL for data, Supabase Auth for sign-up/sign-in,
and **Row Level Security on every table** so each person can read and write only
their own rows. Every schema change is saved as a SQL migration file in
`docs/supabase/migrations`. Keys live in environment variables, never in Git.

## Consequences
- We design relational tables (see `docs/database-design.md`) and create them with
  SQL migrations kept in the repo.
- RLS is turned on for every table and tested with two accounts to prove one
  person cannot see another's data.
- Auth is handled by Supabase, so we do not build password storage ourselves.
- If the live app stops working after a quiet week, open Supabase and click
  "Resume project."
- Secrets: the public anon key is safe for the browser; the service-role key is
  server-only and never committed.
- Next: fill the Database Design doc, write the first migration, enable RLS, and
  wire Supabase Auth into the app.
