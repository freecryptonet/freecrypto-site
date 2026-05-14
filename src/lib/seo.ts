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
