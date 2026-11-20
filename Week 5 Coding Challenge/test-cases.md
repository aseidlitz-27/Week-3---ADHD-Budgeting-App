# Week 5 — Manual Test Case Scenarios

**Student:** Anika Seidlitz
**App under test (live):** https://week-3-adhd-budgeting-app-seven.vercel.app

These two scenarios were run **by hand on the live app** — the kind of checks an
automated test can't fully prove. Automated tests (CI) cover the budget math; these
cover two user-facing paths that matter most: a secure, accessible sign-in flow, and
the trustworthiness of the "safe to spend today" number.

---

## Test Case 1 — Create an account and sign in securely

### Use Case Scenario Being Tested

**Feature 5.1** "Account creation & sign-in" (UR14 — _create a secure account and
trust their financial data is protected_).

**Use case:** _Sign up and sign in with a secure, accessible auth flow._

### Test Case Scenario Being Tested

A brand-new user signs up, confirms their email, signs in, and is taken into the
guided setup (onboarding gate), proving auth works end to end and a fresh account
starts clean.

### Pre-Conditions of the Whole Test Case Scenario

1. The live app is reachable and you are logged out (no active session).
2. You have an email address that is not already registered in the app, and can open
   its inbox to click a confirmation link (email confirmation is on — ADR 0005).
3. You are on a supported modern browser.

### Steps to Complete the Whole Test Case Scenario

1. Go to the app home page and choose Create your account.
2. On `/signup`, enter the new email and a password and submit.
3. Open the confirmation email and click the confirmation link.
4. On `/login`, sign in with the same credentials.
5. Observe where you land after sign-in.
6. Sign out, then sign back in a second time.

### Expected Results of the Whole Test Case Scenario

1. Signup succeeds and tells you to check your email to confirm (no crash, clear
   message).
2. The confirmation link activates the account and returns you to the app.
3. Sign-in succeeds with the confirmed credentials.
4. Because onboarding is not yet complete, you land on the guided setup (`/setup`),
   not straight on a populated dashboard.
5. The new account shows no other user's data (clean start).
6. The second sign-in works and the session persists (lands on setup or dashboard
   per onboarding state).

### Actual Results

| Step | What did you do? | What should happen? | What actually did happened? | Failed or passed |
| ---- | ---------------- | ------------------- | --------------------------- | ---------------- |
| Choose "Create a new account" | Clicked on CTA "Sign up" | Sign up form is going to be displayed | Sign up form was displayed | Passed |
| Enter new email address and password | Filled in 2nd Mailaddress (checked previously access to Mailaddress) | The email input field accepts characters matching the user's active keyboard layout, including letters, numbers, and symbols such as @, and displays them accurately as typed. The confirmation CTA is visible and enabled. Clicking it submits the request and opens a confirmation modal/screen instructing the user to check their email inbox. | The email input field accepted characters matching the active keyboard layout, including letters, numbers, and symbols such as @, and displayed them accurately as typed. The confirmation CTA was visible and enabled. Clicking it confirmed the request and opened a confirmation modal/screen instructing the user to check my email inbox. | Passed |
| Open confirmation mail | Opened mail, clicked on confirmation link. | A verification email containing a valid confirmation link is delivered to the user's inbox. Clicking the link opens a new browser tab displaying a welcome screen that initiates user onboarding. | A verification email containing a valid confirmation link was delivered to the user's inbox. Clicking the link opened a new browser tab displaying a welcome screen that initiated user onboarding. | Passed |
| Using /login to sign in with the same credentials | Filled in username and password, clicked CTA "Log in" | Selecting the CTA routes the user through the mandatory onboarding flow before unlocking access to the user profile and core application interface. | Selecting the CTA routed the user through the mandatory onboarding flow before unlocking access to the user profile and core application interface. | Passed |
| Sign out and sign in again | Clicked on sign out button, logging in again | Selecting Sign out terminates the session and redirects the user to the login landing page. After entering valid credentials and clicking Log in, the CTA transitions to a loading state displaying "Logging in" while authenticating, then redirects to the Overview page displaying a prompt to connect a bank account. | Selecting Sign out terminated the session and redirected me to the login landing page. After entering valid credentials and clicking Log in, the CTA transitioned to a loading state displaying "Logging in" while authenticating, then redirected to the Overview page displaying a prompt to connect a bank account. | Passed |

---

## Test Case 2 — "Safe to spend today" shows on the dashboard

### Use Case Scenario Being Tested

**Feature 3.1** "Safe to spend today" (UR7 — _see a single "safe to spend today"
number_).

**Use case:** _Check "safe to spend today" before a purchase._ Maps to Feature 3.1
BDD Scenario 1 (Positive).

### Test Case Scenario Being Tested

A signed-in user with seeded sample data opens the dashboard, reads the
safe-to-spend number, and opens its breakdown — confirming the number is present,
glanceable, and explained as balance minus upcoming bills minus buffer.

### Pre-Conditions of the Whole Test Case Scenario

1. You are signed in and onboarding is complete (you reach `/dashboard`).
2. The account has sample/seeded transactions, bills, and income (simulated
   aggregator — ADR 0004), so a number can actually be computed.
3. You know, roughly, your seeded balance, upcoming bills, and buffer so you can
   sanity-check the math.

### Steps to Complete the Whole Test Case Scenario

1. Open `/dashboard`.
2. Find the Safe to spend today number on the overview and note how quickly it
   appears.
3. Open the safe-to-spend detail (the dedicated `/dashboard/safe-to-spend` view)
   to see the breakdown.
4. Read the breakdown: current balance, upcoming bills subtracted, and buffer.
5. Hand-check: does balance − upcoming bills − buffer roughly equal the number
   shown?
6. (Optional) Mark a bill paid or adjust the buffer in settings, return, and see the
   number change.

### Expected Results of the Whole Test Case Scenario

1. The dashboard loads and the safe-to-spend number is visible without extra
   navigation, within about two seconds.
2. The number is glanceable (one clear figure), not buried in a dense dashboard.
3. The breakdown shows balance, the bills subtracted, and the buffer.
4. The displayed number matches your hand calculation (within rounding).
5. If the number is zero or negative, the state is calm and non-shaming — no red
   alarm language; it reads as "money is committed to bills," with the breakdown
   shown.
6. (If tried) changing a bill's paid state or the buffer updates the number
   accordingly.

### Actual Results

| Step | What did you do? | What should happen? | What actually did happened? | Failed or passed |
| ---- | ---------------- | ------------------- | --------------------------- | ---------------- |
| Log in and land on Dashboard/Overview page | Logged in to an account that had preexisting bank account connection (fake numbers only). | After a successful log in, the application navigates to the dashboard/overview landing page. | After a successful log in, the application navigated to the dashboard/overview landing page. | Passed |
| Find "Safe to spend" page | Selected the "Safe to spend" tab in order to see the breakdown. | The app switches from the Dashboard/Overview landing page to the "Safe to spend" page and displays different categories of "Where did the user spend their money". | The app switched from the Dashboard/Overview landing page to the "Safe to spend" page and displayed different categories of "Where did the user spend their money". | Passed |
| Catch up on recent changes | Clicked on CTA "Catch me up" in order to receive an update towards recent activities. | The interface updates to reflect the new balances and displays a clear before-and-after calculation summary. | The interface updated to reflect the new balances and displayed an adjusted balance without a before-and-after calculation summary. | Failed |
| Read the breakdown | Read the breakdown of upcoming bills, spendings and financial buffer | The spending breakdown is categorized into clear groups (e.g., Grocery, Shopping, Dining, Transport) and renders in a high-contrast, scannable layout. | The spending breakdown is categorized into clear groups (e.g., Grocery, Shopping, Dining, Transport) and rendered in a high-contrast, scannable layout. | Passed |
| Check if balance is correct | Hand checked balance | The displayed amount accurately matches the user's overall account balance. | The displayed amount accurately matched the user's overall account balance. | Passed |

**Note:** the one failed step above (the "Catch me up" summary not showing a clear
before-and-after calculation) was fixed right after testing — see
`docs/adr/0011-catch-up-reentry-summary.md`.

---

### Notes on what the automated checks already cover
The CI unit tests (`test/budget/safeToSpend.test.ts`, `forecast.test.ts`) already
prove the *math* behind the "safe to spend today" number at the function level.
These manual runs confirm the behavior **end-to-end on the live app** — that the UI,
database, and auth all carry it through for a real person.
