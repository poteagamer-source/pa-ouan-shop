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

export type MenuViewMode = "category" | "recommended" | "bestseller";

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

const MenuBrowseContext = createContext<MenuBrowseContextValue | null>(null);

export function MenuBrowseProvider({ children }: { children: ReactNode }) {
  const { categories } = useCategories();
  const [viewMode, setViewMode] = useState<MenuViewMode>("category");
  const [categoryIndex, setCategoryIndex] = useState(0);

  const category = categories[categoryIndex]?.id ?? "bualoy";

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

  const goPrevCategory = useCallback(() => {
    setViewMode("category");
    setCategoryIndex((i) => (i <= 0 ? categories.length - 1 : i - 1));
  }, [categories]);

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

export function useMenuBrowse() {
  const ctx = useContext(MenuBrowseContext);
  if (!ctx) {
    throw new Error("useMenuBrowse must be used within MenuBrowseProvider");
  }
  return ctx;
}

export function useMenuBrowseOptional() {
  return useContext(MenuBrowseContext);
}
