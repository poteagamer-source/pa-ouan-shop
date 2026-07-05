import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useParams } from "react-router-dom";
import { isValidTableId, normalizeTableId } from "../config/qrRoutes";

interface TableContextValue {
  tableId: string;
  basePath: string;
}

const TableContext = createContext<TableContextValue | null>(null);

export function TableProvider({ children }: { children: ReactNode }) {
  const { table } = useParams<{ table: string }>();
  const tableId = normalizeTableId(table ?? "");

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

export function useTable() {
  const ctx = useContext(TableContext);
  if (!ctx) {
    throw new Error("useTable must be used within TableProvider (/order/:table)");
  }
  return ctx;
}

export function useTableOptional() {
  return useContext(TableContext);
}

export function useTableGuard(): { valid: boolean; tableId: string } {
  const { table } = useParams<{ table: string }>();
  const tableId = normalizeTableId(table ?? "");
  return { valid: isValidTableId(tableId), tableId };
}
