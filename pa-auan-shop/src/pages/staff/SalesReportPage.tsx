import { useMemo, useState } from "react";
import { FileText, BellRing, Package, Calendar, FileCheck, ChevronRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PageHeader } from "../../components/staff/PageHeader";
import { StatCard } from "../../components/staff/StatCard";
import { salesOrders } from "../../data/mockData";

const hourlySales = [
  { time: "00:00", value: 0 },
  { time: "04:00", value: 0 },
  { time: "08:00", value: 3 },
  { time: "12:00", value: 8 },
  { time: "16:00", value: 15 },
  { time: "20:00", value: 32 },
  { time: "20:40", value: 35 },
  { time: "24:00", value: 20 },
];

export function SalesReportPage() {
  const [dateLabel] = useState("วันนี้ ( 4 มิ.ย. 2569 )");
  const todaySales = 1000;
  const todayOrders = 100;

  const summary = useMemo(
    () => [
      { label: "ยอดขายสูงสุด", time: "20:30 น.", value: "฿45.00" },
      { label: "ยอดขายต่ำสุด", time: "08:30 น.", value: "฿35.00" },
      { label: "ช่วงเวลาพีค", time: "20:00 - 21:00 น.", value: "฿45.00" },
      { label: "อัปเดตล่าสุด", time: "20:30 น.", value: "( 4 มิ.ย. 2569 )" },
    ],
    [],
  );

  return (
    <div className="max-w-6xl">
      <PageHeader title="รายงานยอดขาย" subtitle="สรุปยอดขายและรายการสั่งซื้อ" />

      <div className="flex flex-wrap gap-4 mb-6">
        <StatCard
          icon={<FileText className="w-5 h-5" />}
          iconBgClass="bg-red-50"
          iconColorClass="text-red-500"
          label="ยอดขายวันนี้"
          value={`฿ ${todaySales.toLocaleString()}`}
          valueColorClass="text-red-500"
          sublabel={`จาก ${todayOrders} ออเดอร์`}
        />
        <StatCard
          icon={<BellRing className="w-5 h-5" />}
          iconBgClass="bg-green-50"
          iconColorClass="text-green-500"
          label="ออเดอร์วันนี้"
          value={String(todayOrders)}
          valueColorClass="text-green-600"
          sublabel="สำเร็จแล้ว 80 ออเดอร์"
        />
        <StatCard
          icon={<Package className="w-5 h-5" />}
          iconBgClass="bg-purple-50"
          iconColorClass="text-purple-500"
          label="สินค้าใกล้หมด"
          value="6"
          valueColorClass="text-purple-500"
          sublabel="รายการ"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-700">ยอดขายแยกตามช่วงเวลา</p>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs text-gray-500"
            >
              <Calendar className="w-3.5 h-3.5" />
              {dateLabel}
            </button>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={hourlySales}>
              <defs>
                <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff6600" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#ff6600" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `฿${v}`} />
              <Tooltip formatter={(v: number) => [`฿${v}`, "ยอดขาย"]} />
              <Area type="monotone" dataKey="value" stroke="#ff6600" strokeWidth={2} fill="url(#salesFill)" />
            </AreaChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-3 gap-3 mt-4 text-center">
            <div>
              <p className="text-xs text-gray-400">ยอดขายรวม</p>
              <p className="text-sm font-bold text-green-600">฿ 35.00</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">ออเดอร์</p>
              <p className="text-sm font-bold text-gray-700">1</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">เฉลี่ยต่อออเดอร์</p>
              <p className="text-sm font-bold text-green-600">฿ 35.00</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-700">สรุปยอดขายประจำวัน</p>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Calendar className="w-3.5 h-3.5" />4 มิ.ย. 2569
            </span>
          </div>
          <div className="space-y-4">
            {summary.map((row) => (
              <div key={row.label} className="flex items-center justify-between text-sm">
                <div>
                  <p className="text-gray-700">{row.label}</p>
                  <p className="text-xs text-gray-400">{row.time}</p>
                </div>
                <p className="font-semibold text-brand">{row.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <p className="text-sm font-semibold text-gray-700 mb-4">รายการขาย ( {salesOrders.length} รายการ )</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-100">
                <th className="py-2 font-medium">Order ID</th>
                <th className="py-2 font-medium">โต๊ะ</th>
                <th className="py-2 font-medium">ยอดรวม</th>
                <th className="py-2 font-medium">เวลา</th>
                <th className="py-2 font-medium">ช่องเงิน</th>
                <th className="py-2 font-medium">หลักฐาน</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {salesOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="py-3 text-gray-500">{order.id}</td>
                  <td className="py-3 font-medium text-brand">{order.table}</td>
                  <td className="py-3 font-semibold text-red-500">฿{order.total.toFixed(2)}</td>
                  <td className="py-3 text-gray-500">
                    {order.date} : {order.time}
                  </td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                      <FileCheck className="w-3.5 h-3.5" />
                      ชำระเงินแล้ว
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                      <FileText className="w-4 h-4" />
                    </span>
                  </td>
                  <td className="py-3 text-gray-300">
                    <ChevronRight className="w-4 h-4" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
