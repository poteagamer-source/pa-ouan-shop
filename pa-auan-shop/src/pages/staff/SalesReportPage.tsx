/** รายงานยอดขายตามเวลารับเงินจริง: เลือกย้อนหลัง กราฟ สรุป ตาราง และ Export Excel */
import { useCallback, useEffect, useMemo, useState } from "react";
import { BellRing, Calendar, Download, FileCheck, FileText, Loader2 } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "../../components/staff/PageHeader";
import { StatCard } from "../../components/staff/StatCard";
import { fetchSales, subscribeToUpdates } from "../../lib/api";
import type { SalesOrder } from "../../types";

function localDate(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}
function daysAgo(days: number) { const date = new Date(); date.setDate(date.getDate() - days); return localDate(date); }
function displayDate(value: string) { return value?.slice(0, 10) || "-"; }
function displayTime(value: string) { return value?.slice(0, 5) || "-"; }
const escapeXml = (value: unknown) => String(value ?? "").replace(/[<>&"']/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[char]!);

/** สร้าง Spreadsheet XML (.xls) ใน browser ข้อมูลจึงไม่ถูกส่งออกไปบริการภายนอก */
function exportExcel(orders: SalesOrder[], from: string, to: string) {
  const rows = orders.flatMap((order) => (order.items.length ? order.items : [{ name: "-", qty: 0, price: 0, image: null }]).map((item) => [order.id, displayDate(order.date), displayTime(order.time), order.table, item.name, item.qty, item.price, order.total, order.currency]));
  const cells = (values: unknown[]) => values.map((value) => `<Cell><Data ss:Type="${typeof value === "number" ? "Number" : "String"}">${escapeXml(value)}</Data></Cell>`).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Sales"><Table><Row>${cells(["Order ID","วันที่รับเงิน","เวลา","โต๊ะ","สินค้า","จำนวน","ยอดสินค้า","ยอดออเดอร์","สกุลเงิน"])}</Row>${rows.map((row) => `<Row>${cells(row)}</Row>`).join("")}</Table></Worksheet></Workbook>`;
  const url = URL.createObjectURL(new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = `sales-${from}-to-${to}.xls`; link.click(); URL.revokeObjectURL(url);
}

export function SalesReportPage() {
  const today = localDate();
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // โหลดใหม่เมื่อเลือกช่วงวันที่หรือมี realtime event ของออเดอร์
  const load = useCallback(async () => {
    if (!from || !to || from > to) { setError("ช่วงวันที่ไม่ถูกต้อง"); setLoading(false); return; }
    setLoading(true);
    try { setOrders(await fetchSales({ from, to })); setError(null); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "โหลดรายงานยอดขายไม่สำเร็จ"); }
    finally { setLoading(false); }
  }, [from, to]);
  useEffect(() => { void load(); const unsubscribe = subscribeToUpdates((event) => { if (event.resource === "orders") void load(); }); return unsubscribe; }, [load]);

  const currency = orders[0]?.currency ?? "THB";
  const money = (value: number) => new Intl.NumberFormat("th-TH", { style: "currency", currency }).format(value);
  const total = orders.reduce((sum, order) => sum + order.total, 0);
  const average = orders.length ? total / orders.length : 0;
  const sorted = [...orders].sort((a, b) => b.total - a.total);
  const hourlySales = useMemo(() => {
    const values = Array.from({ length: 24 }, (_, hour) => ({ time: `${String(hour).padStart(2, "0")}:00`, value: 0 }));
    orders.forEach((order) => { const hour = Number(order.time?.slice(0, 2)); if (Number.isInteger(hour) && values[hour]) values[hour].value += order.total; });
    return values;
  }, [orders]);
  const peak = hourlySales.reduce((best, row) => row.value > best.value ? row : best, hourlySales[0]);

  return <div className="max-w-6xl">
    <PageHeader title="รายงานยอดขาย" subtitle="ข้อมูลตามเวลาที่ชำระเงินจริง เลือกดูย้อนหลังและ Export Excel ได้" />

    {/* ตัวกรองช่วงวันที่และคำสั่งส่งออก */}
    <div className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <label className="text-xs font-medium text-gray-600">วันที่เริ่มต้น<input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} className="mt-1 block rounded-xl border border-gray-200 px-3 py-2 text-sm" /></label>
      <label className="text-xs font-medium text-gray-600">วันที่สิ้นสุด<input type="date" value={to} min={from} max={today} onChange={(event) => setTo(event.target.value)} className="mt-1 block rounded-xl border border-gray-200 px-3 py-2 text-sm" /></label>
      <button onClick={() => { setFrom(today); setTo(today); }} className="rounded-xl border px-3 py-2 text-sm">วันนี้</button>
      <button onClick={() => { setFrom(daysAgo(6)); setTo(today); }} className="rounded-xl border px-3 py-2 text-sm">7 วัน</button>
      <button onClick={() => { setFrom(daysAgo(29)); setTo(today); }} className="rounded-xl border px-3 py-2 text-sm">30 วัน</button>
      <button disabled={!orders.length} onClick={() => exportExcel(orders, from, to)} className="ml-auto flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"><Download className="h-4 w-4" />Export Excel</button>
    </div>

    <div className="mb-6 flex flex-wrap gap-4">
      <StatCard icon={<FileText className="h-5 w-5" />} iconBgClass="bg-red-50" iconColorClass="text-red-500" label="ยอดขายตามช่วงวันที่" value={money(total)} valueColorClass="text-red-500" sublabel={`จาก ${orders.length} ออเดอร์`} />
      <StatCard icon={<BellRing className="h-5 w-5" />} iconBgClass="bg-green-50" iconColorClass="text-green-500" label="ออเดอร์ตามช่วงวันที่" value={String(orders.length)} valueColorClass="text-green-600" sublabel="ชำระเงินสำเร็จ" />
    </div>
    {loading && <div className="flex justify-center gap-2 py-12 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" />กำลังโหลดข้อมูล</div>}
    {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

    {!loading && !error && <>
      {/* กราฟและสรุปช่วงที่เลือก */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border bg-white p-5 shadow-sm"><div className="mb-4 flex justify-between"><p className="text-sm font-semibold">ยอดขายแยกตามช่วงเวลา</p><span className="flex items-center gap-1 text-xs text-gray-400"><Calendar className="h-3.5 w-3.5" />{from} – {to}</span></div><ResponsiveContainer width="100%" height={220}><AreaChart data={hourlySales}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/><XAxis dataKey="time" interval={3} tick={{fontSize:11}}/><YAxis tick={{fontSize:11}} tickFormatter={(value) => `฿${value}`}/><Tooltip formatter={(value: number) => [money(value), "ยอดขาย"]}/><Area type="monotone" dataKey="value" stroke="#ff6600" fill="#ff660033"/></AreaChart></ResponsiveContainer><div className="mt-4 grid grid-cols-3 text-center"><div><p className="text-xs text-gray-400">ยอดขายรวม</p><b className="text-green-600">{money(total)}</b></div><div><p className="text-xs text-gray-400">ออเดอร์</p><b>{orders.length}</b></div><div><p className="text-xs text-gray-400">เฉลี่ยต่อออเดอร์</p><b className="text-green-600">{money(average)}</b></div></div></div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm"><p className="mb-4 text-sm font-semibold">สรุปตามช่วงวันที่</p><div className="space-y-4 text-sm"><div><p>ยอดขายสูงสุด</p><b className="text-brand">{money(sorted[0]?.total ?? 0)}</b></div><div><p>ยอดขายต่ำสุด</p><b className="text-brand">{money(sorted.at(-1)?.total ?? 0)}</b></div><div><p>ช่วงเวลาพีค</p><b className="text-brand">{peak?.value ? `${peak.time} (${money(peak.value)})` : "-"}</b></div></div></div>
      </div>

      {/* รายการที่ชำระสำเร็จ ใช้วันที่/เวลารับเงินจริงจาก API */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm"><p className="mb-4 text-sm font-semibold">รายการขาย ({orders.length} รายการ)</p><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-gray-400"><th className="py-2">Order ID</th><th>วันที่รับเงิน</th><th>โต๊ะ</th><th>รายการ</th><th>ยอดรวม</th><th>เวลา</th><th>ช่องเงิน</th></tr></thead><tbody>{orders.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-gray-400">ไม่พบรายการขายที่ชำระเงินสำเร็จในช่วงนี้</td></tr>}{orders.map((order) => <tr key={order.id} className="border-b border-gray-50"><td className="py-3 text-gray-500">{order.id}</td><td>{displayDate(order.date)}</td><td className="font-medium text-brand">{order.table}</td><td className="max-w-56 truncate">{order.items.map((item) => `${item.name} ×${item.qty}`).join(", ")}</td><td className="font-semibold text-red-500">{money(order.total)}</td><td>{displayTime(order.time)} น.</td><td><span className="inline-flex items-center gap-1 text-xs text-green-600"><FileCheck className="h-3.5 w-3.5"/>ชำระเงินแล้ว</span></td></tr>)}</tbody></table></div></div>
    </>}
  </div>;
}
