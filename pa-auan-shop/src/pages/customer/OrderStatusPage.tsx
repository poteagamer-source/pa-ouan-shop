import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Circle, Clock3, Loader2 } from "lucide-react";
import { CustomerPageLayout } from "../../components/customer/CustomerPageLayout";
import { OrderSummaryCard } from "../../components/OrderSummaryCard";
import { useCart } from "../../context/CartContext";
import { useTable } from "../../context/TableContext";
import { fetchOrder } from "../../lib/api";
import { useCustomerPath } from "../../hooks/useCustomerPath";
import type { CartItem, Order } from "../../types";

const STATUS_TEXT = {
  payment_pending: ["รอชำระเงิน", "ระบบกำลังรอผลยืนยันจากผู้ให้บริการชำระเงิน", "bg-amber-50 text-amber-700"],
  payment_processing: ["กำลังตรวจสอบการชำระเงิน", "ผู้ให้บริการกำลังประมวลผลรายการ", "bg-blue-50 text-blue-700"],
  payment_failed: ["ชำระเงินไม่สำเร็จ", "กรุณากลับไปลองชำระเงินอีกครั้ง", "bg-red-50 text-red-700"],
  payment_cancelled: ["ยกเลิกการชำระเงิน", "รายการชำระเงินถูกยกเลิก", "bg-gray-100 text-gray-700"],
  partially_refunded: ["คืนเงินบางส่วน", "ระบบคืนเงินบางส่วนแล้ว โดยสถานะอาหารยังถูกเก็บไว้", "bg-purple-50 text-purple-700"],
  refunded: ["คืนเงินแล้ว", "ระบบคืนเงินเรียบร้อย โดยประวัติการจัดเตรียมยังคงอยู่", "bg-purple-50 text-purple-700"],
  not_started: ["ชำระเงินแล้ว", "กำลังส่งออเดอร์เข้าคิวห้องครัว", "bg-green-50 text-green-700"],
  queued: ["เข้าคิวห้องครัวแล้ว", "ออเดอร์รอพนักงานครัวเริ่มทำ", "bg-green-50 text-green-700"],
  cooking: ["กำลังทำอาหาร", "พนักงานครัวกำลังจัดเตรียมอาหาร", "bg-orange-50 text-orange-700"],
  ready: ["พร้อมเสิร์ฟ", "พนักงานเสิร์ฟกำลังนำอาหารไปที่โต๊ะ", "bg-blue-50 text-blue-700"],
  served: ["เสิร์ฟแล้ว", "ดำเนินการออเดอร์เรียบร้อยแล้ว", "bg-green-50 text-green-700"],
  fulfillment_cancelled: ["ยกเลิกออเดอร์แล้ว", "การจัดเตรียมออเดอร์นี้ถูกยกเลิก", "bg-gray-100 text-gray-700"],
} as const;

function displayStatus(order: Order): keyof typeof STATUS_TEXT {
  if (order.paymentStatus === "pending") return "payment_pending";
  if (order.paymentStatus === "processing") return "payment_processing";
  if (order.paymentStatus === "failed") return "payment_failed";
  if (order.paymentStatus === "cancelled") return "payment_cancelled";
  if (order.paymentStatus === "partially_refunded") return "partially_refunded";
  if (order.paymentStatus === "refunded") return "refunded";
  if (order.fulfillmentStatus === "cancelled") return "fulfillment_cancelled";
  return order.fulfillmentStatus;
}

const FULFILLMENT_STEPS = [
  { status: "queued", label: "รับออเดอร์" },
  { status: "cooking", label: "กำลังทำ" },
  { status: "ready", label: "พร้อมเสิร์ฟ" },
  { status: "served", label: "เสิร์ฟแล้ว" },
] as const;

function WorkflowProgress({ order }: { order: Order }) {
  const paid = ["succeeded", "partially_refunded", "refunded"].includes(order.paymentStatus);
  const currentIndex = FULFILLMENT_STEPS.findIndex((step) => step.status === order.fulfillmentStatus);
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="mb-4 text-sm font-semibold text-gray-800">ความคืบหน้าของออเดอร์</p>
      <div className="grid grid-cols-5 gap-1">
        {[{ status: "paid", label: "ชำระเงิน" }, ...FULFILLMENT_STEPS].map((step, index) => {
          const complete = index === 0 ? paid : paid && currentIndex >= index - 1;
          const active = paid && ((index === 1 && order.fulfillmentStatus === "not_started") || currentIndex === index - 1);
          const Icon = complete ? CheckCircle2 : active ? Clock3 : Circle;
          return (
            <div key={step.status} className="relative flex min-w-0 flex-col items-center text-center">
              {index > 0 && <span className={`absolute right-1/2 top-2.5 h-0.5 w-full ${complete ? "bg-green-500" : "bg-gray-200"}`} />}
              <Icon className={`relative z-10 h-5 w-5 bg-white ${complete ? "text-green-500" : active ? "text-amber-500" : "text-gray-300"}`} />
              <span className={`mt-2 text-[10px] ${complete || active ? "font-medium text-gray-700" : "text-gray-400"}`}>{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function OrderStatusPage() {
  const { tableId } = useTable();
  const navigate = useNavigate();
  const paths = useCustomerPath();
  const { lastOrderId } = useCart();
  const orderId = lastOrderId ?? window.localStorage.getItem(`lastOrderId:${tableId}`);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    let active = true;
    const load = async () => {
      try {
        const latest = await fetchOrder(orderId);
        if (active) {
          setOrder(latest);
          setError(null);
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "โหลดสถานะออเดอร์ไม่สำเร็จ");
      }
    };
    load();
    const timer = window.setInterval(load, 3000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [orderId]);

  const summaryItems = useMemo<CartItem[]>(() => {
    if (!order) return [];
    return order.items.map((item) => ({
      productId: item.productId,
      productName: item.name,
      productImage: item.image ?? "",
      basePrice: Number(item.basePrice),
      quantity: item.qty,
      temperature: item.temperature === "hot" ? "hot" : "cold",
      toppings: item.toppings.map((topping) => ({ ...topping, price: Number(topping.price) })),
    }));
  }, [order]);

  const status = order ? STATUS_TEXT[displayStatus(order)] : null;

  return (
    <CustomerPageLayout showPager={false}>
      <div className="px-4 py-4 min-h-[50dvh] space-y-4">
        <p className="text-sm text-gray-700">โต๊ะ: <span className="font-semibold">{tableId}</span></p>
        {!orderId && <p className="text-center text-sm text-gray-500 py-10">ยังไม่มีออเดอร์ให้ติดตาม</p>}
        {orderId && !order && !error && (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" /> กำลังโหลดสถานะออเดอร์
          </div>
        )}
        {error && <p className="text-center text-sm text-red-500 py-6">{error}</p>}
        {order && status && (
          <>
            <div className={`rounded-xl px-4 py-4 text-center ${status[2]}`}>
              <p className="text-lg font-bold">{status[0]}</p>
              <p className="text-xs mt-1">{status[1]}</p>
              <p className="text-[11px] mt-2 opacity-70">เลขอ้างอิง {order.id}</p>
            </div>
            <WorkflowProgress order={order} />
            <OrderSummaryCard items={summaryItems} total={order.total} currency={order.currency} />
            {["pending", "failed", "cancelled"].includes(order.paymentStatus) && (
              <button
                type="button"
                onClick={() => order.latestPayment?.checkoutUrl
                  ? window.location.assign(order.latestPayment.checkoutUrl)
                  : navigate(paths.payment)}
                className="w-full rounded-lg bg-green-500 py-3 text-sm font-medium text-white"
              >
                กลับไปชำระเงิน
              </button>
            )}
          </>
        )}
      </div>
    </CustomerPageLayout>
  );
}
