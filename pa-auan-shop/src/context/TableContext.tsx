import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useParams } from "react-router-dom";
import { isValidTableId, normalizeTableId } from "../config/qrRoutes";

/** ข้อมูลโต๊ะที่ทุกหน้าภายใต้ /order/:table ใช้ร่วมกัน */
interface TableContextValue {
  /** รหัสโต๊ะที่ตัดช่องว่างและแปลงเป็นตัวพิมพ์ใหญ่แล้ว เช่น A01 */
  tableId: string;
  /** path ตั้งต้นของโต๊ะ ใช้สร้างลิงก์โดยไม่ทำเลขโต๊ะหาย เช่น /order/A01 */
  basePath: string;
}

// ใช้ null เพื่อให้ useTable ตรวจจับการเรียกใช้นอก Provider และแจ้ง error ที่เข้าใจง่ายได้
const TableContext = createContext<TableContextValue | null>(null);

/**
 * อ่านพารามิเตอร์ :table จาก React Router แล้วแจก tableId/basePath ให้หน้าลูกค้าด้านใน
 * Provider นี้ถูกครอบโดย CustomerRouteGuard ที่ route /order/:table ใน App.tsx
 */
export function TableProvider({ children }: { children: ReactNode }) {
  // useParams คืน undefined ได้ จึงใช้ค่าว่างก่อน normalize เพื่อไม่ให้ฟังก์ชันพัง
  const { table } = useParams<{ table: string }>();
  const tableId = normalizeTableId(table ?? "");

  // useMemo รักษา object reference เดิมจนกว่า tableId เปลี่ยน ลดการ render ของ consumer
  const value = useMemo(
    () => ({
      tableId,
      basePath: `/order/${tableId}`,
    }),
    [tableId],
  );

  return (
    <TableContext.Provider value={value}>{children}</TableContext.Provider>
  );
}

/** Hook แบบบังคับ: ใช้ใน component ที่มั่นใจว่าอยู่ใต้ TableProvider */
export function useTable() {
  const ctx = useContext(TableContext);
  if (!ctx) {
    throw new Error("useTable must be used within TableProvider (/order/:table)");
  }
  return ctx;
}

/** Hook แบบไม่บังคับ: คืน null ได้ เหมาะกับ component ที่ใช้ได้ทั้งใน/นอก customer route */
export function useTableOptional() {
  return useContext(TableContext);
}

/**
 * ตรวจรหัสโต๊ะก่อนสร้าง TableProvider
 * แยกเป็น hook เพราะ guard ต้องตรวจ URL ก่อนอนุญาตให้หน้า order แสดงผล
 */
export function useTableGuard(): { valid: boolean; tableId: string } {
  const { table } = useParams<{ table: string }>();
  const tableId = normalizeTableId(table ?? "");
  return { valid: isValidTableId(tableId), tableId };
}
