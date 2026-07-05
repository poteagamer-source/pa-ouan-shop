import { CustomerPageLayout } from "../../components/customer/CustomerPageLayout";
import { OrderSummaryCard } from "../../components/OrderSummaryCard";
import { demoCartItem } from "../../data/mockData";
import { images } from "../../data/images";
import { useTable } from "../../context/TableContext";

export function OrderStatusPage() {
  const { tableId } = useTable();

  return (
    <CustomerPageLayout showPager={false}>
      <div className="px-4 py-4 min-h-[50dvh] relative">
        <p className="text-sm text-gray-700 mb-1">
          Table: <span className="font-semibold">{tableId}</span>
        </p>
        <p className="text-sm text-gray-600 mb-4">15-05-2026 : 20:30</p>

        <OrderSummaryCard items={[demoCartItem]} total={45} />

        <button
          type="button"
          className="mt-4 w-full rounded-lg bg-green-500 py-3 text-sm font-medium text-white"
        >
          ชำระเงินแล้ว
        </button>
        <p className="text-center text-xs text-red-500 italic mt-3">
          *กรุณารออาหารสักครู่.....*
        </p>

        <img
          src={images.logoMascot}
          alt="บัวลอยแป๊ะอ้วน"
          className="mx-auto mt-6 w-40 h-40 object-contain opacity-30"
        />
      </div>
    </CustomerPageLayout>
  );
}
