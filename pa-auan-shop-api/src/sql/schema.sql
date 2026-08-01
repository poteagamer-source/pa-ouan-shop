-- ===================================================================
-- pa-auan-shop-api schema
-- ===================================================================

CREATE TABLE IF NOT EXISTS categories (
  id    text PRIMARY KEY,
  label text NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id          text PRIMARY KEY,
  name        text NOT NULL,
  price       numeric(14,3) NOT NULL,
  category_id text NOT NULL REFERENCES categories(id),
  image       text,
  bestseller  boolean NOT NULL DEFAULT false,
  recommended boolean NOT NULL DEFAULT false,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS toppings (
  id    text PRIMARY KEY,
  name  text NOT NULL,
  price numeric(14,3) NOT NULL,
  image text,
  tier  int NOT NULL
);

CREATE TABLE IF NOT EXISTS stock (
  product_id text PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  stock_qty  int NOT NULL DEFAULT 0,
  unit       text NOT NULL DEFAULT 'ถ้วย',
  low_at     int NOT NULL DEFAULT 6,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ใช้หน่วยสินค้าสำเร็จรูปเป็นถ้วย และปรับข้อมูลจากเวอร์ชันเดิม
ALTER TABLE stock ALTER COLUMN unit SET DEFAULT 'ถ้วย';
UPDATE stock SET unit = 'ถ้วย' WHERE unit = 'ก้อน';

CREATE TABLE IF NOT EXISTS staff_users (
  id            bigserial PRIMARY KEY,
  username      text NOT NULL UNIQUE,
  display_name  text NOT NULL,
  role          text NOT NULL CHECK (role IN ('manager','kitchen','waiter')),
  password_hash text NOT NULL,
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staff_sessions (
  token_hash text PRIMARY KEY,
  user_id    bigint NOT NULL REFERENCES staff_users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_staff_sessions_user ON staff_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_sessions_expiry ON staff_sessions(expires_at);

-- `status` is retained as a legacy column during migration. New code uses
-- payment_status and fulfillment_status independently.
CREATE TABLE IF NOT EXISTS orders (
  id                text PRIMARY KEY,
  table_name        text NOT NULL,
  order_date        date NOT NULL DEFAULT current_date,
  order_time        time NOT NULL DEFAULT current_time,
  status            text NOT NULL DEFAULT 'pending_payment',
  payment_status    text NOT NULL DEFAULT 'pending',
  fulfillment_status text NOT NULL DEFAULT 'not_started',
  currency          char(3) NOT NULL DEFAULT 'THB',
  currency_exponent smallint NOT NULL DEFAULT 2,
  amount_minor      bigint NOT NULL DEFAULT 0,
  note              text CHECK (note IN ('เย็น','ร้อน')),
  total             numeric(14,3) NOT NULL DEFAULT 0,
  paid              boolean NOT NULL DEFAULT false,
  payment_verified  boolean NOT NULL DEFAULT false,
  payment_provider  text,
  payment_transaction_id text,
  payment_currency  text NOT NULL DEFAULT 'THB',
  paid_at           timestamptz,
  slip_image        text,
  step_started_at   timestamptz NOT NULL DEFAULT now(),
  served_at         time,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Upgrade databases created by previous versions without destroying order data.
ALTER TABLE products ALTER COLUMN price TYPE numeric(14,3);
ALTER TABLE toppings ALTER COLUMN price TYPE numeric(14,3);
ALTER TABLE orders ALTER COLUMN total TYPE numeric(14,3);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_status text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS currency char(3);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS currency_exponent smallint;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS amount_minor bigint;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_provider text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_transaction_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_currency text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at timestamptz;

UPDATE orders
SET payment_status = CASE
  WHEN status = 'refunded' THEN 'refunded'
  WHEN status = 'payment_failed' THEN 'failed'
  WHEN paid = true OR status IN ('paid','cooking','ready','served') THEN 'succeeded'
  ELSE 'pending'
END
WHERE payment_status IS NULL;

UPDATE orders
SET fulfillment_status = CASE
  WHEN status = 'paid' THEN 'queued'
  WHEN status IN ('cooking','ready','served','cancelled') THEN status
  ELSE 'not_started'
END
WHERE fulfillment_status IS NULL;

UPDATE orders SET currency = COALESCE(NULLIF(upper(payment_currency), ''), 'THB') WHERE currency IS NULL;
UPDATE orders SET currency_exponent = 2 WHERE currency_exponent IS NULL;
UPDATE orders SET amount_minor = round(total * power(10, currency_exponent))::bigint WHERE amount_minor IS NULL;

ALTER TABLE orders ALTER COLUMN payment_status SET DEFAULT 'pending';
ALTER TABLE orders ALTER COLUMN payment_status SET NOT NULL;
ALTER TABLE orders ALTER COLUMN fulfillment_status SET DEFAULT 'not_started';
ALTER TABLE orders ALTER COLUMN fulfillment_status SET NOT NULL;
ALTER TABLE orders ALTER COLUMN currency SET DEFAULT 'THB';
ALTER TABLE orders ALTER COLUMN currency SET NOT NULL;
ALTER TABLE orders ALTER COLUMN currency_exponent SET DEFAULT 2;
ALTER TABLE orders ALTER COLUMN currency_exponent SET NOT NULL;
ALTER TABLE orders ALTER COLUMN amount_minor SET DEFAULT 0;
ALTER TABLE orders ALTER COLUMN amount_minor SET NOT NULL;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_fulfillment_status_check;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_currency_check;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_currency_exponent_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check CHECK (
  payment_status IN ('pending','processing','succeeded','failed','cancelled','partially_refunded','refunded')
);
ALTER TABLE orders ADD CONSTRAINT orders_fulfillment_status_check CHECK (
  fulfillment_status IN ('not_started','queued','cooking','ready','served','cancelled')
);
ALTER TABLE orders ADD CONSTRAINT orders_currency_check CHECK (currency ~ '^[A-Z]{3}$');
ALTER TABLE orders ADD CONSTRAINT orders_currency_exponent_check CHECK (currency_exponent BETWEEN 0 AND 3);

CREATE TABLE IF NOT EXISTS payments (
  id                  text PRIMARY KEY,
  order_id            text NOT NULL REFERENCES orders(id),
  provider            text NOT NULL,
  provider_payment_id text,
  provider_transaction_id text,
  payment_method      text,
  status              text NOT NULL DEFAULT 'created'
                        CHECK (status IN (
                          'created','pending','requires_action','processing','succeeded',
                          'failed','cancelled','partially_refunded','refunded'
                        )),
  amount_minor        bigint NOT NULL CHECK (amount_minor >= 0),
  refunded_amount_minor bigint NOT NULL DEFAULT 0 CHECK (refunded_amount_minor >= 0),
  currency            char(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  idempotency_key     text NOT NULL,
  checkout_url        text,
  failure_code        text,
  failure_message     text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  paid_at             timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_provider_id
  ON payments(provider, provider_payment_id) WHERE provider_payment_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_provider_transaction
  ON payments(provider, provider_transaction_id) WHERE provider_transaction_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_idempotency
  ON payments(provider, idempotency_key);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id, created_at DESC);

CREATE TABLE IF NOT EXISTS payment_events (
  provider       text NOT NULL,
  event_id       text NOT NULL,
  payment_id     text REFERENCES payments(id),
  order_id       text NOT NULL REFERENCES orders(id),
  transaction_id text,
  event_type     text NOT NULL,
  payload        jsonb NOT NULL,
  processed_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, event_id)
);

-- Upgrade the earlier provider-neutral payment_events table.
ALTER TABLE payment_events ADD COLUMN IF NOT EXISTS payment_id text REFERENCES payments(id);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'payment_events'::regclass
      AND contype = 'p'
      AND pg_get_constraintdef(oid) = 'PRIMARY KEY (provider, event_id)'
  ) THEN
    ALTER TABLE payment_events DROP CONSTRAINT IF EXISTS payment_events_pkey;
    ALTER TABLE payment_events ADD PRIMARY KEY (provider, event_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS order_items (
  id            serial PRIMARY KEY,
  order_id      text NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id    text REFERENCES products(id),
  product_name  text NOT NULL,
  product_image text,
  base_price    numeric(14,3) NOT NULL,
  quantity      int NOT NULL DEFAULT 1,
  temperature   text CHECK (temperature IN ('cold','hot')),
  line_total    numeric(14,3) NOT NULL DEFAULT 0
);

ALTER TABLE order_items ALTER COLUMN base_price TYPE numeric(14,3);
ALTER TABLE order_items ALTER COLUMN line_total TYPE numeric(14,3);

CREATE TABLE IF NOT EXISTS order_item_toppings (
  id            serial PRIMARY KEY,
  order_item_id int NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  topping_id    text,
  name          text NOT NULL,
  price         numeric(14,3) NOT NULL DEFAULT 0
);

ALTER TABLE order_item_toppings ALTER COLUMN price TYPE numeric(14,3);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status ON orders(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_item_toppings_item ON order_item_toppings(order_item_id);
