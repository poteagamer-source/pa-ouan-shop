import { Router } from "express";
import { pool, query } from "../db.js";
import { decimalToMinor, minorToNumber, serializeMinor, shopCurrency } from "../payments/money.js";
import { publishUpdate } from "../realtime.js";

const router = Router();
const PAYMENT_STATUSES = ["pending", "processing", "succeeded", "failed", "cancelled", "partially_refunded", "refunded"];
const FULFILLMENT_STATUSES = ["not_started", "queued", "cooking", "ready", "served", "cancelled"];
const STAFF_TRANSITIONS = { queued: "cooking", cooking: "ready", ready: "served" };

async function fetchOrders(whereSql = "", params = []) {
  const { rows } = await query(
    `SELECT
        o.*,
        (
          SELECT json_build_object(
            'id', p.id,
            'orderId', p.order_id,
            'provider', p.provider,
            'providerPaymentId', p.provider_payment_id,
            'paymentMethod', p.payment_method,
            'status', p.status,
            'amountMinor', p.amount_minor,
            'refundedAmountMinor', p.refunded_amount_minor,
            'currency', p.currency,
            'checkoutUrl', p.checkout_url,
            'failureCode', p.failure_code,
            'failureMessage', p.failure_message
          )
          FROM payments p WHERE p.order_id = o.id
          ORDER BY p.created_at DESC LIMIT 1
        ) AS latest_payment,
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

  return rows.map((row) => ({
    id: row.id,
    table: row.table_name,
    date: row.order_date,
    time: row.order_time,
    paymentStatus: row.payment_status,
    fulfillmentStatus: row.fulfillment_status,
    currency: row.currency,
    currencyExponent: row.currency_exponent,
    amountMinor: serializeMinor(row.amount_minor),
    note: row.note,
    total: Number(row.total),
    paid: row.paid,
    paymentVerified: row.payment_verified,
    paymentProvider: row.payment_provider,
    paidAt: row.paid_at,
    stepStartedAt: row.step_started_at,
    servedAt: row.served_at,
    latestPayment: row.latest_payment,
    items: row.items,
  }));
}

router.get("/", async (req, res, next) => {
  try {
    const { paymentStatus, fulfillmentStatus, status, date, table } = req.query;
    const requestedPayment = paymentStatus ? String(paymentStatus).split(",").map((value) => value.trim()) : [];
    const requestedFulfillment = String(fulfillmentStatus ?? status ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    if (requestedPayment.some((value) => !PAYMENT_STATUSES.includes(value))) {
      return res.status(400).json({ error: "สถานะการชำระเงินไม่ถูกต้อง" });
    }
    if (requestedFulfillment.some((value) => !FULFILLMENT_STATUSES.includes(value))) {
      return res.status(400).json({ error: "สถานะการจัดเตรียมไม่ถูกต้อง" });
    }

    const conditions = [];
    const params = [];
    if (requestedPayment.length) {
      params.push(requestedPayment);
      conditions.push(`o.payment_status = ANY($${params.length}::text[])`);
    }
    if (requestedFulfillment.length) {
      params.push(requestedFulfillment);
      conditions.push(`o.fulfillment_status = ANY($${params.length}::text[])`);
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

router.get("/:id", async (req, res, next) => {
  try {
    const orders = await fetchOrders("WHERE o.id = $1", [req.params.id]);
    if (!orders[0]) return res.status(404).json({ error: "ไม่พบออเดอร์" });
    res.json(orders[0]);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  const client = await pool.connect();
  let inTransaction = false;
  try {
    const { id, table, note, items } = req.body;
    if (!table || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "ต้องระบุ table และ items อย่างน้อย 1 รายการ" });
    }

    const { currency, exponent } = shopCurrency();
    const orderId = id || `O${Date.now()}`;
    const canonicalItems = [];
    let totalMinor = 0n;

    for (const item of items) {
      const quantity = Number(item.quantity ?? 1);
      if (!item.productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        return res.status(400).json({ error: "ข้อมูลสินค้าและจำนวนไม่ถูกต้อง" });
      }

      const { rows: productRows } = await client.query(
        "SELECT id, name, price, image FROM products WHERE id = $1 AND active = true",
        [item.productId]
      );
      const product = productRows[0];
      if (!product) return res.status(400).json({ error: `ไม่พบสินค้าที่เปิดขาย: ${item.productId}` });

      const toppingIds = [...new Set((item.toppings ?? []).map((topping) => topping.id).filter(Boolean))];
      let toppings = [];
      if (toppingIds.length) {
        const { rows } = await client.query(
          "SELECT id, name, price FROM toppings WHERE id = ANY($1::text[])",
          [toppingIds]
        );
        if (rows.length !== toppingIds.length) {
          return res.status(400).json({ error: "มีท็อปปิ้งที่ไม่ถูกต้องหรือไม่มีอยู่ในระบบ" });
        }
        toppings = rows;
      }

      const baseMinor = decimalToMinor(product.price, exponent);
      const toppingMinor = toppings.reduce((sum, topping) => sum + decimalToMinor(topping.price, exponent), 0n);
      const lineMinor = (baseMinor + toppingMinor) * BigInt(quantity);
      totalMinor += lineMinor;
      canonicalItems.push({
        product,
        basePrice: minorToNumber(baseMinor, exponent),
        quantity,
        temperature: item.temperature ?? null,
        toppings,
        lineTotal: minorToNumber(lineMinor, exponent),
      });
    }

    await client.query("BEGIN");
    inTransaction = true;
    await client.query(
      `INSERT INTO orders
        (id, table_name, note, total, amount_minor, currency, currency_exponent,
         payment_status, fulfillment_status, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'pending','not_started','pending_payment')`,
      [orderId, table, note ?? null, minorToNumber(totalMinor, exponent), totalMinor.toString(), currency, exponent]
    );

    for (const item of canonicalItems) {
      const { rows: itemRows } = await client.query(
        `INSERT INTO order_items
          (order_id, product_id, product_name, product_image, base_price, quantity, temperature, line_total)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [orderId, item.product.id, item.product.name, item.product.image ?? null, item.basePrice, item.quantity, item.temperature, item.lineTotal]
      );
      for (const topping of item.toppings) {
        await client.query(
          `INSERT INTO order_item_toppings (order_item_id, topping_id, name, price) VALUES ($1,$2,$3,$4)`,
          [itemRows[0].id, topping.id, topping.name, topping.price]
        );
      }
    }

    await client.query("COMMIT");
    inTransaction = false;
    const orders = await fetchOrders("WHERE o.id = $1", [orderId]);
    publishUpdate("orders", "created", orderId);
    res.status(201).json(orders[0]);
  } catch (err) {
    if (inTransaction) await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
});

router.patch("/:id/status", async (req, res, next) => {
  try {
    const fulfillmentStatus = req.body?.fulfillmentStatus ?? req.body?.status;
    if (!FULFILLMENT_STATUSES.includes(fulfillmentStatus)) {
      return res.status(400).json({ error: "สถานะการจัดเตรียมไม่ถูกต้อง" });
    }
    const { rows } = await query(
      `UPDATE orders
       SET fulfillment_status = $2, status = $2, step_started_at = now(),
           served_at = CASE WHEN $2 = 'served' THEN current_time ELSE served_at END
       WHERE id = $1
         AND payment_status = 'succeeded'
         AND fulfillment_status = $3
       RETURNING id`,
      [req.params.id, fulfillmentStatus, Object.keys(STAFF_TRANSITIONS).find((key) => STAFF_TRANSITIONS[key] === fulfillmentStatus) ?? ""]
    );
    if (!rows[0]) {
      const { rows: currentRows } = await query(
        "SELECT payment_status, fulfillment_status FROM orders WHERE id = $1",
        [req.params.id]
      );
      if (!currentRows[0]) return res.status(404).json({ error: "ไม่พบออเดอร์" });
      return res.status(409).json({
        error: `เปลี่ยนจาก ${currentRows[0].fulfillment_status} เป็น ${fulfillmentStatus} ไม่ได้ หรือยังไม่ได้ชำระเงิน`,
      });
    }

    const orders = await fetchOrders("WHERE o.id = $1", [req.params.id]);
    publishUpdate("orders", "updated", req.params.id);
    res.json(orders[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
