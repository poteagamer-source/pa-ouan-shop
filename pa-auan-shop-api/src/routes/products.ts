import { Router } from "express";
import { prisma } from "../prisma.js";

export const productsRouter = Router();

// GET /api/products?categoryKey=bualoy&isTopping=false
productsRouter.get("/", async (req, res) => {
  const { categoryKey, isTopping } = req.query;

  const products = await prisma.product.findMany({
    where: {
      isTopping: isTopping === undefined ? undefined : isTopping === "true",
      category: categoryKey ? { key: String(categoryKey) } : undefined,
    },
    include: { category: true },
    orderBy: { createdAt: "asc" },
  });

  res.json(
    products.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      image: p.image,
      active: p.active,
      isTopping: p.isTopping,
      bestseller: p.bestseller,
      recommended: p.recommended,
      stockQty: p.stockQty,
      stockUnit: p.stockUnit,
      categoryKey: p.category.key,
      categoryLabel: p.category.label,
    })),
  );
});

// POST /api/products
productsRouter.post("/", async (req, res) => {
  const { name, price, image, categoryId, isTopping, stockQty, stockUnit } = req.body ?? {};
  if (!name || price === undefined || !categoryId) {
    return res.status(400).json({ error: "name, price, categoryId จำเป็นต้องมี" });
  }

  const product = await prisma.product.create({
    data: {
      name,
      price,
      image: image ?? "/images/food-bualoy.png",
      categoryId,
      isTopping: !!isTopping,
      stockQty: stockQty ?? null,
      stockUnit: stockUnit ?? "ชิ้น",
    },
  });
  res.status(201).json(product);
});

// PATCH /api/products/:id  (แก้ไขราคา / เปิด-ปิดขาย / สต๊อกคงเหลือ)
productsRouter.patch("/:id", async (req, res) => {
  const { name, price, active, stockQty } = req.body ?? {};
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: { name, price, active, stockQty },
  });
  res.json(product);
});

// DELETE /api/products/:id
productsRouter.delete("/:id", async (req, res) => {
  await prisma.product.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
