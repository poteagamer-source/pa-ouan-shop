/** คำสั่ง db:seed สำหรับใส่หมวด เมนู ท็อปปิ้ง และสต๊อกตั้งต้น */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { pool } from "./db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const sql = readFileSync(join(__dirname, "sql", "seed.sql"), "utf8");
  console.log("▶ กำลังใส่ข้อมูลตัวอย่าง (seed.sql) ...");
  await pool.query(sql);
  console.log("✅ ใส่ข้อมูลตัวอย่างเรียบร้อย");
  await pool.end();
}

main().catch((err) => {
  console.error("❌ Seed ล้มเหลว:", err.message);
  process.exit(1);
});
