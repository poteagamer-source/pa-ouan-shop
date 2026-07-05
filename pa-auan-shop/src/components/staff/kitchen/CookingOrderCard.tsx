import { Clock, CheckCircle2 } from "lucide-react";
import type { KitchenOrder } from "../../../context/KitchenOrdersContext";

interface CookingOrderCardProps {
  order: KitchenOrder;
  onAdvance: (id: string) => void;
}

export function CookingOrderCard({ order, onAdvance }: CookingOrderCardProps) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm mb-4 max-w-xl">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-gray-800">Order : {order.id}</p>
          <p className="text-xs text-gray-400">
            {order.date} : {order.time} น.
          </p>
        </div>
        <p className="text-sm text-gray-500">
          โต๊ะ : <span className="font-bold text-brand">{order.table}</span>
        </p>
      </div>

      <div className="flex items-center gap-2 bg-amber-50 rounded-xl px-4 py-3 mb-4">
        <Clock className="w-5 h-5 text-amber-500" />
        <p className="text-sm text-gray-600">
          กำลังทำมาแล้ว <span className="text-xl font-bold text-amber-500 mx-1">{order.stepStartedMinutesAgo}</span> นาที
        </p>
      </div>

      <div className="rounded-xl bg-gray-50 p-3 mb-4">
        <p className="text-xs font-semibold text-gray-500 mb-2">
          รายการอาหาร ({order.items.length})
        </p>
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 text-sm mb-2 last:mb-0">
            <img src={item.image} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
            <span className="flex-1 text-gray-700">
              {item.name} {item.qty} <span className="text-red-400">฿ {item.price.toFixed(2)}</span>
            </span>
          </div>
        ))}
        <p className="text-sky-500 text-xs mt-1">{order.note}</p>
      </div>

      <button
        type="button"
        onClick={() => onAdvance(order.id)}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-medium text-white hover:bg-amber-600 transition-colors"
      >
        <CheckCircle2 className="w-4 h-4" />
        เสร็จแล้ว / พร้อมเสิร์ฟ
      </button>
    </div>
  );
}
