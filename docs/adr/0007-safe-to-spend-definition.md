# ADR-0007: How "safe to spend today" is calculated

## Date and status
November 13, 2026. Accepted.

## Context
"Safe to spend today" is the most important number in the app, and a wrong one is
the worst failure for our users. It must be easy to trust: money the user can
spend now without missing a bill before their next income, and it must count each
pound once (the model decision behind linking bills to transactions).

## Options
- Include not-yet-received income in today's number:
  - Good: a larger, "fuller" number.
  - Bad: encourages spending money that hasn't arrived — risky for exactly the
    users we serve.
- Conservative: only money actually on hand, minus bills due before the next
  income, minus the buffer:
  - Good: the number is money you really have; safe by construction.
  - Bad: can look small, but that is honest.
- Coverage window: fixed 30 days vs "until next income":
  - "Until next income" matches how people actually budget (paycheck to paycheck)
    and pairs naturally with the payday-buffer feature.

## Decision
**safe to spend today = current balance − unpaid bills due before the next
expected income − buffer.** We do **not** add income that has not arrived. The
coverage window runs from today to the next income occurrence (from the `incomes`
table); if no income is scheduled, a 14-day window is used. Paid bills are
excluded (they are already transactions reflected in the balance), so money is
counted once. A negative result is shown as £0 with a clear warning, never a
misleading positive. The payday-buffer feature divides the safe amount across the
days to the next income to suggest a daily pace and warn on early over-spend.

## Consequences
- The number is trustworthy and conservative; it never tells someone they can
  spend money they do not have.
- It depends on the user entering their income sources (the Safe to Spend page
  manages the `incomes` table) and their bills; with neither, it is simply the
  balance minus the buffer.
- The same `occurrencesInRange` engine powers both the forecast (ADR-0006) and
  this calculation, and both were unit-tested for the paid-bill and boundary
  cases.
