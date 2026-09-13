-- ============================================================
-- Budget Tracker — Migration v2
-- Adds: banks, credit_cards
-- Alters: recurring_templates, installment_plans, transactions
-- Run once in Supabase SQL Editor (safe to re-run — uses IF NOT EXISTS)
-- ============================================================

-- ============================================================
-- 1. BANKS
-- One row per bank account the user holds.
-- ============================================================
create table if not exists public.banks (
    id                  uuid default uuid_generate_v4() primary key,
    user_id             uuid references auth.users(id) on delete cascade not null,
    name                text not null,              -- e.g. "HNB Savings", "Combank Current"
    is_salary_account   boolean not null default false,  -- mark one as the salary source
    color               text not null default '#6366f1', -- hex, for UI display
    sort_order          int not null default 0,
    created_at          timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.banks enable row level security;

create policy "Users can view own banks"
    on public.banks for select using (auth.uid() = user_id);
create policy "Users can insert own banks"
    on public.banks for insert with check (auth.uid() = user_id);
create policy "Users can update own banks"
    on public.banks for update using (auth.uid() = user_id);
create policy "Users can delete own banks"
    on public.banks for delete using (auth.uid() = user_id);

-- ============================================================
-- 2. CREDIT CARDS
-- Credit cards linked to a parent bank account.
-- The CC bill is paid from the linked bank account.
-- ============================================================
create table if not exists public.credit_cards (
    id          uuid default uuid_generate_v4() primary key,
    user_id     uuid references auth.users(id) on delete cascade not null,
    bank_id     uuid references public.banks(id) on delete cascade not null,
    name        text not null,              -- e.g. "HNB Visa", "Combank Gold"
    last_four   text,                       -- optional, for display
    color       text not null default '#f59e0b',
    sort_order  int not null default 0,
    created_at  timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.credit_cards enable row level security;

create policy "Users can view own credit cards"
    on public.credit_cards for select using (auth.uid() = user_id);
create policy "Users can insert own credit cards"
    on public.credit_cards for insert with check (auth.uid() = user_id);
create policy "Users can update own credit cards"
    on public.credit_cards for update using (auth.uid() = user_id);
create policy "Users can delete own credit cards"
    on public.credit_cards for delete using (auth.uid() = user_id);

-- ============================================================
-- 3. ALTER recurring_templates
-- Add bank_id (paid via bank account) and card_id (paid via CC).
-- Exactly one must be set per row. Old paid_via text kept for now.
-- ============================================================
alter table public.recurring_templates
    add column if not exists bank_id uuid references public.banks(id) on delete set null,
    add column if not exists card_id uuid references public.credit_cards(id) on delete set null;

-- Constraint: must be linked to either a bank OR a card, not both, not neither.
-- (Add after your existing data is migrated to use the new FKs.)
-- Uncomment when ready:
-- alter table public.recurring_templates
--     add constraint recurring_templates_payment_source_check
--     check (
--         (bank_id is not null and card_id is null) or
--         (bank_id is null and card_id is not null)
--     );

-- ============================================================
-- 4. ALTER installment_plans
-- Add card_id — installments are always on a credit card.
-- Old paid_via text kept for now.
-- ============================================================
alter table public.installment_plans
    add column if not exists card_id uuid references public.credit_cards(id) on delete set null;

-- ============================================================
-- 5. ALTER transactions
-- Add source columns so each materialized row knows:
--   - which bank or card it was charged to
--   - which template or plan generated it (prevents duplicate auto-generation)
-- ============================================================
alter table public.transactions
    add column if not exists bank_id                 uuid references public.banks(id) on delete set null,
    add column if not exists card_id                 uuid references public.credit_cards(id) on delete set null,
    add column if not exists source_type             text check (source_type in ('bank', 'card', 'manual')) default 'manual',
    add column if not exists recurring_template_id   uuid references public.recurring_templates(id) on delete set null,
    add column if not exists installment_plan_id     uuid references public.installment_plans(id) on delete set null;

-- Unique constraint: one auto-generated transaction per template per month
-- (prevents duplicate generation if the app is opened multiple times)
create unique index if not exists uniq_recurring_transaction_per_month
    on public.transactions (recurring_template_id, date_trunc('month', date::timestamp))
    where recurring_template_id is not null;

create unique index if not exists uniq_installment_transaction_per_month
    on public.transactions (installment_plan_id, date_trunc('month', date::timestamp))
    where installment_plan_id is not null;

-- ============================================================
-- Done.
-- After running this migration:
-- 1. Create your bank accounts via the app (Settings > Banks)
-- 2. Create your credit cards (Settings > Credit Cards)
-- 3. Update existing recurring templates to link to a bank_id or card_id
-- 4. Update existing installment plans to link to a card_id
-- ============================================================
