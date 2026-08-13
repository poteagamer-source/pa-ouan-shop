/** การ์ดสรุปตะกร้า/ออเดอร์ แยกแต่ละเมนู ท็อปปิ้ง อุณหภูมิ และยอดรวม */
import type { CartItem } from "../types";
import { useLanguage } from "../context/LanguageContext";

interface Props {
  items: CartItem[];
  total: number;
  showTag?: boolean;
  currency?: string;
}

/** แยกสินค้าแต่ละเมนูเป็นคนละการ์ด และแสดงยอดรวมไว้ท้ายรายการ */
export function OrderSummaryCard({ items, total, showTag = true, currency = "THB" }: Props) {
  const { t, language } = useLanguage();
  if (items.length === 0) return null;
  const money = (value: number) => new Intl.NumberFormat(language === "en" ? "en-US" : "th-TH", { style: "currency", currency }).format(value);

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const toppingsTotal = item.toppings.reduce((sum, topping) => sum + topping.price, 0);
        const itemTotal = (item.basePrice + toppingsTotal) * item.quantity;
        return (
          <article key={`${item.productId}-${item.temperature}-${index}`} className="rounded-xl border border-gray-100 bg-white p-4 shadow-md">
            <div className="flex gap-3">
              <img src={item.productImage} alt={t(item.productName)} className="h-20 w-20 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0 flex-1 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-gray-800">{t(item.productName)}</p>
                  <p className="shrink-0 font-bold text-accent-blue-dark">{money(itemTotal)}</p>
                </div>
                <p className="mt-1 text-gray-500">{item.quantity} {t("ชิ้น", "item(s)")} × {money(item.basePrice)}</p>
                {item.toppings.length > 0 && <div className="mt-1 text-gray-600">
                  {item.toppings.map((topping) => <p key={topping.id}>+ {t(topping.name)} {money(topping.price)}</p>)}
                </div>}
                {showTag && <span className="mt-2 inline-block rounded-full bg-accent-blue px-2 py-0.5 text-xs text-gray-700">
                  {item.temperature === "cold" ? t("เย็น") : t("ร้อน")}
                </span>}
              </div>
            </div>
          </article>
        );
      })}
      <div className="flex items-center justify-between rounded-xl border border-brand/20 bg-brand-light/50 px-4 py-3">
        <span className="font-semibold text-gray-700">{t("ราคารวมทั้งหมด", "Grand total")}</span>
        <span className="text-xl font-bold text-brand">{money(total)}</span>
      </div>
    </div>
  );
}
