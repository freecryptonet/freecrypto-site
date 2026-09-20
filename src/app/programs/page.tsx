import type { Metadata } from "next";
import Link from "next/link";
import { AAds } from "@/components/AAds";
import { ProgramLogo } from "@/components/ProgramCards";
import {
  OPPORTUNITIES,
  CATEGORY_META,
  opportunitiesByCategory,
  officialUrl,
  overallScore,
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
              <div className="flex items-end justify-between gap-3">
                <h2 className="text-h2">{s.meta.label}</h2>
                <Link
                  href={`/programs/category/${s.cat}`}
                  className={`shrink-0 text-sm font-bold hover:underline ${
                    s.meta.tone === "shop" ? "text-accent-warm" : "text-accent-alt"
                  }`}
                >
                  Full guide →
                </Link>
              </div>
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

      <section className="mt-16">
        <div className="h-[3px] w-11 rounded bg-accent-alt mb-4" />
        <h2 className="text-h2">Popular head-to-head comparisons</h2>
        <p className="mt-2 text-text-dim max-w-2xl">Torn between two? See them scored side by side on the same five criteria.</p>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { href: "/programs/compare/coinbase-vs-kraken", label: "Coinbase vs Kraken" },
            { href: "/programs/compare/bitvavo-vs-coinbase", label: "Bitvavo vs Coinbase" },
            { href: "/programs/compare/bitvavo-vs-kraken", label: "Bitvavo vs Kraken" },
            { href: "/programs/compare/ledger-vs-trezor", label: "Ledger vs Trezor" },
            { href: "/programs/compare/cryptocom-vs-nexo-card", label: "Crypto.com Card vs Nexo Card" },
            { href: "/programs/compare/lolli-vs-fold", label: "Lolli vs Fold" },
          ].map((c) => (
            <Link key={c.href} href={c.href} className="card p-4 flex items-center justify-between gap-3 transition-colors hover:border-accent/60">
              <span className="font-bold text-[15px]">{c.label}</span>
              <span className="text-accent-alt font-bold" aria-hidden>→</span>
            </Link>
          ))}
        </div>
      </section>

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
  const url = officialUrl(o.slug);
  return (
    <div
      className={`card p-5 flex flex-col transition-colors ${
        tone === "shop" ? "hover:border-accent-warm/60" : "hover:border-accent/60"
      }`}
    >
      <div className="flex items-start gap-3">
        <ProgramLogo slug={o.slug} name={o.name} tone={tone} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-h3 leading-tight">
              <Link href={`/programs/${o.slug}`} className="hover:underline">
                {o.name}
              </Link>
            </h3>
            {(() => {
              const sc = overallScore(o.slug);
              return sc != null ? (
                <span className={`font-mono text-sm font-extrabold tabular-nums shrink-0 ${tone === "shop" ? "text-accent-warm" : "text-accent-alt"}`}>
                  {sc.toFixed(1)}<span className="text-text-faint text-[10px] font-bold">/10</span>
                </span>
              ) : null;
            })()}
          </div>
          <div
            className={`mt-0.5 font-mono text-sm font-bold ${
              tone === "shop" ? "text-accent-warm" : "text-accent-alt"
            }`}
          >
            {o.reward}
          </div>
        </div>
      </div>
      <p className="mt-2 text-sm text-text-dim flex-1">{o.blurb}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-text-faint">
        <span>Effort: {o.effort}</span>
        <span aria-hidden>·</span>
        <span>{o.geo}</span>
        <span aria-hidden>·</span>
        <span>{o.payoutType}</span>
      </div>
      <div className="mt-4 flex items-center gap-3 border-t border-edge pt-3">
        {url && (
          <a
            href={url}
            target="_blank"
            rel="sponsored nofollow noopener"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-sm font-bold text-ink ${
              tone === "shop" ? "bg-accent-warm" : "bg-accent"
            } hover:opacity-90 transition-opacity`}
          >
            Visit {o.name} ↗
          </a>
        )}
        <Link
          href={`/programs/${o.slug}`}
          className="text-sm font-bold text-text-dim hover:text-text"
        >
          {o.review ? "Read review →" : "Details →"}
        </Link>
      </div>
    </div>
  );
}
