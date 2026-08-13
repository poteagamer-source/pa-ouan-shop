import { NavLink } from "react-router-dom";
import {
  Home,
  ClipboardList,
  Truck,
  Archive,
  FileBarChart2,
  ChefHat,
  ConciergeBell,
  FileText,
  Flame,
  CheckCircle2,
  LogOut,
  Users,
} from "lucide-react";
import { SHOP_SHORT } from "../../config/constants";
import { useStaffAuth } from "../../context/StaffAuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { LanguageToggle } from "../LanguageToggle";

const managerLinks = [
  { to: "/staff", label: "หน้าหลัก", icon: Home, end: true },
  { to: "/staff/menu", label: "จัดการเมนูสินค้า", icon: ClipboardList },
  { to: "/staff/purchase-orders", label: "รายการสั่งซื้อ", icon: Truck },
  { to: "/staff/stock", label: "สต๊อกสินค้า", icon: Archive },
  { to: "/staff/report", label: "รายงานยอดขาย", icon: FileBarChart2 },
  { to: "/staff/users", label: "จัดการพนักงาน", icon: Users },
];

const moduleSwitchLinks = [
  { to: "/staff", label: "ผู้จัดการ", icon: Home },
  { to: "/staff/kitchen", label: "ห้องครัว", icon: ChefHat },
  { to: "/staff/waiter", label: "พนักงานเสิร์ฟ", icon: ConciergeBell },
];

const kitchenSubLinks = [
  { to: "/staff/kitchen", label: "หน้าห้องครัว", icon: Home, end: true },
  { to: "/staff/kitchen/orders", label: "รายการออเดอร์", icon: FileText },
  { to: "/staff/kitchen/cooking", label: "กำลังทำอาหาร", icon: Flame },
  { to: "/staff/kitchen/ready", label: "พร้อมเสิร์ฟ", icon: ConciergeBell },
];

const waiterSubLinks = [
  { to: "/staff/waiter", label: "งานของฉัน", icon: ConciergeBell, end: true },
  { to: "/staff/waiter/served", label: "เสิร์ฟแล้ว", icon: CheckCircle2 },
];

interface Props {
  variant: "manager" | "kitchen" | "waiter";
}

export function StaffSidebar({ variant }: Props) {
  const { user, logout } = useStaffAuth();
  const { t } = useLanguage();
  const links =
    variant === "manager" ? managerLinks : variant === "kitchen" ? kitchenSubLinks : waiterSubLinks;

  const switches = moduleSwitchLinks.filter((link) => {
    if (user?.role === "manager") return true;
    return link.to.includes(user?.role ?? "");
  });

  return <>
    <aside className="hidden min-h-dvh w-60 shrink-0 flex-col border-r border-gray-200 bg-white px-4 py-6 lg:flex">
      <div className="flex items-center gap-2 mb-6 px-1">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-light text-brand shrink-0">
          <ChefHat className="w-5 h-5" />
        </span>
        <h1 className="hidden text-base font-bold leading-tight text-brand md:block">{SHOP_SHORT}</h1>
      </div>
      <div className="mb-4"><LanguageToggle /></div>

      {variant === "manager" && (
        <p className="mb-3 hidden px-1 text-sm font-bold text-gray-800 md:block">{t("จัดการร้านค้า")}</p>
      )}

      {(variant === "kitchen" || variant === "waiter") && (
        <div className="flex gap-1.5 mb-4">
          {switches.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              title={t(label)}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors ${
                  isActive ? "bg-brand-light text-brand" : "text-gray-400 hover:bg-gray-50"
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{t(label)}</span>
            </NavLink>
          ))}
        </div>
      )}

      {variant === "kitchen" && (
        <p className="mb-3 hidden px-1 text-sm font-bold text-gray-800 md:block">{t("ห้องครัว")}</p>
      )}
      {variant === "waiter" && (
        <p className="mb-3 hidden px-1 text-sm font-bold text-gray-800 md:block">{t("หน้าจอพนักงานเสิร์ฟ")}</p>
      )}

      <nav className="space-y-1">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={t(label)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-brand-light text-brand font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span>{t(label)}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-8 border-t border-gray-100 pt-4">
        <p className="truncate px-2 text-xs font-medium text-gray-700">{user?.displayName}</p>
        <p className="mb-2 px-2 text-[11px] text-gray-400">{user?.role}</p>
        <button type="button" title={t("ออกจากระบบ")} onClick={() => void logout()} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-500 hover:bg-red-50"><LogOut className="h-5 w-5 shrink-0" /><span>{t("ออกจากระบบ")}</span></button>
      </div>
    </aside>

    <nav className="no-scrollbar fixed inset-x-0 bottom-0 z-50 flex items-stretch gap-1 overflow-x-auto border-t border-gray-200 bg-white/95 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden">
      {user?.role === "manager" && variant !== "manager" && switches.map(({ to, label, icon: Icon }) => <NavLink key={`switch-${to}`} to={to} className={({isActive})=>`flex min-w-[68px] flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] ${isActive?"bg-brand-light text-brand":"text-gray-500"}`}><Icon className="h-5 w-5"/><span className="whitespace-nowrap">{t(label)}</span></NavLink>)}
      {links.map(({to,label,icon:Icon,end})=><NavLink key={`mobile-${to}`} to={to} end={end} className={({isActive})=>`flex min-w-[72px] flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] ${isActive?"bg-brand-light font-medium text-brand":"text-gray-500"}`}><Icon className="h-5 w-5"/><span className="whitespace-nowrap">{t(label)}</span></NavLink>)}
      <button type="button" onClick={()=>void logout()} className="flex min-w-[68px] flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] text-red-500"><LogOut className="h-5 w-5"/><span>{t("ออกจากระบบ")}</span></button>
    </nav>
  </>;
}
