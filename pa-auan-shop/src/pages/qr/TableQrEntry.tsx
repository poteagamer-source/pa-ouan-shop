/** รับ token จาก QR แล้วถาม backend ว่าผูกกับโต๊ะใด ก่อน redirect เข้าหน้าสั่งอาหาร */
import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { resolveTableQrCode } from "../../lib/api";

export function TableQrEntry() {
  const { token = "" } = useParams();
  const [tableId, setTableId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    resolveTableQrCode(token).then((result) => setTableId(result.tableId)).catch((reason) => setError(reason instanceof Error ? reason.message : "QR ไม่ถูกต้อง"));
  }, [token]);

  if (tableId) return <Navigate to={`/order/${encodeURIComponent(tableId)}`} replace />;
  return <main className="flex min-h-dvh items-center justify-center bg-gray-50 p-6 text-center"><div className="rounded-2xl bg-white p-8 shadow-sm"><p className={error ? "text-red-500" : "text-gray-500"}>{error || "กำลังตรวจสอบ QR..."}</p>{error && <a href="/" className="mt-4 inline-block rounded-lg bg-brand px-5 py-2 text-sm text-white">กลับหน้าหลัก</a>}</div></main>;
}
