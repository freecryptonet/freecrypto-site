import type { MetadataRoute } from "next";
import {
  listChains,
  listCategories,
  listAirdropSlugsForSitemap,
  listGuideSlugsForSitemap,
  listStoreSlugsForSitemap,
  listStoreCategories,
} from "@/lib/db";
import { MIN_INDEXABLE_DESCRIPTION_CHARS, siteUrl } from "@/lib/seo";
import { BONUS_OFFERS } from "@/lib/bonuses";
import { nlCategorySlug } from "@/lib/store-i18n";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [airdrops, chains, categories, guides, stores, storeCats, nlStores, nlStoreCats] = await Promise.all([
    listAirdropSlugsForSitemap(),
    listChains(),
    listCategories(),
    listGuideSlugsForSitemap(),
    listStoreSlugsForSitemap("en"),
    listStoreCategories("en"),
    listStoreSlugsForSitemap("nl"),
    listStoreCategories("nl"),
  ]);

  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl("/"), lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: siteUrl("/earn"), lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: siteUrl("/shop"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: siteUrl("/bonus"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: siteUrl("/airdrops"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: siteUrl("/check"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: siteUrl("/calendar"), lastModified: now, changeFrequency: "daily", priority: 0.6 },
    { url: siteUrl("/guides"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: siteUrl("/about"), lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  const bonusRoutes: MetadataRoute.Sitemap = BONUS_OFFERS.map((o) => ({
    url: siteUrl(`/bonus/${o.slug}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
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

  // Dutch (nl) cluster.
  const nlStoreRoutes: MetadataRoute.Sitemap = nlStores
    .filter((s) => s.content_chars >= MIN_INDEXABLE_DESCRIPTION_CHARS)
    .map((s) => ({
      url: siteUrl(`/nl/shop/${s.slug}`),
      lastModified: s.updated_at,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  const nlStoreCategoryRoutes: MetadataRoute.Sitemap = nlStoreCats
    .filter((c) => c.store_count > 0)
    .map((c) => ({
      url: siteUrl(`/nl/shop/category/${nlCategorySlug(c.slug)}`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    }));
  const nlStaticRoutes: MetadataRoute.Sitemap = nlStoreRoutes.length
    ? [{ url: siteUrl("/nl/shop"), lastModified: now, changeFrequency: "daily", priority: 0.8 }]
    : [];

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

  return [
    ...staticRoutes,
    ...nlStaticRoutes,
    ...bonusRoutes,
    ...storeRoutes,
    ...storeCategoryRoutes,
    ...nlStoreRoutes,
    ...nlStoreCategoryRoutes,
    ...guideRoutes,
    ...airdropRoutes,
    ...chainRoutes,
    ...categoryRoutes,
  ];
}
