/** การ์ดตัวเลขสรุปที่ใช้ซ้ำใน dashboard, เมนู, สต๊อก, ออเดอร์ และรายงาน */
import type { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  iconBgClass: string;
  iconColorClass: string;
  label: string;
  value: string;
  valueColorClass?: string;
  sublabel?: string;
  highlighted?: boolean;
  highlightColorClass?: string;
}

export function StatCard({
  icon,
  iconBgClass,
  iconColorClass,
  label,
  value,
  valueColorClass = "text-gray-800",
  sublabel,
  highlighted,
  highlightColorClass = "ring-brand/40 border-brand/40",
}: StatCardProps) {
  return (
    <div
      className={`min-w-[145px] flex-1 bg-white rounded-2xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3 shadow-sm border ${
        highlighted ? `ring-1 ${highlightColorClass}` : "border-gray-100"
      }`}
    >
      <div
        className={`h-10 w-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBgClass} ${iconColorClass}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 leading-tight">{label}</p>
        <p className={`text-lg sm:text-xl font-bold leading-snug ${valueColorClass}`}>{value}</p>
        {sublabel && <p className="text-[11px] text-gray-400 leading-tight">{sublabel}</p>}
      </div>
    </div>
  );
}
