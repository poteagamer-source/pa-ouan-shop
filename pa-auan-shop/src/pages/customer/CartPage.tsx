import { OptimizedImage } from '../../components/OptimizedImage';
/** หน้าตะกร้า: แสดงรายการแยกการ์ด ยอดรวม และทางกลับเมนู/ไปชำระเงิน */
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchToppings } from "../../lib/api";
import type { CartItem, Topping } from "../../types";
import { CustomerPageLayout } from "../../components/customer/CustomerPageLayout";
import { OrderSummaryCard } from "../../components/OrderSummaryCard";
import { useCart } from "../../context/CartContext";
import { images } from "../../data/images";
import { useCustomerPath } from "../../hooks/useCustomerPath";
import { useLanguage } from "../../context/LanguageContext";

export function CartPage() {
  const { t } = useLanguage();
  const paths = useCustomerPath();
  const { items, total, replaceItems } = useCart();
  const [draft, setDraft] = useState<CartItem[] | null>(null);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [toppingError, setToppingError] = useState(false);
  const [toppingLoading, setToppingLoading] = useState(false);
  const editing = draft !== null;
  const shown = draft ?? items;
  const shownTotal = draft ? draft.reduce((sum, item) => sum + (item.basePrice + item.toppings.reduce((amount, topping) => amount + topping.price, 0)) * item.quantity, 0) : total;
  useEffect(() => {
    if (!editing) return;
    let active = true;
    setToppingLoading(true);
    setToppingError(false);
    fetchToppings().then(data => { if (active) setToppings(data); })
      .catch(() => { if (active) setToppingError(true); })
      .finally(() => { if (active) setToppingLoading(false); });
    return () => { active = false; };
  }, [editing]);
  const changeItem = (index: number, update: Partial<CartItem>) => {
    setDraft(current => current?.map((item, position) => position === index ? { ...item, ...update } : item) ?? null);
  };

  return (
    <CustomerPageLayout>
      <div className="px-4 py-4 relative min-h-[50dvh]">
        {items.length === 0 && !editing ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <OptimizedImage
              src={images.logoMascot}
              alt=""
              className="w-32 h-32 object-contain opacity-40 mb-4"
            />
            <p className="text-sm text-gray-500 mb-6">{t("ยังไม่มีสินค้าในตะกร้า")}</p>
            <Link
              to={paths.menu}
              className="rounded-lg bg-brand px-6 py-2.5 text-sm font-medium text-white"
            >
              {t("เลือกเมนู")}
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-2 text-right">
              <button
                type="button"
                onClick={() => setDraft(editing ? null : items.map(item => ({ ...item, toppings: [...item.toppings] })))}
                className="inline-flex min-h-10 items-center rounded-lg px-3 text-xs font-medium text-brand hover:bg-brand-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                {editing ? t("ยกเลิก", "Cancel") : t("แก้ไข")}
              </button>
            </div>
            {editing && <p className="mb-3 text-xs text-gray-500">{t("แก้ไขรายการแล้วกดบันทึกการแก้ไข", "Edit your items, then save changes")}</p>}
            {editing && toppingError && <p role="alert" className="mb-3 text-sm text-red-600">{t("โหลดท็อปปิ้งไม่สำเร็จ ยังแก้จำนวนและร้อน/เย็นได้", "Could not load toppings. Quantity and temperature can still be changed.")}</p>}
            {editing && shown.length === 0 && <p role="status" className="py-8 text-center text-sm text-gray-500">{t("ลบรายการทั้งหมดแล้ว กดบันทึกเพื่อยืนยัน หรือยกเลิกเพื่อคืนรายการ", "All items removed. Save to confirm or cancel to restore.")}</p>}
            <OrderSummaryCard items={shown} total={shownTotal} renderControls={editing ? (item, index) => (
              <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs">{t("จำนวน", "Quantity")}</span>
                    <button type="button" aria-label={t("ลดจำนวน", "Decrease quantity")} disabled={item.quantity <= 1} onClick={() => changeItem(index, { quantity: item.quantity - 1 })} className="h-9 w-9 rounded-lg border disabled:opacity-30">−</button>
                    <span className="text-sm font-semibold">{item.quantity}</span>
                    <button type="button" aria-label={t("เพิ่มจำนวน", "Increase quantity")} disabled={item.quantity >= 99} onClick={() => changeItem(index, { quantity: Math.min(99, item.quantity + 1) })} className="h-9 w-9 rounded-lg border">+</button>
                  </div>
                  <button type="button" onClick={() => setDraft(current => current?.filter((_, position) => position !== index) ?? null)} className="px-3 py-2 text-sm text-red-600">{t("ลบรายการ", "Remove item")}</button>
                </div>
                <label className="flex items-center gap-2 text-sm">{t("อุณหภูมิ", "Temperature")}
                  <select value={item.temperature} onChange={event => changeItem(index, { temperature: event.target.value as 'cold' | 'hot' })} className="rounded-lg border px-3 py-2"><option value="cold">{t("เย็น")}</option><option value="hot">{t("ร้อน")}</option></select>
                </label>
                <fieldset className="flex flex-wrap gap-3 text-xs">
                  <legend className="mb-2 font-medium">{t("ท็อปปิ้ง", "Toppings")}</legend>
                  {toppingLoading && <span>{t("กำลังโหลด...", "Loading...")}</span>}
                  {[...item.toppings, ...toppings.filter(topping => !item.toppings.some(selected => selected.id === topping.id))].map(topping => (
                    <label key={topping.id} className="flex items-center gap-1"><input type="checkbox" checked={item.toppings.some(selected => selected.id === topping.id)} onChange={event => changeItem(index, { toppings: event.target.checked ? [...item.toppings, { id: topping.id, name: topping.name, price: topping.price }] : item.toppings.filter(selected => selected.id !== topping.id) })} />{t(topping.name)} (+฿{topping.price})</label>
                  ))}
                </fieldset>
              </div>
            ) : undefined} />

            <OptimizedImage
              src={images.logoMascot}
              alt=""
              className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 w-44 h-44 object-contain opacity-25"
            />

            <div className="mt-8 flex justify-end relative z-10">
              <div className="flex flex-col gap-2">
                <Link
                  to={paths.menu}
                  className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white text-center"
                >
                  {t("ย้อนกลับ")}
                </Link>
                {editing ? <button type="button" onClick={() => { replaceItems(draft); setDraft(null); }} className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white">{t("บันทึกการแก้ไข", "Save changes")}</button> : <Link
                  to={paths.payment}
                  className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white text-center"
                >
                  {t("ชำระเงิน")}
                </Link>}
              </div>
            </div>
          </>
        )}
      </div>
    </CustomerPageLayout>
  );
}
