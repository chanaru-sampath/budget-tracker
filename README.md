# Budget Tracker

A modern, full-stack Budget Tracker application built with React, Vite, and TypeScript.

## Features

- **Dashboard:** Visualize your expenses and income with Recharts.
- **Transactions:** Add, edit, and delete transactions.
- **Routing:** Type-safe routing using TanStack Router.
- **State Management:** Local state management with Zustand.
- **Data Fetching:** Efficient server state management with TanStack Query.
- **Forms & Validation:** Robust forms handled by React Hook Form and Zod.
- **Styling:** Beautiful UI components with Tailwind CSS, Radix UI, and class-variance-authority.
- **Backend:** Powered by Supabase for database and authentication.

## Tech Stack

- **Frontend:** React 19, Vite, TypeScript
- **Styling:** Tailwind CSS v4, Radix UI, Lucide React
- **Routing & State:** TanStack Router, TanStack Query, Zustand
- **Forms:** React Hook Form, Zod
- **Backend:** Supabase

## Getting Started

### Prerequisites

- Node.js >= 22
- pnpm >= 11

### Installation

1. Clone the repository and navigate to the project directory.
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Set up environment variables:
   Copy `.env.example` to `.env` and fill in your Supabase project details.
   ```bash
   cp .env.example .env
   ```

### Development

Start the development server:

```bash
pnpm run dev
```

The app will be available at `http://localhost:5173`.

### Scripts

- `pnpm run dev`: Starts the development server
- `pnpm run build`: Compiles TypeScript and builds for production
- `pnpm run lint`: Runs ESLint
- `pnpm run format`: Formats code using Prettier
- `pnpm run preview`: Previews the production build locally
