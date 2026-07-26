import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { PageHeader } from "../../../components/staff/PageHeader";
import { useKitchenOrders } from "../../../context/KitchenOrdersContext";

export function WaiterServedPage() {
  const { counts, byStatus } = useKitchenOrders();
  const servedOrders = byStatus("served");
  const totalOrders = counts.new + counts.cooking + counts.ready + counts.served;
  const servedPct = totalOrders === 0 ? 0 : Math.round((counts.served / totalOrders) * 100);

  const chartData = [
    { name: "เสิร์ฟแล้ว", value: counts.served },
    { name: "ยังไม่เสิร์ฟ", value: totalOrders - counts.served },
  ];

  const peakTimes = useMemo(() => {
    const buckets = new Map<string, number>();
    servedOrders.forEach((order) => {
      const hour = Number(order.time.split(":")[0]);
      const bucketStart = Math.floor(hour / 4) * 4;
      const label = `${String(bucketStart).padStart(2, "0")}:00 - ${String(bucketStart + 4).padStart(2, "0")}:00`;
      buckets.set(label, (buckets.get(label) ?? 0) + 1);
    });
    return Array.from(buckets.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);
  }, [servedOrders]);

  return (
    <div className="max-w-6xl">
      <PageHeader title="พนักงานเสิร์ฟ" subtitle="รายการอาหารที่เสิร์ฟแล้ว" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">รายการเสิร์ฟแล้ว ({servedOrders.length})</p>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-100">
                <th className="pb-2 font-medium">ออเดอร์</th>
                <th className="pb-2 font-medium">โต๊ะ</th>
                <th className="pb-2 font-medium">รายการอาหาร</th>
                <th className="pb-2 font-medium">จำนวน</th>
                <th className="pb-2 font-medium">รวม</th>
                <th className="pb-2 font-medium text-right">เวลา</th>
              </tr>
            </thead>
            <tbody>
              {servedOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-50 last:border-0 align-top">
                  <td className="py-3">
                    <p className="text-gray-800 font-medium">{order.id}</p>
                    <p className="text-[11px] text-gray-400">{order.time} น.</p>
                  </td>
                  <td className="py-3 text-gray-700">{order.table}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      {order.items[0] && (
                        <img
                          src={order.items[0].image}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                      )}
                      <span className="text-gray-700">{order.items.map((i) => i.name).join(" + ")}</span>
                    </div>
                  </td>
                  <td className="py-3 text-gray-700">{order.items.reduce((s, i) => s + i.qty, 0)}</td>
                  <td className="py-3 font-semibold text-gray-800">฿ {order.total.toFixed(2)}</td>
                  <td className="py-3 text-right text-gray-700">{order.servedAt ?? "-"} น.</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">สรุปการเสิร์ฟ</p>
            <div className="relative h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    innerRadius={45}
                    outerRadius={65}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <Cell fill="#22c55e" />
                    <Cell fill="#e5e7eb" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-bold text-gray-800">{counts.served}</p>
                <p className="text-[11px] text-gray-400">รายการ</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs mt-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-gray-600">เสิร์ฟแล้ว</span>
              <span className="ml-auto font-medium text-gray-800">
                {counts.served} รายการ ({servedPct}%)
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
              <span className="text-gray-600">ยังไม่เสิร์ฟ</span>
              <span className="ml-auto font-medium text-gray-800">
                {totalOrders - counts.served} รายการ ({100 - servedPct}%)
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">ช่วงเวลาเสิร์ฟสูงสุด</p>
            {peakTimes.length === 0 ? (
              <p className="text-xs text-gray-400">ยังไม่มีข้อมูล</p>
            ) : (
              peakTimes.map(([label, count]) => (
                <div key={label} className="flex items-center justify-between text-xs mb-2 last:mb-0">
                  <span className="text-gray-600">{label}</span>
                  <span className="font-medium text-gray-800">{count} รายการ</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
