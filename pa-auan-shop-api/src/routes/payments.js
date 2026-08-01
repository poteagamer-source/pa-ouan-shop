import { randomUUID } from "node:crypto";
import { Router } from "express";
import { query } from "../db.js";
import { createProviderPayment } from "../payments/providers.js";
import { serializeMinor } from "../payments/money.js";

const router = Router();

function mapPayment(row) {
  return {
    id: row.id,
    orderId: row.order_id,
    provider: row.provider,
    providerPaymentId: row.provider_payment_id,
    paymentMethod: row.payment_method,
    status: row.status,
    amountMinor: serializeMinor(row.amount_minor),
    refundedAmountMinor: serializeMinor(row.refunded_amount_minor),
    currency: row.currency,
    checkoutUrl: row.checkout_url,
    failureCode: row.failure_code,
    failureMessage: row.failure_message,
    createdAt: row.created_at,
    paidAt: row.paid_at,
  };
}

router.get("/:orderId/payments", async (req, res, next) => {
  try {
    const { rows } = await query(
      "SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC",
      [req.params.orderId]
    );
    res.json(rows.map(mapPayment));
  } catch (err) {
    next(err);
  }
});

router.post("/:orderId/payments", async (req, res, next) => {
  let paymentId;
  try {
    const provider = String(req.body?.provider ?? "stripe").toLowerCase();
    const paymentMethod = String(req.body?.paymentMethod ?? "card").toLowerCase();
    const suppliedKey = req.get("idempotency-key");
    const idempotencyKey = suppliedKey && /^[\w:.-]{8,128}$/.test(suppliedKey) ? suppliedKey : randomUUID();

    const { rows: orderRows } = await query(
      `SELECT id, table_name, amount_minor, currency, payment_status
       FROM orders WHERE id = $1`,
      [req.params.orderId]
    );
    const order = orderRows[0];
    if (!order) return res.status(404).json({ error: "ไม่พบออเดอร์" });
    if (["succeeded", "partially_refunded", "refunded"].includes(order.payment_status)) {
      return res.status(409).json({ error: "ออเดอร์นี้ชำระเงินแล้ว" });
    }

    const { rows: existingRows } = await query(
      "SELECT * FROM payments WHERE provider = $1 AND idempotency_key = $2",
      [provider, idempotencyKey]
    );
    let payment = existingRows[0];
    if (payment && payment.order_id !== order.id) {
      return res.status(409).json({ error: "Idempotency-Key ถูกใช้กับออเดอร์อื่นแล้ว" });
    }

    if (!payment) {
      paymentId = `pay_${randomUUID().replace(/-/g, "")}`;
      const { rows } = await query(
        `INSERT INTO payments
          (id, order_id, provider, payment_method, amount_minor, currency, idempotency_key)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING *`,
        [paymentId, order.id, provider, paymentMethod, order.amount_minor, order.currency, idempotencyKey]
      );
      payment = rows[0];
    } else {
      paymentId = payment.id;
      if (payment.checkout_url) return res.json(mapPayment(payment));
    }

    const providerResult = await createProviderPayment({
      req,
      payment,
      order,
      paymentMethod,
      returnPath: req.body?.returnPath,
    });
    const { rows: updatedRows } = await query(
      `UPDATE payments
       SET provider_payment_id = $2, status = $3, checkout_url = $4,
           failure_code = NULL, failure_message = NULL, updated_at = now()
       WHERE id = $1 RETURNING *`,
      [payment.id, providerResult.providerPaymentId, providerResult.status, providerResult.checkoutUrl]
    );
    res.status(existingRows[0] ? 200 : 201).json(mapPayment(updatedRows[0]));
  } catch (err) {
    if (paymentId) {
      await query(
        `UPDATE payments SET status = 'failed', failure_code = $2, failure_message = $3, updated_at = now()
         WHERE id = $1`,
        [paymentId, err.code ?? null, err.message]
      ).catch(() => {});
    }
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

export default router;
