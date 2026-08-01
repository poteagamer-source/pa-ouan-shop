import { AlertCircle } from "lucide-react";
import type { KitchenOrder } from "../../../context/KitchenOrdersContext";

interface WaiterTaskCardProps {
  order: KitchenOrder;
  onServe: (id: string) => Promise<boolean>;
  busy?: boolean;
}

export function WaiterTaskCard({ order, onServe, busy = false }: WaiterTaskCardProps) {
  const firstItem = order.items[0];
  return (
    <div className="rounded-2xl border border-green-200 bg-white p-5 shadow-sm mb-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="w-20 shrink-0">
          <p className="text-[11px] text-gray-400">โต๊ะ :</p>
          <p className="text-2xl font-bold text-green-600 leading-tight">{order.table}</p>
          <p className="text-[11px] text-gray-400">{order.time} น.</p>
        </div>

        <div className="flex items-center gap-3 flex-1 min-w-[180px]">
          {firstItem && (
            <img src={firstItem.image} alt="" className="w-14 h-14 rounded-full object-cover shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800">
              {order.items.map((i) => i.name).join(" + ")}
            </p>
            <p className="text-xs text-sky-500">{order.note}</p>
            <p className="text-xs text-gray-400">{order.items.length} รายการ</p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-xs text-gray-400">พร้อมเสิร์ฟ</p>
          <p className="text-xl font-bold text-green-600 leading-tight">{order.stepStartedMinutesAgo} นาที</p>
        </div>

        <button
          type="button"
          onClick={() => void onServe(order.id)}
          disabled={busy}
          className="rounded-xl bg-green-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-600 transition-colors shrink-0 disabled:cursor-wait disabled:opacity-50"
        >
          {busy ? "กำลังยืนยัน..." : "ยืนยันว่าเสิร์ฟแล้ว"}
        </button>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-amber-600 mt-3">
        <AlertCircle className="w-3.5 h-3.5" />
        กรุณาเสิร์ฟให้ลูกค้าที่โต๊ะภายใน 5 นาที
      </div>
    </div>
  );
}
