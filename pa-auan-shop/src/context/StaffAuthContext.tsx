import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError, fetchCurrentStaff, loginStaff, logoutStaff, setupFirstManager, type StaffRole, type StaffUser } from "../lib/api";

/** session พนักงานและคำสั่ง auth ที่ทุกหน้า staff ใช้ร่วมกัน */
interface StaffAuthValue {
  /** null หมายถึงยังไม่ได้ login หรือ session หมดอายุ */
  user: StaffUser | null;
  /** true ระหว่างตรวจ cookie session ครั้งแรก เพื่อไม่ให้ route redirect เร็วเกินไป */
  loading: boolean;
  login: (username: string, password: string) => Promise<StaffUser>;
  setup: (payload: { username: string; displayName: string; password: string }) => Promise<StaffUser>;
  logout: () => Promise<void>;
  homeForRole: (role: StaffRole) => string;
}

// ใช้ null เพื่อให้ useStaffAuth แจ้ง error เมื่อ main.tsx ลืมครอบ Provider
const StaffAuthContext = createContext<StaffAuthValue | null>(null);

/** คืนหน้าแรกที่เหมาะกับ role หลัง login หรือเมื่อพยายามเข้าหน้าที่ไม่มีสิทธิ์ */
function homeForRole(role: StaffRole) {
  if (role === "kitchen") return "/staff/kitchen";
  if (role === "waiter") return "/staff/waiter";
  return "/staff";
}

/** ตรวจและเก็บ staff session ซึ่ง backend ดูแลผ่าน HttpOnly cookie */
export function StaffAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);

  // เปิดแอปแล้วถาม /auth/me หนึ่งครั้ง; 401 เป็นกรณีปกติของผู้ที่ยังไม่ login
  useEffect(() => {
    fetchCurrentStaff()
      .then(setUser)
      .catch((error) => {
        if (!(error instanceof ApiError) || error.status !== 401) console.error("ตรวจสอบ session ไม่สำเร็จ", error);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // API เป็นผู้ตรวจรหัสผ่านและตั้ง cookie; frontend เก็บเฉพาะข้อมูลผู้ใช้ที่ตอบกลับ
  const login = useCallback(async (username: string, password: string) => {
    const authenticated = await loginStaff(username, password);
    setUser(authenticated);
    return authenticated;
  }, []);

  // ล้าง state เสมอ แม้ request logout ล้มเหลว เพื่อไม่ให้ UI ค้างว่า login อยู่
  const logout = useCallback(async () => {
    try { await logoutStaff(); } finally { setUser(null); }
  }, []);

  // ใช้เฉพาะตอนฐานข้อมูลยังไม่มี manager คนแรก
  const setup = useCallback(async (payload: { username: string; displayName: string; password: string }) => {
    const authenticated = await setupFirstManager(payload);
    setUser(authenticated);
    return authenticated;
  }, []);

  const value = useMemo(() => ({ user, loading, login, setup, logout, homeForRole }), [user, loading, login, setup, logout]);
  return <StaffAuthContext.Provider value={value}>{children}</StaffAuthContext.Provider>;
}

/** Hook สำหรับหน้า login, sidebar และ route guard */
export function useStaffAuth() {
  const value = useContext(StaffAuthContext);
  if (!value) throw new Error("useStaffAuth ต้องอยู่ภายใน StaffAuthProvider");
  return value;
}
