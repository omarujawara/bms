# Project Structure

## Overview

This project uses Next.js App Router with a feature-based architecture. Code is organised by business domain, not by technical type. Each domain owns its UI, data access, server actions, and types in a single `features/<name>/` folder.

---

## Full tree

```
bms-app/
│
├── app/                                    # Next.js App Router — routes only
│   ├── (auth)/                             # Unauthenticated routes — no app shell, no session required
│   │   ├── layout.tsx                      # Minimal layout (centers auth card)
│   │   ├── login/
│   │   │   └── page.tsx                    # /login
│   │   └── forgot-password/
│   │       └── page.tsx                    # /forgot-password
│   │
│   ├── (app)/                              # Authenticated shell — proxy.ts protects this group
│   │   ├── layout.tsx                      # App shell: sidebar + topnav + user session context
│   │   ├── dashboard/
│   │   │   └── page.tsx                    # /dashboard
│   │   ├── inventory/
│   │   │   └── page.tsx                    # /inventory
│   │   ├── sales/
│   │   │   └── page.tsx                    # /sales
│   │   ├── returns/
│   │   │   └── page.tsx                    # /returns
│   │   ├── orders/
│   │   │   └── page.tsx                    # /orders  (customer orders)
│   │   ├── rentals/
│   │   │   └── page.tsx                    # /rentals
│   │   ├── assembly/
│   │   │   └── page.tsx                    # /assembly
│   │   │
│   │   └── (owner)/                        # Owner-only nested route group
│   │       ├── layout.tsx                  # Checks role; redirects sales_rep → /dashboard
│   │       ├── purchasing/
│   │       │   └── page.tsx                # /purchasing
│   │       ├── expenses/
│   │       │   └── page.tsx                # /expenses
│   │       ├── payroll/
│   │       │   └── page.tsx                # /payroll
│   │       ├── staff/
│   │       │   └── page.tsx                # /staff
│   │       └── reports/
│   │           └── page.tsx                # /reports
│   │
│   ├── api/                                # Route handlers (server-only, not page routes)
│   │   ├── qr/
│   │   │   └── [code]/
│   │   │       └── route.ts               # GET /api/qr/[code] — item lookup by QR code
│   │   └── auth/
│   │       └── callback/
│   │           └── route.ts               # GET /api/auth/callback — Supabase OAuth callback
│   │
│   ├── favicon.ico
│   ├── globals.css                         # Tailwind v4 + shadcn CSS variables
│   └── layout.tsx                          # Root layout — html/body, fonts only
│
├── features/                               # Business domain modules
│   │                                       # Each folder owns: components, hooks, actions, db, types
│   ├── auth/                               # Login, session management, role helpers
│   ├── inventory/                          # Items, batches, units, categories
│   ├── purchasing/                         # Purchase orders, receipts, payments
│   ├── sales/                              # Sales transactions, payments, consume_fifo calls
│   ├── returns/                            # Sale returns, restore_fifo calls, refund payments
│   ├── customer-orders/                    # Orders, deposits, refunds, fulfilments
│   ├── rentals/                            # Rental items, customers, rentals, payments
│   ├── assembly/                           # Assembly orders, FIFO component consumption
│   ├── operations/                         # Stock adjustments, expenses
│   ├── payroll/                            # Payroll periods, adjustments (owner-only)
│   └── staff/                              # Staff CRUD — uses admin client (owner-only)
│
├── components/
│   ├── ui/                                 # shadcn/ui — generated only, never hand-edited
│   ├── layout/                             # App shell components: Sidebar, TopNav, UserMenu
│   └── shared/                             # Reusable non-shadcn UI: DataTable, PageHeader, EmptyState
│
├── hooks/                                  # Shared client-side hooks used by 2+ features
│
├── types/                                  # Shared TypeScript types not owned by any feature
│   └── index.ts                            # e.g. ServerActionResult<T>, PaginatedResult<T>
│
├── lib/
│   └── supabase/                           # Supabase client factories
│       ├── client.ts                       # Browser client — use in 'use client' components
│       ├── server.ts                       # SSR client — use in Server Components, Actions, db/ files
│       ├── admin.ts                        # Service role client — server-only, bypasses RLS
│       └── database.types.ts               # Auto-generated — never edit by hand
│
├── utils/                                  # Global pure utility functions (formatCurrency, formatDate, etc.)
│
├── supabase/                               # Supabase CLI
│   ├── migrations/                         # SQL migration files — tracked in git
│   ├── seed.sql                            # Dev seed data
│   └── config.toml
│
├── docs/                                   # Project documentation
│   ├── project-structure.md               # This file
│   └── schema/
│       ├── schema-reference.md            # Full table/column reference by domain
│       ├── context-summary.md             # Business rules and domain logic
│       └── schema.sql                     # Canonical SQL migration
│
├── proxy.ts                                # Next.js session middleware — refreshes Supabase session
├── components.json                         # shadcn/ui config
├── package.json
├── tsconfig.json
└── CLAUDE.md                               # Codebase guidance for Claude Code
```

---

## Feature folder contract

Every `features/<name>/` folder follows the same internal structure:

```
features/<name>/
├── components/     UI components scoped to this feature
├── hooks/          Client-side hooks (data fetching, local state)
├── actions/        Next.js Server Actions — orchestrate logic, call db/
├── db/             Raw Supabase queries — server-only, imported only by actions/
└── types.ts        TypeScript types and interfaces for this domain
```

Optional, created only when needed:
```
├── utils/          Business logic utilities specific to this feature
```

**Data flow:**

```
component → action → db/ → Supabase
```

- `db/` is the only layer that calls Supabase directly
- `actions/` orchestrate: validate input, call `db/`, call server-side functions like `consume_fifo()`
- Components import from `actions/` and `hooks/` only — never from `db/` directly

---

## Route access by role

| Route group | Who can access |
|---|---|
| `(auth)/` | Anyone (unauthenticated) |
| `(app)/` | Any authenticated staff member |
| `(app)/(owner)/` | `owner` role only — layout redirects `sales_rep` |

Cost and profit data (`unit_cost_fifo`, `unit_cost`, payroll, expenses, purchase payments) are never sent to `sales_rep` clients. FIFO cost computation happens server-side only.

---

## Key path aliases

| Alias | Resolves to |
|---|---|
| `@/*` | project root |
| `@features/*` | `./features/*` |
| `@utils/*` | `./utils/*` |

---

## Supabase client selection

| File | Use when |
|---|---|
| `lib/supabase/client.ts` | Inside `'use client'` components |
| `lib/supabase/server.ts` | Server Components, Server Actions, Route Handlers, `db/` files |
| `lib/supabase/admin.ts` | Server-only operations requiring service role (staff creation, etc.) |

Never import `admin.ts` anywhere that could be included in the client bundle.
