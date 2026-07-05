import { Link } from "react-router-dom";
import { CustomerPageLayout } from "../../components/customer/CustomerPageLayout";
import { OrderSummaryCard } from "../../components/OrderSummaryCard";
import { useCart } from "../../context/CartContext";
import { images } from "../../data/images";
import { useCustomerPath } from "../../hooks/useCustomerPath";

export function CartPage() {
  const paths = useCustomerPath();
  const { items, total } = useCart();

  return (
    <CustomerPageLayout>
      <div className="px-4 py-4 relative min-h-[50dvh]">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <img
              src={images.logoMascot}
              alt=""
              className="w-32 h-32 object-contain opacity-40 mb-4"
            />
            <p className="text-sm text-gray-500 mb-6">ยังไม่มีสินค้าในตะกร้า</p>
            <Link
              to={paths.menu}
              className="rounded-lg bg-brand px-6 py-2.5 text-sm font-medium text-white"
            >
              เลือกเมนู
            </Link>
          </div>
        ) : (
          <>
            <p className="text-right text-xs text-brand mb-2 cursor-pointer">Edit items</p>
            <OrderSummaryCard items={items} total={total} />

            <img
              src={images.logoMascot}
              alt=""
              className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 w-44 h-44 object-contain opacity-25"
            />

            <div className="mt-8 flex justify-between items-end relative z-10">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold">฿ {total.toFixed(2)}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Link
                  to={paths.menu}
                  className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white text-center"
                >
                  ย้อนกลับ
                </Link>
                <Link
                  to={paths.payment}
                  className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white text-center"
                >
                  ชำระเงิน
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </CustomerPageLayout>
  );
}
