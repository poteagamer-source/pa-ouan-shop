import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Pencil, ShieldCheck, UserPlus, Users, X, XCircle } from "lucide-react";
import { PageHeader } from "../../components/staff/PageHeader";
import { StatCard } from "../../components/staff/StatCard";
import { useStaffAuth } from "../../context/StaffAuthContext";
import { createStaffUser, fetchStaffUsers, updateStaffUser, type ManagedStaffUser, type StaffRole } from "../../lib/api";

const ROLE_LABEL: Record<StaffRole, string> = { manager: "ผู้จัดการ", kitchen: "พนักงานครัว", waiter: "พนักงานเสิร์ฟ" };
const EMPTY_FORM = { username: "", displayName: "", password: "", role: "kitchen" as StaffRole };

export function StaffManagementPage() {
  const { user: currentUser } = useStaffAuth();
  const [usersList, setUsersList] = useState<ManagedStaffUser[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState<ManagedStaffUser | null>(null);
  const [editForm, setEditForm] = useState({ displayName: "", role: "kitchen" as StaffRole, password: "", confirmPassword: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setUsersList(await fetchStaffUsers()); setError(null); }
    catch (err) { setError(err instanceof Error ? err.message : "โหลดบัญชีพนักงานไม่สำเร็จ"); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const counts = useMemo(() => ({
    active: usersList.filter((item) => item.active).length,
    inactive: usersList.filter((item) => !item.active).length,
    managers: usersList.filter((item) => item.active && item.role === "manager").length,
  }), [usersList]);

  const create = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(null);
    try { await createStaffUser(form); setForm(EMPTY_FORM); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "สร้างบัญชีไม่สำเร็จ"); }
    finally { setBusy(false); }
  };

  const openEdit = (staff: ManagedStaffUser) => {
    setEditing(staff);
    setEditForm({ displayName: staff.displayName, role: staff.role, password: "", confirmPassword: "" });
    setError(null);
  };

  const saveEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    if (editForm.password && editForm.password.length < 10) { setError("รหัสผ่านใหม่ต้องมีอย่างน้อย 10 ตัวอักษร"); return; }
    if (editForm.password !== editForm.confirmPassword) { setError("รหัสผ่านใหม่และช่องยืนยันไม่ตรงกัน"); return; }
    setBusy(true); setError(null);
    try {
      const updated = await updateStaffUser(editing.id, {
        displayName: editForm.displayName.trim(), role: editForm.role,
        ...(editForm.password ? { password: editForm.password } : {}),
      });
      setUsersList((current) => current.map((item) => item.id === updated.id ? updated : item));
      setEditing(null);
    } catch (err) { setError(err instanceof Error ? err.message : "แก้ไขบัญชีไม่สำเร็จ"); }
    finally { setBusy(false); }
  };

  const toggle = async (staff: ManagedStaffUser) => {
    setBusy(true); setError(null);
    try {
      const updated = await updateStaffUser(staff.id, { active: !staff.active });
      setUsersList((current) => current.map((item) => item.id === staff.id ? updated : item));
    } catch (err) { setError(err instanceof Error ? err.message : "อัปเดตบัญชีไม่สำเร็จ"); }
    finally { setBusy(false); }
  };

  return <div className="max-w-6xl">
    <PageHeader title="จัดการพนักงานและ Role" subtitle="เพิ่มพนักงาน เปลี่ยนหน้าที่ รีเซ็ตรหัสผ่าน และปิดบัญชีเมื่อพนักงานออก" />
    {error && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

    <div className="mb-6 flex flex-wrap gap-3 sm:gap-4">
      <StatCard icon={<Users className="h-5 w-5" />} iconBgClass="bg-blue-50" iconColorClass="text-blue-500" label="บัญชีทั้งหมด" value={String(usersList.length)} sublabel="บัญชี" highlighted />
      <StatCard icon={<CheckCircle2 className="h-5 w-5" />} iconBgClass="bg-green-50" iconColorClass="text-green-500" label="กำลังใช้งาน" value={String(counts.active)} valueColorClass="text-green-600" sublabel="บัญชี" />
      <StatCard icon={<XCircle className="h-5 w-5" />} iconBgClass="bg-red-50" iconColorClass="text-red-500" label="ปิดใช้งาน" value={String(counts.inactive)} valueColorClass="text-red-500" sublabel="บัญชี" />
      <StatCard icon={<ShieldCheck className="h-5 w-5" />} iconBgClass="bg-purple-50" iconColorClass="text-purple-500" label="ผู้จัดการ" value={String(counts.managers)} valueColorClass="text-purple-600" sublabel="บัญชีที่ใช้งาน" />
    </div>

    <form onSubmit={create} className="mb-6 grid gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5 md:grid-cols-2">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800 md:col-span-2"><UserPlus className="h-4 w-4" /> เพิ่มบัญชีพนักงานใหม่</h2>
      <label className="text-xs font-medium text-gray-600">ชื่อผู้ใช้<input required minLength={3} pattern="[a-zA-Z0-9._-]+" placeholder="เช่น kitchen.02" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand" /></label>
      <label className="text-xs font-medium text-gray-600">ชื่อที่แสดง<input required minLength={2} placeholder="ชื่อพนักงาน" value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand" /></label>
      <label className="text-xs font-medium text-gray-600">รหัสผ่านเริ่มต้น<input required minLength={10} type="password" autoComplete="new-password" placeholder="อย่างน้อย 10 ตัวอักษร" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand" /></label>
      <label className="text-xs font-medium text-gray-600">Role<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as StaffRole })} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand"><option value="kitchen">พนักงานครัว</option><option value="waiter">พนักงานเสิร์ฟ</option><option value="manager">ผู้จัดการ</option></select></label>
      <button disabled={busy} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-medium text-white disabled:opacity-50 md:col-span-2">{busy && <Loader2 className="h-4 w-4 animate-spin" />} เพิ่มพนักงาน</button>
    </form>

    <div className="space-y-3 md:hidden">
      {usersList.map((staff) => <article key={staff.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold text-gray-800">{staff.displayName}</p><p className="truncate text-xs text-gray-400">@{staff.username}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${staff.active ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>{staff.active ? "ใช้งาน" : "ปิดใช้งาน"}</span></div><div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3"><span className="rounded-lg bg-brand-light px-2.5 py-1 text-xs font-medium text-brand">{ROLE_LABEL[staff.role]}</span><div className="flex gap-2"><button type="button" onClick={() => openEdit(staff)} className="flex min-h-10 items-center gap-1 rounded-lg border border-gray-200 px-3 text-xs text-gray-600"><Pencil className="h-3.5 w-3.5" /> แก้ไข</button><button type="button" disabled={busy || staff.id === currentUser?.id} onClick={() => void toggle(staff)} className="min-h-10 rounded-lg border border-brand/20 px-3 text-xs font-medium text-brand disabled:cursor-not-allowed disabled:opacity-40">{staff.active ? "ปิดบัญชี" : "เปิดบัญชี"}</button></div></div></article>)}
    </div>

    <div className="hidden overflow-x-auto rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:block"><table className="min-w-[720px] w-full text-sm"><thead><tr className="border-b text-left text-xs text-gray-400"><th className="pb-3">ชื่อผู้ใช้</th><th className="pb-3">ชื่อพนักงาน</th><th className="pb-3">Role</th><th className="pb-3">สถานะ</th><th className="pb-3 text-right">จัดการ</th></tr></thead><tbody>{usersList.map((staff) => <tr key={staff.id} className="border-b border-gray-50 last:border-0"><td className="py-3 font-medium">{staff.username}</td><td>{staff.displayName}{staff.id === currentUser?.id && <span className="ml-2 text-[10px] text-brand">บัญชีของคุณ</span>}</td><td>{ROLE_LABEL[staff.role]}</td><td><span className={`rounded-full px-2 py-1 text-xs ${staff.active ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>{staff.active ? "ใช้งาน" : "ปิดใช้งาน"}</span></td><td className="text-right"><button type="button" onClick={() => openEdit(staff)} className="mr-3 text-xs font-medium text-gray-600">แก้ไข</button><button type="button" disabled={busy || staff.id === currentUser?.id} onClick={() => void toggle(staff)} className="text-xs font-medium text-brand disabled:opacity-40">{staff.active ? "ปิดบัญชี" : "เปิดบัญชี"}</button></td></tr>)}</tbody></table></div>

    {editing && <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"><form onSubmit={saveEdit} className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:max-w-md sm:rounded-2xl sm:p-6"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-bold text-gray-800">แก้ไขบัญชีพนักงาน</h2><p className="text-xs text-gray-400">@{editing.username}</p></div><button type="button" onClick={() => setEditing(null)} className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100"><X className="h-5 w-5" /></button></div>
      <label className="mb-4 block text-xs font-medium text-gray-600">ชื่อที่แสดง<input required minLength={2} value={editForm.displayName} onChange={(event) => setEditForm({ ...editForm, displayName: event.target.value })} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-brand" /></label>
      <label className="mb-4 block text-xs font-medium text-gray-600">Role<select value={editForm.role} disabled={editing.id === currentUser?.id} onChange={(event) => setEditForm({ ...editForm, role: event.target.value as StaffRole })} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-3 text-sm disabled:bg-gray-100"><option value="manager">ผู้จัดการ</option><option value="kitchen">พนักงานครัว</option><option value="waiter">พนักงานเสิร์ฟ</option></select>{editing.id === currentUser?.id && <span className="mt-1 block text-[11px] text-amber-600">ไม่สามารถลดสิทธิ์บัญชีที่กำลังใช้งาน</span>}</label>
      <label className="mb-4 block text-xs font-medium text-gray-600">ตั้งรหัสผ่านใหม่ (ไม่บังคับ)<input type="password" autoComplete="new-password" minLength={10} placeholder="เว้นว่างหากไม่เปลี่ยน" value={editForm.password} onChange={(event) => setEditForm({ ...editForm, password: event.target.value })} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-3 text-sm" /></label>
      {editForm.password && <label className="mb-4 block text-xs font-medium text-gray-600">ยืนยันรหัสผ่านใหม่<input type="password" autoComplete="new-password" minLength={10} required value={editForm.confirmPassword} onChange={(event) => setEditForm({ ...editForm, confirmPassword: event.target.value })} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-3 text-sm" /></label>}
      <p className="mb-4 rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-700">หากเปลี่ยนรหัสผ่าน session เดิมของพนักงานจะถูกออกจากระบบทันที</p><button disabled={busy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand font-medium text-white disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" />} บันทึกการเปลี่ยนแปลง</button>
    </form></div>}
  </div>;
}
