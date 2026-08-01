import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, BellRing, FileText, Package } from "lucide-react";
import { PageHeader } from "../../components/staff/PageHeader";
import { StatCard } from "../../components/staff/StatCard";
import { fetchOrders, fetchSalesSummary, fetchStock, subscribeToUpdates } from "../../lib/api";
import type { Order, SalesSummary, StockItem } from "../../types";

const statusMeta = {
  queued: { label: "ออเดอร์เข้าใหม่", color: "text-red-500", bg: "bg-red-50", to: "/staff/kitchen/orders" },
  cooking: { label: "กำลังทำอาหาร", color: "text-amber-500", bg: "bg-amber-50", to: "/staff/kitchen/cooking" },
  ready: { label: "พร้อมเสิร์ฟ", color: "text-green-600", bg: "bg-green-50", to: "/staff/waiter" },
  served: { label: "เสิร์ฟแล้ว", color: "text-blue-500", bg: "bg-blue-50", to: "/staff/waiter/served" },
} as const;

function localDate(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function money(value: number, currency = "THB") {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency }).format(value);
}

export function ManagerDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const today = localDate();
    try {
      const [orderData, stockData, salesData] = await Promise.all([
        fetchOrders({ date: today }),
        fetchStock(),
        fetchSalesSummary({ from: today, to: today }),
      ]);
      setOrders(orderData);
      setStock(stockData);
      setSummary(salesData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "โหลดภาพรวมร้านไม่สำเร็จ");
    }
  }, []);

  useEffect(() => {
    void load();
    const unsubscribe = subscribeToUpdates((update) => {
      if (["orders", "stock", "products"].includes(update.resource)) void load();
    });
    const timer = window.setInterval(load, 15_000);
    return () => {
      unsubscribe();
      window.clearInterval(timer);
    };
  }, [load]);

  const paidOrders = useMemo(() => orders.filter((order) => ["succeeded", "partially_refunded", "refunded"].includes(order.paymentStatus)), [orders]);
  const counts = useMemo(() => ({
    queued: paidOrders.filter((order) => order.fulfillmentStatus === "queued").length,
    cooking: paidOrders.filter((order) => order.fulfillmentStatus === "cooking").length,
    ready: paidOrders.filter((order) => order.fulfillmentStatus === "ready").length,
    served: paidOrders.filter((order) => order.fulfillmentStatus === "served").length,
  }), [paidOrders]);
  const lowStock = stock.filter((item) => item.status === "low");
  const latestOrders = paidOrders.slice(0, 5);

  return (
    <div className="max-w-6xl">
      <PageHeader title="หน้าหลัก" subtitle="ภาพรวม workflow ของร้านจากข้อมูลจริง" />
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-4">
        <StatCard icon={<FileText className="h-5 w-5" />} iconBgClass="bg-red-50" iconColorClass="text-red-500" label="ยอดขายวันนี้" value={money(summary?.revenue ?? 0, summary?.currency)} valueColorClass="text-red-500" sublabel={`จาก ${summary?.orderCount ?? 0} ออเดอร์ที่ชำระแล้ว`} />
        <StatCard icon={<BellRing className="h-5 w-5" />} iconBgClass="bg-green-50" iconColorClass="text-green-500" label="ออเดอร์วันนี้" value={String(paidOrders.length)} valueColorClass="text-green-600" sublabel={`เสิร์ฟแล้ว ${counts.served} ออเดอร์`} />
        <StatCard icon={<Package className="h-5 w-5" />} iconBgClass="bg-purple-50" iconColorClass="text-purple-500" label="สินค้าใกล้หมด" value={String(lowStock.length)} valueColorClass="text-purple-500" sublabel="รายการ" />
      </div>

      <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <p className="mb-4 text-sm font-semibold text-gray-700">สถานะงานวันนี้</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(Object.keys(statusMeta) as (keyof typeof statusMeta)[]).map((key) => {
            const meta = statusMeta[key];
            return (
              <Link key={key} to={meta.to} className={`rounded-xl p-4 text-center transition-transform hover:-translate-y-0.5 ${meta.bg}`}>
                <p className={`text-2xl font-bold ${meta.color}`}>{counts[key]}</p>
                <p className="mt-1 text-xs text-gray-600">{meta.label}</p>
                <p className={`mt-2 text-[11px] font-medium ${meta.color}`}>เปิดรายการ</p>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-gray-700">ออเดอร์ล่าสุดที่ชำระแล้ว</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100 text-left text-gray-400"><th className="py-2 font-medium">Order ID</th><th className="py-2 font-medium">โต๊ะ</th><th className="py-2 font-medium">รายการ</th><th className="py-2 font-medium">เวลา</th><th className="py-2 font-medium">สถานะ</th></tr></thead>
              <tbody>
                {latestOrders.map((order) => {
                  const meta = statusMeta[order.fulfillmentStatus as keyof typeof statusMeta];
                  return <tr key={order.id} className="border-b border-gray-50 last:border-0"><td className="py-3 text-gray-500">{order.id}</td><td className="py-3 font-semibold text-brand">{order.table}</td><td className="max-w-[240px] truncate py-3 text-gray-700">{order.items.map((item) => `${item.name} ×${item.qty}`).join(", ")}</td><td className="py-3 text-gray-500">{order.time?.slice(0, 5)} น.</td><td className="py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${meta?.bg ?? "bg-gray-100"} ${meta?.color ?? "text-gray-600"}`}>{meta?.label ?? order.fulfillmentStatus}</span></td></tr>;
                })}
                {latestOrders.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-sm text-gray-400">ยังไม่มีออเดอร์ที่ชำระเงินวันนี้</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-gray-700">สินค้าขายดีวันนี้</p>
          <div className="space-y-3">
            {(summary?.topProducts ?? []).slice(0, 5).map((item, index) => <div key={item.name} className="flex items-center gap-3"><span className="w-5 text-xs text-gray-400">{index + 1}</span><p className="flex-1 text-sm text-gray-700">{item.name}</p><p className="text-sm font-semibold text-gray-700">{item.qty}</p></div>)}
            {(summary?.topProducts.length ?? 0) === 0 && <p className="text-sm text-gray-400">ยังไม่มีข้อมูลยอดขาย</p>}
          </div>
          {lowStock.length > 0 && <Link to="/staff/stock" className="mt-5 block rounded-xl bg-purple-50 p-3 text-xs font-medium text-purple-600">มีสินค้าใกล้หมด {lowStock.length} รายการ — ตรวจสอบสต๊อก</Link>}
        </div>
      </div>
    </div>
  );
}
