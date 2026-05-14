/**
 * Shared ingest pipeline used by both scripts/ingest.ts (CLI) and
 * /api/cron/ingest (HTTP). Returns per-source stats.
 *
 * Uses the existing lib/db pool so connection limits stay consistent
 * with the rest of the app.
 */
import type { Pool } from "mysql2/promise";
import { defiLlamaSource } from "@/lib/ingest/sources/defillama";
import { airdropsIoSource } from "@/lib/ingest/sources/airdropsio";
import { enrichAirdropsIoRows } from "@/lib/ingest/enrich/airdropsio-detail";
import { upsertNormalized } from "@/lib/ingest/upsert";
import type { IngestStats, SourceAdapter } from "@/lib/ingest/types";

// airdropalert.ts kept in the tree for git history but no longer pulled —
// its RSS feed drifted into generic crypto blog content. Replaced by
// airdrops.io /latest/ scraper which still publishes real airdrop cards.
const SOURCES: SourceAdapter[] = [defiLlamaSource, airdropsIoSource];

export async function runOneSource(pool: Pool, src: SourceAdapter): Promise<IngestStats> {
  const t0 = Date.now();
  const stats: IngestStats = {
    source: src.slug,
    fetched: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    durationMs: 0,
  };
  try {
    const rows = await src.fetch();
    stats.fetched = rows.length;
    if (rows.length === 0) {
      stats.durationMs = Date.now() - t0;
      return stats;
    }
    const results = await upsertNormalized(pool, src.slug, rows);
    for (const r of results) {
      if (r.action === "inserted") stats.inserted++;
      else if (r.action === "updated") stats.updated++;
      else if (r.action === "skipped-editorial") stats.skipped++;
      else if (r.action === "error") stats.errors++;
    }
  } catch (e) {
    stats.errors++;
    console.error(`ingest ${src.slug}:`, e instanceof Error ? e.message : e);
  }
  stats.durationMs = Date.now() - t0;
  return stats;
}

export async function runIngest(pool: Pool): Promise<IngestStats[]> {
  const out: IngestStats[] = [];
  for (const src of SOURCES) {
    out.push(await runOneSource(pool, src));
  }
  // After source adapters: enrich airdrops.io rows that still have thin
  // descriptions by scraping the project's detail page for structured data
  // (step titles, numbers, social links). Synthesised summary, no prose copy.
  try {
    const enrich = await enrichAirdropsIoRows(pool);
    out.push({
      source: "airdropsio-enrich",
      fetched: enrich.scanned,
      inserted: 0,
      updated: enrich.enriched,
      skipped: 0,
      errors: enrich.failed,
      durationMs: enrich.durationMs,
    });
  } catch (e) {
    console.error("airdropsio-enrich failed:", e instanceof Error ? e.message : e);
    out.push({
      source: "airdropsio-enrich",
      fetched: 0, inserted: 0, updated: 0, skipped: 0, errors: 1,
      durationMs: 0,
    });
  }
  return out;
}
