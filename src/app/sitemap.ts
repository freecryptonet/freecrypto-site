import type { MetadataRoute } from "next";
import {
  listChains,
  listCategories,
  listAirdropSlugsForSitemap,
  listGuideSlugsForSitemap,
} from "@/lib/db";
import { MIN_INDEXABLE_DESCRIPTION_CHARS, siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [airdrops, chains, categories, guides] = await Promise.all([
    listAirdropSlugsForSitemap(),
    listChains(),
    listCategories(),
    listGuideSlugsForSitemap(),
  ]);

  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl("/"), lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: siteUrl("/check"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: siteUrl("/calendar"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: siteUrl("/guides"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: siteUrl("/about"), lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  // Airdrops: only include rows with body text above the indexability
  // threshold. Thin auto-ingested rows get crawled (we still link to them)
  // but they emit a `noindex` meta and stay out of the sitemap so Google
  // doesn't burn crawl budget on URLs it would skip anyway.
  const airdropRoutes: MetadataRoute.Sitemap = airdrops
    .filter((a) => a.content_chars >= MIN_INDEXABLE_DESCRIPTION_CHARS)
    .map((a) => ({
      url: siteUrl(`/airdrops/${a.slug}`),
      lastModified: a.updated_at,
      changeFrequency: "daily",
      priority: 0.8,
    }));

  const guideRoutes: MetadataRoute.Sitemap = guides
    .filter((g) => g.content_chars >= MIN_INDEXABLE_DESCRIPTION_CHARS)
    .map((g) => ({
      url: siteUrl(`/guides/${g.slug}`),
      lastModified: g.updated_at,
      changeFrequency: "monthly",
      priority: 0.6,
    }));

  // Chain / category index pages list other airdrops (real content) so they
  // are always worth including even if the description column is empty.
  const chainRoutes: MetadataRoute.Sitemap = chains
    .filter((c) => c.airdrop_count > 0)
    .map((c) => ({
      url: siteUrl(`/chains/${c.slug}`),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.6,
    }));

  const categoryRoutes: MetadataRoute.Sitemap = categories
    .filter((c) => c.airdrop_count > 0)
    .map((c) => ({
      url: siteUrl(`/categories/${c.slug}`),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.6,
    }));

  return [...staticRoutes, ...guideRoutes, ...airdropRoutes, ...chainRoutes, ...categoryRoutes];
}
