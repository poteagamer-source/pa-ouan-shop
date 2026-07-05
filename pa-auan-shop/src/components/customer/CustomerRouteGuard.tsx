import { Navigate, Outlet } from "react-router-dom";
import { MenuBrowseProvider } from "../../context/MenuBrowseContext";
import { TableProvider } from "../../context/TableContext";
import { useTableGuard } from "../../context/TableContext";

function GuardInner() {
  const { valid, tableId } = useTableGuard();

  if (!valid) {
    return <Navigate to="/?error=invalid-table" replace />;
  }

  return (
    <TableProvider key={tableId}>
      <MenuBrowseProvider>
        <Outlet />
      </MenuBrowseProvider>
    </TableProvider>
  );
}

export function CustomerRouteGuard() {
  return <GuardInner />;
}
