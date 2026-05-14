import { listAirdrops } from "@/lib/db";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 600;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const airdrops = await listAirdrops({ limit: 50, sort: "newest" });
  const now = new Date().toUTCString();

  const items = airdrops
    .map((a) => {
      const link = siteUrl(`/airdrops/${a.slug}`);
      const pubDate = a.updated_at.toUTCString();
      const desc = a.short_description || "";
      return `
    <item>
      <title>${escapeXml(a.name)} Airdrop</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(desc)}</description>
      <category>${escapeXml(a.category_name || "")}</category>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>freecrypto.net — Latest Airdrops</title>
    <link>${siteUrl("/")}</link>
    <description>Verified crypto airdrops, updated daily.</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
    },
  });
}
