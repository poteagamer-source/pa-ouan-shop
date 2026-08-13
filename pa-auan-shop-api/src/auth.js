/** Authentication middleware: session cookie, password hashing และ requireRole สำหรับ routes */
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { query } from "./db.js";

const scrypt = promisify(scryptCallback);
export const STAFF_ROLES = ["manager", "kitchen", "waiter"];
const SESSION_HOURS = Number(process.env.STAFF_SESSION_HOURS ?? 12);

export async function hashPassword(password) {
  if (typeof password !== "string" || password.length < 10) throw new Error("รหัสผ่านพนักงานต้องมีอย่างน้อย 10 ตัวอักษร");
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${Buffer.from(derived).toString("hex")}`;
}

export async function verifyPassword(password, encoded) {
  try {
    const [algorithm, saltHex, hashHex] = String(encoded).split("$");
    if (algorithm !== "scrypt" || !saltHex || !hashHex) return false;
    const expected = Buffer.from(hashHex, "hex");
    const actual = Buffer.from(await scrypt(password, Buffer.from(saltHex, "hex"), expected.length));
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

function parseCookies(header = "") {
  return Object.fromEntries(header.split(";").map((part) => part.trim().split("=")).filter(([key, value]) => key && value).map(([key, value]) => [key, decodeURIComponent(value)]));
}

function tokenHash(token) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId) {
  const token = randomBytes(32).toString("base64url");
  await query(
    `INSERT INTO staff_sessions (token_hash, user_id, expires_at)
     VALUES ($1, $2, now() + ($3 * interval '1 hour'))`,
    [tokenHash(token), userId, SESSION_HOURS],
  );
  return token;
}

export async function revokeSession(token) {
  if (token) await query("DELETE FROM staff_sessions WHERE token_hash = $1", [tokenHash(token)]);
}

export function sessionCookie(token) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `staff_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.max(1, SESSION_HOURS) * 3600}${secure}`;
}

export function clearSessionCookie() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `staff_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export async function optionalAuth(req, _res, next) {
  try {
    const token = parseCookies(req.headers.cookie).staff_session;
    req.sessionToken = token ?? null;
    req.staffUser = null;
    if (!token) return next();
    const { rows } = await query(
      `SELECT u.id, u.username, u.display_name, u.role
       FROM staff_sessions s JOIN staff_users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.expires_at > now() AND u.active = true`,
      [tokenHash(token)],
    );
    req.staffUser = rows[0] ? { id: rows[0].id, username: rows[0].username, displayName: rows[0].display_name, role: rows[0].role } : null;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.staffUser) return res.status(401).json({ error: "กรุณาเข้าสู่ระบบพนักงาน" });
    if (!roles.includes(req.staffUser.role)) return res.status(403).json({ error: "บัญชีนี้ไม่มีสิทธิ์ทำรายการดังกล่าว" });
    next();
  };
}
