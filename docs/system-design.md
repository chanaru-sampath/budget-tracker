# Budget Tracker — System Design Document

_v3.0 — Synced with implemented schema_

## 1. Overview

A personal household budget tracker web app to replace manual Excel tracking.
Each family member logs in independently, manages their own monthly income and
expenses, tracks recurring payments, and views a summary of income vs. expenses
with category breakdowns.

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

\`\`\`bash

# 1. Scaffold project

pnpm create vite@latest budget-tracker -- --template react-ts
cd budget-tracker

# 2. Tailwind v4 (Vite plugin — no tailwind.config.js needed)

pnpm add tailwindcss @tailwindcss/vite

# 3. shadcn/ui (handles Radix, clsx, tailwind-merge internally)

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

# 9. React Hook Form + Zod (for forms)

pnpm add react-hook-form @hookform/resolvers zod

# 10. Dev tools

pnpm add -D @types/node prettier prettier-plugin-tailwindcss
\`\`\`

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
| Supabase types file         | Lib convention             | `database.types.ts`                     |
| CSS / config files          | As required by tool        | `vite.config.ts`, `.prettierrc`         |

**Rule of thumb**: if _you_ create it -> kebab-case. If a _library generates it_ -> leave it as-is.

## 6. Prettier Config (`.prettierrc`)

\`\`\`json
{
"semi": false,
"singleQuote": true,
"tabWidth": 2,
"trailingComma": "all",
"printWidth": 100,
"plugins": ["prettier-plugin-tailwindcss"]
}
\`\`\`

Add to `.prettierignore`:
\`\`\`
routeTree.gen.ts
dist/
node_modules/
\`\`\`

## 7. vite.config.ts

\`\`\`ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import path from 'path'

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
\`\`\`

---

## 8. Users & Auth

- Each person (e.g. Isuru, Sudu, Amma) has their own account via email + password.
- Supabase Auth handles login/logout/session via `@supabase/ssr`.
- Auth session is stored in a **Zustand store** (`useAuthStore`) — no React Context needed.
- Row Level Security (RLS) on all tables ensures each user only ever reads/writes their own rows.
- Password reset via Supabase built-in email flow.

---

## 9. State Management Strategy

| State type                                            | Tool                     | Reason                                                 |
| ----------------------------------------------------- | ------------------------ | ------------------------------------------------------ |
| Auth session / current user                           | Zustand (`useAuthStore`) | Global, persistent, no re-renders on unrelated changes |
| Selected month                                        | Zustand (`useUIStore`)   | Global UI state shared across pages                    |
| Server data (transactions, categories, budgets, etc.) | TanStack Query           | Caching, deduplication, background refetch             |
| Form state                                            | React Hook Form          | Contained within forms, validated via Zod              |

Zustand stores are kept **slim** — only truly global UI/auth state. All server
data goes through TanStack Query with Supabase query functions as fetchers.

---

## 10. Database Schema (PostgreSQL / Supabase)

> Full SQL source: [`docs/supabase-schema.sql`](./supabase-schema.sql)

### 10.1 `profiles`

Extends Supabase's built-in `auth.users`. Auto-created on signup via DB trigger.

| Column       | Type          | Notes                       |
| ------------ | ------------- | --------------------------- |
| `id`         | `uuid` PK     | References `auth.users(id)` |
| `full_name`  | `text`        | Nullable                    |
| `currency`   | `text`        | Default `'LKR'`             |
| `created_at` | `timestamptz` |                             |

---

### 10.2 `categories`

Expense/income categories per user. Seeded with defaults on signup.

| Column       | Type          | Notes                                   |
| ------------ | ------------- | --------------------------------------- |
| `id`         | `uuid` PK     |                                         |
| `user_id`    | `uuid` FK     | -> `auth.users`                         |
| `name`       | `text`        |                                         |
| `type`       | `text`        | `CHECK (type IN ('income', 'expense'))` |
| `color`      | `text`        | Hex color for UI display                |
| `is_default` | `boolean`     | `DEFAULT false`                         |
| `created_at` | `timestamptz` |                                         |

**Default expense categories** (seeded on signup):
Highway, EPF/ETF, Insurance, Electricity, Internet, Telephone, Mobiles, TV, Savings, General, Trip, Home, Other

**Default income category**: Salary

---

### 10.3 `transactions`

Individual income/expense entries.

| Column        | Type            | Notes                                   |
| ------------- | --------------- | --------------------------------------- |
| `id`          | `uuid` PK       |                                         |
| `user_id`     | `uuid` FK       | -> `auth.users`                         |
| `category_id` | `uuid` FK       | -> `categories` (`ON DELETE SET NULL`)  |
| `amount`      | `numeric(12,2)` |                                         |
| `type`        | `text`          | `CHECK (type IN ('income', 'expense'))` |
| `date`        | `date`          |                                         |
| `notes`       | `text`          | Nullable                                |
| `created_at`  | `timestamptz`   |                                         |

---

### 10.4 `budgets`

Monthly income declaration per user per month.

| Column       | Type            | Notes                                  |
| ------------ | --------------- | -------------------------------------- |
| `id`         | `uuid` PK       |                                        |
| `user_id`    | `uuid` FK       | -> `auth.users`                        |
| `month`      | `date`          | Always 1st of month, e.g. `2026-08-01` |
| `income`     | `numeric(12,2)` |                                        |
| `notes`      | `text`          | Nullable                               |
| `created_at` | `timestamptz`   |                                        |

**Constraint**: `UNIQUE (user_id, month)`

---

### 10.5 `recurring_templates`

Master list of open-ended recurring expenses. Auto-generates `transactions` rows each month client-side.

| Column        | Type            | Notes                                  |
| ------------- | --------------- | -------------------------------------- |
| `id`          | `uuid` PK       |                                        |
| `user_id`     | `uuid` FK       | -> `auth.users`                        |
| `category_id` | `uuid` FK       | -> `categories` (`ON DELETE SET NULL`) |
| `label`       | `text`          | e.g. `"Netflix"`, `"Internet Bill"`    |
| `amount`      | `numeric(12,2)` |                                        |
| `paid_via`    | `text`          | e.g. `"HNB Account"` — nullable        |
| `start_date`  | `date`          | First month this applies               |
| `end_date`    | `date`          | `NULL` = indefinite                    |
| `is_active`   | `boolean`       | `DEFAULT true`                         |
| `created_at`  | `timestamptz`   |                                        |

---

### 10.6 `installment_plans`

Credit card / loan installments with a fixed number of payments. Each month, one
transaction is auto-generated client-side until `total_installments` payments have been made.

| Column               | Type            | Notes                                  |
| -------------------- | --------------- | -------------------------------------- |
| `id`                 | `uuid` PK       |                                        |
| `user_id`            | `uuid` FK       | -> `auth.users`                        |
| `category_id`        | `uuid` FK       | -> `categories` (`ON DELETE SET NULL`) |
| `label`              | `text`          | e.g. `"MacBook Pro - HNB CC"`          |
| `total_amount`       | `numeric(12,2)` | Original purchase price                |
| `monthly_amount`     | `numeric(12,2)` | Amount per installment                 |
| `total_installments` | `int`           | e.g. `12`                              |
| `paid_installments`  | `int`           | `DEFAULT 0`, incremented each month    |
| `start_date`         | `date`          | Date of first payment                  |
| `paid_via`           | `text`          | e.g. `"HNB Credit Card"` — nullable    |
| `notes`              | `text`          | Nullable                               |
| `is_active`          | `boolean`       | `DEFAULT true`                         |
| `created_at`         | `timestamptz`   |                                        |

---

### 10.7 `user_settings`

Per-user app preferences.

| Column                  | Type          | Notes                       |
| ----------------------- | ------------- | --------------------------- |
| `user_id`               | `uuid` PK     | References `auth.users(id)` |
| `currency`              | `text`        | `DEFAULT 'LKR'`             |
| `theme`                 | `text`        | `DEFAULT 'light'`           |
| `notifications_enabled` | `boolean`     | `DEFAULT true`              |
| `updated_at`            | `timestamptz` |                             |

---

### 10.8 Row Level Security (RLS)

RLS is enabled on **all** tables. Policies are scoped to `auth.uid() = user_id`
(or `auth.uid() = id` for `profiles`). `user_settings` has no DELETE policy — that row is permanent.

| Table                 | Policies                       |
| --------------------- | ------------------------------ |
| `profiles`            | SELECT, UPDATE                 |
| `categories`          | SELECT, INSERT, UPDATE, DELETE |
| `transactions`        | SELECT, INSERT, UPDATE, DELETE |
| `budgets`             | SELECT, INSERT, UPDATE, DELETE |
| `recurring_templates` | SELECT, INSERT, UPDATE, DELETE |
| `installment_plans`   | SELECT, INSERT, UPDATE, DELETE |
| `user_settings`       | SELECT, INSERT, UPDATE         |

---

### 10.9 Signup Trigger

A `SECURITY DEFINER` function `handle_new_user()` fires `AFTER INSERT ON auth.users` and:

1. Creates a row in `profiles` (populates `full_name` from `raw_user_meta_data`)
2. Creates a row in `user_settings` with defaults
3. Seeds all 13 default expense categories + 1 income category into `categories`

---

## 11. Recurring Expense Logic

- When a user opens a month, the app checks `recurring_templates` for all active
  templates where `start_date <= month` and (`end_date IS NULL OR end_date >= month`).
- Any template not yet represented in `transactions` for that month gets auto-inserted
  via a TanStack Query mutation on month load.
- Runs client-side — no cron job or edge function needed.
- The user can edit or delete the auto-inserted row for that month without affecting
  the template or other months.

---

## 12. Installment Plan Logic

- `installment_plans` tracks purchases split into a fixed number of monthly payments.
- Each month the app checks active plans where `start_date <= month` and
  `paid_installments < total_installments`.
- A transaction for `monthly_amount` is auto-generated client-side for each qualifying plan.
- `paid_installments` is incremented on each auto-generated payment.
- When `paid_installments === total_installments` the plan's `is_active` flag is set to `false`.

---

## 13. TanStack Router — File-Based Route Structure

\`\`\`
src/routes/
├── __root.tsx # Root layout (Toaster, QueryClientProvider, RouterDevtools)
├── index.tsx # Redirects to /dashboard
├── _auth/ # Layout route — unauthenticated only
│ ├── route.tsx # Redirects to /dashboard if already logged in
│ ├── login.tsx
│ └── sign-up.tsx
└── _app/ # Layout route — authenticated only
├── route.tsx # Sidebar + top nav shell; redirects to /login if no session
├── dashboard.tsx
├── income.tsx
├── recurring.tsx
├── installments.tsx
├── categories.tsx
└── settings.tsx
\`\`\`

Auth guard lives in `_app/route.tsx` using TanStack Router's `beforeLoad` — no separate HOC needed.

---

## 14. TanStack Query — Key Query/Mutation Keys

\`\`\`ts
// Query keys (centralised in src/lib/query-keys.ts)
export const queryKeys = {
transactions: (userId: string, month: string) => ['transactions', userId, month],
budget: (userId: string, month: string) => ['budget', userId, month],
categories: (userId: string) => ['categories', userId],
recurring: (userId: string) => ['recurring', userId],
installments: (userId: string) => ['installments', userId],
profile: (userId: string) => ['profile', userId],
userSettings: (userId: string) => ['user-settings', userId],
}
\`\`\`

---

## 15. Application Pages & Features

### 15.1 Auth Pages (`_auth/`)

- `/login` — Email + password sign in
- `/signup` — Register new account (+ seeds default categories via Supabase DB trigger)

### 15.2 Dashboard (`_app/dashboard`)

- Month selector (Zustand `useUIStore.selectedMonth`, default: current month)
- **Summary cards**: Total Income | Total Expenses | Net Saving (colour-coded)
- **Category breakdown**: Donut/bar chart (Recharts) showing spend by category
- **Transaction table**: All transactions for selected month, grouped by category, edit/delete per row
- **Quick-add** button — shadcn Sheet (slide-over) with transaction form

### 15.3 Income Page (`_app/income`)

- Set/edit monthly income for the selected month
- Income history table across past months

### 15.4 Recurring Expenses (`_app/recurring`)

- List all recurring templates
- Add / edit / deactivate templates
- Status badge: Active | Ending Soon (< 2 months) | Ended

### 15.5 Installments (`_app/installments`)

- List all installment plans with progress (e.g. 3/12 paid)
- Add / edit / deactivate plans
- Progress bar showing paid vs. remaining installments
- Auto-generates a monthly transaction each period until complete

### 15.6 Categories (`_app/categories`)

- List all categories (preloaded + user-added)
- Add new (name, type, colour picker)
- Edit name/colour; cannot delete if transactions reference it — soft-disable instead

### 15.7 Settings (`_app/settings`)

- Change display name
- Change password (Supabase updateUser)
- Currency display (default LKR)
- Theme preference (light/dark)
- Notification toggle

---

## 16. UI / UX

- **Responsive**: mobile-first card layout; sidebar collapses to bottom tab bar on small screens using shadcn Sheet.
- **Theme**: shadcn new-york style, Slate base, OKLCH color variables, supports dark mode.
- **Sonner**: replaces shadcn Toast (deprecated in Tailwind v4 era) for all notifications.
- **Forms**: shadcn Form + React Hook Form + Zod. Use `z.infer<typeof schema>` (not `z.output`) as the form generic — `zodResolver` uses `z.infer` internally.
- **Empty states**: friendly illustrated prompts when no data for a month.

---

## 17. Folder Structure

All folders and files use **kebab-case** except library-generated files and standard config files.

\`\`\`
budget-tracker/
├── public/
├── src/
│ ├── components/
│ │ ├── ui/ # shadcn generated (lib convention, leave as-is)
│ │ ├── layout/
│ │ │ ├── app-sidebar.tsx
│ │ │ ├── top-bar.tsx
│ │ │ ├── mobile-nav.tsx
│ │ │ └── month-selector.tsx
│ │ └── charts/
│ │ ├── expense-donut.tsx
│ │ └── summary-bar.tsx
│ ├── routes/
│ │ ├── __root.tsx
│ │ ├── index.tsx
│ │ ├── _auth/
│ │ │ ├── route.tsx
│ │ │ ├── login.tsx
│ │ │ └── sign-up.tsx
│ │ └── _app/
│ │ ├── route.tsx
│ │ ├── dashboard.tsx
│ │ ├── income.tsx
│ │ ├── recurring.tsx
│ │ ├── installments.tsx
│ │ ├── categories.tsx
│ │ └── settings.tsx
│ ├── stores/
│ │ ├── use-auth-store.ts
│ │ └── use-ui-store.ts
│ ├── hooks/
│ │ ├── use-transactions.ts
│ │ ├── use-budget.ts
│ │ ├── use-categories.ts
│ │ ├── use-recurring.ts
│ │ └── use-installments.ts
│ ├── lib/
│ │ ├── supabase.ts
│ │ └── query-keys.ts
│ ├── utils/
│ │ └── recurring.ts
│ ├── types/
│ │ └── database.types.ts # Generated by Supabase CLI (DO NOT EDIT)
│ ├── routeTree.gen.ts # Generated by TanStack Router (DO NOT EDIT)
│ ├── main.tsx
│ └── index.css
├── docs/
│ ├── system-design.md
│ └── supabase-schema.sql
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
\`\`\`

---

## 18. Deployment

1. **Supabase** — Create project, run `docs/supabase-schema.sql` in SQL Editor. RLS and email auth are fully configured by the script.
2. **GitHub** — Push to repo (add `.env` to `.gitignore`).
3. **Cloudflare Pages** — Connect GitHub repo, build command: `npm run build`, output dir: `dist`, add Supabase env vars.
4. Every push to `main` auto-deploys.

---

## 19. Implementation Phases

| Phase        | Scope                                                                                  | Status      |
| ------------ | -------------------------------------------------------------------------------------- | ----------- |
| **Phase 1**  | Supabase: schema SQL, RLS policies, seed trigger                                       | Done        |
| **Phase 2**  | Project scaffold: Vite + TS + Tailwind v4 + shadcn + TanStack Router + Query + Zustand | Done        |
| **Phase 3**  | Auth flow: login, signup, Zustand auth store, route guards via `beforeLoad`            | Done        |
| **Phase 4**  | Dashboard: transaction CRUD, monthly summary, TanStack Query hooks                     | In progress |
| **Phase 5**  | Income page                                                                            | Pending     |
| **Phase 6**  | Recurring templates + auto-populate logic                                              | In progress |
| **Phase 7**  | Installment plans + auto-generate monthly transactions                                 | In progress |
| **Phase 8**  | Categories management                                                                  | Pending     |
| **Phase 9**  | Charts (Recharts donut + summary bar)                                                  | Pending     |
| **Phase 10** | Settings (profile, password, currency, theme, notifications)                           | Pending     |
| **Phase 11** | Dark mode, responsive polish                                                           | Pending     |

---

## 20. Security Notes

- RLS enabled on ALL tables — users can never access another user's rows, enforced at DB level.
- Supabase anon key is safe to expose in the Vite env (only works within RLS boundaries).
- No sensitive logic in the client beyond what Supabase enforces server-side.
- Passwords managed entirely by Supabase Auth (bcrypt, never stored in app DB).
- `routeTree.gen.ts` is read-only (managed by TanStack Router plugin) — add to `.eslintignore` and VSCode readonly settings.

---

## 21. Known Gotchas

- **Zod + React Hook Form**: When using `z.string().optional().default('')`, always type
  `useForm<z.infer<typeof schema>>`, **not** `z.output`. `zodResolver` uses `z.infer` internally;
  using `z.output` causes a TypeScript resolver type mismatch on optional fields with defaults.

---

_Document version: 3.0 — synced with implemented schema (transactions, installment_plans, user_settings); added RLS policy table, trigger details, installments page and logic, known gotchas_
