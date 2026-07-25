# freecrypto.net v2 — "Earn Bitcoin" Hub Pivot

**Date:** 2026-07-25
**Author:** Tim + Claude (acting as SEO developer)
**Status:** Design — pending implementation plan

---

## 1. Context & problem

freecrypto.net launched 2026-05-14 as an **airdrop aggregator** monetized by A-Ads. After ~2.5 months live, the data says the direction failed:

**Search Console (90 days, 2026-04-25 → 07-24):**
- **14 total clicks** from Google.
- The only query earning clicks is the brand term **"freecrypto"** (10 clicks, pos 1.9). Every airdrop query gets **0 clicks** despite pages ranking pos 3–15 (impressions without clicks = no trust, page-2 CTR).

**GA4 (same window):**
- **Organic Search: 115 sessions / 100 users** (~1.3/day).
- **Direct: 1,715 sessions / 1,712 users** — the 1:1 user:session ratio is the signature of bots / monitors / self-traffic, not a returning audience. This is why A-Ads (which pays only on real human impressions) earns ~nothing.

**Root causes (structural, not just execution):**
1. **Decaying treadmill** — an airdrop closes, its page dies; SEO authority never compounds.
2. **Derivative by design** — "Option C" aggregation restates airdrops.io / DefiLlama, the exact sources Google already ranks. Google's helpful-content system demotes me-too aggregation → page-2 rankings, zero clicks.
3. **Wrong monetization for the ceiling** — display CPMs need ~100k pageviews/mo to matter; a thin aggregator in a saturated niche can't get there.

**The asset worth keeping:** `freecrypto.net` is a strong exact-match brandable domain whose search intent ("free crypto") maps to **ways to earn crypto without buying it** — shopping cashback, signup bonuses, learn-to-earn. The airdrop calendar was too narrow (and the fastest-decaying) slice of that intent.

## 2. Goal & non-goals

**Goal:** Re-point freecrypto.net at a compounding, non-derivative content model that (a) builds durable SEO authority and (b) monetizes via affiliate programs Tim **already holds**, with a realistic path to high organic traffic ("traffic monster").

**Accounts to monetize (all pre-existing):** A-Ads (user 68724, `cryptotaps`), **Satsback** (BTC shopping cashback; referral code `ozBlyPnj26PY19ve`), **Nexo**, **Bitvavo**, **Coinbase**.

**Non-goals:**
- No rebuild — reuse the existing Next.js 16 app, MariaDB schema, ingestion cron, `/visit/[code]` redirector, `guides` table, and A-Ads plumbing.
- No mass thin-page dump. We explicitly reject the 10k-programmatic-doorway approach that would repeat v1's demotion.
- No deletion of airdrop content — it demotes to a supporting freshness section.

## 3. Strategy — the earn-hub model

Reposition as **"Earn Bitcoin — by shopping, bonuses, and the smart way."** Three content engines, each mapped to a held account:

| Engine | What it is | Monetizes via |
|---|---|---|
| **A. Shop-to-earn** (traffic engine) | Store pages + category hubs: "Earn Bitcoin at [store]", "Best stores for BTC cashback: [category]" | **Satsback** signup referral + A-Ads |
| **B. Signup-bonus guides** | "Bitvavo bonus", "Nexo referral bonus", "Coinbase sign-up bonus" — pure affiliate-intent | **Bitvavo / Nexo / Coinbase** referrals |
| **C. Evergreen pillar** | "How to earn free Bitcoin" hub tying shopping + bonuses + learn-to-earn + airdrops together | funnels to A & B + A-Ads |

**The winnable wedge:** don't fight "Nike coupon" (TopCashback/Rakuten own fiat-cashback forever). Fight **"Nike Bitcoin cashback"** — a new, near-empty SERP whose only competitors are Satsback itself and a few Bitcoin blogs. That intent is exactly what the domain attracts.

**Satsback monetization mechanic (confirmed):** one referral link (`satsback.com/register/ozBlyPnj26PY19ve`) → **21% of a referred user's Bitcoin cashback for their entire first year.** So every store page funnels one action — *create a free Satsback account* — and then pays out for a year on everything they buy. No per-store deep-links required.

**Satsback inventory insight (from live recon):** the catalog is **heavily Dutch/EU-skewed** (Thuisbezorgd.nl, HEMA, MediaMarkt, ANWB, KPN, Lidl.nl, Odido…) plus a **Bitcoin-native "Essentials" cluster** (Blockstream, Start9, Cryptosteel, Bitbox, Seedor, wavecard, ShopinBit) and **global brands** (AliExpress, Booking, Temu, adidas, Zalando, NordVPN, Coursera, Airbnb). This shapes phasing (§12).

## 4. Information architecture

New/changed routes (Next.js App Router, under `src/app/`):

```
/                          Home — reframed: earn-hub hero, tools/engines, featured stores + pillar (was: airdrop list)
/shop                      Shop-to-earn index — category grid + featured stores + "how BTC cashback works" + Satsback CTA
/shop/[store]              Store page — "Earn Bitcoin at {Store}" (the traffic long-tail)
/shop/category/[slug]      Category hub — "Best stores for Bitcoin cashback: {Category}" (comparative)
/bonus                     Bonus-guides index
/bonus/[slug]              Individual bonus guide (Bitvavo / Nexo / Coinbase) — lives in `guides` table
/earn                      Pillar: "How to earn free Bitcoin in 2026" (hub-and-spoke)
/guides, /guides/[slug]    Existing evergreen guides — kept, folded under /earn cluster
/airdrops, /airdrops/[slug]  DEMOTED — kept as supporting freshness section, still noindex-gated
/calendar, /check          Kept as-is (supporting utilities)
/go/[code]                 Alias/reuse of existing /visit/[code] redirector for affiliate cloaking
```

Global nav reframes from **Airdrops-first** to **Earn · Shop · Bonuses · Guides** (Airdrops moves under a secondary menu). Header/footer components (`SiteHeader`, `SiteFooter`) updated accordingly.

## 5. Data model

**Reuse as-is:** `guides` (bonus guides + pillar + spokes), `visit_codes` + `click_log` + `/visit/[code]` (affiliate cloaking + click analytics), `faqs` pattern, `sources`, A-Ads zones.

**New table — `stores`:**
```sql
CREATE TABLE IF NOT EXISTS stores (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  slug              VARCHAR(120) NOT NULL,          -- our slug (== satsback slug where possible)
  name              VARCHAR(180) NOT NULL,
  logo_url          VARCHAR(500) NULL,
  satsback_slug     VARCHAR(160) NULL,              -- satsback.com/store/{satsback_slug}
  cashback_text     VARCHAR(120) NULL,              -- verbatim label e.g. "up to 2.7%" / "up to 7975 sats" / "5% discount code"
  cashback_kind     ENUM('percent','sats','discount','unknown') NOT NULL DEFAULT 'unknown',
  cashback_value    DECIMAL(8,3) NULL,              -- parsed numeric (percent or sats), for sorting/tables
  category_slug     VARCHAR(60) NULL,               -- our taxonomy (see below)
  geo_scope         ENUM('global','eu','nl','other') NOT NULL DEFAULT 'global',
  is_bitcoin_native TINYINT(1) NOT NULL DEFAULT 0,  -- the "Essentials" cluster
  description_md    MEDIUMTEXT NOT NULL DEFAULT '', -- OUR original copy (Feist-safe, see §7)
  how_it_works_md   MEDIUMTEXT NOT NULL DEFAULT '',
  worth_it_md       MEDIUMTEXT NOT NULL DEFAULT '', -- honest verdict / comparison
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at        DATETIME NULL,
  UNIQUE KEY uniq_store_slug (slug),
  KEY idx_store_category (category_slug),
  KEY idx_store_geo (geo_scope)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

Store FAQs reuse the `faqs` pattern via a nullable `store_id` (add column) OR a parallel `store_faqs` table — decide in the plan; leaning on a shared `faqs` table with `store_id INT NULL` added alongside existing `airdrop_id`.

**Store categories** (our own taxonomy, ~8–10 to start): `travel`, `fashion`, `tech-electronics`, `groceries-food`, `bitcoin-gear`, `telecom-utilities`, `home-garden`, `health-beauty`, `marketplaces`, `services`. Stored as a small seed (JSON → DB like `categories`).

## 6. Data pipeline — Satsback ingestion

Satsback returns **403 to plain HTTP fetch** but is reachable via **Playwright** (confirmed — Tim's browser session works). The full 10k catalog is behind search; the public `/stores` page exposes a curated popular subset (~150) which is exactly our Phase-1 target.

**Approach — offline scrape → committed seed → DB (not a live VPS cron):**
1. `scripts/scrape-satsback.ts` — a **local** Playwright script that visits `satsback.com/stores` + individual `satsback.com/store/{slug}` pages, extracts **facts only** (name, slug, logo, cashback label) for the curated set, and writes `seeds/stores.raw.json`. Run manually/periodically by Tim or Claude; **not** on the VPS (avoids headless-chromium deps on the box).
2. `scripts/build-store-content.ts` — turns raw facts into `seeds/stores.json` with **our original** `description_md` / `how_it_works_md` / `worth_it_md` (§7). Content generation is assisted but every store gets differentiated copy, not a spun template.
3. `npm run seed` loads `seeds/stores.json` into the `stores` table (idempotent upsert, preserves any hand-edited copy — same pattern as the airdrop upsert).
4. Refresh cadence: cashback rates re-scraped on demand (rates drift slowly); a light `--rates-only` mode updates `cashback_text`/`cashback_value` without touching editorial copy.

**Legal posture (unchanged from house rules):** facts only (rate, store name, logo via store's own brand assets) + our original commentary + honest outbound attribution to Satsback (which is also our referral link = monetization). No verbatim copy of Satsback's descriptions. Feist-safe.

## 7. Content differentiation rules (anti-thin-doorway) — THE critical section

This is what separates a traffic monster from freecrypto v1. **Every indexable page must clear a real value bar, not just a char count.** A store page's required components:

1. **Original 120–200 word take** on *this* store's Bitcoin cashback — rate in context, what the store sells, who it suits.
2. **Structured facts block:** current rate, cashback kind (%/sats/discount), payout method (BTC Lightning), min payout, whether it **stacks with the store's own coupons/loyalty**, and an **honest tracking-reliability caveat** (Satsback is 3.2/5 on Chrome; ~2/3 tracking success reported — saying so builds trust *and* uniqueness).
3. **A comparison element:** vs. the store's own loyalty scheme, or vs. typical fiat-cashback %, or "is the sats worth it at today's BTC price."
4. **2–4 FAQ entries** (feeds FAQPage schema).
5. **Internal links:** up to category hub + pillar + 2–3 sibling stores.
6. **One primary CTA → Satsback signup** via cloaked `/go/satsback`.

Category hubs must be **genuinely comparative** (sortable table of stores in that category by rate + a real "how to choose" section), not a link list.

**Indexability gate:** reuse `isAirdropIndexable`'s pattern in `src/lib/seo.ts` — add `isStoreIndexable(store)` summing `description_md + how_it_works_md + worth_it_md` against `MIN_INDEXABLE_DESCRIPTION_CHARS` (keep 800). Stores below the bar render but `noindex` + are excluded from sitemap. **We only publish stores we can say something real about** — quality gate is a feature, not a limit.

## 8. Monetization wiring

- **Cloaked redirector:** reuse `/visit/[code]` (rename-alias `/go/[code]`). Seed `visit_codes` rows: `satsback` → `https://satsback.com/register/ozBlyPnj26PY19ve`, plus `bitvavo`, `nexo`, `coinbase` with Tim's referral URLs. `click_log` already gives per-link click analytics.
- **Pluggable slots:** affiliate targets live in `visit_codes` (DB) + referral URLs in env/seed, so a page never hard-codes a link and nothing blocks on a signup that isn't finalized. A store page with no Satsback code configured still renders (CTA falls back to a generic Satsback link or hides).
- **A-Ads:** keep the 4 zones as **filler** on high-traffic pages (leaderboard on index pages, inline on store pages, footer). Demoted from primary to secondary revenue.
- **Priority order per page:** affiliate CTA (Satsback/exchange) above the fold; A-Ads below / in-margin.

## 9. SEO architecture

- **Hub-and-spoke internal linking:** `/earn` pillar → `/shop` + `/bonus` + category hubs → store/guide pages, with breadcrumb JSON-LD (already in `seo.ts`) throughout.
- **Schema:** reuse `breadcrumbJsonLd` + `faqJsonLd`; add lightweight `Product`/`Offer`-style or `ItemList` schema for category hubs where honest.
- **Titles/meta:** target the wedge — `Earn Bitcoin at {Store} — up to {rate} back (2026) | freecrypto.net`.
- **Sitemap:** extend `src/app/sitemap.ts` to include indexable stores + category hubs + bonus guides.
- **hreflang:** deferred to Phase 2 (NL). Phase 1 is `en` only; architecture keeps `/nl/` room without rework.
- **Answer-engine readiness:** clean facts + FAQ schema make store/bonus pages citable by AI answer engines (where discovery is shifting) — a deliberate edge over Satsback's JS-heavy pages.

## 10. Reuse / migration of existing airdrop assets

- `airdrops` table, `/airdrops/*`, `/calendar`, `/check`, ingestion cron, feed.xml: **kept**, demoted in nav. The 800-char gate already keeps thin airdrop pages out of the index — leave it.
- `ExchangeCTA` component: repurpose for the bonus engine.
- `guides` system: hosts bonus guides + pillar + spokes (no new table needed for content pages).
- `AAds`, `Pagination`, `FilterBar`, `SiteHeader/Footer`: reused, restyled for the new IA.

## 11. Success metrics (revisit at 60 / 90 days)

- **Leading (30d):** store + bonus pages indexed (GSC coverage), first non-brand impressions on "[store] bitcoin cashback" / "[exchange] bonus".
- **Primary (60–90d):** organic clicks/day (baseline ~0.15/day non-brand → target 10+/day), Satsback signups via `/go/satsback` (`click_log`), exchange referral signups.
- **Revenue (90d+):** Satsback referral sats accruing, ≥1 exchange referral conversion. A-Ads treated as bonus, not the KPI.

## 12. Phasing

- **Phase 1 — English clusters (prove pages rank):**
  - Migration (`stores` table, `faqs.store_id`), `isStoreIndexable`, seed taxonomy.
  - Scrape + build ~40–60 stores across two clusters: **Bitcoin-native "Essentials"** (bitcoiner audience, also converts on exchanges) + **globally-searched brands**.
  - `/shop`, `/shop/[store]`, `/shop/category/[slug]`, seed `visit_codes` (satsback + exchanges).
  - Reframe `/` home + nav. Ship 3 bonus guides (Bitvavo/Nexo/Coinbase) + `/earn` pillar.
- **Phase 2 — NL goldmine:** `/nl/` Dutch store cluster (HEMA, Thuisbezorgd, MediaMarkt, KPN, Lidl.nl…) — near-empty SERP, Bitvavo territory, Tim verifies copy. Add hreflang. This is the real long-tail scale, banked once Phase 1 proves the model.
- **Phase 3 — scale + freshness:** widen store coverage from the full catalog for terms showing GSC impressions; automate rate refresh; deepen category hubs; learn-to-earn (Coinbase Earn) spoke.

## 13. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Thin store pages → same demotion as v1 | §7 value bar + `isStoreIndexable` gate; publish only differentiated pages |
| Satsback blocks scraping / changes markup | Playwright (works today); curated small set = low scrape volume; facts-only, degrade gracefully if a store fails |
| Satsback tracking unreliable (3.2/5) hurts trust | Turn it into content — honest caveats build E-E-A-T and differentiate from Satsback's own pages |
| Affiliate signups stall (v1 shipped `REPLACE_ME`) | Pluggable `visit_codes`; Satsback code already in hand; site ships and earns on Satsback even if exchange codes lag |
| Duplicate/competing with satsback.com's store pages | Add comparison + honest verdict + FAQ + category context they don't have; target intent (English/NL) their JS pages rank weakly for |
| Google sees a big pivot / churn | Phase gradually, 301 nothing yet, keep airdrops live; grow new sections additively |

## 14. Open questions / Tim TODOs

- Confirm/collect referral URLs for **Bitvavo, Nexo, Coinbase** (Satsback code already captured). Until then those `visit_codes` use placeholders and their bonus pages can `noindex` or omit the CTA.
- Confirm Satsback referral code `ozBlyPnj26PY19ve` is the one to bake into `visit_codes` (it's Tim's live code as shown on the referral page).
- Phase-2 NL: confirm willingness to write/verify Dutch copy.

---

*Next step: turn this into a phased implementation plan (writing-plans). Phase 1 is the first buildable slice.*
