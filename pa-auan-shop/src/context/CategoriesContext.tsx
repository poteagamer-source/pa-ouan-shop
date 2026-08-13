import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { fetchCategories } from "../lib/api";
import type { CategoryId } from "../types";

/** รูปแบบหมวดที่ dropdown/chips ต้องใช้ โดย id จำกัดตาม CategoryId */
export interface CategoryOption {
  id: CategoryId;
  label: string;
}

interface CategoriesContextValue {
  categories: CategoryOption[];
  loading: boolean;
  error: string | null;
}

// มี default value เพราะบางหน้าสามารถแสดง loading ก่อน API ตอบได้โดยไม่ต้อง throw
const CategoriesContext = createContext<CategoriesContextValue>({
  categories: [],
  loading: true,
  error: null,
});

/** โหลดหมวดจาก backend หนึ่งครั้ง แล้วแชร์ให้ customer menu และหน้า manager */
export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // active ป้องกัน Promise ที่ตอบช้าพยายาม setState หลัง component ถูก unmount
    let active = true;
    fetchCategories()
      .then((data) => {
        if (active) setCategories(data);
      })
      .catch((err) => {
        console.error("โหลดหมวดหมู่สินค้าไม่สำเร็จ:", err);
        if (active) setError(err instanceof Error ? err.message : "โหลดหมวดหมู่สินค้าไม่สำเร็จ");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <CategoriesContext.Provider value={{ categories, loading, error }}>
      {children}
    </CategoriesContext.Provider>
  );
}

/** คืน categories พร้อม loading/error เพื่อให้แต่ละหน้าเลือกวิธีแสดงผลเอง */
export function useCategories() {
  return useContext(CategoriesContext);
}
