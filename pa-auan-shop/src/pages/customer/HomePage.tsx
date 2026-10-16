/** หน้าเมนูลูกค้า: โหลดสินค้าที่เปิดขาย กรองตามหมวด/แนะนำ/ขายดี และรับ realtime */
import { useMemo } from "react";
import { CategoryChips } from "../../components/customer/CategoryChips";
import { CustomerPageLayout } from "../../components/customer/CustomerPageLayout";
import { ProductCard } from "../../components/customer/ProductCard";
import { useMenuProducts } from "../../hooks/useMenuProducts";
import { useCategories } from "../../context/CategoriesContext";
import { useMenuBrowse } from "../../context/MenuBrowseContext";
import { useLanguage } from "../../context/LanguageContext";

export function HomePage() {
  const { viewMode, category, setCategory } = useMenuBrowse();
  const { categories } = useCategories();
  const { products, loading, error } = useMenuProducts();
  const { t } = useLanguage();

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
        {error && <p role="alert" className="text-center text-sm text-red-600 py-2">{error}</p>}
        {loading ? (
          <p className="text-center text-sm text-gray-400 py-8">{t("กำลังโหลดเมนู...", "Loading menu...")}</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              {filtered.map((p, index) => (
                <ProductCard key={p.id} product={p} priority={index < 3} />
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
