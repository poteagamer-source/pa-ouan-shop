# ร้านบัวลอยแป๊ะอ้วน — Frontend

React UI ตาม Draft GUI design (P05-624-509) สำหรับระบบสั่งซื้อและจัดการร้านบัวลอยแป๊ะอ้วน

## หน้าจอ

### ลูกค้า (มือถือ)
- `/menu` — หน้าแรก, หมวดหมู่, กริดเมนู
- `/product/:id` — สั่งอาหาร + ท็อปปิ้ง
- `/cart` — ตะกร้า
- `/payment` — ชำระเงิน (QR)
- `/order-status` — สถานะหลังชำระ (Dashboard ลูกค้า)

### พนักงาน (เดสก์ท็อป)
- `/staff` — Dashboard ผู้จัดการ (กราฟยอดขาย)
- `/staff/menu` — จัดการเมนู
- `/staff/kitchen` — ห้องครัว (Kanban)
- `/staff/waiter` — พนักงานเสิร์ฟ

## รันโปรเจกต

```bash
cd pa-auan-shop
npm install
npm run dev
```

เปิด http://localhost:5173 แล้วเลือกบทบาทจากหน้าแรก

## เทคโนโลยี

- React 19 + TypeScript + Vite
- Tailwind CSS 4
- React Router 7
- Recharts (กราฟ Dashboard)
- Lucide React (ไอคอน)
- ฟอนต์ Kanit (รองรับภาษาไทย)
