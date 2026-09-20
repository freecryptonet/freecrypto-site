import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

// AI *training* scrapers — blocked to keep our content out of model training
// sets. NOTE: AI *search* crawlers (OAI-SearchBot, PerplexityBot, Google-Extended)
// are deliberately NOT blocked — they drive discovery + referral traffic, which
// a new low-authority site needs. Only pure trainers/scrapers stay blocked.
const AI_BOTS = [
  "GPTBot",
  "ClaudeBot",
  "anthropic-ai",
  "CCBot",
  "Bytespider",
  "Amazonbot",
  "Applebot-Extended",
  "Meta-ExternalAgent",
  "Meta-ExternalFetcher",
  "Diffbot",
  "ImagesiftBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/visit/"],
      },
      ...AI_BOTS.map((userAgent) => ({
        userAgent,
        disallow: "/",
      })),
    ],
    sitemap: siteUrl("/sitemap.xml"),
    host: siteUrl(""),
  };
}
