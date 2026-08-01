import { Outlet } from "react-router-dom";
import { Search } from "lucide-react";
import { StaffSidebar } from "./StaffSidebar";

interface Props {
  variant: "manager" | "kitchen" | "waiter";
  showSearch?: boolean;
}

export function StaffLayout({ variant, showSearch = false }: Props) {
  return (
    <div className="flex min-h-dvh bg-[#f0f0f0]">
      <StaffSidebar variant={variant} />
      <main className="min-w-0 flex-1 overflow-auto p-3 md:p-6">
        {showSearch && (
          <div className="max-w-xl mx-auto mb-6 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="search"
              placeholder="ค้นหา"
              className="w-full rounded-full border border-gray-200 bg-white py-3 pl-12 pr-4 text-sm shadow-sm outline-none focus:border-brand"
            />
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
