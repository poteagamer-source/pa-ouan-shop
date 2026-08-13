/** การ์ดสินค้าใน grid: รูป ชื่อแปลภาษา ราคา และลิงก์ไปหน้ารายละเอียด */
import { Link } from "react-router-dom";
import type { Product } from "../../types";
import { useCustomerPath } from "../../hooks/useCustomerPath";
import { useLanguage } from "../../context/LanguageContext";

interface Props {
  product: Product;
  selected?: boolean;
}

export function ProductCard({ product, selected }: Props) {
  const paths = useCustomerPath();
  const { t } = useLanguage();

  return (
    <Link
      to={paths.product(product.id)}
      className={`block rounded-xl bg-white p-2 shadow-sm border transition-shadow hover:shadow-md ${
        selected ? "border-accent-blue-dark ring-1 ring-accent-blue-dark/40" : "border-transparent"
      }`}
    >
      <img
        src={product.image}
        alt={t(product.name)}
        className="w-full aspect-square object-cover rounded-lg"
      />
      <p className="mt-1.5 text-xs text-center text-gray-800 line-clamp-2 min-h-[2rem]">
        {t(product.name)}
      </p>
      <div className="flex items-center justify-between mt-1 px-0.5">
        <span className="text-xs font-semibold text-gray-700">
          ฿ {product.price}
        </span>
        <span className="rounded-full bg-brand px-2.5 py-0.5 text-[10px] font-medium text-white">
          {t("เลือก", "Select")}
        </span>
      </div>
    </Link>
  );
}
