/** Header ลูกค้า: ชื่อร้าน ภาษา โต๊ะ ช่องค้นหา รถเข็น และ badge จำนวนรายการ */
import { Link, useLocation } from "react-router-dom";
import { ClipboardList, Menu, ShoppingCart } from "lucide-react";
import { SHOP_NAME } from "../../config/constants";
import { useCart } from "../../context/CartContext";
import { useTable } from "../../context/TableContext";
import { useCustomerPath } from "../../hooks/useCustomerPath";
import { useMenuBrowseOptional } from "../../context/MenuBrowseContext";
import { useCategories } from "../../context/CategoriesContext";
import { LanguageToggle } from "../LanguageToggle";
import { useLanguage } from "../../context/LanguageContext";

export function CustomerHeader() {
  const { t } = useLanguage();
  const { cartCount, lastOrderId } = useCart();
  const { tableId } = useTable();
  const paths = useCustomerPath();
  const location = useLocation();
  const menuBrowse = useMenuBrowseOptional();
  const { categories } = useCategories();

  const isMenuPage = location.pathname.endsWith("/menu");
  const isStatusPage = location.pathname.endsWith("/status");
  const hasRecentOrder = Boolean(
    lastOrderId || window.localStorage.getItem(`lastOrderId:${tableId}`),
  );
  const searchPlaceholder =
    isMenuPage && menuBrowse?.viewMode === "category"
      ? t(categories.find((c) => c.id === menuBrowse.category)?.label ?? "ค้นหาเมนู")
      : t("ค้นหาเมนู");

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-100 px-4 pt-3 pb-2">
      <div className="flex items-center gap-2 mb-2">
        <button
          type="button"
          className="p-1 text-gray-700"
          aria-label="เมนู"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-sm font-medium text-gray-800 leading-tight">
          {t(SHOP_NAME, "Pa Ouan Bua Loi — Hat Yai Branch")}
        </h1>
        <LanguageToggle compact />
        <span className="shrink-0 rounded-full bg-brand text-white text-xs font-semibold px-2.5 py-0.5">
          {t("โต๊ะ")} {tableId}
        </span>
      </div>
      <div className="flex gap-2 items-center">
        {isMenuPage && (
          <div className="flex-1 relative">
            <input
              type="search"
              placeholder={searchPlaceholder}
              className="w-full rounded-full border border-gray-200 bg-white py-2 pl-4 pr-4 text-sm outline-none focus:border-brand"
            />
          </div>
        )}
        {hasRecentOrder && (
          <Link
            to={paths.status}
            aria-label={t("สถานะออเดอร์")}
            title={t("สถานะออเดอร์")}
            className={`relative flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium shadow-sm ${
              isStatusPage
                ? "bg-green-600 text-white"
                : "border border-green-200 bg-green-50 text-green-700"
            } ${isMenuPage ? "" : "ml-auto"}`}
          >
            <ClipboardList className="h-4 w-4" />
            <span>{t("สถานะออเดอร์")}</span>
          </Link>
        )}
        <Link
          to={paths.cart}
          className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand text-white shadow-sm ${
            isMenuPage || hasRecentOrder ? "" : "ml-auto"
          }`}
        >
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {cartCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
