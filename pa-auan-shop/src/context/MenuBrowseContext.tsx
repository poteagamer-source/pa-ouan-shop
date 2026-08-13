import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useCategories } from "./CategoriesContext";
import type { CategoryId } from "../types";

/** โหมดกรองหน้าเมนู: หมวดปกติ / เมนูแนะนำ / เมนูขายดี */
export type MenuViewMode = "category" | "recommended" | "bestseller";

/** state และคำสั่งควบคุมการเลื่อนหมวดของหน้าเมนูและ bottom navigation */
interface MenuBrowseContextValue {
  viewMode: MenuViewMode;
  category: CategoryId;
  categoryIndex: number;
  setViewMode: (mode: MenuViewMode) => void;
  setCategory: (id: CategoryId) => void;
  goPrevCategory: () => void;
  goNextCategory: () => void;
  resetToMenu: () => void;
}

// null ใช้แยกกรณี component อยู่นอก customer menu layout
const MenuBrowseContext = createContext<MenuBrowseContextValue | null>(null);

/** เก็บหมวด/โหมดที่ลูกค้ากำลังดู เพื่อให้ header, pager และรายการสินค้าเห็นค่าเดียวกัน */
export function MenuBrowseProvider({ children }: { children: ReactNode }) {
  const { categories } = useCategories();
  const [viewMode, setViewMode] = useState<MenuViewMode>("category");
  const [categoryIndex, setCategoryIndex] = useState(0);

  // ระหว่าง API หมวดยังไม่ตอบ ใช้ bualoy เป็น fallback ที่ตรงกับข้อมูลตั้งต้น
  const category = categories[categoryIndex]?.id ?? "bualoy";

  // เลือก chip หมวดใดจะออกจาก recommended/bestseller กลับสู่โหมด category อัตโนมัติ
  const setCategory = useCallback(
    (id: CategoryId) => {
      const idx = categories.findIndex((c) => c.id === id);
      if (idx >= 0) {
        setCategoryIndex(idx);
        setViewMode("category");
      }
    },
    [categories],
  );

  // ปุ่มก่อนหน้าแบบวนรอบ: หมวดแรกย้อนกลับไปหมวดสุดท้าย
  const goPrevCategory = useCallback(() => {
    setViewMode("category");
    setCategoryIndex((i) => (i <= 0 ? categories.length - 1 : i - 1));
  }, [categories]);

  // ปุ่มถัดไปแบบวนรอบ: หมวดสุดท้ายไปหมวดแรก
  const goNextCategory = useCallback(() => {
    setViewMode("category");
    setCategoryIndex((i) => (i >= categories.length - 1 ? 0 : i + 1));
  }, [categories]);

  const resetToMenu = useCallback(() => {
    setViewMode("category");
  }, []);

  const value = useMemo(
    () => ({
      viewMode,
      category,
      categoryIndex,
      setViewMode,
      setCategory,
      goPrevCategory,
      goNextCategory,
      resetToMenu,
    }),
    [
      viewMode,
      category,
      categoryIndex,
      setCategory,
      goPrevCategory,
      goNextCategory,
      resetToMenu,
    ],
  );

  return (
    <MenuBrowseContext.Provider value={value}>{children}</MenuBrowseContext.Provider>
  );
}

/** Hook แบบบังคับสำหรับหน้าที่ต้องควบคุมเมนู */
export function useMenuBrowse() {
  const ctx = useContext(MenuBrowseContext);
  if (!ctx) {
    throw new Error("useMenuBrowse must be used within MenuBrowseProvider");
  }
  return ctx;
}

/** Hook แบบ optional สำหรับ header/layout ที่อาจ render นอก MenuBrowseProvider */
export function useMenuBrowseOptional() {
  return useContext(MenuBrowseContext);
}
