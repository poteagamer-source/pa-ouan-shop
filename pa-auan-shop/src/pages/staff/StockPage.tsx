import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { CheckCircle2, Grid2x2, Loader2, Minus, Package, Pencil, Plus, Search, Trash2, X, XCircle } from "lucide-react";
import { PageHeader } from "../../components/staff/PageHeader";
import { StatCard } from "../../components/staff/StatCard";
import { CategorySidebar } from "../../components/staff/CategorySidebar";
import { categoryMeta } from "../../config/constants";
import {
  addProductToStock, addToppingToStock, adjustStock, adjustToppingStock, fetchProducts, fetchStock,
  fetchToppings, fetchToppingStock, removeProductFromStock, removeToppingFromStock, subscribeToUpdates,
  updateStock, updateToppingStock,
} from "../../lib/api";
import type { CategoryId, Product, StockItem, Topping, ToppingStockItem } from "../../types";

type Tab = "product" | "topping";
type InventoryItem = (StockItem | ToppingStockItem) & { kind: Tab };
type CatalogItem = Product | Topping;

export function StockPage() {
  const [tab, setTab] = useState<Tab>("product");
  const [products, setProducts] = useState<StockItem[]>([]);
  const [toppings, setToppings] = useState<ToppingStockItem[]>([]);
  const [productCatalog, setProductCatalog] = useState<Product[]>([]);
  const [toppingCatalog, setToppingCatalog] = useState<Topping[]>([]);
  const [category, setCategory] = useState<CategoryId>("bualoy");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [qty, setQty] = useState("0");
  const [unit, setUnit] = useState("ถ้วย");

  const load = useCallback(async () => {
    try {
      const [stock, toppingStock, allProducts, allToppings] = await Promise.all([fetchStock(), fetchToppingStock(), fetchProducts(), fetchToppings()]);
      setProducts(stock); setToppings(toppingStock); setProductCatalog(allProducts); setToppingCatalog(allToppings); setError(null);
    } catch (err) { setError(err instanceof Error ? err.message : "โหลดข้อมูลสต๊อกไม่สำเร็จ"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    void load();
    return subscribeToUpdates((update) => { if (update.resource === "stock" || update.resource === "products") void load(); });
  }, [load]);

  const productIds = useMemo(() => new Set(products.map((item) => item.id)), [products]);
  const toppingIds = useMemo(() => new Set(toppings.map((item) => item.id)), [toppings]);
  const available: CatalogItem[] = tab === "product" ? productCatalog.filter((item) => !productIds.has(item.id)) : toppingCatalog.filter((item) => !toppingIds.has(item.id));
  const items: InventoryItem[] = tab === "product" ? products.map((item) => ({ ...item, kind: "product" })) : toppings.map((item) => ({ ...item, kind: "topping" }));
  const shown = items.filter((item) => (tab === "topping" || (item as StockItem).category === category) && item.name.toLowerCase().includes(query.trim().toLowerCase()));
  const counts = useMemo(() => {
    const result = Object.fromEntries((Object.keys(categoryMeta) as CategoryId[]).map((id) => [id, 0])) as Record<CategoryId, number>;
    products.forEach((item) => { result[item.category] += 1; }); return result;
  }, [products]);

  const openAdd = () => { setSelectedId(available[0]?.id ?? ""); setQty("0"); setUnit(tab === "product" ? "ถ้วย" : "หน่วย"); setModal("add"); setError(null); };
  const openEdit = (item: InventoryItem) => { setSelectedId(item.id); setQty(String(item.stockQty)); setUnit(item.unit); setModal("edit"); setError(null); };
  const selected = items.find((item) => item.id === selectedId);

  const submit = async (event: FormEvent) => {
    event.preventDefault(); const amount = Number(qty);
    if (!Number.isInteger(amount) || amount < 0 || !unit.trim()) { setError("กรุณากรอกจำนวนเต็มตั้งแต่ 0 และระบุหน่วย"); return; }
    if (!selectedId) { setError(`ไม่มี${tab === "product" ? "สินค้า" : "ท็อปปิ้ง"}ให้เพิ่ม`); return; }
    setBusy(true); setError(null);
    try {
      if (modal === "add") {
        if (tab === "product") await addProductToStock(selectedId, { stockQty: amount, unit: unit.trim() });
        else await addToppingToStock(selectedId, { stockQty: amount, unit: unit.trim() });
      } else {
        if (tab === "product") await updateStock(selectedId, { stockQty: amount, unit: unit.trim() });
        else await updateToppingStock(selectedId, { stockQty: amount, unit: unit.trim() });
      }
      await load(); setModal(null);
    } catch (err) { setError(err instanceof Error ? err.message : "บันทึกสต๊อกไม่สำเร็จ"); }
    finally { setBusy(false); }
  };

  const adjust = async (item: InventoryItem, delta: number) => {
    setBusy(true); setError(null);
    try { if (item.kind === "product") await adjustStock(item.id, delta); else await adjustToppingStock(item.id, delta); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "ปรับจำนวนไม่สำเร็จ"); }
    finally { setBusy(false); }
  };
  const toggle = async (item: InventoryItem) => {
    setBusy(true); try { if (item.kind === "product") await updateStock(item.id, { active: !item.active }); else await updateToppingStock(item.id, { active: !item.active }); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "เปลี่ยนสถานะไม่สำเร็จ"); } finally { setBusy(false); }
  };
  const remove = async (item: InventoryItem) => {
    if (!window.confirm(`นำ “${item.name}” ออกจากทะเบียนสต๊อก? ตัวสินค้าและประวัติการขายจะไม่ถูกลบ`)) return;
    setBusy(true); try { if (item.kind === "product") await removeProductFromStock(item.id); else await removeToppingFromStock(item.id); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "นำออกจากสต๊อกไม่สำเร็จ"); } finally { setBusy(false); }
  };

  const allCount = products.length + toppings.length;
  const activeCount = [...products, ...toppings].filter((item) => item.active).length;
  return <div className="max-w-6xl">
    <PageHeader title="สต๊อกสินค้า" subtitle="เชื่อมสินค้าและท็อปปิ้งที่มีอยู่ แล้วกำหนดจำนวนคงเหลือ" />
    {error && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
    <div className="mb-6 flex flex-wrap gap-4">
      <StatCard icon={<Package className="h-5 w-5" />} iconBgClass="bg-brand-light" iconColorClass="text-brand" label="รายการในสต๊อก" value={String(allCount)} sublabel="สินค้าและท็อปปิ้ง" highlighted />
      <StatCard icon={<CheckCircle2 className="h-5 w-5" />} iconBgClass="bg-green-50" iconColorClass="text-green-500" label="เปิดใช้งาน" value={String(activeCount)} valueColorClass="text-green-600" sublabel="รายการ" />
      <StatCard icon={<XCircle className="h-5 w-5" />} iconBgClass="bg-red-50" iconColorClass="text-red-500" label="ปิดใช้งาน" value={String(allCount-activeCount)} valueColorClass="text-red-500" sublabel="รายการ" />
      <StatCard icon={<Grid2x2 className="h-5 w-5" />} iconBgClass="bg-blue-50" iconColorClass="text-blue-500" label="ใกล้หมด" value={String([...products,...toppings].filter((item)=>item.status==="low").length)} valueColorClass="text-blue-500" sublabel="รายการ" />
    </div>
    <div className="mb-4 flex gap-2">{([{id:"product",label:"สินค้าสำเร็จรูป"},{id:"topping",label:"ท็อปปิ้ง"}] as const).map((option)=><button key={option.id} onClick={()=>{setTab(option.id);setQuery("");setUnit(option.id==="product"?"ถ้วย":"หน่วย");}} className={`rounded-full px-4 py-2 text-sm font-medium ${tab===option.id?"bg-brand text-white":"border bg-white text-gray-500"}`}>{option.label}</button>)}</div>
    <div className="flex flex-col gap-6 lg:flex-row">
      {tab==="product" && <CategorySidebar categoryCounts={counts} selected={category} onSelect={setCategory} />}
      <div className="min-w-0 flex-1 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-semibold text-gray-700">{tab==="product"?categoryMeta[category].label:"ท็อปปิ้ง"} ({shown.length})</p><div className="flex gap-2"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="ค้นหา" className="rounded-full border py-2 pl-9 pr-3 text-sm"/></div><button onClick={openAdd} className="flex items-center gap-1 rounded-full bg-brand px-4 py-2 text-sm font-medium text-white"><Plus className="h-4 w-4"/> เพิ่ม{tab==="product"?"สินค้า":"ท็อปปิ้ง"}</button></div></div>
        {loading?<div className="flex justify-center py-12"><Loader2 className="animate-spin"/></div>:<div className="overflow-x-auto"><table className="min-w-[720px] w-full text-sm"><thead><tr className="border-b text-left text-gray-400"><th className="py-2">รายการ</th><th>ราคา</th><th>คงเหลือ</th><th>สถานะ</th><th>จัดการ</th></tr></thead><tbody>{shown.map((item)=><tr key={item.id} className="border-b border-gray-50"><td className="py-3"><button onClick={()=>openEdit(item)} className="flex items-center gap-3 text-left hover:text-brand"><img src={item.image} className="h-10 w-10 rounded-lg object-cover"/><span>{item.name}</span><Pencil className="h-3.5 w-3.5"/></button></td><td>{item.price.toFixed(2)} บาท</td><td><div className="flex items-center gap-2"><button disabled={busy||item.stockQty===0} onClick={()=>void adjust(item,-1)} className="rounded-lg border p-1.5 disabled:opacity-30"><Minus className="h-4 w-4"/></button><button onClick={()=>openEdit(item)} className="min-w-20 font-semibold text-brand">{item.stockQty} {item.unit}</button><button disabled={busy} onClick={()=>void adjust(item,1)} className="rounded-lg bg-brand p-1.5 text-white"><Plus className="h-4 w-4"/></button></div></td><td><button onClick={()=>void toggle(item)} className={`rounded-full px-3 py-1 text-xs ${item.active?"bg-green-50 text-green-600":"bg-gray-100 text-gray-500"}`}>{item.active?"เปิดใช้งาน":"ปิดใช้งาน"}</button></td><td><button onClick={()=>void remove(item)} title="นำออกจากสต๊อก" className="rounded-full bg-red-50 p-2 text-red-500"><Trash2 className="h-4 w-4"/></button></td></tr>)}{shown.length===0&&<tr><td colSpan={5} className="py-12 text-center text-gray-400">ยังไม่มีรายการในสต๊อกหมวดนี้</td></tr>}</tbody></table></div>}
      </div>
    </div>
    {modal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"><div className="mb-5 flex items-center justify-between"><h2 className="font-bold text-gray-800">{modal==="add"?`เพิ่ม${tab==="product"?"สินค้า":"ท็อปปิ้ง"}ในสต๊อก`:`กำหนดสต๊อก: ${selected?.name}`}</h2><button type="button" onClick={()=>setModal(null)}><X className="h-5 w-5"/></button></div>{modal==="add"&&<><label className="mb-1 block text-xs font-medium">เลือกจากรายการที่มีอยู่</label><select value={selectedId} onChange={(e)=>setSelectedId(e.target.value)} className="mb-4 w-full rounded-xl border px-3 py-3 text-sm"><option value="">-- เลือกรายการ --</option>{available.map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</select>{available.length===0&&<p className="mb-4 text-xs text-amber-600">ทุกรายการอยู่ในสต๊อกแล้ว หากสร้างเมนูใหม่ ระบบจะเพิ่มเข้าสต๊อกอัตโนมัติ</p>}</>}<div className="grid grid-cols-2 gap-3"><div><label className="mb-1 block text-xs font-medium">จำนวนคงเหลือ</label><input type="number" min="0" step="1" required value={qty} onChange={(e)=>setQty(e.target.value)} className="w-full rounded-xl border px-3 py-3"/></div><div><label className="mb-1 block text-xs font-medium">หน่วย</label><input required maxLength={30} value={unit} onChange={(e)=>setUnit(e.target.value)} className="w-full rounded-xl border px-3 py-3"/></div></div><button disabled={busy||!selectedId} className="mt-5 flex w-full justify-center rounded-xl bg-brand py-3 font-medium text-white disabled:opacity-50">{busy?<Loader2 className="animate-spin"/>:"บันทึกสต๊อก"}</button></form></div>}
  </div>;
}
