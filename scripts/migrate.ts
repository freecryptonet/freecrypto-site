/**
 * Apply every .sql file in migrations/ in lexicographic order.
 * Tracks applied filenames in a migrations table so re-runs are no-ops.
 *
 * Usage:
 *   1) start the MariaDB tunnel: ~/start-mariadb-tunnel.bat
 *   2) ensure .env.local has DATABASE_URL
 *   3) npm run migrate
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set in .env.local");
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.resolve(__dirname, "..", "migrations");

async function main() {
  const conn = await mysql.createConnection({
    uri: DATABASE_URL,
    multipleStatements: true,
  });

  await conn.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename VARCHAR(200) PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const [appliedRows] = await conn.query("SELECT filename FROM _migrations");
  const applied = new Set((appliedRows as Array<{ filename: string }>).map((r) => r.filename));

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`✓ skip ${file} (already applied)`);
      continue;
    }
    const sqlText = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    console.log(`→ apply ${file}`);
    try {
      await conn.query(sqlText);
      await conn.query("INSERT INTO _migrations (filename) VALUES (?)", [file]);
      console.log(`✓ done ${file}`);
    } catch (err) {
      console.error(`✗ failed ${file}:`, err);
      process.exit(1);
    }
  }

  await conn.end();
  console.log("All migrations applied.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
