/** Layout หลังบ้านร่วม: sidebar บน desktop, header บน mobile และ Outlet ของหน้าปัจจุบัน */
import { useLayoutEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import { Search } from "lucide-react";
import { StaffSidebar } from "./StaffSidebar";
import { ChefHat } from "lucide-react";
import { SHOP_SHORT } from "../../config/constants";
import { useStaffAuth } from "../../context/StaffAuthContext";
import { useLanguage } from "../../context/LanguageContext";

interface Props {
  variant: "manager" | "kitchen" | "waiter";
  showSearch?: boolean;
}

export function StaffLayout({ variant, showSearch = false }: Props) {
  const { language, setLanguage, t } = useLanguage();
  // หลังบ้านใช้ภาษาไทยภาษาเดียวตามข้อกำหนด แต่จำภาษาของลูกค้าไว้เพื่อคืนค่าเมื่อออกจาก /staff
  const previousLanguage = useRef(language);
  useLayoutEffect(() => {
    setLanguage("th");
    return () => setLanguage(previousLanguage.current);
  }, [setLanguage]);
  const { user } = useStaffAuth();
  return (
    <div className="flex min-h-dvh bg-[#f0f0f0]">
      <StaffSidebar variant={variant} />
      <main className="min-w-0 flex-1 overflow-auto px-3 pb-28 pt-3 sm:px-5 lg:p-6">
        <header className="sticky top-0 z-30 -mx-3 mb-4 flex items-center justify-between border-b border-gray-200 bg-[#f0f0f0]/95 px-4 py-3 backdrop-blur sm:-mx-5 lg:hidden">
          <div className="flex min-w-0 items-center gap-2"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand"><ChefHat className="h-5 w-5"/></span><div className="min-w-0"><p className="truncate text-sm font-bold text-brand">{SHOP_SHORT}</p><p className="text-[10px] text-gray-500">{t(variant === "manager" ? "ผู้จัดการ" : variant === "kitchen" ? "ห้องครัว" : "พนักงานเสิร์ฟ")}</p></div></div>
          <p className="max-w-24 truncate text-xs font-medium text-gray-600">{user?.displayName}</p>
        </header>
        {showSearch && (
          <div className="max-w-xl mx-auto mb-6 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="search"
              placeholder="ค้นหา"
              className="w-full rounded-full border border-gray-200 bg-white py-3 pl-12 pr-4 text-sm shadow-sm outline-none focus:border-brand"
            />
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
