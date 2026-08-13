/** PostgreSQL connection pool กลาง; ทุก route ใช้ query helper หรือ pool สำหรับ transaction */
import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("❌ ไม่พบ DATABASE_URL — คัดลอก .env.example เป็น .env แล้วใส่ connection string จาก Neon");
  process.exit(1);
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Neon ต้องใช้ SSL เสมอ
  ssl: { rejectUnauthorized: false },
});

export const query = (text, params) => pool.query(text, params);
