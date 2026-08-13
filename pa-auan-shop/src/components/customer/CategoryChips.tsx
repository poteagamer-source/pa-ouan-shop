/** แถบเลือกหมวดเมนูของลูกค้า; รายการหมวดโหลดจาก CategoriesContext */
import type { CategoryId } from "../../types";
import { useCategories } from "../../context/CategoriesContext";
import { useLanguage } from "../../context/LanguageContext";

interface Props {
  active: CategoryId;
  onChange: (id: CategoryId) => void;
}

export function CategoryChips({ active, onChange }: Props) {
  const { categories } = useCategories();
  const { t } = useLanguage();
  return (
    <section className="px-4 py-3">
      <h2 className="text-sm font-semibold text-gray-800 mb-2">{t("หมวดหมู่")}</h2>
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onChange(cat.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              active === cat.id
                ? "bg-accent-blue text-gray-800 border border-accent-blue-dark/30"
                : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300"
            }`}
          >
            {t(cat.label)}
          </button>
        ))}
      </div>
    </section>
  );
}
