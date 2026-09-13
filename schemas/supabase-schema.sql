-- ============================================================
-- Budget Tracker — Full Supabase Schema v2
-- Run this once on a fresh project (no prior migrations).
-- For existing v1 installs, run migration-v2.sql instead.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. PROFILES
-- ============================================================
create table public.profiles (
    id          uuid references auth.users(id) on delete cascade primary key,
    full_name   text,
    currency    text not null default 'LKR',
    created_at  timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================
-- 2. CATEGORIES
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
-- 3. BANKS
-- One row per bank account. Mark exactly one as the salary source.
-- ============================================================
create table public.banks (
    id                  uuid default uuid_generate_v4() primary key,
    user_id             uuid references auth.users(id) on delete cascade not null,
    name                text not null,
    is_salary_account   boolean not null default false,
    color               text not null default '#6366f1',
    sort_order          int not null default 0,
    created_at          timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================
-- 4. CREDIT CARDS
-- Each CC is linked to a bank (bill is paid from that bank).
-- ============================================================
create table public.credit_cards (
    id          uuid default uuid_generate_v4() primary key,
    user_id     uuid references auth.users(id) on delete cascade not null,
    bank_id     uuid references public.banks(id) on delete cascade not null,
    name        text not null,
    last_four   text,
    color       text not null default '#f59e0b',
    sort_order  int not null default 0,
    created_at  timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================
-- 5. TRANSACTIONS
-- Individual income/expense entries (manual or auto-generated).
-- source_type: 'manual' | 'bank' | 'card'
-- recurring_template_id / installment_plan_id: set when auto-generated
-- ============================================================
create table public.transactions (
    id                      uuid default uuid_generate_v4() primary key,
    user_id                 uuid references auth.users(id) on delete cascade not null,
    category_id             uuid references public.categories(id) on delete set null,
    bank_id                 uuid references public.banks(id) on delete set null,
    card_id                 uuid references public.credit_cards(id) on delete set null,
    amount                  numeric(12, 2) not null,
    type                    text check (type in ('income', 'expense')) not null,
    source_type             text check (source_type in ('bank', 'card', 'manual')) default 'manual',
    date                    date not null,
    notes                   text,
    recurring_template_id   uuid references public.recurring_templates(id) on delete set null,
    installment_plan_id     uuid references public.installment_plans(id) on delete set null,
    created_at              timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================
-- 6. BUDGETS
-- Monthly income declaration per user per month.
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
-- 7. RECURRING TEMPLATES
-- Open-ended monthly expenses. Paid via a bank account OR a CC.
-- bank_id: direct bank debit | card_id: charged to CC
-- ============================================================
create table public.recurring_templates (
    id          uuid default uuid_generate_v4() primary key,
    user_id     uuid references auth.users(id) on delete cascade not null,
    category_id uuid references public.categories(id) on delete set null,
    bank_id     uuid references public.banks(id) on delete set null,
    card_id     uuid references public.credit_cards(id) on delete set null,
    label       text not null,
    amount      numeric(12, 2) not null,
    start_date  date not null,
    end_date    date,
    is_active   boolean not null default true,
    created_at  timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint recurring_templates_payment_source_check check (
        (bank_id is not null and card_id is null) or
        (bank_id is null and card_id is not null)
    )
);

-- ============================================================
-- 8. INSTALLMENT PLANS
-- Fixed-count CC installments. Always linked to a credit card.
-- Progress tracked by paid_installments counter (incremented
-- each time an installment transaction is auto-generated).
-- ============================================================
create table public.installment_plans (
    id                  uuid default uuid_generate_v4() primary key,
    user_id             uuid references auth.users(id) on delete cascade not null,
    category_id         uuid references public.categories(id) on delete set null,
    card_id             uuid references public.credit_cards(id) on delete set null,
    label               text not null,
    total_amount        numeric(12, 2) not null,
    monthly_amount      numeric(12, 2) not null,
    total_installments  int not null,
    paid_installments   int not null default 0,
    start_date          date not null,
    notes               text,
    is_active           boolean not null default true,
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
alter table public.profiles            enable row level security;
alter table public.categories          enable row level security;
alter table public.banks               enable row level security;
alter table public.credit_cards        enable row level security;
alter table public.transactions        enable row level security;
alter table public.budgets             enable row level security;
alter table public.recurring_templates enable row level security;
alter table public.installment_plans   enable row level security;
alter table public.user_settings       enable row level security;

-- profiles
create policy "Users can view own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- categories
create policy "Users can view own categories"   on public.categories for select using (auth.uid() = user_id);
create policy "Users can insert own categories" on public.categories for insert with check (auth.uid() = user_id);
create policy "Users can update own categories" on public.categories for update using (auth.uid() = user_id);
create policy "Users can delete own categories" on public.categories for delete using (auth.uid() = user_id);

-- banks
create policy "Users can view own banks"   on public.banks for select using (auth.uid() = user_id);
create policy "Users can insert own banks" on public.banks for insert with check (auth.uid() = user_id);
create policy "Users can update own banks" on public.banks for update using (auth.uid() = user_id);
create policy "Users can delete own banks" on public.banks for delete using (auth.uid() = user_id);

-- credit_cards
create policy "Users can view own credit cards"   on public.credit_cards for select using (auth.uid() = user_id);
create policy "Users can insert own credit cards" on public.credit_cards for insert with check (auth.uid() = user_id);
create policy "Users can update own credit cards" on public.credit_cards for update using (auth.uid() = user_id);
create policy "Users can delete own credit cards" on public.credit_cards for delete using (auth.uid() = user_id);

-- transactions
create policy "Users can view own transactions"   on public.transactions for select using (auth.uid() = user_id);
create policy "Users can insert own transactions" on public.transactions for insert with check (auth.uid() = user_id);
create policy "Users can update own transactions" on public.transactions for update using (auth.uid() = user_id);
create policy "Users can delete own transactions" on public.transactions for delete using (auth.uid() = user_id);

-- budgets
create policy "Users can view own budgets"   on public.budgets for select using (auth.uid() = user_id);
create policy "Users can insert own budgets" on public.budgets for insert with check (auth.uid() = user_id);
create policy "Users can update own budgets" on public.budgets for update using (auth.uid() = user_id);
create policy "Users can delete own budgets" on public.budgets for delete using (auth.uid() = user_id);

-- recurring_templates
create policy "Users can view own recurring templates"   on public.recurring_templates for select using (auth.uid() = user_id);
create policy "Users can insert own recurring templates" on public.recurring_templates for insert with check (auth.uid() = user_id);
create policy "Users can update own recurring templates" on public.recurring_templates for update using (auth.uid() = user_id);
create policy "Users can delete own recurring templates" on public.recurring_templates for delete using (auth.uid() = user_id);

-- installment_plans
create policy "Users can view own installment plans"   on public.installment_plans for select using (auth.uid() = user_id);
create policy "Users can insert own installment plans" on public.installment_plans for insert with check (auth.uid() = user_id);
create policy "Users can update own installment plans" on public.installment_plans for update using (auth.uid() = user_id);
create policy "Users can delete own installment plans" on public.installment_plans for delete using (auth.uid() = user_id);

-- user_settings
create policy "Users can view own settings"   on public.user_settings for select using (auth.uid() = user_id);
create policy "Users can insert own settings" on public.user_settings for insert with check (auth.uid() = user_id);
create policy "Users can update own settings" on public.user_settings for update using (auth.uid() = user_id);

-- ============================================================
-- UNIQUE INDEXES — prevent duplicate auto-generated transactions
-- ============================================================
create unique index uniq_recurring_transaction_per_month
    on public.transactions (recurring_template_id, date_trunc('month', date::timestamp))
    where recurring_template_id is not null;

create unique index uniq_installment_transaction_per_month
    on public.transactions (installment_plan_id, date_trunc('month', date::timestamp))
    where installment_plan_id is not null;

-- ============================================================
-- TRIGGER: auto-create profile + seed default categories on signup
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
    (new.id, 'Highway',    'expense', '#f97316', true),
    (new.id, 'EPF/ETF',   'expense', '#8b5cf6', true),
    (new.id, 'Insurance',  'expense', '#06b6d4', true),
    (new.id, 'Electricity','expense', '#eab308', true),
    (new.id, 'Internet',   'expense', '#3b82f6', true),
    (new.id, 'Telephone',  'expense', '#10b981', true),
    (new.id, 'Mobiles',    'expense', '#6366f1', true),
    (new.id, 'TV',         'expense', '#ec4899', true),
    (new.id, 'Savings',    'expense', '#14b8a6', true),
    (new.id, 'General',    'expense', '#78716c', true),
    (new.id, 'Trip',       'expense', '#f59e0b', true),
    (new.id, 'Home',       'expense', '#22c55e', true),
    (new.id, 'Other',      'expense', '#94a3b8', true);

  insert into public.categories (user_id, name, type, color, is_default) values
    (new.id, 'Salary', 'income', '#22c55e', true);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
