/** QR โต๊ะ: manager สร้าง/ลบ token และลูกค้าใช้ token เพื่อค้นหาเลขโต๊ะ */
import { randomBytes } from "node:crypto";
import { Router } from "express";
import { requireRole } from "../auth.js";
import { query } from "../db.js";

const router = Router();
const normalizeTableId = (value) => String(value ?? "").trim().toUpperCase();

// Public endpoint สำหรับโทรศัพท์ลูกค้าที่สแกน QR
router.get("/resolve/:token", async (req, res, next) => {
  try {
    const { rows } = await query("SELECT table_id FROM table_qr_codes WHERE token = $1", [String(req.params.token)]);
    if (!rows[0]) return res.status(404).json({ error: "QR นี้ถูกลบ หมดอายุ หรือไม่ถูกต้อง" });
    res.json({ tableId: rows[0].table_id });
  } catch (error) { next(error); }
});

router.use(requireRole("manager"));

router.get("/", async (_req, res, next) => {
  try {
    const { rows } = await query("SELECT id, token, table_id, created_at FROM table_qr_codes ORDER BY table_id");
    res.json(rows.map((row) => ({ id: String(row.id), token: row.token, tableId: row.table_id, createdAt: row.created_at })));
  } catch (error) { next(error); }
});

// UPSERT ทำให้สร้าง QR ใหม่ของโต๊ะเดิมแล้ว token เก่าใช้ไม่ได้ทันที
router.post("/", async (req, res, next) => {
  try {
    const tableId = normalizeTableId(req.body?.tableId);
    if (!/^[A-Z][0-9]{2}$/.test(tableId)) return res.status(400).json({ error: "เลขโต๊ะต้องอยู่ในรูปแบบ A01 หรือ B02" });
    const token = randomBytes(24).toString("base64url");
    const { rows } = await query(
      `INSERT INTO table_qr_codes (token, table_id) VALUES ($1, $2)
       ON CONFLICT (table_id) DO UPDATE SET token = EXCLUDED.token, created_at = now()
       RETURNING id, token, table_id, created_at`,
      [token, tableId],
    );
    const row = rows[0];
    res.status(201).json({ id: String(row.id), token: row.token, tableId: row.table_id, createdAt: row.created_at });
  } catch (error) { next(error); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const result = await query("DELETE FROM table_qr_codes WHERE id = $1", [String(req.params.id)]);
    if (result.rowCount === 0) return res.status(404).json({ error: "ไม่พบ QR ที่ต้องการลบ" });
    res.status(204).end();
  } catch (error) { next(error); }
});

export default router;
