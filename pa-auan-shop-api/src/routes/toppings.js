import { Router } from "express";
import { pool, query } from "../db.js";
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

// POST /api/toppings — เพิ่มท็อปปิ้งและสร้างแถวสต๊อกเริ่มต้นพร้อมกัน
router.post("/", requireRole("manager"), async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { id, name, price, image, tier, stockQty = 0, unit = "หน่วย" } = req.body;
    if (!name?.trim() || !Number.isFinite(Number(price)) || Number(price) < 0 || ![5, 10].includes(Number(tier))) {
      return res.status(400).json({ error: "กรุณาระบุชื่อ ราคา และกลุ่มราคา 5 หรือ 10 บาทให้ถูกต้อง" });
    }
    if (!Number.isInteger(Number(stockQty)) || Number(stockQty) < 0) {
      return res.status(400).json({ error: "จำนวนสต๊อกไม่ถูกต้อง" });
    }
    const toppingId = id || `T${Date.now()}`;
    await client.query("BEGIN");
    const { rows } = await client.query(
      `INSERT INTO toppings (id,name,price,image,tier) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [toppingId, name.trim(), Number(price), image?.trim() || null, Number(tier)]
    );
    await client.query(
      `INSERT INTO topping_stock (topping_id,stock_qty,unit,active) VALUES ($1,$2,$3,true)`,
      [toppingId, Number(stockQty), String(unit).trim() || "หน่วย"]
    );
    await client.query("COMMIT");
    publishUpdate("toppings", "created", toppingId);
    publishUpdate("stock", "created", toppingId);
    res.status(201).json(mapTopping(rows[0]));
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23505") return res.status(409).json({ error: "มีรหัสท็อปปิ้งนี้อยู่แล้ว" });
    next(err);
  } finally { client.release(); }
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

// DELETE /api/toppings/:id — ประวัติออเดอร์ยังเก็บชื่อและราคาเดิมไว้เป็น snapshot
router.delete("/:id", requireRole("manager"), async (req, res, next) => {
  try {
    const { rowCount } = await query("DELETE FROM toppings WHERE id=$1", [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: "ไม่พบท็อปปิ้ง" });
    publishUpdate("toppings", "deleted", req.params.id);
    publishUpdate("stock", "deleted", req.params.id);
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
