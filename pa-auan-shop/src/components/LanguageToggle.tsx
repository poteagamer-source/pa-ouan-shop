/** ปุ่มสลับภาษาไทย/อังกฤษ; แก้รูปแบบปุ่มได้ที่นี่ ส่วนคำแปลอยู่ LanguageContext */
import { Languages } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage } = useLanguage();
  return <div className="inline-flex shrink-0 items-center rounded-full border border-gray-200 bg-white p-0.5 text-[10px] shadow-sm" aria-label="Language">
    {!compact && <Languages className="mx-1 h-3.5 w-3.5 text-gray-400" />}
    {(["th", "en"] as const).map((item) => <button key={item} type="button" onClick={() => setLanguage(item)} className={`rounded-full px-2 py-1 font-semibold ${language === item ? "bg-brand text-white" : "text-gray-500"}`}>{item === "th" ? "ไทย" : "EN"}</button>)}
  </div>;
}
