import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { StaffAuthProvider } from "./context/StaffAuthContext";
import { LanguageProvider } from "./context/LanguageContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode><LanguageProvider><StaffAuthProvider><App /></StaffAuthProvider></LanguageProvider></StrictMode>,
);
