/**
 * One-off probe: run the airdrops.io adapter locally and report what came back.
 * No DB needed. Run with: tsx scripts/test-airdropsio.ts
 */
import { airdropsIoSource } from "../src/lib/ingest/sources/airdropsio";

async function main() {
  console.log("fetching airdrops.io /latest/ via adapter...");
  const rows = await airdropsIoSource.fetch();
  console.log(`got ${rows.length} normalized rows`);
  for (const r of rows.slice(0, 20)) {
    console.log(`  - ${r.name} [${r.suggested_slug}] score=${r.social_score} status=${r.status}`);
  }

  // Also do a raw fetch + parse-without-filters to see what airdrops.io actually returned
  const res = await fetch("https://airdrops.io/latest/", {
    headers: {
      "user-agent": "freecrypto.net/1.0 (+https://freecrypto.net)",
      accept: "text/html,application/xhtml+xml",
    },
  });
  const html = await res.text();
  console.log(`\nraw probe: HTTP ${res.status}, body ${html.length} bytes`);

  const wrapperCount = (html.match(/air-wrapper\s+temperature-\d+/g) || []).length;
  console.log(`  air-wrapper instances in HTML: ${wrapperCount}`);
  console.log(`  first 300 chars: ${html.slice(0, 300).replace(/\s+/g, " ")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
