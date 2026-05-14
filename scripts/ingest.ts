/**
 * Cron entrypoint for source ingestion.
 *
 * Local run:
 *   ~/start-mariadb-tunnel.bat
 *   npm run ingest
 *
 * Production cron (Hostinger): run daily, ~02:00 UTC.
 *   cd /home/USER/freecrypto && /usr/local/bin/node node_modules/tsx/dist/cli.mjs scripts/ingest.ts >> /home/USER/logs/freecrypto-ingest.log 2>&1
 *
 * Adapters are idempotent — repeat runs only refresh volatile fields.
 * Editorial-locked airdrops never have their copy overwritten.
 */
import mysql from "mysql2/promise";
import { config as loadEnv } from "dotenv";
import { defiLlamaSource } from "../src/lib/ingest/sources/defillama";
import { airdropsIoSource } from "../src/lib/ingest/sources/airdropsio";
import { enrichAirdropsIoRows } from "../src/lib/ingest/enrich/airdropsio-detail";
import { upsertNormalized } from "../src/lib/ingest/upsert";
import type { IngestStats, SourceAdapter } from "../src/lib/ingest/types";

loadEnv({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set in .env.local");
  process.exit(1);
}

const SOURCES: SourceAdapter[] = [defiLlamaSource, airdropsIoSource];

async function runSource(pool: import("mysql2/promise").Pool, src: SourceAdapter): Promise<IngestStats> {
  const t0 = Date.now();
  let stats: IngestStats = {
    source: src.slug,
    fetched: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    durationMs: 0,
  };
  try {
    console.log(`→ ${src.slug}: fetching…`);
    const rows = await src.fetch();
    stats.fetched = rows.length;
    if (rows.length === 0) {
      console.log(`  ${src.slug}: 0 rows`);
      stats.durationMs = Date.now() - t0;
      return stats;
    }
    console.log(`  ${src.slug}: ${rows.length} rows → upserting`);
    const results = await upsertNormalized(pool, src.slug, rows);
    for (const r of results) {
      if (r.action === "inserted") stats.inserted++;
      else if (r.action === "updated") stats.updated++;
      else if (r.action === "skipped-editorial") stats.skipped++;
      else if (r.action === "error") stats.errors++;
    }
  } catch (e) {
    stats.errors++;
    console.error(`  ${src.slug}: failed`, e instanceof Error ? e.message : e);
  }
  stats.durationMs = Date.now() - t0;
  return stats;
}

async function main() {
  const pool = mysql.createPool({
    uri: DATABASE_URL,
    connectionLimit: 4,
  });

  const allStats: IngestStats[] = [];
  for (const src of SOURCES) {
    const s = await runSource(pool, src);
    allStats.push(s);
    console.log(
      `✓ ${s.source}: fetched=${s.fetched} inserted=${s.inserted} updated=${s.updated} ` +
        `skipped(editorial)=${s.skipped} errors=${s.errors} ${s.durationMs}ms`,
    );
  }

  // Enrichment pass: airdrops.io detail-page structured-data scrape.
  try {
    const enrich = await enrichAirdropsIoRows(pool);
    const eStats: IngestStats = {
      source: "airdropsio-enrich",
      fetched: enrich.scanned,
      inserted: 0,
      updated: enrich.enriched,
      skipped: 0,
      errors: enrich.failed,
      durationMs: enrich.durationMs,
    };
    allStats.push(eStats);
    console.log(
      `✓ ${eStats.source}: scanned=${eStats.fetched} enriched=${eStats.updated} ` +
        `failed=${eStats.errors} ${eStats.durationMs}ms`,
    );
  } catch (e) {
    console.error("✗ airdropsio-enrich failed:", e instanceof Error ? e.message : e);
    allStats.push({
      source: "airdropsio-enrich",
      fetched: 0, inserted: 0, updated: 0, skipped: 0, errors: 1, durationMs: 0,
    });
  }

  await pool.end();

  const totals = allStats.reduce(
    (acc, s) => ({
      fetched: acc.fetched + s.fetched,
      inserted: acc.inserted + s.inserted,
      updated: acc.updated + s.updated,
      skipped: acc.skipped + s.skipped,
      errors: acc.errors + s.errors,
    }),
    { fetched: 0, inserted: 0, updated: 0, skipped: 0, errors: 0 },
  );

  console.log("──────────────");
  console.log(
    `TOTAL fetched=${totals.fetched} inserted=${totals.inserted} ` +
      `updated=${totals.updated} editorial-locked=${totals.skipped} errors=${totals.errors}`,
  );

  if (totals.errors > 0) process.exit(2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
