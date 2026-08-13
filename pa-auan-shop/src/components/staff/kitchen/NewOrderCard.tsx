/** การ์ดออเดอร์เข้าใหม่ (queued) พร้อมรายละเอียดและปุ่มเริ่มทำอาหาร */
import { ChefHat, ChevronRight } from "lucide-react";
import type { KitchenOrder } from "../../../context/KitchenOrdersContext";

interface NewOrderCardProps {
  order: KitchenOrder;
  onAdvance: (id: string) => Promise<boolean>;
  busy?: boolean;
}

export function NewOrderCard({ order, onAdvance, busy = false }: NewOrderCardProps) {
  return (
    <div className="rounded-2xl border-2 border-red-100 bg-white p-5 shadow-sm mb-4">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <span className="inline-block rounded-full bg-red-50 text-red-500 text-[11px] font-semibold px-2.5 py-1 mb-2">
            ออเดอร์ใหม่
          </span>
          <p className="text-sm text-gray-500">
            Order ID: <span className="font-semibold text-gray-800">{order.id}</span>
          </p>
          <p className="text-sm text-gray-500">
            โต๊ะ: <span className="font-bold text-brand">{order.table}</span>
          </p>
        </div>
        <div className="text-right text-xs text-gray-500">
          <p>เวลาที่รับออเดอร์</p>
          <p className="font-medium text-gray-700">
            {order.date} : {order.time} น.
          </p>
          <p className="mt-1">รายละเอียด</p>
          <p className="font-medium text-sky-500">{order.note}</p>
        </div>
      </div>

      <p className="text-xs font-semibold text-gray-500 mb-2">
        รายการอาหาร ({order.items.length} รายการ)
      </p>
      <div className="space-y-2 mb-4">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 text-sm">
            <img src={item.image} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
            <span className="flex-1 text-gray-700">{item.name}</span>
            <span className="text-gray-400 w-6 text-center">{item.qty}</span>
            <span className="font-semibold text-gray-800 w-20 text-right">฿ {item.price.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 pt-3 mb-4">
        <p className="text-sm text-gray-500">รวม {order.items.length} รายการ</p>
        <p className="font-bold text-gray-800">฿ {order.total.toFixed(2)}</p>
      </div>

      <button
        type="button"
        onClick={() => void onAdvance(order.id)}
        disabled={busy}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-medium text-white hover:bg-brand-dark transition-colors disabled:cursor-wait disabled:opacity-50"
      >
        <ChefHat className="w-4 h-4" />
        {busy ? "กำลังอัปเดต..." : "เริ่มทำอาหาร"}
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
