const legendItems = [
  { dot: "bg-orange-500", label: "รายการออเดอร์", desc: "ออเดอร์เข้ามาใหม่" },
  { dot: "bg-amber-500", label: "กำลังทำอาหาร", desc: "ออเดอร์ที่กำลังปรุงอยู่" },
  { dot: "bg-green-500", label: "พร้อมเสิร์ฟ", desc: "อาหารเสร็จแล้ว พร้อมเสิร์ฟ" },
  { dot: "bg-sky-500", label: "เสิร์ฟแล้ว", desc: "นำอาหารเสิร์ฟลูกค้าแล้ว" },
];

export function StatusLegend() {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
      <p className="text-sm font-semibold text-green-600 mb-3">หมายเหตุ</p>
      <div className="space-y-2">
        {legendItems.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.dot}`} />
            <span className="font-medium text-gray-700">{item.label}</span>
            <span className="text-gray-400">: {item.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
