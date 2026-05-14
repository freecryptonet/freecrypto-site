import type { MetadataRoute } from "next";
import { listAirdrops, listChains, listCategories, listGuides } from "@/lib/db";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [airdrops, chains, categories, guides] = await Promise.all([
    listAirdrops({ limit: 1000 }),
    listChains(),
    listCategories(),
    listGuides(200),
  ]);

  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl("/"), lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: siteUrl("/check"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: siteUrl("/guides"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
  ];

  const guideRoutes: MetadataRoute.Sitemap = guides.map((g) => ({
    url: siteUrl(`/guides/${g.slug}`),
    lastModified: g.updated_at,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const airdropRoutes: MetadataRoute.Sitemap = airdrops.map((a) => ({
    url: siteUrl(`/airdrops/${a.slug}`),
    lastModified: a.updated_at,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const chainRoutes: MetadataRoute.Sitemap = chains.map((c) => ({
    url: siteUrl(`/chains/${c.slug}`),
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: siteUrl(`/categories/${c.slug}`),
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  return [...staticRoutes, ...guideRoutes, ...airdropRoutes, ...chainRoutes, ...categoryRoutes];
}
