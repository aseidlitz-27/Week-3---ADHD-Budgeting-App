# ADR-0006: In-app pre-due reminders and a forward balance forecast

## Date and status
November 11, 2026. Accepted.

## Context
Epic 2 needs "proactive pre-due notifications" for bills and an "upcoming-balance
forecast." Two questions: how are reminders delivered, and how is the forecast
computed without double-counting money?

Scheduled delivery (push/email at a future time) needs a scheduler that runs
when no one is on the site. On our stack (Vercel serverless, Supabase free tier)
that means Vercel Cron or Supabase scheduled functions plus web-push
infrastructure and a service worker — and the free email provider is heavily
rate-limited and cannot be customised (see ADR-0005).

## Options
- Reminder delivery:
  - Scheduled web push / email — Good: reaches the user when the app is closed.
    Bad: needs a cron job, web-push keys, a service worker, and (for email) a
    paid SMTP; a lot to build and operate for an MVP.
  - In-app surfacing — Good: no extra infrastructure; the app computes what is due
    soon and shows it prominently on the Overview and Bills pages every visit; the
    `reminders` table still records each scheduled reminder. Bad: only seen when
    the user opens the app.
- Forecast correctness:
  - Re-sum all transactions forward — risks double-counting a bill that is both a
    transaction and an upcoming bill.
  - Project from today's balance using only FUTURE unpaid bills and expected
    income — each pound counted once.

## Decision
**In-app reminders for the MVP:** when a bill is added, a row is written to
`reminders` (due date minus the user's lead-time setting). The app surfaces
overdue and due-soon bills on the Overview and Bills pages on every visit.
External scheduled push/email is deferred.

**Forecast:** `buildForecast` projects from today's combined balance over 45 days,
subtracting only **unpaid** future bill occurrences and adding expected income
from the `incomes` table. A paid bill is recorded as a transaction and its
recurring due date rolls forward, so it is never subtracted twice. The view warns
when the projected balance would fall below the user's buffer (or zero).

## Consequences
- No cron/web-push/SMTP to build or pay for now; reminders are reliable whenever
  the app is open. A later ADR can add scheduled delivery via Vercel Cron +
  web push when warranted.
- The forecast is correct by construction (money counted once) and was unit-tested
  for the paid-bill, overdraw, and buffer-breach cases.
- Account balances are kept in step: paying a bill and adding a manual
  transaction adjust `current_balance`, so the forecast's starting point stays
  honest.
