-- Pa Auan Shop - Neon PostgreSQL import (current)
-- Generated from src/sql/schema.sql and src/sql/seed.sql.
-- Paste this entire file into Neon SQL Editor and click Run.
-- Safe to run again: schema migrations are idempotent and seed runs only when categories is empty.

BEGIN;

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

CREATE TABLE IF NOT EXISTS topping_stock (
  topping_id text PRIMARY KEY REFERENCES toppings(id) ON DELETE CASCADE,
  stock_qty  int NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  unit       text NOT NULL DEFAULT 'หน่วย',
  low_at     int NOT NULL DEFAULT 6,
  active     boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- นำท็อปปิ้งที่มีอยู่เข้าสู่ทะเบียนสต๊อก โดยไม่สมมติยอดคงเหลือจริง
INSERT INTO topping_stock (topping_id, stock_qty, unit)
SELECT id, 0, 'หน่วย' FROM toppings
ON CONFLICT (topping_id) DO NOTHING;

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

DO $seed$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM categories) THEN
-- ===================================================================
-- pa-auan-shop-api : seed data (แปลงมาจาก src/data/mockData.ts เดิม)
-- ===================================================================

-- categories
INSERT INTO categories (id, label) VALUES
  ('bualoy', 'บัวลอย'),
  ('chaokuay', 'เฉาก๊วย'),
  ('tubtim', 'ทับทิมกรอบ'),
  ('soymilk', 'น้ำแป๊ะอ้วน'),
  ('dessert', 'ขนมหวาน')
ON CONFLICT (id) DO NOTHING;

-- products
INSERT INTO products (id, name, price, category_id, image, bestseller, recommended) VALUES
  ('bl1', 'บัวลอยไข่หวาน', 35, 'bualoy', '/images/menu-bl1.png', true, true),
  ('bl2', 'บัวลอยภูเขาไฟ', 35, 'bualoy', '/images/menu-bl2.png', true, true),
  ('bl3', 'บัวลอยนมสด', 35, 'bualoy', '/images/menu-bl3.png', true, true),
  ('bl4', 'บัวลอยชาไทย', 35, 'bualoy', '/images/menu-bl4.png', false, true),
  ('bl5', 'บัวลอยมะพร้าวอ่อน', 30, 'bualoy', '/images/menu-bl5.png', false, false),
  ('bl6', 'บัวลอยไข่เค็มหวาน', 35, 'bualoy', '/images/menu-bl6.png', false, false),
  ('bl7', 'บัวลอยไข่เป็ดหวาน', 40, 'bualoy', '/images/menu-bl7.png', false, true),
  ('bl8', 'บัวลอยงาดำ', 40, 'bualoy', '/images/menu-bl8.png', false, false),
  ('bl9', 'บัวลอยกะทิ', 25, 'bualoy', '/images/menu-bl9.png', false, false),
  ('ck1', 'เฉาก๊วยน้ำเชื่อม', 25, 'chaokuay', '/images/menu-ck1.png', false, false),
  ('ck2', 'เฉาก๊วยน้ำลำไย', 35, 'chaokuay', '/images/menu-ck2.png', true, true),
  ('ck3', 'เฉาก๊วยนมสด', 30, 'chaokuay', '/images/menu-ck3.png', false, true),
  ('ck4', 'เฉาก๊วยชาไทย', 35, 'chaokuay', '/images/menu-ck4.png', false, false),
  ('ck5', 'เฉาก๊วยลำไย', 30, 'chaokuay', '/images/menu-ck5.png', false, false),
  ('ck6', 'เฉาก๊วยภูเขาไฟ', 40, 'chaokuay', '/images/menu-ck6.png', true, false),
  ('tt1', 'ทับทิมกรอบลำไย', 35, 'tubtim', '/images/menu-tt1.png', false, true),
  ('tt2', 'ทับทิมกรอบแป๊ะอ้วน', 40, 'tubtim', '/images/menu-tt2.png', true, false),
  ('tt3', 'ทับทิมกรอบบัวลอย', 55, 'tubtim', '/images/menu-tt3.png', false, false),
  ('sm1', 'น้ำเต้าหู้ร้อน', 35, 'soymilk', '/images/menu-sm1.png', false, false),
  ('sm2', 'น้ำเต้าหู้เย็น', 35, 'soymilk', '/images/menu-sm2.png', false, true),
  ('ds1', 'น้ำแป๊ะอ้วน 4 อย่าง', 35, 'dessert', '/images/menu-ds1.png', true, true),
  ('ds2', 'ลอดช่องกะทิ', 25, 'dessert', '/images/menu-ds2.png', false, true),
  ('ds3', 'ข้าวเหนียวมะม่วง', 40, 'dessert', '/images/menu-ds3.png', false, false),
  ('ds4', 'บัวลอยแป๊ะอ้วน', 35, 'dessert', '/images/menu-ds4.png', true, false)
ON CONFLICT (id) DO UPDATE SET image = EXCLUDED.image;

-- toppings (tier 5 บาท)
INSERT INTO toppings (id, name, price, image, tier) VALUES
  ('t1', 'ถั่วแดง', 5, '/images/topping-redbean-v2.png', 5),
  ('t2', 'ลูกเดือย', 5, '/images/topping-jobstears.png', 5),
  ('t3', 'ข้าวโพด', 5, '/images/topping-corn.png', 5),
  ('t4', 'เฉาก๊วย', 5, '/images/topping-grass-jelly.png', 5)
ON CONFLICT (id) DO UPDATE SET image = EXCLUDED.image;

-- toppings (tier 10 บาท)
INSERT INTO toppings (id, name, price, image, tier) VALUES
  ('t5', 'ฝอยทอง', 10, '/images/topping-foithong-v2.png', 10),
  ('t6', 'มะพร้าว', 10, '/images/topping-coconut-v2.png', 10),
  ('t7', 'ขนุน', 10, '/images/topping-jackfruit.png', 10),
  ('t8', 'เฉาก๊วยพิเศษ', 10, '/images/topping-grass-jelly-special.png', 10)
ON CONFLICT (id) DO UPDATE SET image = EXCLUDED.image;

-- stock (สูตรเดิมจาก mockData.ts: qty = ((i * 7) % 28) + 3)
INSERT INTO stock (product_id, stock_qty, unit) VALUES
  ('bl1', 3, 'ถ้วย'),
  ('bl2', 10, 'ถ้วย'),
  ('bl3', 17, 'ถ้วย'),
  ('bl4', 24, 'ถ้วย'),
  ('bl5', 3, 'ถ้วย'),
  ('bl6', 10, 'ถ้วย'),
  ('bl7', 17, 'ถ้วย'),
  ('bl8', 24, 'ถ้วย'),
  ('bl9', 3, 'ถ้วย'),
  ('ck1', 10, 'ถ้วย'),
  ('ck2', 17, 'ถ้วย'),
  ('ck3', 24, 'ถ้วย'),
  ('ck4', 3, 'ถ้วย'),
  ('ck5', 10, 'ถ้วย'),
  ('ck6', 17, 'ถ้วย'),
  ('tt1', 24, 'ถ้วย'),
  ('tt2', 3, 'ถ้วย'),
  ('tt3', 10, 'ถ้วย'),
  ('sm1', 17, 'ถ้วย'),
  ('sm2', 24, 'ถ้วย'),
  ('ds1', 3, 'ถ้วย'),
  ('ds2', 10, 'ถ้วย'),
  ('ds3', 17, 'ถ้วย'),
  ('ds4', 24, 'ถ้วย')
ON CONFLICT (product_id) DO NOTHING;

INSERT INTO topping_stock (topping_id, stock_qty, unit)
SELECT id, 20, 'หน่วย' FROM toppings
ON CONFLICT (topping_id) DO NOTHING;


-- ===================================================================
-- ออเดอร์ตัวอย่าง: ครอบคลุมทั้งบอร์ดครัว (pending/cooking/ready/served)
-- และประวัติขาย/ชำระเงินแล้ว (paid) ตาม mockData.ts เดิม
-- ===================================================================

-- ออเดอร์ที่อยู่ในคิวครัว (ยังไม่จ่ายเงิน)
INSERT INTO orders (id, table_name, order_date, order_time, status, note, total, paid, payment_verified, step_started_at) VALUES
  ('1D2026005', 'A01', '2026-05-15', '17:30', 'paid', 'เย็น', 35, true, true, now() - interval '2 minutes'),
  ('9C2026011', 'A08', '2026-05-15', '18:10', 'paid', 'เย็น', 35, true, true, now() - interval '1 minute'),
  ('5D2026005b', 'A05', '2026-05-15', '20:30', 'cooking', 'เย็น', 45, true, true, now() - interval '8 minutes'),
  ('123456789', 'A03', '2026-05-01', '16:30', 'ready', 'เย็น', 35, true, true, now() - interval '1 minute')
ON CONFLICT (id) DO NOTHING;

INSERT INTO orders (id, table_name, order_date, order_time, status, note, total, paid, payment_verified, served_at) VALUES
  ('5A2026005', 'A02', '2026-05-01', '16:30', 'served', 'เย็น', 35, true, true, '16:35'),
  ('987026003', 'A07', '2026-05-01', '15:50', 'served', 'ร้อน', 35, true, true, '15:58')
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (order_id, product_id, product_name, product_image, base_price, quantity, temperature, line_total) VALUES
  ('1D2026005', 'bl3', 'บัวลอยนมสด', '/images/food-bualoy.png', 35, 1, 'cold', 35),
  ('9C2026011', 'ck1', 'เฉาก๊วยน้ำเชื่อม', '/images/food-chaokuay.png', 25, 1, 'cold', 35),
  ('5D2026005b', 'bl3', 'บัวลอยนมสด', '/images/food-bualoy.png', 35, 1, 'cold', 45),
  ('123456789', 'bl2', 'บัวลอยภูเขาไฟ', '/images/food-bualoy.png', 35, 1, 'cold', 35),
  ('5A2026005', 'bl2', 'บัวลอยภูเขาไฟ', '/images/food-bualoy.png', 35, 1, 'cold', 35),
  ('987026003', 'sm1', 'น้ำเต้าหู้ร้อน', '/images/food-soymilk.png', 35, 1, 'hot', 35);

-- ท็อปปิ้งของออเดอร์ 9C2026011 (มะพร้าว 10 บาท) และ 5D2026005b (ฝอยทอง 10 บาท)
INSERT INTO order_item_toppings (order_item_id, topping_id, name, price)
SELECT id, 't6', 'มะพร้าว', 10 FROM order_items WHERE order_id = '9C2026011';

INSERT INTO order_item_toppings (order_item_id, topping_id, name, price)
SELECT id, 't5', 'ฝอยทอง', 10 FROM order_items WHERE order_id = '5D2026005b';

-- ประวัติการขาย / ชำระเงินแล้ว (paid = true)
INSERT INTO orders (id, table_name, order_date, order_time, status, total, paid, payment_verified) VALUES
  ('SD2026005', 'A05', '2026-05-15', '20:30', 'served', 45, true, true),
  ('SD2026010', 'A10', '2026-05-25', '21:20', 'served', 35, true, true),
  ('SD2026001', 'A01', '2026-05-15', '17:30', 'served', 35, true, true),
  ('SD2026011', 'A01', '2026-05-31', '18:30', 'served', 40, true, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (order_id, product_id, product_name, product_image, base_price, quantity, temperature, line_total) VALUES
  ('SD2026005', 'bl3', 'บัวลอยนมสด', '/images/food-bualoy.png', 45, 1, 'cold', 45),
  ('SD2026010', 'ck2', 'เฉาก๊วยน้ำลำไย', '/images/food-chaokuay.png', 35, 1, 'cold', 35),
  ('SD2026001', 'tt1', 'ทับทิมกรอบลำไย', '/images/food-tubtim.png', 35, 1, 'cold', 35),
  ('SD2026011', 'sm2', 'น้ำเต้าหู้เย็น', '/images/food-soymilk.png', 40, 1, 'cold', 40);

-- Keep demo orders compatible with the separated payment/fulfillment model.
UPDATE orders
SET payment_status = CASE WHEN paid THEN 'succeeded' ELSE 'pending' END,
    fulfillment_status = CASE
      WHEN status = 'paid' THEN 'queued'
      WHEN status IN ('cooking','ready','served','cancelled') THEN status
      ELSE 'not_started'
    END,
    currency = 'THB', currency_exponent = 2,
    amount_minor = round(total * 100)::bigint
WHERE id IN (
  '1D2026005','9C2026011','5D2026005b','123456789','5A2026005','987026003',
  'SD2026005','SD2026010','SD2026001','SD2026011'
);
  ELSE
    RAISE NOTICE 'Seed skipped: database already contains categories.';
  END IF;
END;
$seed$;

COMMIT;
