# Budget Tracker — System Design Document

_v4.0 — Added bank accounts, salary allocations, forward-only amount change history, CC carry-forward_

## 1. Overview

A personal household budget tracker web app to replace manual Excel tracking.
Each family member logs in independently, manages their own monthly income and
expenses, tracks recurring payments and credit card installments, and views a
summary of income vs. expenses with category breakdowns — all scoped per bank account.

---

## 2. Tech Stack

| Layer              | Choice           | Version                                          | Notes                                            |
| ------------------ | ---------------- | ------------------------------------------------ | ------------------------------------------------ |
| Frontend framework | React            | ^19.2.0                                          | Latest stable                                    |
| Build tool         | Vite             | ^7.x                                             | Latest                                           |
| Styling            | Tailwind CSS v4  | ^4.1.x                                           | Via `@tailwindcss/vite` plugin                   |
| Component library  | shadcn/ui        | latest (new-york style)                          | Tailwind v4 + React 19 compatible, OKLCH colors  |
| Routing            | TanStack Router  | ^1.x                                             | File-based routing via `@tanstack/router-plugin` |
| Server state       | TanStack Query   | ^5.x                                             | Caching, background refetch, optimistic updates  |
| Client state       | Zustand          | ^5.0.15                                          | Auth session, UI state, month selector           |
| Backend / DB       | Supabase         | @supabase/supabase-js ^2.x, @supabase/ssr ^0.5.x | PostgreSQL + Auth + RLS                          |
| Icons              | lucide-react     | ^0.554.0                                         | Ships with shadcn/ui                             |
| Charts             | Recharts         | ^2.x                                             | Works with React 19                              |
| Notifications      | Sonner           | latest                                           | Replaces shadcn toast (deprecated in v4)         |
| Hosting            | Cloudflare Pages | —                                                | Free tier, GitHub auto-deploy                    |
| Language           | TypeScript       | ~5.9.x                                           | Strict mode                                      |

---

## 3. Package Manager & Tooling

- **Package manager**: `pnpm` (v9+)
- **Formatter**: Prettier — enforced via `.prettierrc` + `prettier-plugin-tailwindcss` for class sorting
- **Editor config**: `.editorconfig` for consistent indent/line-ending across editors

## 4. Package Installation Reference

```bash
# 1. Scaffold project
pnpm create vite@latest budget-tracker -- --template react-ts
cd budget-tracker

# 2. Tailwind v4 (Vite plugin — no tailwind.config.js needed)
pnpm add tailwindcss @tailwindcss/vite

# 3. shadcn/ui
pnpm dlx shadcn@latest init
# -> style: new-york | base color: Slate | CSS variables: yes

# 4. TanStack Router
pnpm add @tanstack/react-router @tanstack/react-router-devtools
pnpm add -D @tanstack/router-plugin

# 5. TanStack Query
pnpm add @tanstack/react-query @tanstack/react-query-devtools

# 6. Zustand v5
pnpm add zustand

# 7. Supabase
pnpm add @supabase/supabase-js @supabase/ssr

# 8. Charts + Notifications
pnpm add recharts sonner

# 9. React Hook Form + Zod
pnpm add react-hook-form @hookform/resolvers zod

# 10. Dev tools
pnpm add -D @types/node prettier prettier-plugin-tailwindcss
```

---

## 5. Naming Conventions

| Thing                       | Convention                 | Example                                 |
| --------------------------- | -------------------------- | --------------------------------------- |
| Folders                     | kebab-case                 | `query-keys/`, `use-auth-store/`        |
| Files (all)                 | kebab-case                 | `use-expenses.ts`, `month-selector.tsx` |
| React components (file)     | kebab-case                 | `expense-table.tsx`                     |
| React components (export)   | PascalCase                 | `export function ExpenseTable()`        |
| Zustand stores (file)       | kebab-case                 | `use-auth-store.ts`                     |
| TanStack Query hooks (file) | kebab-case                 | `use-expenses.ts`                       |
| Route files                 | TanStack Router convention | `dashboard.tsx`, `_app/route.tsx`       |
| Auto-generated files        | Lib convention (untouched) | `routeTree.gen.ts`, `database.types.ts` |
| CSS / config files          | As required by tool        | `vite.config.ts`, `.prettierrc`         |

**Rule of thumb**: if _you_ create it → kebab-case. If a _library generates it_ → leave it as-is.

## 6. Prettier Config (`.prettierrc`)

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

`.prettierignore`:

```
routeTree.gen.ts
dist/
node_modules/
```

## 7. vite.config.ts

```ts
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    // tanstackRouter MUST come before react plugin
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

---

## 8. Users & Auth

- Each person has their own account via email + password.
- Supabase Auth handles login/logout/session via `@supabase/ssr`.
- Auth session stored in Zustand (`use-auth-store.ts`) — no React Context needed.
- Row Level Security (RLS) on ALL tables — users can never touch another user's rows.
- Password reset via Supabase built-in email flow.

---

## 9. State Management Strategy

| State type                                   | Tool                       | Reason                                     |
| -------------------------------------------- | -------------------------- | ------------------------------------------ |
| Auth session / current user                  | Zustand (`use-auth-store`) | Global, persistent                         |
| Selected month                               | Zustand (`use-ui-store`)   | Shared across all pages                    |
| Server data (transactions, categories, etc.) | TanStack Query             | Caching, deduplication, background refetch |
| Form state                                   | React Hook Form + Zod      | Contained within forms                     |

---

## 10. Database Schema

> Full SQL: [`docs/supabase-schema.sql`](./supabase-schema.sql)

### 10.1 `profiles`

Auto-created on signup via DB trigger.

| Column       | Type          | Notes                       |
| ------------ | ------------- | --------------------------- |
| `id`         | `uuid` PK     | References `auth.users(id)` |
| `full_name`  | `text`        | Nullable                    |
| `currency`   | `text`        | Default `'LKR'`             |
| `created_at` | `timestamptz` |                             |

---

### 10.2 `categories`

Seeded with defaults on signup. User can add/edit freely.

| Column       | Type          | Notes                            |
| ------------ | ------------- | -------------------------------- |
| `id`         | `uuid` PK     |                                  |
| `user_id`    | `uuid` FK     | → `auth.users`                   |
| `name`       | `text`        |                                  |
| `type`       | `text`        | `CHECK IN ('income', 'expense')` |
| `color`      | `text`        | Hex for UI                       |
| `is_default` | `boolean`     | `DEFAULT false`                  |
| `created_at` | `timestamptz` |                                  |

**Default expense categories** (seeded on signup):
Highway, EPF/ETF, Insurance, Electricity, Internet, Telephone, Mobiles, TV, Savings, General, Trip, Home, Other

**Default income category**: Salary

---

### 10.3 `bank_accounts` _(new)_

User's bank accounts, credit cards, and e-wallets.

| Column         | Type          | Notes                                      |
| -------------- | ------------- | ------------------------------------------ |
| `id`           | `uuid` PK     |                                            |
| `user_id`      | `uuid` FK     | → `auth.users`                             |
| `name`         | `text`        | e.g. "Combank Savings", "HNB Credit Card"  |
| `account_type` | `text`        | `CHECK IN ('savings', 'credit', 'wallet')` |
| `color`        | `text`        | Hex, for UI badge                          |
| `is_active`    | `boolean`     | `DEFAULT true`                             |
| `created_at`   | `timestamptz` |                                            |

**`account_type` behaviour:**

- `savings` — receives salary allocations; all regular expenses deducted from here
- `credit` — credit card; CC installment plans are linked here; no salary allocation
- `wallet` — e-wallets (Frimi, etc.)

---

### 10.4 `salary_allocations` _(new)_

Monthly distribution of salary across accounts.

When salary arrives, the user sets how much goes to each account (e.g. LKR 50,000 → Combank Savings, LKR 20,000 → Sampath). This represents the user's planned spending envelope per account for the month. It is separate from `budgets` (which records total income) — together they give:

> **Unallocated = budgets.income − SUM(salary_allocations.amount)**

| Column            | Type            | Notes                       |
| ----------------- | --------------- | --------------------------- |
| `id`              | `uuid` PK       |                             |
| `user_id`         | `uuid` FK       | → `auth.users`              |
| `bank_account_id` | `uuid` FK       | → `bank_accounts`           |
| `month`           | `date`          | Always 1st of month         |
| `amount`          | `numeric(12,2)` | Amount sent to this account |
| `notes`           | `text`          | Nullable                    |
| `created_at`      | `timestamptz`   |                             |

**Constraint**: `UNIQUE (user_id, bank_account_id, month)`

---

### 10.5 `budgets`

Monthly total income declaration.

| Column       | Type            | Notes                             |
| ------------ | --------------- | --------------------------------- |
| `id`         | `uuid` PK       |                                   |
| `user_id`    | `uuid` FK       | → `auth.users`                    |
| `month`      | `date`          | Always 1st of month               |
| `income`     | `numeric(12,2)` | Total salary/income for the month |
| `notes`      | `text`          | Nullable                          |
| `created_at` | `timestamptz`   |                                   |

**Constraint**: `UNIQUE (user_id, month)`

---

### 10.6 `transactions`

Individual income/expense entries. Source column distinguishes manual vs auto-generated entries.

| Column                | Type            | Notes                                                                           |
| --------------------- | --------------- | ------------------------------------------------------------------------------- |
| `id`                  | `uuid` PK       |                                                                                 |
| `user_id`             | `uuid` FK       | → `auth.users`                                                                  |
| `category_id`         | `uuid` FK       | → `categories` (`ON DELETE SET NULL`)                                           |
| `bank_account_id`     | `uuid` FK       | → `bank_accounts` (`ON DELETE SET NULL`) _(new)_                                |
| `amount`              | `numeric(12,2)` |                                                                                 |
| `type`                | `text`          | `CHECK IN ('income', 'expense')`                                                |
| `date`                | `date`          |                                                                                 |
| `notes`               | `text`          | Nullable                                                                        |
| `source`              | `text`          | `CHECK IN ('manual', 'recurring', 'installment')` — `DEFAULT 'manual'`          |
| `template_id`         | `uuid` FK       | → `recurring_templates` (`ON DELETE SET NULL`); set when `source = 'recurring'` |
| `installment_plan_id` | `uuid` FK       | → `installment_plans` (`ON DELETE SET NULL`); set when `source = 'installment'` |
| `created_at`          | `timestamptz`   |                                                                                 |

**Key rule — immutability of past transactions:**
Editing a transaction's amount only changes that specific row. It does NOT propagate to the template or other months. Past months are always a frozen snapshot of what was actually spent.

---

### 10.7 `recurring_templates`

Open-ended recurring expenses (e.g. Internet, Netflix). The `amount` column always holds the **current/latest** amount. Historical amounts are stored in `recurring_amount_history`.

| Column            | Type            | Notes                           |
| ----------------- | --------------- | ------------------------------- |
| `id`              | `uuid` PK       |                                 |
| `user_id`         | `uuid` FK       | → `auth.users`                  |
| `category_id`     | `uuid` FK       | → `categories`                  |
| `bank_account_id` | `uuid` FK       | → `bank_accounts` _(new)_       |
| `label`           | `text`          | e.g. "Netflix", "Internet Bill" |
| `amount`          | `numeric(12,2)` | Current latest amount           |
| `paid_via`        | `text`          | Free-text fallback              |
| `start_date`      | `date`          | First month this applies        |
| `end_date`        | `date`          | Nullable = indefinite           |
| `is_active`       | `boolean`       | `DEFAULT true`                  |
| `created_at`      | `timestamptz`   |                                 |

---

### 10.8 `recurring_amount_history` _(new)_

Audit trail of amount changes on recurring templates. Enables forward-only updates.

| Column           | Type            | Notes                               |
| ---------------- | --------------- | ----------------------------------- |
| `id`             | `uuid` PK       |                                     |
| `template_id`    | `uuid` FK       | → `recurring_templates`             |
| `user_id`        | `uuid` FK       | → `auth.users`                      |
| `amount`         | `numeric(12,2)` | The amount effective from this date |
| `effective_from` | `date`          | Always 1st of month                 |
| `created_at`     | `timestamptz`   |                                     |

**Constraint**: `UNIQUE (template_id, effective_from)` — one amount per template per month.

**RLS**: select + insert only. History rows are **immutable** (no update/delete policies).

---

### 10.9 `installment_plans`

Fixed-count credit card / loan installments.

| Column                 | Type            | Notes                                                              |
| ---------------------- | --------------- | ------------------------------------------------------------------ |
| `id`                   | `uuid` PK       |                                                                    |
| `user_id`              | `uuid` FK       | → `auth.users`                                                     |
| `category_id`          | `uuid` FK       | → `categories`                                                     |
| `bank_account_id`      | `uuid` FK       | → `bank_accounts` _(new; usually a `credit` account)_              |
| `label`                | `text`          | e.g. "MacBook Pro — HNB CC"                                        |
| `total_amount`         | `numeric(12,2)` | Original purchase price                                            |
| `monthly_amount`       | `numeric(12,2)` | Current/latest installment amount                                  |
| `total_installments`   | `int`           | e.g. 12                                                            |
| `paid_installments`    | `int`           | `DEFAULT 0`; incremented on each auto-generated payment            |
| `start_date`           | `date`          | First payment month                                                |
| `paid_via`             | `text`          | Free-text fallback                                                 |
| `cc_carry_forward`     | `boolean`       | `DEFAULT false`; if true, any unpaid portion rolls into next month |
| `carry_forward_amount` | `numeric(12,2)` | `DEFAULT 0`; tracks rolled-over unpaid amount                      |
| `notes`                | `text`          | Nullable                                                           |
| `is_active`            | `boolean`       | `DEFAULT true`; auto-set to false when all installments paid       |
| `created_at`           | `timestamptz`   |                                                                    |

---

### 10.10 `installment_amount_history` _(new)_

Same forward-only pattern as `recurring_amount_history`. When `monthly_amount` changes, a new row is inserted here; past auto-generated transactions are never touched.

| Column           | Type            | Notes                 |
| ---------------- | --------------- | --------------------- |
| `id`             | `uuid` PK       |                       |
| `plan_id`        | `uuid` FK       | → `installment_plans` |
| `user_id`        | `uuid` FK       | → `auth.users`        |
| `monthly_amount` | `numeric(12,2)` |                       |
| `effective_from` | `date`          | Always 1st of month   |
| `created_at`     | `timestamptz`   |                       |

**Constraint**: `UNIQUE (plan_id, effective_from)`

**RLS**: select + insert only. Immutable.

---

### 10.11 `user_settings`

| Column                  | Type          | Notes             |
| ----------------------- | ------------- | ----------------- |
| `user_id`               | `uuid` PK FK  | → `auth.users`    |
| `currency`              | `text`        | `DEFAULT 'LKR'`   |
| `theme`                 | `text`        | `DEFAULT 'light'` |
| `notifications_enabled` | `boolean`     | `DEFAULT true`    |
| `updated_at`            | `timestamptz` |                   |

---

## 11. Recurring Expense Logic

When a user opens a month, the client runs this logic for `recurring_templates`:

1. Fetch all active templates where `start_date <= month` AND (`end_date IS NULL OR end_date >= month`).
2. For each template, check if a `transactions` row already exists for that month with `template_id = template.id`.
3. If not → auto-insert a transaction using the amount **effective for that month**:
   ```
   SELECT amount FROM recurring_amount_history
   WHERE template_id = :id AND effective_from <= :month
   ORDER BY effective_from DESC LIMIT 1
   ```
   If no history row exists yet (template is new), fall back to `recurring_templates.amount`.
4. The auto-inserted transaction is independent — the user can edit or delete it for this month without affecting the template or any other month.

**Amount change flow (forward-only):**

1. User changes the amount on a recurring template from month M onward.
2. App updates `recurring_templates.amount` (the display value).
3. App inserts a row in `recurring_amount_history` with `effective_from = M`.
4. All already-generated transactions for months < M are **untouched**.
5. Next time month M (or later) is opened, step 3 above picks up the new history row.

---

## 12. Installment Plan Logic

When a user opens a month, the client runs this logic for `installment_plans`:

1. Fetch all active plans where `start_date <= month` AND `paid_installments < total_installments`.
2. For each plan, check if a `transactions` row already exists for that month with `installment_plan_id = plan.id`.
3. If not → determine the amount for this month:
   ```
   SELECT monthly_amount FROM installment_amount_history
   WHERE plan_id = :id AND effective_from <= :month
   ORDER BY effective_from DESC LIMIT 1
   ```
   Fall back to `installment_plans.monthly_amount` if no history row.
4. If `cc_carry_forward = true`, add `carry_forward_amount` to this month's transaction amount.
5. Auto-insert the transaction (`source = 'installment'`, `installment_plan_id = plan.id`).
6. Increment `paid_installments`. If `paid_installments = total_installments`, set `is_active = false`.
7. Reset `carry_forward_amount = 0` after it has been folded into the new transaction.

**CC carry-forward flow:**

- If a user marks a CC installment as partially paid this month (e.g. paid LKR 8,000 of a LKR 10,000 installment), the app updates the transaction amount to 8,000 and sets `carry_forward_amount = 2,000` on the plan.
- Next month's auto-generated transaction will be `monthly_amount + 2,000`.
- `paid_installments` is only incremented when the **full** monthly amount (excluding carry-forward) has been covered.

**Amount change flow (forward-only):** Same pattern as recurring templates — insert into `installment_amount_history`, never touch past transactions.

---

## 13. Bank Account & Salary Allocation Flow

This is the monthly workflow for distributing salary:

1. User sets total income in **Budgets** for the month (`budgets.income`).
2. User goes to **Salary Allocations** and assigns how much goes to each account:
   - e.g. LKR 50,000 → Combank Savings, LKR 30,000 → Sampath, LKR 20,000 → HNB
3. Dashboard shows:
   - **Total Income**: from `budgets.income`
   - **Total Allocated**: SUM of `salary_allocations.amount` for this month
   - **Unallocated**: income − allocated (should ideally reach zero)
4. Each transaction is tagged with a `bank_account_id` — so per-account spending is trackable.
5. Per-account summary = `salary_allocations.amount` − SUM(`transactions.amount WHERE bank_account_id = X AND month = M`).

**No inter-account transfers are tracked** — only salary-in and expense-out per account.

---

## 14. TanStack Router — File-Based Route Structure

```
src/routes/
├── __root.tsx           # Root layout (Toaster, QueryClientProvider, RouterDevtools)
├── index.tsx            # Redirects to /dashboard
├── _auth/
│   ├── route.tsx        # Redirects to /dashboard if logged in
│   ├── login.tsx
│   └── sign-up.tsx
└── _app/
    ├── route.tsx         # Sidebar + nav shell; beforeLoad auth guard
    ├── dashboard.tsx
    ├── income.tsx
    ├── accounts.tsx      # Bank accounts + salary allocations (new)
    ├── recurring.tsx
    ├── installments.tsx
    ├── categories.tsx
    └── settings.tsx
```

---

## 15. TanStack Query — Key Query/Mutation Keys

```ts
// src/lib/query-keys.ts
export const queryKeys = {
  transactions: (userId: string, month: string) => ['transactions', userId, month],
  budget: (userId: string, month: string) => ['budget', userId, month],
  categories: (userId: string) => ['categories', userId],
  recurring: (userId: string) => ['recurring', userId],
  recurringAmountHistory: (templateId: string) => ['recurring-amount-history', templateId],
  installments: (userId: string) => ['installments', userId],
  installmentAmountHistory: (planId: string) => ['installment-amount-history', planId],
  bankAccounts: (userId: string) => ['bank-accounts', userId],
  salaryAllocations: (userId: string, month: string) => ['salary-allocations', userId, month],
  profile: (userId: string) => ['profile', userId],
  userSettings: (userId: string) => ['user-settings', userId],
}
```

---

## 16. Application Pages & Features

### 16.1 Auth (`_auth/`)

- `/login` — Email + password
- `/sign-up` — Register (DB trigger seeds profile, settings, default categories)

### 16.2 Dashboard (`_app/dashboard`)

- Month selector (Zustand `use-ui-store.selectedMonth`)
- **Summary cards**: Total Income | Total Expenses | Net Saving
- **Allocation summary**: Total Allocated | Unallocated | per-account balance (allocated − spent)
- **Category breakdown chart**: Recharts donut
- **Transaction table**: grouped by category; edit/delete per row; quick-add slide-over

### 16.3 Income (`_app/income`)

- Set/edit monthly income for selected month
- Income history table

### 16.4 Accounts (`_app/accounts`) _(new)_

- **Bank accounts list**: add / edit / deactivate accounts (name, type, colour)
- **Salary allocations panel**: for the selected month, set how much goes to each account
- Shows: Allocated so far | Remaining to allocate | Per-account: allocated vs. spent vs. balance

### 16.5 Recurring (`_app/recurring`)

- List all recurring templates
- Add / edit / deactivate
- **Amount change**: editing amount prompts "Apply from which month?" — inserts history row, never touches past transactions
- Status badge: Active | Ending Soon | Ended

### 16.6 Installments (`_app/installments`)

- List all plans with progress bar (e.g. 3 / 12 paid)
- Add / edit / deactivate
- CC carry-forward toggle
- **Amount change**: same forward-only flow as recurring
- Shows carry-forward amount if any

### 16.7 Categories (`_app/categories`)

- List (preloaded + user-added)
- Add / edit; soft-disable if transactions reference it

### 16.8 Settings (`_app/settings`)

- Display name, password, currency, theme, notifications toggle

---

## 17. UI / UX

- **Responsive**: mobile-first; sidebar → bottom tab bar on small screens (shadcn Sheet).
- **Theme**: shadcn new-york, Slate base, OKLCH, dark mode supported.
- **Sonner** for toast notifications.
- **Forms**: shadcn Form + React Hook Form + Zod. Use `z.infer<typeof schema>` (not `z.output`) as the form generic.
- **Empty states**: friendly prompts when no data exists for a month.

---

## 18. Folder Structure

```
budget-tracker/
├── public/
├── src/
│   ├── components/
│   │   ├── ui/                        # shadcn generated (leave as-is)
│   │   ├── layout/
│   │   │   ├── app-sidebar.tsx
│   │   │   ├── top-bar.tsx
│   │   │   ├── mobile-nav.tsx
│   │   │   └── month-selector.tsx
│   │   └── charts/
│   │       ├── expense-donut.tsx
│   │       └── summary-bar.tsx
│   ├── routes/
│   │   ├── __root.tsx
│   │   ├── index.tsx
│   │   ├── _auth/
│   │   │   ├── route.tsx
│   │   │   ├── login.tsx
│   │   │   └── sign-up.tsx
│   │   └── _app/
│   │       ├── route.tsx
│   │       ├── dashboard.tsx
│   │       ├── income.tsx
│   │       ├── accounts.tsx
│   │       ├── recurring.tsx
│   │       ├── installments.tsx
│   │       ├── categories.tsx
│   │       └── settings.tsx
│   ├── stores/
│   │   ├── use-auth-store.ts
│   │   └── use-ui-store.ts
│   ├── hooks/
│   │   ├── use-transactions.ts
│   │   ├── use-budget.ts
│   │   ├── use-categories.ts
│   │   ├── use-recurring.ts
│   │   ├── use-installments.ts
│   │   ├── use-bank-accounts.ts
│   │   └── use-salary-allocations.ts
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── query-keys.ts
│   ├── utils/
│   │   ├── recurring.ts       # auto-populate + amount history lookup
│   │   └── installments.ts    # auto-populate + carry-forward logic
│   ├── types/
│   │   └── database.types.ts  # Supabase CLI generated (DO NOT EDIT)
│   ├── routeTree.gen.ts       # TanStack Router generated (DO NOT EDIT)
│   ├── main.tsx
│   └── index.css
├── docs/
│   ├── system-design.md
│   └── supabase-schema.sql
├── .env
├── .env.example
├── .prettierrc
├── .prettierignore
├── .editorconfig
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
└── package.json
```

---

## 19. Deployment

1. **Supabase** — Create project, run `docs/supabase-schema.sql` in SQL Editor. RLS and trigger fully configured by the script.
2. **GitHub** — Push (`.env` in `.gitignore`).
3. **Cloudflare Pages** — Connect repo, build: `pnpm build`, output: `dist`, add Supabase env vars.
4. Every push to `main` auto-deploys.

---

## 20. Implementation Phases

| Phase        | Scope                                                                         | Status      |
| ------------ | ----------------------------------------------------------------------------- | ----------- |
| **Phase 1**  | Supabase schema SQL, RLS, seed trigger                                        | ✅ Done     |
| **Phase 2**  | Project scaffold: Vite + TS + Tailwind v4 + shadcn + Router + Query + Zustand | ✅ Done     |
| **Phase 3**  | Auth flow: login, sign-up, Zustand auth store, beforeLoad guard               | ✅ Done     |
| **Phase 4**  | Bank accounts + salary allocations (new)                                      | Pending     |
| **Phase 5**  | Dashboard: transaction CRUD, monthly summary, allocation summary              | In progress |
| **Phase 6**  | Income page                                                                   | Pending     |
| **Phase 7**  | Recurring templates + amount history + auto-populate                          | In progress |
| **Phase 8**  | Installment plans + CC carry-forward + amount history                         | In progress |
| **Phase 9**  | Categories management                                                         | Pending     |
| **Phase 10** | Charts (Recharts donut + summary bar)                                         | Pending     |
| **Phase 11** | Settings page                                                                 | Pending     |
| **Phase 12** | Dark mode, responsive polish                                                  | Pending     |

---

## 21. Security Notes

- RLS on ALL tables — DB-level isolation, not app-level.
- `recurring_amount_history` and `installment_amount_history` have **no update/delete RLS policies** — making them append-only audit logs.
- Supabase anon key safe to expose in Vite env (RLS enforces access).
- Passwords via Supabase Auth (bcrypt).
- `routeTree.gen.ts` → add to `.eslintignore`.

---

## 22. Known Gotchas

- **Zod + React Hook Form**: type the form as `useForm<z.infer<typeof schema>>`, not `z.output`. `zodResolver` uses `z.infer` internally.
- **Recurring auto-populate**: always check for an existing transaction with `template_id = X AND date_trunc('month', date) = :month` before inserting — prevents double-inserts if the user navigates away and back.
- **Installment carry-forward**: `carry_forward_amount` must be reset to `0` on the plan **after** it has been folded into the new transaction, in the same mutation batch — not separately — to avoid double-carry on page refresh.
- **`effective_from` lookup**: always query `recurring_amount_history` with `effective_from <= :month ORDER BY effective_from DESC LIMIT 1`. Do not assume the latest row in the table is the correct one.
- **`salary_allocations` totals**: the dashboard unallocated figure is computed client-side as `budgets.income - SUM(salary_allocations.amount)`. If no `budgets` row exists for the month yet, treat income as 0 rather than null to avoid NaN in the UI.

---

_Document version: 4.0 — bank_accounts, salary_allocations, forward-only amount history (recurring + installments), CC carry-forward, accounts page, updated logic sections, gotchas_
