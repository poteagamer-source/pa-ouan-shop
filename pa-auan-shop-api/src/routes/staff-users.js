import { Router } from "express";
import { hashPassword, requireRole, STAFF_ROLES } from "../auth.js";
import { query } from "../db.js";

const router = Router();
router.use(requireRole("manager"));

const validUsername = (value) => /^[a-z0-9._-]{3,50}$/.test(value);

router.get("/", async (_req, res, next) => {
  try {
    const { rows } = await query("SELECT id, username, display_name, role, active, created_at FROM staff_users ORDER BY created_at");
    res.json(rows.map((row) => ({ id: row.id, username: row.username, displayName: row.display_name, role: row.role, active: row.active, createdAt: row.created_at })));
  } catch (error) { next(error); }
});

router.post("/", async (req, res, next) => {
  try {
    const username = String(req.body?.username ?? "").trim().toLowerCase();
    const displayName = String(req.body?.displayName ?? "").trim();
    const role = String(req.body?.role ?? "");
    if (!validUsername(username) || displayName.length < 2 || !STAFF_ROLES.includes(role)) return res.status(400).json({ error: "ข้อมูลบัญชีพนักงานไม่ถูกต้อง" });
    const password = String(req.body?.password ?? "");
    if (password.length < 10) return res.status(400).json({ error: "รหัสผ่านต้องมีอย่างน้อย 10 ตัวอักษร" });
    const passwordHash = await hashPassword(password);
    const { rows } = await query(
      `INSERT INTO staff_users (username, display_name, role, password_hash)
       VALUES ($1,$2,$3,$4) RETURNING id, username, display_name, role, active, created_at`,
      [username, displayName, role, passwordHash],
    );
    const row = rows[0];
    res.status(201).json({ id: row.id, username: row.username, displayName: row.display_name, role: row.role, active: row.active, createdAt: row.created_at });
  } catch (error) {
    if (error.code === "23505") return res.status(409).json({ error: "ชื่อผู้ใช้นี้มีอยู่แล้ว" });
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const targetId = String(req.params.id);
    const displayName = req.body?.displayName === undefined ? undefined : String(req.body.displayName).trim();
    const role = req.body?.role;
    const active = req.body?.active;
    if (role !== undefined && !STAFF_ROLES.includes(role)) return res.status(400).json({ error: "role ไม่ถูกต้อง" });
    if (targetId === String(req.staffUser.id) && (active === false || (role && role !== "manager"))) return res.status(400).json({ error: "ไม่สามารถปิดหรือลดสิทธิ์บัญชีที่กำลังใช้งาน" });
    const password = req.body?.password === undefined ? null : String(req.body.password);
    if (password !== null && password.length < 10) return res.status(400).json({ error: "รหัสผ่านต้องมีอย่างน้อย 10 ตัวอักษร" });
    const passwordHash = password ? await hashPassword(password) : null;
    const { rows } = await query(
      `UPDATE staff_users SET
         display_name = COALESCE($2, display_name), role = COALESCE($3, role),
         active = COALESCE($4, active), password_hash = COALESCE($5, password_hash), updated_at = now()
       WHERE id = $1 RETURNING id, username, display_name, role, active, created_at`,
      [targetId, displayName, role, active, passwordHash],
    );
    if (!rows[0]) return res.status(404).json({ error: "ไม่พบบัญชีพนักงาน" });
    if (passwordHash || active === false) await query("DELETE FROM staff_sessions WHERE user_id = $1", [targetId]);
    const row = rows[0];
    res.json({ id: row.id, username: row.username, displayName: row.display_name, role: row.role, active: row.active, createdAt: row.created_at });
  } catch (error) { next(error); }
});

export default router;
