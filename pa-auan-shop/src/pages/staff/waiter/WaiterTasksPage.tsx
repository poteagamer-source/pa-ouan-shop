import { ConciergeBell, CheckCircle2 } from "lucide-react";
import { PageHeader } from "../../../components/staff/PageHeader";
import { StatCard } from "../../../components/staff/StatCard";
import { SortDropdown } from "../../../components/staff/kitchen/SortDropdown";
import { WaiterTaskCard } from "../../../components/staff/kitchen/WaiterTaskCard";
import { useKitchenOrders } from "../../../context/KitchenOrdersContext";

export function WaiterTasksPage() {
  const { counts, byStatus, advance } = useKitchenOrders();
  const readyOrders = byStatus("ready");
  const servedOrders = byStatus("served");
  const recentServed = servedOrders.slice(0, 3);

  return (
    <div className="max-w-6xl">
      <PageHeader title="พนักงานเสิร์ฟ" />

      <div className="flex flex-wrap gap-4 mb-6">
        <StatCard
          icon={<ConciergeBell className="w-5 h-5" />}
          iconBgClass="bg-green-50"
          iconColorClass="text-green-500"
          label="รอรับงาน"
          value={String(counts.ready)}
          valueColorClass="text-green-600"
          sublabel="รายการ"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBgClass="bg-blue-50"
          iconColorClass="text-blue-500"
          label="เสิร์ฟแล้ว"
          value={String(counts.served)}
          valueColorClass="text-blue-500"
          sublabel="รายการ"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 rounded-2xl border border-green-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <h2 className="text-sm font-semibold text-green-600">
              งานที่รอรับ / พร้อมเสิร์ฟ ({readyOrders.length})
            </h2>
            <SortDropdown />
          </div>
          <p className="text-xs text-gray-400 mb-4">
            เมื่อเสิร์ฟเสร็จแล้ว กรุณากดปุ่มยืนยันเมื่อออเดอร์ให้อัปเดตสถานะ
          </p>
          {readyOrders.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">ไม่มีงานที่ต้องเสิร์ฟในขณะนี้</p>
          ) : (
            readyOrders.map((order) => (
              <WaiterTaskCard key={order.id} order={order} onServe={advance} />
            ))
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">สรุปวันนี้</p>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-500">รอรับงาน</span>
              <span className="font-semibold text-gray-800">{counts.ready} รายการ</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">เสิร์ฟแล้ว</span>
              <span className="font-semibold text-gray-800">{counts.served} รายการ</span>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">ประวัติการเสิร์ฟล่าสุด</p>
            {recentServed.length === 0 ? (
              <p className="text-xs text-gray-400">ยังไม่มีประวัติ</p>
            ) : (
              recentServed.map((order) => (
                <div key={order.id} className="flex items-center justify-between text-xs mb-2 last:mb-0">
                  <span className="text-gray-500">
                    {order.date} {order.servedAt ?? order.time} น.
                  </span>
                  <span className="text-gray-500">โต๊ะ: {order.table}</span>
                  <span className="rounded-full bg-green-100 text-green-600 px-2 py-0.5 font-medium">
                    เสิร์ฟแล้ว
                  </span>
                </div>
              ))
            )}
            <button
              type="button"
              className="w-full mt-3 rounded-lg border border-gray-200 py-2 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
            >
              ดูทั้งหมด
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">รายการที่รับแล้ว</p>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-100">
              <th className="pb-2 font-medium">Order ID</th>
              <th className="pb-2 font-medium">โต๊ะ</th>
              <th className="pb-2 font-medium">รายการ</th>
              <th className="pb-2 font-medium">เสิร์ฟเวลา</th>
              <th className="pb-2 font-medium text-right">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {servedOrders.map((order) => (
              <tr key={order.id} className="border-b border-gray-50 last:border-0">
                <td className="py-2 text-gray-700">{order.id}</td>
                <td className="py-2 text-gray-700">{order.table}</td>
                <td className="py-2 text-gray-700">{order.items.map((i) => `${i.name} (${i.qty})`).join(", ")}</td>
                <td className="py-2 text-gray-700">{order.servedAt ?? "-"}</td>
                <td className="py-2 text-right">
                  <span className="inline-block rounded-full bg-green-100 text-green-600 px-2.5 py-0.5 text-[11px] font-medium">
                    เสิร์ฟแล้ว
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          type="button"
          className="w-full mt-3 rounded-lg border border-gray-200 py-2 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
        >
          ดูทั้งหมด
        </button>
      </div>
    </div>
  );
}
