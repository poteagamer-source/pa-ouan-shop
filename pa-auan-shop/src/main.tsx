import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { StaffAuthProvider } from "./context/StaffAuthContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode><StaffAuthProvider><App /></StaffAuthProvider></StrictMode>,
);
