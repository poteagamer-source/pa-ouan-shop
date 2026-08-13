/** หน้าครัวสถานะ cooking: อ่าน context และเลื่อนออเดอร์ไป ready */
import { PageHeader } from "../../../components/staff/PageHeader";
import { StatusOverviewCards } from "../../../components/staff/kitchen/StatusOverviewCards";
import { SortDropdown } from "../../../components/staff/kitchen/SortDropdown";
import { CookingOrderCard } from "../../../components/staff/kitchen/CookingOrderCard";
import { useKitchenOrders } from "../../../context/KitchenOrdersContext";

export function KitchenCookingPage() {
  const { counts, byStatus, advance, pendingOrderIds, error } = useKitchenOrders();
  const cookingOrders = byStatus("cooking");

  return (
    <div className="max-w-4xl">
      <PageHeader title="กำลังทำอาหาร" subtitle="ออเดอร์ที่กำลังปรุงอาหารอยู่" />

      <StatusOverviewCards
        counts={counts}
        activeStatus="cooking"
        linkFor={{ new: "../orders", cooking: ".", ready: "../ready", served: "../ready" }}
      />

      <div className="flex justify-between items-center mb-4">
        <p className="text-sm font-semibold text-gray-700">กำลังทำอาหาร ({cookingOrders.length})</p>
        <SortDropdown />
      </div>
      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {cookingOrders.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10">ไม่มีออเดอร์ที่กำลังทำอยู่</p>
      ) : (
        cookingOrders.map((order) => (
          <CookingOrderCard key={order.id} order={order} onAdvance={advance} busy={pendingOrderIds.has(order.id)} />
        ))
      )}
    </div>
  );
}
