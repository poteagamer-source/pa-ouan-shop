import type { CartItem } from "../types";

interface Props {
  items: CartItem[];
  total: number;
  showTag?: boolean;
}

export function OrderSummaryCard({ items, total, showTag = true }: Props) {
  const item = items[0];
  if (!item) return null;

  return (
    <div className="rounded-xl bg-white p-4 shadow-md border border-gray-100">
      <div className="flex gap-3">
        <img
          src={item.productImage}
          alt=""
          className="w-20 h-20 rounded-lg object-cover shrink-0"
        />
        <div className="flex-1 text-sm">
          <p>
            {item.productName} {item.quantity} ฿ {item.basePrice} บาท
          </p>
          {item.toppings.map((t) => (
            <p key={t.id} className="text-gray-600">
              {t.name} 1 ฿ {t.price} บาท
            </p>
          ))}
          {showTag && (
            <span className="inline-block mt-1 rounded-full bg-accent-blue px-2 py-0.5 text-xs text-gray-700">
              {item.temperature === "cold" ? "เย็น" : "ร้อน"}
            </span>
          )}
          <p className="mt-2 text-base font-bold text-accent-blue-dark">
            ฿ {total.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
