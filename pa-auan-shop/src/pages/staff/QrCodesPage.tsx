/** Manager สร้าง QR token ใหม่ เลือกโต๊ะ และลบ QR เก่าออกจาก Neon */
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Plus, QrCode, RefreshCw, Trash2 } from "lucide-react";
import { createTableQrCode, deleteTableQrCode, fetchTableQrCodes, type TableQrCode } from "../../lib/api";
import { isValidTableId, normalizeTableId, staffPortalUrl, tokenOrderUrl } from "../../config/qrRoutes";

function QrImage({ url, title }: { url: string; title: string }) {
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}`;
  return <><img src={src} alt={`QR ${title}`} className="mx-auto h-[180px] w-[180px]"/><p className="mt-3 break-all text-center font-mono text-[10px] text-gray-400">{url}</p></>;
}

export function QrCodesPage() {
  const [codes, setCodes] = useState<TableQrCode[]>([]);
  const [tableId, setTableId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const load = () => fetchTableQrCodes().then(setCodes).catch((e) => setMessage(e.message)).finally(() => setLoading(false));
  useEffect(() => { void load(); }, []);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    const normalized = normalizeTableId(tableId);
    if (!isValidTableId(normalized)) return setMessage("กรุณากรอกเลขโต๊ะรูปแบบ A01 หรือ B02");
    const replacing = codes.some((code) => code.tableId === normalized);
    if (replacing && !window.confirm(`โต๊ะ ${normalized} มี QR อยู่แล้ว สร้างใหม่แล้ว QR เก่าจะใช้ไม่ได้ ต้องการดำเนินการต่อหรือไม่?`)) return;
    setBusy(true); setMessage("");
    try { await createTableQrCode(normalized); setTableId(""); setMessage(`สร้าง QR โต๊ะ ${normalized} เรียบร้อย${replacing ? " และยกเลิก QR เก่าแล้ว" : ""}`); await load(); }
    catch (e) { setMessage(e instanceof Error ? e.message : "สร้าง QR ไม่สำเร็จ"); }
    finally { setBusy(false); }
  };

  const remove = async (code: TableQrCode) => {
    if (!window.confirm(`ลบ QR โต๊ะ ${code.tableId}? หลังลบ QR ใบนี้จะสแกนใช้งานไม่ได้`)) return;
    setBusy(true);
    try { await deleteTableQrCode(code.id); setMessage(`ลบ QR โต๊ะ ${code.tableId} แล้ว`); await load(); }
    catch (e) { setMessage(e instanceof Error ? e.message : "ลบ QR ไม่สำเร็จ"); }
    finally { setBusy(false); }
  };

  return <div className="max-w-5xl">
    <div className="mb-2 flex items-center gap-2"><QrCode className="h-6 w-6 text-brand"/><h1 className="text-xl font-bold text-gray-800">จัดการ QR Code</h1></div>
    <p className="mb-6 text-sm text-gray-600">QR แต่ละใบมีรหัสเฉพาะและผูกกับโต๊ะหนึ่งโต๊ะ สร้างใหม่ที่โต๊ะเดิมจะยกเลิก QR เก่าอัตโนมัติ</p>
    <section className="mb-8"><h2 className="mb-3 text-sm font-semibold">QR พนักงาน / ผู้จัดการ</h2><div className="max-w-xs rounded-2xl border bg-white p-5 shadow-sm"><p className="font-semibold">พนักงาน &amp; ผู้จัดการ</p><QrImage title="พนักงาน" url={staffPortalUrl()}/></div></section>
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h2 className="text-sm font-semibold">QR ลูกค้า — เลือกโต๊ะที่ต้องการเชื่อม</h2><button onClick={() => { setLoading(true); void load(); }} className="flex items-center gap-1 text-xs text-gray-500"><RefreshCw className="h-4 w-4"/>โหลดใหม่</button></div>
      <form onSubmit={create} className="mb-5 flex max-w-xl flex-col gap-2 rounded-2xl border bg-white p-4 shadow-sm sm:flex-row sm:items-end"><label className="flex-1 text-xs font-medium text-gray-600">เลขโต๊ะ<input value={tableId} onChange={(e) => setTableId(e.target.value.toUpperCase())} placeholder="เช่น A01" maxLength={3} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-brand"/></label><button disabled={busy} className="flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin"/> : <Plus className="h-4 w-4"/>}สร้าง QR ใหม่</button></form>
      {message && <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">{message}</p>}
      {loading ? <p className="py-10 text-center text-gray-400">กำลังโหลด...</p> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{codes.map((code) => { const url = tokenOrderUrl(code.token); return <article key={code.id} className="rounded-2xl border border-orange-200 bg-white p-5 shadow-sm"><div className="mb-2 flex items-center justify-between"><p className="font-bold">โต๊ะ {code.tableId}</p><span className="rounded-full bg-brand-light px-2 py-0.5 text-[10px] text-brand">QR เฉพาะ</span></div><QrImage title={`โต๊ะ ${code.tableId}`} url={url}/><div className="mt-4 grid grid-cols-2 gap-2"><button disabled={busy} onClick={() => { setTableId(code.tableId); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex items-center justify-center gap-1 rounded-lg border border-orange-200 py-2 text-xs text-brand"><RefreshCw className="h-3.5 w-3.5"/>สร้างใหม่</button><button disabled={busy} onClick={() => void remove(code)} className="flex items-center justify-center gap-1 rounded-lg border border-red-200 py-2 text-xs text-red-500"><Trash2 className="h-3.5 w-3.5"/>ลบ QR</button></div></article>; })}</div>}
      {!loading && codes.length === 0 && <p className="rounded-xl border border-dashed py-10 text-center text-sm text-gray-500">ยังไม่มี QR โต๊ะ</p>}
    </section>
  </div>;
}
