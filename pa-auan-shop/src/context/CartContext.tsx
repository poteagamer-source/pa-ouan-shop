import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartItem } from "../types";

/** API ของตะกร้าที่ component ลูกค้าเรียกใช้ร่วมกัน */
interface CartContextValue {
  /** แต่ละการกดเพิ่มเป็นคนละบรรทัด เพื่อรักษาท็อปปิ้ง/อุณหภูมิของเมนูนั้น */
  items: CartItem[];
  /** จำนวนบรรทัดในตะกร้า ใช้กับ badge รูปรถเข็น */
  cartCount: number;
  /** ยอดรวม base price + toppings คูณ quantity ของทุกบรรทัด */
  total: number;
  addItem: (item: CartItem) => void;
  clearCart: () => void;
  /** id ของออเดอร์ล่าสุดที่สร้างไปแล้ว (ใช้ติดตามสถานะในหน้า OrderStatusPage) */
  lastOrderId: string | null;
  setLastOrderId: (id: string | null) => void;
}

// null ช่วยป้องกันการใช้ useCart นอก CartProvider
const CartContext = createContext<CartContextValue | null>(null);

/** เก็บตะกร้าในหน่วยความจำตลอดช่วงที่ React app เปิดอยู่ */
export function CartProvider({ children }: { children: ReactNode }) {
  // items คือรายการที่ยังไม่สร้างออเดอร์; lastOrderId ใช้ติดตามออเดอร์หลังออกจาก Stripe
  const [items, setItems] = useState<CartItem[]>([]);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  // ไม่รวมสินค้าชื่อเดียวกัน เพราะ topping/temperature ของแต่ละรายการอาจต่างกัน
  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => [...prev, item]);
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  // คำนวณใหม่เฉพาะเมื่อ items เปลี่ยน ไม่เก็บยอดซ้ำใน state เพื่อป้องกันข้อมูลไม่ตรงกัน
  const total = useMemo(
    () =>
      items.reduce((sum, item) => {
        const toppingTotal = item.toppings.reduce((s, t) => s + t.price, 0);
        return sum + (item.basePrice + toppingTotal) * item.quantity;
      }, 0),
    [items],
  );

  // badge นับจำนวนรายการแยก ไม่ใช่ผลรวม quantity
  const cartCount = items.length;

  const value = useMemo(
    () => ({ items, cartCount, total, addItem, clearCart, lastOrderId, setLastOrderId }),
    [items, cartCount, total, addItem, clearCart, lastOrderId],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/** Hook หลักสำหรับอ่าน/แก้ตะกร้า พร้อม guard แจ้งตำแหน่ง Provider ที่หาย */
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
