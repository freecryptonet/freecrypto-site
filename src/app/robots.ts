import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

// AI scrapers / model trainers. Block to keep daily-verified airdrop data
// out of training datasets.
const AI_BOTS = [
  "ClaudeBot",
  "anthropic-ai",
  "GPTBot",
  "OAI-SearchBot",
  "Google-Extended",
  "CCBot",
  "Bytespider",
  "PerplexityBot",
  "Amazonbot",
  "Applebot-Extended",
  "Meta-ExternalAgent",
  "Meta-ExternalFetcher",
  "FacebookBot",
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
