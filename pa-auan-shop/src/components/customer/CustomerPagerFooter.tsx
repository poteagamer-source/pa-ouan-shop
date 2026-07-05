import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCategories } from "../../context/CategoriesContext";
import { useMenuBrowse } from "../../context/MenuBrowseContext";
import { useCustomerPath } from "../../hooks/useCustomerPath";

export function CustomerPagerFooter() {
  const location = useLocation();
  const navigate = useNavigate();
  const paths = useCustomerPath();
  const { categories } = useCategories();
  const { viewMode, categoryIndex, goPrevCategory, goNextCategory } = useMenuBrowse();

  const isMenu = location.pathname.endsWith("/menu");
  const showCategoryPager = isMenu && viewMode === "category";

  const handleBack = () => {
    if (showCategoryPager) {
      goPrevCategory();
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(paths.menu);
    }
  };

  const handleForward = () => {
    if (showCategoryPager) {
      goNextCategory();
      return;
    }
    navigate(1);
  };

  return (
    <footer className="flex justify-between items-center px-10 py-3 text-gray-600">
      <PagerButton label="กลับ" onClick={handleBack}>
        <ChevronLeft className="w-5 h-5 text-white" />
      </PagerButton>

      <div className="flex flex-col items-center gap-1">
        {showCategoryPager ? (
          <div className="flex gap-1.5">
            {categories.map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === categoryIndex ? "bg-gray-900" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        ) : (
          <span className="w-2 h-2 rounded-full bg-gray-900" />
        )}
      </div>

      <PagerButton label="ถัดไป" onClick={handleForward}>
        <ChevronRight className="w-5 h-5 text-white" />
      </PagerButton>
    </footer>
  );
}

function PagerButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1 text-xs text-gray-700"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 shadow-md">
        {children}
      </span>
      <span>{label}</span>
    </button>
  );
}
