import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useStaffAuth } from "../../context/StaffAuthContext";
import type { StaffRole } from "../../lib/api";

export function StaffRouteGuard({ allowed }: { allowed: StaffRole[] }) {
  const { user, loading, homeForRole } = useStaffAuth();
  const location = useLocation();
  if (loading) return <div className="flex min-h-dvh items-center justify-center gap-2 text-sm text-gray-500"><Loader2 className="h-5 w-5 animate-spin" /> กำลังตรวจสอบสิทธิ์</div>;
  if (!user) return <Navigate to="/staff-entry" replace state={{ from: location.pathname }} />;
  if (!allowed.includes(user.role)) return <Navigate to={homeForRole(user.role)} replace />;
  return <Outlet />;
}
