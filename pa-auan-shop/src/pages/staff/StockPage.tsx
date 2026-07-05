import { useMemo, useState } from "react";
import { Search, CheckCircle2, XCircle, Grid2x2, Package, Trash2 } from "lucide-react";
import { PageHeader } from "../../components/staff/PageHeader";
import { StatCard } from "../../components/staff/StatCard";
import { CategorySidebar } from "../../components/staff/CategorySidebar";
import { categories, categoryMeta, stockItems } from "../../data/mockData";
import type { CategoryId } from "../../types";

const PAGE_SIZE = 4;

export function StockPage() {
  const [tab, setTab] = useState<"product" | "topping">("product");
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("bualoy");
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Record<string, boolean>>({});

  const categoryCounts = useMemo(() => {
    const counts = {} as Record<CategoryId, number>;
    categories.forEach((c) => {
      counts[c.id] = stockItems.filter((p) => p.category === c.id).length;
    });
    return counts;
  }, []);

  const listForCategory = useMemo(
    () => stockItems.filter((p) => p.category === selectedCategory),
    [selectedCategory],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return listForCategory;
    return listForCategory.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()));
  }, [listForCategory, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const isActive = (id: string) => active[id] ?? true;
  const toggle = (id: string) => setActive((prev) => ({ ...prev, [id]: !isActive(id) }));

  const meta = categoryMeta[selectedCategory];
  const openCount = stockItems.length;

  return (
    <div className="max-w-6xl">
      <PageHeader title="สต๊อกสินค้า" subtitle="จัดการสินค้าคงคลังสินค้า" />

      <div className="flex flex-wrap gap-4 mb-6">
        <StatCard
          icon={<Package className="w-5 h-5" />}
          iconBgClass="bg-brand-light"
          iconColorClass="text-brand"
          label="สินค้าทั้งหมด"
          value={String(openCount)}
          sublabel="รายการ"
          highlighted
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBgClass="bg-green-50"
          iconColorClass="text-green-500"
          label="เปิดขาย"
          value={String(openCount)}
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
            { id: "product", label: "สินค้าสำเร็จรูป" },
            { id: "topping", label: "ท็อปปิ้ง" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              tab === t.id ? "bg-brand text-white" : "bg-white text-gray-500 border border-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

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
              รายการสินค้าในหมวด : {meta.label} ({filtered.length} รายการ)
            </p>
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
          </div>

          {tab === "topping" ? (
            <div className="py-10 text-center text-gray-400 text-sm">ยังไม่มีข้อมูลสต๊อกท็อปปิ้ง</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-100">
                      <th className="py-2 font-medium">ลำดับ</th>
                      <th className="py-2 font-medium">สินค้า</th>
                      <th className="py-2 font-medium">ราคาขาย (บาท)</th>
                      <th className="py-2 font-medium">คงเหลือ</th>
                      <th className="py-2 font-medium">สถานะ</th>
                      <th className="py-2 font-medium">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((item, i) => (
                      <tr key={item.id} className="border-b border-gray-50 last:border-0">
                        <td className="py-3 text-gray-500">{(page - 1) * PAGE_SIZE + i + 1}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                            <span className="text-gray-700">{item.name}</span>
                          </div>
                        </td>
                        <td className="py-3 text-gray-700">{item.price.toFixed(2)} บาท</td>
                        <td className="py-3 text-gray-700">
                          {item.stockQty} {item.unit}
                        </td>
                        <td className="py-3">
                          <span
                            className={`text-xs font-medium ${
                              item.status === "low" ? "text-red-500" : "text-green-600"
                            }`}
                          >
                            {item.status === "low" ? "ใกล้หมด" : "เพียงพอ"}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggle(item.id)}
                              aria-pressed={isActive(item.id)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                isActive(item.id) ? "bg-green-500" : "bg-gray-300"
                              }`}
                            >
                              <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                  isActive(item.id) ? "translate-x-6" : "translate-x-1"
                                }`}
                              />
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
