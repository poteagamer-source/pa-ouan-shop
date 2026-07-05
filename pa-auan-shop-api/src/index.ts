import express from "express";
import cors from "cors";
import "dotenv/config";
import { categoriesRouter } from "./routes/categories.js";
import { productsRouter } from "./routes/products.js";
import { ordersRouter } from "./routes/orders.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => res.send("API is running"));
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/categories", categoriesRouter);
app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});