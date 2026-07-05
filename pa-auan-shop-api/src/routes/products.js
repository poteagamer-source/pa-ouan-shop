import { Router } from "express";
import { query } from "../db.js";

const router = Router();

const mapProduct = (r) => ({
  id: r.id,
  name: r.name,
  price: Number(r.price),
  category: r.category_id,
  image: r.image,
  bestseller: r.bestseller,
  recommended: r.recommended,
  active: r.active,
});

// GET /api/products?category=bualoy&active=true
router.get("/", async (req, res, next) => {
  try {
    const { category, active } = req.query;
    const conditions = [];
    const params = [];

    if (category) {
      params.push(category);
      conditions.push(`category_id = $${params.length}`);
    }
    if (active !== undefined) {
      params.push(active === "true");
      conditions.push(`active = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const { rows } = await query(
      `SELECT * FROM products ${where} ORDER BY category_id, id`,
      params
    );
    res.json(rows.map(mapProduct));
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id
router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await query("SELECT * FROM products WHERE id = $1", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: "ไม่พบสินค้า" });
    res.json(mapProduct(rows[0]));
  } catch (err) {
    next(err);
  }
});

// POST /api/products  (สร้างเมนูใหม่ — ใช้จากหน้าจัดการเมนู)
router.post("/", async (req, res, next) => {
  try {
    const { id, name, price, category, image, bestseller = false, recommended = false } = req.body;
    if (!id || !name || price === undefined || !category) {
      return res.status(400).json({ error: "ต้องระบุ id, name, price, category" });
    }
    const { rows } = await query(
      `INSERT INTO products (id, name, price, category_id, image, bestseller, recommended)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [id, name, price, category, image ?? null, bestseller, recommended]
    );
    // สร้างแถวสต๊อกเริ่มต้นให้ด้วย
    await query(
      `INSERT INTO stock (product_id, stock_qty, unit) VALUES ($1, 0, 'ก้อน')
       ON CONFLICT (product_id) DO NOTHING`,
      [id]
    );
    res.status(201).json(mapProduct(rows[0]));
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "มีรหัสสินค้านี้อยู่แล้ว" });
    next(err);
  }
});

// PUT /api/products/:id
router.put("/:id", async (req, res, next) => {
  try {
    const { name, price, category, image, bestseller, recommended, active } = req.body;
    const { rows } = await query(
      `UPDATE products SET
         name = COALESCE($2, name),
         price = COALESCE($3, price),
         category_id = COALESCE($4, category_id),
         image = COALESCE($5, image),
         bestseller = COALESCE($6, bestseller),
         recommended = COALESCE($7, recommended),
         active = COALESCE($8, active)
       WHERE id = $1 RETURNING *`,
      [req.params.id, name, price, category, image, bestseller, recommended, active]
    );
    if (!rows[0]) return res.status(404).json({ error: "ไม่พบสินค้า" });
    res.json(mapProduct(rows[0]));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/products/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const { rowCount } = await query("DELETE FROM products WHERE id = $1", [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: "ไม่พบสินค้า" });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
