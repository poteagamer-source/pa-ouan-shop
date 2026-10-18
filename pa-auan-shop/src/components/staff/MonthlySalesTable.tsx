import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fetchSalesSummary, subscribeToUpdates } from "../../lib/api";
import type { SalesSummary } from "../../types";

export function MonthlySalesTable({ from, to }: { from?: string; to?: string } = {}) {
  const currentYear = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Bangkok", year: "numeric" }).format(new Date()));
  const [year, setYear] = useState(currentYear);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    let requestId = 0;
    async function load() {
      const id = ++requestId;
      setLoading(true);
      setError(null);
      try {
        const result = await fetchSalesSummary({ from: from ?? `${year}-01-01`, to: to ?? `${year}-12-31` });
        if (active && id === requestId) setSummary(result);
      } catch (reason) {
        if (active && id === requestId) setError(reason instanceof Error ? reason.message : "โหลดสรุปรายเดือนไม่สำเร็จ");
      } finally {
        if (active && id === requestId) setLoading(false);
      }
    }
    void load();
    const unsubscribe = subscribeToUpdates((event) => { if (event.resource === "orders") void load(); });
    return () => { active = false; unsubscribe(); };
  }, [year, retry, from, to]);

  const months = useMemo(() => {
    if (from || to) {
      const start = new Date(`${from ?? to}T00:00:00`);
      const end = new Date(`${to ?? from}T00:00:00`);
      const rows: { label: string; shortLabel: string; revenue: number; orderCount: number }[] = [];
      for (const date = new Date(start); date <= end && rows.length < 366; date.setDate(date.getDate() + 1)) {
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        const day = summary?.byDay.find((item) => item.date === key);
        rows.push({ label: new Intl.DateTimeFormat("th-TH", { dateStyle: "long" }).format(date), shortLabel: new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short" }).format(date), revenue: day?.revenue ?? 0, orderCount: day?.orderCount ?? 0 });
      }
      return rows;
    }
    const rows = Array.from({ length: 12 }, (_, month) => ({
      label: new Intl.DateTimeFormat("th-TH", { month: "long" }).format(new Date(year, month, 1)),
      shortLabel: new Intl.DateTimeFormat("th-TH", { month: "short" }).format(new Date(year, month, 1)),
      revenue: 0, orderCount: 0,
    }));
    for (const day of summary?.byDay ?? []) {
      const month = Number(day.date.slice(5, 7)) - 1;
      if (day.date.startsWith(`${year}-`) && rows[month]) {
        rows[month].revenue += day.revenue;
        rows[month].orderCount += day.orderCount;
      }
    }
    return rows;
  }, [summary, year, from, to]);
  const dailyView = Boolean(from || to);
  const money = (value: number) => new Intl.NumberFormat("th-TH", { style: "currency", currency: summary?.currency ?? "THB" }).format(value);
  const total = months.reduce((result, month) => ({ revenue: result.revenue + month.revenue, orderCount: result.orderCount + month.orderCount }), { revenue: 0, orderCount: 0 });

  return <section className="mb-6 rounded-2xl border bg-white p-5 shadow-sm" aria-labelledby="monthly-sales-heading">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div><h2 id="monthly-sales-heading" className="text-sm font-semibold">{dailyView ? "สรุปยอดขายรายวัน" : "สรุปยอดขายรายเดือน"}</h2><p className="mt-1 text-xs text-gray-400">{dailyView ? `ยอดรับเงินจริงแยกตามวันที่ ${from ?? ""} ถึง ${to ?? ""}` : "ยอดรับเงินจริงทั้งปี"}</p></div>
      {!dailyView && <div className="flex items-center gap-3 text-sm">
        <button type="button" aria-label="ปีก่อนหน้า" onClick={() => setYear(year - 1)} disabled={year <= 1900} className="rounded-lg border px-3 py-2 disabled:opacity-40">ปีก่อนหน้า</button>
        <span className="font-semibold">พ.ศ. {year + 543}</span>
        <button type="button" aria-label="ปีถัดไป" onClick={() => setYear(year + 1)} disabled={year >= currentYear} className="rounded-lg border px-3 py-2 disabled:opacity-40">ปีถัดไป</button>
      </div>}
    </div>
    {loading ? <p role="status" className="py-10 text-center text-sm text-gray-500">กำลังโหลดสรุปรายเดือน...</p>
      : error ? <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}<button type="button" onClick={() => setRetry(retry + 1)} className="ml-3 underline">ลองใหม่</button></div>
      : <>
        <div className="mb-6 rounded-xl border border-gray-100 p-3 sm:p-5">
          <h3 className="mb-4 text-sm font-semibold">{dailyView ? "ยอดขายรายวัน" : `ยอดขายรายเดือน พ.ศ. ${year + 543}`}</h3>
          <div className="overflow-x-auto">
            <div className="min-w-[600px]" role="img" aria-label={`กราฟยอดขายรายเดือน พ.ศ. ${year + 543} รายละเอียดอยู่ในตารางด้านล่าง`}>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={months} margin={{ top: 10, right: 15, bottom: 5, left: 15 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="shortLabel" interval={dailyView ? "preserveStartEnd" : 0} tick={{ fontSize: 11 }} />
                  <YAxis width={80} domain={[0, (maximum: number) => maximum > 0 ? maximum : 100]} tick={{ fontSize: 11 }} tickFormatter={(value: number) => new Intl.NumberFormat("th-TH", { notation: "compact" }).format(value)} />
                  <Tooltip labelFormatter={(_, payload) => payload[0]?.payload.label ?? ""} formatter={(value: number) => [money(value), "ยอดขาย"]} />
                  <Area type="linear" dataKey="revenue" stroke="#ff6600" fill="#ff660033" dot={{ r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          {total.orderCount === 0 && <p className="mt-2 text-center text-sm text-gray-400">ยังไม่มียอดขายในปีนี้</p>}
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
            <div><p className="text-xs text-gray-400">ยอดขายรวมทั้งปี</p><b className="text-green-600">{money(total.revenue)}</b></div>
            <div><p className="text-xs text-gray-400">ออเดอร์ทั้งปี</p><b>{total.orderCount.toLocaleString("th-TH")}</b></div>
            <div><p className="text-xs text-gray-400">เฉลี่ยต่อออเดอร์</p><b className="text-green-600">{money(total.orderCount ? total.revenue / total.orderCount : 0)}</b></div>
          </div>
        </div>
        <div className="overflow-x-auto"><table className="w-full min-w-[540px] text-sm">
        <thead><tr className="border-b text-gray-400"><th scope="col" className="py-3 text-left">{dailyView ? "วันที่" : "เดือน"}</th><th scope="col" className="text-right">จำนวนออเดอร์</th><th scope="col" className="text-right">ยอดขายรวม</th><th scope="col" className="text-right">เฉลี่ยต่อออเดอร์</th></tr></thead>
        <tbody>{months.map((month) => <tr key={month.label} className="border-b border-gray-50 hover:bg-orange-50/50"><th scope="row" className="py-3 text-left font-normal">{month.label}</th><td className="text-right">{month.orderCount.toLocaleString("th-TH")}</td><td className="text-right font-semibold text-brand">{money(month.revenue)}</td><td className="text-right text-gray-500">{money(month.orderCount ? month.revenue / month.orderCount : 0)}</td></tr>)}</tbody>
        <tfoot><tr className="bg-orange-50 font-semibold"><th scope="row" className="py-3 text-left">{dailyView ? "รวมช่วงวันที่" : "รวมทั้งปี"}</th><td className="text-right">{total.orderCount.toLocaleString("th-TH")}</td><td className="text-right text-brand">{money(total.revenue)}</td><td className="text-right">{money(total.orderCount ? total.revenue / total.orderCount : 0)}</td></tr></tfoot>
      </table></div></>}
  </section>;
}
