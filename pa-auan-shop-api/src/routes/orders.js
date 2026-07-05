import { Router } from "express";
import { pool, query } from "../db.js";

const router = Router();

const ORDER_STATUSES = ["pending", "cooking", "ready", "served", "paid"];

/** ดึงออเดอร์แบบเต็ม (รวม items + toppings) ตามเงื่อนไข where ที่ส่งมา */
async function fetchOrders(whereSql = "", params = []) {
  const { rows } = await query(
    `SELECT
        o.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'productId', oi.product_id,
              'name', oi.product_name,
              'image', oi.product_image,
              'basePrice', oi.base_price,
              'qty', oi.quantity,
              'temperature', oi.temperature,
              'price', oi.line_total,
              'toppings', COALESCE(oit.toppings, '[]'::json)
            )
          ) FILTER (WHERE oi.id IS NOT NULL), '[]'
        ) AS items
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     LEFT JOIN LATERAL (
        SELECT json_agg(json_build_object('id', t.topping_id, 'name', t.name, 'price', t.price)) AS toppings
        FROM order_item_toppings t
        WHERE t.order_item_id = oi.id
     ) oit ON true
     ${whereSql}
     GROUP BY o.id
     ORDER BY o.created_at DESC`,
    params
  );

  return rows.map((r) => ({
    id: r.id,
    table: r.table_name,
    date: r.order_date,
    time: r.order_time,
    status: r.status,
    note: r.note,
    total: Number(r.total),
    paid: r.paid,
    paymentVerified: r.payment_verified,
    slipImage: r.slip_image,
    servedAt: r.served_at,
    items: r.items,
  }));
}

// GET /api/orders?status=pending,cooking&date=2026-05-15&table=A01
router.get("/", async (req, res, next) => {
  try {
    const { status, date, table } = req.query;
    const conditions = [];
    const params = [];

    if (status) {
      const statuses = String(status).split(",").map((s) => s.trim());
      params.push(statuses);
      conditions.push(`o.status = ANY($${params.length}::text[])`);
    }
    if (date) {
      params.push(date);
      conditions.push(`o.order_date = $${params.length}`);
    }
    if (table) {
      params.push(table);
      conditions.push(`o.table_name = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    res.json(await fetchOrders(where, params));
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:id
router.get("/:id", async (req, res, next) => {
  try {
    const orders = await fetchOrders("WHERE o.id = $1", [req.params.id]);
    if (!orders[0]) return res.status(404).json({ error: "ไม่พบออเดอร์" });
    res.json(orders[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/orders  — สร้างออเดอร์ใหม่จากตะกร้าลูกค้า
// body: { id?, table, note, items: [{ productId, productName, productImage, basePrice, quantity, temperature, toppings:[{id,name,price}] }] }
router.post("/", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { id, table, note, items } = req.body;
    if (!table || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "ต้องระบุ table และ items อย่างน้อย 1 รายการ" });
    }

    const orderId = id || `O${Date.now()}`;
    let total = 0;
    for (const it of items) {
      const toppingSum = (it.toppings ?? []).reduce((s, t) => s + Number(t.price), 0);
      total += (Number(it.basePrice) + toppingSum) * Number(it.quantity ?? 1);
    }

    await client.query("BEGIN");

    await client.query(
      `INSERT INTO orders (id, table_name, note, total, status)
       VALUES ($1,$2,$3,$4,'pending')`,
      [orderId, table, note ?? null, total]
    );

    for (const it of items) {
      const toppingSum = (it.toppings ?? []).reduce((s, t) => s + Number(t.price), 0);
      const qty = Number(it.quantity ?? 1);
      const lineTotal = (Number(it.basePrice) + toppingSum) * qty;

      const { rows: itemRows } = await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_image, base_price, quantity, temperature, line_total)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [orderId, it.productId, it.productName, it.productImage ?? null, it.basePrice, qty, it.temperature ?? null, lineTotal]
      );
      const orderItemId = itemRows[0].id;

      for (const t of it.toppings ?? []) {
        await client.query(
          `INSERT INTO order_item_toppings (order_item_id, topping_id, name, price) VALUES ($1,$2,$3,$4)`,
          [orderItemId, t.id, t.name, t.price]
        );
      }

      // ตัดสต๊อกอัตโนมัติเมื่อมีออเดอร์เข้ามา (ถ้าสินค้านั้นมีแถวสต๊อก)
      await client.query(
        `UPDATE stock SET stock_qty = GREATEST(stock_qty - $2, 0), updated_at = now() WHERE product_id = $1`,
        [it.productId, qty]
      );
    }

    await client.query("COMMIT");

    const orders = await fetchOrders("WHERE o.id = $1", [orderId]);
    res.status(201).json(orders[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
});

// PATCH /api/orders/:id/status  { status: 'pending'|'cooking'|'ready'|'served'|'paid' }
// ใช้จากบอร์ดครัว (ใหม่→กำลังทำ→พร้อมเสิร์ฟ) และพนักงานเสิร์ฟ (พร้อมเสิร์ฟ→เสิร์ฟแล้ว)
router.patch("/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status ต้องเป็นหนึ่งใน ${ORDER_STATUSES.join(", ")}` });
    }

    const setServedAt = status === "served" ? ", served_at = to_char(now(), 'HH24:MI')" : "";
    const setPaid = status === "paid" ? ", paid = true" : "";

    const { rows } = await query(
      `UPDATE orders SET status = $2${setServedAt}${setPaid} WHERE id = $1 RETURNING *`,
      [req.params.id, status]
    );
    if (!rows[0]) return res.status(404).json({ error: "ไม่พบออเดอร์" });

    const orders = await fetchOrders("WHERE o.id = $1", [req.params.id]);
    res.json(orders[0]);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/orders/:id/slip  { slipImage }  — ลูกค้าแนบสลิปหลังโอนเงิน (หน้า Payment)
router.patch("/:id/slip", async (req, res, next) => {
  try {
    const { slipImage } = req.body;
    if (!slipImage) return res.status(400).json({ error: "ต้องระบุ slipImage" });
    const { rows } = await query(
      `UPDATE orders SET slip_image = $2 WHERE id = $1 RETURNING *`,
      [req.params.id, slipImage]
    );
    if (!rows[0]) return res.status(404).json({ error: "ไม่พบออเดอร์" });
    const orders = await fetchOrders("WHERE o.id = $1", [req.params.id]);
    res.json(orders[0]);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/orders/:id/verify-payment  — พนักงานตรวจสลิปแล้วยืนยันว่าจ่ายจริง
router.patch("/:id/verify-payment", async (req, res, next) => {
  try {
    const { rows } = await query(
      `UPDATE orders SET payment_verified = true, paid = true WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "ไม่พบออเดอร์" });
    const orders = await fetchOrders("WHERE o.id = $1", [req.params.id]);
    res.json(orders[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
