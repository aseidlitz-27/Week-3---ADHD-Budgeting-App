# ADR-0009: Data privacy — tokenized connection, export, and deletion

## Date and status
November 13, 2026. Accepted.

## Context
We handle sensitive financial (and implicitly disability-adjacent) data, so users
must be able to trust the app: understand how their data is protected, take it
with them, and erase it. Two implementation questions: how the bank connection
avoids holding credentials, and how "delete my data" works without a server-side
admin key.

## Options
- Bank connection:
  - Store credentials — never acceptable.
  - A revocable, read-only token reference (`accounts.external_ref`) with a
    user-facing revoke — matches how real aggregators (Plaid-style) work, and our
    simulator mirrors it. No password is ever stored.
- Data deletion:
  - Delete the Supabase auth user — needs the service-role/admin key on the
    server, which we deliberately do not ship to the app (least privilege).
  - Delete all the user's rows under RLS and reset the account to a fresh state —
    the browser-safe anon key plus RLS already permits a user to delete their own
    rows, so no elevated key is needed.

## Decision
- **Encryption:** rely on Supabase's encryption at rest and HTTPS in transit, with
  Row Level Security (ADR-0003) ensuring a user can only ever read or write their
  own rows.
- **Tokenized connection (5.3):** connecting stores a generated read-only token in
  `external_ref`; no credentials are kept. The Accounts page states this and lets
  the user **revoke** access (sets `connection_status = revoked`) and reconnect.
- **Export (5.2):** `/dashboard/export` returns a JSON file of all the user's rows
  across every table.
- **Delete (5.2):** "Erase all my data" deletes the user's rows from every table
  under RLS and resets profile/settings to a fresh, pre-onboarding state. The login
  record itself remains (removing it would need an admin key we intentionally do
  not expose); full account removal can be handled as an operator request.

## Consequences
- The app never holds bank credentials or a service-role key; everything runs with
  the browser-safe anon key plus RLS.
- Users can take their data (JSON) and erase it themselves, in-app.
- Erase resets rather than deletes the auth user, so the person can start fresh or
  sign up anew; this is a conscious trade-off for not shipping admin privileges.
