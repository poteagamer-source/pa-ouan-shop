import { FileText, Flame, ConciergeBell, CheckCircle2 } from "lucide-react";
import { NavLink } from "react-router-dom";
import { kitchenStatusMeta, type KitchenOrderStatus } from "../../../config/constants";

const icons: Record<KitchenOrderStatus, typeof FileText> = {
  new: FileText,
  cooking: Flame,
  ready: ConciergeBell,
  served: CheckCircle2,
};

interface StatusOverviewCardsProps {
  counts: Record<KitchenOrderStatus, number>;
  /** เส้นทางของแต่ละสถานะ เทียบกับ basePath เช่น "orders" | "cooking" | "ready" | "ready" (served อยู่ในหน้าเดียวกับ ready) */
  linkFor: Record<KitchenOrderStatus, string>;
  activeStatus?: KitchenOrderStatus;
}

export function StatusOverviewCards({ counts, linkFor, activeStatus }: StatusOverviewCardsProps) {
  const order: KitchenOrderStatus[] = ["new", "cooking", "ready", "served"];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {order.map((status) => {
        const meta = kitchenStatusMeta[status];
        const Icon = icons[status];
        const isActive = status === activeStatus;
        return (
          <NavLink
            key={status}
            to={linkFor[status]}
            className={`flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm border-2 transition-colors ${
              isActive ? `${meta.border} ${meta.bg}` : "border-transparent hover:border-gray-200"
            }`}
          >
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${meta.bg} ${meta.text}`}>
              <Icon className="w-5 h-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs text-gray-500 leading-tight">{meta.label}</span>
              <span className="block text-2xl font-bold text-gray-800 leading-snug">{counts[status]}</span>
              <span className="block text-[11px] text-gray-400 leading-tight">รายการ</span>
            </span>
          </NavLink>
        );
      })}
    </div>
  );
}
