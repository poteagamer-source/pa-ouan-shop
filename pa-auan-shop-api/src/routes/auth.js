import { Router } from "express";
import { createSession, clearSessionCookie, revokeSession, sessionCookie, verifyPassword } from "../auth.js";
import { query } from "../db.js";

const router = Router();
const attempts = new Map();

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
