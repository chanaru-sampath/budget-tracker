-- ============================================================
-- Budget Tracker — Drop All Tables
-- Drops all tables in the public schema to start fresh
-- Run in Supabase SQL Editor
-- ============================================================

drop table if exists public.transactions cascade;
drop table if exists public.installment_amount_history cascade;
drop table if exists public.installment_plans cascade;
drop table if exists public.recurring_amount_history cascade;
drop table if exists public.recurring_templates cascade;
drop table if exists public.salary_allocations cascade;
drop table if exists public.budgets cascade;
drop table if exists public.bank_accounts cascade;
drop table if exists public.categories cascade;
drop table if exists public.user_settings cascade;
drop table if exists public.profiles cascade;
