import { Router } from "express";
import { query } from "../db.js";
import { publishUpdate } from "../realtime.js";
import { requireRole } from "../auth.js";

const router = Router();

const mapTopping = (r) => ({
  id: r.id,
  name: r.name,
  price: Number(r.price),
  image: r.image,
  tier: r.tier,
});

// GET /api/toppings?tier=5   (ไม่ใส่ query = เอาทั้งหมด)
router.get("/", async (req, res, next) => {
  try {
    const { tier } = req.query;
    const { rows } = tier
      ? await query(`SELECT t.* FROM toppings t JOIN topping_stock s ON s.topping_id=t.id
                     WHERE t.tier=$1 AND s.active=true AND s.stock_qty>0 ORDER BY t.id`, [Number(tier)])
      : await query("SELECT * FROM toppings ORDER BY tier, id");
    res.json(rows.map(mapTopping));
  } catch (err) {
    next(err);
  }
});

// PUT /api/toppings/:id — แก้ชื่อ ราคา รูป และระดับราคาจากหน้าผู้จัดการ
router.put("/:id", requireRole("manager"), async (req, res, next) => {
  try {
    const { name, price, image, tier } = req.body;
    if (price !== undefined && (!Number.isFinite(Number(price)) || Number(price) < 0)) {
      return res.status(400).json({ error: "ราคาท็อปปิ้งไม่ถูกต้อง" });
    }
    if (tier !== undefined && ![5, 10].includes(Number(tier))) {
      return res.status(400).json({ error: "ระดับราคาต้องเป็น 5 หรือ 10 บาท" });
    }
    const { rows } = await query(
      `UPDATE toppings SET name=COALESCE($2,name), price=COALESCE($3,price),
       image=COALESCE($4,image), tier=COALESCE($5,tier) WHERE id=$1 RETURNING *`,
      [req.params.id, name?.trim(), price, image?.trim(), tier]
    );
    if (!rows[0]) return res.status(404).json({ error: "ไม่พบท็อปปิ้ง" });
    publishUpdate("toppings", "updated", req.params.id);
    res.json(mapTopping(rows[0]));
  } catch (err) { next(err); }
});

export default router;
