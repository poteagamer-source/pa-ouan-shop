/** หน้าออเดอร์ใหม่สถานะ queued ให้ครัวกดเริ่มทำอาหาร */
import { PageHeader } from "../../../components/staff/PageHeader";
import { StatusOverviewCards } from "../../../components/staff/kitchen/StatusOverviewCards";
import { SortDropdown } from "../../../components/staff/kitchen/SortDropdown";
import { NewOrderCard } from "../../../components/staff/kitchen/NewOrderCard";
import { useKitchenOrders } from "../../../context/KitchenOrdersContext";

export function KitchenOrdersPage() {
  const { counts, byStatus, advance, pendingOrderIds, error } = useKitchenOrders();
  const newOrders = byStatus("new");

  return (
    <div className="max-w-4xl">
      <PageHeader title="รายการออเดอร์ใหม่" subtitle="ออเดอร์ที่เข้ามาใหม่ รอส่งต่อไปยังขั้นตอนถัดไป" />

      <StatusOverviewCards
        counts={counts}
        activeStatus="new"
        linkFor={{ new: ".", cooking: "../cooking", ready: "../ready", served: "../ready" }}
      />

      <div className="flex justify-end mb-4">
        <SortDropdown />
      </div>
      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {newOrders.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10">ไม่มีออเดอร์ใหม่ในขณะนี้</p>
      ) : (
        newOrders.map((order) => <NewOrderCard key={order.id} order={order} onAdvance={advance} busy={pendingOrderIds.has(order.id)} />)
      )}
    </div>
  );
}
