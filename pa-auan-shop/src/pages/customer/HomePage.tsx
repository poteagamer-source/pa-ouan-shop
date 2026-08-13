/** หน้าเมนูลูกค้า: โหลดสินค้าที่เปิดขาย กรองตามหมวด/แนะนำ/ขายดี และรับ realtime */
import { useEffect, useMemo, useState } from "react";
import { CategoryChips } from "../../components/customer/CategoryChips";
import { CustomerPageLayout } from "../../components/customer/CustomerPageLayout";
import { ProductCard } from "../../components/customer/ProductCard";
import { fetchProducts, subscribeToUpdates } from "../../lib/api";
import { useCategories } from "../../context/CategoriesContext";
import { useMenuBrowse } from "../../context/MenuBrowseContext";
import type { Product } from "../../types";
import { useLanguage } from "../../context/LanguageContext";

export function HomePage() {
  const { viewMode, category, setCategory } = useMenuBrowse();
  const { categories } = useCategories();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    let active = true;
    const load = (showLoading = false) => {
      if (showLoading) setLoading(true);
      fetchProducts({ active: true })
        .then((data) => {
          if (active) setProducts(data);
        })
        .catch((err) => console.error("โหลดสินค้าไม่สำเร็จ:", err))
        .finally(() => {
          if (active) setLoading(false);
        });
    };
    load(true);
    const unsubscribe = subscribeToUpdates((update) => {
      if (update.resource === "products") load();
    });
    const fallback = window.setInterval(() => load(), 15000);
    const refreshOnFocus = () => load();
    window.addEventListener("focus", refreshOnFocus);
    return () => {
      active = false;
      unsubscribe();
      window.clearInterval(fallback);
      window.removeEventListener("focus", refreshOnFocus);
    };
  }, []);

  const filtered = useMemo(() => {
    if (viewMode === "bestseller") {
      return products.filter((p) => p.bestseller);
    }
    if (viewMode === "recommended") {
      return products.filter((p) => p.recommended);
    }
    return products.filter((p) => p.category === category);
  }, [products, viewMode, category]);

  const sectionTitle = useMemo(() => {
    if (viewMode === "bestseller") return t("เมนูขายดีประจำร้าน", "Store bestsellers");
    if (viewMode === "recommended") return t("เมนูแนะนำ", "Recommended menu");
    const catLabel = categories.find((c) => c.id === category)?.label ?? "";
    return `${t("เมนู", "Menu: ")}${t(catLabel)}`;
  }, [viewMode, category, categories, t]);

  return (
    <CustomerPageLayout>
      {viewMode === "category" && (
        <CategoryChips active={category} onChange={setCategory} />
      )}
      {viewMode !== "category" && (
        <div className="px-4 pt-3">
          <span className="inline-block rounded-full bg-accent-blue px-3 py-1 text-xs font-medium text-gray-800">
            {viewMode === "bestseller" ? t("เมนูขายดี", "Bestsellers") : t("เมนูแนะนำ", "Recommended")}
          </span>
        </div>
      )}
      <section className="px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">{sectionTitle}</h2>
        {loading ? (
          <p className="text-center text-sm text-gray-400 py-8">{t("กำลังโหลดเมนู...", "Loading menu...")}</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            {filtered.length === 0 && (
              <p className="text-center text-sm text-gray-500 py-8">{t("ไม่มีรายการในหมวดนี้", "No items in this category")}</p>
            )}
          </>
        )}
      </section>
    </CustomerPageLayout>
  );
}
