# Database Design — ADHD Budgeting App (MVP #1)

> Filled from the Week 2 product specifications before creating tables in Supabase.
> Follows the Tech Fleet Database Design Template. Uses **fake data only**.
>
> **Revision (2026-11-11):** two changes from the balanced baseline —
> (1) transactions are **linked to bills** (`transactions.bill_id`) so money is
> counted once in safe-to-spend; (2) income is a **recurring `incomes` table**
> (multiple, variable, irregular sources) instead of one fixed monthly number.

## What does the app need to save?

- **Who the user is and where they are in onboarding** — so the app can greet them, resume setup, and know whom each row belongs to.
- **Each user's personal settings** — safe-to-spend buffer and personalization (notifications on/off, reminder timing, reminder style, screen density).
- **Income sources** — each recurring or irregular source (gig work, part-time jobs, inconsistent paydays) with its **own amount and timing**, so forecasts and safe-to-spend reflect variable income instead of one fixed monthly figure.
- **The user's accounts** (simulated bank/cash accounts) — name, type, balance, and connection status.
- **Spending categories** — so transactions can be grouped for "where it went," including the user's own edits.
- **Learned categorization rules** — when a user recategorizes a merchant, remember it so future transactions are categorized automatically ("the app learns").
- **Transactions** — every expense or income item (imported from the simulated aggregator or entered manually), optionally **linked to the bill it paid**, so tracking, categorization, forecasts, and safe-to-spend all work and never double-count.
- **Bills** — name, amount, due date, repeat interval, paid/unpaid, and whether it's a detected subscription.
- **Reminders** — scheduled pre-due notifications for bills, with timing and status.
- **Rewards** — small-win celebrations the user has earned (celebrate once, never punish a broken streak).

---

## Tables

### Table name: `profiles`
**What it stores:** One row per user — identity and onboarding state. Extends Supabase `auth.users`.

| Column name | Type of data | Required? | What it means |
| --- | --- | --- | --- |
| id | uuid | Yes | Same as the Supabase auth user id. A unique code for each person. |
| display_name | text | No | What the app calls the user. |
| onboarding_completed | true or false | Yes | Whether the setup wizard is finished (default false). |
| created_at | date/time | Yes | When the profile was made. |

**Who can see it?** Only the user it belongs to.
**Who can add, change, or delete it?** Only that same user (a row is created automatically on sign-up).

### Table name: `settings`
**What it stores:** One row per user — the safe-to-spend cushion and personalization. (Income now lives in `incomes`.)

| Column name | Type of data | Required? | What it means |
| --- | --- | --- | --- |
| user_id | uuid | Yes | The person who owns this row. |
| safe_to_spend_buffer | number | No | Amount to keep untouched as a cushion (default 0). |
| notifications_enabled | true or false | Yes | Master switch for reminders (default true). |
| reminder_lead_days | number | Yes | How many days before a bill to remind (default 3). |
| reminder_style | text | Yes | Tone of reminders: gentle / direct (default gentle). |
| density | text | Yes | Screen density: calm / compact (default calm). |

**Who can see it?** Only the user it belongs to.
**Who can add, change, or delete it?** Only that same user.

### Table name: `incomes`  *(new — supports irregular/variable income)*
**What it stores:** Each income source, so a user can have several with different amounts and timing.

| Column name | Type of data | Required? | What it means |
| --- | --- | --- | --- |
| id | uuid | Yes | A unique code for each income source. |
| user_id | uuid | Yes | The person who owns it. |
| source_name | text | Yes | e.g. "Café shift", "Freelance", "Benefits". |
| amount | number | Yes | Expected/typical amount per occurrence. |
| is_variable | true or false | Yes | Whether the amount varies (gig/irregular) — treat `amount` as an estimate (default false). |
| recurrence | text | Yes | one_time / weekly / biweekly / monthly / irregular (default monthly). |
| next_date | date | No | Next expected date (drives the forecast); may be empty for irregular sources. |
| account_id | uuid | No | Which account it lands in. |
| created_at | date/time | Yes | When the source was added. |

**Who can see it?** Only the owning user.
**Who can add, change, or delete it?** Only the owning user.

### Table name: `accounts`
**What it stores:** The user's (simulated) bank or cash accounts.

| Column name | Type of data | Required? | What it means |
| --- | --- | --- | --- |
| id | uuid | Yes | A unique code for each account. |
| user_id | uuid | Yes | The person who owns this account. |
| name | text | Yes | Friendly name, e.g. "Everyday Checking". |
| type | text | Yes | checking / savings / credit / cash. |
| institution_name | text | No | Simulated bank name. |
| current_balance | number | Yes | Latest balance (default 0). |
| connection_status | text | Yes | active / expired / revoked (default active). |
| external_ref | text | No | Placeholder token for the simulated aggregator (never a real credential). |
| created_at | date/time | Yes | When the account was connected. |

**Who can see it?** Only the owning user.
**Who can add, change, or delete it?** Only the owning user.

### Table name: `categories`
**What it stores:** Spending categories, per user (seeded with defaults on sign-up).

| Column name | Type of data | Required? | What it means |
| --- | --- | --- | --- |
| id | uuid | Yes | A unique code for each category. |
| user_id | uuid | Yes | The person who owns this category. |
| name | text | Yes | e.g. Groceries, Dining, Transport, Bills. |
| color | text | No | For the calm "where it went" chart. |
| is_default | true or false | Yes | Whether it was seeded by the app (default false). |

**Who can see it?** Only the owning user.
**Who can add, change, or delete it?** Only the owning user.

### Table name: `category_rules`  *(supporting)*
**What it stores:** Learned rules so recategorizing a merchant sticks ("the app learns").

| Column name | Type of data | Required? | What it means |
| --- | --- | --- | --- |
| id | uuid | Yes | A unique code for each rule. |
| user_id | uuid | Yes | The person who owns this rule. |
| match_text | text | Yes | Merchant text to match (e.g. "LIDL"). |
| category_id | uuid | Yes | The category to apply when it matches. |

**Who can see it?** Only the owning user.
**Who can add, change, or delete it?** Only the owning user.

### Table name: `bills`
**What it stores:** Bills and their due dates, so they're impossible to forget.

| Column name | Type of data | Required? | What it means |
| --- | --- | --- | --- |
| id | uuid | Yes | A unique code for each bill. |
| user_id | uuid | Yes | The person who owns this bill. |
| name | text | Yes | e.g. "Rent", "Phone". |
| amount | number | Yes | How much is due. |
| due_date | date | Yes | Next date it is due. |
| recurrence | text | Yes | none / weekly / monthly / yearly (default monthly). |
| status | text | Yes | unpaid / paid (default unpaid; marking a recurring bill paid rolls due_date forward). |
| is_subscription | true or false | Yes | Flagged by recurring-charge detection (default false). |
| account_id | uuid | No | Which account it is paid from. |
| created_at | date/time | Yes | When the bill was added. |

**Who can see it?** Only the owning user.
**Who can add, change, or delete it?** Only the owning user.

### Table name: `transactions`
**What it stores:** Every expense or income item — the core of the app. May be linked to the bill it paid.

| Column name | Type of data | Required? | What it means |
| --- | --- | --- | --- |
| id | uuid | Yes | A unique code for each transaction. |
| user_id | uuid | Yes | The person who owns this transaction. |
| account_id | uuid | Yes | Which account it belongs to. |
| category_id | uuid | No | Its category (may be uncategorized at first). |
| **bill_id** | uuid | No | **The bill this transaction paid, if any — so a paid bill is counted once, not twice.** |
| amount | number | Yes | The money amount (always positive). |
| type | text | Yes | expense or income. |
| merchant | text | No | Where the money went / came from. |
| occurred_on | date | Yes | The date of the transaction. |
| source | text | Yes | import (simulated) or manual. |
| created_at | date/time | Yes | When the row was saved. |

**Who can see it?** Only the owning user.
**Who can add, change, or delete it?** Only the owning user.

### Table name: `reminders`
**What it stores:** Scheduled pre-due notifications for bills.

| Column name | Type of data | Required? | What it means |
| --- | --- | --- | --- |
| id | uuid | Yes | A unique code for each reminder. |
| user_id | uuid | Yes | The person who owns this reminder. |
| bill_id | uuid | Yes | The bill this reminder is about. |
| remind_at | date/time | Yes | When to show the reminder. |
| status | text | Yes | scheduled / sent / dismissed (default scheduled). |
| created_at | date/time | Yes | When the reminder was created. |

**Who can see it?** Only the owning user.
**Who can add, change, or delete it?** Only the owning user.

### Table name: `rewards`  *(supporting)*
**What it stores:** Small-win celebrations the user has earned (no streak punishment).

| Column name | Type of data | Required? | What it means |
| --- | --- | --- | --- |
| id | uuid | Yes | A unique code for each reward. |
| user_id | uuid | Yes | The person who earned it. |
| kind | text | Yes | e.g. first_bill_paid, week_on_track, first_week_tracked. |
| earned_at | date/time | Yes | When it was earned. |
| acknowledged | true or false | Yes | Whether the user has seen the celebration (default false). |

**Who can see it?** Only the owning user.
**Who can add, change, or delete it?** Only the owning user.

---

## How money is counted (safe-to-spend & forecast rules)

To guarantee money is **counted once**, the logic reads from transactions, bills, and incomes with these rules:

- **Actual money already moved** = `transactions`. Income received is `type = income`; spending is `type = expense`. Account balances reflect these.
- **A paid bill is a transaction.** When a bill is marked paid, a linked transaction is created (`transactions.bill_id` set). Safe-to-spend therefore **subtracts only *unpaid* upcoming bills** — a paid bill is already in the transactions, so it is never subtracted twice.
- **Expected future income** = `incomes` (by `recurrence` + `next_date`), used by the forecast to project the balance forward. Once an income actually arrives it is recorded as a `transaction` (type = income); the forecast counts the *expected* income only up to the point real transactions take over, so it isn't double-counted.
- **Safe to spend today** ≈ available funds − unpaid bills due before next expected income − `safe_to_spend_buffer`.

This is the single most correctness-critical part of the app; it will have unit tests around the double-count cases.

---

## How the tables connect

- One person has **one** `profiles` row and **one** `settings` row. Each belongs to one person.
- One person can have **many** `incomes`. Each income source belongs to one person and may land in one account.
- One person can have **many** `accounts`. Each account belongs to one person.
- One person can have **many** `categories`. Each category belongs to one person.
- One person can have **many** `transactions`. Each transaction belongs to one person, sits in **one** account, has at most **one** category, and is optionally **linked to one bill**.
- One person can have **many** `category_rules`. Each rule belongs to one person and points to one category.
- One person can have **many** `bills`. Each bill belongs to one person, may name one account, and can be **paid by many transactions** over time.
- One bill can have **many** `reminders`. Each reminder belongs to one person and one bill.
- One person can have **many** `rewards`. Each reward belongs to one person.

---

## Access rules

Supabase calls these Row Level Security (RLS). RLS is turned on for **every** table.

- [ ] RLS is turned on for every one of the 10 tables.
- [ ] Each table has a rule that lets people act only on their own rows (`user_id = auth.uid()`, and `id = auth.uid()` for `profiles`).
- [ ] The rule covers read, create, change, and delete, all scoped to the owner.
- [ ] Tested with two accounts — one person could not see or change the other's information (including the new `incomes` and bill-linked `transactions`).

---

## Database diagram

Generated as a **Mermaid diagram** at `docs/database-diagram.md` (GitHub renders it as a picture), and cross-checked against Supabase's Schema Visualizer. The link goes in the Submission Template.

---

## Migration files

- [ ] Every change to the database is a SQL migration file in `docs/supabase/migrations/`.
- [ ] Each file name says what it does:
  - `0001_init_schema.sql` — create the 10 tables.
  - `0002_enable_rls.sql` — enable RLS + owner-only policies on every table.
  - `0003_seed_defaults.sql` — auto-create profile, settings, and default categories on sign-up.

---

### Core vs. supporting (if we need to trim for time)
- **Core (build first):** `profiles`, `settings`, `incomes`, `accounts`, `categories`, `transactions`, `bills`, `reminders`.
- **Supporting (nice-to-have, first to cut):** `category_rules` (merchant learning), `rewards` (celebrations). Their features degrade gracefully without them.
