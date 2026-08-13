/** ศูนย์กลางออเดอร์ครัว/waiter: fetch, realtime, polling, mapping status และคำสั่งเลื่อนขั้นตอน */
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
import { fetchOrders, subscribeToUpdates, updateOrderStatus } from "../lib/api";
import type { FulfillmentStatus, Order } from "../types";
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

/** ฝั่งครัวเรียก fulfillment status "queued" ว่า "new" */
const API_TO_UI_STATUS: Record<string, KitchenOrderStatus> = {
  queued: "new",
  cooking: "cooking",
  ready: "ready",
  served: "served",
};
const UI_TO_API_STATUS: Record<KitchenOrderStatus, FulfillmentStatus> = {
  new: "queued",
  cooking: "cooking",
  ready: "ready",
  served: "served",
};

function minutesAgoFromTime(time: string, stepStartedAt?: string | null): number {
  if (stepStartedAt) {
    const startedAt = new Date(stepStartedAt).getTime();
    if (!Number.isNaN(startedAt)) return Math.max(0, Math.floor((Date.now() - startedAt) / 60000));
  }
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
    status: API_TO_UI_STATUS[order.fulfillmentStatus] ?? "new",
    stepStartedMinutesAgo: minutesAgoFromTime(order.time?.slice(0, 5) ?? order.time, order.stepStartedAt),
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
const ACTIVE_STATUSES: FulfillmentStatus[] = ["queued", "cooking", "ready"];

interface KitchenOrdersContextValue {
  orders: KitchenOrder[];
  counts: Record<KitchenOrderStatus, number>;
  byStatus: (status: KitchenOrderStatus) => KitchenOrder[];
  /** เลื่อนออเดอร์ไปยังขั้นตอนถัดไป (ใหม่ → กำลังทำ → พร้อมเสิร์ฟ → เสิร์ฟแล้ว) */
  advance: (id: string) => Promise<boolean>;
  pendingOrderIds: Set<string>;
  loading: boolean;
  error: string | null;
}

const KitchenOrdersContext = createContext<KitchenOrdersContextValue | null>(null);

export function KitchenOrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingOrderIds, setPendingOrderIds] = useState<Set<string>>(new Set());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const [active, servedOrders] = await Promise.all([
        fetchOrders({ paymentStatus: ["succeeded"], fulfillmentStatus: ACTIVE_STATUSES }),
        // ประวัติต้องอิงสถานะ served จากฐานข้อมูลโดยตรง ไม่กรองวันที่ใน browser
        // เพราะ timezone และวันที่สั่งอาจต่างจากวันที่เสิร์ฟ ทำให้รายการที่เพิ่งเสิร์ฟหายได้
        fetchOrders({ paymentStatus: ["succeeded"], fulfillmentStatus: ["served"] }),
      ]);
      setOrders([...active, ...servedOrders].map(orderToKitchenOrder));
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
    const unsubscribe = subscribeToUpdates((update) => {
      if (update.resource === "orders") void loadOrders();
    });
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      unsubscribe();
    };
  }, [loadOrders]);

  const advance = useCallback(
    async (id: string) => {
      const order = orders.find((item) => item.id === id);
      const next = order ? NEXT_STATUS[order.status] : null;
      if (!order || !next || pendingOrderIds.has(id)) return false;
      setPendingOrderIds((current) => new Set(current).add(id));
      setError(null);
      try {
        const updated = await updateOrderStatus(id, UI_TO_API_STATUS[next]);
        setOrders((current) => current.map((item) => item.id === id ? orderToKitchenOrder(updated) : item));
        return true;
      } catch (err) {
        console.error("อัปเดตสถานะออเดอร์ไม่สำเร็จ:", err);
        setError(err instanceof Error ? err.message : "อัปเดตสถานะออเดอร์ไม่สำเร็จ");
        await loadOrders();
        return false;
      } finally {
        setPendingOrderIds((current) => {
          const nextIds = new Set(current);
          nextIds.delete(id);
          return nextIds;
        });
      }
    },
    [loadOrders, orders, pendingOrderIds],
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

  const value: KitchenOrdersContextValue = { orders, counts, byStatus, advance, pendingOrderIds, loading, error };

  return <KitchenOrdersContext.Provider value={value}>{children}</KitchenOrdersContext.Provider>;
}

export function useKitchenOrders() {
  const ctx = useContext(KitchenOrdersContext);
  if (!ctx) {
    throw new Error("useKitchenOrders ต้องถูกเรียกใช้ภายใน KitchenOrdersProvider เท่านั้น");
  }
  return ctx;
}
