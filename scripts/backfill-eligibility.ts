/**
 * One-time backfill: generate `eligibility_md` for ingested airdrops that are
 * just under the 800-char indexable threshold purely because that section is
 * empty. Generates from data already in the DB (step titles parsed out of
 * how_to_claim_md) — no network, no scraping.
 *
 * Scope (deliberately tight — the "near-miss" band):
 *   - NOT editorial-locked (primary_source_id != editorial source)
 *   - eligibility_md shorter than 50 chars (effectively empty)
 *   - combined description+eligibility+how_to_claim between 600 and 799
 *     (so the generated paragraph reliably lifts them over 800)
 *
 * Idempotent: re-runs only fill rows whose eligibility is still empty.
 *
 *   npx tsx scripts/backfill-eligibility.ts --dry-run   # preview, no writes
 *   npx tsx scripts/backfill-eligibility.ts             # apply
 */
import mysql from "mysql2/promise";
import { config as loadEnv } from "dotenv";
import { buildEligibility, parseStepTitlesFromMarkdown } from "../src/lib/ingest/enrich/eligibility";
import { MIN_INDEXABLE_DESCRIPTION_CHARS } from "../src/lib/seo";

// .env.local wins locally; fall back to .env (how the VPS app is configured).
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const DRY_RUN = process.argv.includes("--dry-run");
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set (.env.local or .env)");
  process.exit(1);
}

interface Row {
  id: number;
  slug: string;
  name: string;
  chain_name: string | null;
  category_name: string | null;
  kyc_required: number;
  estimated_value_text: string | null;
  how_to_claim_md: string;
  total: number;
}

async function main() {
  const pool = mysql.createPool({ uri: DATABASE_URL, connectionLimit: 4 });

  const [rows] = await pool.query(
    `SELECT a.id, a.slug, a.name,
            c.name  AS chain_name,
            cat.name AS category_name,
            a.kyc_required,
            NULL AS estimated_value_text,
            a.how_to_claim_md,
            (CHAR_LENGTH(a.description_md)+CHAR_LENGTH(a.eligibility_md)+CHAR_LENGTH(a.how_to_claim_md)) AS total
     FROM airdrops a
     LEFT JOIN chains c       ON c.id = a.chain_id
     LEFT JOIN categories cat ON cat.id = a.category_id
     WHERE a.deleted_at IS NULL
       AND a.primary_source_id <> (SELECT id FROM sources WHERE slug = 'editorial')
       AND CHAR_LENGTH(a.eligibility_md) < 50
       AND (CHAR_LENGTH(a.description_md)+CHAR_LENGTH(a.eligibility_md)+CHAR_LENGTH(a.how_to_claim_md)) BETWEEN 600 AND 799
     ORDER BY a.slug`,
  );
  const candidates = rows as Row[];

  console.log(`${DRY_RUN ? "[DRY RUN] " : ""}${candidates.length} candidate rows\n`);

  let written = 0;
  let willClear = 0;

  for (const row of candidates) {
    const stepTitles = parseStepTitlesFromMarkdown(row.how_to_claim_md);
    const eligibility = buildEligibility({
      name: row.name,
      stepTitles,
      chainName: row.chain_name,
      categoryName: row.category_name,
      kycRequired: !!row.kyc_required,
      estimatedValue: row.estimated_value_text,
    });

    if (!eligibility) {
      console.log(`  SKIP ${row.slug} (no content generated)`);
      continue;
    }

    const projected = row.total + eligibility.length;
    const clears = projected >= MIN_INDEXABLE_DESCRIPTION_CHARS;
    if (clears) willClear++;

    console.log(
      `  ${row.slug.padEnd(22)} ${String(row.total).padStart(3)} +${String(eligibility.length).padStart(3)} = ${String(projected).padStart(4)} ${clears ? "✓ indexable" : "✗ still thin"}`,
    );
    if (DRY_RUN) {
      console.log(`      "${eligibility}"\n`);
    } else {
      // Guard again at write time so a concurrent edit isn't clobbered.
      const [res] = await pool.query(
        `UPDATE airdrops SET eligibility_md = ?
         WHERE id = ? AND CHAR_LENGTH(eligibility_md) < 50`,
        [eligibility, row.id],
      );
      if ((res as { affectedRows: number }).affectedRows > 0) written++;
    }
  }

  console.log(
    `\n${DRY_RUN ? "[DRY RUN] would write" : "wrote"} eligibility for ${DRY_RUN ? candidates.length : written} rows; ${willClear}/${candidates.length} projected to clear the ${MIN_INDEXABLE_DESCRIPTION_CHARS}-char threshold.`,
  );

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
