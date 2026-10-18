/** CRUD สินค้าเมนู พร้อมกรองหมวด/สถานะและรักษา snapshot ในออเดอร์เก่าเมื่อลบ */
import { Router } from "express";
import { pool, query } from "../db.js";
import { publishUpdate } from "../realtime.js";
import { requireRole } from "../auth.js";
import { cleanProductName, assertProductNameAvailable } from "../product-name.js";

const router = Router();
// Rank the full catalog before category/stock filters: at most two products are new.
const NEW_PRODUCT = "products.id IN (SELECT id FROM products ORDER BY created_at DESC, id DESC LIMIT 2)";

const mapProduct = (r) => ({
  id: r.id,
  name: r.name,
  price: Number(r.price),
  category: r.category_id,
  image: r.image,
  bestseller: r.bestseller,
  recommended: r.recommended,
  active: r.active,
  createdAt: r.created_at,
  isNew: Boolean(r.is_new),
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
      if (active === "true") conditions.push("EXISTS (SELECT 1 FROM stock s WHERE s.product_id = products.id AND s.stock_qty > 0)");
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const { rows } = await query(
      `SELECT *, ${NEW_PRODUCT} AS is_new FROM products ${where} ORDER BY category_id, id`,
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
    const { rows } = await query(`SELECT *, ${NEW_PRODUCT} AS is_new FROM products WHERE id = $1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: "ไม่พบสินค้า" });
    res.json(mapProduct(rows[0]));
  } catch (err) {
    next(err);
  }
});

// POST /api/products  (สร้างเมนูใหม่ — ใช้จากหน้าจัดการเมนู)
router.post("/", requireRole("manager"), async (req, res, next) => {
  let client;
  try {
    const { id, name, price, category, image, bestseller = false, recommended = false } = req.body;
    if (!name || price === undefined || !category) {
      return res.status(400).json({ error: "ต้องระบุ name, price, category" });
    }
    const productId = id || `P${Date.now()}`;
    const productName = cleanProductName(name);
    client = await pool.connect();
    await client.query("BEGIN");
    //ตรวจชื่อซ้ำ//
    await assertProductNameAvailable(client, productName);
    const { rows } = await client.query(
      `INSERT INTO products (id, name, price, category_id, image, bestseller, recommended)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [productId, productName, price, category, image ?? null, bestseller, recommended]
    );
    // สร้างแถวสต๊อกเริ่มต้นให้ด้วย
    await client.query(
      `INSERT INTO stock (product_id, stock_qty, unit) VALUES ($1, 0, 'ถ้วย')
       ON CONFLICT (product_id) DO NOTHING`,
      [productId]
    );
    const latest = await client.query(`SELECT *, ${NEW_PRODUCT} AS is_new FROM products WHERE id = $1`, [rows[0].id]);
    await client.query("COMMIT");
    publishUpdate("products", "created", productId);
    res.status(201).json(mapProduct(latest.rows[0]));
  } catch (err) {
    if (client) await client.query("ROLLBACK");
    if (err.status === 400 || err.status === 409) return res.status(err.status).json({ error: err.message });
    if (err.code === "23505") return res.status(409).json({ error: "มีรหัสสินค้านี้อยู่แล้ว" });
    next(err);
  } finally { client?.release(); }
});

// PUT /api/products/:id
router.put("/:id", requireRole("manager"), async (req, res, next) => {
  let client;
  try {
    const { name, price, category, image, bestseller, recommended, active } = req.body;
    const productName = name === undefined ? undefined : cleanProductName(name);
    client = await pool.connect();
    await client.query("BEGIN");
    if (productName !== undefined) await assertProductNameAvailable(client, productName, req.params.id);
    const { rows } = await client.query(
      `UPDATE products SET
         name = COALESCE($2, name),
         price = COALESCE($3, price),
         category_id = COALESCE($4, category_id),
         image = COALESCE($5, image),
         bestseller = COALESCE($6, bestseller),
         recommended = COALESCE($7, recommended),
         active = COALESCE($8, active)
       WHERE id = $1 RETURNING *, ${NEW_PRODUCT} AS is_new`,
      [req.params.id, productName, price, category, image, bestseller, recommended, active]
    );
    if (!rows[0]) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "ไม่พบสินค้า" });
    }
    await client.query("COMMIT");
    publishUpdate("products", "updated", req.params.id);
    res.json(mapProduct(rows[0]));
  } catch (err) {
    if (client) await client.query("ROLLBACK");
    if (err.status === 400 || err.status === 409) return res.status(err.status).json({ error: err.message });
    next(err);
  } finally { client?.release(); }
});

// DELETE /api/products/:id
router.delete("/:id", requireRole("manager"), async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Keep historical order snapshots while allowing the menu product to be removed.
    await client.query("UPDATE order_items SET product_id = NULL WHERE product_id = $1", [req.params.id]);
    const { rowCount } = await client.query("DELETE FROM products WHERE id = $1", [req.params.id]);
    if (!rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "ไม่พบสินค้า" });
    }
    await client.query("COMMIT");
    publishUpdate("products", "deleted", req.params.id);
    res.status(204).end();
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
});

export default router;
