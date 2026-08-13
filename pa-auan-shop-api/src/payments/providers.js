/** Payment provider adapters สำหรับสร้าง checkout session และดึงสถานะจากผู้ให้บริการ */
const STRIPE_API = "https://api.stripe.com/v1";
const STRIPE_METHODS = new Set([
  "card",
  "promptpay",
  "paynow",
  "pix",
  "alipay",
  "wechat_pay",
  "ideal",
  "bancontact",
  "eps",
  "p24",
  "sepa_debit",
]);

function appOrigin(req) {
  const configured = process.env.PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/$/, "");
  const origin = req.get("origin");
  if (origin && (process.env.NODE_ENV !== "production" || origin.startsWith("https://"))) return origin;
  throw new Error("PUBLIC_APP_URL is required to create hosted payment sessions");
}

function safeReturnPath(path, order) {
  const fallback = `/order/${encodeURIComponent(order.table_name)}/status`;
  if (!path || typeof path !== "string" || !path.startsWith("/") || path.startsWith("//")) return fallback;
  return path;
}

async function stripeRequest(path, params, idempotencyKey) {
  if (!process.env.STRIPE_SECRET_KEY) {
    const error = new Error("STRIPE_SECRET_KEY is not configured");
    error.status = 503;
    throw error;
  }

  const response = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Idempotency-Key": idempotencyKey,
    },
    body: new URLSearchParams(params),
  });
  const body = await response.json();
  if (!response.ok) {
    const error = new Error(body?.error?.message ?? "Stripe request failed");
    error.status = response.status >= 500 ? 502 : 400;
    error.code = body?.error?.code;
    throw error;
  }
  return body;
}

export async function createProviderPayment({ req, payment, order, paymentMethod, returnPath }) {
  if (payment.provider !== "stripe") {
    const error = new Error(`Unsupported payment provider: ${payment.provider}`);
    error.status = 400;
    throw error;
  }
  if (!STRIPE_METHODS.has(paymentMethod)) {
    const error = new Error(`Unsupported Stripe payment method: ${paymentMethod}`);
    error.status = 400;
    throw error;
  }
  if (paymentMethod === "promptpay" && payment.currency !== "THB") {
    const error = new Error("PromptPay requires THB");
    error.status = 400;
    throw error;
  }

  const origin = appOrigin(req);
  const resultPath = safeReturnPath(returnPath, order);
  const params = {
    mode: "payment",
    client_reference_id: order.id,
    success_url: `${origin}${resultPath}?payment=success`,
    cancel_url: `${origin}${resultPath}?payment=cancelled`,
    "metadata[order_id]": order.id,
    "payment_intent_data[metadata][order_id]": order.id,
    "line_items[0][price_data][currency]": payment.currency.toLowerCase(),
    "line_items[0][price_data][product_data][name]": `Order ${order.id}`,
    "line_items[0][price_data][unit_amount]": String(payment.amount_minor),
    "line_items[0][quantity]": "1",
    "payment_method_types[0]": paymentMethod,
  };
  const session = await stripeRequest("/checkout/sessions", params, payment.idempotency_key);
  return {
    providerPaymentId: session.id,
    status: session.payment_status === "paid" ? "succeeded" : "pending",
    checkoutUrl: session.url,
  };
}
