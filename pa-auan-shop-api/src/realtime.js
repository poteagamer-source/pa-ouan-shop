/** Server-Sent Events hub ส่งสัญญาณ resource changed ให้หน้าพนักงานโหลดข้อมูลล่าสุด */
import { Router } from "express";

const clients = new Set();

export const realtimeRouter = Router();

realtimeRouter.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  res.write(`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`);
  clients.add(res);

  const heartbeat = setInterval(() => res.write(": heartbeat\n\n"), 25000);
  req.on("close", () => {
    clearInterval(heartbeat);
    clients.delete(res);
  });
});

export function publishUpdate(resource, action, id = null) {
  const payload = JSON.stringify({ resource, action, id, at: new Date().toISOString() });
  for (const client of clients) {
    client.write(`event: update\ndata: ${payload}\n\n`);
  }
}
