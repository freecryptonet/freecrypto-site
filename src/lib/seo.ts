import type { AirdropDetail } from "@/lib/db";

export function siteUrl(path = "/"): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://freecrypto.net";
  return new URL(path, base).toString();
}

export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

export function airdropEventJsonLd(a: AirdropDetail) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: `${a.name} Airdrop`,
    description: a.short_description || a.description_md.slice(0, 200),
    startDate: a.started_at?.toISOString() ?? undefined,
    endDate: a.end_date?.toISOString() ?? undefined,
    eventStatus:
      a.status === "ended"
        ? "https://schema.org/EventCancelled"
        : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    location: {
      "@type": "VirtualLocation",
      url: a.project_url || siteUrl(`/airdrops/${a.slug}`),
    },
    organizer: a.project_url
      ? {
          "@type": "Organization",
          name: a.name,
          url: a.project_url,
        }
      : undefined,
    image: a.logo_url ?? undefined,
    url: siteUrl(`/airdrops/${a.slug}`),
  };
}

export function faqJsonLd(faqs: Array<{ question: string; answer_md: string }>) {
  if (!faqs.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer_md,
      },
    })),
  };
}

export function jsonLdScript(payload: unknown): string {
  return JSON.stringify(payload).replace(/</g, "\\u003c");
}

/**
 * Minimum visible body content (in characters of markdown source) below
 * which we treat a detail page as too thin to deserve a slot in Google's
 * index. Pages below this threshold:
 *   - are EXCLUDED from sitemap.xml
 *   - emit `<meta name="robots" content="noindex, follow">` so any internal
 *     or external link that does crawl them still passes equity onward but
 *     the URL itself stays out of the index
 *
 * Threshold reflects what Google's quality classifier tends to skip: a
 * description shorter than ~150 words ≈ 800 chars rarely outranks the
 * source it summarises. The few rich editorial entries (Monad, MegaETH,
 * Berachain, Symbiotic, Polymarket — all >1500 words) clear it easily.
 */
export const MIN_INDEXABLE_DESCRIPTION_CHARS = 800;

export function isAirdropIndexable(a: {
  description_md: string;
  eligibility_md?: string;
  how_to_claim_md?: string;
}): boolean {
  const total =
    (a.description_md?.length ?? 0) +
    (a.eligibility_md?.length ?? 0) +
    (a.how_to_claim_md?.length ?? 0);
  return total >= MIN_INDEXABLE_DESCRIPTION_CHARS;
}

export function isGuideIndexable(g: { body_md?: string | null; excerpt?: string | null }): boolean {
  const total = (g.body_md?.length ?? 0) + (g.excerpt?.length ?? 0);
  return total >= MIN_INDEXABLE_DESCRIPTION_CHARS;
}

export function isStoreIndexable(s: {
  description_md: string;
  how_it_works_md?: string;
  worth_it_md?: string;
}): boolean {
  const total =
    (s.description_md?.length ?? 0) +
    (s.how_it_works_md?.length ?? 0) +
    (s.worth_it_md?.length ?? 0);
  return total >= MIN_INDEXABLE_DESCRIPTION_CHARS;
}
