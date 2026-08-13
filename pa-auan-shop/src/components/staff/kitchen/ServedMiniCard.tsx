/** การ์ดขนาดย่อของออเดอร์ที่เสิร์ฟแล้ว ใช้แสดงประวัติล่าสุด */
import type { KitchenOrder } from "../../../context/KitchenOrdersContext";

export function ServedMiniCard({ order }: { order: KitchenOrder }) {
  const firstItem = order.items[0];
  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm mb-3">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-xs text-gray-500">
            Order : <span className="font-semibold text-gray-800">{order.id}</span>
          </p>
          <p className="text-[11px] text-gray-400">
            {order.date} {order.time} น.
          </p>
        </div>
        <p className="text-xs text-gray-500">
          โต๊ะ : <span className="font-bold text-brand">{order.table}</span>
        </p>
      </div>
      {firstItem && (
        <div className="flex items-center gap-3 mb-2">
          <img src={firstItem.image} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
          <p className="text-sm text-gray-700 flex-1">
            {order.items.map((i) => i.name).join(" + ")} ({order.items.length})
          </p>
        </div>
      )}
      <div className="flex items-center justify-between text-xs">
        <span className="text-sky-500">{order.note}</span>
        <span className="font-bold text-gray-800">รวม ฿ {order.total.toFixed(2)}</span>
      </div>
    </div>
  );
}
