import { Router } from "express";
import { prisma } from "../prisma.js";

export const ordersRouter = Router();

function genOrderCode() {
  const now = new Date();
  const y = now.getFullYear();
  const rand = Math.floor(Math.random() * 900 + 100);
  return `SD${y}${rand}`;
}

// GET /api/orders?status=PAID
ordersRouter.get("/", async (req, res) => {
  const { status } = req.query;
  const orders = await prisma.order.findMany({
    where: { status: status ? (String(status) as any) : undefined },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(orders);
});

// GET /api/orders/:id
ordersRouter.get("/:id", async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: true },
  });
  if (!order) return res.status(404).json({ error: "ไม่พบออเดอร์" });
  res.json(order);
});

// POST /api/orders  — สร้างออเดอร์จากตะกร้าสินค้าของลูกค้า
// body: { tableCode, items: [{ productId, productName, unitPrice, qty, temperature?, toppings? }] }
ordersRouter.post("/", async (req, res) => {
  const { tableCode, items } = req.body ?? {};
  if (!tableCode || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "tableCode และ items จำเป็นต้องมี" });
  }

  const totalAmount = items.reduce(
    (sum: number, it: any) =>
      sum + it.unitPrice * it.qty + (it.toppings ?? []).reduce((s: number, t: any) => s + t.price, 0) * it.qty,
    0,
  );

  const order = await prisma.order.create({
    data: {
      orderCode: genOrderCode(),
      tableCode,
      totalAmount,
      items: {
        create: items.map((it: any) => ({
          productId: it.productId ?? null,
          productName: it.productName,
          unitPrice: it.unitPrice,
          qty: it.qty,
          temperature: it.temperature ?? null,
          toppings: it.toppings ?? [],
        })),
      },
    },
    include: { items: true },
  });

  res.status(201).json(order);
});

// PATCH /api/orders/:id/status  { status: "COOKING" | "READY" | "SERVED" | "PAID" }
ordersRouter.patch("/:id/status", async (req, res) => {
  const { status } = req.body ?? {};
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { status },
  });
  res.json(order);
});

// PATCH /api/orders/:id/payment  { paymentVerified, slipImageUrl }
ordersRouter.patch("/:id/payment", async (req, res) => {
  const { paymentVerified, slipImageUrl } = req.body ?? {};
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { paymentVerified, slipImageUrl },
  });
  res.json(order);
});

// GET /api/orders/reports/sales?date=2026-06-04  — ใช้กับหน้ารายงานยอดขาย
ordersRouter.get("/reports/sales", async (req, res) => {
  const dateStr = req.query.date ? String(req.query.date) : new Date().toISOString().slice(0, 10);
  const start = new Date(`${dateStr}T00:00:00`);
  const end = new Date(`${dateStr}T23:59:59`);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: start, lte: end }, status: "PAID" },
    include: { items: true },
    orderBy: { createdAt: "asc" },
  });

  const totalSales = orders.reduce((s, o) => s + Number(o.totalAmount), 0);
  const totalOrders = orders.length;

  res.json({
    date: dateStr,
    totalSales,
    totalOrders,
    orders,
  });
});
