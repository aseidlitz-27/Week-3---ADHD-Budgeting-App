# Week 5 — Manual Test Case Scenarios

**Student:** Anika Seidlitz
**App under test (live):** https://week-3-adhd-budgeting-app-seven.vercel.app

These two scenarios are run **by hand on the live app** — the kind of checks an
automated test can't fully prove. Fill in the **Actual result** and **Pass/Fail**
columns as you run each step. Automated tests (CI) cover the budget math; these
cover the two user-facing paths that matter most: data privacy between accounts,
and the trustworthiness of the "safe to spend" number.

---

## Test Case 1 — Each person sees only their own data (Row Level Security)

Ties to ADR-0003 (RLS on every table) and Epic 5 (Account & Data Security). This
is the single most important safety property: one person must never see another
person's financial data.

**Pre-conditions**
- Two separate accounts exist (User A and User B), each confirmed by email.
- User A is signed in and has connected a bank (seeded transactions exist).
- Two browsers (or one normal + one incognito) so both sessions are live at once.

| # | Step to follow | Expected result | Actual result | Pass/Fail |
| - | -------------- | --------------- | ------------- | --------- |
| 1 | As User A, open the Transactions page and note 2–3 specific transactions (merchant + amount). | User A sees their own seeded transactions. | | |
| 2 | In the second browser, sign up / log in as User B (a brand-new account). | User B reaches their dashboard; it is empty or shows only User B's own data. | | |
| 3 | As User B, open Transactions, Bills, Safe-to-Spend, and Accounts. | None of User A's transactions, bills, or accounts appear anywhere. | | |
| 4 | As User B, connect a bank and add one bill. | User B now has their own seeded data and their one bill. | | |
| 5 | Switch back to User A, refresh every page. | User A still sees only User A's data — User B's new bill does not appear. | | |
| 6 | As User B, use "Export my data." | The export contains only User B's rows (no User A data). | | |

**Overall result:** _pass / fail_ — _notes_

---

## Test Case 2 — "Safe to spend" never shows a misleading positive number

Ties to ADR-0007. The number must be conservative: it is money you can spend now
without missing a bill before your next income, and a negative result is shown as
**£0 with a warning**, never a misleading positive. It must not count income that
hasn't arrived yet.

**Pre-conditions**
- A signed-in account with a connected bank (so there is a current balance).
- You can add/edit bills and income on the live app.

| # | Step to follow | Expected result | Actual result | Pass/Fail |
| - | -------------- | --------------- | ------------- | --------- |
| 1 | Open the Safe-to-Spend page and note the current balance and the current "safe to spend" figure. | A number is shown with a short, calm explanation. | | |
| 2 | Add an unpaid bill due in the next few days whose amount is **larger than the current balance**. | After saving, "safe to spend" drops. | | |
| 3 | Re-open Safe-to-Spend. | The figure shows **£0** (not a negative number) with a clear warning — never a misleading positive. | | |
| 4 | Add an income source dated **after** that bill (e.g. payday next week). | The "safe to spend" figure does **not** increase — future income is not counted as spendable today. | | |
| 5 | Mark the bill as **paid**. | "Safe to spend" recovers; the bill is no longer double-counted (it's now reflected in the balance). | | |
| 6 | Set a payday buffer in Settings, then return to Safe-to-Spend. | The figure drops by the buffer amount; the daily pace reflects the buffer. | | |

**Overall result:** _pass / fail_ — _notes_

---

### Notes on what the automated checks already cover
The CI unit tests (`test/budget/safeToSpend.test.ts`, `forecast.test.ts`) already
prove the *math* of steps 3–5 above at the function level. These manual runs
confirm the same behavior **end-to-end on the live app** — that the UI, database,
and auth all carry it through for a real person.
