import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AAds } from "@/components/AAds";
import {
  OPPORTUNITIES,
  CATEGORY_META,
  getOpportunity,
  officialUrl,
  opportunitiesByCategory,
  overallScore,
  comparisonsFor,
} from "@/lib/opportunities";
import { ScoreNumber, ScoreMeter, ProgramLogo } from "@/components/ProgramCards";
import { siteUrl, breadcrumbJsonLd, jsonLdScript } from "@/lib/seo";

export const dynamic = "force-static";

export function generateStaticParams() {
  return OPPORTUNITIES.map((o) => ({ slug: o.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const o = getOpportunity(slug);
  if (!o) return {};
  const title = `${o.name} review — reward, terms & how to start`;
  const description = `${o.name}: ${o.blurb} Reward: ${o.reward}. Effort: ${o.effort}. Region: ${o.geo}. Honest terms and how it pays.`;
  return { title, description, alternates: { canonical: `/programs/${o.slug}` } };
}

export default async function ProgramDetailPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const o = getOpportunity(slug);
  if (!o) notFound();

  const meta = CATEGORY_META[o.category];
  const url = officialUrl(o.slug);
  const related = opportunitiesByCategory(o.category).filter((x) => x.slug !== o.slug).slice(0, 3);
  const comparisons = comparisonsFor(o.slug);
  const accentText = meta.tone === "shop" ? "text-accent-warm" : "text-accent-alt";

  const facts: Array<[string, string]> = [
    ["Reward", o.reward],
    ["Paid in", o.payoutType],
    ["Effort", o.effort],
    ["Region", o.geo],
    ["Regulated", o.regulated ? "Yes — licensed" : "Check status"],
    ["Last checked", o.lastChecked],
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <nav className="font-mono text-xs text-text-faint mb-6" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-text-dim">Home</Link> /{" "}
        <Link href="/programs" className="hover:text-text-dim">Programs</Link> / {o.name}
      </nav>

      <header>
        <div className="font-mono text-xs uppercase tracking-[0.12em] text-text-faint">
          {meta.label}
        </div>
        <div className="mt-2 flex items-center gap-3 flex-wrap">
          <ProgramLogo slug={o.slug} name={o.name} tone={meta.tone} />
          <h1 className="text-h1-page">{o.name}</h1>
          {o.regulated ? (
            <span className="chip chip-confirmed">✓ regulated</span>
          ) : (
            <span className="chip">check terms</span>
          )}
        </div>
        <div className={`mt-2 font-mono text-lg font-bold ${accentText}`}>{o.reward}</div>
        <p className="mt-3 font-mono text-xs text-text-faint">
          Reviewed by the freecrypto.net editorial team · scored on{" "}
          <Link href="/methodology" className="hover:text-text-dim underline">5 fixed criteria</Link> · last checked {o.lastChecked}
        </p>
      </header>

      {/* Facts + CTA */}
      <div className="mt-6 grid gap-4 md:grid-cols-[1.4fr_1fr] items-start">
        <dl className="card p-5 grid grid-cols-2 gap-x-4 gap-y-3">
          {facts.map(([k, v]) => (
            <div key={k}>
              <dt className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-faint">{k}</dt>
              <dd className="text-sm font-semibold text-text mt-0.5">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="card p-5">
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="sponsored nofollow noopener"
              className="inline-flex w-full justify-center items-center gap-2 px-5 py-3 rounded-btn bg-text text-ink font-bold hover:opacity-90 transition-opacity"
            >
              Go to {o.name} →
            </a>
          ) : null}
          <p className="mt-2 text-[11px] text-text-faint text-center">
            Opens the official site. Some links are affiliate links — no extra cost to you.
          </p>
        </div>
      </div>

      {/* Transparent score */}
      {overallScore(o.slug) != null && (
        <section className="mt-6 card p-5">
          <div className="flex items-center gap-4 mb-4">
            <ScoreNumber slug={o.slug} tone={meta.tone} size="lg" />
            <div>
              <div className="font-semibold">Our score for {o.name}</div>
              <div className="text-xs text-text-faint">
                Average of five fixed criteria — see{" "}
                <Link href="/methodology" className="text-accent hover:underline">how we score</Link>.
              </div>
            </div>
          </div>
          <ScoreMeter slug={o.slug} tone={meta.tone} />
        </section>
      )}

      {/* The honest catch */}
      <div className="mt-6 rounded-card border border-accent-warm/40 bg-accent-warm/[0.06] p-4">
        <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-accent-warm font-bold">
          The catch
        </div>
        <p className="mt-1 text-sm text-text-dim">{o.catch}</p>
      </div>

      <div className="my-10 flex justify-center">
        <AAds zone="leaderboard" />
      </div>

      {/* Review body */}
      {o.review && o.review.length > 0 ? (
        <div className="prose max-w-none">
          <h2>Is {o.name} worth it?</h2>
          {o.review.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      ) : (
        <div className="prose max-w-none">
          <p>
            {o.blurb} It sits in our <Link href="/programs">{meta.label.toLowerCase()}</Link>{" "}
            category. Reward and availability change often — check the current terms on the
            official site before signing up, and read our{" "}
            <Link href="/methodology">methodology</Link> for how we rate these.
          </p>
        </div>
      )}

      {/* Head-to-head comparisons */}
      {comparisons.length > 0 && (
        <section className="mt-12 border-t border-edge pt-8">
          <h2 className="text-h2 mb-4">{o.name} head-to-head</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {comparisons.map(({ pair, other }) => (
              <Link key={pair} href={`/programs/compare/${pair}`} className="card p-4 flex items-center justify-between gap-3 hover:border-accent/60 transition-colors">
                <span className="font-bold text-[15px]">{o.name} vs {other.name}</span>
                <span className="text-accent-alt font-bold" aria-hidden>→</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-12 border-t border-edge pt-8">
          <h2 className="text-h2 mb-4">More {meta.short.toLowerCase()}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {related.map((r) => (
              <Link key={r.slug} href={`/programs/${r.slug}`} className="card p-4 hover:border-accent/60 transition-colors">
                <div className="font-semibold">{r.name}</div>
                <div className={`mt-1 font-mono text-xs font-bold ${accentText}`}>{r.reward}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <p className="mt-10 text-xs text-text-faint">
        Not financial advice. Crypto earnings are small and variable and availability varies by
        country. Reward last checked {o.lastChecked}.
      </p>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: "Home", url: siteUrl("/") },
              { name: "Programs", url: siteUrl("/programs") },
              { name: o.name, url: siteUrl(`/programs/${o.slug}`) },
            ]),
          ),
        }}
      />
      {overallScore(o.slug) != null && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdScript({
              "@context": "https://schema.org",
              "@type": "Review",
              name: `${o.name} review`,
              itemReviewed: { "@type": "Organization", name: o.name, url: url ?? undefined },
              reviewRating: {
                "@type": "Rating",
                ratingValue: overallScore(o.slug),
                bestRating: 10,
                worstRating: 0,
              },
              author: { "@type": "Organization", name: "freecrypto.net editorial" },
              publisher: { "@type": "Organization", name: "freecrypto.net", url: siteUrl("/") },
              datePublished: "2026-09-20",
            }),
          }}
        />
      )}
    </div>
  );
}
