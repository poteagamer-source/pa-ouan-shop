/** URL สำหรับพิมพ์บน QR — ลูกค้าแยกจากพนักงาน */

const origin =
  typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";

/** QR ติดที่โต๊ะ — สแกนแล้วเข้าสั่งอาหาร (มีเลขโต๊ะใน URL) */
export function tableOrderUrl(tableId: string): string {
  return `${origin}/order/${encodeURIComponent(tableId)}`;
}

/** QR สำหรับพนักงาน / ผู้จัดการ — แยกจากลูกค้า */
export function staffPortalUrl(): string {
  return `${origin}/staff-entry`;
}

/** โต๊ะที่มีในระบบ (สำหรับพิมพ์ QR) */
export const TABLE_IDS = [
  "A01", "A02", "A03", "A04", "A05",
  "B01", "B02", "B03",
] as const;

export type TableId = (typeof TABLE_IDS)[number];

/** รูปแบบเลขโต๊ะ เช่น A05, B01 */
export function isValidTableId(id: string): boolean {
  const n = normalizeTableId(id);
  return /^[A-Z]\d{2}$/.test(n);
}

export function normalizeTableId(id: string): string {
  return id.trim().toUpperCase();
}
