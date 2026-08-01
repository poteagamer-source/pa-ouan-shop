import { useEffect, useMemo, useRef, useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { CustomerPageLayout } from "../../components/customer/CustomerPageLayout";
import { OrderSummaryCard } from "../../components/OrderSummaryCard";
import { useCart } from "../../context/CartContext";
import { createOrder, createPaymentSession, fetchOrder } from "../../lib/api";
import { useTable } from "../../context/TableContext";
import { useCustomerPath } from "../../hooks/useCustomerPath";
import type { CartItem, Order } from "../../types";

const PAYMENT_PROVIDER = import.meta.env.VITE_PAYMENT_PROVIDER ?? "stripe";
const PAYMENT_METHOD = import.meta.env.VITE_PAYMENT_METHOD ?? "promptpay";
const DEFAULT_CURRENCY = import.meta.env.VITE_SHOP_CURRENCY ?? "THB";

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);
}

export function PaymentPage() {
  const { tableId } = useTable();
  const paths = useCustomerPath();
  const { items, total, clearCart, setLastOrderId } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idempotencyKey = useRef(crypto.randomUUID());

  useEffect(() => {
    if (items.length > 0 || order) return;
    const previousOrderId = window.localStorage.getItem(`lastOrderId:${tableId}`);
    if (!previousOrderId) return;
    fetchOrder(previousOrderId)
      .then((previousOrder) => {
        if (["pending", "failed", "cancelled"].includes(previousOrder.paymentStatus)) setOrder(previousOrder);
      })
      .catch(() => {});
  }, [items.length, order, tableId]);

  const summaryItems = useMemo<CartItem[]>(() => {
    if (!order) return items;
    return order.items.map((item) => ({
      productId: item.productId,
      productName: item.name,
      productImage: item.image ?? "",
      basePrice: Number(item.basePrice),
      quantity: item.qty,
      temperature: item.temperature === "hot" ? "hot" : "cold",
      toppings: item.toppings.map((topping) => ({ ...topping, price: Number(topping.price) })),
    }));
  }, [items, order]);

  const handleCheckout = async () => {
    if (!order && items.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      let checkoutOrder = order;
      if (!checkoutOrder) {
        const note = items.some((item) => item.temperature === "hot") ? "ร้อน" : "เย็น";
        checkoutOrder = await createOrder({ table: tableId, note, items });
        setOrder(checkoutOrder);
        setLastOrderId(checkoutOrder.id);
        window.localStorage.setItem(`lastOrderId:${tableId}`, checkoutOrder.id);
        clearCart();
      }

      const payment = await createPaymentSession(
        checkoutOrder.id,
        { provider: PAYMENT_PROVIDER, paymentMethod: PAYMENT_METHOD, returnPath: paths.status },
        idempotencyKey.current,
      );
      if (!payment.checkoutUrl) throw new Error("ผู้ให้บริการไม่ได้ส่ง URL สำหรับชำระเงินกลับมา");
      window.location.assign(payment.checkoutUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถเปิดหน้าชำระเงินได้ กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  };

  const orderTotal = order?.total ?? total;
  const currency = order?.currency ?? DEFAULT_CURRENCY;

  return (
    <CustomerPageLayout showPager={false}>
      <div className="px-4 py-3 space-y-4">
        <p className="text-sm text-gray-700">
          โต๊ะ: <span className="font-semibold">{tableId}</span>
        </p>
        {summaryItems.length > 0 && <OrderSummaryCard items={summaryItems} total={orderTotal} currency={currency} />}

        <div className="rounded-xl bg-white p-6 shadow-md border border-gray-100 text-center">
          <CreditCard className="mx-auto w-10 h-10 text-blue-600 mb-3" />
          <p className="font-semibold text-gray-900">ชำระเงินผ่านผู้ให้บริการที่ปลอดภัย</p>
          <p className="text-sm text-gray-500 mt-1">
            ช่องทาง: {PAYMENT_METHOD} · ผู้ให้บริการ: {PAYMENT_PROVIDER}
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-4">{formatMoney(orderTotal, currency)}</p>
          <p className="text-xs text-gray-500 mt-3">
            ระบบจะส่งออเดอร์เข้าครัวหลังได้รับ webhook ยืนยันการชำระเงินจริงเท่านั้น
          </p>
        </div>

        {error && <p className="text-xs text-red-500 text-center">{error}</p>}
        <button
          type="button"
          onClick={handleCheckout}
          disabled={submitting || (!order && items.length === 0)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-500 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          ไปหน้าชำระเงิน
        </button>
      </div>
    </CustomerPageLayout>
  );
}
