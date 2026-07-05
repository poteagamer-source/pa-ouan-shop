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
} from "lucide-react";
import { SHOP_SHORT } from "../../config/constants";

const managerLinks = [
  { to: "/staff", label: "หน้าหลัก", icon: Home, end: true },
  { to: "/staff/menu", label: "จัดการเมนูสินค้า", icon: ClipboardList },
  { to: "/staff/purchase-orders", label: "รายการสั่งซื้อ", icon: Truck },
  { to: "/staff/stock", label: "สต๊อกสินค้า", icon: Archive },
  { to: "/staff/report", label: "รายงานยอดขาย", icon: FileBarChart2 },
];

const moduleSwitchLinks = [
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
  const links =
    variant === "manager" ? managerLinks : variant === "kitchen" ? kitchenSubLinks : waiterSubLinks;

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-gray-200 min-h-dvh py-6 px-4">
      <div className="flex items-center gap-2 mb-6 px-1">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-light text-brand shrink-0">
          <ChefHat className="w-5 h-5" />
        </span>
        <h1 className="text-base font-bold text-brand leading-tight">{SHOP_SHORT}</h1>
      </div>

      {variant === "manager" && (
        <p className="px-1 mb-3 text-sm font-bold text-gray-800">จัดการร้านค้า</p>
      )}

      {(variant === "kitchen" || variant === "waiter") && (
        <div className="flex gap-1.5 mb-4">
          {moduleSwitchLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors ${
                  isActive ? "bg-brand-light text-brand" : "text-gray-400 hover:bg-gray-50"
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </div>
      )}

      {variant === "kitchen" && (
        <p className="px-1 mb-3 text-sm font-bold text-gray-800">ห้องครัว</p>
      )}
      {variant === "waiter" && (
        <p className="px-1 mb-3 text-sm font-bold text-gray-800">หน้าจอพนักงานเสิร์ฟ</p>
      )}

      <nav className="space-y-1">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-brand-light text-brand font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
