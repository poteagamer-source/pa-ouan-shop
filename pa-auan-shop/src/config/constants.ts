import type { CategoryId } from "../types";

/** ข้อมูล UI ล้วนๆ ที่ backend ไม่ได้เก็บ (ชื่อร้าน / โทนสีต่อหมวดหมู่ / สไตล์สถานะครัว) */

export const SHOP_NAME = "ร้านบัวลอยแป๊ะอ้วน สาขาหาดใหญ่";
export const SHOP_SHORT = "ร้านบัวลอยแป๊ะอ้วน";

/** โทนสีต่อหมวดหมู่ ใช้กับหน้าจัดการเมนู/สต๊อกสินค้าในโซนผู้จัดการ */
export const categoryMeta: Record<
  CategoryId,
  { label: string; text: string; bg: string; border: string }
> = {
  bualoy: { label: "บัวลอย", text: "text-brand", bg: "bg-brand-light", border: "border-brand" },
  chaokuay: { label: "เฉาก๊วย", text: "text-green-600", bg: "bg-green-50", border: "border-green-500" },
  tubtim: { label: "ทับทิมกรอบ", text: "text-red-500", bg: "bg-red-50", border: "border-red-400" },
  soymilk: { label: "น้ำแป๊ะอ้วน", text: "text-blue-500", bg: "bg-blue-50", border: "border-blue-400" },
  dessert: { label: "ขนมหวาน", text: "text-purple-500", bg: "bg-purple-50", border: "border-purple-400" },
};

/** สถานะออเดอร์ฝั่งครัว — "new" คือ order.status === "pending" ฝั่ง backend */
export type KitchenOrderStatus = "new" | "cooking" | "ready" | "served";

export const kitchenStatusMeta: Record<
  KitchenOrderStatus,
  { label: string; text: string; bg: string; border: string; dot: string }
> = {
  new: { label: "ออเดอร์เข้าใหม่", text: "text-red-500", bg: "bg-red-50", border: "border-red-400", dot: "bg-red-500" },
  cooking: { label: "กำลังทำอาหาร", text: "text-amber-500", bg: "bg-amber-50", border: "border-amber-400", dot: "bg-amber-500" },
  ready: { label: "พร้อมเสิร์ฟ", text: "text-green-600", bg: "bg-green-50", border: "border-green-400", dot: "bg-green-500" },
  served: { label: "เสิร์ฟแล้ว", text: "text-blue-500", bg: "bg-blue-50", border: "border-blue-400", dot: "bg-blue-500" },
};
