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
interface GuideSeed {
  slug: string;
  title: string;
  excerpt: string;
  body_md: string;
  published_at: string;
}
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

  // Known airdrop contracts (used by /api/check) — each entry can carry an
  // airdrop_meta that bootstraps an airdrop row, in which case we upsert it
  // first and link the contract to it.
  const knownPath = path.join(SEEDS_DIR, "known_contracts.json");
  if (fs.existsSync(knownPath)) {
    interface KnownContractSeed {
      airdrop_slug: string;
      airdrop_meta?: {
        name: string; token_symbol: string | null;
        status: "confirmed" | "potential" | "snapshot" | "live" | "ended";
        chain: string; category: string;
        kyc_required: boolean;
        funding_raised_usd: number | null;
        estimated_value_usd_min: number | null;
        estimated_value_usd_max: number | null;
        social_score: number | null;
        short_description: string | null;
        project_url: string | null;
        started_at: string | null;
        end_date: string | null;
      };
      chain_slug: string;
      contract_addr: string;
      method: string;
      snapshot_block: number | null;
      claim_url: string | null;
      notes: string | null;
    }
    const known = readJson<KnownContractSeed[]>("known_contracts.json");
    console.log(`Seeding ${known.length} known airdrop contracts…`);
    for (const k of known) {
      // Bootstrap airdrop row if missing
      if (k.airdrop_meta) {
        const m = k.airdrop_meta;
        const cId = chainId.get(m.chain) ?? null;
        const catId = categoryId.get(m.category) ?? null;
        await conn.query(
          `INSERT INTO airdrops (
            slug, name, token_symbol, short_description,
            status, chain_id, category_id, primary_source_id,
            kyc_required, funding_raised_usd,
            estimated_value_usd_min, estimated_value_usd_max, social_score,
            project_url, started_at, end_date
          ) VALUES (?,?,?,?, ?,?,?,?, ?,?, ?,?,?, ?,?,?)
          ON DUPLICATE KEY UPDATE
            short_description = COALESCE(VALUES(short_description), short_description),
            status = VALUES(status),
            estimated_value_usd_min = VALUES(estimated_value_usd_min),
            estimated_value_usd_max = VALUES(estimated_value_usd_max)`,
          [
            k.airdrop_slug, m.name, m.token_symbol, m.short_description,
            m.status, cId, catId, editorialId,
            m.kyc_required ? 1 : 0, m.funding_raised_usd,
            m.estimated_value_usd_min, m.estimated_value_usd_max, m.social_score,
            m.project_url, m.started_at, m.end_date,
          ],
        );
      }
      const [aRows] = await conn.query<RowDataPacket[]>(
        "SELECT id FROM airdrops WHERE slug = ? LIMIT 1",
        [k.airdrop_slug],
      );
      const aId = (aRows[0] as { id: number } | undefined)?.id;
      if (!aId) {
        console.warn(`  skip ${k.airdrop_slug}: no airdrop row exists`);
        continue;
      }
      const cId = chainId.get(k.chain_slug) ?? null;
      if (!cId) {
        console.warn(`  skip ${k.airdrop_slug}: chain ${k.chain_slug} not in chains table`);
        continue;
      }
      // Idempotent upsert via (airdrop_id, chain_id, contract_addr) — no unique
      // key exists, so DELETE+INSERT is the cleanest path.
      await conn.query(
        `DELETE FROM known_airdrop_contracts
         WHERE airdrop_id = ? AND chain_id = ? AND LOWER(contract_addr) = LOWER(?)`,
        [aId, cId, k.contract_addr],
      );
      await conn.query(
        `INSERT INTO known_airdrop_contracts
           (airdrop_id, chain_id, contract_addr, method, snapshot_block, claim_url, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [aId, cId, k.contract_addr, k.method, k.snapshot_block, k.claim_url, k.notes],
      );
    }
    console.log(`✓ Seeded ${known.length} known contracts.`);
  }

  // Exchange + tool visit codes (independent of airdrops — site-wide CTAs)
  const codesPath = path.join(SEEDS_DIR, "visit_codes.json");
  if (fs.existsSync(codesPath)) {
    interface CodeSeed { code: string; target_url: string; source_label: string; notes?: string; }
    const codes = readJson<CodeSeed[]>("visit_codes.json");
    console.log(`Seeding ${codes.length} visit codes…`);
    for (const c of codes) {
      await conn.query(
        `INSERT INTO visit_codes (code, target_url, airdrop_id, source_label)
         VALUES (?, ?, NULL, ?)
         ON DUPLICATE KEY UPDATE
           target_url   = VALUES(target_url),
           source_label = VALUES(source_label)`,
        [c.code, c.target_url, c.source_label],
      );
    }
    console.log(`✓ Seeded ${codes.length} visit codes.`);
  }

  // Guides (optional — only loads if seeds/guides.json exists)
  const guidesPath = path.join(SEEDS_DIR, "guides.json");
  if (fs.existsSync(guidesPath)) {
    const guides = readJson<GuideSeed[]>("guides.json");
    console.log(`Seeding ${guides.length} guides…`);
    for (const g of guides) {
      await conn.query(
        `INSERT INTO guides (slug, title, excerpt, body_md, published_at)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           title = VALUES(title),
           excerpt = VALUES(excerpt),
           body_md = VALUES(body_md),
           published_at = VALUES(published_at)`,
        [g.slug, g.title, g.excerpt, g.body_md, g.published_at],
      );
    }
    console.log(`✓ Seeded ${guides.length} guides.`);
  }

  await conn.end();
  console.log(`✓ Seeded ${airdrops.length} airdrops, ${chains.length} chains, ${categories.length} categories.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
