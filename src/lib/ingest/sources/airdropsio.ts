/**
 * airdrops.io /latest/ scraper.
 *
 * Replaces the old AirdropAlert RSS source which drifted into general
 * crypto blog content. airdrops.io still publishes real airdrop cards
 * with name, status, heat score, and short action description.
 *
 * Card HTML shape (one per airdrop):
 *   <div class='air-wrapper temperature-NNN'>
 *     <div class='droptemp'>...<span>NNN°</span>...</div>
 *     <div class='air-thumbnail'><img data-src='LOGO_URL'/></div>
 *     <div class="status-indicator ongoing"><span class="status-dot"></span>Ongoing</div>
 *     <a href=https://airdrops.io/SLUG/><h3>NAME</h3></a>
 *     <li class='est-value'>...Actions: <span>DESCRIPTION</span></li>
 *   </div>
 *
 * We don't pull a full HTML parser — regex on a stable WordPress theme works
 * fine. If the markup changes we'll see fetched=0 in the cron log and can
 * update the patterns.
 */
import { slugify } from "@/lib/format";
import type { NormalizedAirdrop, SourceAdapter } from "../types";

// `/latest/` lists fresh entries; most haven't accumulated heat votes yet,
// so they sit at 0-90°. Don't filter on temperature here — the structural
// HTML filter (must be in <article> + must have temperature-N + must have
// /SLUG/ link + must have <h3>) plus the name denylist already give us
// quality. Heat just becomes a sort signal.
const MIN_TEMPERATURE = 0;
const MAX_ROWS = 25;

// CEX / wrapped / bridge name patterns — same shape as the DefiLlama filter.
const NAME_DENY_PATTERNS = [
  "binance", "bybit", "coinbase", "okx", "kraken", "bitfinex",
  "bitget", "bitstamp", "bingx", "mexc", "kucoin", "huobi", "htx",
  "upbit", "gate.io", "gemini", "crypto.com", "bitmex", "deribit",
  "phemex", "bittrex", "robinhood", "revolut", "figure markets",
  "bridge", "wrapped", "staked eth", "staked sol", "staked btc",
];

function isCleanName(name: string): boolean {
  const lower = name.toLowerCase();
  for (const pat of NAME_DENY_PATTERNS) {
    if (lower.includes(pat)) return false;
  }
  return true;
}

interface RawCard {
  name: string;
  slug: string;          // airdrops.io slug, used to derive our own
  projectUrl: string;    // full /SLUG/ link on airdrops.io
  status: "ongoing" | "confirmed" | "potential" | "ended" | null;
  temperature: number;
  description: string | null;
  logoUrl: string | null;
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function parseCards(html: string): RawCard[] {
  const cards: RawCard[] = [];
  // Each card is wrapped in an <article>...</article> on /latest/. We grab
  // each article that contains an `air-wrapper temperature-N` and parse
  // its inner content.
  const articleRe = /<article\b[^>]*>([\s\S]*?)<\/article>/gi;
  let am: RegExpExecArray | null;
  while ((am = articleRe.exec(html)) !== null) {
    const block = am[1];
    const tempMatch = block.match(/air-wrapper\s+temperature-(\d+)/i);
    if (!tempMatch) continue;
    const temperature = Number(tempMatch[1]) || 0;

    // Name + slug
    const nameMatch = block.match(/<a\s+href=['"]?https?:\/\/airdrops\.io\/([^/'"\s]+)\/?['"]?[^>]*>\s*<h3[^>]*>([^<]+)<\/h3>/i);
    if (!nameMatch) continue;
    const slug = nameMatch[1].toLowerCase();
    const name = decodeHtmlEntities(nameMatch[2]).trim();
    if (!name) continue;

    // Status indicator: "ongoing", "confirmed", "potential", "ended"
    const statusMatch = block.match(/<div\s+class=['"]status-indicator\s+(ongoing|confirmed|potential|ended)['"][^>]*>/i);
    const status = (statusMatch ? statusMatch[1].toLowerCase() : null) as RawCard["status"];

    // Action description (first est-value list item)
    const descMatch = block.match(/<li\s+class=['"]est-value['"][^>]*>([\s\S]*?)<\/li>/i);
    const description = descMatch ? stripTags(descMatch[1]).replace(/^Actions:\s*/i, "") : null;

    // Logo URL (lazy-loaded data-src)
    const logoMatch = block.match(/data-src=['"]([^'"]+)['"]/i);
    const logoUrl = logoMatch ? logoMatch[1] : null;

    cards.push({
      name,
      slug,
      projectUrl: `https://airdrops.io/${slug}/`,
      status,
      temperature,
      description: description ? decodeHtmlEntities(description) : null,
      logoUrl,
    });
  }
  return cards;
}

function mapStatus(s: RawCard["status"]): NormalizedAirdrop["status"] {
  switch (s) {
    case "confirmed": return "confirmed";
    case "ongoing":   return "live";
    case "potential": return "potential";
    case "ended":     return "ended";
    default:          return "potential";
  }
}

// Heat 0-500° → social_score 0-100 (proxy signal).
function mapScore(temperature: number): number {
  return Math.min(100, Math.max(0, Math.round((temperature / 5))));
}

export const airdropsIoSource: SourceAdapter = {
  slug: "airdropsio",
  name: "airdrops.io /latest/",

  async fetch(): Promise<NormalizedAirdrop[]> {
    try {
      const res = await fetch("https://airdrops.io/latest/", {
        headers: {
          "user-agent": "freecrypto.net/1.0 (+https://freecrypto.net)",
          accept: "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) {
        console.warn(`airdropsio: HTTP ${res.status}`);
        return [];
      }
      const html = await res.text();
      const cards = parseCards(html);

      const filtered = cards
        .filter((c) => c.temperature >= MIN_TEMPERATURE)
        .filter((c) => isCleanName(c.name))
        // De-dupe by slug just in case
        .filter((c, i, arr) => arr.findIndex((x) => x.slug === c.slug) === i)
        .sort((a, b) => b.temperature - a.temperature)
        .slice(0, MAX_ROWS);

      return filtered.map((c): NormalizedAirdrop => ({
        external_id: `airdropsio-${c.slug}`,
        suggested_slug: slugify(c.name),
        name: c.name,
        token_symbol: null,
        logo_url: c.logoUrl,
        short_description: c.description ? c.description.slice(0, 280) : null,
        description_md: c.description ?? "",
        chain_slug: null,
        category_slug: null,
        status: mapStatus(c.status),
        kyc_required: false,
        funding_raised_usd: null,
        estimated_value_usd_min: null,
        estimated_value_usd_max: null,
        social_score: mapScore(c.temperature),
        project_url: c.projectUrl,
        twitter_url: null,
        discord_url: null,
        started_at: null,
        snapshot_date: null,
        end_date: null,
      }));
    } catch (e) {
      console.error("airdropsio fetch failed:", e instanceof Error ? e.message : e);
      return [];
    }
  },
};
