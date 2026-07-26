/**
 * Self-host store logos. Reads seeds/stores.raw.json, downloads each store's
 * logo from its (Satsback CDN) URL into public/store-logos/{slug}.{ext}, and
 * rewrites logo_url to the local path. Logos that 404 or aren't images are set
 * to null so the StoreLogo component falls back to a monogram.
 *
 * Run locally (needs network), then rebuild + seed:
 *   npx tsx scripts/download-store-logos.ts
 *   npx tsx scripts/build-store-content.ts
 *   npm run seed
 */
import fs from "node:fs";
import path from "node:path";

interface RawStore { satsback_slug: string; name: string; cashback_text: string | null; logo_url: string | null }

const OUT_DIR = path.join(process.cwd(), "public", "store-logos");
const RAW = path.join(process.cwd(), "seeds", "stores.raw.json");

const EXT_BY_TYPE: Record<string, string> = {
  "image/svg+xml": "svg",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
};

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const stores: RawStore[] = JSON.parse(fs.readFileSync(RAW, "utf8"));
  let ok = 0, failed = 0, skipped = 0;

  for (const s of stores) {
    const url = s.logo_url;
    if (!url || !/^https?:\/\//.test(url)) { skipped++; continue; }
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; freecrypto/1.0)" } });
      const type = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
      if (!res.ok || !type.startsWith("image/")) {
        s.logo_url = null;
        failed++;
        continue;
      }
      const ext = EXT_BY_TYPE[type] || (url.match(/\.(svg|png|jpe?g|gif|webp)(?:$|\?)/i)?.[1] ?? "img").toLowerCase().replace("jpeg", "jpg");
      const buf = Buffer.from(await res.arrayBuffer());
      const file = `${s.satsback_slug}.${ext}`;
      fs.writeFileSync(path.join(OUT_DIR, file), buf);
      s.logo_url = `/store-logos/${file}`;
      ok++;
    } catch {
      s.logo_url = null;
      failed++;
    }
  }

  fs.writeFileSync(RAW, JSON.stringify(stores, null, 2));
  console.log(`Logos: ${ok} downloaded, ${failed} failed→null, ${skipped} skipped. Wrote ${OUT_DIR}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
