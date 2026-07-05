import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { fetchOrders, updateOrderStatus } from "../lib/api";
import type { Order, OrderStatus } from "../types";
import type { KitchenOrderStatus } from "../config/constants";

/** สินค้า 1 รายการในออเดอร์ ตามที่ใช้แสดงผลฝั่งครัว/พนักงานเสิร์ฟ */
export interface KitchenOrderItem {
  id: string;
  name: string;
  qty: number;
  price: number;
  image: string;
}

/** ออเดอร์ ตามรูปแบบที่คอมโพเนนต์ฝั่งครัว/พนักงานเสิร์ฟใช้อยู่เดิม (แปลงมาจาก Order ของ API) */
export interface KitchenOrder {
  id: string;
  table: string;
  date: string;
  time: string;
  note: "เย็น" | "ร้อน";
  items: KitchenOrderItem[];
  total: number;
  status: KitchenOrderStatus;
  stepStartedMinutesAgo: number;
  servedAt?: string | null;
}

/** backend ใช้ "pending" แต่ฝั่งครัวเรียก "new" */
const API_TO_UI_STATUS: Record<string, KitchenOrderStatus> = {
  pending: "new",
  cooking: "cooking",
  ready: "ready",
  served: "served",
};
const UI_TO_API_STATUS: Record<KitchenOrderStatus, OrderStatus> = {
  new: "pending",
  cooking: "cooking",
  ready: "ready",
  served: "served",
};

function minutesAgoFromTime(time: string): number {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  const now = new Date();
  const started = new Date(now);
  started.setHours(h, m, 0, 0);
  const diffMinutes = Math.floor((now.getTime() - started.getTime()) / 60000);
  return diffMinutes > 0 ? diffMinutes : 0;
}

function orderToKitchenOrder(order: Order): KitchenOrder {
  return {
    id: order.id,
    table: order.table,
    date: order.date,
    time: order.time?.slice(0, 5) ?? order.time,
    note: order.note === "ร้อน" ? "ร้อน" : "เย็น",
    items: order.items.map((item) => ({
      id: String(item.id),
      name: item.name,
      qty: item.qty,
      price: item.price,
      image: item.image ?? "",
    })),
    total: order.total,
    status: API_TO_UI_STATUS[order.status] ?? "new",
    stepStartedMinutesAgo: minutesAgoFromTime(order.time?.slice(0, 5) ?? order.time),
    servedAt: order.servedAt,
  };
}

const NEXT_STATUS: Record<KitchenOrderStatus, KitchenOrderStatus | null> = {
  new: "cooking",
  cooking: "ready",
  ready: "served",
  served: null,
};

const POLL_INTERVAL_MS = 5000;
const ACTIVE_STATUSES: OrderStatus[] = ["pending", "cooking", "ready", "served"];

interface KitchenOrdersContextValue {
  orders: KitchenOrder[];
  counts: Record<KitchenOrderStatus, number>;
  byStatus: (status: KitchenOrderStatus) => KitchenOrder[];
  /** เลื่อนออเดอร์ไปยังขั้นตอนถัดไป (ใหม่ → กำลังทำ → พร้อมเสิร์ฟ → เสิร์ฟแล้ว) */
  advance: (id: string) => void;
  loading: boolean;
  error: string | null;
}

const KitchenOrdersContext = createContext<KitchenOrdersContextValue | null>(null);

export function KitchenOrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const data = await fetchOrders({ status: ACTIVE_STATUSES });
      setOrders(data.map(orderToKitchenOrder));
      setError(null);
    } catch (err) {
      console.error("โหลดออเดอร์ห้องครัวไม่สำเร็จ:", err);
      setError(err instanceof Error ? err.message : "โหลดออเดอร์ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    pollRef.current = setInterval(loadOrders, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadOrders]);

  const advance = useCallback(
    (id: string) => {
      setOrders((prev) => {
        const order = prev.find((o) => o.id === id);
        const next = order ? NEXT_STATUS[order.status] : null;
        if (!order || !next) return prev;

        // อัปเดต backend แบบ optimistic แล้วซิงค์รอบถัดไปจาก polling
        updateOrderStatus(id, UI_TO_API_STATUS[next]).catch((err) => {
          console.error("อัปเดตสถานะออเดอร์ไม่สำเร็จ:", err);
          loadOrders();
        });

        return prev.map((o) =>
          o.id === id
            ? { ...o, status: next, stepStartedMinutesAgo: 0, servedAt: next === "served" ? o.servedAt : o.servedAt }
            : o,
        );
      });
    },
    [loadOrders],
  );

  const counts = useMemo(() => {
    const result: Record<KitchenOrderStatus, number> = { new: 0, cooking: 0, ready: 0, served: 0 };
    orders.forEach((order) => {
      result[order.status] += 1;
    });
    return result;
  }, [orders]);

  const byStatus = useCallback(
    (status: KitchenOrderStatus) => orders.filter((order) => order.status === status),
    [orders],
  );

  const value: KitchenOrdersContextValue = { orders, counts, byStatus, advance, loading, error };

  return <KitchenOrdersContext.Provider value={value}>{children}</KitchenOrdersContext.Provider>;
}

export function useKitchenOrders() {
  const ctx = useContext(KitchenOrdersContext);
  if (!ctx) {
    throw new Error("useKitchenOrders ต้องถูกเรียกใช้ภายใน KitchenOrdersProvider เท่านั้น");
  }
  return ctx;
}
