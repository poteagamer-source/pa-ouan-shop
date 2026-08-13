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
