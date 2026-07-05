import { Navigate } from "react-router-dom";
import { useTableGuard } from "../../context/TableContext";
import { WelcomePage } from "../customer/WelcomePage";

/** จุดเข้าจาก QR ที่โต๊ะ — แสดงหน้าต้อนรับ ก่อนกดสั่งอาหาร */
export function CustomerQrEntry() {
  const { valid } = useTableGuard();

  if (!valid) {
    return <Navigate to="/?error=invalid-table" replace />;
  }

  return <WelcomePage />;
}
