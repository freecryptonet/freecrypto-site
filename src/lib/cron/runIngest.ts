/**
 * Shared ingest pipeline used by both scripts/ingest.ts (CLI) and
 * /api/cron/ingest (HTTP). Returns per-source stats.
 *
 * Uses the existing lib/db pool so connection limits stay consistent
 * with the rest of the app.
 */
import type { Pool } from "mysql2/promise";
import { defiLlamaSource } from "@/lib/ingest/sources/defillama";
import { airdropAlertSource } from "@/lib/ingest/sources/airdropalert";
import { upsertNormalized } from "@/lib/ingest/upsert";
import type { IngestStats, SourceAdapter } from "@/lib/ingest/types";

const SOURCES: SourceAdapter[] = [defiLlamaSource, airdropAlertSource];

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
  return out;
}
