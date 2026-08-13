/** รวม schema.sql + seed.sql เป็น neon-import.sql สำหรับนำเข้าฐานข้อมูลด้วยตนเอง */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const projectDir = join(currentDir, "..");
const schema = readFileSync(join(currentDir, "sql", "schema.sql"), "utf8").trim();
const seed = readFileSync(join(currentDir, "sql", "seed.sql"), "utf8").trim();

const output = `-- Pa Auan Shop - Neon PostgreSQL import (current)
-- Generated from src/sql/schema.sql and src/sql/seed.sql.
-- Paste this entire file into Neon SQL Editor and click Run.
-- Safe to run again: schema migrations are idempotent and seed runs only when categories is empty.

BEGIN;

${schema}

DO $seed$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM categories) THEN
${seed}
  ELSE
    RAISE NOTICE 'Seed skipped: database already contains categories.';
  END IF;
END;
$seed$;

COMMIT;
`;

const outputPath = join(projectDir, "neon-import.sql");
writeFileSync(outputPath, output, "utf8");
console.log(`Created ${outputPath}`);
