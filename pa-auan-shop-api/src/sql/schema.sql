-- ===================================================================
-- pa-auan-shop-api : schema
-- ===================================================================

CREATE TABLE IF NOT EXISTS categories (
  id    text PRIMARY KEY,
  label text NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id          text PRIMARY KEY,
  name        text NOT NULL,
  price       numeric(10,2) NOT NULL,
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
  price numeric(10,2) NOT NULL,
  image text,
  tier  int NOT NULL -- 5 or 10 (บาท)
);

-- สต๊อกต่อสินค้า 1 แถวต่อ 1 product
CREATE TABLE IF NOT EXISTS stock (
  product_id text PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  stock_qty  int NOT NULL DEFAULT 0,
  unit       text NOT NULL DEFAULT 'ก้อน',
  low_at     int NOT NULL DEFAULT 6, -- ต่ำกว่าหรือเท่ากับค่านี้ = สถานะ low
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ออเดอร์ 1 ใบ ครอบคลุมทั้ง workflow ลูกค้า (pending→...→paid)
-- และ workflow ครัว/พนักงานเสิร์ฟ (new/cooking/ready/served ก็คือ pending/cooking/ready/served)
CREATE TABLE IF NOT EXISTS orders (
  id                text PRIMARY KEY,
  table_name        text NOT NULL,
  order_date        date NOT NULL DEFAULT current_date,
  order_time        time NOT NULL DEFAULT current_time,
  status            text NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','cooking','ready','served','paid')),
  note              text CHECK (note IN ('เย็น','ร้อน')),
  total             numeric(10,2) NOT NULL DEFAULT 0,
  paid              boolean NOT NULL DEFAULT false,
  payment_verified  boolean NOT NULL DEFAULT false,
  slip_image        text,
  step_started_at   timestamptz NOT NULL DEFAULT now(),
  served_at         time,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id            serial PRIMARY KEY,
  order_id      text NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id    text REFERENCES products(id),
  product_name  text NOT NULL,
  product_image text,
  base_price    numeric(10,2) NOT NULL,
  quantity      int NOT NULL DEFAULT 1,
  temperature   text CHECK (temperature IN ('cold','hot')),
  line_total    numeric(10,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS order_item_toppings (
  id            serial PRIMARY KEY,
  order_item_id int NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  topping_id    text,
  name          text NOT NULL,
  price         numeric(10,2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_item_toppings_item ON order_item_toppings(order_item_id);
