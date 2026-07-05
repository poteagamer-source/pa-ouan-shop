import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Loader2 } from "lucide-react";
import { CustomerPageLayout } from "../../components/customer/CustomerPageLayout";
import { OrderSummaryCard } from "../../components/OrderSummaryCard";
import { useCart } from "../../context/CartContext";
import { createOrder, attachSlip } from "../../lib/api";
import { useTable } from "../../context/TableContext";
import { useCustomerPath } from "../../hooks/useCustomerPath";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("อ่านไฟล์สลิปไม่สำเร็จ"));
    reader.readAsDataURL(file);
  });
}

export function PaymentPage() {
  const { tableId } = useTable();
  const paths = useCustomerPath();
  const navigate = useNavigate();
  const { items, total, clearCart, setLastOrderId } = useCart();
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (items.length === 0) {
      navigate(paths.menu);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const note = items.some((i) => i.temperature === "hot") ? "ร้อน" : "เย็น";
      const order = await createOrder({ table: tableId, note, items });

      if (slipFile) {
        const base64 = await fileToBase64(slipFile);
        await attachSlip(order.id, base64);
      }

      setLastOrderId(order.id);
      clearCart();
      navigate(paths.status);
    } catch (err) {
      console.error("สร้างออเดอร์ไม่สำเร็จ:", err);
      setError(err instanceof Error ? err.message : "ไม่สามารถส่งออเดอร์ได้ กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CustomerPageLayout showPager={false}>
      <div className="px-4 py-3 space-y-4">
        <p className="text-sm text-gray-700">
          Table: <span className="font-semibold">{tableId}</span>
        </p>

        {items.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">ยังไม่มีสินค้าในตะกร้า</p>
        ) : (
          <OrderSummaryCard items={items} total={total} />
        )}

        <div className="rounded-xl bg-white p-6 shadow-md border border-gray-100 text-center">
          <span className="inline-block rounded-full bg-blue-600 px-4 py-1 text-xs font-bold tracking-wide text-white mb-4">
            PromptPay
          </span>
          <div className="mx-auto w-48 h-48 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center mb-4">
            <svg viewBox="0 0 100 100" className="w-40 h-40">
              <rect x="0" y="0" width="20" height="20" fill="#000" />
              <rect x="25" y="0" width="15" height="15" fill="#000" />
              <rect x="50" y="0" width="20" height="20" fill="#000" />
              <rect x="0" y="25" width="15" height="15" fill="#000" />
              <rect x="40" y="30" width="25" height="25" fill="#000" />
              <rect x="70" y="25" width="20" height="20" fill="#000" />
              <rect x="10" y="50" width="20" height="20" fill="#000" />
              <rect x="50" y="55" width="15" height="15" fill="#000" />
              <rect x="75" y="50" width="20" height="20" fill="#000" />
              <rect x="0" y="75" width="25" height="25" fill="#000" />
              <rect x="35" y="70" width="20" height="20" fill="#000" />
              <rect x="65" y="75" width="30" height="30" fill="#000" />
            </svg>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>ชื่อบัญชี</span>
            <span className="font-medium text-gray-800">วรินทร์ สุขสวัสดิ์</span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600 mt-1">
            <span>จำนวนเงินทั้งหมด</span>
            <span className="font-bold">{total.toFixed(2)} บาท</span>
          </div>
          <p className="text-xs text-red-500 mt-4 italic">
            *กรุณาชำระเงินก่อน ระบบจะส่งรายการไปห้องครัว*
          </p>
        </div>

        <label className="flex items-center justify-between rounded-xl bg-white border border-gray-200 px-4 py-3 shadow-sm cursor-pointer">
          <span className="text-sm text-gray-500">
            {slipFile?.name ?? "หลักฐานการโอนเงิน / สลิป"}
          </span>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand">
            <Upload className="w-4 h-4" />
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setSlipFile(e.target.files?.[0] ?? null)}
          />
        </label>

        {error && <p className="text-xs text-red-500 text-center">{error}</p>}

        <div className="flex items-center justify-between rounded-xl bg-white border border-gray-200 px-4 py-3 shadow-sm">
          <p className="text-sm">
            จำนวนเงินทั้งหมด <span className="font-bold">{total.toFixed(2)} บาท</span>
          </p>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || items.length === 0}
            className="flex items-center gap-2 rounded-lg bg-green-500 px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            ยืนยัน
          </button>
        </div>
      </div>
    </CustomerPageLayout>
  );
}
