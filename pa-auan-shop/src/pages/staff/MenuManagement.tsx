import { useMemo, useState } from "react";
import { Search, Plus, CheckCircle2, XCircle, Grid2x2, Package, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "../../components/staff/PageHeader";
import { StatCard } from "../../components/staff/StatCard";
import { CategorySidebar } from "../../components/staff/CategorySidebar";
import { categories, categoryMeta, products, toppings5, toppings10 } from "../../data/mockData";
import type { CategoryId } from "../../types";

const PAGE_SIZE = 4;

export function MenuManagement() {
  const [tab, setTab] = useState<"product" | "topping">("product");
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("bualoy");
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});

  const categoryCounts = useMemo(() => {
    const counts = {} as Record<CategoryId, number>;
    categories.forEach((c) => {
      counts[c.id] = products.filter((p) => p.category === c.id).length;
    });
    return counts;
  }, []);

  const toppingList = useMemo(() => [...toppings5, ...toppings10], []);

  const listForCategory = useMemo(
    () => products.filter((p) => p.category === selectedCategory),
    [selectedCategory],
  );

  const filtered = useMemo(() => {
    const source = tab === "product" ? listForCategory : toppingList;
    if (!query.trim()) return source;
    return source.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()));
  }, [tab, listForCategory, toppingList, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const isEnabled = (id: string) => enabled[id] ?? true;
  const toggle = (id: string) => setEnabled((prev) => ({ ...prev, [id]: !isEnabled(id) }));

  const meta = categoryMeta[selectedCategory];
  const totalProducts = products.length + toppingList.length;

  return (
    <div className="max-w-6xl">
      <PageHeader title="จัดการสินค้า" subtitle="เพิ่ม ลบ หรือแก้ไขข้อมูลรายการสินค้าและราคา" />

      <div className="flex flex-wrap gap-4 mb-6">
        <StatCard
          icon={<Package className="w-5 h-5" />}
          iconBgClass="bg-brand-light"
          iconColorClass="text-brand"
          label="สินค้าทั้งหมด"
          value={String(totalProducts)}
          sublabel="รายการ"
          highlighted
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBgClass="bg-green-50"
          iconColorClass="text-green-500"
          label="เปิดขาย"
          value={String(totalProducts)}
          valueColorClass="text-green-600"
          sublabel="รายการ"
        />
        <StatCard
          icon={<XCircle className="w-5 h-5" />}
          iconBgClass="bg-red-50"
          iconColorClass="text-red-500"
          label="ปิดขาย"
          value="0"
          valueColorClass="text-red-500"
          sublabel="รายการ"
        />
        <StatCard
          icon={<Grid2x2 className="w-5 h-5" />}
          iconBgClass="bg-blue-50"
          iconColorClass="text-blue-500"
          label="หมวดหมู่สินค้า"
          value={String(categories.length)}
          valueColorClass="text-blue-500"
          sublabel="หมวดหมู่"
        />
      </div>

      <div className="flex gap-2 mb-4">
        {(
          [
            { id: "product", label: "สินค้า" },
            { id: "topping", label: "ท็อปปิ้ง" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              tab === t.id ? "bg-brand text-white" : "bg-white text-gray-500 border border-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {tab === "product" && (
          <CategorySidebar
            categoryCounts={categoryCounts}
            selected={selectedCategory}
            onSelect={(id) => {
              setSelectedCategory(id);
              setPage(1);
            }}
            showAddButton
          />
        )}

        <div className="flex-1 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <p className="text-sm font-semibold text-gray-700">
              รายการสินค้าใน{tab === "product" ? `หมวด : ${meta.label}` : "ท็อปปิ้ง"} ({filtered.length} รายการ)
            </p>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="ค้นหาสินค้า"
                  className="rounded-full border border-gray-200 pl-9 pr-4 py-2 text-sm outline-none focus:border-brand"
                />
              </div>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-full bg-brand text-white text-sm font-medium px-4 py-2 hover:bg-brand-dark transition-colors"
              >
                <Plus className="w-4 h-4" />
                เพิ่มสินค้า
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-100">
                  <th className="py-2 font-medium">ลำดับ</th>
                  <th className="py-2 font-medium">รูปภาพ</th>
                  <th className="py-2 font-medium">ชื่อสินค้า</th>
                  <th className="py-2 font-medium">ราคา (บาท)</th>
                  <th className="py-2 font-medium">สถานะ</th>
                  <th className="py-2 font-medium">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item, i) => (
                  <tr key={item.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 text-gray-500">{(page - 1) * PAGE_SIZE + i + 1}</td>
                    <td className="py-3">
                      <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                    </td>
                    <td className="py-3 text-gray-700">{item.name}</td>
                    <td className="py-3">
                      <input
                        type="text"
                        defaultValue={item.price.toFixed(2)}
                        className="w-24 rounded-full border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-brand"
                      />
                      <span className="ml-1 text-gray-400">บาท</span>
                    </td>
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => toggle(item.id)}
                        aria-pressed={isEnabled(item.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          isEnabled(item.id) ? "bg-green-500" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                            isEnabled(item.id) ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <span className="ml-2 text-xs text-gray-500">
                        {isEnabled(item.id) ? "เปิดขาย" : "ปิดขาย"}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label="แก้ไข"
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-100 text-yellow-600"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="ลบ"
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pageItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      ไม่พบสินค้า
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-gray-400">
              แสดง {pageItems.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} - {(page - 1) * PAGE_SIZE + pageItems.length} จาก {filtered.length} รายการ
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="w-7 h-7 rounded-full text-gray-400 disabled:opacity-30"
              >
                {"<"}
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded-full text-sm ${
                    p === page ? "bg-brand text-white" : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="w-7 h-7 rounded-full text-gray-400 disabled:opacity-30"
              >
                {">"}
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-amber-50 text-amber-700 text-xs p-3 leading-relaxed">
            • สามารถแก้ไขราคาโดยคลิกที่ช่องราคา แล้วกด Enter เพื่อบันทึก
            <br />• หากปิดขาย สินค้าจะยังแสดงในระบบแต่จะไม่แสดงในหน้าร้าน
          </div>
        </div>
      </div>
    </div>
  );
}
