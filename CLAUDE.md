# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project

**Building Material Sales (BMS)** — a sales and business management app for a building materials company. Built with Next.js App Router, Supabase (auth + database + RLS), and shadcn/ui.

---

## Commands

```bash
npm run dev       # start dev server (localhost:3000)
npm run build     # production build
npm run start     # serve production build
npm run lint      # ESLint
npm run types:gen # regenerate database.types.ts from Supabase schema
```

Supabase local dev (run from project root):

```bash
npx supabase start                                                              # start local stack (API :54321, DB :54322, Studio :54323)
npx supabase stop                                                               # stop local stack
npx supabase db reset                                                           # reset DB and run migrations + seed.sql
npx supabase migration new <name>                                               # create a new migration file
npx supabase gen types typescript --local > lib/supabase/database.types.ts     # regenerate types from local schema
```

---

## Next.js Version Warning

This project uses **Next.js 16.2.6** with React 19. This version has breaking changes from training data — APIs, conventions, and file structure may differ. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code involving routing, caching, or server actions. Heed deprecation notices.

---

## Architecture

### Directory Structure

```
bms-app/
├── app/
│   ├── (auth)/                     # unauthenticated routes (login, forgot-password)
│   │   ├── layout.tsx
│   │   └── login/
│   ├── (app)/                      # authenticated shell — proxy.ts protects this group
│   │   ├── layout.tsx              # app shell: sidebar, nav, user context
│   │   ├── dashboard/
│   │   ├── inventory/
│   │   ├── sales/
│   │   ├── returns/
│   │   ├── orders/
│   │   ├── rentals/
│   │   ├── assembly/
│   │   └── (owner)/                # owner-only nested group — layout enforces role
│   │       ├── layout.tsx          # redirects sales_rep to /dashboard
│   │       ├── purchasing/
│   │       ├── expenses/
│   │       ├── payroll/
│   │       ├── staff/
│   │       └── reports/
│   ├── api/                        # route handlers (QR lookup, auth callback, etc.)
│   ├── favicon.ico
│   ├── globals.css
│   └── layout.tsx
├── features/                       # one folder per business domain
│   ├── auth/
│   ├── inventory/
│   ├── purchasing/
│   ├── sales/
│   ├── returns/
│   ├── customer-orders/
│   ├── rentals/
│   ├── assembly/
│   ├── operations/
│   ├── payroll/
│   └── staff/
├── components/
│   ├── ui/                         # shadcn/ui components — generated, edit sparingly
│   ├── layout/                     # app shell components (Sidebar, TopNav, etc.)
│   └── shared/                     # reusable non-shadcn components (DataTable, PageHeader, etc.)
├── hooks/                          # shared client-side hooks used by 2+ features
├── types/                          # shared TypeScript types not owned by any feature
├── lib/
│   └── supabase/                   # Supabase client factories (see Supabase Clients below)
│       ├── client.ts
│       ├── server.ts
│       ├── admin.ts
│       └── database.types.ts       # auto-generated — never edit by hand
├── utils/                          # global pure utility functions (formatCurrency, etc.)
├── supabase/                       # Supabase CLI config and migrations
│   └── migrations/
├── docs/                           # schema reference, ADRs, project structure
├── proxy.ts                        # session refresh on every request (auth protection not yet active)
└── .claude/                        # Claude Code config and skills
```

### Feature Structure

Every feature follows this internal structure:

```
features/<name>/
├── components/     # UI components scoped to this feature
├── hooks/          # client-side hooks (data fetching, state)
├── actions/        # Next.js server actions — call db/ functions, never query Supabase directly
├── db/             # raw Supabase queries — server only, imported only by actions/
└── types.ts        # TypeScript types and interfaces for this feature
```

**Data flow:**

```
component → action → db/ → Supabase
```

- `db/` is the only layer that talks to Supabase directly
- `actions/` orchestrate logic and call `db/` functions
- Components never import from `db/` directly

All domain feature folders are pre-created at project init. Add files inside them as features are built.

---

### Utilities

- `utils/` — global utility functions shared across features (add new global utilities here)
- `features/<name>/utils/` — utility functions specific to that feature (create only when needed)
- `lib/utils.ts` — shadcn/ui internal utility (`cn()`) — do not add code here

---

## Supabase

### Row Level Security (RLS)

RLS is **enabled** on all tables. This is critical — it means:

- Every query runs as the authenticated user unless `admin.ts` is explicitly used
- Unauthenticated or misconfigured clients will get empty results, not errors — this is silent and dangerous
- Always verify the correct client is being used for the context (see table below)

### Client Factories

Use the correct client for every context — never mix them:

| File                     | Use when                                                              |
| ------------------------ | --------------------------------------------------------------------- |
| `lib/supabase/client.ts` | Client components (`'use client'`)                                    |
| `lib/supabase/server.ts` | Server components, Server Actions, Route Handlers, `db/` files        |
| `lib/supabase/admin.ts`  | Server-only ops requiring service role (bypasses RLS) — use sparingly |

### Rules

- **Never** import `admin.ts` in client components or anywhere the bundle is exposed to the browser
- **Never** use `admin.ts` as a workaround for RLS issues — fix the RLS policy instead
- **Never** edit `database.types.ts` by hand — run `npm run types:gen` after schema changes
- Always use the `Database` generic type from `database.types.ts` when creating clients

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server-only — never expose to client or commit to git
```

---

## Styling

- **Tailwind CSS v4** with shadcn/ui (`style: base-mira`, `baseColor: neutral`)
- Theme tokens are CSS variables defined in `app/globals.css`
- Add shadcn components via `npx shadcn add <component>` — never manually create files in `components/ui/`
- Icons: `lucide-react`

---

## TypeScript

- Path aliases: `@/*` → project root, `@features/*` → `./features/*`, `@utils/*` → `./utils/*`
- Strict mode is on — no `any` without justification
- All Supabase clients must be typed with the `Database` generic from `lib/supabase/database.types.ts`
