-- ============================================================
-- Budget Tracker — Clear All User Data
-- Deletes all rows except user_settings
-- Run in Supabase SQL Editor
-- ============================================================

-- Order matters due to foreign key constraints
delete from public.transactions;
delete from public.installment_plans;
delete from public.recurring_templates;
delete from public.budgets;
delete from public.credit_cards;
delete from public.banks;
delete from public.categories;
delete from public.profiles;

-- user_settings is intentionally kept