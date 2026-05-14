/**
 * Idempotent upsert for ingested airdrops.
 *
 * Design:
 *   - Match precedence: existing slug == suggested_slug → update.
 *     Otherwise insert with suggested_slug (slug-collision-safe via random suffix).
 *   - Preserve editorial content. We NEVER overwrite description_md /
 *     eligibility_md / how_to_claim_md if they're already non-empty —
 *     hand-curated copy beats source-scraped boilerplate.
 *   - Manual edits are preserved by detecting them: any airdrop whose
 *     primary_source_id === editorial source is treated as locked.
 *   - status, funding, social_score, end_date are refreshed every run.
 */
import { type Pool } from "mysql2/promise";
import { slugify } from "@/lib/format";
import type { NormalizedAirdrop } from "./types";

export interface UpsertResult {
  action: "inserted" | "updated" | "skipped-editorial" | "error";
  slug: string;
}

interface ChainAndCategoryMaps {
  chainId: Map<string, number>;
  categoryId: Map<string, number>;
  sourceId: number;
  editorialSourceId: number;
}

async function loadMaps(pool: Pool, sourceSlug: string): Promise<ChainAndCategoryMaps> {
  const [chainRows] = await pool.query("SELECT id, slug FROM chains");
  const chainId = new Map<string, number>();
  for (const r of chainRows as Array<{ id: number; slug: string }>) chainId.set(r.slug, r.id);

  const [catRows] = await pool.query("SELECT id, slug FROM categories");
  const categoryId = new Map<string, number>();
  for (const r of catRows as Array<{ id: number; slug: string }>) categoryId.set(r.slug, r.id);

  const [srcRows] = await pool.query(
    "SELECT slug, id FROM sources WHERE slug IN (?, 'editorial')",
    [sourceSlug],
  );
  const srcMap = new Map<string, number>();
  for (const r of srcRows as Array<{ slug: string; id: number }>) srcMap.set(r.slug, r.id);
  if (!srcMap.has(sourceSlug)) {
    // Auto-create source row if missing
    const [res] = await pool.query("INSERT INTO sources (slug, name) VALUES (?, ?)", [
      sourceSlug,
      sourceSlug,
    ]);
    srcMap.set(sourceSlug, (res as { insertId: number }).insertId);
  }
  return {
    chainId,
    categoryId,
    sourceId: srcMap.get(sourceSlug)!,
    editorialSourceId: srcMap.get("editorial") ?? srcMap.get(sourceSlug)!,
  };
}

function normalizeSlug(input: string): string {
  return slugify(input) || `unknown-${Math.random().toString(36).slice(2, 8)}`;
}

export async function upsertNormalized(
  pool: Pool,
  sourceSlug: string,
  rows: NormalizedAirdrop[],
): Promise<UpsertResult[]> {
  if (rows.length === 0) return [];
  const maps = await loadMaps(pool, sourceSlug);
  const out: UpsertResult[] = [];

  for (const r of rows) {
    try {
      const baseSlug = r.suggested_slug ? normalizeSlug(r.suggested_slug) : normalizeSlug(r.name);
      const chainPk = r.chain_slug ? maps.chainId.get(r.chain_slug) ?? null : null;
      const catPk = r.category_slug ? maps.categoryId.get(r.category_slug) ?? null : null;

      // Check whether this slug already exists.
      const [existingRows] = await pool.query(
        "SELECT id, primary_source_id, description_md, eligibility_md, how_to_claim_md FROM airdrops WHERE slug = ? LIMIT 1",
        [baseSlug],
      );
      const existing = (existingRows as Array<{
        id: number;
        primary_source_id: number | null;
        description_md: string;
        eligibility_md: string;
        how_to_claim_md: string;
      }>)[0];

      if (existing) {
        // Editorial-locked rows: refresh ONLY the volatile market fields.
        const isEditorial = existing.primary_source_id === maps.editorialSourceId;
        if (isEditorial) {
          await pool.query(
            `UPDATE airdrops SET
              funding_raised_usd = COALESCE(?, funding_raised_usd),
              social_score       = COALESCE(?, social_score),
              end_date           = COALESCE(?, end_date),
              twitter_url        = COALESCE(twitter_url, ?),
              discord_url        = COALESCE(discord_url, ?)
             WHERE id = ?`,
            [
              r.funding_raised_usd ?? null,
              r.social_score ?? null,
              r.end_date ?? null,
              r.twitter_url ?? null,
              r.discord_url ?? null,
              existing.id,
            ],
          );
          out.push({ action: "skipped-editorial", slug: baseSlug });
          continue;
        }

        // Ingest-owned rows: full refresh, but never blank out copy that was filled in
        await pool.query(
          `UPDATE airdrops SET
            name = ?,
            token_symbol = COALESCE(?, token_symbol),
            logo_url = COALESCE(?, logo_url),
            short_description = COALESCE(?, short_description),
            description_md = CASE WHEN LENGTH(description_md) > 0 THEN description_md ELSE ? END,
            eligibility_md = CASE WHEN LENGTH(eligibility_md) > 0 THEN eligibility_md ELSE ? END,
            how_to_claim_md = CASE WHEN LENGTH(how_to_claim_md) > 0 THEN how_to_claim_md ELSE ? END,
            status = ?,
            chain_id = COALESCE(?, chain_id),
            category_id = COALESCE(?, category_id),
            kyc_required = ?,
            funding_raised_usd = COALESCE(?, funding_raised_usd),
            estimated_value_usd_min = COALESCE(?, estimated_value_usd_min),
            estimated_value_usd_max = COALESCE(?, estimated_value_usd_max),
            social_score = COALESCE(?, social_score),
            project_url = COALESCE(?, project_url),
            twitter_url = COALESCE(?, twitter_url),
            discord_url = COALESCE(?, discord_url),
            started_at = COALESCE(?, started_at),
            snapshot_date = COALESCE(?, snapshot_date),
            end_date = COALESCE(?, end_date)
           WHERE id = ?`,
          [
            r.name,
            r.token_symbol ?? null,
            r.logo_url ?? null,
            r.short_description ?? null,
            r.description_md ?? "",
            r.eligibility_md ?? "",
            r.how_to_claim_md ?? "",
            r.status ?? "potential",
            chainPk,
            catPk,
            r.kyc_required ? 1 : 0,
            r.funding_raised_usd ?? null,
            r.estimated_value_usd_min ?? null,
            r.estimated_value_usd_max ?? null,
            r.social_score ?? null,
            r.project_url ?? null,
            r.twitter_url ?? null,
            r.discord_url ?? null,
            r.started_at ?? null,
            r.snapshot_date ?? null,
            r.end_date ?? null,
            existing.id,
          ],
        );
        out.push({ action: "updated", slug: baseSlug });
        continue;
      }

      // Insert new
      await pool.query(
        `INSERT INTO airdrops (
          slug, name, token_symbol, logo_url, short_description,
          description_md, eligibility_md, how_to_claim_md,
          status, chain_id, category_id, primary_source_id,
          kyc_required, funding_raised_usd,
          estimated_value_usd_min, estimated_value_usd_max, social_score,
          project_url, twitter_url, discord_url,
          started_at, snapshot_date, end_date
        ) VALUES (?,?,?,?,?, ?,?,?, ?,?,?,?, ?,?, ?,?,?, ?,?,?, ?,?,?)`,
        [
          baseSlug, r.name, r.token_symbol ?? null, r.logo_url ?? null, r.short_description ?? null,
          r.description_md ?? "", r.eligibility_md ?? "", r.how_to_claim_md ?? "",
          r.status ?? "potential", chainPk, catPk, maps.sourceId,
          r.kyc_required ? 1 : 0, r.funding_raised_usd ?? null,
          r.estimated_value_usd_min ?? null, r.estimated_value_usd_max ?? null, r.social_score ?? null,
          r.project_url ?? null, r.twitter_url ?? null, r.discord_url ?? null,
          r.started_at ?? null, r.snapshot_date ?? null, r.end_date ?? null,
        ],
      );
      out.push({ action: "inserted", slug: baseSlug });
    } catch (e) {
      console.error(`upsert error for ${r.name}:`, e instanceof Error ? e.message : e);
      out.push({ action: "error", slug: r.suggested_slug || r.name });
    }
  }

  return out;
}
