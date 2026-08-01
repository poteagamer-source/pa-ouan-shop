import { createHmac, timingSafeEqual } from "node:crypto";

function equalHex(actual, expected) {
  if (!actual || !/^[a-f\d]+$/i.test(actual)) return false;
  const actualBuffer = Buffer.from(actual, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function verifyStripe(req) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw Object.assign(new Error("STRIPE_WEBHOOK_SECRET is not configured"), { status: 503 });
  const fields = Object.fromEntries(
    String(req.get("stripe-signature") ?? "")
      .split(",")
      .map((part) => part.split("=", 2))
  );
  const timestamp = Number(fields.t);
  if (!timestamp || Math.abs(Date.now() / 1000 - timestamp) > 300) return false;
  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${req.rawBody.toString("utf8")}`)
    .digest("hex");
  return equalHex(fields.v1, expected);
}

function normalizeStripe(event) {
  const object = event?.data?.object;
  if (!event?.id || !object) return null;

  const orderId = object.metadata?.order_id || object.client_reference_id;
  const base = {
    provider: "stripe",
    eventId: event.id,
    orderId,
    rawPayload: event,
  };

  if (["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type)) {
    if (object.payment_status !== "paid") return { ...base, type: "PAYMENT_PROCESSING", providerPaymentId: object.id };
    return {
      ...base,
      type: "PAYMENT_SUCCEEDED",
      providerPaymentId: object.id,
      transactionId: object.payment_intent,
      amountMinor: object.amount_total,
      currency: object.currency?.toUpperCase(),
    };
  }
  if (event.type === "checkout.session.async_payment_failed") {
    return { ...base, type: "PAYMENT_FAILED", providerPaymentId: object.id };
  }
  if (event.type === "payment_intent.succeeded") {
    return {
      ...base,
      type: "PAYMENT_SUCCEEDED",
      providerPaymentId: object.id,
      transactionId: object.latest_charge ?? object.id,
      amountMinor: object.amount_received ?? object.amount,
      currency: object.currency?.toUpperCase(),
    };
  }
  if (event.type === "payment_intent.payment_failed") {
    return {
      ...base,
      type: "PAYMENT_FAILED",
      providerPaymentId: object.id,
      failureCode: object.last_payment_error?.code,
      failureMessage: object.last_payment_error?.message,
    };
  }
  if (event.type === "charge.refunded") {
    const fullyRefunded = Number(object.amount_refunded) >= Number(object.amount);
    return {
      ...base,
      type: fullyRefunded ? "PAYMENT_REFUNDED" : "PAYMENT_PARTIALLY_REFUNDED",
      providerPaymentId: object.payment_intent ?? object.id,
      transactionId: object.id,
      amountMinor: object.amount,
      refundedAmountMinor: object.amount_refunded,
      currency: object.currency?.toUpperCase(),
    };
  }
  return null;
}

function verifyGeneric(req) {
  const secret = process.env.GENERIC_WEBHOOK_SECRET ?? process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret) throw Object.assign(new Error("GENERIC_WEBHOOK_SECRET is not configured"), { status: 503 });
  const supplied = req.get("x-payment-signature")?.replace(/^sha256=/, "");
  const expected = createHmac("sha256", secret).update(req.rawBody).digest("hex");
  return equalHex(supplied, expected);
}

function normalizeGeneric(body) {
  const supported = new Set([
    "PAYMENT_PROCESSING",
    "PAYMENT_SUCCEEDED",
    "PAYMENT_FAILED",
    "PAYMENT_PARTIALLY_REFUNDED",
    "PAYMENT_REFUNDED",
  ]);
  if (!body?.eventId || !body?.provider || !body?.orderId || !supported.has(body?.type)) return null;
  return {
    provider: String(body.provider).toLowerCase(),
    eventId: body.eventId,
    type: body.type,
    orderId: body.orderId,
    providerPaymentId: body.providerPaymentId,
    transactionId: body.transactionId,
    amountMinor: body.amountMinor,
    refundedAmountMinor: body.refundedAmountMinor,
    currency: body.currency?.toUpperCase(),
    failureCode: body.failureCode,
    failureMessage: body.failureMessage,
    rawPayload: body,
  };
}

export function verifyAndNormalizeWebhook(provider, req) {
  if (!req.rawBody) throw Object.assign(new Error("Raw webhook body is unavailable"), { status: 400 });
  if (provider === "stripe") {
    if (!verifyStripe(req)) throw Object.assign(new Error("Invalid Stripe webhook signature"), { status: 401 });
    return normalizeStripe(req.body);
  }
  if (provider === "generic") {
    if (!verifyGeneric(req)) throw Object.assign(new Error("Invalid generic webhook signature"), { status: 401 });
    return normalizeGeneric(req.body);
  }
  throw Object.assign(new Error(`Unsupported webhook provider: ${provider}`), { status: 404 });
}
