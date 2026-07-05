import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartItem } from "../types";

interface CartContextValue {
  items: CartItem[];
  cartCount: number;
  total: number;
  addItem: (item: CartItem) => void;
  clearCart: () => void;
  /** id ของออเดอร์ล่าสุดที่สร้างไปแล้ว (ใช้ติดตามสถานะในหน้า OrderStatusPage) */
  lastOrderId: string | null;
  setLastOrderId: (id: string | null) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => [...prev, item]);
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const total = useMemo(
    () =>
      items.reduce((sum, item) => {
        const toppingTotal = item.toppings.reduce((s, t) => s + t.price, 0);
        return sum + (item.basePrice + toppingTotal) * item.quantity;
      }, 0),
    [items],
  );

  const cartCount = items.length;

  const value = useMemo(
    () => ({ items, cartCount, total, addItem, clearCart, lastOrderId, setLastOrderId }),
    [items, cartCount, total, addItem, clearCart, lastOrderId],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
