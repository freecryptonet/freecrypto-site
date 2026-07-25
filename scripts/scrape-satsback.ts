/**
 * Curated Satsback store scraper. Facts only (name, slug, cashback label, logo).
 * Writes seeds/stores.raw.json. Run locally — needs a browser, not on the VPS.
 *
 *   npx playwright install chromium   # one-time
 *   npm run scrape:satsback
 *
 * Satsback returns 403 to plain fetch but renders under a real browser. The
 * public /stores grid exposes the curated popular set (~120), which is our
 * Phase-1 target — we do NOT crawl the full 10k catalogue.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

interface RawStore {
  satsback_slug: string;
  name: string;
  cashback_text: string | null;
  logo_url: string | null;
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  });
  await page.goto("https://satsback.com/stores", { waitUntil: "networkidle" });

  const stores: RawStore[] = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a[href*="/store/"]'));
    const seen = new Set<string>();
    const out: RawStore[] = [];
    for (const a of anchors) {
      const href = a.getAttribute("href") || "";
      const m = href.match(/\/store\/([^/?#]+)/);
      if (!m) continue;
      const slug = m[1];
      if (seen.has(slug)) continue;
      seen.add(slug);
      const img = a.querySelector("img");
      const name = (img?.getAttribute("alt") || a.textContent || "").trim().split("\n")[0].trim();
      let logo = img?.getAttribute("src") || null;
      if (logo && logo.startsWith("/")) logo = "https://satsback.com" + logo;
      const txt = (a.textContent || "").replace(/\s+/g, " ").trim();
      const cb = txt.match(
        /up to [\d.,]+\s*%|up to [\d.,]+\s*sats|[\d€]+\s*%?\s*discount code|\d+\s*free month|[\d.,]+\s*sats/i,
      );
      out.push({
        satsback_slug: slug,
        name,
        cashback_text: cb ? cb[0].replace(/\s+/g, " ").trim() : null,
        logo_url: logo,
      });
    }
    return out;
  });

  await browser.close();
  const outPath = path.join(process.cwd(), "seeds", "stores.raw.json");
  fs.writeFileSync(outPath, JSON.stringify(stores, null, 2));
  console.log(`Wrote ${stores.length} stores to ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
