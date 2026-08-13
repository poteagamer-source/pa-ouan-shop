import { useCallback, useEffect, useMemo, useState } from "react";
import { BellRing, Calendar, ChevronRight, FileCheck, FileText, Loader2 } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "../../components/staff/PageHeader";
import { StatCard } from "../../components/staff/StatCard";
import { fetchSales, subscribeToUpdates } from "../../lib/api";
import type { SalesOrder } from "../../types";

function localDate() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function displayTime(value: string) {
  return value?.slice(0, 5) || "-";
}

/** รายงานนี้คำนวณจากออเดอร์ที่ Stripe ยืนยันการชำระเงินแล้วเท่านั้น */
export function SalesReportPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const today = localDate();

  const load = useCallback(async () => {
    try {
      setOrders(await fetchSales({ from: today, to: today }));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "โหลดรายงานยอดขายไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    void load();
    const unsubscribe = subscribeToUpdates((update) => {
      if (update.resource === "orders") void load();
    });
    return unsubscribe;
  }, [load]);

  const currency = orders[0]?.currency ?? "THB";
  const money = (value: number) => new Intl.NumberFormat("th-TH", { style: "currency", currency }).format(value);
  const total = orders.reduce((sum, order) => sum + order.total, 0);
  const average = orders.length ? total / orders.length : 0;

  const hourlySales = useMemo(() => {
    const values = Array.from({ length: 24 }, (_, hour) => ({ time: `${String(hour).padStart(2, "0")}:00`, value: 0 }));
    orders.forEach((order) => {
      const hour = Number(order.time?.slice(0, 2));
      if (Number.isInteger(hour) && values[hour]) values[hour].value += order.total;
    });
    return values;
  }, [orders]);

  const sortedByTotal = [...orders].sort((a, b) => b.total - a.total);
  const peak = hourlySales.reduce((best, row) => row.value > best.value ? row : best, hourlySales[0]);
  const latest = orders[0];

  return (
    <div className="max-w-6xl">
      <PageHeader title="รายงานยอดขาย" subtitle="ข้อมูลจริงจากออเดอร์ที่ลูกค้าชำระเงินสำเร็จ อัปเดตแบบเรียลไทม์" />

      <div className="mb-6 flex flex-wrap gap-4">
        <StatCard icon={<FileText className="h-5 w-5" />} iconBgClass="bg-red-50" iconColorClass="text-red-500" label="ยอดขายวันนี้" value={money(total)} valueColorClass="text-red-500" sublabel={`จาก ${orders.length} ออเดอร์`} />
        <StatCard icon={<BellRing className="h-5 w-5" />} iconBgClass="bg-green-50" iconColorClass="text-green-500" label="ออเดอร์วันนี้" value={String(orders.length)} valueColorClass="text-green-600" sublabel="ชำระเงินสำเร็จ" />
      </div>

      {loading && <div className="flex justify-center gap-2 py-12 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> กำลังโหลดข้อมูล</div>}
      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      {!loading && !error && <>
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between"><p className="text-sm font-semibold text-gray-700">ยอดขายแยกตามช่วงเวลา</p><span className="flex items-center gap-1 text-xs text-gray-400"><Calendar className="h-3.5 w-3.5" />{new Date(`${today}T00:00:00`).toLocaleDateString("th-TH")}</span></div>
            <ResponsiveContainer width="100%" height={220}><AreaChart data={hourlySales}><defs><linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff6600" stopOpacity={0.35} /><stop offset="100%" stopColor="#ff6600" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="time" tick={{ fontSize: 11 }} interval={3} /><YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => `฿${value}`} /><Tooltip formatter={(value: number) => [money(value), "ยอดขาย"]} /><Area type="monotone" dataKey="value" stroke="#ff6600" strokeWidth={2} fill="url(#salesFill)" /></AreaChart></ResponsiveContainer>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center"><div><p className="text-xs text-gray-400">ยอดขายรวม</p><p className="text-sm font-bold text-green-600">{money(total)}</p></div><div><p className="text-xs text-gray-400">ออเดอร์</p><p className="text-sm font-bold">{orders.length}</p></div><div><p className="text-xs text-gray-400">เฉลี่ยต่อออเดอร์</p><p className="text-sm font-bold text-green-600">{money(average)}</p></div></div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><p className="mb-4 text-sm font-semibold text-gray-700">สรุปยอดขายประจำวัน</p><div className="space-y-4 text-sm"><div><p>ยอดขายสูงสุด</p><p className="text-xs text-gray-400">{sortedByTotal[0] ? `${displayTime(sortedByTotal[0].time)} น.` : "-"}</p><p className="font-semibold text-brand">{money(sortedByTotal[0]?.total ?? 0)}</p></div><div><p>ยอดขายต่ำสุด</p><p className="text-xs text-gray-400">{sortedByTotal.at(-1) ? `${displayTime(sortedByTotal.at(-1)!.time)} น.` : "-"}</p><p className="font-semibold text-brand">{money(sortedByTotal.at(-1)?.total ?? 0)}</p></div><div><p>ช่วงเวลาพีค</p><p className="font-semibold text-brand">{peak?.value ? `${peak.time} น. (${money(peak.value)})` : "-"}</p></div><div><p>อัปเดตล่าสุด</p><p className="font-semibold text-brand">{latest ? `${displayTime(latest.time)} น.` : "-"}</p></div></div></div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><p className="mb-4 text-sm font-semibold text-gray-700">รายการขาย ({orders.length} รายการ)</p><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-gray-400"><th className="py-2">Order ID</th><th>โต๊ะ</th><th>ยอดรวม</th><th>เวลา</th><th>ช่องเงิน</th><th /></tr></thead><tbody>{orders.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-gray-400">วันนี้ยังไม่มีรายการขายที่ชำระเงินสำเร็จ</td></tr>}{orders.map((order) => <tr key={order.id} className="border-b border-gray-50"><td className="py-3 text-gray-500">{order.id}</td><td className="font-medium text-brand">{order.table}</td><td className="font-semibold text-red-500">{money(order.total)}</td><td className="text-gray-500">{displayTime(order.time)} น.</td><td><span className="inline-flex items-center gap-1 text-xs font-medium text-green-600"><FileCheck className="h-3.5 w-3.5" /> ชำระเงินแล้ว</span></td><td><ChevronRight className="h-4 w-4 text-gray-300" /></td></tr>)}</tbody></table></div></div>
      </>}
    </div>
  );
}
