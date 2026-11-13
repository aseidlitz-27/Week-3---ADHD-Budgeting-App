# ADR-0008: Onboarding gate, re-entry, and shame-free rewards

## Date and status
November 13, 2026. Accepted.

## Context
Epic 4 adds onboarding, re-entry, rewards, and personalization. Two design
choices shaped the build: how to route new users into the guided setup, and how
to celebrate progress without the streak-shame that drives ADHD users to abandon
budgeting apps.

## Options
- Routing new users to setup:
  - Middleware DB lookup on every request — Good: central. Bad: a database call on
    every page load, slower.
  - Server-component redirect — the dashboard layout checks `onboarding_completed`
    once and redirects to `/setup`; `/setup` redirects back when complete. Good: no
    per-request DB cost; no loop because `/setup` is outside the dashboard layout.
- Rewards model:
  - Streaks / point loss — Good: engaging for some. Bad: punishes lapses, which is
    exactly the abandonment moment we must protect (a core product principle).
  - Additive-only milestones — wins are only ever added, never removed; re-entry is
    explicitly judgment-free.

## Decision
New users are sent through `/setup` by a redirect in the dashboard layout (and
`/setup` sends completed users back to the dashboard). The wizard is skippable at
every step and writes through the same server actions the rest of the app uses.
Rewards are **additive milestones only** stored in `rewards` (no streaks, nothing
ever taken away). Re-entry after a gap shows a warm "welcome back" with one-tap
data catch-up and no guilt. Personalization lives in `settings` and actually takes
effect: the buffer feeds safe-to-spend, lead-days and the on/off switch and tone
drive reminders, and density adjusts dashboard spacing.

## Consequences
- Guided setup runs once per user with no middleware database cost.
- The app never shames a lapse, matching the retention goal (BG6).
- Settings are real controls, not decoration — each one changes behaviour.
- Existing accounts created before this change have `onboarding_completed = false`,
  so they will see the wizard once on next login; this is expected.
