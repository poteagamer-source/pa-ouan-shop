import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Language = "th" | "en";

const translations: Record<string, string> = {
  "หน้าหลัก": "Home", "จัดการสินค้า": "Menu management", "รายการสั่งซื้อ": "Orders",
  "จัดการเมนูสินค้า": "Menu management", "รายการออเดอร์": "Orders",
  "สต๊อกสินค้า": "Stock", "รายงานยอดขาย": "Sales report", "จัดการพนักงาน": "Staff management",
  "ผู้จัดการ": "Manager", "ห้องครัว": "Kitchen", "พนักงานเสิร์ฟ": "Waiter",
  "หน้าห้องครัว": "Kitchen home", "รายการออเดอร์ใหม่": "New orders", "กำลังทำอาหาร": "Cooking",
  "พร้อมเสิร์ฟ": "Ready to serve", "เสิร์ฟแล้ว": "Served", "งานของฉัน": "My tasks",
  "แก้ไข": "Edit items", "ย้อนกลับ": "Back", "ชำระเงิน": "Payment", "เลือกเมนู": "Choose menu",
  "ยังไม่มีสินค้าในตะกร้า": "Your cart is empty", "หน้าหลักลูกค้า": "Customer home",
  "แนะนำ": "Recommended", "ขายดี": "Bestsellers", "สั่งอาหารเพิ่ม": "Add more items",
  "ค้นหาเมนู": "Search menu", "โต๊ะ": "Table", "ออกจากระบบ": "Sign out",
  "จัดการร้านค้า": "Store management", "หน้าจอพนักงานเสิร์ฟ": "Waiter workspace",
  "ตรวจสอบออเดอร์และการชำระเงินจากระบบจริง": "Review orders and verified payments",
  "ภาพรวม workflow ของร้านจากข้อมูลจริง": "Live overview of the store workflow",
  "เพิ่ม ลบ หรือแก้ไขข้อมูลรายการสินค้าและราคา": "Add, remove, or edit products and prices",
  "ออเดอร์ที่กำลังปรุงอาหารอยู่": "Orders currently being prepared",
  "ออเดอร์ที่เข้ามาใหม่ รอส่งต่อไปยังขั้นตอนถัดไป": "New orders waiting for the next step",
  "อาหารพร้อมเสิร์ฟแล้ว": "Orders ready to be served", "รายการอาหารที่เสิร์ฟแล้ว": "Served order history",
  "สรุปยอดขายและรายการสั่งซื้อ": "Sales and order summary",
  "เชื่อมสินค้าและท็อปปิ้งที่มีอยู่ แล้วกำหนดจำนวนคงเหลือ": "Manage product and topping inventory",
};

interface LanguageValue { language: Language; setLanguage: (language: Language) => void; t: (thai: string, english?: string) => string }
const LanguageContext = createContext<LanguageValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => window.localStorage.getItem("app-language") === "en" ? "en" : "th");
  useEffect(() => { window.localStorage.setItem("app-language", language); document.documentElement.lang = language; }, [language]);
  const value = useMemo(() => ({ language, setLanguage, t: (thai: string, english?: string) => language === "th" ? thai : english ?? translations[thai] ?? thai }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used within LanguageProvider");
  return value;
}
