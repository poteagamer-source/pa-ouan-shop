import type { CartItem } from "../types";

interface Props {
  items: CartItem[];
  total: number;
  showTag?: boolean;
  currency?: string;
}

export function OrderSummaryCard({ items, total, showTag = true, currency = "THB" }: Props) {
  const item = items[0];
  if (!item) return null;
  const money = (value: number) => new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);

  return (
    <div className="rounded-xl bg-white p-4 shadow-md border border-gray-100">
      <div className="flex gap-3">
        <img src={item.productImage} alt="" className="w-20 h-20 rounded-lg object-cover shrink-0" />
        <div className="flex-1 text-sm">
          <p>{item.productName} {item.quantity} ชิ้น {money(item.basePrice)}</p>
          {item.toppings.map((topping) => (
            <p key={topping.id} className="text-gray-600">
              {topping.name} 1 ชิ้น {money(topping.price)}
            </p>
          ))}
          {showTag && (
            <span className="inline-block mt-1 rounded-full bg-accent-blue px-2 py-0.5 text-xs text-gray-700">
              {item.temperature === "cold" ? "เย็น" : "ร้อน"}
            </span>
          )}
          <p className="mt-2 text-base font-bold text-accent-blue-dark">{money(total)}</p>
        </div>
      </div>
    </div>
  );
}
