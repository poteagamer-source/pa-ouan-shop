import { useMemo, useState } from "react";
import { CheckCircle2, XCircle, Grid2x2, Package, ChevronRight, FileText, CheckCircle } from "lucide-react";
import { PageHeader } from "../../components/staff/PageHeader";
import { StatCard } from "../../components/staff/StatCard";
import { categories, salesOrders } from "../../data/mockData";

export function PurchaseOrdersPage() {
  const [selectedId, setSelectedId] = useState(salesOrders[0]?.id);
  const selected = useMemo(
    () => salesOrders.find((o) => o.id === selectedId) ?? salesOrders[0],
    [selectedId],
  );

  return (
    <div className="max-w-6xl">
      <PageHeader title="รายการสั่งซื้อ" subtitle="ตรวจสอบและจัดการรายการสั่งซื้อทั้งหมดในระบบ" />

      <div className="flex flex-wrap gap-4 mb-6">
        <StatCard
          icon={<Package className="w-5 h-5" />}
          iconBgClass="bg-brand-light"
          iconColorClass="text-brand"
          label="สินค้าทั้งหมด"
          value="36"
          sublabel="รายการ"
          highlighted
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBgClass="bg-green-50"
          iconColorClass="text-green-500"
          label="เปิดขาย"
          value="36"
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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-100">
                  <th className="py-2 font-medium">Order ID</th>
                  <th className="py-2 font-medium">โต๊ะ</th>
                  <th className="py-2 font-medium">ยอดรวม</th>
                  <th className="py-2 font-medium">เวลา</th>
                  <th className="py-2 font-medium">ชำระเงิน</th>
                  <th className="py-2 font-medium">หลักฐาน</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {salesOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedId(order.id)}
                    className={`border-b border-gray-50 last:border-0 cursor-pointer transition-colors ${
                      order.id === selected?.id ? "bg-brand-light/60" : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="py-3 text-gray-500">{order.id}</td>
                    <td className="py-3 font-medium text-brand">{order.table}</td>
                    <td className="py-3 font-semibold text-red-500">฿{order.total.toFixed(2)}</td>
                    <td className="py-3 text-gray-500">
                      {order.date} : {order.time}
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                        <CheckCircle className="w-3.5 h-3.5" />
                        ชำระเงินแล้ว
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                        <FileText className="w-4 h-4" />
                      </span>
                    </td>
                    <td className="py-3 text-gray-300">
                      <ChevronRight className="w-4 h-4" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selected && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4 h-fit">
            <div>
              <p className="text-brand font-semibold">โต๊ะ : {selected.table}</p>
              <p className="text-xs text-gray-400">{selected.id}</p>
              <p className="text-xs text-gray-400">เวลาที่สั่งซื้อ</p>
              <p className="text-xs text-gray-500">
                {selected.date} : {selected.time}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">หลักฐานการชำระเงิน</p>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
                <p className="text-xs text-gray-400 mb-2">สลิปโอนเงินสำเร็จ</p>
                <div className="mx-auto w-32 h-32 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                  <FileText className="w-10 h-10 text-gray-300" />
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">รายการสินค้า</p>
              <div className="space-y-2">
                {selected.items.map((item) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">{item.name}</p>
                      <p className="text-xs text-gray-400">จำนวน {item.qty}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-700">฿{item.price.toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 mt-3 pt-3">
                <p className="text-sm font-semibold text-gray-700">รวมทั้งหมด</p>
                <p className="text-sm font-bold text-brand">฿{selected.total.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
