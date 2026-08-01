import { randomUUID } from "node:crypto";
import { pool } from "../db.js";
import { publishUpdate } from "../realtime.js";

export async function processPaymentEvent(event) {
  if (!event?.orderId || !event?.eventId || !event?.type) {
    throw Object.assign(new Error("Webhook event does not contain an order reference"), { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: orderRows } = await client.query(
      `SELECT id, amount_minor, currency, payment_status, fulfillment_status
       FROM orders WHERE id = $1 FOR UPDATE`,
      [event.orderId]
    );
    const order = orderRows[0];
    if (!order) throw Object.assign(new Error("Order not found"), { status: 404 });

    const { rows: paymentRows } = await client.query(
      `SELECT * FROM payments
       WHERE order_id = $1 AND provider = $2
       ORDER BY CASE WHEN provider_payment_id = $3 THEN 0 ELSE 1 END, created_at DESC
       LIMIT 1 FOR UPDATE`,
      [event.orderId, event.provider, event.providerPaymentId ?? null]
    );
    let payment = paymentRows[0] ?? null;
    if (!payment) {
      const { rows } = await client.query(
        `INSERT INTO payments
          (id, order_id, provider, provider_payment_id, provider_transaction_id,
           status, amount_minor, currency, idempotency_key)
         VALUES ($1,$2,$3,$4,$5,'created',$6,$7,$8)
         RETURNING *`,
        [
          `pay_${randomUUID().replace(/-/g, "")}`,
          event.orderId,
          event.provider,
          event.providerPaymentId ?? null,
          event.transactionId ?? null,
          order.amount_minor,
          order.currency,
          `webhook:${event.eventId}`,
        ]
      );
      payment = rows[0];
    }

    const { rows: insertedEvents } = await client.query(
      `INSERT INTO payment_events
        (provider, event_id, payment_id, order_id, transaction_id, event_type, payload)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)
       ON CONFLICT (provider, event_id) DO NOTHING
       RETURNING event_id`,
      [
        event.provider,
        event.eventId,
        payment.id,
        event.orderId,
        event.transactionId ?? null,
        event.type,
        JSON.stringify(event.rawPayload),
      ]
    );
    if (!insertedEvents[0]) {
      await client.query("COMMIT");
      return { duplicate: true };
    }

    if (event.type === "PAYMENT_SUCCEEDED") {
      if (!Number.isSafeInteger(Number(event.amountMinor))) {
        throw Object.assign(new Error("Webhook amountMinor is invalid"), { status: 400 });
      }
      if (String(event.currency).toUpperCase() !== order.currency || BigInt(event.amountMinor) !== BigInt(order.amount_minor)) {
        throw Object.assign(new Error("Webhook amount or currency does not match the order"), { status: 409 });
      }

      if (payment) {
        await client.query(
          `UPDATE payments
           SET status = 'succeeded', provider_payment_id = COALESCE(provider_payment_id, $2),
               provider_transaction_id = COALESCE(provider_transaction_id, $3),
               paid_at = COALESCE(paid_at, now()), updated_at = now()
           WHERE id = $1`,
          [payment.id, event.providerPaymentId ?? null, event.transactionId ?? null]
        );
      }

      if (order.payment_status !== "succeeded") {
        await client.query(
          `UPDATE orders
           SET payment_status = 'succeeded',
               fulfillment_status = CASE WHEN fulfillment_status = 'not_started' THEN 'queued' ELSE fulfillment_status END,
               paid = true, payment_verified = true, payment_provider = $2,
               payment_transaction_id = $3, payment_currency = $4,
               paid_at = COALESCE(paid_at, now()), step_started_at = now()
           WHERE id = $1`,
          [event.orderId, event.provider, event.transactionId ?? event.providerPaymentId ?? null, order.currency]
        );
        await client.query(
          `UPDATE stock AS s
           SET stock_qty = GREATEST(s.stock_qty - quantities.qty, 0), updated_at = now()
           FROM (
             SELECT product_id, SUM(quantity)::int AS qty
             FROM order_items
             WHERE order_id = $1 AND product_id IS NOT NULL
             GROUP BY product_id
           ) AS quantities
           WHERE s.product_id = quantities.product_id`,
          [event.orderId]
        );
        await client.query(
          `UPDATE topping_stock AS s
           SET stock_qty = GREATEST(s.stock_qty - quantities.qty, 0), updated_at = now()
           FROM (
             SELECT oit.topping_id, SUM(oi.quantity)::int AS qty
             FROM order_item_toppings oit
             JOIN order_items oi ON oi.id = oit.order_item_id
             WHERE oi.order_id = $1 AND oit.topping_id IS NOT NULL
             GROUP BY oit.topping_id
           ) AS quantities
           WHERE s.topping_id = quantities.topping_id`,
          [event.orderId]
        );
      }
    } else if (event.type === "PAYMENT_PROCESSING") {
      if (payment) await client.query("UPDATE payments SET status = 'processing', updated_at = now() WHERE id = $1", [payment.id]);
      if (["pending", "failed"].includes(order.payment_status)) {
        await client.query("UPDATE orders SET payment_status = 'processing' WHERE id = $1", [event.orderId]);
      }
    } else if (event.type === "PAYMENT_FAILED") {
      if (payment) {
        await client.query(
          `UPDATE payments SET status = 'failed', failure_code = $2, failure_message = $3, updated_at = now()
           WHERE id = $1`,
          [payment.id, event.failureCode ?? null, event.failureMessage ?? null]
        );
      }
      if (["pending", "processing", "failed"].includes(order.payment_status)) {
        await client.query("UPDATE orders SET payment_status = 'failed' WHERE id = $1", [event.orderId]);
      }
    } else if (["PAYMENT_PARTIALLY_REFUNDED", "PAYMENT_REFUNDED"].includes(event.type)) {
      const status = event.type === "PAYMENT_REFUNDED" ? "refunded" : "partially_refunded";
      const refunded = Number(event.refundedAmountMinor ?? 0);
      if (!Number.isSafeInteger(refunded) || refunded < 0 || BigInt(refunded) > BigInt(order.amount_minor)) {
        throw Object.assign(new Error("Refund amount is invalid"), { status: 409 });
      }
      if (payment) {
        await client.query(
          `UPDATE payments SET status = $2, refunded_amount_minor = $3, updated_at = now() WHERE id = $1`,
          [payment.id, status, refunded]
        );
      }
      await client.query(
        "UPDATE orders SET payment_status = $2, paid = $3 WHERE id = $1",
        [event.orderId, status, status === "partially_refunded"]
      );
    }

    await client.query("COMMIT");
    publishUpdate("orders", "updated", event.orderId);
    if (event.type === "PAYMENT_SUCCEEDED") publishUpdate("stock", "updated", null);
    return { duplicate: false };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
