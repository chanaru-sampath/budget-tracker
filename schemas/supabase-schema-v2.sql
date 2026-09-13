-- ============================================================
-- Budget Tracker — Full Supabase Schema
-- v4.0 — Added: bank_accounts, salary_allocations,
--         bank_account_id on transactions/recurring/installments,
--         source + template/plan FK on transactions,
--         recurring_amount_history, installment_amount_history,
--         cc_carry_forward on installment_plans
-- Run this once in Supabase SQL Editor
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. PROFILES
-- Extends auth.users — auto-created via trigger on signup
-- ============================================================
create table public.profiles (
    id          uuid references auth.users(id) on delete cascade primary key,
    full_name   text,
    currency    text not null default 'LKR',
    created_at  timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================
-- 2. CATEGORIES
-- Expense/income categories per user. Seeded with defaults on signup.
-- ============================================================
create table public.categories (
    id          uuid default uuid_generate_v4() primary key,
    user_id     uuid references auth.users(id) on delete cascade not null,
    name        text not null,
    type        text check (type in ('income', 'expense')) not null,
    color       text not null,
    is_default  boolean not null default false,
    created_at  timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================
-- 3. BANK ACCOUNTS
-- Each user's bank/card/wallet accounts.
--
-- account_type drives UI behaviour:
--   'savings'  — regular debit account; receives salary allocations
--   'credit'   — credit card; linked to installment plans; no salary allocation
--   'wallet'   — e-wallets (e.g. Frimi); can receive salary allocation
--
-- No transfer tracking between accounts — only salary-in and expense-out.
-- ============================================================
create table public.bank_accounts (
    id            uuid default uuid_generate_v4() primary key,
    user_id       uuid references auth.users(id) on delete cascade not null,
    name          text not null,           -- e.g. "Combank Savings", "HNB Credit Card"
    account_type  text check (account_type in ('savings', 'credit', 'wallet')) not null,
    color         text not null default '#94a3b8',
    is_active     boolean not null default true,
    created_at    timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================
-- 4. SALARY ALLOCATIONS
-- Monthly distribution of salary across accounts.
-- When salary arrives the user records how much goes to each account.
-- Provides the per-account spending envelope for the month.
--
-- Relationship to budgets:
--   budgets.income           = total salary received this month
--   SUM(salary_allocations)  = total distributed across accounts
--   unallocated              = income - SUM(allocations)  [computed client-side]
--
-- Only 'savings' and 'wallet' accounts should receive allocations.
-- 'credit' accounts are funded by spending — no allocation needed.
-- ============================================================
create table public.salary_allocations (
    id              uuid default uuid_generate_v4() primary key,
    user_id         uuid references auth.users(id) on delete cascade not null,
    bank_account_id uuid references public.bank_accounts(id) on delete cascade not null,
    month           date not null,             -- always 1st of month, e.g. 2026-08-01
    amount          numeric(12, 2) not null,
    notes           text,
    created_at      timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (user_id, bank_account_id, month)
);

-- ============================================================
-- 5. BUDGETS
-- Monthly total income declaration per user per month.
-- ============================================================
create table public.budgets (
    id          uuid default uuid_generate_v4() primary key,
    user_id     uuid references auth.users(id) on delete cascade not null,
    month       date not null,
    income      numeric(12, 2) not null,
    notes       text,
    created_at  timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (user_id, month)
);

-- ============================================================
-- 6. RECURRING TEMPLATES
-- Open-ended recurring expenses (e.g. Netflix, Internet).
-- 'amount' always holds the current/latest amount.
-- Historical amounts are tracked in recurring_amount_history.
-- ============================================================
create table public.recurring_templates (
    id              uuid default uuid_generate_v4() primary key,
    user_id         uuid references auth.users(id) on delete cascade not null,
    category_id     uuid references public.categories(id) on delete set null,
    bank_account_id uuid references public.bank_accounts(id) on delete set null,
    label           text not null,
    amount          numeric(12, 2) not null,   -- current/latest amount
    paid_via        text,                      -- free-text fallback label
    start_date      date not null,
    end_date        date,                      -- null = indefinite
    is_active       boolean not null default true,
    created_at      timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================
-- 6a. RECURRING AMOUNT HISTORY
-- Append-only audit table for amount changes on recurring templates.
--
-- When the user changes a template's amount from month M onward:
--   1. Update recurring_templates.amount (display value)
--   2. Insert a row here with effective_from = M
--   3. Past auto-generated transactions are NEVER touched
--
-- Auto-populate logic uses:
--   SELECT amount FROM recurring_amount_history
--   WHERE template_id = :id AND effective_from <= :month
--   ORDER BY effective_from DESC LIMIT 1
--   (fall back to recurring_templates.amount if no history row exists)
--
-- RLS: SELECT + INSERT only — rows are immutable once written.
-- ============================================================
create table public.recurring_amount_history (
    id              uuid default uuid_generate_v4() primary key,
    template_id     uuid references public.recurring_templates(id) on delete cascade not null,
    user_id         uuid references auth.users(id) on delete cascade not null,
    amount          numeric(12, 2) not null,
    effective_from  date not null,   -- always 1st of month
    created_at      timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (template_id, effective_from)
);

-- ============================================================
-- 7. INSTALLMENT PLANS
-- Fixed-count credit card / loan installments.
-- 'monthly_amount' always holds the current/latest amount.
-- Historical amounts are tracked in installment_amount_history.
--
-- cc_carry_forward:
--   If true, any portion of this month's installment not paid is
--   rolled into next month's auto-generated transaction.
--   The rolled-over amount is stored in carry_forward_amount.
--   carry_forward_amount MUST be reset to 0 in the same mutation
--   that creates the next month's transaction to avoid double-carry.
--
-- paid_installments is only incremented when the FULL monthly_amount
-- (excluding any carry-forward) has been covered for that month.
-- ============================================================
create table public.installment_plans (
    id                   uuid default uuid_generate_v4() primary key,
    user_id              uuid references auth.users(id) on delete cascade not null,
    category_id          uuid references public.categories(id) on delete set null,
    bank_account_id      uuid references public.bank_accounts(id) on delete set null,
    label                text not null,
    total_amount         numeric(12, 2) not null,    -- original purchase price
    monthly_amount       numeric(12, 2) not null,    -- current/latest monthly installment
    total_installments   int not null,
    paid_installments    int not null default 0,
    start_date           date not null,
    paid_via             text,
    cc_carry_forward     boolean not null default false,
    carry_forward_amount numeric(12, 2) not null default 0,
    notes                text,
    is_active            boolean not null default true,
    created_at           timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================
-- 7a. INSTALLMENT AMOUNT HISTORY
-- Same forward-only append-only pattern as recurring_amount_history.
-- When monthly_amount changes, insert here; past transactions untouched.
-- RLS: SELECT + INSERT only — immutable.
-- ============================================================
create table public.installment_amount_history (
    id               uuid default uuid_generate_v4() primary key,
    plan_id          uuid references public.installment_plans(id) on delete cascade not null,
    user_id          uuid references auth.users(id) on delete cascade not null,
    monthly_amount   numeric(12, 2) not null,
    effective_from   date not null,
    created_at       timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (plan_id, effective_from)
);

-- ============================================================
-- 8. TRANSACTIONS
-- Individual income/expense entries — both manual and auto-generated.
--
-- source: tracks origin to prevent double-inserts and show provenance in UI
--   'manual'      — user entered directly
--   'recurring'   — auto-generated from a recurring_template
--   'installment' — auto-generated from an installment_plan
--
-- template_id / installment_plan_id:
--   Link back to the originating template. Editing the transaction
--   amount for this month only changes THIS row — the template and
--   other months' transactions are never affected.
--
-- bank_account_id:
--   Which account this transaction was paid from / received into.
--   Nullable — older manual entries may not have an account set.
-- ============================================================
create table public.transactions (
    id                  uuid default uuid_generate_v4() primary key,
    user_id             uuid references auth.users(id) on delete cascade not null,
    category_id         uuid references public.categories(id) on delete set null,
    bank_account_id     uuid references public.bank_accounts(id) on delete set null,
    amount              numeric(12, 2) not null,
    type                text check (type in ('income', 'expense')) not null,
    date                date not null,
    notes               text,
    source              text check (source in ('manual', 'recurring', 'installment'))
                            not null default 'manual',
    template_id         uuid references public.recurring_templates(id) on delete set null,
    installment_plan_id uuid references public.installment_plans(id) on delete set null,
    created_at          timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================
-- 9. USER SETTINGS
-- ============================================================
create table public.user_settings (
    user_id                uuid references auth.users(id) on delete cascade primary key,
    currency               text not null default 'LKR',
    theme                  text not null default 'light',
    notifications_enabled  boolean not null default true,
    updated_at             timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles                   enable row level security;
alter table public.categories                 enable row level security;
alter table public.bank_accounts              enable row level security;
alter table public.salary_allocations         enable row level security;
alter table public.budgets                    enable row level security;
alter table public.recurring_templates        enable row level security;
alter table public.recurring_amount_history   enable row level security;
alter table public.installment_plans          enable row level security;
alter table public.installment_amount_history enable row level security;
alter table public.transactions               enable row level security;
alter table public.user_settings              enable row level security;

-- --- profiles ---
create policy "Users can view own profile"
    on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
    on public.profiles for update using (auth.uid() = id);

-- --- categories ---
create policy "Users can view own categories"
    on public.categories for select using (auth.uid() = user_id);
create policy "Users can insert own categories"
    on public.categories for insert with check (auth.uid() = user_id);
create policy "Users can update own categories"
    on public.categories for update using (auth.uid() = user_id);
create policy "Users can delete own categories"
    on public.categories for delete using (auth.uid() = user_id);

-- --- bank_accounts ---
create policy "Users can view own bank accounts"
    on public.bank_accounts for select using (auth.uid() = user_id);
create policy "Users can insert own bank accounts"
    on public.bank_accounts for insert with check (auth.uid() = user_id);
create policy "Users can update own bank accounts"
    on public.bank_accounts for update using (auth.uid() = user_id);
create policy "Users can delete own bank accounts"
    on public.bank_accounts for delete using (auth.uid() = user_id);

-- --- salary_allocations ---
create policy "Users can view own salary allocations"
    on public.salary_allocations for select using (auth.uid() = user_id);
create policy "Users can insert own salary allocations"
    on public.salary_allocations for insert with check (auth.uid() = user_id);
create policy "Users can update own salary allocations"
    on public.salary_allocations for update using (auth.uid() = user_id);
create policy "Users can delete own salary allocations"
    on public.salary_allocations for delete using (auth.uid() = user_id);

-- --- budgets ---
create policy "Users can view own budgets"
    on public.budgets for select using (auth.uid() = user_id);
create policy "Users can insert own budgets"
    on public.budgets for insert with check (auth.uid() = user_id);
create policy "Users can update own budgets"
    on public.budgets for update using (auth.uid() = user_id);
create policy "Users can delete own budgets"
    on public.budgets for delete using (auth.uid() = user_id);

-- --- recurring_templates ---
create policy "Users can view own recurring templates"
    on public.recurring_templates for select using (auth.uid() = user_id);
create policy "Users can insert own recurring templates"
    on public.recurring_templates for insert with check (auth.uid() = user_id);
create policy "Users can update own recurring templates"
    on public.recurring_templates for update using (auth.uid() = user_id);
create policy "Users can delete own recurring templates"
    on public.recurring_templates for delete using (auth.uid() = user_id);

-- --- recurring_amount_history (immutable — no UPDATE/DELETE) ---
create policy "Users can view own recurring amount history"
    on public.recurring_amount_history for select using (auth.uid() = user_id);
create policy "Users can insert own recurring amount history"
    on public.recurring_amount_history for insert with check (auth.uid() = user_id);

-- --- installment_plans ---
create policy "Users can view own installment plans"
    on public.installment_plans for select using (auth.uid() = user_id);
create policy "Users can insert own installment plans"
    on public.installment_plans for insert with check (auth.uid() = user_id);
create policy "Users can update own installment plans"
    on public.installment_plans for update using (auth.uid() = user_id);
create policy "Users can delete own installment plans"
    on public.installment_plans for delete using (auth.uid() = user_id);

-- --- installment_amount_history (immutable — no UPDATE/DELETE) ---
create policy "Users can view own installment amount history"
    on public.installment_amount_history for select using (auth.uid() = user_id);
create policy "Users can insert own installment amount history"
    on public.installment_amount_history for insert with check (auth.uid() = user_id);

-- --- transactions ---
create policy "Users can view own transactions"
    on public.transactions for select using (auth.uid() = user_id);
create policy "Users can insert own transactions"
    on public.transactions for insert with check (auth.uid() = user_id);
create policy "Users can update own transactions"
    on public.transactions for update using (auth.uid() = user_id);
create policy "Users can delete own transactions"
    on public.transactions for delete using (auth.uid() = user_id);

-- --- user_settings (no DELETE — row is permanent) ---
create policy "Users can view own settings"
    on public.user_settings for select using (auth.uid() = user_id);
create policy "Users can insert own settings"
    on public.user_settings for insert with check (auth.uid() = user_id);
create policy "Users can update own settings"
    on public.user_settings for update using (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: auto-create profile + seed defaults on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');

  insert into public.user_settings (user_id)
  values (new.id);

  insert into public.categories (user_id, name, type, color, is_default) values
    (new.id, 'Highway',     'expense', '#f97316', true),
    (new.id, 'EPF/ETF',    'expense', '#8b5cf6', true),
    (new.id, 'Insurance',   'expense', '#06b6d4', true),
    (new.id, 'Electricity', 'expense', '#eab308', true),
    (new.id, 'Internet',    'expense', '#3b82f6', true),
    (new.id, 'Telephone',   'expense', '#10b981', true),
    (new.id, 'Mobiles',     'expense', '#6366f1', true),
    (new.id, 'TV',          'expense', '#ec4899', true),
    (new.id, 'Savings',     'expense', '#14b8a6', true),
    (new.id, 'General',     'expense', '#78716c', true),
    (new.id, 'Trip',        'expense', '#f59e0b', true),
    (new.id, 'Home',        'expense', '#22c55e', true),
    (new.id, 'Other',       'expense', '#94a3b8', true);

  insert into public.categories (user_id, name, type, color, is_default) values
    (new.id, 'Salary', 'income', '#22c55e', true);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
