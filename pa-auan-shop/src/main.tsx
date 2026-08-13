import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { StaffAuthProvider } from "./context/StaffAuthContext";
import { LanguageProvider } from "./context/LanguageContext";

// จุดเริ่มต้น React: Language ครอบทั้งแอป และ StaffAuth ครอบ routes ที่ต้องอ่าน session
// StrictMode ช่วยตรวจ side effect ซ้ำใน development แต่ production render ตามปกติ
createRoot(document.getElementById("root")!).render(
  <StrictMode><LanguageProvider><StaffAuthProvider><App /></StaffAuthProvider></LanguageProvider></StrictMode>,
);
