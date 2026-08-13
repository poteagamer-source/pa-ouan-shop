import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Minus, Plus } from "lucide-react";
import { CustomerPageLayout } from "../../components/customer/CustomerPageLayout";
import { fetchProduct, fetchToppings } from "../../lib/api";
import { useCart } from "../../context/CartContext";
import { useCustomerPath } from "../../hooks/useCustomerPath";
import type { Product, Topping } from "../../types";
import { useLanguage } from "../../context/LanguageContext";

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const paths = useCustomerPath();
  const { addItem } = useCart();
  const { t } = useLanguage();

  const [product, setProduct] = useState<Product | null>(null);
  const [toppings5, setToppings5] = useState<Topping[]>([]);
  const [toppings10, setToppings10] = useState<Topping[]>([]);
  const [loading, setLoading] = useState(true);

  const [qty, setQty] = useState(1);
  const [temp, setTemp] = useState<"cold" | "hot">("cold");
  const [selectedToppings, setSelectedToppings] = useState<
    { id: string; name: string; price: number }[]
  >([]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    Promise.all([fetchProduct(id), fetchToppings(5), fetchToppings(10)])
      .then(([productData, t5, t10]) => {
        if (!active) return;
        setProduct(productData);
        setToppings5(t5);
        setToppings10(t10);
      })
      .catch((err) => console.error("โหลดข้อมูลสินค้าไม่สำเร็จ:", err))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const toggleTopping = (t: { id: string; name: string; price: number }) => {
    setSelectedToppings((prev) =>
      prev.some((x) => x.id === t.id)
        ? prev.filter((x) => x.id !== t.id)
        : [...prev, { id: t.id, name: t.name, price: t.price }],
    );
  };

  const toppingTotal = selectedToppings.reduce((s, t) => s + t.price, 0);
  const lineTotal = product ? (product.price + toppingTotal) * qty : 0;

  const handleAdd = () => {
    if (!product) return;
    addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      basePrice: product.price,
      quantity: qty,
      temperature: temp,
      toppings: selectedToppings,
    });
    navigate(paths.cart);
  };

  if (loading) {
    return (
      <CustomerPageLayout showPager={false}>
        <p className="text-center text-sm text-gray-400 py-16">{t("กำลังโหลดข้อมูลสินค้า...", "Loading item...")}</p>
      </CustomerPageLayout>
    );
  }

  if (!product) {
    return (
      <CustomerPageLayout showPager={false}>
        <p className="text-center text-sm text-gray-400 py-16">{t("ไม่พบสินค้านี้", "Item not found")}</p>
      </CustomerPageLayout>
    );
  }

  return (
    <CustomerPageLayout showPager={false}>
      <div className="px-4 py-4 space-y-4 pb-4">
        <div className="flex gap-4 items-start">
          <img
            src={product.image}
            alt={product.name}
            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
          />
          <div className="flex-1 text-sm space-y-1">
            <p>
              {t(product.name)} {qty} × ฿{product.price}
            </p>
            {selectedToppings.map((topping) => (
              <p key={topping.id} className="text-gray-600">
                {t(topping.name)} 1 × ฿{topping.price}
              </p>
            ))}
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="temp"
                  checked={temp === "cold"}
                  onChange={() => setTemp("cold")}
                  className="accent-brand"
                />
                <span>{t("เย็น")}</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="temp"
                  checked={temp === "hot"}
                  onChange={() => setTemp("hot")}
                  className="accent-brand"
                />
                <span>{t("ร้อน")}</span>
              </label>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center font-semibold border rounded-lg py-1">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <ToppingSection title={t("ท็อปปิ้ง 5 บาท", "Toppings — THB 5")} items={toppings5} selected={selectedToppings} onToggle={toggleTopping} />
        <ToppingSection title={t("ท็อปปิ้ง 10 บาท", "Toppings — THB 10")} items={toppings10} selected={selectedToppings} onToggle={toggleTopping} />
      </div>

      <div className="sticky bottom-24 z-20 bg-white border-t border-gray-100 px-4 py-4 flex items-end justify-between gap-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <div>
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-xl font-bold">฿ {lineTotal.toFixed(2)}</p>
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleAdd}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white"
          >
            {t("เพิ่มลงในตะกร้า")}
          </button>
          <button
            type="button"
            onClick={handleAdd}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white text-center"
          >
            {t("ยืนยัน")}
          </button>
        </div>
      </div>
    </CustomerPageLayout>
  );
}

function ToppingSection({
  title,
  items,
  selected,
  onToggle,
}: {
  title: string;
  items: { id: string; name: string; price: number; image: string }[];
  selected: { id: string; name: string; price: number }[];
  onToggle: (t: { id: string; name: string; price: number }) => void;
}) {
  const { t } = useLanguage();
  return (
    <div>
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {items.map((topping) => {
          const isOn = selected.some((s) => s.id === topping.id);
          return (
            <button
              key={topping.id}
              type="button"
              onClick={() => onToggle(topping)}
              className={`shrink-0 w-20 text-center ${isOn ? "opacity-100" : "opacity-80"}`}
            >
              <div className="relative">
                <img src={topping.image} alt={t(topping.name)} className="w-16 h-16 rounded-lg object-cover mx-auto" />
                <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white text-xs">
                  +
                </span>
              </div>
              <p className="text-[10px] mt-1 text-gray-700">{t(topping.name)}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
