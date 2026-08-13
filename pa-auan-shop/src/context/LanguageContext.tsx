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
  "ข้อมูลจริงจากออเดอร์ที่ลูกค้าชำระเงินสำเร็จ อัปเดตแบบเรียลไทม์": "Live data from successfully paid customer orders",
  "เพิ่ม ลบ หรือแก้ไขข้อมูลรายการสินค้าและราคา": "Add, delete, or edit menu items and prices",
  "สินค้าทั้งหมด": "All items", "รวมท็อปปิ้ง": "Including toppings", "เปิดขาย": "Available",
  "ปิดขาย": "Unavailable", "รวมสินค้าและท็อปปิ้ง": "Products and toppings", "หมวดหมู่สินค้า": "Categories",
  "ท็อปปิ้งหมด": "Out-of-stock toppings", "สต๊อกเหลือ 0": "Stock remaining: 0",
  "หมวดหมู่": "Categories", "รายการท็อปปิ้ง": "Toppings", "รายการสินค้าในหมวด": "Items in category",
  "ค้นหาสินค้า": "Search items", "ค้นหา": "Search", "เพิ่มสินค้า": "Add item", "เพิ่มท็อปปิ้ง": "Add topping",
  "ลำดับ": "No.", "รูปภาพ": "Image", "ชื่อสินค้า": "Item name", "ชื่อท็อปปิ้ง": "Topping name",
  "ราคา (บาท)": "Price (THB)", "สถานะ": "Status", "จัดการ": "Actions", "กลุ่มราคา": "Price tier",
  "จำนวนสต๊อก": "Stock quantity", "URL รูปภาพ": "Image URL", "แก้ไขสินค้า": "Edit item",
  "แก้ไขท็อปปิ้ง": "Edit topping", "ยกเลิก": "Cancel", "บันทึก": "Save", "กำลังบันทึก": "Saving",
  "สต๊อกหมด": "Out of stock", "สต๊อก": "Stock", "กลุ่ม": "Tier", "บาท": "THB", "ถ้วย": "bowls", "หน่วย": "units",
  "เพิ่ม": "Add", "ลบ": "Delete", "รายการ": "items", "ไม่พบสินค้า": "No items found", "กำลังโหลดสินค้า": "Loading items",
  "แสดง": "Showing", "จาก": "of", "ทั้งหมด": "All", "เพียงพอ": "In stock", "ใกล้หมด": "Low stock",
  "ยอดขายวันนี้": "Today's sales", "ออเดอร์วันนี้": "Today's orders", "ชำระเงินสำเร็จ": "Payment successful",
  "ยอดขายแยกตามช่วงเวลา": "Sales by time", "ยอดขายรวม": "Total sales", "ออเดอร์": "Orders",
  "เฉลี่ยต่อออเดอร์": "Average per order", "สรุปยอดขายประจำวัน": "Daily sales summary",
  "ยอดขายสูงสุด": "Highest sale", "ยอดขายต่ำสุด": "Lowest sale", "ช่วงเวลาพีค": "Peak time",
  "อัปเดตล่าสุด": "Last updated", "รายการขาย": "Sales", "ยอดรวม": "Total", "เวลา": "Time",
  "ช่องเงิน": "Payment", "ชำระเงินแล้ว": "Paid", "วันนี้ยังไม่มีรายการขายที่ชำระเงินสำเร็จ": "No successful sales today",
  "ออเดอร์ที่ชำระแล้ว": "Paid orders", "ตรวจสอบแล้ว": "Verified", "ยอดชำระรวม": "Total paid",
  "จากข้อมูลจริง": "From live data", "รายการสินค้า": "Order items", "รวมทั้งหมด": "Grand total",
  "รอรับงาน": "Waiting", "งานที่รอรับ / พร้อมเสิร์ฟ": "Waiting / ready to serve", "สรุปวันนี้": "Today's summary",
  "ประวัติการเสิร์ฟล่าสุด": "Recent serving history", "รายการที่รับแล้ว": "Completed tasks", "ดูทั้งหมด": "View all",
  "ยืนยันว่าเสิร์ฟแล้ว": "Confirm served", "ไม่มีงานที่ต้องเสิร์ฟในขณะนี้": "No orders ready to serve",
  "ใหม่ล่าสุด": "Newest", "เก่าสุด": "Oldest", "เริ่มทำอาหาร": "Start cooking", "ทำเสร็จแล้ว": "Mark ready",
  "เย็น": "Cold", "ร้อน": "Hot", "จำนวน": "Quantity", "รวม": "Total", "ยืนยัน": "Confirm",
  "เพิ่มลงในตะกร้า": "Add to cart", "Total": "Total", "เมนูบัวลอย": "Bua Loi menu",
  "บัวลอย": "Bua Loi", "เฉาก๊วย": "Grass jelly", "ทับทิมกรอบ": "Tub Tim Grob",
  "น้ำแป๊ะอ้วน": "Pa Ouan drinks", "ขนมหวาน": "Desserts", "ท็อปปิ้ง": "Toppings",
  "บัวลอยไข่หวาน": "Bua Loi with sweet egg", "บัวลอยภูเขาไฟ": "Volcano Bua Loi", "บัวลอยนมสด": "Fresh milk Bua Loi",
  "บัวลอยชาไทย": "Thai tea Bua Loi", "บัวลอยมะพร้าวอ่อน": "Young coconut Bua Loi", "บัวลอยไข่เค็มหวาน": "Sweet salted-egg Bua Loi",
  "บัวลอยไข่เป็ดหวาน": "Sweet duck-egg Bua Loi", "บัวลอยงาดำ": "Black sesame Bua Loi", "บัวลอยกะทิ": "Coconut milk Bua Loi",
  "เฉาก๊วยน้ำเชื่อม": "Grass jelly in syrup", "เฉาก๊วยน้ำลำไย": "Grass jelly with longan", "เฉาก๊วยนมสด": "Fresh milk grass jelly",
  "เฉาก๊วยชาไทย": "Thai tea grass jelly", "เฉาก๊วยลำไย": "Longan grass jelly", "เฉาก๊วยภูเขาไฟ": "Volcano grass jelly",
  "ทับทิมกรอบลำไย": "Tub Tim Grob with longan", "ทับทิมกรอบแป๊ะอ้วน": "Pa Ouan Tub Tim Grob", "ทับทิมกรอบบัวลอย": "Tub Tim Grob with Bua Loi",
  "น้ำเต้าหู้ร้อน": "Hot soy milk", "น้ำเต้าหู้เย็น": "Cold soy milk", "น้ำแป๊ะอ้วน 4 อย่าง": "Pa Ouan four toppings",
  "ลอดช่องกะทิ": "Lod Chong in coconut milk", "ข้าวเหนียวมะม่วง": "Mango sticky rice", "บัวลอยแป๊ะอ้วน": "Pa Ouan Bua Loi",
  "ถั่วแดง": "Red beans", "ลูกเดือย": "Job's tears", "ข้าวโพด": "Corn", "ฝอยทอง": "Foi Thong",
  "มะพร้าว": "Coconut", "ขนุน": "Jackfruit", "เฉาก๊วยพิเศษ": "Special grass jelly",
  "อัปเดตราคาท็อปปิ้งเรียบร้อย": "Topping price updated", "อัปเดตราคาไม่สำเร็จ": "Could not update price",
  "เปิดขายท็อปปิ้งแล้ว": "Topping is now available", "ปิดขายท็อปปิ้งแล้ว": "Topping is now unavailable",
  "เปลี่ยนสถานะไม่สำเร็จ": "Could not change status", "กรุณากรอกชื่อ ราคา และจำนวนสต๊อกให้ถูกต้อง": "Enter a valid name, price, and stock quantity",
  "แก้ไขท็อปปิ้งเรียบร้อย": "Topping updated", "เพิ่มท็อปปิ้งเรียบร้อย": "Topping added",
  "บันทึกท็อปปิ้งไม่สำเร็จ": "Could not save topping", "ลบท็อปปิ้งเรียบร้อย": "Topping deleted",
  "ลบท็อปปิ้งไม่สำเร็จ": "Could not delete topping", "แก้ไขสินค้าเรียบร้อย": "Item updated",
  "เพิ่มสินค้าเรียบร้อย": "Item added", "บันทึกสินค้าไม่สำเร็จ": "Could not save item",
  "เปิดขายสินค้าแล้ว": "Item is now available", "ปิดขายสินค้าแล้ว": "Item is now unavailable",
  "อัปเดตราคาเรียบร้อย": "Price updated", "ลบสินค้าเรียบร้อย": "Item deleted", "ลบสินค้าไม่สำเร็จ": "Could not delete item",
  "กรุณากรอกชื่อสินค้าและราคาให้ถูกต้อง": "Enter a valid item name and price", "ต้องการลบ": "Delete",
  "ใช่หรือไม่": "Are you sure?", "สินค้าแนะนำ": "Recommended item", "สินค้าขายดี": "Bestselling item",
};

const translationEntries = Object.entries(translations).sort(([a], [b]) => b.length - a.length);
const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();
const translatedAttributes = ["placeholder", "title", "aria-label"];

function translateAll(value: string) {
  return translationEntries.reduce((result, [thai, english]) => result.replaceAll(thai, english), value);
}

function updateDomLanguage(language: Language) {
  const root = document.body;
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode() as Text | null;
  while (current) {
    const saved = originalText.get(current);
    if (language === "th") {
      if (saved !== undefined && current.nodeValue !== saved) current.nodeValue = saved;
    } else {
      const visible = current.nodeValue ?? "";
      const source = saved !== undefined && visible === translateAll(saved) ? saved : visible;
      originalText.set(current, source);
      const translated = translateAll(source);
      if (current.nodeValue !== translated) current.nodeValue = translated;
    }
    current = walker.nextNode() as Text | null;
  }
  root.querySelectorAll("*").forEach((element) => {
    let saved = originalAttributes.get(element);
    if (!saved) { saved = new Map(); originalAttributes.set(element, saved); }
    translatedAttributes.forEach((attribute) => {
      const visible = element.getAttribute(attribute);
      if (visible === null) return;
      const source = saved!.get(attribute);
      if (language === "th") {
        if (source !== undefined && visible !== source) element.setAttribute(attribute, source);
      } else {
        const original = source !== undefined && visible === translateAll(source) ? source : visible;
        saved!.set(attribute, original);
        const translated = translateAll(original);
        if (visible !== translated) element.setAttribute(attribute, translated);
      }
    });
  });
}

interface LanguageValue { language: Language; setLanguage: (language: Language) => void; t: (thai: string, english?: string) => string }
const LanguageContext = createContext<LanguageValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => window.localStorage.getItem("app-language") === "en" ? "en" : "th");
  useEffect(() => {
    window.localStorage.setItem("app-language", language);
    document.documentElement.lang = language;
    let applying = false;
    const apply = () => { if (applying) return; applying = true; updateDomLanguage(language); applying = false; };
    apply();
    const observer = new MutationObserver(() => queueMicrotask(apply));
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: translatedAttributes });
    return () => observer.disconnect();
  }, [language]);
  const value = useMemo(() => ({ language, setLanguage, t: (thai: string, english?: string) => language === "th" ? thai : english ?? translations[thai] ?? thai }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used within LanguageProvider");
  return value;
}
