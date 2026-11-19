# ADR-0011: Catch-up re-entry shows a before-and-after, by-category summary

## Date and status
November 19, 2026. Accepted.

## Context
ADR-0008 added shame-free re-entry: after a gap, a "Welcome back" card offers a
one-tap "Catch me up" that imports the transactions that happened while the user
was away. In use, the only visible result was the current balance quietly
changing, plus a one-line count ("imported N transactions"). For our users
(adults with ADHD), a number that drops with no explanation is exactly the kind
of unexplained change that erodes trust. The user asked to see **what changed,
when, and in which category** — a before-and-after summary, not a silent update.

## Options
- **Keep the count only** — Bad: the balance moves with no "where it went," which
  is the gap we are fixing.
- **Count only** — Bad: the silent-balance-change gap we are fixing.
- **Before → after balance + spending grouped by category + a dated line-item
  list** — Chosen: the before/after answers "how much changed", the category
  totals answer "where it went", and the dated line items answer "what, exactly,
  and when". Grouped totals come first (the calm overview), with the per-item
  detail below for anyone who wants it.

Placement: the catch-up CTA previously lived only on the Overview page. We also
surface it on the **Safe to Spend** tab, because that is where the user looks to
decide what they can spend, so an unexplained balance change matters most there.

Persistence: show the summary **inline and keep it until the user dismisses it**
(no modal), so there is time to read it. Refreshing the rest of the page (and
hiding the now-satisfied CTA) happens on dismiss.

## Decision
- `catchUp()` now returns a structured result: `beforeBalance`, `afterBalance`,
  `total`, the date range, `byCategory` (category, total, count), and `items`
  (date, merchant, amount, category for each imported transaction).
- The grouping is a pure helper, `summarizeByCategory` in
  `lib/budget/catchUpSummary.ts`, unit-tested in `test/budget/catchUpSummary.test.ts`.
- `ReEntryCard` renders, inline and dismissible: a before → after balance line, a
  "Where it went" list of per-category totals (biggest spend first), and a
  dated "What came in" line-item list. It handles the four UI states (loading,
  error, empty "all caught up", success) per the Week 1 UX skill. The summary
  stays until the user taps "Got it", which then refreshes the page.
- The card appears on **both** the Overview and the Safe to Spend tab, shown when
  it has been ≥ 2 days since the last recorded transaction.

## Consequences
- A re-entry import now explains itself: the user sees the balance move from one
  figure to another and where the spending landed by category.
- The money math is unit-tested and covered by the CI unit-tests + skills-gate.
- The catch-up data is still simulated (fake "while you were away" merchants),
  consistent with ADR-0004; only the presentation changed, not the data source.
- The per-category view reuses the keyword categorizer, so it inherits the known
  substring quirk noted in ADR-0010 (e.g. a "Netflix" charge would read as
  Transport); the catch-up merchants currently avoid that collision.
