import { Clock } from "lucide-react";
import type { KitchenOrder } from "../../../context/KitchenOrdersContext";

export function ReadyOrderRow({ order }: { order: KitchenOrder }) {
  const firstItem = order.items[0];
  return (
    <div className="rounded-2xl border border-green-200 bg-white p-4 shadow-sm mb-3 flex flex-wrap items-center gap-4">
      <div className="w-20 shrink-0">
        <p className="text-[11px] text-gray-400">โต๊ะ :</p>
        <p className="text-2xl font-bold text-green-600 leading-tight">{order.table}</p>
        <p className="text-[11px] text-gray-400">{order.time} น.</p>
      </div>

      <div className="flex items-center gap-3 flex-1 min-w-[180px]">
        {firstItem && (
          <img src={firstItem.image} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">
            {order.items.map((i) => i.name).join(" + ")}
          </p>
          <p className="text-xs text-sky-500">{order.note}</p>
          <p className="text-xs text-gray-400">{order.items.length} รายการ</p>
        </div>
      </div>

      <div className="text-right shrink-0">
        <div className="flex items-center justify-end gap-1 text-gray-400 text-xs">
          <Clock className="w-3.5 h-3.5" /> รอ
        </div>
        <p className="text-xl font-bold text-green-600 leading-tight">{order.stepStartedMinutesAgo} นาที</p>
        <p className="text-[11px] text-gray-400">พร้อมเสิร์ฟ {order.time} น.</p>
      </div>
    </div>
  );
}
