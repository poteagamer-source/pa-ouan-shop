import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { PageHeader } from "../../components/staff/PageHeader";
import { createStaffUser, fetchStaffUsers, updateStaffUser, type ManagedStaffUser, type StaffRole } from "../../lib/api";

const ROLE_LABEL: Record<StaffRole, string> = { manager: "ผู้จัดการ", kitchen: "พนักงานครัว", waiter: "พนักงานเสิร์ฟ" };

export function StaffManagementPage() {
  const [users, setUsers] = useState<ManagedStaffUser[]>([]);
  const [form, setForm] = useState({ username: "", displayName: "", password: "", role: "kitchen" as StaffRole });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => fetchStaffUsers().then(setUsers).catch((err) => setError(err instanceof Error ? err.message : "โหลดบัญชีไม่สำเร็จ")), []);
  useEffect(() => { void load(); }, [load]);

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(null);
    try { await createStaffUser(form); setForm({ username: "", displayName: "", password: "", role: "kitchen" }); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "สร้างบัญชีไม่สำเร็จ"); }
    finally { setBusy(false); }
  };

  const toggle = async (user: ManagedStaffUser) => {
    setError(null);
    try { const updated = await updateStaffUser(user.id, { active: !user.active }); setUsers((current) => current.map((item) => item.id === user.id ? updated : item)); }
    catch (err) { setError(err instanceof Error ? err.message : "อัปเดตบัญชีไม่สำเร็จ"); }
  };

  return <div className="max-w-5xl"><PageHeader title="จัดการพนักงาน" subtitle="บัญชีและสิทธิ์ถูกบันทึกในฐานข้อมูล" />
    {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
    <form onSubmit={submit} className="mb-6 grid gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:grid-cols-2">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800 md:col-span-2"><UserPlus className="h-4 w-4" /> เพิ่มบัญชีพนักงาน</h2>
      <input required minLength={3} pattern="[a-zA-Z0-9._-]+" placeholder="ชื่อผู้ใช้" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm" />
      <input required minLength={2} placeholder="ชื่อที่แสดง" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm" />
      <input required minLength={10} type="password" placeholder="รหัสผ่าน อย่างน้อย 10 ตัวอักษร" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm" />
      <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as StaffRole })} className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm"><option value="kitchen">พนักงานครัว</option><option value="waiter">พนักงานเสิร์ฟ</option><option value="manager">ผู้จัดการ</option></select>
      <button disabled={busy} className="flex items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-medium text-white disabled:opacity-50 md:col-span-2">{busy && <Loader2 className="h-4 w-4 animate-spin" />} เพิ่มพนักงาน</button>
    </form>
    <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><table className="min-w-[620px] w-full text-sm"><thead><tr className="border-b text-left text-xs text-gray-400"><th className="pb-3">ชื่อผู้ใช้</th><th className="pb-3">ชื่อ</th><th className="pb-3">Role</th><th className="pb-3">สถานะ</th><th className="pb-3 text-right">จัดการ</th></tr></thead><tbody>{users.map((user) => <tr key={user.id} className="border-b border-gray-50 last:border-0"><td className="py-3 font-medium">{user.username}</td><td>{user.displayName}</td><td>{ROLE_LABEL[user.role]}</td><td><span className={`rounded-full px-2 py-1 text-xs ${user.active ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>{user.active ? "ใช้งาน" : "ปิดใช้งาน"}</span></td><td className="text-right"><button type="button" onClick={() => void toggle(user)} className="text-xs font-medium text-brand">{user.active ? "ปิดบัญชี" : "เปิดบัญชี"}</button></td></tr>)}</tbody></table></div>
  </div>;
}
