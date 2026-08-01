import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Loader2, LockKeyhole, LogIn, QrCode, UserRound } from "lucide-react";
import { SHOP_SHORT } from "../../config/constants";
import { images } from "../../data/images";
import { useStaffAuth } from "../../context/StaffAuthContext";
import { fetchSetupStatus } from "../../lib/api";

export function StaffQrEntry() {
  const navigate = useNavigate();
  const { user, loading, login, setup, homeForRole } = useStaffAuth();
  const [setupRequired, setSetupRequired] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<"displayName" | "username" | "password" | "confirmPassword", string>>>({});

  useEffect(() => { fetchSetupStatus().then((result) => setSetupRequired(result.setupRequired)).catch(() => {}); }, []);

  if (!loading && user) return <Navigate to={homeForRole(user.role)} replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const normalizedUsername = username.trim().toLowerCase();
    const validation: typeof fieldErrors = {};
    if (setupRequired && displayName.trim().length < 2) validation.displayName = "กรุณากรอกชื่อที่แสดงอย่างน้อย 2 ตัวอักษร";
    if (!/^[a-z0-9._-]{3,50}$/.test(normalizedUsername)) validation.username = "ใช้ 3-50 ตัว: a-z, 0-9, จุด, _ หรือ - เท่านั้น";
    if (setupRequired && password.length < 10) validation.password = `ขาดอีก ${10 - password.length} ตัวอักษร (ต้องมีอย่างน้อย 10)`;
    if (!setupRequired && password.length === 0) validation.password = "กรุณากรอกรหัสผ่าน";
    if (setupRequired && password !== confirmPassword) validation.confirmPassword = "รหัสผ่านทั้งสองช่องไม่ตรงกัน";
    setFieldErrors(validation);
    if (Object.keys(validation).length > 0) {
      setError("กรุณาแก้ไขข้อมูลในช่องที่มีข้อความสีแดง");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const authenticated = setupRequired
        ? await setup({ username, displayName, password })
        : await login(username, password);
      navigate(homeForRole(authenticated.role), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-gray-100 to-white p-6">
      <form onSubmit={submit} noValidate className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
        <img src={images.logoMascot} alt={SHOP_SHORT} className="mx-auto mb-3 h-20 w-20 rounded-full border-2 border-white object-cover shadow" />
        <div className="mb-2 flex items-center justify-center gap-1.5 text-xs text-gray-500"><QrCode className="h-3.5 w-3.5" /> QR พนักงาน</div>
        <h1 className="text-center text-xl font-bold text-gray-800">{setupRequired ? "ตั้งค่าผู้จัดการคนแรก" : `เข้าสู่ระบบ ${SHOP_SHORT}`}</h1>
        <p className="mb-6 mt-1 text-center text-xs text-gray-500">{setupRequired ? "สร้างได้ครั้งเดียว จากนั้นเพิ่มพนักงานผ่านหน้าผู้จัดการ" : "ระบบจะเปิดหน้าทำงานตาม role ของบัญชีโดยอัตโนมัติ"}</p>

        {setupRequired && <><label className="mb-1 block text-xs font-medium text-gray-600" htmlFor="staff-display-name">ชื่อที่แสดง</label><input id="staff-display-name" required minLength={2} value={displayName} onChange={(event) => { setDisplayName(event.target.value); setFieldErrors((current) => ({ ...current, displayName: undefined })); }} aria-invalid={Boolean(fieldErrors.displayName)} className={`w-full rounded-xl border px-3 py-3 text-sm outline-none focus:border-brand ${fieldErrors.displayName ? "border-red-400" : "border-gray-200"}`} />{fieldErrors.displayName && <p className="mb-4 mt-1 text-[11px] text-red-600">{fieldErrors.displayName}</p>}{!fieldErrors.displayName && <div className="mb-4" />}</>}

        <label className="mb-1 block text-xs font-medium text-gray-600" htmlFor="staff-username">ชื่อผู้ใช้</label>
        <div className="relative"><UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input id="staff-username" autoComplete="username" required minLength={3} maxLength={50} value={username} onChange={(event) => { setUsername(event.target.value); setFieldErrors((current) => ({ ...current, username: undefined })); }} aria-invalid={Boolean(fieldErrors.username)} className={`w-full rounded-xl border py-3 pl-10 pr-3 text-sm outline-none focus:border-brand ${fieldErrors.username ? "border-red-400" : "border-gray-200"}`} /></div>
        {fieldErrors.username ? <p className="mb-4 mt-1 text-[11px] text-red-600">{fieldErrors.username}</p> : <p className="mb-4 mt-1 text-[11px] text-gray-400">ตัวอย่าง: somchai หรือ kitchen.01</p>}
        <label className="mb-1 block text-xs font-medium text-gray-600" htmlFor="staff-password">รหัสผ่าน</label>
        <div className="relative"><LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input id="staff-password" type="password" autoComplete={setupRequired ? "new-password" : "current-password"} required minLength={setupRequired ? 10 : undefined} value={password} onChange={(event) => { setPassword(event.target.value); setFieldErrors((current) => ({ ...current, password: undefined })); }} aria-invalid={Boolean(fieldErrors.password)} className={`w-full rounded-xl border py-3 pl-10 pr-3 text-sm outline-none focus:border-brand ${fieldErrors.password ? "border-red-400" : "border-gray-200"}`} /></div>
        {setupRequired && (fieldErrors.password ? <p className="mt-1 text-[11px] text-red-600">{fieldErrors.password}</p> : <p className="mt-1 text-[11px] text-gray-500">อย่างน้อย 10 ตัวอักษร ({password.length}/10)</p>)}
        {setupRequired && <><label className="mb-1 mt-4 block text-xs font-medium text-gray-600" htmlFor="staff-confirm-password">ยืนยันรหัสผ่าน</label><div className="relative"><LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input id="staff-confirm-password" type="password" autoComplete="new-password" required minLength={10} value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setFieldErrors((current) => ({ ...current, confirmPassword: undefined })); }} aria-invalid={Boolean(fieldErrors.confirmPassword)} className={`w-full rounded-xl border py-3 pl-10 pr-3 text-sm outline-none focus:border-brand ${fieldErrors.confirmPassword ? "border-red-400" : "border-gray-200"}`} /></div>{fieldErrors.confirmPassword && <p className="mt-1 text-[11px] text-red-600">{fieldErrors.confirmPassword}</p>}</>}
        {error && <p className="mb-4 mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
        <button disabled={submitting || loading} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-800 py-3 text-sm font-medium text-white disabled:opacity-50">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />} {submitting ? "กำลังบันทึก..." : setupRequired ? "สร้างบัญชีผู้จัดการ" : "เข้าสู่ระบบ"}</button>
      </form>
    </div>
  );
}
