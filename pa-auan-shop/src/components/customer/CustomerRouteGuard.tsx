import { Navigate, Outlet } from "react-router-dom";
import { MenuBrowseProvider } from "../../context/MenuBrowseContext";
import { TableProvider } from "../../context/TableContext";
import { useTableGuard } from "../../context/TableContext";

/** ตรวจรูปแบบโต๊ะก่อนสร้าง context เพื่อไม่ให้ URL ผิดเข้าสู่ขั้นตอนสั่งอาหาร */
function GuardInner() {
  const { valid, tableId } = useTableGuard();

  // replace ป้องกันการกด Back แล้วกลับมายัง URL โต๊ะที่ไม่ถูกต้องซ้ำ
  if (!valid) {
    return <Navigate to="/?error=invalid-table" replace />;
  }

  return (
    /* key ด้านล่างบังคับสร้าง Provider ใหม่เมื่อเปลี่ยนโต๊ะ ป้องกัน state จากโต๊ะเดิมติดมา */
    <TableProvider key={tableId}>
      <MenuBrowseProvider>
        <Outlet />
      </MenuBrowseProvider>
    </TableProvider>
  );
}

/** element หลักของ route /order/:table; หน้าย่อยแสดงผ่าน Outlet ใน GuardInner */
export function CustomerRouteGuard() {
  return <GuardInner />;
}
