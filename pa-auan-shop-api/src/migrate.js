import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { pool } from "./db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const sql = readFileSync(join(__dirname, "sql", "schema.sql"), "utf8");
  console.log("▶ กำลังสร้างตาราง (schema.sql) ...");
  await pool.query(sql);
  console.log("✅ สร้างตารางเรียบร้อย");
  await pool.end();
}

main().catch((err) => {
  console.error("❌ Migrate ล้มเหลว:", err.message);
  process.exit(1);
});
