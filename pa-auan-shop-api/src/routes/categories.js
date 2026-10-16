/** API อ่านหมวดเมนูที่ frontend ใช้สร้าง chips และ sidebar */
import { Router } from "express";
import { pool, query } from "../db.js";
import { randomUUID } from "node:crypto";
import { requireRole } from "../auth.js";
import { publishUpdate } from "../realtime.js";

const router = Router();

// GET /api/categories
router.get("/", async (_req, res, next) => {
  try {
    const { rows } = await query("SELECT id, label FROM categories ORDER BY id");
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post("/", requireRole("manager"), async (req, res, next) => {
  const label = typeof req.body?.label === "string" ? req.body.label.trim() : "";
  if (!label || label.length > 100) return res.status(400).json({ error: "กรุณาระบุชื่อหมวดหมู่ 1–100 ตัวอักษร" });
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    // Serialize duplicate-name checks across simultaneous manager requests.
    await client.query("SELECT pg_advisory_xact_lock(hashtext(lower($1)))", [label]);
    const existing = await client.query("SELECT id FROM categories WHERE lower(btrim(label)) = lower($1)", [label]);
    if (existing.rows.length) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "มีชื่อหมวดหมู่นี้อยู่แล้ว" });
    }
    const { rows } = await client.query("INSERT INTO categories (id, label) VALUES ($1, $2) RETURNING id, label", [`cat-${randomUUID()}`, label]);
    await client.query("COMMIT");
    publishUpdate("categories", "created", rows[0].id);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (client) await client.query("ROLLBACK");
    next(err);
  } finally { client?.release(); }
});

export default router;
