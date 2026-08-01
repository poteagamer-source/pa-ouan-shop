import { ChefHat, ConciergeBell } from "lucide-react";
import { PageHeader } from "../../../components/staff/PageHeader";
import { StatusOverviewCards } from "../../../components/staff/kitchen/StatusOverviewCards";
import { StatusLegend } from "../../../components/staff/kitchen/StatusLegend";
import { useKitchenOrders } from "../../../context/KitchenOrdersContext";
import type { KitchenOrder } from "../../../context/KitchenOrdersContext";

function ColumnOrderCard({
  order,
  actionLabel,
  actionClass,
  onAction,
}: {
  order: KitchenOrder;
  actionLabel?: string;
  actionClass?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 mb-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-700">Order: {order.id}</p>
        <p className="text-xs text-gray-400">
          {order.date} : {order.time} น.
        </p>
      </div>
      {order.items.map((item) => (
        <div key={item.id} className="flex items-center gap-2 text-xs mb-1.5">
          <img src={item.image} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
          <span className="flex-1 text-gray-700">{item.name}</span>
          <span className="text-gray-400">{item.qty}</span>
          <span className="text-gray-800 font-medium">฿ {item.price.toFixed(2)}</span>
        </div>
      ))}
      <p className="text-sky-500 text-[11px] mb-2">{order.note}</p>
      <p className="text-sm font-bold text-gray-800 mb-2">รวม ฿ {order.total.toFixed(2)}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className={`w-full rounded-lg py-2 text-xs font-medium text-white transition-colors ${actionClass}`}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function KitchenHomePage() {
  const { counts, byStatus, advance } = useKitchenOrders();
  const newOrders = byStatus("new");
  const cookingOrders = byStatus("cooking");
  const readyOrders = byStatus("ready");
  const servedOrders = byStatus("served").slice(0, 4);

  return (
    <div className="max-w-6xl">
      <PageHeader title="หน้าห้องครัว" subtitle="ออเดอร์ที่กำลังปรุงอาหารอยู่" />

      <StatusOverviewCards
        counts={counts}
        linkFor={{ new: "../orders", cooking: "../cooking", ready: "../ready", served: "../ready" }}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl bg-white border border-red-100 shadow-sm p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-red-500 mb-3">
            รายการออเดอร์ใหม่ ({newOrders.length})
          </h2>
          {newOrders.length === 0 && <p className="text-xs text-gray-400">ไม่มีออเดอร์ใหม่</p>}
          {newOrders.map((order) => (
            <ColumnOrderCard
              key={order.id}
              order={order}
              actionLabel="เริ่มทำอาหาร"
              actionClass="bg-brand hover:bg-brand-dark"
              onAction={() => advance(order.id)}
            />
          ))}
        </div>

        <div className="rounded-2xl bg-white border border-amber-100 shadow-sm p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-500 mb-3">
            <ChefHat className="w-4 h-4" /> กำลังทำอาหาร ({cookingOrders.length})
          </h2>
          {cookingOrders.length === 0 && <p className="text-xs text-gray-400">ไม่มีออเดอร์ที่กำลังทำ</p>}
          {cookingOrders.map((order) => (
            <ColumnOrderCard
              key={order.id}
              order={order}
              actionLabel="ทำเสร็จแล้ว / พร้อมเสิร์ฟ"
              actionClass="bg-amber-500 hover:bg-amber-600"
              onAction={() => advance(order.id)}
            />
          ))}
        </div>

        <div className="rounded-2xl bg-white border border-green-100 shadow-sm p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-green-600 mb-3">
            <ConciergeBell className="w-4 h-4" /> พร้อมเสิร์ฟ ({readyOrders.length})
          </h2>
          {readyOrders.length === 0 && <p className="text-xs text-gray-400">ไม่มีออเดอร์ที่พร้อมเสิร์ฟ</p>}
          {readyOrders.map((order) => (
            <ColumnOrderCard key={order.id} order={order} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">เสิร์ฟแล้วล่าสุด</p>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-100">
                <th className="pb-2 font-medium">Order ID</th>
                <th className="pb-2 font-medium">โต๊ะ</th>
                <th className="pb-2 font-medium">รายการ</th>
                <th className="pb-2 font-medium text-right">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {servedOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-2 text-gray-700">{order.id}</td>
                  <td className="py-2 text-gray-700">{order.table}</td>
                  <td className="py-2 text-gray-700">{order.items.map((i) => i.name).join(" + ")}</td>
                  <td className="py-2 text-right">
                    <span className="inline-block rounded-full bg-green-100 text-green-600 px-2.5 py-0.5 text-[11px] font-medium">
                      เสิร์ฟแล้ว
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <StatusLegend />
      </div>
    </div>
  );
}
