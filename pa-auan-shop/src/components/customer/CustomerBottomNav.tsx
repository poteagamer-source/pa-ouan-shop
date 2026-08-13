import { Link, useLocation, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { Home, Heart, Plus, Sparkles } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useMenuBrowse } from "../../context/MenuBrowseContext";
import { useCustomerPath } from "../../hooks/useCustomerPath";

export function CustomerBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const paths = useCustomerPath();
  const { cartCount } = useCart();
  const { viewMode, setViewMode, resetToMenu } = useMenuBrowse();

  const isMenu = location.pathname.endsWith("/menu");
  const isHome = location.pathname === paths.home;

  const goMenuWithMode = (mode: "category" | "recommended" | "bestseller") => {
    setViewMode(mode);
    if (!isMenu) navigate(paths.menu);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 max-w-md mx-auto pointer-events-none">
      <div className="relative h-[72px] pointer-events-auto">
        <svg
          viewBox="0 0 400 72"
          className="absolute bottom-0 w-full h-[72px] drop-shadow-[0_-4px_12px_rgba(0,0,0,0.08)]"
          preserveAspectRatio="none"
        >
          <path
            d="M0 16 Q0 0 16 0 L152 0 Q168 0 176 8 Q188 28 200 28 Q212 28 224 8 Q232 0 248 0 L384 0 Q400 0 400 16 L400 72 L0 72 Z"
            fill="#aee6f6"
          />
        </svg>

        <div className="absolute inset-x-0 bottom-2 flex items-end justify-between px-6">
          <NavIcon
            label="หน้าหลัก"
            active={isHome}
            onClick={() => {
              resetToMenu();
              navigate(paths.home);
            }}
          >
            <Home className="w-5 h-5" strokeWidth={2} />
          </NavIcon>

          <NavIcon
            label="แนะนำ"
            active={viewMode === "recommended"}
            onClick={() => goMenuWithMode("recommended")}
          >
            <Sparkles className="w-5 h-5" strokeWidth={2} />
          </NavIcon>

          <div className="w-14" />

          <NavIcon
            label="ขายดี"
            active={viewMode === "bestseller"}
            onClick={() => goMenuWithMode("bestseller")}
          >
            <Heart
              className={`w-5 h-5 ${viewMode === "bestseller" ? "fill-gray-900" : ""}`}
              strokeWidth={2}
            />
          </NavIcon>

          <div className="min-w-[52px]" aria-hidden />
        </div>

        {/* ปุ่มกลางใช้เริ่มเลือกเมนูเพิ่ม ส่วนตะกร้าเปิดได้จากไอคอนด้านบน */}
        <Link
          to={paths.menu}
          onClick={resetToMenu}
          className="absolute left-1/2 -translate-x-1/2 -top-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#aee6f6] text-gray-900 shadow-lg border-4 border-[#fafafa] hover:scale-105 transition-transform"
          aria-label="สั่งอาหารเพิ่ม"
        >
          <Plus className="w-7 h-7" strokeWidth={2.5} />
          {cartCount > 0 && (
            <span className="absolute -top-0.5 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
              {cartCount}
            </span>
          )}
        </Link>
      </div>
    </nav>
  );
}

function NavIcon({
  children,
  label,
  active,
  onClick,
}: {
  children: ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 min-w-[52px] transition-opacity ${
        active ? "text-gray-900 opacity-100" : "text-gray-700 opacity-70 hover:opacity-100"
      }`}
    >
      {children}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
