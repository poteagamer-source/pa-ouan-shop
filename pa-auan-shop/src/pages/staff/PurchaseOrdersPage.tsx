/** รายการสั่งซื้อที่ชำระสำเร็จจาก API พร้อมรายละเอียดด้านข้างและ realtime refresh */
import { useEffect, useMemo, useState } from "react";
import { Banknote, CheckCircle, ChevronRight, FileText, Loader2, Package } from "lucide-react";
import { PageHeader } from "../../components/staff/PageHeader";
import { StatCard } from "../../components/staff/StatCard";
import { fetchSales, subscribeToUpdates } from "../../lib/api";
import type { SalesOrder } from "../../types";

/** หน้าตรวจสอบออเดอร์ที่ชำระเงินจริงจาก API (ไม่ใช้ mock data) */
export function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = () => fetchSales()
      .then((data) => { setOrders(data); setSelectedId(data[0]?.id); })
      .catch((err) => setError(err instanceof Error ? err.message : "โหลดรายการสั่งซื้อไม่สำเร็จ"))
      .finally(() => setLoading(false));
    void load();
    const unsubscribe = subscribeToUpdates((update) => {
      if (update.resource === "orders") void load();
    });
    return unsubscribe;
  }, []);

  const selected = useMemo(() => orders.find((order) => order.id === selectedId) ?? orders[0], [orders, selectedId]);
  const revenue = useMemo(() => orders.reduce((sum, order) => sum + order.total, 0), [orders]);
  const money = (value: number, currency = orders[0]?.currency ?? "THB") =>
    new Intl.NumberFormat("th-TH", { style: "currency", currency }).format(value);

  return (
    <div className="max-w-6xl">
      <PageHeader title="รายการสั่งซื้อ" subtitle="ตรวจสอบออเดอร์และการชำระเงินจากระบบจริง" />

      <div className="mb-6 flex flex-wrap gap-4">
        <StatCard icon={<Package className="h-5 w-5" />} iconBgClass="bg-brand-light" iconColorClass="text-brand" label="ออเดอร์ที่ชำระแล้ว" value={String(orders.length)} sublabel="รายการ" highlighted />
        <StatCard icon={<CheckCircle className="h-5 w-5" />} iconBgClass="bg-green-50" iconColorClass="text-green-500" label="ตรวจสอบแล้ว" value={String(orders.filter((order) => order.paymentVerified).length)} valueColorClass="text-green-600" sublabel="รายการ" />
        <StatCard icon={<Banknote className="h-5 w-5" />} iconBgClass="bg-blue-50" iconColorClass="text-blue-500" label="ยอดชำระรวม" value={money(revenue)} valueColorClass="text-blue-500" sublabel="จากข้อมูลจริง" />
      </div>

      {loading && <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> กำลังโหลดรายการสั่งซื้อ</div>}
      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      {!loading && !error && <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 text-left text-gray-400"><th className="py-2">Order ID</th><th>โต๊ะ</th><th>ยอดรวม</th><th>เวลา</th><th>ชำระเงิน</th><th /></tr></thead>
            <tbody>
              {orders.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-gray-400">ยังไม่มีออเดอร์ที่ชำระเงินแล้ว</td></tr>}
              {orders.map((order) => <tr key={order.id} onClick={() => setSelectedId(order.id)} className={`cursor-pointer border-b border-gray-50 ${order.id === selected?.id ? "bg-brand-light/60" : "hover:bg-gray-50"}`}>
                <td className="py-3 text-gray-500">{order.id}</td><td className="font-medium text-brand">{order.table}</td><td className="font-semibold text-red-500">{money(order.total, order.currency)}</td><td className="text-gray-500">{order.date} {order.time}</td>
                <td><span className="inline-flex items-center gap-1 text-xs font-medium text-green-600"><CheckCircle className="h-3.5 w-3.5" /> ชำระแล้ว</span></td><td><ChevronRight className="h-4 w-4 text-gray-300" /></td>
              </tr>)}
            </tbody>
          </table></div>
        </div>

        {selected && <div className="h-fit space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div><p className="font-semibold text-brand">โต๊ะ: {selected.table}</p><p className="text-xs text-gray-400">{selected.id}</p><p className="text-xs text-gray-500">{selected.date} {selected.time}</p></div>
          <div className="rounded-xl bg-green-50 p-3 text-sm text-green-700"><CheckCircle className="mr-1 inline h-4 w-4" /> ยืนยันการชำระเงินแล้ว</div>
          <div><p className="mb-2 text-sm font-semibold text-gray-700">รายการสินค้า</p><div className="space-y-2">{selected.items.map((item, index) => <div key={`${item.name}-${index}`} className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-gray-100">{item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" /> : <FileText className="h-4 w-4 text-gray-300" />}</div><div className="flex-1"><p className="text-sm text-gray-700">{item.name}</p><p className="text-xs text-gray-400">จำนวน {item.qty}</p></div><p className="text-sm font-semibold">{money(item.price, selected.currency)}</p></div>)}</div>
            <div className="mt-3 flex justify-between border-t pt-3 text-sm font-bold"><span>รวมทั้งหมด</span><span className="text-brand">{money(selected.total, selected.currency)}</span></div>
          </div>
        </div>}
      </div>}
    </div>
  );
}
