import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { fetchCategories } from "../lib/api";
import type { CategoryId } from "../types";

export interface CategoryOption {
  id: CategoryId;
  label: string;
}

interface CategoriesContextValue {
  categories: CategoryOption[];
  loading: boolean;
  error: string | null;
}

const CategoriesContext = createContext<CategoriesContextValue>({
  categories: [],
  loading: true,
  error: null,
});

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

export function useCategories() {
  return useContext(CategoriesContext);
}
