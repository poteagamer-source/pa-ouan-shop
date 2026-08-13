/** จุดเริ่ม Express API: middleware, routes, static frontend, error handler และ HTTP server */
import "dotenv/config";
import express from "express";
import cors from "cors";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import categoriesRouter from "./routes/categories.js";
import productsRouter from "./routes/products.js";
import toppingsRouter from "./routes/toppings.js";
import stockRouter from "./routes/stock.js";
import ordersRouter from "./routes/orders.js";
import salesRouter from "./routes/sales.js";
import paymentsRouter from "./routes/payments.js";
import webhooksRouter from "./routes/webhooks.js";
import authRouter from "./routes/auth.js";
import staffUsersRouter from "./routes/staff-users.js";
import { realtimeRouter } from "./realtime.js";
import { optionalAuth, requireRole } from "./auth.js";

// ตั้งค่าแอปและตำแหน่งไฟล์ frontend ที่ build แล้ว
const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendDist = join(__dirname, "..", "..", "pa-auan-shop", "dist");

// Middleware ส่วนกลาง: CORS, session ผู้ใช้ และ JSON body
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? true,
    credentials: true,
  })
);
app.use(optionalAuth);
app.use(
  express.json({
    limit: "1mb",
    verify: (req, _res, buffer) => {
      req.rawBody = buffer;
    },
  })
);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Route สาธารณะและการจัดการบัญชีพนักงาน
app.use("/api/auth", authRouter);
app.use("/api/staff-users", staffUsersRouter);

// Route หลักของระบบร้านค้า (บาง route จำกัดสิทธิ์ตาม role)
app.use("/api/categories", categoriesRouter);
app.use("/api/products", productsRouter);
app.use("/api/toppings", toppingsRouter);
app.use("/api/stock", requireRole("manager"), stockRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/orders", paymentsRouter);
app.use("/api/sales", requireRole("manager"), salesRouter);
app.use("/api/webhooks", webhooksRouter);
app.use("/api/events", requireRole("manager", "kitchen", "waiter"), realtimeRouter);

// Production: serve the Vite frontend from the same Render Web Service.
if (existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get("*", (_req, res) => res.sendFile(join(frontendDist, "index.html")));
} else {
  app.use((req, res) => {
    res.status(404).json({ error: `ไม่พบเส้นทาง ${req.method} ${req.path}` });
  });
}

// error handler กลาง
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "เกิดข้อผิดพลาดฝั่งเซิร์ฟเวอร์", detail: err.message });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`🚀 pa-auan-shop-api พร้อมใช้งานที่ http://localhost:${port}`);
});
