import { useLocation } from "react-router-dom";
import { useStaffAuth } from "./StaffAuthContext";
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
import { fetchOrders, fetchServedHistory, subscribeToUpdates, updateOrderStatus } from "../lib/api";
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
  stepStartedAt?: string | null;
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
    stepStartedAt: order.stepStartedAt,
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
  recentServed: KitchenOrder[];
  historyPage: number;
  historyTotal: number;
  historyLoading: boolean;
  setHistoryPage: (page: number) => void;
  peakTimes: [string, number][];
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
  const { user } = useStaffAuth();
  const { pathname } = useLocation();
  const [historyPage, setHistoryPage] = useState(0);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [recentServed, setRecentServed] = useState<KitchenOrder[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [peakTimes, setPeakTimes] = useState<[string, number][]>([]);
  const reloadRef = useRef<() => Promise<void>>(async () => {});
  const loadOrders = useCallback(() => reloadRef.current(), []);

  useEffect(() => { setHistoryPage(0); }, [pathname]);

  useEffect(() => {
    if (!user) return;
    let disposed = false;
    let connected = false;
    let lastSuccess = 0;
    let running: Promise<void> | null = null;
    let dirty = false;
    const load = (): Promise<void> => {
      if (disposed) return Promise.resolve();
      if (running) { dirty = true; return running; }
      setHistoryLoading(true);
      running = (async () => {
        do {
          dirty = false;
          try {
            const [active, history] = await Promise.all([
              fetchOrders({ paymentStatus: ["succeeded"], fulfillmentStatus: ACTIVE_STATUSES }),
              fetchServedHistory(historyPage),
            ]);
            if (disposed) return;
            if (historyPage > 0 && history.items.length === 0) {
              setHistoryPage(Math.max(0, Math.ceil(history.total / history.pageSize) - 1));
              return;
            }
            setOrders([...active, ...history.items].map(orderToKitchenOrder));
            setHistoryTotal(history.total);
            setRecentServed(history.recent.map(orderToKitchenOrder));
            setPeakTimes(history.peakTimes);
            setError(null);
            lastSuccess = Date.now();
          } catch (err) {
            if (!disposed) setError(err instanceof Error ? err.message : "โหลดออเดอร์ไม่สำเร็จ");
          }
        } while (dirty && !disposed);
      })().finally(() => {
        running = null;
        if (!disposed) { setLoading(false); setHistoryLoading(false); }
      });
      return running;
    };
    reloadRef.current = load;
    void load();
    const unsubscribe = subscribeToUpdates(
      (update) => { if (update.resource === "orders") void load(); },
      (value) => {
        const reconnected = value && !connected;
        connected = value;
        if (reconnected) void load();
      },
    );
    // Periodic reconciliation also recovers events lost during reconnects.
    const poll = setInterval(() => {
      if (document.visibilityState === "hidden") return;
      if (!connected || Date.now() - lastSuccess >= 60000) void load();
    }, POLL_INTERVAL_MS);
    const onVisible = () => { if (document.visibilityState !== "hidden") void load(); };
    document.addEventListener("visibilitychange", onVisible);
    const clock = setInterval(() => {
      setOrders(current => current.map(order => ({ ...order,
        stepStartedMinutesAgo: minutesAgoFromTime(order.time, order.stepStartedAt),
      })));
    }, 30000);
    return () => {
      disposed = true;
      clearInterval(poll);
      clearInterval(clock);
      document.removeEventListener("visibilitychange", onVisible);
      unsubscribe();
    };
  }, [historyPage, user]);

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
        await loadOrders();
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
    result.served = historyTotal;
    return result;
  }, [orders, historyTotal]);

  const byStatus = useCallback(
    (status: KitchenOrderStatus) => orders.filter((order) => order.status === status),
    [orders],
  );

  const value: KitchenOrdersContextValue = { recentServed, historyPage, historyTotal, historyLoading, setHistoryPage, peakTimes, orders, counts, byStatus, advance, pendingOrderIds, loading, error };

  return <KitchenOrdersContext.Provider value={value}>{children}</KitchenOrdersContext.Provider>;
}

export function useKitchenOrders() {
  const ctx = useContext(KitchenOrdersContext);
  if (!ctx) {
    throw new Error("useKitchenOrders ต้องถูกเรียกใช้ภายใน KitchenOrdersProvider เท่านั้น");
  }
  return ctx;
}
