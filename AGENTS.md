# AI Context & Coding Guidelines

Welcome, AI Agent! This is the context and rules file for the **Budget Tracker** project.
Before making any changes to this repository, please review these rules and the primary documentation.

## Core Documentation
- **Architecture & Schema**: You MUST read `docs/system-design.md` to understand the tech stack, database schema, and core logic (especially for recurring expenses and installment plans).
- **Database**: We use Supabase. Schema definitions are in `schemas/`.
  - `schemas/create-tables.sql` - to create the schema
  - `schemas/drop-tables.sql` - to drop the schema
  - `schemas/clear-data.sql` - to wipe data

## Tech Stack
- Frontend: React 19, Vite, TypeScript
- Styling: Tailwind CSS v4, shadcn/ui (new-york style)
- State Management: 
  - Server state: TanStack Query v5
  - Client state: Zustand v5
  - Forms: React Hook Form + Zod
- Routing: TanStack Router (File-based)
- Backend: Supabase (PostgreSQL + Auth + RLS)

## Coding Conventions
1. **Naming**:
   - Files and folders: `kebab-case` (e.g. `use-auth-store.ts`, `expense-table.tsx`).
   - React components (export): `PascalCase` (e.g. `export function ExpenseTable()`).
2. **State**:
   - Do NOT use React Context for global state. Use Zustand.
   - For data fetching, ALWAYS use TanStack Query.
3. **Database & API**:
   - We use `@supabase/supabase-js`. Do NOT write custom fetch calls to a backend unless required.
   - RLS is strictly enforced at the database level.
4. **Data Mutability**:
   - Transactions are immutable once generated for past months. Editing amount logic (e.g. for recurring templates) is forward-only. Do NOT update past transaction amounts when a template amount changes.

## General AI Agent Rules
- Do NOT generate generic placeholder code unless explicitly asked.
- Always check `docs/system-design.md` if you are unsure about the database schema or the purpose of a column.
- Use `pnpm` for all package management commands.
