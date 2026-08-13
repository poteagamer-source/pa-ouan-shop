/** API รายการขายและ summary; นับเฉพาะ payment status ที่ถือว่าได้รับเงินจริง */
import { Router } from "express";
import { query } from "../db.js";
import { shopCurrency } from "../payments/money.js";

const router = Router();
// รายงานยอดขายยึดเวลาที่รับเงินจริง และแปลงเป็นวัน/เวลาไทยก่อนกรอง
const SALE_TIMESTAMP = "COALESCE(o.paid_at, o.created_at)";
const SALE_DATE = `(${SALE_TIMESTAMP} AT TIME ZONE 'Asia/Bangkok')::date`;
const SALE_TIME = `(${SALE_TIMESTAMP} AT TIME ZONE 'Asia/Bangkok')::time`;

// GET /api/sales?from=2026-05-01&to=2026-05-31&table=A01
// ประวัติออเดอร์ที่จ่ายเงินแล้ว (paid = true) พร้อมรายการสินค้า
router.get("/", async (req, res, next) => {
  try {
    const { from, to, table } = req.query;
    const currency = String(req.query.currency ?? shopCurrency().currency).toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) return res.status(400).json({ error: "currency ไม่ถูกต้อง" });
    const params = [currency];
    const conditions = ["o.payment_status IN ('succeeded','partially_refunded')", "o.currency = $1"];

    if (from) {
      params.push(from);
      conditions.push(`${SALE_DATE} >= $${params.length}::date`);
    }
    if (to) {
      params.push(to);
      conditions.push(`${SALE_DATE} <= $${params.length}::date`);
    }
    if (table) {
      params.push(table);
      conditions.push(`o.table_name = $${params.length}`);
    }

    const { rows } = await query(
      `SELECT
          o.id, o.table_name, o.total, o.amount_minor, o.currency,
          ${SALE_DATE} AS sale_date, ${SALE_TIME} AS sale_time,
          o.payment_verified, o.slip_image,
          COALESCE(
            json_agg(
              json_build_object('name', oi.product_name, 'qty', oi.quantity, 'price', oi.line_total, 'image', oi.product_image)
            ) FILTER (WHERE oi.id IS NOT NULL), '[]'
          ) AS items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE ${conditions.join(" AND ")}
       GROUP BY o.id
       ORDER BY ${SALE_TIMESTAMP} DESC`,
      params
    );

    res.json(
      rows.map((r) => ({
        id: r.id,
        table: r.table_name,
        total: Number(r.total),
        amountMinor: Number(r.amount_minor),
        currency: r.currency,
        date: r.sale_date,
        time: r.sale_time,
        paymentVerified: r.payment_verified,
        slipImage: r.slip_image,
        items: r.items,
      }))
    );
  } catch (err) {
    next(err);
  }
});

// GET /api/sales/summary?from=&to=
// สรุปยอดขายไว้ใช้กับกราฟ Dashboard ผู้จัดการ
router.get("/summary", async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const currency = String(req.query.currency ?? shopCurrency().currency).toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) return res.status(400).json({ error: "currency ไม่ถูกต้อง" });
    const params = [currency];
    const conditions = ["o.payment_status IN ('succeeded','partially_refunded')", "o.currency = $1"];

    if (from) {
      params.push(from);
      conditions.push(`${SALE_DATE} >= $${params.length}::date`);
    }
    if (to) {
      params.push(to);
      conditions.push(`${SALE_DATE} <= $${params.length}::date`);
    }
    const where = conditions.join(" AND ");

    const totals = await query(
      `SELECT COALESCE(SUM(total),0) AS revenue, COUNT(*) AS order_count
       FROM orders o WHERE ${where}`,
      params
    );

    const byDay = await query(
      `SELECT ${SALE_DATE} AS date, COALESCE(SUM(o.total),0) AS revenue, COUNT(*) AS order_count
       FROM orders o WHERE ${where}
       GROUP BY ${SALE_DATE} ORDER BY ${SALE_DATE}`,
      params
    );

    const byCategory = await query(
      `SELECT p.category_id AS category, COALESCE(SUM(oi.line_total),0) AS revenue, COALESCE(SUM(oi.quantity),0) AS qty
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE ${where}
       GROUP BY p.category_id ORDER BY revenue DESC`,
      params
    );

    const topProducts = await query(
      `SELECT oi.product_name AS name, COALESCE(SUM(oi.quantity),0) AS qty, COALESCE(SUM(oi.line_total),0) AS revenue
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       WHERE ${where}
       GROUP BY oi.product_name ORDER BY qty DESC LIMIT 10`,
      params
    );

    res.json({
      currency,
      revenue: Number(totals.rows[0].revenue),
      orderCount: Number(totals.rows[0].order_count),
      byDay: byDay.rows.map((r) => ({ date: r.date, revenue: Number(r.revenue), orderCount: Number(r.order_count) })),
      byCategory: byCategory.rows.map((r) => ({ category: r.category, revenue: Number(r.revenue), qty: Number(r.qty) })),
      topProducts: topProducts.rows.map((r) => ({ name: r.name, qty: Number(r.qty), revenue: Number(r.revenue) })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
