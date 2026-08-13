/** URL สำหรับพิมพ์บน QR — ลูกค้าแยกจากพนักงาน */

// Browser ใช้ origin จริงของ Render; fallback ใช้เฉพาะตอน render/build ที่ไม่มี window
const origin =
  typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";

/** QR ติดที่โต๊ะ — สแกนแล้วเข้าสั่งอาหาร (มีเลขโต๊ะใน URL) */
export function tableOrderUrl(tableId: string): string {
  // encodeURIComponent ป้องกันอักขระพิเศษในค่าที่นำไปประกอบ URL
  return `${origin}/order/${encodeURIComponent(tableId)}`;
}

/** QR สำหรับพนักงาน / ผู้จัดการ — แยกจากลูกค้า */
export function staffPortalUrl(): string {
  return `${origin}/staff-entry`;
}

/** โต๊ะที่มีในระบบ (สำหรับพิมพ์ QR) */
// เพิ่ม/ลดโต๊ะสำหรับหน้าสร้าง QR ได้ที่รายการนี้
export const TABLE_IDS = [
  "A01", "A02", "A03", "A04", "A05",
  "B01", "B02", "B03",
] as const;

// สร้าง union type จาก TABLE_IDS เช่น "A01" | "A02" โดยไม่ต้องเขียนซ้ำ
export type TableId = (typeof TABLE_IDS)[number];

/** รูปแบบเลขโต๊ะ เช่น A05, B01 */
export function isValidTableId(id: string): boolean {
  // ปัจจุบันยอมรับตัวอักษรหนึ่งตัว + เลขสองหลัก ไม่ได้จำกัดเฉพาะ TABLE_IDS
  const n = normalizeTableId(id);
  return /^[A-Z]\d{2}$/.test(n);
}

/** ทำให้ a01, A01 และค่าที่มีช่องว่างกลายเป็นรหัสรูปแบบเดียวกัน */
export function normalizeTableId(id: string): string {
  return id.trim().toUpperCase();
}
