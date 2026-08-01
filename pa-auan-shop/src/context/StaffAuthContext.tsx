import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError, fetchCurrentStaff, loginStaff, logoutStaff, setupFirstManager, type StaffRole, type StaffUser } from "../lib/api";

interface StaffAuthValue {
  user: StaffUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<StaffUser>;
  setup: (payload: { username: string; displayName: string; password: string }) => Promise<StaffUser>;
  logout: () => Promise<void>;
  homeForRole: (role: StaffRole) => string;
}

const StaffAuthContext = createContext<StaffAuthValue | null>(null);

function homeForRole(role: StaffRole) {
  if (role === "kitchen") return "/staff/kitchen";
  if (role === "waiter") return "/staff/waiter";
  return "/staff";
}

export function StaffAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentStaff()
      .then(setUser)
      .catch((error) => {
        if (!(error instanceof ApiError) || error.status !== 401) console.error("ตรวจสอบ session ไม่สำเร็จ", error);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const authenticated = await loginStaff(username, password);
    setUser(authenticated);
    return authenticated;
  }, []);

  const logout = useCallback(async () => {
    try { await logoutStaff(); } finally { setUser(null); }
  }, []);

  const setup = useCallback(async (payload: { username: string; displayName: string; password: string }) => {
    const authenticated = await setupFirstManager(payload);
    setUser(authenticated);
    return authenticated;
  }, []);

  const value = useMemo(() => ({ user, loading, login, setup, logout, homeForRole }), [user, loading, login, setup, logout]);
  return <StaffAuthContext.Provider value={value}>{children}</StaffAuthContext.Provider>;
}

export function useStaffAuth() {
  const value = useContext(StaffAuthContext);
  if (!value) throw new Error("useStaffAuth ต้องอยู่ภายใน StaffAuthProvider");
  return value;
}
