/** หน้าออเดอร์ ready เพื่อให้ครัวตรวจรายการที่รอ waiter นำไปเสิร์ฟ */
import { CheckCircle2, ConciergeBell } from "lucide-react";
import { PageHeader } from "../../../components/staff/PageHeader";
import { StatusOverviewCards } from "../../../components/staff/kitchen/StatusOverviewCards";
import { SortDropdown } from "../../../components/staff/kitchen/SortDropdown";
import { ReadyOrderRow } from "../../../components/staff/kitchen/ReadyOrderRow";
import { ServedMiniCard } from "../../../components/staff/kitchen/ServedMiniCard";
import { useKitchenOrders } from "../../../context/KitchenOrdersContext";

export function KitchenReadyPage() {
  const { counts, byStatus } = useKitchenOrders();
  const readyOrders = byStatus("ready");
  const servedOrders = byStatus("served");

  return (
    <div className="max-w-6xl">
      <PageHeader title="พร้อมเสิร์ฟ" subtitle="อาหารพร้อมเสิร์ฟแล้ว" />

      <StatusOverviewCards
        counts={counts}
        activeStatus="ready"
        linkFor={{ new: "../orders", cooking: "../cooking", ready: ".", served: "." }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-green-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-green-600">
              <ConciergeBell className="w-4 h-4" /> พร้อมเสิร์ฟ ({readyOrders.length})
            </h2>
            <SortDropdown />
          </div>
          {readyOrders.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">ยังไม่มีออเดอร์ที่พร้อมเสิร์ฟ</p>
          ) : (
            readyOrders.map((order) => <ReadyOrderRow key={order.id} order={order} />)
          )}
        </div>

        <div className="rounded-2xl border border-blue-200 p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-blue-500 mb-4">
            <CheckCircle2 className="w-4 h-4" /> เสิร์ฟแล้ว ({servedOrders.length})
          </h2>
          {servedOrders.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">ยังไม่มีออเดอร์ที่เสิร์ฟแล้ว</p>
          ) : (
            servedOrders.map((order) => <ServedMiniCard key={order.id} order={order} />)
          )}
        </div>
      </div>
    </div>
  );
}
