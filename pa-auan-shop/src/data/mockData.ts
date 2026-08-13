/** ข้อมูลจำลองเก่าสำหรับ component legacy เท่านั้น; หน้าระบบจริงต้องโหลดผ่าน API */
import type { CategoryId, Product, Topping } from "../types";
import { foodImageByCategory, images } from "./images";

export const SHOP_NAME = "ร้านบัวลอยแป๊ะอ้วน สาขาหาดใหญ่";
export const SHOP_SHORT = "ร้านบัวลอยแป๊ะอ้วน";

export const categories: { id: CategoryId; label: string }[] = [
  { id: "bualoy", label: "บัวลอย" },
  { id: "chaokuay", label: "เฉาก๊วย" },
  { id: "tubtim", label: "ทับทิมกรอบ" },
  { id: "soymilk", label: "น้ำแป๊ะอ้วน" },
  { id: "dessert", label: "ขนมหวาน" },
];

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

const product = (
  id: string,
  name: string,
  price: number,
  category: CategoryId,
  flags?: { bestseller?: boolean; recommended?: boolean },
): Product => ({
  id,
  name,
  price,
  category,
  image: foodImageByCategory(category),
  bestseller: flags?.bestseller,
  recommended: flags?.recommended,
});

export const products: Product[] = [
  product("bl1", "บัวลอยไข่หวาน", 35, "bualoy", { bestseller: true, recommended: true }),
  product("bl2", "บัวลอยภูเขาไฟ", 35, "bualoy", { bestseller: true, recommended: true }),
  product("bl3", "บัวลอยนมสด", 35, "bualoy", { bestseller: true, recommended: true }),
  product("bl4", "บัวลอยชาไทย", 35, "bualoy", { recommended: true }),
  product("bl5", "บัวลอยมะพร้าวอ่อน", 30, "bualoy"),
  product("bl6", "บัวลอยไข่เค็มหวาน", 35, "bualoy"),
  product("bl7", "บัวลอยไข่เป็ดหวาน", 40, "bualoy", { recommended: true }),
  product("bl8", "บัวลอยงาดำ", 40, "bualoy"),
  product("bl9", "บัวลอยกะทิ", 25, "bualoy"),
  product("ck1", "เฉาก๊วยน้ำเชื่อม", 25, "chaokuay"),
  product("ck2", "เฉาก๊วยน้ำลำไย", 35, "chaokuay", { recommended: true, bestseller: true }),
  product("ck3", "เฉาก๊วยนมสด", 30, "chaokuay", { recommended: true }),
  product("ck4", "เฉาก๊วยชาไทย", 35, "chaokuay"),
  product("ck5", "เฉาก๊วยลำไย", 30, "chaokuay"),
  product("ck6", "เฉาก๊วยภูเขาไฟ", 40, "chaokuay", { bestseller: true }),
  product("tt1", "ทับทิมกรอบลำไย", 35, "tubtim", { recommended: true }),
  product("tt2", "ทับทิมกรอบแป๊ะอ้วน", 40, "tubtim", { bestseller: true }),
  product("tt3", "ทับทิมกรอบบัวลอย", 55, "tubtim"),
  product("sm1", "น้ำเต้าหู้ร้อน", 35, "soymilk"),
  product("sm2", "น้ำเต้าหู้เย็น", 35, "soymilk", { recommended: true }),
  product("ds1", "น้ำแป๊ะอ้วน 4 อย่าง", 35, "dessert", { bestseller: true, recommended: true }),
  product("ds2", "ลอดช่องกะทิ", 25, "dessert", { recommended: true }),
  product("ds3", "ข้าวเหนียวมะม่วง", 40, "dessert"),
  product("ds4", "บัวลอยแป๊ะอ้วน", 35, "dessert", { bestseller: true }),
];

export const toppings5: Topping[] = [
  { id: "t1", name: "ถั่วแดง", price: 5, image: images.topping.redbean },
  { id: "t2", name: "ลูกเดือย", price: 5, image: images.food.bualoy },
  { id: "t3", name: "ข้าวโพด", price: 5, image: images.food.dessert },
  { id: "t4", name: "เฉาก๊วย", price: 5, image: images.food.chaokuay },
];

export const toppings10: Topping[] = [
  { id: "t5", name: "ฝอยทอง", price: 10, image: images.topping.foithong },
  { id: "t6", name: "มะพร้าว", price: 10, image: images.topping.coconut },
  { id: "t7", name: "ขนุน", price: 10, image: images.food.dessert },
  { id: "t8", name: "เฉาก๊วยพิเศษ", price: 10, image: images.food.chaokuay },
];

/** สต๊อกสินค้าสำเร็จรูป (ต่อยอด products เดิม) */
export const stockItems = products.map((p, i) => {
  const qty = ((i * 7) % 28) + 3;
  return {
    ...p,
    stockQty: qty,
    unit: "ถ้วย",
    active: true,
    status: qty <= 6 ? ("low" as const) : ("enough" as const),
  };
});

export interface SalesOrderItem {
  name: string;
  qty: number;
  price: number;
  image: string;
}

export interface SalesOrder {
  id: string;
  table: string;
  total: number;
  date: string;
  time: string;
  paymentVerified: boolean;
  slipImage?: string;
  items: SalesOrderItem[];
}

export const salesOrders: SalesOrder[] = [
  {
    id: "SD2026005",
    table: "A05",
    total: 45,
    date: "15-05-2026",
    time: "20:30 น.",
    paymentVerified: true,
    items: [{ name: "บัวลอยนมสด", qty: 1, price: 45, image: images.food.bualoy }],
  },
  {
    id: "SD2026010",
    table: "A10",
    total: 35,
    date: "25-05-2026",
    time: "21:20 น.",
    paymentVerified: true,
    items: [{ name: "เฉาก๊วยน้ำลำไย", qty: 1, price: 35, image: images.food.chaokuay }],
  },
  {
    id: "SD2026001",
    table: "A01",
    total: 35,
    date: "15-05-2026",
    time: "17:30 น.",
    paymentVerified: true,
    items: [{ name: "ทับทิมกรอบลำไย", qty: 1, price: 35, image: images.food.tubtim }],
  },
  {
    id: "SD2026011",
    table: "A01",
    total: 40,
    date: "31-05-2026",
    time: "18:30 น.",
    paymentVerified: true,
    items: [{ name: "น้ำเต้าหู้เย็น", qty: 1, price: 40, image: images.food.soymilk }],
  },
];

export const menuItemsAdmin = [
  { id: "m1", name: "บัวลอยฝอยทอง", price: 35, image: images.food.bualoy },
  { id: "m2", name: "ลูกเดือย", price: 5, image: images.topping.redbean },
];

/** รายการตัวอย่างในตะกร้า / ชำระเงิน (ตาม PDF) */
export const demoCartItem = {
  productId: "bl3",
  productName: "บัวลอยนมสด",
  productImage: images.food.bualoy,
  basePrice: 35,
  quantity: 1,
  temperature: "cold" as const,
  toppings: [{ id: "t5", name: "ฝอยทอง", price: 10 }],
};

/* ------------------------------------------------------------------ */
/* โซนห้องครัว / พนักงานเสิร์ฟ — workflow: ใหม่ → กำลังทำ → พร้อมเสิร์ฟ → เสิร์ฟแล้ว */
/* ------------------------------------------------------------------ */

export type KitchenOrderStatus = "new" | "cooking" | "ready" | "served";

export interface KitchenOrderItem {
  id: string;
  name: string;
  qty: number;
  price: number;
  image: string;
}

export interface KitchenOrder {
  id: string;
  table: string;
  date: string;
  time: string;
  note: "เย็น" | "ร้อน";
  items: KitchenOrderItem[];
  total: number;
  status: KitchenOrderStatus;
  /** นาทีที่ผ่านมานับจากเริ่มขั้นตอนปัจจุบัน ใช้เป็นค่าตั้งต้นของตัวจับเวลา */
  stepStartedMinutesAgo: number;
  servedAt?: string;
}

export const initialKitchenOrders: KitchenOrder[] = [
  {
    id: "1D2026005",
    table: "A01",
    date: "15-05-2026",
    time: "17:30",
    note: "เย็น",
    items: [{ id: "i1", name: "บัวลอยนมสด", qty: 1, price: 35, image: images.food.bualoy }],
    total: 35,
    status: "new",
    stepStartedMinutesAgo: 2,
  },
  {
    id: "9C2026011",
    table: "A08",
    date: "15-05-2026",
    time: "18:10",
    note: "เย็น",
    items: [
      { id: "i2", name: "เฉาก๊วยน้ำเชื่อม", qty: 1, price: 25, image: images.food.chaokuay },
      { id: "i3", name: "มะพร้าว (ท็อปปิ้ง)", qty: 1, price: 10, image: images.topping.coconut },
    ],
    total: 35,
    status: "new",
    stepStartedMinutesAgo: 1,
  },
  {
    id: "5D2026005",
    table: "A05",
    date: "15-05-2026",
    time: "20:30",
    note: "เย็น",
    items: [
      { id: "i4", name: "บัวลอยนมสด", qty: 1, price: 35, image: images.food.bualoy },
      { id: "i5", name: "ฝอยทอง (ท็อปปิ้ง)", qty: 1, price: 10, image: images.topping.foithong },
    ],
    total: 45,
    status: "cooking",
    stepStartedMinutesAgo: 8,
  },
  {
    id: "123456789",
    table: "A03",
    date: "01-05-2026",
    time: "16:30",
    note: "เย็น",
    items: [{ id: "i6", name: "บัวลอยภูเขาไฟ", qty: 1, price: 35, image: images.food.bualoy }],
    total: 35,
    status: "ready",
    stepStartedMinutesAgo: 1,
  },
  {
    id: "5A2026005",
    table: "A02",
    date: "01-05-2026",
    time: "16:30",
    note: "เย็น",
    items: [{ id: "i7", name: "บัวลอยภูเขาไฟ", qty: 1, price: 35, image: images.food.bualoy }],
    total: 35,
    status: "served",
    stepStartedMinutesAgo: 0,
    servedAt: "16:35",
  },
  {
    id: "987026003",
    table: "A07",
    date: "01-05-2026",
    time: "15:50",
    note: "ร้อน",
    items: [{ id: "i8", name: "น้ำเต้าหู้ร้อน", qty: 1, price: 35, image: images.food.soymilk }],
    total: 35,
    status: "served",
    stepStartedMinutesAgo: 0,
    servedAt: "15:58",
  },
];

export const kitchenStatusMeta: Record<
  KitchenOrderStatus,
  { label: string; text: string; bg: string; border: string; dot: string }
> = {
  new: { label: "ออเดอร์เข้าใหม่", text: "text-red-500", bg: "bg-red-50", border: "border-red-400", dot: "bg-red-500" },
  cooking: { label: "กำลังทำอาหาร", text: "text-amber-500", bg: "bg-amber-50", border: "border-amber-400", dot: "bg-amber-500" },
  ready: { label: "พร้อมเสิร์ฟ", text: "text-green-600", bg: "bg-green-50", border: "border-green-400", dot: "bg-green-500" },
  served: { label: "เสิร์ฟแล้ว", text: "text-blue-500", bg: "bg-blue-50", border: "border-blue-400", dot: "bg-blue-500" },
};
/** ข้อมูลจำลองเก่าสำหรับ component legacy เท่านั้น; หน้าระบบจริงต้องโหลดผ่าน API */
