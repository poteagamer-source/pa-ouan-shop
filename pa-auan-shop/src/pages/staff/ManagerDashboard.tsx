import { useMemo } from "react";
import { FileText, BellRing, Package, ChevronRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PageHeader } from "../../components/staff/PageHeader";
import { StatCard } from "../../components/staff/StatCard";
import { salesOrders } from "../../data/mockData";
import { images } from "../../data/images";

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

const orderStatusSummary = [
  { label: "ออเดอร์เข้าใหม่", value: 2, color: "text-red-500", bg: "bg-red-50" },
  { label: "กำลังทำอาหาร", value: 1, color: "text-amber-500", bg: "bg-amber-50" },
  { label: "พร้อมเสิร์ฟ", value: 1, color: "text-green-500", bg: "bg-green-50" },
  { label: "เสิร์ฟแล้ว", value: 1, color: "text-blue-500", bg: "bg-blue-50" },
];

const bestSellers = [
  { rank: 1, name: "บัวลอยนมสด", qty: 40, image: images.food.bualoy },
  { rank: 2, name: "บัวลอยไข่เค็ม", qty: 50, image: images.food.bualoy },
  { rank: 3, name: "บัวลอยชูเนา", qty: 60, image: images.food.bualoy },
];

export function ManagerDashboard() {
  const latestOrders = useMemo(() => salesOrders.slice(0, 3), []);

  return (
    <div className="max-w-6xl">
      <PageHeader title="หน้าหลัก" subtitle="ภาพรวมการดำเนินงานของร้าน" />

      <div className="flex flex-wrap gap-4 mb-6">
        <StatCard
          icon={<FileText className="w-5 h-5" />}
          iconBgClass="bg-red-50"
          iconColorClass="text-red-500"
          label="ยอดขายวันนี้"
          value="฿ 1,000"
          valueColorClass="text-red-500"
          sublabel="จาก 100 ออเดอร์"
        />
        <StatCard
          icon={<BellRing className="w-5 h-5" />}
          iconBgClass="bg-green-50"
          iconColorClass="text-green-500"
          label="ออเดอร์วันนี้"
          value="100"
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
            <p className="text-sm font-semibold text-gray-700">ออเดอร์ล่าสุด</p>
            <button type="button" className="text-xs text-brand font-medium">
              ดูทั้งหมด
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-100">
                  <th className="py-2 font-medium">Order ID</th>
                  <th className="py-2 font-medium">โต๊ะ</th>
                  <th className="py-2 font-medium">รายการ</th>
                  <th className="py-2 font-medium">เวลาสั่งออเดอร์</th>
                  <th className="py-2 font-medium">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {latestOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 text-gray-500">{order.id}</td>
                    <td className="py-3 font-medium text-brand">{order.table}</td>
                    <td className="py-3 text-gray-700 flex items-center gap-2">
                      <img
                        src={order.items[0]?.image}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      {order.items[0]?.name} ({order.items[0]?.qty})
                    </td>
                    <td className="py-3 text-gray-500">{order.time}</td>
                    <td className="py-3">
                      <span className="inline-flex items-center rounded-full bg-green-100 text-green-600 text-xs font-medium px-3 py-1">
                        เสิร์ฟแล้ว
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm font-semibold text-gray-700 mb-3">ยอดขายแยกตามช่วงเวลา</p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={hourlySales}>
              <defs>
                <linearGradient id="dashSalesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff6600" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#ff6600" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `฿${v}`} />
              <Tooltip formatter={(v: number) => [`฿${v}`, "ยอดขาย"]} />
              <Area type="monotone" dataKey="value" stroke="#ff6600" strokeWidth={2} fill="url(#dashSalesFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm font-semibold text-gray-700 mb-4">ออเดอร์ที่ต้องจัดการ</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {orderStatusSummary.map((status) => (
              <div key={status.label} className={`rounded-xl p-4 text-center ${status.bg}`}>
                <p className={`text-xl font-bold ${status.color}`}>{status.value}</p>
                <p className="text-xs text-gray-500 mt-1">{status.label}</p>
                <button type="button" className={`text-[11px] font-medium mt-2 ${status.color}`}>
                  ดูรายการ
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm font-semibold text-gray-700 mb-4">สินค้าขายดี</p>
          <div className="space-y-3">
            {bestSellers.map((item) => (
              <div key={item.rank} className="flex items-center gap-3">
                <span className="w-5 text-xs text-gray-400">{item.rank}</span>
                <img src={item.image} alt={item.name} className="w-9 h-9 rounded-full object-cover" />
                <p className="flex-1 text-sm text-gray-700">{item.name}</p>
                <p className="text-sm font-semibold text-gray-700">{item.qty}</p>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
