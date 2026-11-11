-- 0001_init_schema.sql
-- ADHD Budgeting App — initial schema (MVP #1).
-- Money is numeric(12,2); timestamps are timestamptz. Fake data only.
-- Tables are created in dependency order (a table is created before anything
-- that references it).

-- 1:1 with the Supabase auth user ------------------------------------------
create table public.profiles (
  id                   uuid primary key references auth.users (id) on delete cascade,
  display_name         text,
  onboarding_completed boolean not null default false,
  created_at           timestamptz not null default now()
);

create table public.settings (
  user_id               uuid primary key references auth.users (id) on delete cascade,
  safe_to_spend_buffer  numeric(12,2) not null default 0,
  notifications_enabled boolean not null default true,
  reminder_lead_days    integer not null default 3,
  reminder_style        text not null default 'gentle' check (reminder_style in ('gentle','direct')),
  density               text not null default 'calm'   check (density in ('calm','compact')),
  created_at            timestamptz not null default now()
);

-- Accounts (simulated) ------------------------------------------------------
create table public.accounts (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  name              text not null,
  type              text not null check (type in ('checking','savings','credit','cash')),
  institution_name  text,
  current_balance   numeric(12,2) not null default 0,
  connection_status text not null default 'active' check (connection_status in ('active','expired','revoked')),
  external_ref      text,
  created_at        timestamptz not null default now()
);

-- Income sources (recurring / variable / irregular) -------------------------
create table public.incomes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  source_name text not null,
  amount      numeric(12,2) not null check (amount >= 0),
  is_variable boolean not null default false,
  recurrence  text not null default 'monthly'
                check (recurrence in ('one_time','weekly','biweekly','monthly','irregular')),
  next_date   date,
  account_id  uuid references public.accounts (id) on delete set null,
  created_at  timestamptz not null default now()
);

-- Categories (per user, seeded defaults) ------------------------------------
create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  color      text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.category_rules (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  match_text  text not null,
  category_id uuid not null references public.categories (id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- Bills ---------------------------------------------------------------------
create table public.bills (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  name           text not null,
  amount         numeric(12,2) not null check (amount >= 0),
  due_date       date not null,
  recurrence     text not null default 'monthly' check (recurrence in ('none','weekly','monthly','yearly')),
  status         text not null default 'unpaid'  check (status in ('unpaid','paid')),
  is_subscription boolean not null default false,
  account_id     uuid references public.accounts (id) on delete set null,
  created_at     timestamptz not null default now()
);

-- Transactions (linked to a bill when a bill is paid) -----------------------
create table public.transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  account_id  uuid not null references public.accounts (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  bill_id     uuid references public.bills (id) on delete set null,
  amount      numeric(12,2) not null check (amount >= 0),
  type        text not null check (type in ('expense','income')),
  merchant    text,
  occurred_on date not null,
  source      text not null default 'manual' check (source in ('import','manual')),
  created_at  timestamptz not null default now()
);

-- Reminders -----------------------------------------------------------------
create table public.reminders (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  bill_id    uuid not null references public.bills (id) on delete cascade,
  remind_at  timestamptz not null,
  status     text not null default 'scheduled' check (status in ('scheduled','sent','dismissed')),
  created_at timestamptz not null default now()
);

-- Rewards -------------------------------------------------------------------
create table public.rewards (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  kind         text not null,
  earned_at    timestamptz not null default now(),
  acknowledged boolean not null default false
);

-- Indexes for common per-user lookups --------------------------------------
create index idx_transactions_user_date on public.transactions (user_id, occurred_on);
create index idx_transactions_account   on public.transactions (account_id);
create index idx_transactions_bill      on public.transactions (bill_id);
create index idx_transactions_category  on public.transactions (category_id);
create index idx_bills_user_due         on public.bills (user_id, due_date);
create index idx_incomes_user_next      on public.incomes (user_id, next_date);
create index idx_reminders_user_time    on public.reminders (user_id, remind_at);
create index idx_accounts_user          on public.accounts (user_id);
create index idx_categories_user        on public.categories (user_id);
