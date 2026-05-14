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

/**
 * AirdropAlert's RSS feed mixes real airdrop announcements with blog posts,
 * news articles, and listicles. We only want the airdrop entries.
 *
 * Heuristic:
 *   1. Title must reference an airdrop / token-distribution event by keyword.
 *   2. Title length must be plausibly short (real ones are like "Monad Airdrop",
 *      not "6 crypto tokens that had a big week and why the market is...").
 *   3. Title must not contain obvious blog-post patterns.
 *   4. URL must not point to a known non-airdrop section.
 */
const TITLE_KEYWORD_RE = /\b(airdrop|token\s+(sale|distribution|drop)|launchpad|incentive|points\s+program|retroactive)\b/i;

const TITLE_BLOG_PATTERNS = [
  /\bis\s+pumping\b/i,
  /\bhere'?s\b/i,
  /\bwhy\s+(the|crypto|bitcoin)/i,
  /\bhow\s+to\b/i,
  /^\s*(best|top|biggest)\s+\d*\s*crypto/i,
  /\bcrypto\s+tokens\b/i,
  /\bbetting\s+sites\b/i,
  /\bworld\s+cup\b/i,
  /\bexplained\b/i,
  /\breview\b/i,
  /\bguide\b/i,
  /\bwhat['']?s\s+going\s+on\b/i,
  /\bmemes\b/i,
];

const URL_DENY_PATTERNS = [
  /\/news\//i,
  /\/blog\//i,
  /\/insights\//i,
  /\/guides?\//i,
  /\/reviews?\//i,
  /\/articles?\//i,
];

function looksLikeRealAirdropPost(title: string, link: string): boolean {
  if (!title) return false;

  // Must mention airdrop or related event
  if (!TITLE_KEYWORD_RE.test(title)) return false;

  // Real airdrop titles are short: "ProjectName Airdrop" or "Acme Token Sale"
  const wordCount = title.split(/\s+/).filter(Boolean).length;
  if (wordCount > 8) return false;
  if (title.length > 80) return false;

  // Reject obvious blog-post patterns
  for (const pat of TITLE_BLOG_PATTERNS) {
    if (pat.test(title)) return false;
  }

  // Reject URLs pointing to non-airdrop sections of the site
  if (link) {
    for (const pat of URL_DENY_PATTERNS) {
      if (pat.test(link)) return false;
    }
  }

  return true;
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
      const items = parseRss(xml).filter((it) =>
        looksLikeRealAirdropPost(it.title, it.link),
      );

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
