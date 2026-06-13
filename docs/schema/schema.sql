-- ============================================================
-- Building Materials Business — PostgreSQL Schema
-- ============================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS btree_gist;   -- payroll overlap EXCLUDE

-- ─── ENUMS ────────────────────────────────────────────────────

CREATE TYPE staff_role AS ENUM ('owner', 'sales_rep');

CREATE TYPE category_type AS ENUM ('item', 'expense');

CREATE TYPE item_type_enum AS ENUM ('standard', 'assembled');

CREATE TYPE purchase_order_status AS ENUM
  ('pending_delivery', 'partially_received', 'received', 'cancelled');

CREATE TYPE payment_method AS ENUM ('cash', 'transfer', 'other');

CREATE TYPE customer_order_status AS ENUM
  ('pending', 'partially_fulfilled', 'fulfilled', 'cancelled');

CREATE TYPE rental_rate_type AS ENUM ('daily', 'weekly');

-- 'overdue' removed: it is DERIVED
-- (status = 'active' AND expected_return_date < CURRENT_DATE)
CREATE TYPE rental_status AS ENUM ('active', 'returned');

CREATE TYPE stock_adjustment_reason AS ENUM
  ('internal_use', 'damaged', 'given_away', 'correction', 'missing');

CREATE TYPE payroll_adjustment_reason AS ENUM
  ('sale_return', 'correction', 'other');


-- ─── FOUNDATION ───────────────────────────────────────────────

-- AUTH MODEL:
--   * PASSWORD is the main authentication method. With the
--     Supabase stack, passwords live in auth.users and are
--     hashed/verified by Supabase Auth (GoTrue) — never store
--     your own password hash. The owner creates accounts via
--     the Supabase Admin API; staff.id must equal auth.users.id.
--   * PIN is an application-level convenience: a short code to
--     quickly resume a session on a trusted device. It expires
--     (pin_expires_at), after which a full email/password login
--     is required again. Always stored hashed.
CREATE TABLE staff (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name      text NOT NULL,
  role           staff_role NOT NULL,
  email          text NOT NULL UNIQUE,
  pin_hash       text,
  pin_expires_at timestamptz,
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- On Supabase, uncomment so staff rows are tied to Auth users
-- (and RLS policies can use auth.uid() directly):
-- ALTER TABLE staff
--   ADD CONSTRAINT staff_id_fkey
--   FOREIGN KEY (id) REFERENCES auth.users (id);

CREATE TABLE units (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL UNIQUE,
  abbreviation text NOT NULL,
  is_active    boolean NOT NULL DEFAULT true
);

CREATE TABLE categories (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name      text NOT NULL,
  type      category_type NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE (name, type),
  UNIQUE (id, type)            -- target of composite FKs below
);


-- ─── PURCHASING ───────────────────────────────────────────────

CREATE TABLE purchase_orders (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_date date NOT NULL,
  status     purchase_order_status NOT NULL DEFAULT 'pending_delivery',
  notes      text,
  created_by uuid NOT NULL REFERENCES staff (id),
  updated_by uuid REFERENCES staff (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);


-- ─── INVENTORY ────────────────────────────────────────────────

CREATE TABLE items (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_item_id          uuid REFERENCES items (id),
  name                    text NOT NULL,
  brand                   text,
  category_id             uuid NOT NULL,
  category_type           category_type NOT NULL DEFAULT 'item'
                            CHECK (category_type = 'item'),
  purchase_unit_id        uuid NOT NULL REFERENCES units (id),
  base_unit_id            uuid NOT NULL REFERENCES units (id),
  sale_unit_id            uuid NOT NULL REFERENCES units (id),
  purchase_to_base_factor numeric NOT NULL DEFAULT 1
                            CHECK (purchase_to_base_factor > 0),
  item_type               item_type_enum NOT NULL DEFAULT 'standard',
  reorder_level           numeric CHECK (reorder_level >= 0),
  qr_code                 text,          -- NULL until generated
  is_active               boolean NOT NULL DEFAULT true,
  created_by              uuid NOT NULL REFERENCES staff (id),
  updated_by              uuid REFERENCES staff (id),
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz,
  -- composite FK guarantees the category has type = 'item'
  FOREIGN KEY (category_id, category_type)
    REFERENCES categories (id, type)
);

-- unique only when present
CREATE UNIQUE INDEX items_qr_code_key
  ON items (qr_code) WHERE qr_code IS NOT NULL;

CREATE TABLE purchase_order_items (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES purchase_orders (id),
  item_id           uuid NOT NULL REFERENCES items (id),
  -- quantities and unit_cost are in PURCHASE UNITS; conversion
  -- to base units happens when the inventory_batch is created.
  quantity_ordered  numeric NOT NULL CHECK (quantity_ordered > 0),
  quantity_received numeric NOT NULL DEFAULT 0
                      CHECK (quantity_received >= 0),
  unit_cost         numeric NOT NULL CHECK (unit_cost >= 0)
);

CREATE TABLE purchase_payments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES purchase_orders (id),
  amount            numeric NOT NULL CHECK (amount > 0),
  payment_date      date NOT NULL,
  payment_method    payment_method NOT NULL,
  notes             text,
  created_by        uuid NOT NULL REFERENCES staff (id),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE inventory_batches (
  id                               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id                          uuid NOT NULL REFERENCES items (id),
  purchase_order_id                uuid REFERENCES purchase_orders (id),
  quantity_received_purchase_units numeric NOT NULL
                                     CHECK (quantity_received_purchase_units > 0),
  quantity_received                numeric NOT NULL
                                     CHECK (quantity_received > 0),
  quantity_remaining               numeric NOT NULL,
  unit_cost                        numeric NOT NULL CHECK (unit_cost >= 0),
  received_at                      timestamptz NOT NULL DEFAULT now(),
  created_by                       uuid NOT NULL REFERENCES staff (id),
  created_at                       timestamptz NOT NULL DEFAULT now(),
  CHECK (quantity_remaining >= 0
         AND quantity_remaining <= quantity_received)
);


-- ─── SALES ────────────────────────────────────────────────────

CREATE TABLE sales_transactions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_date timestamptz NOT NULL DEFAULT now(),
  customer_name    text,
  notes            text,
  created_by       uuid NOT NULL REFERENCES staff (id),
  updated_by       uuid REFERENCES staff (id),   -- same-day edits
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz
);

CREATE TABLE sale_items (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_transaction_id uuid NOT NULL REFERENCES sales_transactions (id),
  item_id              uuid NOT NULL REFERENCES items (id),
  quantity             numeric NOT NULL CHECK (quantity > 0),
  unit_price           numeric NOT NULL CHECK (unit_price >= 0),
  unit_cost_fifo       numeric NOT NULL CHECK (unit_cost_fifo >= 0),
  notes                text,
  updated_by           uuid REFERENCES staff (id),
  updated_at           timestamptz
);

-- WHICH batches this sale line consumed, and how much from each.
-- This is what makes returns able to restore the right cost layer.
CREATE TABLE sale_item_batch_allocations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_item_id uuid NOT NULL REFERENCES sale_items (id),
  batch_id     uuid NOT NULL REFERENCES inventory_batches (id),
  quantity     numeric NOT NULL CHECK (quantity > 0),
  unit_cost    numeric NOT NULL CHECK (unit_cost >= 0),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sale_item_id, batch_id)
);

CREATE TABLE sale_payments (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_transaction_id uuid NOT NULL REFERENCES sales_transactions (id),
  amount               numeric NOT NULL CHECK (amount > 0),
  payment_date         date NOT NULL,
  payment_method       payment_method NOT NULL,
  notes                text,
  created_by           uuid NOT NULL REFERENCES staff (id),
  created_at           timestamptz NOT NULL DEFAULT now()
);


-- ─── RETURNS ──────────────────────────────────────────────────

CREATE TABLE sale_returns (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_transaction_id uuid NOT NULL REFERENCES sales_transactions (id),
  return_date             date NOT NULL,
  reason                  text,
  notes                   text,
  created_by              uuid NOT NULL REFERENCES staff (id),
  created_at              timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sale_return_items (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_return_id      uuid NOT NULL REFERENCES sale_returns (id),
  sale_item_id        uuid NOT NULL REFERENCES sale_items (id),
  quantity_returned   numeric NOT NULL CHECK (quantity_returned > 0),
  unit_price_refunded numeric NOT NULL CHECK (unit_price_refunded >= 0),
  unit_cost_fifo      numeric NOT NULL CHECK (unit_cost_fifo >= 0)
);

CREATE TABLE sale_return_payments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_return_id uuid NOT NULL REFERENCES sale_returns (id),
  amount         numeric NOT NULL CHECK (amount > 0),
  payment_date   date NOT NULL,
  payment_method payment_method NOT NULL,
  notes          text,
  created_by     uuid NOT NULL REFERENCES staff (id),
  created_at     timestamptz NOT NULL DEFAULT now()
);


-- ─── CUSTOMER ORDERS ──────────────────────────────────────────

CREATE TABLE customer_orders (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_date    date NOT NULL,
  customer_name text,
  status        customer_order_status NOT NULL DEFAULT 'pending',
  notes         text,
  created_by    uuid NOT NULL REFERENCES staff (id),
  updated_by    uuid REFERENCES staff (id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz
);

CREATE TABLE customer_order_items (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_order_id  uuid NOT NULL REFERENCES customer_orders (id),
  item_id            uuid NOT NULL REFERENCES items (id),
  quantity           numeric NOT NULL CHECK (quantity > 0),
  quantity_fulfilled numeric NOT NULL DEFAULT 0,
  agreed_unit_price  numeric NOT NULL CHECK (agreed_unit_price >= 0),
  CHECK (quantity_fulfilled >= 0 AND quantity_fulfilled <= quantity)
);

CREATE TABLE customer_order_deposits (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_order_id uuid NOT NULL REFERENCES customer_orders (id),
  amount            numeric NOT NULL CHECK (amount > 0),
  payment_date      date NOT NULL,
  payment_method    payment_method NOT NULL,
  notes             text,
  created_by        uuid NOT NULL REFERENCES staff (id),
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Deposit money returned to the customer (e.g. cancelled order,
-- or deposit exceeding the final collected total). Keeps deposit
-- reporting clean instead of abusing negative deposit rows.
CREATE TABLE customer_order_refunds (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_order_id uuid NOT NULL REFERENCES customer_orders (id),
  amount            numeric NOT NULL CHECK (amount > 0),
  payment_date      date NOT NULL,
  payment_method    payment_method NOT NULL,
  notes             text,
  created_by        uuid NOT NULL REFERENCES staff (id),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE customer_order_fulfillments (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_order_id    uuid NOT NULL REFERENCES customer_orders (id),
  sales_transaction_id uuid NOT NULL UNIQUE
                         REFERENCES sales_transactions (id),
  fulfillment_date     date NOT NULL,
  notes                text,
  created_by           uuid NOT NULL REFERENCES staff (id),
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE customer_order_fulfillment_items (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fulfillment_id         uuid NOT NULL
                           REFERENCES customer_order_fulfillments (id),
  customer_order_item_id uuid NOT NULL
                           REFERENCES customer_order_items (id),
  quantity_fulfilled     numeric NOT NULL CHECK (quantity_fulfilled > 0)
);


-- ─── RENTALS ──────────────────────────────────────────────────

CREATE TABLE rental_customers (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name      text NOT NULL,
  contact_number text NOT NULL,
  id_image_url   text,
  is_active      boolean NOT NULL DEFAULT true,
  created_by     uuid NOT NULL REFERENCES staff (id),
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE rental_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  category_id   uuid NOT NULL,
  category_type category_type NOT NULL DEFAULT 'item'
                  CHECK (category_type = 'item'),
  daily_rate    numeric NOT NULL CHECK (daily_rate >= 0),
  weekly_rate   numeric CHECK (weekly_rate >= 0),
  notes         text,
  is_active     boolean NOT NULL DEFAULT true,
  created_by    uuid NOT NULL REFERENCES staff (id),
  updated_by    uuid REFERENCES staff (id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz,
  FOREIGN KEY (category_id, category_type)
    REFERENCES categories (id, type)
);

CREATE TABLE rentals (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_customer_id   uuid NOT NULL REFERENCES rental_customers (id),
  rental_item_id       uuid NOT NULL REFERENCES rental_items (id),
  start_date           date NOT NULL,
  expected_return_date date NOT NULL,
  actual_return_date   date,
  rate_type            rental_rate_type NOT NULL,
  rate_snapshot        numeric NOT NULL CHECK (rate_snapshot >= 0),
  status               rental_status NOT NULL DEFAULT 'active',
  notes                text,
  created_by           uuid NOT NULL REFERENCES staff (id),
  updated_by           uuid REFERENCES staff (id),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz,
  CHECK (expected_return_date >= start_date),
  CHECK (actual_return_date IS NULL OR actual_return_date >= start_date),
  -- returned rentals must carry a return date; active ones must not
  CHECK ((status = 'returned') = (actual_return_date IS NOT NULL))
);

-- one item cannot be actively rented twice at the same time
CREATE UNIQUE INDEX rentals_one_active_per_item
  ON rentals (rental_item_id) WHERE status = 'active';

CREATE TABLE rental_payments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id      uuid NOT NULL REFERENCES rentals (id),
  amount         numeric NOT NULL CHECK (amount > 0),
  payment_date   date NOT NULL,
  payment_method payment_method NOT NULL,
  notes          text,
  created_by     uuid NOT NULL REFERENCES staff (id),
  created_at     timestamptz NOT NULL DEFAULT now()
);


-- ─── ASSEMBLY ─────────────────────────────────────────────────

CREATE TABLE assembly_orders (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  output_item_id    uuid NOT NULL REFERENCES items (id),
  quantity_produced numeric NOT NULL CHECK (quantity_produced > 0),
  assembled_date    date NOT NULL,
  notes             text,
  created_by        uuid NOT NULL REFERENCES staff (id),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE assembly_components (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assembly_order_id uuid NOT NULL REFERENCES assembly_orders (id),
  item_id           uuid NOT NULL REFERENCES items (id),
  quantity_used     numeric NOT NULL CHECK (quantity_used > 0),
  unit_cost_fifo    numeric NOT NULL CHECK (unit_cost_fifo >= 0)
);

CREATE TABLE assembly_component_allocations (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assembly_component_id uuid NOT NULL REFERENCES assembly_components (id),
  batch_id              uuid NOT NULL REFERENCES inventory_batches (id),
  quantity              numeric NOT NULL CHECK (quantity > 0),
  unit_cost             numeric NOT NULL CHECK (unit_cost >= 0),
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assembly_component_id, batch_id)
);


-- ─── OPERATIONS ───────────────────────────────────────────────

-- stock_adjustments REMOVE stock only (quantity > 0 = quantity
-- removed, in base units). Stock ADDITIONS (e.g. a positive
-- correction or found stock) are recorded by creating a manual
-- inventory_batches row (purchase_order_id NULL) instead.
CREATE TABLE stock_adjustments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id        uuid NOT NULL REFERENCES items (id),
  quantity       numeric NOT NULL CHECK (quantity > 0),
  reason         stock_adjustment_reason NOT NULL,
  unit_cost_fifo numeric NOT NULL CHECK (unit_cost_fifo >= 0),
  notes          text,
  created_by     uuid NOT NULL REFERENCES staff (id),
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE stock_adjustment_allocations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_adjustment_id uuid NOT NULL REFERENCES stock_adjustments (id),
  batch_id            uuid NOT NULL REFERENCES inventory_batches (id),
  quantity            numeric NOT NULL CHECK (quantity > 0),
  unit_cost           numeric NOT NULL CHECK (unit_cost >= 0),
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (stock_adjustment_id, batch_id)
);

CREATE TABLE expenses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id   uuid NOT NULL,
  category_type category_type NOT NULL DEFAULT 'expense'
                  CHECK (category_type = 'expense'),
  amount        numeric NOT NULL CHECK (amount > 0),
  expense_date  date NOT NULL,
  description   text NOT NULL,
  created_by    uuid NOT NULL REFERENCES staff (id),
  updated_by    uuid REFERENCES staff (id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz,
  FOREIGN KEY (category_id, category_type)
    REFERENCES categories (id, type)
);


-- ─── PAYROLL ──────────────────────────────────────────────────

CREATE TABLE payroll_periods (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id     uuid NOT NULL REFERENCES staff (id),
  period_start date NOT NULL,
  period_end   date NOT NULL,
  gross_profit numeric NOT NULL,
  percentage   numeric NOT NULL CHECK (percentage >= 0 AND percentage <= 1),
  amount_paid  numeric NOT NULL,
  payment_date date NOT NULL,
  notes        text,
  created_by   uuid NOT NULL REFERENCES staff (id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  CHECK (period_end >= period_start),
  -- a staff member cannot have two overlapping paid periods
  EXCLUDE USING gist (
    staff_id WITH =,
    daterange(period_start, period_end, '[]') WITH &&
  )
);

CREATE TABLE payroll_adjustments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id              uuid NOT NULL REFERENCES staff (id),
  originating_period_id uuid NOT NULL REFERENCES payroll_periods (id),
  absorbing_period_id   uuid REFERENCES payroll_periods (id),
  adjustment_amount     numeric NOT NULL,  -- signed; negative = deduction
  reason                payroll_adjustment_reason NOT NULL,
  sale_return_id        uuid REFERENCES sale_returns (id),
  notes                 text,
  created_by            uuid NOT NULL REFERENCES staff (id),
  created_at            timestamptz NOT NULL DEFAULT now()
);


-- ============================================================
-- TRIGGERS
-- ============================================================

-- 1) Auto-maintain updated_at on every updatable table
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'purchase_orders', 'items', 'sales_transactions', 'sale_items',
    'customer_orders', 'rental_items', 'rentals', 'expenses'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER %I_set_updated_at
         BEFORE UPDATE ON %I
         FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
  END LOOP;
END $$;

-- 2) Returns: the returned line must belong to the return's
--    original transaction, and cumulative returns of a sale line
--    can never exceed the quantity originally sold.
CREATE OR REPLACE FUNCTION check_sale_return_item()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_txn          uuid;
  v_sold         numeric;
  v_already      numeric;
BEGIN
  SELECT si.sales_transaction_id, si.quantity
    INTO v_txn, v_sold
    FROM sale_items si
   WHERE si.id = NEW.sale_item_id
     FOR UPDATE;                       -- serialize concurrent returns

  IF v_txn IS DISTINCT FROM (
       SELECT sr.original_transaction_id
         FROM sale_returns sr
        WHERE sr.id = NEW.sale_return_id) THEN
    RAISE EXCEPTION
      'sale_item % does not belong to the original transaction of return %',
      NEW.sale_item_id, NEW.sale_return_id;
  END IF;

  SELECT COALESCE(SUM(quantity_returned), 0)
    INTO v_already
    FROM sale_return_items
   WHERE sale_item_id = NEW.sale_item_id
     AND id IS DISTINCT FROM NEW.id;

  IF v_already + NEW.quantity_returned > v_sold THEN
    RAISE EXCEPTION
      'over-return: % already returned + % requested exceeds % sold',
      v_already, NEW.quantity_returned, v_sold;
  END IF;

  RETURN NEW;
END $$;

CREATE TRIGGER sale_return_items_check
  BEFORE INSERT OR UPDATE ON sale_return_items
  FOR EACH ROW EXECUTE FUNCTION check_sale_return_item();

-- 3) Customer orders: each fulfillment line automatically
--    increments the running total on the order line. The CHECK
--    on customer_order_items then blocks over-fulfillment.
CREATE OR REPLACE FUNCTION apply_fulfillment_item()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE customer_order_items
     SET quantity_fulfilled = quantity_fulfilled + NEW.quantity_fulfilled
   WHERE id = NEW.customer_order_item_id;
  RETURN NEW;
END $$;

CREATE TRIGGER fulfillment_items_apply
  AFTER INSERT ON customer_order_fulfillment_items
  FOR EACH ROW EXECUTE FUNCTION apply_fulfillment_item();

-- 4) Allocation integrity: a sale-line allocation must reference
--    a batch of the same item as the sale line.
CREATE OR REPLACE FUNCTION check_sale_allocation_item_match()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (SELECT item_id FROM sale_items WHERE id = NEW.sale_item_id)
     IS DISTINCT FROM
     (SELECT item_id FROM inventory_batches WHERE id = NEW.batch_id) THEN
    RAISE EXCEPTION 'allocation batch item does not match sale line item';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER sale_item_batch_allocations_check
  BEFORE INSERT OR UPDATE ON sale_item_batch_allocations
  FOR EACH ROW EXECUTE FUNCTION check_sale_allocation_item_match();


-- ============================================================
-- FIFO HELPER (server-side consumption)
-- ============================================================
-- Consumes p_quantity (base units) of p_item_id from the oldest
-- open batches, decrements quantity_remaining, and returns one
-- row per batch consumed: (batch_id, quantity, unit_cost).
-- Call inside the same transaction that inserts the sale line /
-- assembly component / stock adjustment, then insert the returned
-- rows into the matching *_allocations table and write the
-- weighted-average cost onto the parent row.
--
-- If stock is insufficient it consumes everything available and
-- the caller can detect the shortfall (SUM(quantity) < requested)
-- — matching the business rule that insufficient stock should
-- WARN, not block.
CREATE OR REPLACE FUNCTION consume_fifo(p_item_id uuid, p_quantity numeric)
RETURNS TABLE (batch_id uuid, quantity numeric, unit_cost numeric)
LANGUAGE plpgsql AS $$
DECLARE
  v_needed numeric := p_quantity;
  v_batch  record;
  v_take   numeric;
BEGIN
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'quantity to consume must be > 0';
  END IF;

  FOR v_batch IN
    SELECT b.id, b.quantity_remaining, b.unit_cost
      FROM inventory_batches b
     WHERE b.item_id = p_item_id
       AND b.quantity_remaining > 0
     ORDER BY b.received_at, b.created_at, b.id
       FOR UPDATE                       -- lock layers being consumed
  LOOP
    EXIT WHEN v_needed <= 0;
    v_take := LEAST(v_batch.quantity_remaining, v_needed);

    UPDATE inventory_batches
       SET quantity_remaining = quantity_remaining - v_take
     WHERE id = v_batch.id;

    v_needed   := v_needed - v_take;
    batch_id   := v_batch.id;
    quantity   := v_take;
    unit_cost  := v_batch.unit_cost;
    RETURN NEXT;
  END LOOP;
END $$;

-- Reverse helper for returns: restores quantities onto the exact
-- batches a sale line consumed, proportional to the original
-- allocations, newest-consumed first.
CREATE OR REPLACE FUNCTION restore_fifo(p_sale_item_id uuid, p_quantity numeric)
RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  v_needed numeric := p_quantity;
  v_alloc  record;
  v_back   numeric;
BEGIN
  FOR v_alloc IN
    SELECT a.batch_id, a.quantity
      FROM sale_item_batch_allocations a
      JOIN inventory_batches b ON b.id = a.batch_id
     WHERE a.sale_item_id = p_sale_item_id
     ORDER BY b.received_at DESC, b.created_at DESC, b.id DESC
       FOR UPDATE OF b
  LOOP
    EXIT WHEN v_needed <= 0;
    -- never restore more onto a batch than was taken from it
    -- (cumulative restores are bounded by the over-return trigger)
    v_back := LEAST(v_alloc.quantity, v_needed);

    UPDATE inventory_batches
       SET quantity_remaining = quantity_remaining + v_back
     WHERE id = v_alloc.batch_id;

    v_needed := v_needed - v_back;
  END LOOP;

  IF v_needed > 0 THEN
    RAISE EXCEPTION
      'restore_fifo: allocations for sale_item % cover less than requested',
      p_sale_item_id;
  END IF;
END $$;


-- ============================================================
-- INDEXES (Postgres does not index FK columns automatically)
-- ============================================================

-- hot FIFO path
CREATE INDEX inventory_batches_fifo_idx
  ON inventory_batches (item_id, received_at)
  WHERE quantity_remaining > 0;
CREATE INDEX inventory_batches_item_idx  ON inventory_batches (item_id);
CREATE INDEX inventory_batches_po_idx    ON inventory_batches (purchase_order_id);

-- items
CREATE INDEX items_parent_idx   ON items (parent_item_id);
CREATE INDEX items_category_idx ON items (category_id);

-- purchasing
CREATE INDEX purchase_order_items_po_idx   ON purchase_order_items (purchase_order_id);
CREATE INDEX purchase_order_items_item_idx ON purchase_order_items (item_id);
CREATE INDEX purchase_payments_po_idx      ON purchase_payments (purchase_order_id);
CREATE INDEX purchase_orders_date_idx      ON purchase_orders (order_date);

-- sales (reporting + payroll windows)
CREATE INDEX sales_transactions_date_idx ON sales_transactions (transaction_date);
CREATE INDEX sale_items_txn_idx          ON sale_items (sales_transaction_id);
CREATE INDEX sale_items_item_idx         ON sale_items (item_id);
CREATE INDEX sale_payments_txn_idx       ON sale_payments (sales_transaction_id);
CREATE INDEX sale_alloc_sale_item_idx    ON sale_item_batch_allocations (sale_item_id);
CREATE INDEX sale_alloc_batch_idx        ON sale_item_batch_allocations (batch_id);

-- returns
CREATE INDEX sale_returns_txn_idx          ON sale_returns (original_transaction_id);
CREATE INDEX sale_return_items_return_idx  ON sale_return_items (sale_return_id);
CREATE INDEX sale_return_items_line_idx    ON sale_return_items (sale_item_id);
CREATE INDEX sale_return_payments_ret_idx  ON sale_return_payments (sale_return_id);

-- customer orders
CREATE INDEX customer_order_items_order_idx    ON customer_order_items (customer_order_id);
CREATE INDEX customer_order_items_item_idx     ON customer_order_items (item_id);
CREATE INDEX customer_order_deposits_order_idx ON customer_order_deposits (customer_order_id);
CREATE INDEX customer_order_refunds_order_idx  ON customer_order_refunds (customer_order_id);
CREATE INDEX cof_order_idx                     ON customer_order_fulfillments (customer_order_id);
CREATE INDEX cofi_fulfillment_idx              ON customer_order_fulfillment_items (fulfillment_id);
CREATE INDEX cofi_order_item_idx               ON customer_order_fulfillment_items (customer_order_item_id);
CREATE INDEX customer_orders_status_idx        ON customer_orders (status);

-- rentals
CREATE INDEX rentals_customer_idx       ON rentals (rental_customer_id);
CREATE INDEX rentals_item_idx           ON rentals (rental_item_id);
CREATE INDEX rentals_status_idx         ON rentals (status);
CREATE INDEX rental_payments_rental_idx ON rental_payments (rental_id);

-- assembly
CREATE INDEX assembly_components_order_idx ON assembly_components (assembly_order_id);
CREATE INDEX assembly_components_item_idx  ON assembly_components (item_id);
CREATE INDEX assembly_alloc_component_idx  ON assembly_component_allocations (assembly_component_id);
CREATE INDEX assembly_alloc_batch_idx      ON assembly_component_allocations (batch_id);
CREATE INDEX assembly_orders_output_idx    ON assembly_orders (output_item_id);

-- operations
CREATE INDEX stock_adjustments_item_idx ON stock_adjustments (item_id);
CREATE INDEX stock_adj_alloc_adj_idx    ON stock_adjustment_allocations (stock_adjustment_id);
CREATE INDEX stock_adj_alloc_batch_idx  ON stock_adjustment_allocations (batch_id);
CREATE INDEX expenses_date_idx          ON expenses (expense_date);
CREATE INDEX expenses_category_idx      ON expenses (category_id);

-- payroll
CREATE INDEX payroll_periods_staff_idx     ON payroll_periods (staff_id);
CREATE INDEX payroll_adjustments_staff_idx ON payroll_adjustments (staff_id);
CREATE INDEX payroll_adjustments_pending_idx
  ON payroll_adjustments (staff_id) WHERE absorbing_period_id IS NULL;


-- ============================================================
-- ROW LEVEL SECURITY (Supabase) — skeleton
-- ============================================================
-- IMPORTANT: RLS is row-level; it CANNOT hide individual columns.
-- Cost/profit secrecy for the sales_rep must be handled by:
--   1. Computing unit_cost_fifo SERVER-SIDE (consume_fifo above,
--      called from a SECURITY DEFINER RPC or a trusted API route)
--      so the rep's client never sends or receives cost data.
--   2. Exposing rep-facing VIEWS that omit cost columns
--      (e.g. sale_items minus unit_cost_fifo; never expose
--      inventory_batches.unit_cost, purchase_order_items.unit_cost,
--      purchase_payments, expenses, payroll_* to the rep).
--   3. Restricting the base tables with the policies below.
--
-- Uncomment and adapt on Supabase:
--
-- ALTER TABLE payroll_periods     ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE payroll_adjustments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE expenses            ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE purchase_payments   ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY owner_only ON payroll_periods
--   FOR ALL USING (
--     EXISTS (SELECT 1 FROM staff s
--              WHERE s.id = auth.uid()
--                AND s.role = 'owner' AND s.is_active));
-- (repeat for payroll_adjustments, expenses, purchase_payments;
--  enable RLS with an "active staff" policy on all other tables.)

COMMIT;
