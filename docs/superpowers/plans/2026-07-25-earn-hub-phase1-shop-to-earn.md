# Earn-Hub Phase 1 — Shop-to-Earn Engine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Satsback "shop-to-earn" content engine on freecrypto.net — a `stores` data model, a repeatable Satsback scraper, differentiated store + category pages, and Satsback referral monetization — as the first slice of the earn-hub pivot.

**Architecture:** Reuse the existing Next.js 16 App Router + MariaDB (`mysql2` template-tag layer in `src/lib/db.ts`) + the `/visit/[code]` affiliate redirector + the `isAirdropIndexable` quality gate. Add one table (`stores`), one pure cashback parser, a Playwright scraper that writes a committed JSON seed, an assisted content builder, and three new routes under `/shop`. Store pages must clear a real value bar (original copy + facts + comparison + FAQ), not a template dump — this is what prevents repeating v1's helpful-content demotion.

**Tech Stack:** Next.js 16, React 19, TypeScript, MariaDB 10.6+ (`mysql2/promise`), `tsx` script runner, `marked` for Markdown, Tailwind. **New devDeps:** `vitest` (unit tests), `playwright` (scraper).

## Global Constraints

- **Node app runs on the VPS, not the Business plan.** Migrations/seeds run on the VPS where the DB is local (`sudo -u deploy bash -lc 'cd /home/deploy/freecrypto && ...'`). Local runs need the MariaDB SSH tunnel + `DATABASE_URL`.
- **Verification is `npx tsc --noEmit` + `npx vitest run` + `npx next build`.** No CI test stage exists yet; these are the gates.
- **Indexability gate = 800 chars** (`MIN_INDEXABLE_DESCRIPTION_CHARS` in `src/lib/seo.ts`) — the single source of truth for sitemap inclusion + escaping `noindex`. Reuse it; do not fork the constant.
- **Mobile grid rule:** every grid container MUST start with `grid-cols-1` before `sm:grid-cols-2 …` (CSS Grid `auto` tracks otherwise size to A-Ads' 728px intrinsic width and overflow the viewport).
- **`next start` ignores `PORT`** — irrelevant to this plan (no entrypoint change), noted so no one "fixes" it.
- **Legal posture (Feist):** facts only (store name, cashback rate, logo from the store's own brand assets) + our original prose + honest outbound attribution to Satsback. Never copy Satsback's descriptions verbatim.
- **Satsback referral code:** `ozBlyPnj26PY19ve` → `https://satsback.com/register/ozBlyPnj26PY19ve` (confirm with Tim before baking into a seed).
- **Branch:** all work on `feat/earn-hub-pivot`. Do not push to `main` (push triggers deploy) until Tim approves.

---

### Task 1: Cashback parser + vitest harness

**Files:**
- Create: `src/lib/stores/cashback.ts`
- Create: `src/lib/stores/cashback.test.ts`
- Modify: `package.json` (add `vitest` devDep + `test` script)
- Create: `vitest.config.ts`

**Interfaces:**
- Produces: `type CashbackKind = 'percent' | 'sats' | 'discount' | 'unknown'`; `interface ParsedCashback { text: string; kind: CashbackKind; value: number | null }`; `function parseCashback(raw: string): ParsedCashback`. Consumed by Task 6 (scraper) and Task 7 (content builder) and Task 8 (display).

Satsback labels seen live: `"up to 2.7%"`, `"up to 1%"`, `"up to 20%"`, `"up to 7.975 sats"`, `"up to 38.280 sats"` (European `.` = thousands separator for sats), `"5% discount code"`, `"€5 discount code"`, `"100% discount code"`, `"1 free month"`.

- [ ] **Step 1: Add vitest + test script**

In `package.json`, add to `devDependencies`: `"vitest": "^2.1.0"`. Add to `scripts`: `"test": "vitest run"`. Then run `npm install`.

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
```

- [ ] **Step 3: Write the failing test**

`src/lib/stores/cashback.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { parseCashback } from "./cashback";

describe("parseCashback", () => {
  it("parses a percent rate", () => {
    expect(parseCashback("up to 2.7%")).toEqual({ text: "up to 2.7%", kind: "percent", value: 2.7 });
  });
  it("parses an integer percent", () => {
    expect(parseCashback("up to 20%")).toEqual({ text: "up to 20%", kind: "percent", value: 20 });
  });
  it("parses sats with a European thousands separator", () => {
    expect(parseCashback("up to 38.280 sats")).toEqual({ text: "up to 38.280 sats", kind: "sats", value: 38280 });
  });
  it("parses small sats", () => {
    expect(parseCashback("up to 7.975 sats")).toEqual({ text: "up to 7.975 sats", kind: "sats", value: 7975 });
  });
  it("classifies a percent discount code as discount", () => {
    expect(parseCashback("5% discount code")).toEqual({ text: "5% discount code", kind: "discount", value: 5 });
  });
  it("parses a euro discount", () => {
    expect(parseCashback("€5 discount code")).toEqual({ text: "€5 discount code", kind: "discount", value: 5 });
  });
  it("parses a free-months perk as discount", () => {
    expect(parseCashback("1 free month")).toEqual({ text: "1 free month", kind: "discount", value: 1 });
  });
  it("returns unknown for empty input", () => {
    expect(parseCashback("")).toEqual({ text: "", kind: "unknown", value: null });
  });
});
```

- [ ] **Step 4: Run the test, verify it fails**

Run: `npx vitest run src/lib/stores/cashback.test.ts`
Expected: FAIL — cannot find module `./cashback`.

- [ ] **Step 5: Implement the parser**

`src/lib/stores/cashback.ts`:
```ts
export type CashbackKind = "percent" | "sats" | "discount" | "unknown";

export interface ParsedCashback {
  /** Verbatim label as shown by the source, for display. */
  text: string;
  kind: CashbackKind;
  /** Numeric value: percent (2.7), whole sats (38280), or discount amount (5). null if unparseable. */
  value: number | null;
}

function firstNumber(s: string, stripThousands: boolean): number | null {
  const m = s.match(/\d[\d.,]*/);
  if (!m) return null;
  let n = m[0];
  if (stripThousands) n = n.replace(/[.,]/g, ""); // "38.280" -> "38280"
  const parsed = stripThousands ? parseInt(n, 10) : parseFloat(n.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseCashback(raw: string): ParsedCashback {
  const text = (raw ?? "").trim();
  if (!text) return { text, kind: "unknown", value: null };
  const lower = text.toLowerCase();
  const isDiscount = lower.includes("discount") || lower.includes("free") || lower.includes("€");

  if (lower.includes("%")) {
    return { text, kind: isDiscount ? "discount" : "percent", value: firstNumber(text, false) };
  }
  if (lower.includes("sats") || lower.includes("sat ")) {
    return { text, kind: "sats", value: firstNumber(text, true) };
  }
  if (isDiscount) {
    return { text, kind: "discount", value: firstNumber(text, false) };
  }
  return { text, kind: "unknown", value: null };
}
```

- [ ] **Step 6: Run the test, verify it passes**

Run: `npx vitest run src/lib/stores/cashback.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/lib/stores/cashback.ts src/lib/stores/cashback.test.ts
git commit -m "feat(stores): cashback label parser + vitest harness"
```

---

### Task 2: `stores` table migration

**Files:**
- Create: `migrations/007_stores.sql`

**Interfaces:**
- Produces: table `stores` (columns per spec §5) and column `faqs.store_id INT NULL`. Consumed by Tasks 4, 5, 7, 8.

- [ ] **Step 1: Write the migration**

`migrations/007_stores.sql`:
```sql
-- freecrypto.net — 007: shop-to-earn stores (earn-hub pivot Phase 1)
-- Idempotent: CREATE IF NOT EXISTS; column add guarded below.
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS stores (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  slug              VARCHAR(120) NOT NULL,
  name              VARCHAR(180) NOT NULL,
  logo_url          VARCHAR(500) NULL,
  satsback_slug     VARCHAR(160) NULL,
  cashback_text     VARCHAR(120) NULL,
  cashback_kind     ENUM('percent','sats','discount','unknown') NOT NULL DEFAULT 'unknown',
  cashback_value    DECIMAL(10,3) NULL,
  category_slug     VARCHAR(60) NULL,
  geo_scope         ENUM('global','eu','nl','other') NOT NULL DEFAULT 'global',
  is_bitcoin_native TINYINT(1) NOT NULL DEFAULT 0,
  description_md    MEDIUMTEXT NOT NULL DEFAULT '',
  how_it_works_md   MEDIUMTEXT NOT NULL DEFAULT '',
  worth_it_md       MEDIUMTEXT NOT NULL DEFAULT '',
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at        DATETIME NULL,
  UNIQUE KEY uniq_store_slug (slug),
  KEY idx_store_category (category_slug),
  KEY idx_store_geo (geo_scope)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- store_categories (our own taxonomy for shop hubs)
CREATE TABLE IF NOT EXISTS store_categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  slug        VARCHAR(60)  NOT NULL,
  name        VARCHAR(120) NOT NULL,
  description TEXT NULL,
  sort_order  INT NOT NULL DEFAULT 100,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_store_category_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add faqs.store_id so the existing faqs table serves stores too.
-- Guard the ADD COLUMN so re-running is safe on MariaDB.
SET @col := (SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'faqs' AND column_name = 'store_id');
SET @ddl := IF(@col = 0,
  'ALTER TABLE faqs ADD COLUMN store_id INT NULL, ADD KEY idx_faq_store (store_id, position)',
  'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
```

- [ ] **Step 2: Apply the migration locally (tunnel up) and verify**

Run: `npx tsx scripts/migrate.ts` (this runner applies `migrations/*.sql` in order — confirm it picks up `007`).
Then verify: connect and run `DESCRIBE stores;` — expect the columns above; `SHOW COLUMNS FROM faqs LIKE 'store_id';` returns one row.
Expected: no errors; `stores` + `store_categories` exist; `faqs.store_id` present.

- [ ] **Step 3: Commit**

```bash
git add migrations/007_stores.sql
git commit -m "feat(db): stores + store_categories tables, faqs.store_id"
```

---

### Task 3: `isStoreIndexable` gate

**Files:**
- Modify: `src/lib/seo.ts` (append)
- Create: `src/lib/seo.test.ts`

**Interfaces:**
- Consumes: `MIN_INDEXABLE_DESCRIPTION_CHARS` (already exported from `src/lib/seo.ts`).
- Produces: `function isStoreIndexable(s: { description_md: string; how_it_works_md?: string; worth_it_md?: string }): boolean`. Consumed by Tasks 8 (page metadata) and 9 (sitemap).

- [ ] **Step 1: Write the failing test**

`src/lib/seo.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { isStoreIndexable } from "./seo";

describe("isStoreIndexable", () => {
  it("is false for thin content", () => {
    expect(isStoreIndexable({ description_md: "short", how_it_works_md: "", worth_it_md: "" })).toBe(false);
  });
  it("is true once combined content clears 800 chars", () => {
    const big = "x".repeat(500);
    expect(isStoreIndexable({ description_md: big, how_it_works_md: big, worth_it_md: "" })).toBe(true);
  });
  it("sums all three fields", () => {
    const chunk = "y".repeat(300);
    expect(isStoreIndexable({ description_md: chunk, how_it_works_md: chunk, worth_it_md: chunk })).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `npx vitest run src/lib/seo.test.ts`
Expected: FAIL — `isStoreIndexable` is not exported.

- [ ] **Step 3: Implement (append to `src/lib/seo.ts`)**

```ts
export function isStoreIndexable(s: {
  description_md: string;
  how_it_works_md?: string;
  worth_it_md?: string;
}): boolean {
  const total =
    (s.description_md?.length ?? 0) +
    (s.how_it_works_md?.length ?? 0) +
    (s.worth_it_md?.length ?? 0);
  return total >= MIN_INDEXABLE_DESCRIPTION_CHARS;
}
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `npx vitest run src/lib/seo.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/seo.ts src/lib/seo.test.ts
git commit -m "feat(seo): isStoreIndexable gate (reuses 800-char threshold)"
```

---

### Task 4: Store query layer

**Files:**
- Modify: `src/lib/db.ts` (append; follow the existing `listGuides`/`getGuideBySlug` patterns exactly — `getPool()` guard, `try/catch` → `[]`/`null`, `new Date(...)` remapping)

**Interfaces:**
- Produces:
  - `interface StoreListItem { id:number; slug:string; name:string; logo_url:string|null; cashback_text:string|null; cashback_kind:'percent'|'sats'|'discount'|'unknown'; cashback_value:number|null; category_slug:string|null; category_name:string|null; geo_scope:'global'|'eu'|'nl'|'other'; is_bitcoin_native:boolean; updated_at:Date }`
  - `interface StoreDetail extends StoreListItem { description_md:string; how_it_works_md:string; worth_it_md:string; satsback_slug:string|null; faqs:Array<{question:string; answer_md:string}> }`
  - `interface StoreCategoryRow { id:number; slug:string; name:string; description:string|null; store_count:number }`
  - `interface StoreFilters { categorySlug?:string; geo?:'global'|'eu'|'nl'|'other'; bitcoinNative?:boolean; sort?:'rate'|'name'; limit?:number; offset?:number }`
  - `async function listStores(f?:StoreFilters):Promise<StoreListItem[]>`
  - `async function getStoreBySlug(slug:string):Promise<StoreDetail|null>`
  - `async function listStoreCategories():Promise<StoreCategoryRow[]>`
  - `interface SitemapStoreRow { slug:string; updated_at:Date; content_chars:number }`
  - `async function listStoreSlugsForSitemap():Promise<SitemapStoreRow[]>`
- Consumed by Tasks 8, 9.

- [ ] **Step 1: Append the store types + queries to `src/lib/db.ts`**

```ts
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

export async function getStoreBySlug(slug: string): Promise<StoreDetail | null> {
  const pool = getPool();
  if (!pool) return null;
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT s.id, s.slug, s.name, s.logo_url, s.cashback_text, s.cashback_kind,
              s.cashback_value, s.category_slug, s.geo_scope, s.is_bitcoin_native, s.updated_at,
              s.description_md, s.how_it_works_md, s.worth_it_md, s.satsback_slug,
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
      "SELECT question, answer_md FROM faqs WHERE store_id = ? ORDER BY position ASC",
      [base.id],
    );
    return {
      ...base,
      description_md: String(arr[0].description_md ?? ""),
      how_it_works_md: String(arr[0].how_it_works_md ?? ""),
      worth_it_md: String(arr[0].worth_it_md ?? ""),
      satsback_slug: (arr[0].satsback_slug as string) ?? null,
      faqs: faqRows as unknown as Array<{ question: string; answer_md: string }>,
    };
  } catch {
    return null;
  }
}

export async function listStoreCategories(): Promise<StoreCategoryRow[]> {
  const pool = getPool();
  if (!pool) return [];
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT sc.id, sc.slug, sc.name, sc.description,
        COUNT(s.id) AS store_count
      FROM store_categories sc
      LEFT JOIN stores s ON s.category_slug = sc.slug AND s.deleted_at IS NULL
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
export async function listStoreSlugsForSitemap(): Promise<SitemapStoreRow[]> {
  const pool = getPool();
  if (!pool) return [];
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT slug, updated_at,
        (CHAR_LENGTH(description_md) + CHAR_LENGTH(how_it_works_md) + CHAR_LENGTH(worth_it_md)) AS content_chars
      FROM stores WHERE deleted_at IS NULL ORDER BY updated_at DESC
    `);
    return (rows as unknown as Array<{ slug: string; updated_at: string; content_chars: number }>).map((r) => ({
      slug: r.slug, updated_at: new Date(r.updated_at), content_chars: Number(r.content_chars) || 0,
    }));
  } catch {
    return [];
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/db.ts
git commit -m "feat(db): store query layer (list/detail/categories/sitemap)"
```

---

### Task 5: Store taxonomy seed + seed loader wiring

**Files:**
- Create: `seeds/store_categories.json`
- Create: `seeds/stores.json` (start with a 2-row placeholder so the loader path is testable; Task 7 fills it)
- Modify: `scripts/seed.ts` (add store-category + store upsert, following the existing seed patterns)

**Interfaces:**
- Consumes: `stores`, `store_categories` tables (Task 2); `parseCashback` (Task 1).
- Produces: idempotent seeding of stores. The store upsert MUST preserve hand-edited `description_md`/`how_it_works_md`/`worth_it_md` if already non-empty (mirror the airdrop upsert's editorial-preservation behavior).

- [ ] **Step 1: Create `seeds/store_categories.json`**

```json
[
  { "slug": "bitcoin-gear", "name": "Bitcoin Hardware & Gear", "description": "Hardware wallets, nodes, and Bitcoin-native shops that pay you back in sats.", "sort_order": 10 },
  { "slug": "travel", "name": "Travel & Flights", "description": "Book flights, hotels, and stays and earn Bitcoin cashback.", "sort_order": 20 },
  { "slug": "fashion", "name": "Fashion & Apparel", "description": "Clothing and footwear retailers with Bitcoin cashback.", "sort_order": 30 },
  { "slug": "tech-electronics", "name": "Tech & Electronics", "description": "Gadgets, computing, and electronics stores that give BTC back.", "sort_order": 40 },
  { "slug": "marketplaces", "name": "Marketplaces", "description": "Large general marketplaces with Bitcoin cashback.", "sort_order": 50 },
  { "slug": "services", "name": "Services & Software", "description": "VPNs, courses, and online services paying Bitcoin rewards.", "sort_order": 60 },
  { "slug": "groceries-food", "name": "Groceries & Food", "description": "Supermarkets and food delivery with Bitcoin cashback.", "sort_order": 70 },
  { "slug": "health-beauty", "name": "Health & Beauty", "description": "Pharmacies and beauty retailers giving BTC back.", "sort_order": 80 }
]
```

- [ ] **Step 2: Create placeholder `seeds/stores.json`**

```json
[
  {
    "slug": "blockstream-store", "name": "Blockstream Store", "satsback_slug": "blockstream-store",
    "logo_url": null, "cashback_text": "10% discount code", "category_slug": "bitcoin-gear",
    "geo_scope": "global", "is_bitcoin_native": true,
    "description_md": "PLACEHOLDER — filled by scripts/build-store-content.ts in Task 7.",
    "how_it_works_md": "", "worth_it_md": "", "faqs": []
  }
]
```

- [ ] **Step 3: Add the store seed logic to `scripts/seed.ts`**

Locate where the script seeds `categories`/`guides` and add an analogous block. Import the parser at top: `import { parseCashback } from "../src/lib/stores/cashback";`. Then:

```ts
// --- store_categories ---
const storeCats = JSON.parse(fs.readFileSync(path.join(seedsDir, "store_categories.json"), "utf8"));
for (const c of storeCats) {
  await pool.query(
    `INSERT INTO store_categories (slug, name, description, sort_order)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), sort_order = VALUES(sort_order)`,
    [c.slug, c.name, c.description ?? null, c.sort_order ?? 100],
  );
}

// --- stores ---
const stores = JSON.parse(fs.readFileSync(path.join(seedsDir, "stores.json"), "utf8"));
for (const s of stores) {
  const cb = parseCashback(s.cashback_text ?? "");
  // Preserve hand-edited editorial: only overwrite prose when the incoming row provides it.
  await pool.query(
    `INSERT INTO stores
       (slug, name, logo_url, satsback_slug, cashback_text, cashback_kind, cashback_value,
        category_slug, geo_scope, is_bitcoin_native, description_md, how_it_works_md, worth_it_md)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       name = VALUES(name), logo_url = VALUES(logo_url), satsback_slug = VALUES(satsback_slug),
       cashback_text = VALUES(cashback_text), cashback_kind = VALUES(cashback_kind),
       cashback_value = VALUES(cashback_value), category_slug = VALUES(category_slug),
       geo_scope = VALUES(geo_scope), is_bitcoin_native = VALUES(is_bitcoin_native),
       description_md = IF(VALUES(description_md) = '' OR VALUES(description_md) LIKE 'PLACEHOLDER%', description_md, VALUES(description_md)),
       how_it_works_md = IF(VALUES(how_it_works_md) = '', how_it_works_md, VALUES(how_it_works_md)),
       worth_it_md = IF(VALUES(worth_it_md) = '', worth_it_md, VALUES(worth_it_md))`,
    [s.slug, s.name, s.logo_url ?? null, s.satsback_slug ?? null, cb.text || null, cb.kind, cb.value,
     s.category_slug ?? null, s.geo_scope ?? "global", s.is_bitcoin_native ? 1 : 0,
     s.description_md ?? "", s.how_it_works_md ?? "", s.worth_it_md ?? ""],
  );
  const [idRows] = await pool.query("SELECT id FROM stores WHERE slug = ?", [s.slug]);
  const storeId = (idRows as any[])[0]?.id;
  if (storeId && Array.isArray(s.faqs) && s.faqs.length) {
    await pool.query("DELETE FROM faqs WHERE store_id = ?", [storeId]);
    let pos = 0;
    for (const f of s.faqs) {
      await pool.query(
        "INSERT INTO faqs (store_id, position, question, answer_md) VALUES (?, ?, ?, ?)",
        [storeId, pos++, f.question, f.answer_md],
      );
    }
  }
}
console.log(`Seeded ${storeCats.length} store categories, ${stores.length} stores.`);
```

- [ ] **Step 4: Run the seed (tunnel up) and verify**

Run: `npm run seed`
Then: `SELECT slug, cashback_kind, cashback_value FROM stores;` — the placeholder Blockstream row exists with `cashback_kind='discount'`, `cashback_value=10`.
Expected: no errors; store categories + placeholder store present.

- [ ] **Step 5: Commit**

```bash
git add seeds/store_categories.json seeds/stores.json scripts/seed.ts
git commit -m "feat(seed): store taxonomy + store upsert (editorial-preserving)"
```

---

### Task 6: Satsback scraper (Playwright)

**Files:**
- Create: `scripts/scrape-satsback.ts`
- Create: `seeds/stores.raw.json` (output; committed so the pipeline is reproducible without re-scraping)
- Modify: `package.json` (add `playwright` devDep + `scrape:satsback` script)

**Interfaces:**
- Consumes: nothing internal.
- Produces: `seeds/stores.raw.json` — array of `{ satsback_slug, name, cashback_text, logo_url }`, facts only. Consumed by Task 7.

**Note:** Satsback returns 403 to plain fetch but renders under a real browser. Curated set only — do NOT crawl the full 10k catalog; take the popular grid on `/stores` plus any slugs listed in `SEED_SLUGS`.

- [ ] **Step 1: Add Playwright**

In `package.json` add to `devDependencies`: `"playwright": "^1.48.0"`. Add to `scripts`: `"scrape:satsback": "tsx scripts/scrape-satsback.ts"`. Run `npm install` then `npx playwright install chromium`.

- [ ] **Step 2: Write the scraper**

`scripts/scrape-satsback.ts`:
```ts
/**
 * Curated Satsback store scraper. Facts only (name, slug, cashback label, logo).
 * Writes seeds/stores.raw.json. Run locally (needs a browser), not on the VPS.
 *   npm run scrape:satsback
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

interface RawStore { satsback_slug: string; name: string; cashback_text: string | null; logo_url: string | null }

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ userAgent: "Mozilla/5.0 (compatible; freecrypto-research/1.0)" });
  await page.goto("https://satsback.com/stores", { waitUntil: "networkidle" });

  const stores: RawStore[] = await page.evaluate(() => {
    const out: Array<{ satsback_slug: string; name: string; cashback_text: string | null; logo_url: string | null }> = [];
    const anchors = Array.from(document.querySelectorAll('a[href*="/store/"]')) as HTMLAnchorElement[];
    for (const a of anchors) {
      const m = a.getAttribute("href")?.match(/\/store\/([^/?#]+)/);
      if (!m) continue;
      const slug = m[1];
      const name = (a.querySelector("img")?.getAttribute("alt") || a.textContent || "").trim().split("\n")[0].trim();
      const logo = a.querySelector("img")?.getAttribute("src") || null;
      // cashback label is the sibling text like "up to 2.7%"
      const cb = (a.textContent || "").match(/up to [\d.,]+ ?%?|[\d.,]+ ?sats|[\d€]+%? ?discount code|\d+ free month/i);
      out.push({ satsback_slug: slug, name, cashback_text: cb ? cb[0].trim() : null, logo_url: logo });
    }
    // de-dupe by slug
    const seen = new Set<string>();
    return out.filter((s) => (seen.has(s.satsback_slug) ? false : (seen.add(s.satsback_slug), true)));
  });

  await browser.close();
  const outPath = path.join(process.cwd(), "seeds", "stores.raw.json");
  fs.writeFileSync(outPath, JSON.stringify(stores, null, 2));
  console.log(`Wrote ${stores.length} stores to ${outPath}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 3: Run the scraper, verify output**

Run: `npm run scrape:satsback`
Expected: `seeds/stores.raw.json` written with ≥100 rows, each having `satsback_slug` + `name`; most with `cashback_text`. Spot-check a few against the live site.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json scripts/scrape-satsback.ts seeds/stores.raw.json
git commit -m "feat(scrape): curated Satsback store scraper (facts only)"
```

---

### Task 7: Content builder → differentiated `seeds/stores.json`

**Files:**
- Create: `scripts/build-store-content.ts`
- Modify: `seeds/stores.json` (regenerated)

**Interfaces:**
- Consumes: `seeds/stores.raw.json` (Task 6), `parseCashback` (Task 1).
- Produces: `seeds/stores.json` — full rows with our original `description_md`, `how_it_works_md`, `worth_it_md`, `faqs`, `category_slug`, `geo_scope`, `is_bitcoin_native`. Each indexable row must clear 800 chars combined (Task 3 gate).

**Curation:** the builder selects the Phase-1 launch set — the ~40–60 stores that are (a) Bitcoin-native (`is_bitcoin_native`) or (b) globally searched. A `CURATION` map in the script assigns `category_slug`, `geo_scope`, `is_bitcoin_native`, and a one-line human angle per chosen slug; stores not in the map are written with empty prose (non-indexable) so they exist for internal linking but stay out of the index until enriched.

**Content differentiation (spec §7) — the builder composes, from facts + the per-store angle, three original sections.** This is assisted generation: the script writes a structured first draft; a human/Claude pass polishes the launch set before publishing. Each section derives from data (rate, kind, category, bitcoin-native, geo) so no two reads identically.

- [ ] **Step 1: Write the builder**

`scripts/build-store-content.ts`:
```ts
/**
 * Turns seeds/stores.raw.json (facts) into seeds/stores.json (facts + our
 * original prose). Feist-safe: classifies facts, writes original commentary,
 * never copies Satsback text. Composes description/how-it-works/worth-it +
 * FAQs from the rate, category, and a per-store angle.
 */
import fs from "node:fs";
import path from "node:path";
import { parseCashback } from "../src/lib/stores/cashback";

interface RawStore { satsback_slug: string; name: string; cashback_text: string | null; logo_url: string | null }
interface Curation { category_slug: string; geo_scope: "global" | "eu" | "nl" | "other"; is_bitcoin_native?: boolean; angle: string }

// Phase-1 launch set. Only slugs here get published (indexable) copy.
const CURATION: Record<string, Curation> = {
  "blockstream-store": { category_slug: "bitcoin-gear", geo_scope: "global", is_bitcoin_native: true, angle: "the official Blockstream shop for Jade hardware wallets and Bitcoin gear" },
  "cryptosteel": { category_slug: "bitcoin-gear", geo_scope: "global", is_bitcoin_native: true, angle: "indestructible steel seed-phrase backups" },
  "bitbox": { category_slug: "bitcoin-gear", geo_scope: "global", is_bitcoin_native: true, angle: "the Swiss BitBox02 hardware wallet" },
  "aliexpress": { category_slug: "marketplaces", geo_scope: "global", angle: "the global marketplace for low-cost electronics and everything else" },
  "booking": { category_slug: "travel", geo_scope: "global", angle: "hotels and stays worldwide" },
  "nordvpn": { category_slug: "services", geo_scope: "global", angle: "one of the most popular privacy VPNs" },
  // … extend to the full 40–60 launch set during implementation.
};

function money(kind: string, text: string): string {
  if (kind === "percent") return `${text} of your order value, paid in Bitcoin`;
  if (kind === "sats") return `a fixed ${text} in Bitcoin per qualifying order`;
  if (kind === "discount") return `a ${text} at checkout`;
  return "Bitcoin cashback on qualifying orders";
}

function describe(name: string, angle: string, cbText: string, kind: string, cat: string): string {
  return [
    `## Earn Bitcoin at ${name}`,
    ``,
    `${name} is ${angle}. Through Satsback, purchases there earn you ${money(kind, cbText)} — no points, no vouchers, just sats sent to a Lightning wallet you control.`,
    ``,
    `If you already shop at ${name}, routing the purchase through Satsback is free money on spending you'd do anyway. Below is the current rate, how the tracking actually works, and an honest take on whether it's worth the extra step for a ${cat.replace("-", " ")} purchase.`,
  ].join("\n");
}

function howItWorks(name: string, cbText: string): string {
  return [
    `## How ${name} Bitcoin cashback works`,
    ``,
    `1. Create a free Satsback account (no KYC) and install the browser extension.`,
    `2. Visit ${name} through Satsback — the extension prompts you to activate rewards with one click.`,
    `3. Complete your purchase as normal. Your cashback (${cbText}) appears as *pending* in your Satsback dashboard.`,
    `4. Once ${name} confirms the sale, the sats become withdrawable to any Lightning wallet.`,
    ``,
    `**Tracking caveat — read this:** Satsback relies on affiliate tracking, and independent users report roughly two in three orders track cleanly (it's rated ~3.2/5 on the Chrome Web Store). Disable ad-blockers on the ${name} tab, don't open other coupon extensions at checkout, and keep the Satsback tab as the last one you touched before paying. If an order doesn't appear within a few days, Satsback support can chase it with a receipt.`,
  ].join("\n");
}

function worthIt(name: string, kind: string, value: number | null, cat: string): string {
  const verdict = kind === "percent" && value != null && value >= 2
    ? `At this rate, ${name} is one of the better ${cat.replace("-", " ")} options on Satsback — worth the two-minute setup.`
    : kind === "discount"
    ? `This one is a flat discount code rather than percentage cashback, so the value is fixed regardless of order size — best on a single planned purchase.`
    : `The rate is modest, so it's most worth it on larger ${cat.replace("-", " ")} orders where a small percentage still adds up to meaningful sats.`;
  return [
    `## Is it worth it?`,
    ``,
    `${verdict}`,
    ``,
    `Two things to weigh: cashback is paid in Bitcoin, so its fiat value moves with BTC — a plus if you're stacking sats long-term, a variable if you're not. And Satsback rarely stacks with the store's own loyalty program on the same order, so compare the two and use whichever pays more. For most shoppers already buying from ${name}, the sats are pure upside.`,
  ].join("\n");
}

function faqs(name: string, cbText: string) {
  return [
    { question: `How much Bitcoin do I earn at ${name}?`, answer_md: `Currently ${cbText}, credited in sats to your Satsback dashboard after ${name} confirms the order.` },
    { question: `Is there a fee or KYC to use Satsback at ${name}?`, answer_md: `No. Satsback is free and requires no identity verification. You only need an account and the browser extension.` },
    { question: `When can I withdraw my ${name} cashback?`, answer_md: `Once the order moves from *pending* to *confirmed* (after ${name}'s return window), the sats are withdrawable to any Bitcoin Lightning wallet.` },
  ];
}

function main() {
  const raw: RawStore[] = JSON.parse(fs.readFileSync(path.join(process.cwd(), "seeds", "stores.raw.json"), "utf8"));
  const out = raw.map((r) => {
    const cur = CURATION[r.satsback_slug];
    const cb = parseCashback(r.cashback_text ?? "");
    if (!cur) {
      // Not in launch set: exists for linking, no published prose (stays noindex).
      return { slug: r.satsback_slug, name: r.name, satsback_slug: r.satsback_slug, logo_url: r.logo_url,
        cashback_text: r.cashback_text, category_slug: null, geo_scope: "global", is_bitcoin_native: false,
        description_md: "", how_it_works_md: "", worth_it_md: "", faqs: [] };
    }
    return {
      slug: r.satsback_slug, name: r.name, satsback_slug: r.satsback_slug, logo_url: r.logo_url,
      cashback_text: r.cashback_text, category_slug: cur.category_slug, geo_scope: cur.geo_scope,
      is_bitcoin_native: !!cur.is_bitcoin_native,
      description_md: describe(r.name, cur.angle, r.cashback_text ?? "cashback", cb.kind, cur.category_slug),
      how_it_works_md: howItWorks(r.name, r.cashback_text ?? "your cashback"),
      worth_it_md: worthIt(r.name, cb.kind, cb.value, cur.category_slug),
      faqs: faqs(r.name, r.cashback_text ?? "the current rate"),
    };
  });
  fs.writeFileSync(path.join(process.cwd(), "seeds", "stores.json"), JSON.stringify(out, null, 2));
  const indexable = out.filter((s) => (s.description_md.length + s.how_it_works_md.length + s.worth_it_md.length) >= 800).length;
  console.log(`Wrote ${out.length} stores (${indexable} indexable) to seeds/stores.json`);
}
main();
```

- [ ] **Step 2: Run the builder + verify the gate**

Run: `npx tsx scripts/build-store-content.ts`
Expected: `seeds/stores.json` written; the "indexable" count equals the curated launch set (each composed store clears 800 chars). Manually read 2–3 entries and confirm the prose reads naturally and is store-specific.

- [ ] **Step 3: Re-seed + verify in DB**

Run: `npm run seed`
Then: `SELECT COUNT(*) FROM stores;` and `SELECT slug FROM stores WHERE CHAR_LENGTH(description_md)+CHAR_LENGTH(how_it_works_md)+CHAR_LENGTH(worth_it_md) >= 800;`
Expected: launch-set slugs are indexable.

- [ ] **Step 4: Commit**

```bash
git add scripts/build-store-content.ts seeds/stores.json
git commit -m "feat(content): assisted store-content builder (Feist-safe, differentiated)"
```

---

### Task 8: Shop routes — index, store page, category hub

**Files:**
- Create: `src/app/shop/page.tsx` (index)
- Create: `src/app/shop/[store]/page.tsx` (store detail)
- Create: `src/app/shop/category/[slug]/page.tsx` (category hub)
- Create: `src/components/StoreCard.tsx`
- Create: `src/components/CashbackBadge.tsx`

**Interfaces:**
- Consumes: `listStores`, `getStoreBySlug`, `listStoreCategories`, `StoreListItem`, `StoreDetail` (Task 4); `isStoreIndexable` (Task 3); `breadcrumbJsonLd`, `faqJsonLd`, `jsonLdScript`, `siteUrl` (`src/lib/seo.ts`); `renderMarkdown` (`src/lib/markdown.ts` — match the guides page's usage).
- Produces: three rendered routes. Store page emits `robots: { index: false }` when `!isStoreIndexable`.

**Pattern reference:** mirror `src/app/guides/[slug]/page.tsx` for `generateMetadata`, JSON-LD injection, markdown rendering, and the `notFound()` path; mirror `src/app/categories/[slug]/page.tsx` for the list/hub layout. Follow the mobile grid rule (`grid-cols-1 sm:grid-cols-2 …`).

- [ ] **Step 1: `CashbackBadge` component**

`src/components/CashbackBadge.tsx`:
```tsx
export function CashbackBadge({ text, kind }: { text: string | null; kind: string }) {
  if (!text) return null;
  const label = kind === "discount" ? text : `${text} back`;
  return (
    <span className="inline-flex items-center rounded-full border border-edge bg-ink-soft/60 px-2.5 py-1 font-mono text-xs text-accent">
      ₿ {label}
    </span>
  );
}
```

- [ ] **Step 2: `StoreCard` component**

`src/components/StoreCard.tsx`:
```tsx
import Link from "next/link";
import type { StoreListItem } from "@/lib/db";
import { CashbackBadge } from "./CashbackBadge";

export function StoreCard({ store }: { store: StoreListItem }) {
  return (
    <Link
      href={`/shop/${store.slug}`}
      className="flex items-center gap-3 rounded-card border border-edge bg-ink-soft/40 p-4 transition hover:border-accent"
    >
      {store.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={store.logo_url} alt="" width={40} height={40} className="h-10 w-10 rounded object-contain" />
      ) : (
        <div className="h-10 w-10 rounded bg-ink" aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{store.name}</div>
        <CashbackBadge text={store.cashback_text} kind={store.cashback_kind} />
      </div>
    </Link>
  );
}
```

- [ ] **Step 3: Shop index `src/app/shop/page.tsx`**

Server component: fetch `listStoreCategories()` + `listStores({ limit: 24, sort: "rate" })`. Render an H1 ("Earn Bitcoin when you shop online"), a short intro paragraph explaining the model + one Satsback CTA (`/visit/satsback`), a category grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`) linking to `/shop/category/[slug]`, and a "Top rates right now" `StoreCard` grid. Add `<AAds zone="leaderboard" />` near the top and `export const metadata` with a wedge title. Include `breadcrumbJsonLd` for Home → Shop.

- [ ] **Step 4: Store detail `src/app/shop/[store]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStoreBySlug } from "@/lib/db";
import { isStoreIndexable, breadcrumbJsonLd, faqJsonLd, jsonLdScript, siteUrl } from "@/lib/seo";
import { renderMarkdown } from "@/lib/markdown";
import { AAds } from "@/components/AAds";

export async function generateMetadata({ params }: { params: Promise<{ store: string }> }): Promise<Metadata> {
  const { store } = await params;
  const s = await getStoreBySlug(store);
  if (!s) return { title: "Store not found" };
  const indexable = isStoreIndexable(s);
  return {
    title: `Earn Bitcoin at ${s.name}${s.cashback_text ? ` — ${s.cashback_text} back` : ""} (2026)`,
    description: `How to earn Bitcoin cashback at ${s.name} via Satsback — current rate, how tracking works, and whether it's worth it.`,
    alternates: { canonical: siteUrl(`/shop/${s.slug}`) },
    robots: indexable ? undefined : { index: false, follow: true },
  };
}

export default async function StorePage({ params }: { params: Promise<{ store: string }> }) {
  const { store } = await params;
  const s = await getStoreBySlug(store);
  if (!s) notFound();
  const crumbs = breadcrumbJsonLd([
    { name: "Home", url: siteUrl("/") },
    { name: "Shop & Earn", url: siteUrl("/shop") },
    { name: s.name, url: siteUrl(`/shop/${s.slug}`) },
  ]);
  const faq = faqJsonLd(s.faqs);
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(crumbs) }} />
      {faq && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(faq) }} />}
      <article className="prose prose-invert max-w-none">
        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(s.description_md) }} />
        <a href="/visit/satsback" rel="nofollow sponsored" className="not-prose my-6 inline-flex rounded-card bg-accent px-5 py-3 font-medium text-ink">
          Start earning at {s.name} — create a free Satsback account →
        </a>
        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(s.how_it_works_md) }} />
        <AAds zone="inline" className="my-6" />
        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(s.worth_it_md) }} />
      </article>
    </main>
  );
}
```

- [ ] **Step 5: Category hub `src/app/shop/category/[slug]/page.tsx`**

Server component: `listStoreCategories()` to resolve the category (→ `notFound()` if absent) + `listStores({ categorySlug: slug, sort: "rate", limit: 100 })`. Render H1 "Best stores for Bitcoin cashback: {name}", the category `description`, a **comparative sortable-by-rate table** (store · category · rate · link) plus a short "how to choose" paragraph, and breadcrumb JSON-LD. Add `metadata` with a wedge title.

- [ ] **Step 6: Verify build + routes**

Run: `npx tsc --noEmit && npx next build`
Then `npm run dev` and load `/shop`, `/shop/blockstream-store`, `/shop/category/bitcoin-gear` — confirm pages render, the Satsback CTA points at `/visit/satsback`, and a non-curated store returns `noindex` in its `<head>`.
Expected: build passes; all three routes render.

- [ ] **Step 7: Commit**

```bash
git add src/app/shop src/components/StoreCard.tsx src/components/CashbackBadge.tsx
git commit -m "feat(shop): store index, detail, and category-hub routes"
```

---

### Task 9: Monetization wiring + nav/home reframe + sitemap

**Files:**
- Create: `migrations/008_seed_visit_codes.sql` (Satsback + exchange referral codes) OR add to `seeds/visit_codes.json` + reseed — use whichever the repo already uses for `visit_codes` (check `seeds/visit_codes.json`).
- Modify: `src/components/SiteHeader.tsx` (nav), `src/app/page.tsx` (home), `src/app/sitemap.ts` (stores)

**Interfaces:**
- Consumes: `listStoreSlugsForSitemap`, `isStoreIndexable`/`MIN_INDEXABLE_DESCRIPTION_CHARS` (Tasks 3/4), `listStores` (Task 4).

- [ ] **Step 1: Seed the Satsback + exchange visit codes**

Add to `seeds/visit_codes.json` (then `npm run seed`), matching its existing shape:
```json
{ "code": "satsback", "target_url": "https://satsback.com/register/ozBlyPnj26PY19ve", "source_label": "satsback-ref" },
{ "code": "nexo",     "target_url": "https://nexo.com/ref/d0gip5tq3j?src=web-link", "source_label": "nexo-ref" },
{ "code": "coinbase", "target_url": "https://coinbase.com/join/PEF43HD", "source_label": "coinbase-ref" },
{ "code": "bitvavo",  "target_url": "https://bitvavo.com/invite?a=DE26EBA45E", "source_label": "bitvavo-ref" }
```
**All four live** — real referral URLs captured from Tim's accounts (Satsback 21%/1yr, Nexo up-to-$2,500 but $5k deposit gate, Coinbase invite, Bitvavo €10-in-BTC per switch). Keep the "unconfigured code = hide CTA" guard anyway (defensive) but no `REPLACE_ME` remains. Bitvavo note: referral pays when the invited friend switches + verifies; frame honestly.

- [ ] **Step 2: Add stores to the sitemap**

In `src/app/sitemap.ts`, mirror the existing airdrop/guide blocks: call `listStoreSlugsForSitemap()`, include only rows with `content_chars >= MIN_INDEXABLE_DESCRIPTION_CHARS` as `/shop/{slug}`, and add the static `/shop` + each `/shop/category/{slug}` URL.

- [ ] **Step 3: Reframe the primary nav**

In `src/components/SiteHeader.tsx`, change the primary links to **Earn · Shop · Bonuses · Guides** (`/earn` may 404 until the pillar ships — point "Earn" at `/guides` for now or omit; "Shop" → `/shop`, "Bonuses" → `/bonus` may 404 until Phase 1b — omit until then). Move "Airdrops" into a secondary position. Keep it a single edit; don't restructure the header component.

- [ ] **Step 4: Add a "Shop & earn Bitcoin" block to the home page**

In `src/app/page.tsx`, add a section above or beside the airdrop listing: heading "Earn Bitcoin when you shop", a one-line pitch, a `StoreCard` grid of `listStores({ limit: 8, sort: "rate" })`, and a link to `/shop`. Follow the mobile grid rule.

- [ ] **Step 5: Verify build + sitemap**

Run: `npx tsc --noEmit && npx next build`
Then `npm run dev`, load `/sitemap.xml` (indexable store URLs present, thin ones absent), `/` (shop block renders, links work), and click a store CTA → `/visit/satsback` → 302 to the Satsback register URL.
Expected: build passes; sitemap correct; redirect works.

- [ ] **Step 6: Commit**

```bash
git add seeds/visit_codes.json src/app/sitemap.ts src/components/SiteHeader.tsx src/app/page.tsx
git commit -m "feat(earn-hub): Satsback monetization wiring, nav + home reframe, store sitemap"
```

---

## Self-Review

**Spec coverage (§ → task):**
- §3 Engine A shop-to-earn → Tasks 2,4,5,6,7,8,9 ✓
- §4 IA routes `/shop`, `/shop/[store]`, `/shop/category/[slug]` → Task 8 ✓; `/bonus`, `/earn` pillar → **deferred to Phase 1b** (noted in nav Step 3; not in this plan's scope — this plan is Engine A only, which ships as working software on its own).
- §5 `stores` table + `faqs.store_id` + taxonomy → Tasks 2,5 ✓
- §6 Satsback pipeline (scrape → build → seed) → Tasks 6,7,5 ✓
- §7 differentiation rules + `isStoreIndexable` → Tasks 3,7,8 ✓
- §8 monetization (`/visit/[code]` reuse, pluggable codes, A-Ads filler) → Tasks 8,9 ✓
- §9 SEO (breadcrumb/FAQ schema, sitemap, wedge titles) → Tasks 8,9 ✓
- §10 airdrop demotion → Task 9 Step 3 (nav) ✓; airdrops kept intact ✓
- §12 Phase 1 scope → this plan ✓; Phase 2 NL + Phase 3 scale → separate future plans ✓

**Deferred out of this plan (intentional, tracked):** `/bonus` guides engine (B) and `/earn` pillar (C) — content-only, lower risk; belong in a **Phase 1b plan** so this plan stays a shippable Engine-A slice. NL cluster (Phase 2) and catalog scale-out (Phase 3) get their own plans.

**Placeholder scan:** the only `REPLACE_ME` values are the exchange referral URLs in Task 9 Step 1 — intentional (Tim-supplied), and their pages omit the CTA until filled. `seeds/stores.json` placeholder in Task 5 is explicitly overwritten by Task 7. The `CURATION` map in Task 7 ships with a starter set and an explicit "extend to 40–60" instruction — the implementer fills real launch stores from `stores.raw.json`.

**Type consistency:** `parseCashback` → `{text,kind,value}` used identically in Tasks 1,5,7. `CashbackKind`/`GeoScope` defined in db.ts (Task 4) and reused in components (Task 8). `isStoreIndexable` signature identical in Tasks 3,8. Store field names (`description_md`/`how_it_works_md`/`worth_it_md`) consistent across migration (2), query (4), seed (5), builder (7), gate (3), pages (8).

**Note for implementer:** verify `scripts/seed.ts` and `seeds/visit_codes.json` actual shapes before Tasks 5/9 — the plan follows the documented patterns but the seed script's exact structure should be read first and matched.
