import { Router } from "express";
import { processPaymentEvent } from "../payments/processor.js";
import { verifyAndNormalizeWebhook } from "../payments/webhookAdapters.js";

const router = Router();

router.post("/:provider", async (req, res, next) => {
  try {
    const event = verifyAndNormalizeWebhook(req.params.provider.toLowerCase(), req);
    if (!event) return res.json({ ok: true, ignored: true });
    const result = await processPaymentEvent(event);
    res.json({ ok: true, ...result });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

export default router;
