# Schema Reference

29 tables across 10 domains. All tables use `uuid` primary keys with `gen_random_uuid()` default. All timestamps are `timestamptz`.

---

## Enums

| Enum | Values |
|---|---|
| `staff_role` | `owner`, `sales_rep` |
| `category_type` | `item`, `expense` |
| `item_type_enum` | `standard`, `assembled` |
| `purchase_order_status` | `pending_delivery`, `partially_received`, `received`, `cancelled` |
| `payment_method` | `cash`, `transfer`, `other` |
| `customer_order_status` | `pending`, `partially_fulfilled`, `fulfilled`, `cancelled` |
| `rental_rate_type` | `daily`, `weekly` |
| `rental_status` | `active`, `returned` |
| `stock_adjustment_reason` | `internal_use`, `damaged`, `given_away`, `correction`, `missing` |
| `payroll_adjustment_reason` | `sale_return`, `correction`, `other` |

`rental_status` has no `overdue` value — overdue is derived at query time: `status = 'active' AND expected_return_date < CURRENT_DATE`.

---

## Domain 1 — Foundation

### `staff`
Staff accounts. `id` must equal `auth.users.id` on Supabase.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | = auth.users.id |
| `full_name` | text | |
| `role` | staff_role | `owner` or `sales_rep` |
| `email` | text UNIQUE | |
| `pin_hash` | text nullable | hashed PIN for quick re-login |
| `pin_expires_at` | timestamptz nullable | PIN validity window |
| `is_active` | boolean | soft delete |
| `created_at` | timestamptz | |

### `units`
Units of measure used on items (e.g. kg, tonne, rod, box).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | text UNIQUE | |
| `abbreviation` | text | |
| `is_active` | boolean | soft delete |

### `categories`
Categorises both inventory items and expenses. The `(id, type)` unique pair is the target of composite foreign keys that enforce category type at the DB level.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | text | |
| `type` | category_type | `item` or `expense` |
| `is_active` | boolean | soft delete |

Unique constraints: `(name, type)`, `(id, type)`.

---

## Domain 2 — Purchasing

### `purchase_orders`
Header for a supplier purchase. Contains no line items itself.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `order_date` | date | |
| `status` | purchase_order_status | |
| `notes` | text nullable | |
| `created_by` | uuid → staff | |
| `updated_by` | uuid → staff nullable | |
| `created_at` / `updated_at` | timestamptz | `updated_at` maintained by trigger |

### `purchase_order_items`
Line items on a purchase order. Quantities and cost are in **purchase units**.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `purchase_order_id` | uuid → purchase_orders | |
| `item_id` | uuid → items | |
| `quantity_ordered` | numeric > 0 | in purchase units |
| `quantity_received` | numeric ≥ 0 | tracks partial receipts |
| `unit_cost` | numeric ≥ 0 | purchase unit cost |

### `purchase_payments`
Payments made against a purchase order. Owner-only (RLS).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `purchase_order_id` | uuid → purchase_orders | |
| `amount` | numeric > 0 | |
| `payment_date` | date | |
| `payment_method` | payment_method | |
| `notes` | text nullable | |
| `created_by` | uuid → staff | |
| `created_at` | timestamptz | |

---

## Domain 3 — Inventory

### `items`
The central product catalogue. Supports self-referencing parent/child hierarchy.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `parent_item_id` | uuid → items nullable | for variant grouping |
| `name` | text | |
| `brand` | text nullable | |
| `category_id` | uuid | composite FK with category_type |
| `category_type` | category_type | always `'item'` (CHECK enforced) |
| `purchase_unit_id` | uuid → units | |
| `base_unit_id` | uuid → units | internal accounting unit |
| `sale_unit_id` | uuid → units | display unit |
| `purchase_to_base_factor` | numeric > 0 | converts purchased qty to base |
| `item_type` | item_type_enum | `standard` or `assembled` |
| `reorder_level` | numeric ≥ 0 nullable | |
| `qr_code` | text nullable | partial unique index when not null |
| `is_active` | boolean | soft delete |
| `created_by` / `updated_by` | uuid → staff | |
| `created_at` / `updated_at` | timestamptz | `updated_at` by trigger |

Composite FK: `(category_id, category_type) → categories(id, type)` — guarantees item categories cannot point at expense categories.

### `inventory_batches`
One row per purchase receipt (or manual stock addition). This is the FIFO cost ledger.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `item_id` | uuid → items | |
| `purchase_order_id` | uuid → purchase_orders nullable | NULL for manual additions |
| `quantity_received_purchase_units` | numeric > 0 | original purchase qty |
| `quantity_received` | numeric > 0 | converted to base units |
| `quantity_remaining` | numeric | consumed down by FIFO; CHECK: 0 ≤ remaining ≤ received |
| `unit_cost` | numeric ≥ 0 | cost per base unit — owner-only |
| `received_at` | timestamptz | FIFO order key (primary) |
| `created_by` | uuid → staff | |
| `created_at` | timestamptz | FIFO order key (secondary) |

Index: `inventory_batches_fifo_idx ON (item_id, received_at) WHERE quantity_remaining > 0` — the hot path for `consume_fifo()`.

---

## Domain 4 — Sales

### `sales_transactions`
Header for a sale. Can be a walk-in sale or a fulfilment of a customer order.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `transaction_date` | timestamptz | defaults to now() |
| `customer_name` | text nullable | |
| `notes` | text nullable | |
| `created_by` / `updated_by` | uuid → staff | `updated_by` for same-day edits |
| `created_at` / `updated_at` | timestamptz | `updated_at` by trigger |

### `sale_items`
Line items within a transaction. `unit_cost_fifo` is the weighted-average FIFO cost — never sent to the rep's client.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `sales_transaction_id` | uuid → sales_transactions | |
| `item_id` | uuid → items | |
| `quantity` | numeric > 0 | in sale units |
| `unit_price` | numeric ≥ 0 | what the customer pays |
| `unit_cost_fifo` | numeric ≥ 0 | FIFO weighted avg cost — owner-only |
| `notes` | text nullable | |
| `updated_by` / `updated_at` | uuid / timestamptz | audit trail for same-day edits |

### `sale_item_batch_allocations`
Records exactly which batch each sale line consumed stock from. Required for correct `restore_fifo()` on returns.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `sale_item_id` | uuid → sale_items | |
| `batch_id` | uuid → inventory_batches | |
| `quantity` | numeric > 0 | in base units |
| `unit_cost` | numeric ≥ 0 | cost at this batch |
| `created_at` | timestamptz | |

Unique: `(sale_item_id, batch_id)`. Trigger verifies batch item matches sale line item.

### `sale_payments`
Payments collected for a transaction.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `sales_transaction_id` | uuid → sales_transactions | |
| `amount` | numeric > 0 | |
| `payment_date` | date | |
| `payment_method` | payment_method | |
| `notes` | text nullable | |
| `created_by` | uuid → staff | |
| `created_at` | timestamptz | |

---

## Domain 5 — Returns

### `sale_returns`
Return header referencing the original transaction.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `original_transaction_id` | uuid → sales_transactions | |
| `return_date` | date | |
| `reason` | text nullable | |
| `notes` | text nullable | |
| `created_by` | uuid → staff | |
| `created_at` | timestamptz | |

### `sale_return_items`
Individual lines being returned. Trigger enforces: (1) line belongs to original transaction, (2) cumulative returns ≤ quantity sold.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `sale_return_id` | uuid → sale_returns | |
| `sale_item_id` | uuid → sale_items | must belong to original_transaction |
| `quantity_returned` | numeric > 0 | |
| `unit_price_refunded` | numeric ≥ 0 | |
| `unit_cost_fifo` | numeric ≥ 0 | cost to restore — owner-only |

### `sale_return_payments`
Refund payments made to the customer.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `sale_return_id` | uuid → sale_returns | |
| `amount` | numeric > 0 | |
| `payment_date` | date | |
| `payment_method` | payment_method | |
| `notes` | text nullable | |
| `created_by` | uuid → staff | |
| `created_at` | timestamptz | |

---

## Domain 6 — Customer Orders

### `customer_orders`
A pre-order with a deposit. Status is manually advanced (future: could be auto-derived).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `order_date` | date | |
| `customer_name` | text nullable | |
| `status` | customer_order_status | |
| `notes` | text nullable | |
| `created_by` / `updated_by` | uuid → staff | |
| `created_at` / `updated_at` | timestamptz | `updated_at` by trigger |

### `customer_order_items`
Line items committed on the order.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `customer_order_id` | uuid → customer_orders | |
| `item_id` | uuid → items | |
| `quantity` | numeric > 0 | |
| `quantity_fulfilled` | numeric ≥ 0 | auto-maintained by trigger |
| `agreed_unit_price` | numeric ≥ 0 | price locked at order time |

CHECK: `0 ≤ quantity_fulfilled ≤ quantity`.

### `customer_order_deposits`
Deposits paid toward the order.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `customer_order_id` | uuid → customer_orders | |
| `amount` | numeric > 0 | |
| `payment_date` | date | |
| `payment_method` | payment_method | |
| `notes` | text nullable | |
| `created_by` | uuid → staff | |
| `created_at` | timestamptz | |

### `customer_order_refunds`
Deposit money returned to the customer (e.g. cancellation, overpayment). Separate table keeps deposit reporting clean.

Same columns as `customer_order_deposits`.

### `customer_order_fulfillments`
Links a fulfilment event (a `sales_transaction`) back to the customer order. One fulfilment per sales transaction (UNIQUE on `sales_transaction_id`).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `customer_order_id` | uuid → customer_orders | |
| `sales_transaction_id` | uuid → sales_transactions UNIQUE | |
| `fulfillment_date` | date | |
| `notes` | text nullable | |
| `created_by` | uuid → staff | |
| `created_at` | timestamptz | |

### `customer_order_fulfillment_items`
Which order lines were fulfilled and by how much. INSERT trigger auto-increments `customer_order_items.quantity_fulfilled`.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `fulfillment_id` | uuid → customer_order_fulfillments | |
| `customer_order_item_id` | uuid → customer_order_items | |
| `quantity_fulfilled` | numeric > 0 | |

---

## Domain 7 — Rentals

### `rental_customers`
Customers who rent equipment. Separate from general customers (no shared table).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `full_name` | text | |
| `contact_number` | text | |
| `id_image_url` | text nullable | Supabase Storage URL |
| `is_active` | boolean | soft delete |
| `created_by` | uuid → staff | |
| `created_at` | timestamptz | |

### `rental_items`
Equipment available for rent. Not inventory items.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | text | |
| `category_id` / `category_type` | composite FK → categories | |
| `daily_rate` | numeric ≥ 0 | |
| `weekly_rate` | numeric ≥ 0 nullable | |
| `notes` | text nullable | |
| `is_active` | boolean | soft delete |
| `created_by` / `updated_by` | uuid → staff | |
| `created_at` / `updated_at` | timestamptz | `updated_at` by trigger |

Availability is **derived** — not stored. An item is available when it has no rental with `status = 'active'`.

### `rentals`
An active or completed rental contract.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `rental_customer_id` | uuid → rental_customers | |
| `rental_item_id` | uuid → rental_items | |
| `start_date` | date | |
| `expected_return_date` | date | CHECK: ≥ start_date |
| `actual_return_date` | date nullable | CHECK: ≥ start_date if present |
| `rate_type` | rental_rate_type | `daily` or `weekly` |
| `rate_snapshot` | numeric ≥ 0 | rate at time of rental — locked |
| `status` | rental_status | `active` or `returned` |
| `notes` | text nullable | |
| `created_by` / `updated_by` | uuid → staff | |
| `created_at` / `updated_at` | timestamptz | `updated_at` by trigger |

CHECK: `(status = 'returned') = (actual_return_date IS NOT NULL)` — returned rentals must have a return date; active ones must not.

Partial unique index: `rentals_one_active_per_item ON (rental_item_id) WHERE status = 'active'` — prevents double-booking.

### `rental_payments`
Payments collected for a rental.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `rental_id` | uuid → rentals | |
| `amount` | numeric > 0 | |
| `payment_date` | date | |
| `payment_method` | payment_method | |
| `notes` | text nullable | |
| `created_by` | uuid → staff | |
| `created_at` | timestamptz | |

---

## Domain 8 — Assembly

### `assembly_orders`
Records production of a finished item from components.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `output_item_id` | uuid → items | the assembled product |
| `quantity_produced` | numeric > 0 | |
| `assembled_date` | date | |
| `notes` | text nullable | |
| `created_by` | uuid → staff | |
| `created_at` | timestamptz | |

### `assembly_components`
Component items consumed to produce the assembly.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `assembly_order_id` | uuid → assembly_orders | |
| `item_id` | uuid → items | component item |
| `quantity_used` | numeric > 0 | in base units |
| `unit_cost_fifo` | numeric ≥ 0 | FIFO weighted avg cost at time of assembly |

### `assembly_component_allocations`
Which batches were consumed for each component. Same pattern as `sale_item_batch_allocations`.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `assembly_component_id` | uuid → assembly_components | |
| `batch_id` | uuid → inventory_batches | |
| `quantity` | numeric > 0 | |
| `unit_cost` | numeric ≥ 0 | |
| `created_at` | timestamptz | |

Unique: `(assembly_component_id, batch_id)`.

---

## Domain 9 — Operations

### `stock_adjustments`
Removes stock without a sale (damage, internal use, theft, corrections). `quantity` is always positive — it represents the amount removed.

To **add** stock (found items, positive correction): create a new `inventory_batch` with `purchase_order_id = NULL`.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `item_id` | uuid → items | |
| `quantity` | numeric > 0 | amount removed, in base units |
| `reason` | stock_adjustment_reason | |
| `unit_cost_fifo` | numeric ≥ 0 | FIFO weighted avg cost — owner-only |
| `notes` | text nullable | |
| `created_by` | uuid → staff | |
| `created_at` | timestamptz | |

### `stock_adjustment_allocations`
Which batches were consumed by this adjustment. Same pattern as other allocation tables.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `stock_adjustment_id` | uuid → stock_adjustments | |
| `batch_id` | uuid → inventory_batches | |
| `quantity` | numeric > 0 | |
| `unit_cost` | numeric ≥ 0 | |
| `created_at` | timestamptz | |

Unique: `(stock_adjustment_id, batch_id)`.

### `expenses`
Business expenses (overheads, transport, etc.). Owner-only (RLS). Categories must have `type = 'expense'` (composite FK).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `category_id` / `category_type` | composite FK → categories | `category_type` fixed to `'expense'` |
| `amount` | numeric > 0 | |
| `expense_date` | date | |
| `description` | text | |
| `created_by` / `updated_by` | uuid → staff | |
| `created_at` / `updated_at` | timestamptz | `updated_at` by trigger |

---

## Domain 10 — Payroll

### `payroll_periods`
A paid commission period for a staff member. Owner-only (RLS).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `staff_id` | uuid → staff | |
| `period_start` | date | |
| `period_end` | date | CHECK: ≥ period_start |
| `gross_profit` | numeric | profit for the period |
| `percentage` | numeric [0, 1] | commission rate |
| `amount_paid` | numeric | actual amount paid |
| `payment_date` | date | |
| `notes` | text nullable | |
| `created_by` | uuid → staff | |
| `created_at` | timestamptz | |

EXCLUDE constraint: `(staff_id WITH =, daterange(period_start, period_end, '[]') WITH &&)` — a staff member cannot have two overlapping paid periods. Requires `btree_gist` extension.

### `payroll_adjustments`
Deductions or additions to a staff member's pay after a period is closed. Owner-only (RLS).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `staff_id` | uuid → staff | |
| `originating_period_id` | uuid → payroll_periods | period the adjustment came from |
| `absorbing_period_id` | uuid → payroll_periods nullable | period that absorbs it; NULL = pending |
| `adjustment_amount` | numeric | signed — negative = deduction |
| `reason` | payroll_adjustment_reason | |
| `sale_return_id` | uuid → sale_returns nullable | for `sale_return` reason |
| `notes` | text nullable | |
| `created_by` | uuid → staff | |
| `created_at` | timestamptz | |

Partial index on `(staff_id) WHERE absorbing_period_id IS NULL` — fast lookup of pending adjustments.

---

## Server-side functions

### `consume_fifo(p_item_id uuid, p_quantity numeric)`
Returns `TABLE(batch_id uuid, quantity numeric, unit_cost numeric)`.

Consumes `p_quantity` base units of `p_item_id` from the oldest open batches (ordered by `received_at, created_at, id`). Locks rows with `FOR UPDATE`. Decrements `quantity_remaining`. Returns one row per batch consumed.

If stock is insufficient, returns what is available without error — caller detects shortfall via `SUM(quantity) < p_quantity`.

Call pattern:
1. Call `consume_fifo()` inside the same transaction as the parent insert
2. Insert returned rows into the appropriate `*_allocations` table
3. Compute weighted-average cost: `SUM(quantity * unit_cost) / SUM(quantity)`
4. Write that to `unit_cost_fifo` on the parent row

### `restore_fifo(p_sale_item_id uuid, p_quantity numeric)`
Returns `void`.

Restores stock to the exact batches that `sale_item_batch_allocations` records for the given sale item. Processes in reverse order (newest batch first). Raises exception if allocations cover less than `p_quantity`.

### `set_updated_at()`
Trigger function. Sets `NEW.updated_at = now()` before any UPDATE. Applied to: `purchase_orders`, `items`, `sales_transactions`, `sale_items`, `customer_orders`, `rental_items`, `rentals`, `expenses`.
