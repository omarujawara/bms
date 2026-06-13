# Business Context Summary

## What the business does

A building materials company that:
- Buys materials from suppliers and stocks them in inventory
- Sells materials directly to walk-in and returning customers
- Takes pre-paid customer orders (deposits) for items to be fulfilled later
- Rents out equipment/scaffolding to customers by day or week
- Assembles composite products from component materials
- Employs a small staff (owner + sales reps) compensated partly by commission on gross profit

---

## Roles

| Role | Access |
|---|---|
| `owner` | Full access: all sales, costs, expenses, payroll, purchasing, reports |
| `sales_rep` | Can record sales, returns, orders, rentals. Cannot see unit costs, purchase prices, expenses, or payroll |

Cost and profit data must never reach the `sales_rep`'s client. This is enforced at three layers:
1. `consume_fifo()` runs server-side only — reps never send or receive cost data
2. RLS restricts `payroll_*`, `expenses`, `purchase_payments` to owner only
3. Rep-facing views omit cost columns (`unit_cost_fifo`, `unit_cost`, etc.)

---

## Inventory and FIFO costing

### Dual units
Every item has three units: `purchase_unit`, `base_unit`, and `sale_unit`. The `purchase_to_base_factor` converts purchased quantities to base units when a batch is received. All internal inventory accounting (batches, stock levels, FIFO consumption) uses **base units**. The sale unit is for display only.

Example: rebar bought by the tonne, stored in kg, sold by the rod.

### FIFO batches
Every purchase receipt creates an `inventory_batch` with a `unit_cost` and `quantity_remaining`. When stock is consumed (sale, assembly, adjustment), `consume_fifo()` is called server-side. It:
1. Locks the oldest batches with `quantity_remaining > 0` (ordered by `received_at, created_at, id`)
2. Decrements `quantity_remaining` on each until the full quantity is consumed
3. Returns `(batch_id, quantity, unit_cost)` per batch consumed

The caller inserts these rows into the matching `*_allocations` table and records the weighted-average cost on the parent row (`unit_cost_fifo`).

### Stock additions vs removals
- **Additions** (found stock, positive corrections): create a new `inventory_batch` with `purchase_order_id = NULL`
- **Removals** (damage, internal use, theft, negative corrections): use `stock_adjustments` + `consume_fifo()`

### Insufficient stock
`consume_fifo()` does **not** raise an error when stock is insufficient — it consumes everything available and returns less than requested. The caller detects the shortfall (`SUM(quantity) < requested`) and should warn the user rather than blocking the operation.

---

## Sales

A `sales_transaction` contains one or more `sale_items`. Each sale item:
- Records `quantity`, `unit_price` (what the customer pays), and `unit_cost_fifo` (FIFO weighted average cost — owner-only)
- Has `sale_item_batch_allocations` recording exactly which batches were consumed and how much from each

Payments are recorded separately in `sale_payments` and can be split across methods (cash, transfer, other). A transaction may be partially or fully unpaid.

### Same-day edits
Sales transactions and sale items can be edited on the day they were created. The `updated_by` / `updated_at` audit trail is required for this.

---

## Returns

A `sale_return` references the `original_transaction_id`. Each `sale_return_item` references a specific `sale_item` from that transaction. The database enforces:
- The return item must belong to the original transaction (trigger)
- Cumulative returns cannot exceed the quantity originally sold (trigger)

On return, `restore_fifo()` restores stock to the exact batches that were consumed, starting from the newest batch consumed (LIFO restoration order, which is correct for FIFO cost layer integrity).

---

## Customer orders

A customer order captures a commitment: the customer wants specific items at agreed prices and pays a deposit. Key mechanics:
- `customer_order_items.quantity_fulfilled` is maintained automatically by a trigger on `customer_order_fulfillment_items`
- Fulfillment creates a normal `sales_transaction` (linked via `customer_order_fulfillments`)
- Deposits are tracked separately; refunds (cancelled orders, overpayment) go in `customer_order_refunds`
- Status progresses: `pending` → `partially_fulfilled` → `fulfilled` | `cancelled`

---

## Rentals

Rental items are equipment (not inventory items). Availability is **derived**: an item is available when it has no rental with `status = 'active'`. A partial unique index enforces this at the database level.

`overdue` is not a status — it is derived at query time: `status = 'active' AND expected_return_date < CURRENT_DATE`.

Rate is snapshotted at rental creation (`rate_snapshot`) so rate changes don't affect existing rentals.

---

## Assembly

An `assembly_order` consumes component items (via FIFO) and produces a finished `output_item`. The finished item gets a new `inventory_batch` at the computed cost. Assembly components use `assembly_component_allocations` to record which batches were consumed, same pattern as sales.

---

## Payroll

Sales reps earn a percentage of gross profit within a pay period. The percentage is agreed per period. `payroll_adjustments` handle deductions (e.g. a rep's commission is clawed back when a sale they made is returned). Payroll periods for a single staff member cannot overlap (enforced by a `btree_gist` EXCLUDE constraint).

---

## Auth

Supabase Auth (GoTrue) handles passwords. `staff.id` must equal `auth.users.id`. PINs are an app-layer convenience for quick re-authentication on a shared device — always stored hashed, with an expiry after which a full password login is required.

The owner creates staff accounts via the Supabase Admin API (using the service role client in `lib/supabase/admin.ts`). Staff cannot self-register.

---

## Key database rules

| Rule | Enforcement |
|---|---|
| Over-return prevention | Trigger on `sale_return_items` |
| Return line must belong to original transaction | Trigger on `sale_return_items` |
| Fulfillment auto-increments `quantity_fulfilled` | Trigger on `customer_order_fulfillment_items` |
| Allocation batch must match sale line item | Trigger on `sale_item_batch_allocations` |
| One active rental per item | Partial unique index |
| Non-overlapping payroll periods per staff | EXCLUDE constraint (btree_gist) |
| Categories can only be type 'item' on inventory tables | Composite FK to `categories(id, type)` |
| `quantity_remaining` never goes negative or above `quantity_received` | CHECK constraint |
| Returned rentals must have `actual_return_date`; active ones must not | CHECK constraint |
