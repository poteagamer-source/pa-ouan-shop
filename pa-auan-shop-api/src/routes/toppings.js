import { Router } from "express";
import { query } from "../db.js";

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

export default router;
