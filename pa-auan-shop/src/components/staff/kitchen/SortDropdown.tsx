/** ปุ่ม UI สำหรับเรียงเวลา; หากต้องเพิ่มการเรียงจริงให้รับ value/onChange ผ่าน props ที่ไฟล์นี้ */
import { ArrowUpDown, ChevronDown } from "lucide-react";

export function SortDropdown() {
  return (
    <button
      type="button"
      className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs text-gray-600 shadow-sm hover:bg-gray-50 transition-colors"
    >
      <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
      เรียงตามเวลา (ใหม่ล่าสุด)
      <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
    </button>
  );
}
