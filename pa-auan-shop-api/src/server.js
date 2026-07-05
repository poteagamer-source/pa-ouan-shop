import "dotenv/config";
import express from "express";
import cors from "cors";

import categoriesRouter from "./routes/categories.js";
import productsRouter from "./routes/products.js";
import toppingsRouter from "./routes/toppings.js";
import stockRouter from "./routes/stock.js";
import ordersRouter from "./routes/orders.js";
import salesRouter from "./routes/sales.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? "*",
  })
);
app.use(express.json({ limit: "5mb" })); // limit ใหญ่หน่อยเผื่อแนบรูปสลิปเป็น base64

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/categories", categoriesRouter);
app.use("/api/products", productsRouter);
app.use("/api/toppings", toppingsRouter);
app.use("/api/stock", stockRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/sales", salesRouter);

// 404
app.use((req, res) => {
  res.status(404).json({ error: `ไม่พบเส้นทาง ${req.method} ${req.path}` });
});

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
