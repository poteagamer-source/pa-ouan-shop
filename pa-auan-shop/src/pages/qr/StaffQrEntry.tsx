import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Loader2, LockKeyhole, LogIn, QrCode, UserRound } from "lucide-react";
import { SHOP_SHORT } from "../../config/constants";
import { images } from "../../data/images";
import { useStaffAuth } from "../../context/StaffAuthContext";

export function StaffQrEntry() {
  const navigate = useNavigate();
  const { user, loading, login, homeForRole } = useStaffAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && user) return <Navigate to={homeForRole(user.role)} replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const authenticated = await login(username, password);
      navigate(homeForRole(authenticated.role), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-gray-100 to-white p-6">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
        <img src={images.logoMascot} alt={SHOP_SHORT} className="mx-auto mb-3 h-20 w-20 rounded-full border-2 border-white object-cover shadow" />
        <div className="mb-2 flex items-center justify-center gap-1.5 text-xs text-gray-500"><QrCode className="h-3.5 w-3.5" /> QR พนักงาน</div>
        <h1 className="text-center text-xl font-bold text-gray-800">เข้าสู่ระบบ {SHOP_SHORT}</h1>
        <p className="mb-6 mt-1 text-center text-xs text-gray-500">ระบบจะเปิดหน้าทำงานตาม role ของบัญชีโดยอัตโนมัติ</p>

        <label className="mb-1 block text-xs font-medium text-gray-600" htmlFor="staff-username">ชื่อผู้ใช้</label>
        <div className="relative mb-4"><UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input id="staff-username" autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-brand" /></div>
        <label className="mb-1 block text-xs font-medium text-gray-600" htmlFor="staff-password">รหัสผ่าน</label>
        <div className="relative mb-4"><LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input id="staff-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-brand" /></div>
        {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
        <button disabled={submitting || loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-800 py-3 text-sm font-medium text-white disabled:opacity-50">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />} {submitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}</button>
      </form>
    </div>
  );
}
