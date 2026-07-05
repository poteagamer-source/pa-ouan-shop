import { Router } from "express";
import { query } from "../db.js";

const router = Router();

const mapStock = (r) => ({
  id: r.id,
  name: r.name,
  price: Number(r.price),
  category: r.category_id,
  image: r.image,
  bestseller: r.bestseller,
  recommended: r.recommended,
  stockQty: r.stock_qty,
  unit: r.unit,
  active: r.active,
  status: r.stock_qty <= r.low_at ? "low" : "enough",
});

// GET /api/stock  — สต๊อกทุกสินค้า (ใช้ในหน้า StockPage)
router.get("/", async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT p.*, s.stock_qty, s.unit, s.low_at
       FROM products p
       JOIN stock s ON s.product_id = p.id
       ORDER BY p.category_id, p.id`
    );
    res.json(rows.map(mapStock));
  } catch (err) {
    next(err);
  }
});

// PUT /api/stock/:productId  { stockQty, unit, active }
router.put("/:productId", async (req, res, next) => {
  try {
    const { stockQty, unit, active } = req.body;

    if (stockQty !== undefined || unit !== undefined) {
      await query(
        `UPDATE stock SET
           stock_qty = COALESCE($2, stock_qty),
           unit = COALESCE($3, unit),
           updated_at = now()
         WHERE product_id = $1`,
        [req.params.productId, stockQty, unit]
      );
    }
    if (active !== undefined) {
      await query(`UPDATE products SET active = $2 WHERE id = $1`, [req.params.productId, active]);
    }

    const { rows } = await query(
      `SELECT p.*, s.stock_qty, s.unit, s.low_at
       FROM products p JOIN stock s ON s.product_id = p.id
       WHERE p.id = $1`,
      [req.params.productId]
    );
    if (!rows[0]) return res.status(404).json({ error: "ไม่พบสินค้า" });
    res.json(mapStock(rows[0]));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/stock/:productId/adjust  { delta: -1 | +1 | ... }  ลด/เพิ่มสต๊อกแบบรวดเร็ว
router.patch("/:productId/adjust", async (req, res, next) => {
  try {
    const delta = Number(req.body.delta ?? 0);
    const { rows } = await query(
      `UPDATE stock SET stock_qty = GREATEST(stock_qty + $2, 0), updated_at = now()
       WHERE product_id = $1 RETURNING *`,
      [req.params.productId, delta]
    );
    if (!rows[0]) return res.status(404).json({ error: "ไม่พบสินค้า" });
    res.json({ productId: rows[0].product_id, stockQty: rows[0].stock_qty });
  } catch (err) {
    next(err);
  }
});

export default router;
