import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useStaffAuth } from "../../context/StaffAuthContext";
import type { StaffRole } from "../../lib/api";

/**
 * ป้องกัน staff route ตาม role ที่ระบุใน App.tsx
 * ลำดับตรวจ: รอ session → ต้อง login → role ต้องได้รับอนุญาต → render Outlet
 */
export function StaffRouteGuard({ allowed }: { allowed: StaffRole[] }) {
  const { user, loading, homeForRole } = useStaffAuth();
  const location = useLocation();
  // ระหว่าง /auth/me ยังไม่ตอบ ห้ามสรุปว่า user ไม่มี session
  if (loading) return <div className="flex min-h-dvh items-center justify-center gap-2 text-sm text-gray-500"><Loader2 className="h-5 w-5 animate-spin" /> กำลังตรวจสอบสิทธิ์</div>;
  // เก็บ path เดิมใน state เผื่อหน้า login ต้องพากลับหลังยืนยันตัวตน
  if (!user) return <Navigate to="/staff-entry" replace state={{ from: location.pathname }} />;
  // ผู้ที่ login แล้วแต่ role ไม่ตรง จะกลับหน้าแรกของ role ตัวเองแทนหน้า forbidden เปล่า ๆ
  if (!allowed.includes(user.role)) return <Navigate to={homeForRole(user.role)} replace />;
  // Outlet คือหน้าลูกที่ผ่านเงื่อนไขแล้ว
  return <Outlet />;
}
