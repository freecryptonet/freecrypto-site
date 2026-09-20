import type { Metadata } from "next";
import Link from "next/link";
import { AAds } from "@/components/AAds";
import {
  OPPORTUNITIES,
  CATEGORY_META,
  opportunitiesByCategory,
  type Opportunity,
  type OppCategory,
} from "@/lib/opportunities";
import { siteUrl, breadcrumbJsonLd, jsonLdScript } from "@/lib/seo";

export const dynamic = "force-static";

const title = "Every way to earn crypto in 2026 — curated & ranked";
const description =
  "A hand-checked directory of the real ways to earn crypto: exchange sign-up bonuses, learn-and-earn, Bitcoin cashback, reward cards, on-ramps and more — with honest terms, effort and region for each.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/programs" },
};

// Display order: pillars first, then supporting categories.
const ORDER: OppCategory[] = [
  "exchange",
  "learn-earn",
  "cashback",
  "card",
  "hardware",
  "onramp",
  "gpt",
];

export default function ProgramsPage() {
  const sections = ORDER.map((cat) => ({
    cat,
    meta: CATEGORY_META[cat],
    items: opportunitiesByCategory(cat),
  })).filter((s) => s.items.length > 0);

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: OPPORTUNITIES.map((o, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: o.name,
      url: siteUrl(`/programs/${o.slug}`),
    })),
  };

  return (
    <div className="mx-auto max-w-page px-4 py-12">
      <nav className="font-mono text-xs text-text-faint mb-6" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-text-dim">Home</Link> / Programs
      </nav>

      <header className="max-w-2xl">
        <div className="h-[3px] w-11 rounded bg-accent mb-4" />
        <h1 className="text-h1-page">Every way to earn crypto, curated &amp; ranked</h1>
        <p className="mt-3 text-lg text-text-dim">
          {OPPORTUNITIES.length} hand-checked programs across {sections.length} categories —
          with the honest reward, effort and region for each. No inflated numbers, no random
          faucet spam.
        </p>
        <p className="mt-3 font-mono text-xs text-text-faint">
          Last reviewed Sep 2026 · terms change often — always check the current offer ·
          some links are affiliate links (disclosed).
        </p>
      </header>

      {/* Category quick-nav */}
      <div className="mt-8 flex flex-wrap gap-2">
        {sections.map((s) => (
          <a
            key={s.cat}
            href={`#${s.cat}`}
            className="chip hover:!text-text transition-colors"
          >
            {s.meta.short}
            <span className="ml-1 text-text-faint">{s.items.length}</span>
          </a>
        ))}
      </div>

      <div className="my-10 flex justify-center">
        <AAds zone="leaderboard" />
      </div>

      <div className="space-y-14">
        {sections.map((s, idx) => (
          <section key={s.cat} id={s.cat} className="scroll-mt-20">
            <div className="mb-5">
              <div
                className={`h-[3px] w-11 rounded mb-3 ${
                  s.meta.tone === "shop" ? "bg-accent-warm" : "bg-accent"
                }`}
              />
              <h2 className="text-h2">{s.meta.label}</h2>
              <p className="mt-1.5 text-text-dim max-w-2xl">{s.meta.blurb}</p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {s.items.map((o) => (
                <ProgramCard key={o.slug} o={o} />
              ))}
            </div>
            {idx === 1 && (
              <div className="mt-10 flex justify-center">
                <AAds zone="inline" />
              </div>
            )}
          </section>
        ))}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: "Home", url: siteUrl("/") },
              { name: "Programs", url: siteUrl("/programs") },
            ]),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(itemList) }}
      />
    </div>
  );
}

function ProgramCard({ o }: { o: Opportunity }) {
  const tone = CATEGORY_META[o.category].tone;
  return (
    <Link
      href={`/programs/${o.slug}`}
      className={`card p-5 flex flex-col transition-colors ${
        tone === "shop" ? "hover:border-accent-warm/60" : "hover:border-accent/60"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-h3">{o.name}</h3>
        {o.regulated ? (
          <span className="chip chip-confirmed shrink-0">✓ regulated</span>
        ) : (
          <span className="chip shrink-0">check terms</span>
        )}
      </div>
      <div
        className={`mt-1 font-mono text-sm font-bold ${
          tone === "shop" ? "text-accent-warm" : "text-accent-alt"
        }`}
      >
        {o.reward}
      </div>
      <p className="mt-2 text-sm text-text-dim flex-1">{o.blurb}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-text-faint">
        <span>Effort: {o.effort}</span>
        <span aria-hidden>·</span>
        <span>{o.geo}</span>
        <span aria-hidden>·</span>
        <span>{o.payoutType}</span>
      </div>
      <div className={`mt-3 text-sm font-bold ${tone === "shop" ? "text-accent-warm" : "text-accent"}`}>
        {o.review ? "Read the review →" : "See details →"}
      </div>
    </Link>
  );
}
