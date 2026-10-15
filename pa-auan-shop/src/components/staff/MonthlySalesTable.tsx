import { useEffect, useMemo, useState } from "react";
import { fetchSalesSummary, subscribeToUpdates } from "../../lib/api";
import type { SalesSummary } from "../../types";

export function MonthlySalesTable() {
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
        const result = await fetchSalesSummary({ from: `${year}-01-01`, to: `${year}-12-31` });
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
  }, [year, retry]);

  const months = useMemo(() => {
    const rows = Array.from({ length: 12 }, (_, month) => ({
      label: new Intl.DateTimeFormat("th-TH", { month: "long" }).format(new Date(year, month, 1)),
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
  }, [summary, year]);
  const money = (value: number) => new Intl.NumberFormat("th-TH", { style: "currency", currency: summary?.currency ?? "THB" }).format(value);
  const total = months.reduce((result, month) => ({ revenue: result.revenue + month.revenue, orderCount: result.orderCount + month.orderCount }), { revenue: 0, orderCount: 0 });

  return <section className="mb-6 rounded-2xl border bg-white p-5 shadow-sm" aria-labelledby="monthly-sales-heading">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div><h2 id="monthly-sales-heading" className="text-sm font-semibold">สรุปยอดขายรายเดือน</h2><p className="mt-1 text-xs text-gray-400">ยอดรับเงินจริงทั้งปี แยกจากช่วงวันที่ด้านบน</p></div>
      <div className="flex items-center gap-3 text-sm">
        <button type="button" aria-label="ปีก่อนหน้า" onClick={() => setYear(year - 1)} disabled={year <= 1900} className="rounded-lg border px-3 py-2 disabled:opacity-40">ปีก่อนหน้า</button>
        <span className="font-semibold">พ.ศ. {year + 543}</span>
        <button type="button" aria-label="ปีถัดไป" onClick={() => setYear(year + 1)} disabled={year >= currentYear} className="rounded-lg border px-3 py-2 disabled:opacity-40">ปีถัดไป</button>
      </div>
    </div>
    {loading ? <p role="status" className="py-10 text-center text-sm text-gray-500">กำลังโหลดสรุปรายเดือน...</p>
      : error ? <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}<button type="button" onClick={() => setRetry(retry + 1)} className="ml-3 underline">ลองใหม่</button></div>
      : <div className="overflow-x-auto"><table className="w-full min-w-[540px] text-sm">
        <thead><tr className="border-b text-gray-400"><th scope="col" className="py-3 text-left">เดือน</th><th scope="col" className="text-right">จำนวนออเดอร์</th><th scope="col" className="text-right">ยอดขายรวม</th><th scope="col" className="text-right">เฉลี่ยต่อออเดอร์</th></tr></thead>
        <tbody>{months.map((month) => <tr key={month.label} className="border-b border-gray-50 hover:bg-orange-50/50"><th scope="row" className="py-3 text-left font-normal">{month.label}</th><td className="text-right">{month.orderCount.toLocaleString("th-TH")}</td><td className="text-right font-semibold text-brand">{money(month.revenue)}</td><td className="text-right text-gray-500">{money(month.orderCount ? month.revenue / month.orderCount : 0)}</td></tr>)}</tbody>
        <tfoot><tr className="bg-orange-50 font-semibold"><th scope="row" className="py-3 text-left">รวมทั้งปี</th><td className="text-right">{total.orderCount.toLocaleString("th-TH")}</td><td className="text-right text-brand">{money(total.revenue)}</td><td className="text-right">{money(total.orderCount ? total.revenue / total.orderCount : 0)}</td></tr></tfoot>
      </table></div>}
  </section>;
}
