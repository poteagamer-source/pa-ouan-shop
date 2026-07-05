# pa-auan-shop-api

Backend API (Node.js + Express + PostgreSQL/Neon) สำหรับร้านบัวลอยแป๊ะอ้วน
ครอบคลุม 4 ส่วน: **เมนูสินค้า (Menu), ออเดอร์/ครัว (Orders/Kitchen), สต๊อก (Stock), ยอดขาย (Sales)**

---

## ⚠️ ก่อนเริ่ม: เรื่องความปลอดภัยของ connection string

ถ้า connection string ของคุณเคยปรากฏในสกรีนช็อตหรือส่งให้ใครไปแล้ว
**ให้ไปที่ Neon Console → Reset password ก่อน** แล้วค่อยเอาอันใหม่มาใช้
(Dashboard → Connect → Reset password ข้าง Role)

---

## 1) ติดตั้ง

```bash
cd pa-auan-shop-api
npm install
cp .env.example .env
```

เปิดไฟล์ `.env` แล้วใส่ `DATABASE_URL` จาก Neon Console
(หน้า Connect to your database → copy connection string ที่มี password จริง)

```
DATABASE_URL=postgresql://neondb_owner:<password>@<host>/neondb?sslmode=require&channel_binding=require
```

## 2) สร้างตาราง + ใส่ข้อมูลตัวอย่าง

```bash
npm run db:migrate   # สร้างตารางตาม src/sql/schema.sql
npm run db:seed      # ใส่ข้อมูลเมนู/สต๊อก/ออเดอร์ตัวอย่าง ตาม src/sql/seed.sql
```

รันซ้ำได้ปลอดภัย (ใช้ `ON CONFLICT DO NOTHING`) ยกเว้นส่วน orders ตัวอย่างที่ใส่ครั้งเดียวพอ

## 3) รันเซิร์ฟเวอร์

```bash
npm run dev     # dev mode (auto-restart เมื่อแก้โค้ด)
npm start       # production
```

เซิร์ฟเวอร์รันที่ `http://localhost:4000` (แก้พอร์ตได้ที่ `.env` → `PORT`)

ทดสอบว่าเชื่อม DB สำเร็จ:

```bash
curl http://localhost:4000/api/health
curl http://localhost:4000/api/products
```

## 4) ต่อกับ frontend (pa-auan-shop)

ใน `.env` ตั้ง `CORS_ORIGIN=http://localhost:5173` (ค่า default ของ Vite dev server)
ให้ตรงกับพอร์ตที่ frontend รันอยู่จริง

ฝั่ง frontend เวลาจะดึงข้อมูล ให้ยิงไปที่ `http://localhost:4000/api/...` แทนการ import จาก `mockData.ts`
(ถ้าต้องการ ให้บอกในแชทได้เลย จะช่วยแก้โค้ดฝั่ง frontend ให้ต่อ API จริงแทน mock data)

---

## API Reference

### เมนูสินค้า — `/api/categories`, `/api/products`

| Method | Path | คำอธิบาย |
|---|---|---|
| GET | `/api/categories` | รายการหมวดหมู่ |
| GET | `/api/products?category=&active=` | รายการสินค้า (filter ได้) |
| GET | `/api/products/:id` | สินค้าชิ้นเดียว |
| POST | `/api/products` | เพิ่มเมนูใหม่ `{id,name,price,category,image,bestseller,recommended}` |
| PUT | `/api/products/:id` | แก้ไขเมนู |
| DELETE | `/api/products/:id` | ลบเมนู |
| GET | `/api/toppings?tier=5\|10` | รายการท็อปปิ้ง |

### สต๊อก — `/api/stock`

| Method | Path | คำอธิบาย |
|---|---|---|
| GET | `/api/stock` | สต๊อกทุกสินค้า (รวม status `low`/`enough`) |
| PUT | `/api/stock/:productId` | ตั้งค่าจำนวน/หน่วย/เปิดปิดขาย `{stockQty, unit, active}` |
| PATCH | `/api/stock/:productId/adjust` | ปรับสต๊อกแบบ +/- เร็วๆ `{delta: -1}` |

### ออเดอร์ / ครัว — `/api/orders`

สถานะออเดอร์: `pending → cooking → ready → served → paid`
(`pending` ก็คือ "ออเดอร์ใหม่" ในบอร์ดครัว)

| Method | Path | คำอธิบาย |
|---|---|---|
| GET | `/api/orders?status=pending,cooking&date=&table=` | รายการออเดอร์ (filter ได้) |
| GET | `/api/orders/:id` | ออเดอร์เดียว พร้อมรายการสินค้า+ท็อปปิ้ง |
| POST | `/api/orders` | สร้างออเดอร์ใหม่จากตะกร้า (ตัดสต๊อกอัตโนมัติ) |
| PATCH | `/api/orders/:id/status` | เปลี่ยนสถานะ `{status: "cooking"}` — ใช้ในบอร์ดครัว/พนักงานเสิร์ฟ |
| PATCH | `/api/orders/:id/slip` | แนบรูปสลิปโอนเงิน `{slipImage}` |
| PATCH | `/api/orders/:id/verify-payment` | พนักงานยืนยันสลิปถูกต้อง → `paid=true` |

ตัวอย่าง POST `/api/orders`:

```json
{
  "table": "A05",
  "note": "เย็น",
  "items": [
    {
      "productId": "bl3",
      "productName": "บัวลอยนมสด",
      "productImage": "/images/food-bualoy.png",
      "basePrice": 35,
      "quantity": 1,
      "temperature": "cold",
      "toppings": [{ "id": "t5", "name": "ฝอยทอง", "price": 10 }]
    }
  ]
}
```

### ยอดขาย — `/api/sales`

| Method | Path | คำอธิบาย |
|---|---|---|
| GET | `/api/sales?from=&to=&table=` | ประวัติออเดอร์ที่จ่ายแล้ว |
| GET | `/api/sales/summary?from=&to=` | สรุปยอดขาย: รวม, รายวัน, รายหมวดหมู่, สินค้าขายดี (ใช้กับกราฟ Dashboard) |

---

## โครงสร้างตาราง (สรุป)

```
categories(id, label)
products(id, name, price, category_id → categories, image, bestseller, recommended, active)
toppings(id, name, price, image, tier)
stock(product_id → products, stock_qty, unit, low_at)
orders(id, table_name, order_date, order_time, status, note, total, paid, payment_verified, slip_image, served_at)
order_items(id, order_id → orders, product_id → products, product_name, base_price, quantity, temperature, line_total)
order_item_toppings(id, order_item_id → order_items, topping_id, name, price)
```

รายละเอียดเต็มดูที่ `src/sql/schema.sql`
