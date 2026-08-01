import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Grid2x2, Loader2, Minus, Package, Plus, Search, XCircle } from "lucide-react";
import { PageHeader } from "../../components/staff/PageHeader";
import { StatCard } from "../../components/staff/StatCard";
import { CategorySidebar } from "../../components/staff/CategorySidebar";
import { categoryMeta } from "../../config/constants";
import { adjustStock, fetchStock, subscribeToUpdates, updateStock } from "../../lib/api";
import type { CategoryId, StockItem } from "../../types";

const PAGE_SIZE = 6;

export function StockPage() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [tab, setTab] = useState<"product" | "topping">("product");
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("bualoy");
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [draftQty, setDraftQty] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      const data = await fetchStock();
      setItems(data);
      setDraftQty(Object.fromEntries(data.map((item) => [item.id, String(item.stockQty)])));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "โหลดสต๊อกไม่สำเร็จ");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    void load();
    const unsubscribe = subscribeToUpdates((update) => {
      if (update.resource === "stock" || update.resource === "products") void load();
    });
    return unsubscribe;
  }, [load]);

  const categoryCounts = useMemo(() => {
    const counts = Object.fromEntries((Object.keys(categoryMeta) as CategoryId[]).map((id) => [id, 0])) as Record<CategoryId, number>;
    items.forEach((item) => { counts[item.category] = (counts[item.category] ?? 0) + 1; });
    return counts;
  }, [items]);

  const filtered = useMemo(() => items.filter((item) => item.category === selectedCategory && item.name.toLowerCase().includes(query.trim().toLowerCase())), [items, selectedCategory, query]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const openCount = items.filter((item) => item.active).length;
  const lowCount = items.filter((item) => item.status === "low").length;

  const applyResult = (updated: StockItem) => {
    setItems((current) => current.map((item) => item.id === updated.id ? updated : item));
    setDraftQty((current) => ({ ...current, [updated.id]: String(updated.stockQty) }));
  };

  const runUpdate = async (id: string, action: () => Promise<StockItem>) => {
    if (pending.has(id)) return;
    setPending((current) => new Set(current).add(id));
    setError(null);
    try { applyResult(await action()); }
    catch (err) { setError(err instanceof Error ? err.message : "อัปเดตสต๊อกไม่สำเร็จ"); }
    finally { setPending((current) => { const next = new Set(current); next.delete(id); return next; }); }
  };

  const saveDraft = (item: StockItem) => {
    const qty = Number(draftQty[item.id]);
    if (!Number.isInteger(qty) || qty < 0) {
      setError("จำนวนสต๊อกต้องเป็นเลขจำนวนเต็มตั้งแต่ 0 ขึ้นไป");
      setDraftQty((current) => ({ ...current, [item.id]: String(item.stockQty) }));
      return;
    }
    if (qty !== item.stockQty) void runUpdate(item.id, () => updateStock(item.id, { stockQty: qty }));
  };

  return <div className="max-w-6xl">
    <PageHeader title="สต๊อกสินค้า" subtitle="เพิ่ม ลด และเปิด–ปิดสินค้าจากข้อมูลจริงใน Neon" />
    {error && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
    <div className="mb-6 flex flex-wrap gap-4">
      <StatCard icon={<Package className="h-5 w-5" />} iconBgClass="bg-brand-light" iconColorClass="text-brand" label="สินค้าทั้งหมด" value={String(items.length)} sublabel="รายการ" highlighted />
      <StatCard icon={<CheckCircle2 className="h-5 w-5" />} iconBgClass="bg-green-50" iconColorClass="text-green-500" label="เปิดขาย" value={String(openCount)} valueColorClass="text-green-600" sublabel="รายการ" />
      <StatCard icon={<XCircle className="h-5 w-5" />} iconBgClass="bg-red-50" iconColorClass="text-red-500" label="ปิดขาย" value={String(items.length - openCount)} valueColorClass="text-red-500" sublabel="รายการ" />
      <StatCard icon={<Grid2x2 className="h-5 w-5" />} iconBgClass="bg-blue-50" iconColorClass="text-blue-500" label="สินค้าใกล้หมด" value={String(lowCount)} valueColorClass="text-blue-500" sublabel="รายการ" />
    </div>

    <div className="mb-4 flex gap-2">{([{ id: "product", label: "สินค้าสำเร็จรูป" }, { id: "topping", label: "ท็อปปิ้ง" }] as const).map((option) => <button key={option.id} type="button" onClick={() => setTab(option.id)} className={`rounded-full px-4 py-2 text-sm font-medium ${tab === option.id ? "bg-brand text-white" : "border border-gray-200 bg-white text-gray-500"}`}>{option.label}</button>)}</div>

    {tab === "topping" ? <div className="rounded-2xl border border-gray-100 bg-white py-12 text-center text-sm text-gray-400">ระบบยังไม่ได้กำหนดจำนวนคงเหลือแยกรายการสำหรับท็อปปิ้ง</div> :
      <div className="flex flex-col gap-6 lg:flex-row">
        <CategorySidebar categoryCounts={categoryCounts} selected={selectedCategory} onSelect={(id) => { setSelectedCategory(id); setPage(1); }} />
        <div className="min-w-0 flex-1 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-semibold text-gray-700">{categoryMeta[selectedCategory].label} ({filtered.length} รายการ)</p><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="ค้นหาสินค้า" className="rounded-full border border-gray-200 py-2 pl-9 pr-4 text-sm outline-none focus:border-brand" /></div></div>
          {loading ? <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-400"><Loader2 className="h-5 w-5 animate-spin" /> กำลังโหลดสต๊อก</div> : <div className="overflow-x-auto"><table className="min-w-[760px] w-full text-sm"><thead><tr className="border-b border-gray-100 text-left text-gray-400"><th className="py-2 font-medium">สินค้า</th><th className="py-2 font-medium">ราคาขาย</th><th className="py-2 font-medium">จำนวนคงเหลือ</th><th className="py-2 font-medium">สถานะสต๊อก</th><th className="py-2 font-medium">เปิดขาย</th></tr></thead><tbody>
            {pageItems.map((item) => { const busy = pending.has(item.id); return <tr key={item.id} className="border-b border-gray-50 last:border-0"><td className="py-3"><div className="flex items-center gap-3"><img src={item.image} alt={item.name} className="h-10 w-10 rounded-lg object-cover" /><span className="text-gray-700">{item.name}</span></div></td><td className="py-3 text-gray-700">{item.price.toFixed(2)} บาท</td><td className="py-3"><div className="flex items-center gap-2"><button disabled={busy || item.stockQty === 0} onClick={() => void runUpdate(item.id, () => adjustStock(item.id, -1))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 disabled:opacity-30"><Minus className="h-4 w-4" /></button><input aria-label={`จำนวนคงเหลือ ${item.name}`} inputMode="numeric" value={draftQty[item.id] ?? item.stockQty} onChange={(event) => setDraftQty((current) => ({ ...current, [item.id]: event.target.value }))} onBlur={() => saveDraft(item)} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} disabled={busy} className="w-16 rounded-lg border border-gray-200 px-2 py-1.5 text-center font-semibold outline-none focus:border-brand" /><button disabled={busy} onClick={() => void runUpdate(item.id, () => adjustStock(item.id, 1))} className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white disabled:opacity-50"><Plus className="h-4 w-4" /></button><span className="text-xs text-gray-500">{item.unit}</span>{busy && <Loader2 className="h-4 w-4 animate-spin text-brand" />}</div></td><td className={`py-3 text-xs font-medium ${item.status === "low" ? "text-red-500" : "text-green-600"}`}>{item.status === "low" ? "ใกล้หมด" : "เพียงพอ"}</td><td className="py-3"><button type="button" disabled={busy} onClick={() => void runUpdate(item.id, () => updateStock(item.id, { active: !item.active }))} aria-pressed={item.active} className={`relative inline-flex h-6 w-11 items-center rounded-full ${item.active ? "bg-green-500" : "bg-gray-300"}`}><span className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${item.active ? "translate-x-6" : "translate-x-1"}`} /></button></td></tr>; })}
            {pageItems.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-gray-400">ไม่พบสินค้า</td></tr>}
          </tbody></table></div>}
          <div className="mt-4 flex items-center justify-between"><p className="text-xs text-gray-400">หน้า {safePage} จาก {totalPages}</p><div className="flex gap-2"><button disabled={safePage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-lg border px-3 py-1 text-sm disabled:opacity-30">ก่อนหน้า</button><button disabled={safePage >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="rounded-lg border px-3 py-1 text-sm disabled:opacity-30">ถัดไป</button></div></div>
        </div>
      </div>}
  </div>;
}
