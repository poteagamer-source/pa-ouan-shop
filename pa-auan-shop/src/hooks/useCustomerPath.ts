import { useTable } from "../context/TableContext";

/** path ฝั่งลูกค้า — คงเลขโต๊ะจาก QR ตลอด flow */
export function useCustomerPath() {
  const { basePath } = useTable();

  return {
    basePath,
    home: basePath,
    menu: `${basePath}/menu`,
    cart: `${basePath}/cart`,
    payment: `${basePath}/payment`,
    status: `${basePath}/status`,
    product: (id: string) => `${basePath}/product/${id}`,
  };
}
