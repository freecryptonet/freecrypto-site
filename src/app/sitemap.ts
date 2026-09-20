import type { MetadataRoute } from "next";
import { listStoreSlugsForSitemap, listStoreCategories } from "@/lib/db";
import { MIN_INDEXABLE_DESCRIPTION_CHARS, siteUrl } from "@/lib/seo";
import { OPPORTUNITIES } from "@/lib/opportunities";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [stores, storeCats] = await Promise.all([
    listStoreSlugsForSitemap("en"),
    listStoreCategories("en"),
  ]);

  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl("/"), lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: siteUrl("/programs"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: siteUrl("/earn"), lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: siteUrl("/shop"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: siteUrl("/calculator"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: siteUrl("/methodology"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: siteUrl("/about"), lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  const programRoutes: MetadataRoute.Sitemap = OPPORTUNITIES.map((o) => ({
    url: siteUrl(`/programs/${o.slug}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: o.review ? 0.7 : 0.5,
  }));

  const programCategoryRoutes: MetadataRoute.Sitemap = [
    "exchange",
    "learn-earn",
    "cashback",
    "card",
    "hardware",
    "onramp",
    "gpt",
  ].map((cat) => ({
    url: siteUrl(`/programs/category/${cat}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Store pages: only indexable rows (curated, >= threshold combined content).
  const storeRoutes: MetadataRoute.Sitemap = stores
    .filter((s) => s.content_chars >= MIN_INDEXABLE_DESCRIPTION_CHARS)
    .map((s) => ({
      url: siteUrl(`/shop/${s.slug}`),
      lastModified: s.updated_at,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  // Store category hubs: comparative pages, worth indexing when they list stores.
  const storeCategoryRoutes: MetadataRoute.Sitemap = storeCats
    .filter((c) => c.store_count > 0)
    .map((c) => ({
      url: siteUrl(`/shop/category/${c.slug}`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

  return [
    ...staticRoutes,
    ...programCategoryRoutes,
    ...programRoutes,
    ...storeRoutes,
    ...storeCategoryRoutes,
  ];
}
