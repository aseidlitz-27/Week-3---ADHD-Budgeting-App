# ADR-0004: Use a simulated bank aggregator with seeded data

## Date and status
November 10, 2026. Accepted.

## Context
Three MVP #1 features assume automatic spending capture from a bank: secure bank
connection (1.1), automatic transaction import and categorization (1.2), and
bank-connection security (5.3). Everything downstream — the "where it went"
overview, the balance forecast, and the "safe to spend today" number — runs on
those transactions. A real bank aggregator (Plaid-style) would need its own
account, credentials, and live bank links. The Keep Your App Safe checklist for
this project says to **use fake data only**, and a live integration is fragile to
demo on a one-week timeline.

## Options
- Live aggregator (e.g. Plaid) in production mode:
  - Good: Real bank data.
  - Bad: Needs real accounts and credentials; against "fake data only"; risky and
    slow to set up; can break the demo.
- Plaid Sandbox (real SDK, test banks):
  - Good: Exercises a real integration with fake test banks.
  - Bad: Still extra credentials and setup; more that can fail during the build
    week for little gain over a simulation.
- Simulated aggregator with seeded data:
  - Good: The connect flow and transaction list are **real and working** (real UI,
    real Supabase reads/writes), but transactions come from a seeded fake dataset
    in the database. Honors "fake data only"; nothing depends on an external
    service; every screen works and is demoable; all downstream features run on
    real rows.
  - Bad: Does not prove a real third-party integration (acceptable for this MVP;
    the interface is designed so a real aggregator could replace the simulator
    later without changing the screens).

## Decision
Build a **simulated bank aggregator backed by seeded fake transactions** stored in
Supabase. The "connect a bank" flow and the transaction import UI are built for
real and persist to the database; the data source behind them is a realistic
sample dataset rather than a live bank. The data-access layer is written behind a
small interface so a real aggregator could be swapped in later without changing
the screens.

## Consequences
- We satisfy the MVP #1 requirement that every feature truly works and saves to
  and reads from Supabase, while keeping to "fake data only."
- No external aggregator credentials to manage, so the live demo cannot be broken
  by a third-party outage.
- Categorization, "where it went," forecast, and safe-to-spend all operate on real
  seeded rows, so they are fully functional.
- A seed script creates sample transactions for a signed-in user; it is clearly
  marked as fake data.
- Next: model `accounts` and `transactions` tables, write the seed, and build the
  connect flow against the simulated source.
