import { PageHeader } from "../../../components/staff/PageHeader";
import { StatusOverviewCards } from "../../../components/staff/kitchen/StatusOverviewCards";
import { SortDropdown } from "../../../components/staff/kitchen/SortDropdown";
import { NewOrderCard } from "../../../components/staff/kitchen/NewOrderCard";
import { useKitchenOrders } from "../../../context/KitchenOrdersContext";

export function KitchenOrdersPage() {
  const { counts, byStatus, advance } = useKitchenOrders();
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

      {newOrders.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10">ไม่มีออเดอร์ใหม่ในขณะนี้</p>
      ) : (
        newOrders.map((order) => <NewOrderCard key={order.id} order={order} onAdvance={advance} />)
      )}
    </div>
  );
}
