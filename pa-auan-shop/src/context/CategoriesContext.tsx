import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { fetchCategories, subscribeToUpdates } from "../lib/api";
import type { CategoryId } from "../types";

/** หมวดหมู่จากฐานข้อมูล รวมหมวดที่ผู้จัดการสร้างใหม่ */
export interface CategoryOption {
  id: CategoryId;
  label: string;
}

interface CategoriesContextValue {
  categories: CategoryOption[];
  loading: boolean;
  error: string | null;
  addCategory: (category: CategoryOption) => void;
}

// มี default value เพราะบางหน้าสามารถแสดง loading ก่อน API ตอบได้โดยไม่ต้อง throw
const CategoriesContext = createContext<CategoriesContextValue>({
  categories: [],
  loading: true,
  error: null,
  addCategory: () => {},
});

/** แชร์หมวดระหว่างหน้าจัดการและเมนูลูกค้า พร้อมอัปเดตเมื่อมีการเพิ่มหมวด */
export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const addCategory = (category: CategoryOption) => {
    ++requestId.current;
    setCategories(current => [...current.filter(item => item.id !== category.id), category]);
    setLoading(false);
    setError(null);
  };

  useEffect(() => {
    // active ป้องกัน Promise ที่ตอบช้าพยายาม setState หลัง component ถูก unmount
    let active = true;
    const load = () => {
    const id = ++requestId.current;
    return fetchCategories()
      .then((data) => {
        if (active && id === requestId.current) { setCategories(data); setError(null); }
      })
      .catch((err) => {
        console.error("โหลดหมวดหมู่สินค้าไม่สำเร็จ:", err);
        if (active && id === requestId.current) setError(err instanceof Error ? err.message : "โหลดหมวดหมู่สินค้าไม่สำเร็จ");
      })
      .finally(() => {
        if (active && id === requestId.current) setLoading(false);
      });
    };
    void load();
    const unsubscribe = subscribeToUpdates(event => { if (event.resource === 'categories') void load(); }, connected => { if (connected) void load(); });
    const onFocus = () => { void load(); };
    window.addEventListener('focus', onFocus);
    return () => {
      active = false;
      unsubscribe();
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  return (
    <CategoriesContext.Provider value={{ categories, loading, error, addCategory }}>
      {children}
    </CategoriesContext.Provider>
  );
}

/** คืน categories พร้อม loading/error เพื่อให้แต่ละหน้าเลือกวิธีแสดงผลเอง */
export function useCategories() {
  return useContext(CategoriesContext);
}
