import { Router } from "express";
import { prisma } from "../prisma.js";

export const categoriesRouter = Router();

// GET /api/categories  (พร้อมจำนวนสินค้าต่อหมวด)
categoriesRouter.get("/", async (_req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: { where: { isTopping: false } } } } },
  });
  res.json(
    categories.map((c) => ({
      id: c.id,
      key: c.key,
      label: c.label,
      colorText: c.colorText,
      colorBg: c.colorBg,
      colorBorder: c.colorBorder,
      productCount: c._count.products,
    })),
  );
});

// POST /api/categories  { key, label }
categoriesRouter.post("/", async (req, res) => {
  const { key, label } = req.body ?? {};
  if (!key || !label) return res.status(400).json({ error: "key และ label จำเป็นต้องมี" });

  const category = await prisma.category.create({
    data: { key, label },
  });
  res.status(201).json(category);
});

// DELETE /api/categories/:id
categoriesRouter.delete("/:id", async (req, res) => {
  await prisma.category.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
