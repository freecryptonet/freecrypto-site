import mysql, { type Pool, type RowDataPacket } from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL || "";

let cachedPool: Pool | null = null;

export function getPool(): Pool | null {
  if (cachedPool) return cachedPool;
  if (!DATABASE_URL) return null;
  cachedPool = mysql.createPool({
    uri: DATABASE_URL,
    connectionLimit: 8,
    waitForConnections: true,
    queueLimit: 0,
    dateStrings: false,
  });
  return cachedPool;
}

export type SqlFn = ((
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<Record<string, unknown>[]>) & { _isSqlFn: true };

function maybeParseJson(v: unknown): unknown {
  if (typeof v !== "string") return v;
  const t = v.trim();
  if (!t) return v;
  const c = t[0];
  if (c !== "{" && c !== "[") return v;
  try {
    return JSON.parse(t);
  } catch {
    return v;
  }
}

function reviveJsonColumns(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(row)) out[k] = maybeParseJson(row[k]);
  return out;
}

export function getDb(): SqlFn | null {
  const pool = getPool();
  if (!pool) return null;
  const fn = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    let q = "";
    for (let i = 0; i < strings.length; i++) {
      q += strings[i];
      if (i < values.length) q += "?";
    }
    const [rows] = await pool.query<RowDataPacket[]>(q, values);
    if (!Array.isArray(rows)) return [];
    return (rows as unknown as Record<string, unknown>[]).map(reviveJsonColumns);
  }) as SqlFn;
  fn._isSqlFn = true;
  return fn;
}

export async function dbPing(): Promise<{ ok: boolean; message: string }> {
  const sql = getDb();
  if (!sql) return { ok: false, message: "DATABASE_URL not set" };
  try {
    const rows = await sql`SELECT 1 AS ok`;
    return { ok: rows.length === 1, message: "ok" };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

export type AirdropStatus =
  | "confirmed"
  | "potential"
  | "snapshot"
  | "live"
  | "ended";

export interface AirdropListItem {
  id: number;
  slug: string;
  name: string;
  token_symbol: string | null;
  logo_url: string | null;
  status: AirdropStatus;
  chain_slug: string | null;
  chain_name: string | null;
  category_slug: string | null;
  category_name: string | null;
  kyc_required: boolean;
  funding_raised_usd: number | null;
  estimated_value_usd_min: number | null;
  estimated_value_usd_max: number | null;
  social_score: number | null;
  end_date: Date | null;
  updated_at: Date;
  short_description: string | null;
}

export interface AirdropDetail extends AirdropListItem {
  description_md: string;
  eligibility_md: string;
  how_to_claim_md: string;
  project_url: string | null;
  twitter_url: string | null;
  discord_url: string | null;
  snapshot_date: Date | null;
  started_at: Date | null;
  primary_cta_visit_code: string | null;
  faqs: Array<{ question: string; answer_md: string }>;
}

export interface AirdropFilters {
  chainSlug?: string;
  categorySlug?: string;
  status?: AirdropStatus;
  kycOnly?: "yes" | "no";
  sort?: "newest" | "ending-soon" | "highest-value" | "highest-funding";
  limit?: number;
  offset?: number;
}

const BASE_SELECT = `
  SELECT
    a.id, a.slug, a.name, a.token_symbol, a.logo_url, a.status,
    a.kyc_required, a.funding_raised_usd,
    a.estimated_value_usd_min, a.estimated_value_usd_max,
    a.social_score, a.end_date, a.updated_at, a.short_description,
    c.slug AS chain_slug, c.name AS chain_name,
    cat.slug AS category_slug, cat.name AS category_name
  FROM airdrops a
  LEFT JOIN chains c ON c.id = a.chain_id
  LEFT JOIN categories cat ON cat.id = a.category_id
`;

export async function listAirdrops(filters: AirdropFilters = {}): Promise<AirdropListItem[]> {
  const sql = getDb();
  if (!sql) return [];
  const limit = Math.min(Math.max(filters.limit ?? 60, 1), 200);
  const offset = Math.max(filters.offset ?? 0, 0);

  const whereParts: string[] = ["a.deleted_at IS NULL"];
  const params: unknown[] = [];

  if (filters.chainSlug) {
    whereParts.push("c.slug = ?");
    params.push(filters.chainSlug);
  }
  if (filters.categorySlug) {
    whereParts.push("cat.slug = ?");
    params.push(filters.categorySlug);
  }
  if (filters.status) {
    whereParts.push("a.status = ?");
    params.push(filters.status);
  }
  if (filters.kycOnly === "yes") {
    whereParts.push("a.kyc_required = 1");
  } else if (filters.kycOnly === "no") {
    whereParts.push("a.kyc_required = 0");
  }

  const orderBy = (() => {
    switch (filters.sort) {
      case "ending-soon":
        return "a.end_date IS NULL, a.end_date ASC";
      case "highest-value":
        return "COALESCE(a.estimated_value_usd_max, a.estimated_value_usd_min) DESC";
      case "highest-funding":
        return "a.funding_raised_usd DESC";
      case "newest":
      default:
        return "a.created_at DESC";
    }
  })();

  const q = `${BASE_SELECT}
    WHERE ${whereParts.join(" AND ")}
    ORDER BY ${orderBy}
    LIMIT ${limit} OFFSET ${offset}`;

  try {
    const pool = getPool();
    if (!pool) return [];
    const [rows] = await pool.query<RowDataPacket[]>(q, params);
    return (rows as unknown as AirdropListItem[]).map((r) => ({
      ...r,
      kyc_required: !!r.kyc_required,
      end_date: r.end_date ? new Date(r.end_date) : null,
      updated_at: new Date(r.updated_at),
    }));
  } catch {
    return [];
  }
}

export async function getAirdropBySlug(slug: string): Promise<AirdropDetail | null> {
  const pool = getPool();
  if (!pool) return null;
  try {
    const q = `
      SELECT
        a.id, a.slug, a.name, a.token_symbol, a.logo_url, a.status,
        a.kyc_required, a.funding_raised_usd,
        a.estimated_value_usd_min, a.estimated_value_usd_max,
        a.social_score, a.end_date, a.updated_at, a.short_description,
        a.description_md, a.eligibility_md, a.how_to_claim_md,
        a.project_url, a.twitter_url, a.discord_url,
        a.snapshot_date, a.started_at, a.primary_cta_visit_code,
        c.slug AS chain_slug, c.name AS chain_name,
        cat.slug AS category_slug, cat.name AS category_name
      FROM airdrops a
      LEFT JOIN chains c ON c.id = a.chain_id
      LEFT JOIN categories cat ON cat.id = a.category_id
      WHERE a.slug = ? AND a.deleted_at IS NULL
      LIMIT 1
    `;
    const [airdropRows] = await pool.query<RowDataPacket[]>(q, [slug]);
    const arr = airdropRows as unknown as Array<AirdropDetail & RowDataPacket>;
    if (arr.length === 0) return null;
    const row = arr[0];
    const [faqRows] = await pool.query<RowDataPacket[]>(
      "SELECT question, answer_md FROM faqs WHERE airdrop_id = ? ORDER BY position ASC",
      [row.id],
    );
    return {
      ...row,
      kyc_required: !!row.kyc_required,
      end_date: row.end_date ? new Date(row.end_date) : null,
      snapshot_date: row.snapshot_date ? new Date(row.snapshot_date) : null,
      started_at: row.started_at ? new Date(row.started_at) : null,
      updated_at: new Date(row.updated_at),
      faqs: faqRows as unknown as Array<{ question: string; answer_md: string }>,
    };
  } catch {
    return null;
  }
}

export async function listAirdropsWithDeadlines(limit = 100): Promise<AirdropListItem[]> {
  const pool = getPool();
  if (!pool) return [];
  const q = `${BASE_SELECT}
    WHERE a.deleted_at IS NULL
      AND a.end_date IS NOT NULL
      AND a.end_date >= NOW()
      AND a.status != 'ended'
    ORDER BY a.end_date ASC
    LIMIT ${Math.min(Math.max(limit, 1), 500)}`;
  try {
    const [rows] = await pool.query<RowDataPacket[]>(q);
    return (rows as unknown as AirdropListItem[]).map((r) => ({
      ...r,
      kyc_required: !!r.kyc_required,
      end_date: r.end_date ? new Date(r.end_date) : null,
      updated_at: new Date(r.updated_at),
    }));
  } catch {
    return [];
  }
}

export interface ChainRow {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  airdrop_count: number;
}

export async function listChains(): Promise<ChainRow[]> {
  const pool = getPool();
  if (!pool) return [];
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT c.id, c.slug, c.name, c.description,
        COUNT(a.id) AS airdrop_count
      FROM chains c
      LEFT JOIN airdrops a ON a.chain_id = c.id AND a.deleted_at IS NULL
      GROUP BY c.id
      ORDER BY airdrop_count DESC, c.name ASC
    `);
    return rows as unknown as ChainRow[];
  } catch {
    return [];
  }
}

export interface CategoryRow {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  airdrop_count: number;
}

export async function listCategories(): Promise<CategoryRow[]> {
  const pool = getPool();
  if (!pool) return [];
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT cat.id, cat.slug, cat.name, cat.description,
        COUNT(a.id) AS airdrop_count
      FROM categories cat
      LEFT JOIN airdrops a ON a.category_id = cat.id AND a.deleted_at IS NULL
      GROUP BY cat.id
      ORDER BY airdrop_count DESC, cat.name ASC
    `);
    return rows as unknown as CategoryRow[];
  } catch {
    return [];
  }
}

export interface VisitCodeTarget {
  target_url: string;
  airdrop_id: number | null;
  source_label: string | null;
}

export async function resolveVisitCode(code: string): Promise<VisitCodeTarget | null> {
  const pool = getPool();
  if (!pool) return null;
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT target_url, airdrop_id, source_label FROM visit_codes WHERE code = ? LIMIT 1",
      [code],
    );
    const arr = rows as unknown as VisitCodeTarget[];
    return arr[0] ?? null;
  } catch {
    return null;
  }
}

export interface GuideListItem {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_url: string | null;
  published_at: Date | null;
  updated_at: Date;
}

export interface GuideDetail extends GuideListItem {
  body_md: string;
}

export async function listGuides(limit = 50): Promise<GuideListItem[]> {
  const pool = getPool();
  if (!pool) return [];
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT id, slug, title, excerpt, cover_url, published_at, updated_at
      FROM guides
      WHERE published_at IS NOT NULL AND published_at <= NOW()
      ORDER BY published_at DESC
      LIMIT ${Math.min(Math.max(limit, 1), 200)}
    `);
    return (rows as unknown as GuideListItem[]).map((r) => ({
      ...r,
      published_at: r.published_at ? new Date(r.published_at) : null,
      updated_at: new Date(r.updated_at),
    }));
  } catch {
    return [];
  }
}

export async function getGuideBySlug(slug: string): Promise<GuideDetail | null> {
  const pool = getPool();
  if (!pool) return null;
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, slug, title, excerpt, body_md, cover_url, published_at, updated_at
       FROM guides
       WHERE slug = ? AND published_at IS NOT NULL AND published_at <= NOW()
       LIMIT 1`,
      [slug],
    );
    const arr = rows as unknown as GuideDetail[];
    if (arr.length === 0) return null;
    const r = arr[0];
    return {
      ...r,
      published_at: r.published_at ? new Date(r.published_at) : null,
      updated_at: new Date(r.updated_at),
    };
  } catch {
    return null;
  }
}

/**
 * Sitemap-only: return slug + lastmod + total content length for every
 * airdrop. Lets sitemap.ts filter out thin pages (Google skips them anyway,
 * and including them wastes crawl budget on URLs that get demoted as
 * low-value rather than indexed).
 */
export interface SitemapAirdropRow {
  slug: string;
  updated_at: Date;
  content_chars: number;
}
export async function listAirdropSlugsForSitemap(): Promise<SitemapAirdropRow[]> {
  const pool = getPool();
  if (!pool) return [];
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT slug, updated_at,
        (CHAR_LENGTH(description_md) + CHAR_LENGTH(eligibility_md) + CHAR_LENGTH(how_to_claim_md)) AS content_chars
      FROM airdrops
      WHERE deleted_at IS NULL
      ORDER BY updated_at DESC
    `);
    return (rows as unknown as Array<{ slug: string; updated_at: string | Date; content_chars: number }>).map((r) => ({
      slug: r.slug,
      updated_at: new Date(r.updated_at),
      content_chars: Number(r.content_chars) || 0,
    }));
  } catch {
    return [];
  }
}

export interface SitemapGuideRow {
  slug: string;
  updated_at: Date;
  content_chars: number;
}
export async function listGuideSlugsForSitemap(): Promise<SitemapGuideRow[]> {
  const pool = getPool();
  if (!pool) return [];
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT slug, updated_at,
        (CHAR_LENGTH(body_md) + CHAR_LENGTH(COALESCE(excerpt, ''))) AS content_chars
      FROM guides
      WHERE published_at IS NOT NULL AND published_at <= NOW()
      ORDER BY updated_at DESC
    `);
    return (rows as unknown as Array<{ slug: string; updated_at: string | Date; content_chars: number }>).map((r) => ({
      slug: r.slug,
      updated_at: new Date(r.updated_at),
      content_chars: Number(r.content_chars) || 0,
    }));
  } catch {
    return [];
  }
}

export async function logVisitClick(args: {
  code: string;
  ipHash: string;
  referrer: string | null;
  uaHash: string;
}): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  try {
    await pool.query(
      `INSERT INTO click_log (code, ip_hash, referrer, ua_hash, clicked_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [args.code, args.ipHash, args.referrer, args.uaHash],
    );
  } catch {
    // best-effort
  }
}

// ============================================================
// stores (earn-hub shop-to-earn engine)
// ============================================================
export type CashbackKind = "percent" | "sats" | "discount" | "unknown";
export type GeoScope = "global" | "eu" | "nl" | "other";

export interface StoreListItem {
  id: number;
  slug: string;
  name: string;
  logo_url: string | null;
  cashback_text: string | null;
  cashback_kind: CashbackKind;
  cashback_value: number | null;
  category_slug: string | null;
  category_name: string | null;
  geo_scope: GeoScope;
  is_bitcoin_native: boolean;
  updated_at: Date;
}

export interface StoreDetail extends StoreListItem {
  description_md: string;
  how_it_works_md: string;
  worth_it_md: string;
  satsback_slug: string | null;
  /** Whether published content exists in each language (for hreflang + guards). */
  has_en: boolean;
  has_nl: boolean;
  faqs: Array<{ question: string; answer_md: string }>;
}

export interface StoreCategoryRow {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  store_count: number;
}

export interface StoreFilters {
  categorySlug?: string;
  geo?: GeoScope;
  bitcoinNative?: boolean;
  sort?: "rate" | "name";
  limit?: number;
  offset?: number;
  /** Restrict to stores that have published content in this language. */
  contentLang?: "en" | "nl";
}

/** SQL fragment: does the store have content in `lang`? */
function contentLenExpr(lang: "en" | "nl"): string {
  return lang === "nl" ? "CHAR_LENGTH(s.description_nl_md)" : "CHAR_LENGTH(s.description_md)";
}

const STORE_BASE_SELECT = `
  SELECT
    s.id, s.slug, s.name, s.logo_url, s.cashback_text, s.cashback_kind,
    s.cashback_value, s.category_slug, s.geo_scope, s.is_bitcoin_native, s.updated_at,
    sc.name AS category_name
  FROM stores s
  LEFT JOIN store_categories sc ON sc.slug = s.category_slug
`;

function mapStoreRow(r: Record<string, unknown>): StoreListItem {
  return {
    id: Number(r.id),
    slug: String(r.slug),
    name: String(r.name),
    logo_url: (r.logo_url as string) ?? null,
    cashback_text: (r.cashback_text as string) ?? null,
    cashback_kind: (r.cashback_kind as CashbackKind) ?? "unknown",
    cashback_value: r.cashback_value == null ? null : Number(r.cashback_value),
    category_slug: (r.category_slug as string) ?? null,
    category_name: (r.category_name as string) ?? null,
    geo_scope: (r.geo_scope as GeoScope) ?? "global",
    is_bitcoin_native: !!r.is_bitcoin_native,
    updated_at: new Date(r.updated_at as string),
  };
}

export async function listStores(f: StoreFilters = {}): Promise<StoreListItem[]> {
  const pool = getPool();
  if (!pool) return [];
  const limit = Math.min(Math.max(f.limit ?? 60, 1), 200);
  const offset = Math.max(f.offset ?? 0, 0);
  const where: string[] = ["s.deleted_at IS NULL"];
  const params: unknown[] = [];
  if (f.categorySlug) { where.push("s.category_slug = ?"); params.push(f.categorySlug); }
  if (f.geo) { where.push("s.geo_scope = ?"); params.push(f.geo); }
  if (f.bitcoinNative != null) { where.push("s.is_bitcoin_native = ?"); params.push(f.bitcoinNative ? 1 : 0); }
  if (f.contentLang) { where.push(`${contentLenExpr(f.contentLang)} >= 1`); }
  const orderBy = f.sort === "name"
    ? "s.name ASC"
    : "(s.cashback_kind = 'percent') DESC, s.cashback_value DESC, s.name ASC";
  const q = `${STORE_BASE_SELECT} WHERE ${where.join(" AND ")} ORDER BY ${orderBy} LIMIT ${limit} OFFSET ${offset}`;
  try {
    const [rows] = await pool.query<RowDataPacket[]>(q, params);
    return (rows as unknown as Record<string, unknown>[]).map(mapStoreRow);
  } catch {
    return [];
  }
}

export async function getStoreBySlug(slug: string, lang: "en" | "nl" = "en"): Promise<StoreDetail | null> {
  const pool = getPool();
  if (!pool) return null;
  const contentCols = lang === "nl"
    ? "s.description_nl_md AS description_md, s.how_it_works_nl_md AS how_it_works_md, s.worth_it_nl_md AS worth_it_md"
    : "s.description_md, s.how_it_works_md, s.worth_it_md";
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT s.id, s.slug, s.name, s.logo_url, s.cashback_text, s.cashback_kind,
              s.cashback_value, s.category_slug, s.geo_scope, s.is_bitcoin_native, s.updated_at,
              ${contentCols}, s.satsback_slug,
              CHAR_LENGTH(s.description_md) AS len_en, CHAR_LENGTH(s.description_nl_md) AS len_nl,
              sc.name AS category_name
       FROM stores s
       LEFT JOIN store_categories sc ON sc.slug = s.category_slug
       WHERE s.slug = ? AND s.deleted_at IS NULL LIMIT 1`,
      [slug],
    );
    const arr = rows as unknown as Record<string, unknown>[];
    if (arr.length === 0) return null;
    const base = mapStoreRow(arr[0]);
    const [faqRows] = await pool.query<RowDataPacket[]>(
      "SELECT question, answer_md FROM faqs WHERE store_id = ? AND lang = ? ORDER BY position ASC",
      [base.id, lang],
    );
    return {
      ...base,
      description_md: String(arr[0].description_md ?? ""),
      how_it_works_md: String(arr[0].how_it_works_md ?? ""),
      worth_it_md: String(arr[0].worth_it_md ?? ""),
      satsback_slug: (arr[0].satsback_slug as string) ?? null,
      has_en: (Number(arr[0].len_en) || 0) > 0,
      has_nl: (Number(arr[0].len_nl) || 0) > 0,
      faqs: faqRows as unknown as Array<{ question: string; answer_md: string }>,
    };
  } catch {
    return null;
  }
}

export async function listStoreCategories(contentLang?: "en" | "nl"): Promise<StoreCategoryRow[]> {
  const pool = getPool();
  if (!pool) return [];
  const contentFilter = contentLang ? `AND ${contentLenExpr(contentLang)} >= 1` : "";
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT sc.id, sc.slug, sc.name, sc.description,
        COUNT(s.id) AS store_count
      FROM store_categories sc
      LEFT JOIN stores s ON s.category_slug = sc.slug AND s.deleted_at IS NULL ${contentFilter}
      GROUP BY sc.id
      ORDER BY sc.sort_order ASC, sc.name ASC
    `);
    return (rows as unknown as Array<Record<string, unknown>>).map((r) => ({
      id: Number(r.id), slug: String(r.slug), name: String(r.name),
      description: (r.description as string) ?? null, store_count: Number(r.store_count) || 0,
    }));
  } catch {
    return [];
  }
}

export interface SitemapStoreRow { slug: string; updated_at: Date; content_chars: number }
export async function listStoreSlugsForSitemap(lang: "en" | "nl" = "en"): Promise<SitemapStoreRow[]> {
  const pool = getPool();
  if (!pool) return [];
  const cols = lang === "nl"
    ? "(CHAR_LENGTH(description_nl_md) + CHAR_LENGTH(how_it_works_nl_md) + CHAR_LENGTH(worth_it_nl_md))"
    : "(CHAR_LENGTH(description_md) + CHAR_LENGTH(how_it_works_md) + CHAR_LENGTH(worth_it_md))";
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT slug, updated_at,
        ${cols} AS content_chars
      FROM stores WHERE deleted_at IS NULL ORDER BY updated_at DESC
    `);
    return (rows as unknown as Array<{ slug: string; updated_at: string; content_chars: number }>).map((r) => ({
      slug: r.slug, updated_at: new Date(r.updated_at), content_chars: Number(r.content_chars) || 0,
    }));
  } catch {
    return [];
  }
}
