import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from "react";
import { Search, Plus, CheckCircle2, XCircle, Grid2x2, Package, Pencil, Trash2, X } from "lucide-react";
import { PageHeader } from "../../components/staff/PageHeader";
import { StatCard } from "../../components/staff/StatCard";
import { CategorySidebar } from "../../components/staff/CategorySidebar";
import { categoryMeta } from "../../config/constants";
import { createProduct, deleteProduct, fetchProducts, subscribeToUpdates, updateProduct } from "../../lib/api";
import type { CategoryId, Product } from "../../types";

const PAGE_SIZE = 4;
const categories = (Object.keys(categoryMeta) as CategoryId[]).map((id) => ({
  id,
  label: categoryMeta[id].label,
}));

type ProductForm = {
  name: string;
  price: string;
  category: CategoryId;
  image: string;
  bestseller: boolean;
  recommended: boolean;
};

const emptyForm = (category: CategoryId): ProductForm => ({
  name: "",
  price: "",
  category,
  image: "/images/food-bualoy.png",
  bestseller: false,
  recommended: false,
});

export function MenuManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("bualoy");
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm("bualoy"));
  const [modalOpen, setModalOpen] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    try {
      setProducts(await fetchProducts());
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "โหลดรายการสินค้าไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
    const unsubscribe = subscribeToUpdates((update) => {
      if (update.resource === "products") void loadProducts();
    });
    const fallback = window.setInterval(() => void loadProducts(), 15000);
    const refreshOnFocus = () => void loadProducts();
    window.addEventListener("focus", refreshOnFocus);
    return () => {
      unsubscribe();
      window.clearInterval(fallback);
      window.removeEventListener("focus", refreshOnFocus);
    };
  }, []);

  const categoryCounts = useMemo(() => {
    const counts = {} as Record<CategoryId, number>;
    categories.forEach((category) => {
      counts[category.id] = products.filter((product) => product.category === category.id).length;
    });
    return counts;
  }, [products]);

  const filtered = useMemo(() => {
    const source = products.filter((product) => product.category === selectedCategory);
    const term = query.trim().toLowerCase();
    return term ? source.filter((product) => product.name.toLowerCase().includes(term)) : source;
  }, [products, query, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const activeCount = products.filter((product) => product.active !== false).length;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(selectedCategory));
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      price: String(product.price),
      category: product.category,
      image: product.image || "/images/food-bualoy.png",
      bestseller: Boolean(product.bestseller),
      recommended: Boolean(product.recommended),
    });
    setModalOpen(true);
  };

  const saveProduct = async (event: FormEvent) => {
    event.preventDefault();
    const price = Number(form.price);
    if (!form.name.trim() || !Number.isFinite(price) || price < 0) {
      setMessage("กรุณากรอกชื่อสินค้าและราคาให้ถูกต้อง");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        price,
        category: form.category,
        image: form.image.trim() || "/images/food-bualoy.png",
        bestseller: form.bestseller,
        recommended: form.recommended,
      };
      if (editing) {
        const updated = await updateProduct(editing.id, payload);
        setProducts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setMessage("แก้ไขสินค้าเรียบร้อย");
      } else {
        const created = await createProduct(payload);
        setProducts((current) => [...current, created]);
        setSelectedCategory(created.category);
        setMessage("เพิ่มสินค้าเรียบร้อย");
      }
      setModalOpen(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "บันทึกสินค้าไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const toggleProduct = async (product: Product) => {
    const active = product.active === false;
    try {
      const updated = await updateProduct(product.id, { active });
      setProducts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setMessage(active ? "เปิดขายสินค้าแล้ว" : "ปิดขายสินค้าแล้ว");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "เปลี่ยนสถานะไม่สำเร็จ");
    }
  };

  const saveInlinePrice = async (product: Product, rawPrice: string) => {
    const price = Number(rawPrice);
    if (!Number.isFinite(price) || price < 0 || price === product.price) return;
    try {
      const updated = await updateProduct(product.id, { price });
      setProducts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setMessage("อัปเดตราคาเรียบร้อย");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "อัปเดตราคาไม่สำเร็จ");
    }
  };

  const handlePriceKey = (event: KeyboardEvent<HTMLInputElement>, product: Product) => {
    if (event.key === "Enter") {
      event.currentTarget.blur();
      void saveInlinePrice(product, event.currentTarget.value);
    }
  };

  const removeProduct = async (product: Product) => {
    if (!window.confirm(`ต้องการลบ “${product.name}” ใช่หรือไม่?`)) return;
    try {
      await deleteProduct(product.id);
      setProducts((current) => current.filter((item) => item.id !== product.id));
      setMessage("ลบสินค้าเรียบร้อย");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ลบสินค้าไม่สำเร็จ");
    }
  };

  return (
    <div className="max-w-6xl">
      <PageHeader title="จัดการสินค้า" subtitle="เพิ่ม ลบ หรือแก้ไขข้อมูลรายการสินค้าและราคา" />

      <div className="flex flex-wrap gap-4 mb-6">
        <StatCard icon={<Package className="w-5 h-5" />} iconBgClass="bg-brand-light" iconColorClass="text-brand" label="สินค้าทั้งหมด" value={String(products.length)} sublabel="รายการ" highlighted />
        <StatCard icon={<CheckCircle2 className="w-5 h-5" />} iconBgClass="bg-green-50" iconColorClass="text-green-500" label="เปิดขาย" value={String(activeCount)} valueColorClass="text-green-600" sublabel="รายการ" />
        <StatCard icon={<XCircle className="w-5 h-5" />} iconBgClass="bg-red-50" iconColorClass="text-red-500" label="ปิดขาย" value={String(products.length - activeCount)} valueColorClass="text-red-500" sublabel="รายการ" />
        <StatCard icon={<Grid2x2 className="w-5 h-5" />} iconBgClass="bg-blue-50" iconColorClass="text-blue-500" label="หมวดหมู่สินค้า" value={String(categories.length)} valueColorClass="text-blue-500" sublabel="หมวดหมู่" />
      </div>

      {message && (
        <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          {message}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        <CategorySidebar
          categoryCounts={categoryCounts}
          selected={selectedCategory}
          onSelect={(id) => {
            setSelectedCategory(id);
            setPage(1);
          }}
        />

        <div className="flex-1 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <p className="text-sm font-semibold text-gray-700">
              รายการสินค้าในหมวด: {categoryMeta[selectedCategory].label} ({filtered.length} รายการ)
            </p>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="ค้นหาสินค้า" className="rounded-full border border-gray-200 pl-9 pr-4 py-2 text-sm outline-none focus:border-brand" />
              </div>
              <button type="button" onClick={openCreate} className="flex items-center gap-1.5 rounded-full bg-brand text-white text-sm font-medium px-4 py-2 hover:bg-brand-dark">
                <Plus className="w-4 h-4" /> เพิ่มสินค้า
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-100">
                  <th className="py-2 font-medium">ลำดับ</th><th className="py-2 font-medium">รูปภาพ</th><th className="py-2 font-medium">ชื่อสินค้า</th><th className="py-2 font-medium">ราคา (บาท)</th><th className="py-2 font-medium">สถานะ</th><th className="py-2 font-medium">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((product, index) => {
                  const active = product.active !== false;
                  return (
                    <tr key={product.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 text-gray-500">{(safePage - 1) * PAGE_SIZE + index + 1}</td>
                      <td className="py-3"><img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover" /></td>
                      <td className="py-3 text-gray-700">{product.name}</td>
                      <td className="py-3">
                        <input key={`${product.id}-${product.price}`} type="number" min="0" step="0.01" defaultValue={product.price.toFixed(2)} onBlur={(event) => void saveInlinePrice(product, event.currentTarget.value)} onKeyDown={(event) => handlePriceKey(event, product)} className="w-24 rounded-full border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-brand" />
                        <span className="ml-1 text-gray-400">บาท</span>
                      </td>
                      <td className="py-3">
                        <button type="button" onClick={() => void toggleProduct(product)} aria-pressed={active} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${active ? "bg-green-500" : "bg-gray-300"}`}>
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${active ? "translate-x-6" : "translate-x-1"}`} />
                        </button>
                        <span className="ml-2 text-xs text-gray-500">{active ? "เปิดขาย" : "ปิดขาย"}</span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => openEdit(product)} aria-label="แก้ไข" className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-100 text-yellow-600"><Pencil className="w-3.5 h-3.5" /></button>
                          <button type="button" onClick={() => void removeProduct(product)} aria-label="ลบ" className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!loading && pageItems.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-400">ไม่พบสินค้า</td></tr>}
                {loading && <tr><td colSpan={6} className="py-8 text-center text-gray-400">กำลังโหลดสินค้า...</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-gray-400">แสดง {pageItems.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1} - {(safePage - 1) * PAGE_SIZE + pageItems.length} จาก {filtered.length} รายการ</p>
            <div className="flex items-center gap-1">
              <button type="button" disabled={safePage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="w-7 h-7 rounded-full text-gray-400 disabled:opacity-30">{"<"}</button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => <button key={number} type="button" onClick={() => setPage(number)} className={`w-7 h-7 rounded-full text-sm ${number === safePage ? "bg-brand text-white" : "text-gray-500 hover:bg-gray-100"}`}>{number}</button>)}
              <button type="button" disabled={safePage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="w-7 h-7 rounded-full text-gray-400 disabled:opacity-30">{">"}</button>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <form onSubmit={saveProduct} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">{editing ? "แก้ไขสินค้า" : "เพิ่มสินค้า"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-full p-1 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2 text-sm text-gray-600">ชื่อสินค้า<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-brand" /></label>
              <label className="text-sm text-gray-600">ราคา (บาท)<input required type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-brand" /></label>
              <label className="text-sm text-gray-600">หมวดหมู่<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as CategoryId })} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-brand">{categories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</select></label>
              <label className="sm:col-span-2 text-sm text-gray-600">URL รูปภาพ<input value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-brand" /></label>
              <label className="flex items-center gap-2 text-sm text-gray-600"><input type="checkbox" checked={form.bestseller} onChange={(event) => setForm({ ...form, bestseller: event.target.checked })} /> สินค้าขายดี</label>
              <label className="flex items-center gap-2 text-sm text-gray-600"><input type="checkbox" checked={form.recommended} onChange={(event) => setForm({ ...form, recommended: event.target.checked })} /> สินค้าแนะนำ</label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-600">ยกเลิก</button>
              <button type="submit" disabled={saving} className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? "กำลังบันทึก..." : "บันทึก"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
