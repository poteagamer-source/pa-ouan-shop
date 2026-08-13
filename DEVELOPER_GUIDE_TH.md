# คู่มือโครงสร้างโค้ดร้านบัวลอยแป๊ะอ้วน

ไฟล์นี้เป็นแผนที่สำหรับหาจุดแก้ไขอย่างรวดเร็ว ส่วนรายละเอียดระดับฟังก์ชันจะมีคอมเมนต์กำกับอยู่ในไฟล์หลักอีกชั้นหนึ่ง

## ภาพรวมระบบ

- `pa-auan-shop/` คือหน้าเว็บ React/Vite ทั้งลูกค้าและพนักงาน
- `pa-auan-shop-api/` คือ Express API, การเชื่อม PostgreSQL/Neon, Stripe และ realtime
- `render.yaml` คือคำสั่ง build/start และรายการ environment variables บน Render

## จุดแก้หน้าลูกค้า

- `src/pages/customer/HomePage.tsx` โหลดและกรองรายการเมนู
- `src/pages/customer/ProductDetailPage.tsx` เลือกจำนวน อุณหภูมิ และท็อปปิ้ง
- `src/pages/customer/CartPage.tsx` ตะกร้าและทางไปชำระเงิน
- `src/pages/customer/PaymentPage.tsx` สร้างออเดอร์และ Stripe Checkout
- `src/pages/customer/OrderStatusPage.tsx` ติดตามสถานะชำระเงิน/ทำอาหาร
- `src/components/customer/` คือ header, bottom navigation, category และ product card
- `src/context/CartContext.tsx` คือข้อมูลตะกร้าที่ใช้ร่วมกันทุกหน้าลูกค้า

## จุดแก้หน้าพนักงาน

- `src/pages/staff/MenuManagement.tsx` เพิ่ม/แก้ไข/ลบสินค้าและท็อปปิ้ง
- `src/pages/staff/StockPage.tsx` จัดการจำนวนคงเหลือและเปิด/ปิดขาย
- `src/pages/staff/PurchaseOrdersPage.tsx` รายการออเดอร์ที่จ่ายเงินแล้ว
- `src/pages/staff/SalesReportPage.tsx` รายงานยอดขายจริงแบบ realtime
- `src/context/KitchenOrdersContext.tsx` โหลดออเดอร์และเลื่อนสถานะ ครัว → พร้อมเสิร์ฟ → เสิร์ฟแล้ว
- `src/components/staff/` คือ layout, sidebar, stat cards และการ์ดงานครัว/พนักงานเสิร์ฟ

## ระบบภาษา

- `src/context/LanguageContext.tsx` เก็บภาษาปัจจุบันและพจนานุกรมไทย/อังกฤษ
- ข้อความ UI ใหม่ควรเขียนเป็น `t("ข้อความไทย", "English text")`
- ชื่อสินค้า/ท็อปปิ้งจากฐานข้อมูลใช้ `t(product.name)` หรือ `t(topping.name)`
- หากเพิ่มชื่อเมนูใหม่ ต้องเพิ่มคำแปลใน `translations` ด้วย มิฉะนั้นภาษาอังกฤษจะแสดงชื่อเดิม

## API และฐานข้อมูล

- `src/server.js` ประกอบ middleware และ mount route ทั้งหมด
- `src/routes/products.js` CRUD สินค้า
- `src/routes/toppings.js` CRUD ท็อปปิ้ง
- `src/routes/stock.js` จำนวนสต๊อกและสถานะเปิดขาย
- `src/routes/orders.js` สร้าง/อ่านออเดอร์และเปลี่ยนขั้นตอนทำอาหาร
- `src/routes/payments.js` สร้าง payment session
- `src/routes/webhooks.js` รับ webhook จาก Stripe
- `src/payments/processor.js` ตรวจ event และอัปเดตสถานะชำระเงิน
- `src/routes/sales.js` ดึงเฉพาะยอดขายที่ชำระสำเร็จ
- `src/sql/schema.sql` schema และ migration ที่รันทุก deploy
- `src/sql/seed.sql` ข้อมูลตั้งต้นเมนู/ท็อปปิ้ง ไม่ควรใส่ออเดอร์ตัวอย่างในระบบจริง

## Realtime

- Backend เรียก `publishUpdate(resource, action, id)` หลังข้อมูลเปลี่ยน
- Frontend เรียก `subscribeToUpdates(...)` แล้วโหลดข้อมูลใหม่เมื่อ resource ที่สนใจเปลี่ยน
- มี polling สำรองในหน้าสำคัญ เผื่อ EventSource หลุดจาก Render

## ลำดับออเดอร์จริง

1. ลูกค้าเพิ่มรายการเข้า `CartContext`
2. หน้า Payment เรียก `POST /api/orders`
3. API คำนวณราคาใหม่จากฐานข้อมูลและสร้างออเดอร์สถานะ `pending`
4. API สร้าง Stripe Checkout Session
5. Stripe ส่ง webhook เมื่อจ่ายสำเร็จ
6. processor เปลี่ยน `payment_status` เป็น `succeeded` และ `fulfillment_status` เป็น `queued`
7. ครัวและพนักงานเสิร์ฟได้รับการอัปเดต realtime
8. รายงานยอดขายนับเฉพาะ `succeeded` หรือ `partially_refunded`

## Environment variables สำคัญ

- `DATABASE_URL` การเชื่อม Neon PostgreSQL
- `STRIPE_SECRET_KEY` Stripe secret key
- `STRIPE_WEBHOOK_SECRET` signing secret ที่ขึ้นต้นด้วย `whsec_`
- `PUBLIC_APP_URL` URL เว็บบน Render
- `SHOP_CURRENCY` ปกติใช้ `THB`
- `SHOP_CURRENCY_EXPONENT` สำหรับ THB ใช้ `2`

