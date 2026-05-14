/**
 * Load seeds/*.json into MariaDB. Idempotent — INSERT ... ON DUPLICATE KEY UPDATE
 * so re-running won't create dupes. Wipes faqs for any reseeded airdrop before reinserting.
 *
 * Usage:
 *   1) ~/start-mariadb-tunnel.bat   (open the tunnel)
 *   2) npm run migrate              (apply schema)
 *   3) npm run seed                 (populate)
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import mysql, { type RowDataPacket } from "mysql2/promise";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set in .env.local");
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SEEDS_DIR = path.resolve(__dirname, "..", "seeds");

interface ChainSeed { slug: string; name: string; description: string | null; sort_order: number; }
interface CategorySeed { slug: string; name: string; description: string | null; sort_order: number; }
interface SourceSeed { slug: string; name: string; url: string | null; }
interface FaqSeed { question: string; answer_md: string; }
interface AirdropSeed {
  slug: string;
  name: string;
  token_symbol: string | null;
  logo_url: string | null;
  status: "confirmed" | "potential" | "snapshot" | "live" | "ended";
  chain: string;
  category: string;
  kyc_required: boolean;
  funding_raised_usd: number | null;
  estimated_value_usd_min: number | null;
  estimated_value_usd_max: number | null;
  social_score: number | null;
  started_at: string | null;
  snapshot_date: string | null;
  end_date: string | null;
  project_url: string | null;
  twitter_url: string | null;
  discord_url: string | null;
  short_description: string | null;
  description_md: string;
  eligibility_md: string;
  how_to_claim_md: string;
  faqs: FaqSeed[];
}

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(SEEDS_DIR, file), "utf8")) as T;
}

function visitCode(slug: string): string {
  return crypto.createHash("sha256").update(`v1:${slug}`).digest("base64url").slice(0, 8);
}

async function main() {
  const chains = readJson<ChainSeed[]>("chains.json");
  const categories = readJson<CategorySeed[]>("categories.json");
  const sources = readJson<SourceSeed[]>("sources.json");
  const airdrops = readJson<AirdropSeed[]>("airdrops.json");

  const conn = await mysql.createConnection({ uri: DATABASE_URL });

  console.log(`Seeding ${chains.length} chains…`);
  for (const c of chains) {
    await conn.query(
      `INSERT INTO chains (slug, name, description, sort_order)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), sort_order = VALUES(sort_order)`,
      [c.slug, c.name, c.description, c.sort_order],
    );
  }

  console.log(`Seeding ${categories.length} categories…`);
  for (const c of categories) {
    await conn.query(
      `INSERT INTO categories (slug, name, description, sort_order)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), sort_order = VALUES(sort_order)`,
      [c.slug, c.name, c.description, c.sort_order],
    );
  }

  console.log(`Seeding ${sources.length} sources…`);
  for (const s of sources) {
    await conn.query(
      `INSERT INTO sources (slug, name, url)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), url = VALUES(url)`,
      [s.slug, s.name, s.url],
    );
  }

  // Resolve slug → id maps
  const [chainRows] = await conn.query<RowDataPacket[]>("SELECT id, slug FROM chains");
  const chainId = new Map<string, number>();
  for (const r of chainRows as Array<{ id: number; slug: string }>) chainId.set(r.slug, r.id);

  const [catRows] = await conn.query<RowDataPacket[]>("SELECT id, slug FROM categories");
  const categoryId = new Map<string, number>();
  for (const r of catRows as Array<{ id: number; slug: string }>) categoryId.set(r.slug, r.id);

  const [editorialRows] = await conn.query<RowDataPacket[]>(
    "SELECT id FROM sources WHERE slug = 'editorial' LIMIT 1",
  );
  const editorialId = (editorialRows[0] as { id: number } | undefined)?.id ?? null;

  console.log(`Seeding ${airdrops.length} airdrops…`);
  for (const a of airdrops) {
    const cId = chainId.get(a.chain) ?? null;
    const catId = categoryId.get(a.category) ?? null;
    const code = visitCode(a.slug);

    // Insert/upsert airdrop
    await conn.query(
      `INSERT INTO airdrops (
        slug, name, token_symbol, logo_url, short_description,
        description_md, eligibility_md, how_to_claim_md,
        status, chain_id, category_id, primary_source_id,
        kyc_required, funding_raised_usd,
        estimated_value_usd_min, estimated_value_usd_max, social_score,
        project_url, twitter_url, discord_url,
        primary_cta_visit_code,
        started_at, snapshot_date, end_date
      ) VALUES (?,?,?,?,?, ?,?,?, ?,?,?,?, ?,?, ?,?,?, ?,?,?, ?, ?,?,?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        token_symbol = VALUES(token_symbol),
        logo_url = VALUES(logo_url),
        short_description = VALUES(short_description),
        description_md = VALUES(description_md),
        eligibility_md = VALUES(eligibility_md),
        how_to_claim_md = VALUES(how_to_claim_md),
        status = VALUES(status),
        chain_id = VALUES(chain_id),
        category_id = VALUES(category_id),
        kyc_required = VALUES(kyc_required),
        funding_raised_usd = VALUES(funding_raised_usd),
        estimated_value_usd_min = VALUES(estimated_value_usd_min),
        estimated_value_usd_max = VALUES(estimated_value_usd_max),
        social_score = VALUES(social_score),
        project_url = VALUES(project_url),
        twitter_url = VALUES(twitter_url),
        discord_url = VALUES(discord_url),
        primary_cta_visit_code = VALUES(primary_cta_visit_code),
        started_at = VALUES(started_at),
        snapshot_date = VALUES(snapshot_date),
        end_date = VALUES(end_date)`,
      [
        a.slug, a.name, a.token_symbol, a.logo_url, a.short_description,
        a.description_md, a.eligibility_md, a.how_to_claim_md,
        a.status, cId, catId, editorialId,
        a.kyc_required ? 1 : 0, a.funding_raised_usd,
        a.estimated_value_usd_min, a.estimated_value_usd_max, a.social_score,
        a.project_url, a.twitter_url, a.discord_url,
        code,
        a.started_at, a.snapshot_date, a.end_date,
      ],
    );

    // Resolve airdrop id
    const [aRows] = await conn.query<RowDataPacket[]>(
      "SELECT id FROM airdrops WHERE slug = ? LIMIT 1",
      [a.slug],
    );
    const aId = (aRows[0] as { id: number }).id;

    // Visit code → project URL (default for the primary CTA)
    if (a.project_url) {
      await conn.query(
        `INSERT INTO visit_codes (code, target_url, airdrop_id, source_label)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE target_url = VALUES(target_url), airdrop_id = VALUES(airdrop_id)`,
        [code, a.project_url, aId, "primary"],
      );
    }

    // Reset & reinsert FAQs
    await conn.query("DELETE FROM faqs WHERE airdrop_id = ?", [aId]);
    for (let i = 0; i < a.faqs.length; i++) {
      const f = a.faqs[i];
      await conn.query(
        "INSERT INTO faqs (airdrop_id, position, question, answer_md) VALUES (?, ?, ?, ?)",
        [aId, i, f.question, f.answer_md],
      );
    }
  }

  await conn.end();
  console.log(`✓ Seeded ${airdrops.length} airdrops, ${chains.length} chains, ${categories.length} categories.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
