/**
 * airdrops.io detail-page enrichment — STRUCTURED DATA ONLY.
 *
 * We do NOT copy prose (descriptions, step bodies, FAQ answers) from
 * airdrops.io — that would be duplicate content + plagiarism. Instead we
 * extract facts (numbers, URLs, counts, short titles) and synthesize a
 * thin summary that links back to airdrops.io as the authoritative guide.
 *
 * What we pull from each detail page:
 *   - Step TITLES only (the generic ones like "Connect wallet", "Deposit
 *     USDC" — facts about *what* to do, not the prose explaining how)
 *   - FAQ QUESTION COUNT (so we can say "covered in a 7-question FAQ")
 *   - Sidebar numbers: Estimated Value, Tokens per Claim, Max Participants
 *   - Overview social links: Twitter, Discord
 *
 * What we generate:
 *   - description_md: 1–2 line summary template with the numbers + outbound link
 *   - how_to_claim_md: numbered list of step TITLES + outbound link for full body
 *
 * Idempotent + capped at `maxRows` fetches per run.
 */
import type { Pool, RowDataPacket } from "mysql2/promise";

interface ParsedDetail {
  airdropsIoUrl: string;
  stepTitles: string[];
  faqCount: number;
  estimatedValue: string | null;       // raw text e.g. "$50K - $200K"
  estimatedValueUsdMax: number | null; // parsed numeric max
  tokensPerClaim: string | null;       // raw text e.g. "100 CHARGE"
  maxParticipants: string | null;      // raw text e.g. "Unlimited" or "10,000"
  twitterUrl: string | null;
  discordUrl: string | null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function extractH2Section(html: string, headingRegex: RegExp): string | null {
  const m = html.match(headingRegex);
  if (!m || m.index == null) return null;
  const closeIdx = html.indexOf("</h2>", m.index);
  if (closeIdx < 0) return null;
  const afterHeading = html.slice(closeIdx + 5);
  const nextH2 = afterHeading.search(/<h2[^>]*>/i);
  return nextH2 >= 0 ? afterHeading.slice(0, nextH2) : afterHeading;
}

function parseStepTitles(html: string): string[] {
  // <h3>Step N: Title</h3> — we keep ONLY the short title, never the body.
  const titles: string[] = [];
  const stepRe = /<h3[^>]*>\s*Step\s+\d+\s*[:\.]\s*([^<]+)<\/h3>/gi;
  let m: RegExpExecArray | null;
  while ((m = stepRe.exec(html)) !== null) {
    const t = decodeEntities(m[1]).trim();
    if (t) titles.push(t);
  }
  return titles.slice(0, 12);
}

function countFaqs(html: string): number {
  return (html.match(/<h3[^>]*>/gi) || []).length;
}

function parseScoreValue(html: string, label: string): string | null {
  const re = new RegExp(
    `<h3[^>]*>\\s*${label}\\s*<\\/h3>\\s*<p\\s+class=['"]score-value['"][^>]*>([\\s\\S]*?)<\\/p>`,
    "i",
  );
  const m = html.match(re);
  if (!m) return null;
  const val = decodeEntities(m[1].replace(/<[^>]+>/g, "").trim());
  if (!val || val.toLowerCase() === "n/a") return null;
  return val;
}

function parseUsdAmount(s: string | null): number | null {
  if (!s) return null;
  const last = s.split(/[-–—]/).pop()?.trim() || "";
  const m = last.match(/\$?\s*([\d,.]+)\s*([kmM]?)/);
  if (!m) return null;
  let n = parseFloat(m[1].replace(/,/g, ""));
  const suffix = (m[2] || "").toLowerCase();
  if (suffix === "k") n *= 1_000;
  if (suffix === "m") n *= 1_000_000;
  return Number.isFinite(n) ? Math.round(n) : null;
}

async function fetchParsedDetail(slug: string): Promise<ParsedDetail | null> {
  try {
    const url = `https://airdrops.io/${slug}/`;
    const res = await fetch(url, {
      headers: {
        "user-agent": "freecrypto.net/1.0 (+https://freecrypto.net)",
        accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    const howSection = extractH2Section(html, /<h2[^>]*>\s*How\s+to\s+(Farm|Participate|Claim|Get)/i);
    const faqSection = extractH2Section(html, /<h2[^>]*>\s*Frequently\s+Asked\s+Questions\s*<\/h2>/i);

    const stepTitles = howSection ? parseStepTitles(howSection) : [];
    const faqCount = faqSection ? countFaqs(faqSection) : 0;

    const estimatedValue = parseScoreValue(html, "Estimated Value");
    const tokensPerClaim = parseScoreValue(html, "Tokens per Claim");
    const maxParticipants = parseScoreValue(html, "Max\\.?\\s*Participants");

    const twitterMatch = html.match(/href=['"](https?:\/\/(?:x|twitter)\.com\/[A-Za-z0-9_]+)['"]/i);
    const discordMatch = html.match(/href=['"](https?:\/\/discord\.(?:gg|com\/invite)\/[A-Za-z0-9_-]+)['"]/i);

    return {
      airdropsIoUrl: url,
      stepTitles,
      faqCount,
      estimatedValue,
      estimatedValueUsdMax: parseUsdAmount(estimatedValue),
      tokensPerClaim,
      maxParticipants,
      twitterUrl: twitterMatch ? twitterMatch[1] : null,
      discordUrl: discordMatch ? discordMatch[1] : null,
    };
  } catch (e) {
    console.error(`airdropsio-detail fetch failed for ${slug}:`, e instanceof Error ? e.message : e);
    return null;
  }
}

/**
 * Build a short, original 1-2 sentence description from the structured data.
 * Uses templates and the project's name — no prose imported.
 */
function buildDescription(name: string, detail: ParsedDetail): string {
  const lines: string[] = [];

  const stepCount = detail.stepTitles.length;
  if (stepCount > 0) {
    lines.push(
      `**${name}** is an active airdrop campaign with a ${stepCount}-step participation flow.`,
    );
  } else {
    lines.push(`**${name}** is an active airdrop campaign.`);
  }

  const facts: string[] = [];
  if (detail.estimatedValue) facts.push(`Estimated value: ${detail.estimatedValue}`);
  if (detail.tokensPerClaim) facts.push(`Tokens per claim: ${detail.tokensPerClaim}`);
  if (detail.maxParticipants) facts.push(`Max participants: ${detail.maxParticipants}`);
  if (detail.faqCount > 0) facts.push(`${detail.faqCount}-question FAQ on the source guide`);

  if (facts.length > 0) {
    lines.push("");
    for (const f of facts) lines.push(`- ${f}`);
  }

  lines.push("");
  lines.push(`Read the full participation guide on [airdrops.io](${detail.airdropsIoUrl}).`);
  return lines.join("\n");
}

/**
 * Build the "How to claim" body as a numbered list of step TITLES only,
 * with a clear pointer to airdrops.io for the per-step instructions.
 */
function buildHowToClaim(name: string, detail: ParsedDetail): string {
  if (detail.stepTitles.length === 0) return "";
  const lines: string[] = [];
  lines.push(`This airdrop has ${detail.stepTitles.length} steps to qualify:`);
  lines.push("");
  detail.stepTitles.forEach((t, i) => {
    lines.push(`${i + 1}. **${t}**`);
  });
  lines.push("");
  lines.push(
    `For the per-step instructions, screenshots, and tips, see the full guide on [airdrops.io](${detail.airdropsIoUrl}).`,
  );
  void name;
  return lines.join("\n");
}

export interface EnrichStats {
  scanned: number;
  enriched: number;
  failed: number;
  durationMs: number;
}

export async function enrichAirdropsIoRows(pool: Pool, maxRows = 25): Promise<EnrichStats> {
  const t0 = Date.now();
  const stats: EnrichStats = { scanned: 0, enriched: 0, failed: 0, durationMs: 0 };

  const [srcRows] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM sources WHERE slug = 'airdropsio' LIMIT 1",
  );
  const srcId = (srcRows[0] as { id: number } | undefined)?.id;
  if (!srcId) {
    stats.durationMs = Date.now() - t0;
    return stats;
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, slug, name, project_url, description_md, how_to_claim_md
     FROM airdrops
     WHERE primary_source_id = ?
       AND deleted_at IS NULL
       AND LENGTH(description_md) < 100
     ORDER BY updated_at DESC
     LIMIT ?`,
    [srcId, maxRows],
  );
  const candidates = rows as Array<{
    id: number;
    slug: string;
    name: string;
    project_url: string | null;
    description_md: string;
    how_to_claim_md: string;
  }>;
  stats.scanned = candidates.length;

  for (const row of candidates) {
    let airdropsSlug = row.slug;
    if (row.project_url) {
      const m = row.project_url.match(/airdrops\.io\/([^/]+)\/?/i);
      if (m) airdropsSlug = m[1];
    }

    const detail = await fetchParsedDetail(airdropsSlug);
    if (!detail) {
      stats.failed++;
      continue;
    }
    if (detail.stepTitles.length === 0 && !detail.estimatedValue && detail.faqCount === 0) {
      // Nothing useful to extract — skip rather than write empty templates.
      stats.failed++;
      continue;
    }

    const newDescription = buildDescription(row.name, detail);
    const newHowToClaim = buildHowToClaim(row.name, detail);

    try {
      await pool.query(
        `UPDATE airdrops SET
           description_md          = CASE WHEN LENGTH(description_md)  < 100 THEN ? ELSE description_md END,
           how_to_claim_md         = CASE WHEN LENGTH(how_to_claim_md) <  50 THEN ? ELSE how_to_claim_md END,
           twitter_url             = COALESCE(twitter_url, ?),
           discord_url             = COALESCE(discord_url, ?),
           estimated_value_usd_max = COALESCE(estimated_value_usd_max, ?)
         WHERE id = ?`,
        [
          newDescription,
          newHowToClaim || "",
          detail.twitterUrl,
          detail.discordUrl,
          detail.estimatedValueUsdMax,
          row.id,
        ],
      );
      stats.enriched++;
    } catch (e) {
      console.error(`enrich update failed for ${row.slug}:`, e instanceof Error ? e.message : e);
      stats.failed++;
    }

    // Polite rate limit.
    await new Promise((r) => setTimeout(r, 250));
  }

  stats.durationMs = Date.now() - t0;
  return stats;
}
