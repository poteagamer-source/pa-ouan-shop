/** API login/logout/session/setup manager คนแรกสำหรับพนักงาน */
import { Router } from "express";
import { createSession, clearSessionCookie, hashPassword, revokeSession, sessionCookie, verifyPassword } from "../auth.js";
import { pool, query } from "../db.js";

const router = Router();
const attempts = new Map();

function validUsername(username) {
  return /^[a-z0-9._-]{3,50}$/.test(username);
}

router.get("/setup-status", async (_req, res, next) => {
  try {
    const { rows } = await query("SELECT NOT EXISTS (SELECT 1 FROM staff_users) AS setup_required");
    res.json({ setupRequired: rows[0].setup_required });
  } catch (error) {
    next(error);
  }
});

router.post("/setup", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const username = String(req.body?.username ?? "").trim().toLowerCase();
    const displayName = String(req.body?.displayName ?? "").trim();
    const password = String(req.body?.password ?? "");
    if (displayName.length < 2) return res.status(400).json({ error: "ชื่อที่แสดงต้องมีอย่างน้อย 2 ตัวอักษร" });
    if (!validUsername(username)) return res.status(400).json({ error: "ชื่อผู้ใช้ต้องมี 3-50 ตัว และใช้ได้เฉพาะ a-z, 0-9, จุด, _ หรือ -" });
    if (password.length < 10) return res.status(400).json({ error: "รหัสผ่านต้องมีอย่างน้อย 10 ตัวอักษร" });
    const passwordHash = await hashPassword(password);
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext('pa-auan-staff-first-setup'))");
    const existing = await client.query("SELECT 1 FROM staff_users LIMIT 1");
    if (existing.rowCount) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "ระบบถูกตั้งค่าแล้ว กรุณาเข้าสู่ระบบ" });
    }
    const { rows } = await client.query(
      `INSERT INTO staff_users (username, display_name, role, password_hash)
       VALUES ($1,$2,'manager',$3) RETURNING id, username, display_name, role`,
      [username, displayName, passwordHash],
    );
    await client.query("COMMIT");
    const token = await createSession(rows[0].id);
    res.setHeader("Set-Cookie", sessionCookie(token));
    res.status(201).json({ id: rows[0].id, username: rows[0].username, displayName: rows[0].display_name, role: rows[0].role });
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch { /* transaction may not have started */ }
    next(error);
  } finally {
    client.release();
  }
});

function blocked(key) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + 15 * 60_000 });
    return false;
  }
  entry.count += 1;
  return entry.count > 10;
}

router.post("/login", async (req, res, next) => {
  try {
    const username = String(req.body?.username ?? "").trim().toLowerCase();
    const password = String(req.body?.password ?? "");
    const key = `${req.ip}:${username}`;
    if (blocked(key)) return res.status(429).json({ error: "เข้าสู่ระบบผิดหลายครั้ง กรุณารอ 15 นาที" });
    const { rows } = await query("SELECT id, username, display_name, role, password_hash FROM staff_users WHERE username = $1 AND active = true", [username]);
    const user = rows[0];
    if (!user || !(await verifyPassword(password, user.password_hash))) return res.status(401).json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    attempts.delete(key);
    const token = await createSession(user.id);
    res.setHeader("Set-Cookie", sessionCookie(token));
    res.json({ id: user.id, username: user.username, displayName: user.display_name, role: user.role });
  } catch (error) {
    next(error);
  }
});

router.get("/me", (req, res) => {
  if (!req.staffUser) return res.status(401).json({ error: "ยังไม่ได้เข้าสู่ระบบ" });
  res.json(req.staffUser);
});

router.post("/logout", async (req, res, next) => {
  try {
    await revokeSession(req.sessionToken);
    res.setHeader("Set-Cookie", clearSessionCookie());
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
