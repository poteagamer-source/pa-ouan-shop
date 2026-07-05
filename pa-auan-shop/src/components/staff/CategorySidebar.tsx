import { Plus, Package } from "lucide-react";
import type { CategoryId } from "../../types";
import { categoryMeta } from "../../config/constants";

interface CategorySidebarProps {
  categoryCounts: Record<CategoryId, number>;
  selected: CategoryId;
  onSelect: (id: CategoryId) => void;
  showAddButton?: boolean;
}

export function CategorySidebar({
  categoryCounts,
  selected,
  onSelect,
  showAddButton = false,
}: CategorySidebarProps) {
  return (
    <div className="w-full lg:w-56 shrink-0 space-y-2">
      <p className="text-sm font-semibold text-gray-700 mb-2">หมวดหมู่สินค้า</p>

      {showAddButton && (
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand text-white text-sm font-medium py-2.5 mb-2 hover:bg-brand-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          เพิ่มหมวดหมู่
        </button>
      )}

      {(Object.keys(categoryMeta) as CategoryId[]).map((id) => {
        const meta = categoryMeta[id];
        const isActive = id === selected;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
              isActive ? `${meta.bg} ${meta.border}` : "bg-white border-gray-200 hover:bg-gray-50"
            }`}
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-lg border-2 shrink-0 ${
                isActive ? `${meta.border} ${meta.text}` : "border-gray-300 text-gray-400"
              }`}
            >
              <Package className="w-4 h-4" />
            </span>
            <span>
              <span className={`block text-sm font-semibold ${isActive ? meta.text : "text-gray-700"}`}>
                {meta.label}
              </span>
              <span className="block text-xs text-gray-400">{categoryCounts[id] ?? 0} รายการ</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
