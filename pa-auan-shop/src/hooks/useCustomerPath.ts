import { useTable } from "../context/TableContext";

/**
 * สร้าง URL ฝั่งลูกค้าจาก basePath ของโต๊ะปัจจุบัน
 * ห้ามเขียนลิงก์ /menu หรือ /cart ตรง ๆ เพราะจะทำให้รหัสโต๊ะจาก QR หาย
 * ตัวอย่างโต๊ะ A01: menu=/order/A01/menu, product(bl1)=/order/A01/product/bl1
 */
export function useCustomerPath() {
  const { basePath } = useTable();

  // รวม path ไว้ที่เดียวเพื่อให้เปลี่ยนโครงสร้าง URL ภายหลังได้ง่าย
  return {
    basePath,
    home: basePath,
    menu: `${basePath}/menu`,
    cart: `${basePath}/cart`,
    payment: `${basePath}/payment`,
    status: `${basePath}/status`,
    // product เป็นฟังก์ชันเพราะต้องเติมรหัสสินค้าที่ผู้ใช้เลือก
    product: (id: string) => `${basePath}/product/${id}`,
  };
}
