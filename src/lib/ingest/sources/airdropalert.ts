/**
 * AirdropAlert RSS adapter.
 *
 * AirdropAlert publishes new listings to https://airdropalert.com/feed/.
 * The feed is lightweight — just title, link, pubDate, description per item.
 * We use it for discovery only; mapping back to chain/category is fuzzy
 * so ingested rows land as status=potential with minimal metadata.
 *
 * Parser: tiny regex-based RSS pull. We DON'T pull a full XML parser dep
 * for a feed this simple. If the feed format changes we'll see fetched=0
 * in the cron log.
 */
import { slugify } from "@/lib/format";
import type { NormalizedAirdrop, SourceAdapter } from "../types";

interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  guid: string;
}

function stripCdata(s: string): string {
  return s.replace(/^<!\[CDATA\[/, "").replace(/]]>$/, "").trim();
}

function extract(field: string, item: string): string {
  const m = item.match(new RegExp(`<${field}[^>]*>([\\s\\S]*?)</${field}>`, "i"));
  return m ? stripCdata(m[1]) : "";
}

function parseRss(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const itemRe = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];
    items.push({
      title: extract("title", block),
      link: extract("link", block),
      description: extract("description", block),
      pubDate: extract("pubDate", block),
      guid: extract("guid", block) || extract("link", block),
    });
  }
  return items;
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

// Extract a project name from a title like "Acme Protocol Airdrop" → "Acme Protocol"
function deriveName(title: string): string {
  return title
    .replace(/\s*airdrop\s*$/i, "")
    .replace(/\s*\([^)]*\)\s*$/, "")
    .trim();
}

export const airdropAlertSource: SourceAdapter = {
  slug: "airdropalert",
  name: "AirdropAlert RSS",

  async fetch(): Promise<NormalizedAirdrop[]> {
    try {
      const res = await fetch("https://airdropalert.com/feed/", {
        headers: {
          "user-agent": "freecrypto.net/1.0 (+https://freecrypto.net)",
          accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
        },
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) {
        console.warn(`airdropalert: HTTP ${res.status}`);
        return [];
      }
      const xml = await res.text();
      const items = parseRss(xml);

      return items.map((it): NormalizedAirdrop => {
        const name = deriveName(it.title);
        const description = stripHtml(it.description).slice(0, 600);
        const pubDate = it.pubDate ? new Date(it.pubDate) : null;
        return {
          external_id: `airdropalert-${it.guid}`,
          suggested_slug: slugify(name),
          name,
          token_symbol: null,
          logo_url: null,
          short_description: description ? description.slice(0, 280) : null,
          description_md: description,
          chain_slug: null,
          category_slug: null,
          status: "potential",
          kyc_required: false,
          funding_raised_usd: null,
          estimated_value_usd_min: null,
          estimated_value_usd_max: null,
          social_score: null,
          project_url: it.link || null,
          twitter_url: null,
          discord_url: null,
          started_at: pubDate && !isNaN(pubDate.getTime()) ? pubDate : null,
          snapshot_date: null,
          end_date: null,
        };
      });
    } catch (e) {
      console.error("airdropalert fetch failed:", e instanceof Error ? e.message : e);
      return [];
    }
  },
};
