-- 0002_enable_rls.sql
-- Row Level Security: every table is owner-only.
-- A signed-in user can read/create/change/delete ONLY their own rows.
-- profiles/settings are keyed by the auth user id; every other table has user_id.

-- profiles ------------------------------------------------------------------
alter table public.profiles enable row level security;
create policy "profiles_owner" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- settings ------------------------------------------------------------------
alter table public.settings enable row level security;
create policy "settings_owner" on public.settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- accounts ------------------------------------------------------------------
alter table public.accounts enable row level security;
create policy "accounts_owner" on public.accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- incomes -------------------------------------------------------------------
alter table public.incomes enable row level security;
create policy "incomes_owner" on public.incomes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- categories ----------------------------------------------------------------
alter table public.categories enable row level security;
create policy "categories_owner" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- category_rules ------------------------------------------------------------
alter table public.category_rules enable row level security;
create policy "category_rules_owner" on public.category_rules
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- bills ---------------------------------------------------------------------
alter table public.bills enable row level security;
create policy "bills_owner" on public.bills
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- transactions --------------------------------------------------------------
alter table public.transactions enable row level security;
create policy "transactions_owner" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- reminders -----------------------------------------------------------------
alter table public.reminders enable row level security;
create policy "reminders_owner" on public.reminders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- rewards -------------------------------------------------------------------
alter table public.rewards enable row level security;
create policy "rewards_owner" on public.rewards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
