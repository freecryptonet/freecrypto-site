import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAirdropBySlug, listAirdrops, type AirdropDetail } from "@/lib/db";
import { AirdropCard } from "@/components/AirdropCard";
import { AAds } from "@/components/AAds";
import { ExchangeCTA } from "@/components/ExchangeCTA";
import { StatusChip, KycChip } from "@/components/StatusChip";
import { Countdown } from "@/components/Countdown";
import { formatUsd, formatValueRange, timeAgo } from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown";
import {
  airdropEventJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
  jsonLdScript,
  siteUrl,
} from "@/lib/seo";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const a = await getAirdropBySlug(slug);
  if (!a) return { title: "Airdrop not found" };
  return {
    title: `${a.name} Airdrop — Eligibility & How to Claim`,
    description: a.short_description ||
      `Track the ${a.name} airdrop on freecrypto.net. Eligibility, claim steps, deadlines, and FAQ.`,
    alternates: { canonical: `/airdrops/${a.slug}` },
    openGraph: {
      title: `${a.name} Airdrop — freecrypto.net`,
      description: a.short_description || undefined,
      type: "article",
      url: siteUrl(`/airdrops/${a.slug}`),
    },
  };
}

export default async function AirdropDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const a = await getAirdropBySlug(slug);
  if (!a) notFound();

  const more = await listAirdrops({
    chainSlug: a.chain_slug || undefined,
    limit: 7,
    sort: "newest",
  });
  const moreFiltered = more.filter((m) => m.slug !== a.slug).slice(0, 4);

  const ctaHref = a.primary_cta_visit_code
    ? `/visit/${a.primary_cta_visit_code}`
    : a.project_url || "#";

  const eventLd = airdropEventJsonLd(a);
  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", url: siteUrl("/") },
    { name: a.chain_name ?? "Airdrops", url: siteUrl(a.chain_slug ? `/chains/${a.chain_slug}` : "/") },
    { name: a.name, url: siteUrl(`/airdrops/${a.slug}`) },
  ]);
  const faqLd = faqJsonLd(a.faqs);

  return (
    <article className="mx-auto max-w-page px-4 py-8">
      <Breadcrumbs a={a} />

      <Hero a={a} ctaHref={ctaHref} />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          {a.description_md.trim() ? (
            <Section title="About">
              <div
                className="prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(a.description_md) }}
              />
            </Section>
          ) : null}

          {a.eligibility_md.trim() ? (
            <Section title="Eligibility">
              <div
                className="prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(a.eligibility_md) }}
              />
            </Section>
          ) : null}

          <div className="my-8 flex justify-center">
            <AAds zone="leaderboard" />
          </div>

          <Section title={a.how_to_claim_md.trim() ? "How to claim" : `Visit ${a.name}`}>
            {a.how_to_claim_md.trim() ? (
              <div
                className="prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(a.how_to_claim_md) }}
              />
            ) : (
              <p className="text-text-dim text-sm max-w-prose">
                This listing is pulled from an external source. Follow the
                link below for the project's own claim guide.
              </p>
            )}
            <a
              href={ctaHref}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-btn bg-accent text-ink-soft font-semibold hover:bg-accent/90 transition-colors"
              rel="noopener nofollow"
            >
              Go to {a.name} →
            </a>
          </Section>

          {a.kyc_required ? (
            <div className="mt-8">
              <ExchangeCTA variant="row" />
            </div>
          ) : null}

          {a.faqs.length > 0 && (
            <Section title="FAQ">
              <div className="space-y-3">
                {a.faqs.map((f, i) => (
                  <details
                    key={i}
                    className="card p-4 [&_summary]:cursor-pointer"
                  >
                    <summary className="font-medium text-text">{f.question}</summary>
                    <div
                      className="prose prose-invert prose-sm max-w-none mt-2 text-text-dim"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(f.answer_md) }}
                    />
                  </details>
                ))}
              </div>
            </Section>
          )}
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start space-y-6">
          <InfoCard a={a} />
          <div className="flex justify-center">
            <AAds zone="sidebar" />
          </div>
        </aside>
      </div>

      {moreFiltered.length > 0 && (
        <section className="mt-12">
          <h2 className="text-h2 font-semibold mb-4">
            More {a.chain_name ?? "airdrops"} to farm
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {moreFiltered.map((m) => (
              <AirdropCard key={m.id} a={m} />
            ))}
          </div>
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(eventLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbs) }}
      />
      {faqLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(faqLd) }}
        />
      ) : null}
    </article>
  );
}

function Breadcrumbs({ a }: { a: AirdropDetail }) {
  return (
    <nav className="text-xs text-text-faint mb-4" aria-label="Breadcrumb">
      <Link href="/" className="hover:text-text-dim">Home</Link>
      <span className="mx-1.5">/</span>
      {a.chain_slug ? (
        <>
          <Link href={`/chains/${a.chain_slug}`} className="hover:text-text-dim">
            {a.chain_name}
          </Link>
          <span className="mx-1.5">/</span>
        </>
      ) : null}
      <span className="text-text-dim">{a.name}</span>
    </nav>
  );
}

function Hero({ a, ctaHref }: { a: AirdropDetail; ctaHref: string }) {
  return (
    <header className="card p-6 md:p-8">
      <div className="flex flex-wrap items-start gap-4 justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <div
            aria-hidden
            className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center text-base font-bold text-white"
            style={{ background: `linear-gradient(135deg, hsl(${hashHue(a.slug)} 70% 28%), hsl(${hashHue(a.slug) + 40} 70% 18%))` }}
          >
            {a.token_symbol?.slice(0, 3) ?? a.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <StatusChip status={a.status} />
              <KycChip required={a.kyc_required} />
              {a.token_symbol ? (
                <span className="chip">{a.token_symbol}</span>
              ) : null}
            </div>
            <h1 className="text-h1-page font-bold tracking-tight">{a.name}</h1>
            {a.short_description ? (
              <p className="text-text-dim mt-1 text-sm">{a.short_description}</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {a.end_date ? (
            <div className="text-right">
              <div className="text-xs text-text-faint">Ends in</div>
              <Countdown to={a.end_date} className="text-base" />
            </div>
          ) : null}
          <a
            href={ctaHref}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-btn bg-accent text-ink-soft font-semibold hover:bg-accent/90"
            rel="noopener nofollow"
          >
            Visit {a.name} →
          </a>
        </div>
      </div>
    </header>
  );
}

function InfoCard({ a }: { a: AirdropDetail }) {
  // Only render rows whose value is meaningful. The "Updated" row always
  // renders since updated_at is non-null by definition.
  const allRows: Array<[string, React.ReactNode | null]> = [
    ["Token", a.token_symbol || null],
    ["Chain", a.chain_name || null],
    ["Category", a.category_name || null],
    [
      "Estimated value",
      a.estimated_value_usd_min != null || a.estimated_value_usd_max != null
        ? formatValueRange(a.estimated_value_usd_min, a.estimated_value_usd_max)
        : null,
    ],
    [
      "Funding raised",
      a.funding_raised_usd ? formatUsd(a.funding_raised_usd, { compact: true }) : null,
    ],
    ["Social score", a.social_score != null ? `${a.social_score}/100` : null],
    ["Started", a.started_at ? a.started_at.toISOString().slice(0, 10) : null],
    ["Snapshot", a.snapshot_date ? a.snapshot_date.toISOString().slice(0, 10) : null],
    ["Ends", a.end_date ? a.end_date.toISOString().slice(0, 10) : null],
    ["Updated", timeAgo(a.updated_at)],
  ];
  const rows = allRows.filter(([, v]) => v != null) as Array<[string, React.ReactNode]>;
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-widest text-text-faint mb-2">
        Project info
      </div>
      <dl className="text-sm divide-y divide-edge/60">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between py-2 gap-3">
            <dt className="text-text-faint">{k}</dt>
            <dd className="text-text text-right">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {a.project_url ? (
          <a href={a.project_url} className="chip hover:border-accent/60" rel="noopener nofollow">Website</a>
        ) : null}
        {a.twitter_url ? (
          <a href={a.twitter_url} className="chip hover:border-accent/60" rel="noopener nofollow">X / Twitter</a>
        ) : null}
        {a.discord_url ? (
          <a href={a.discord_url} className="chip hover:border-accent/60" rel="noopener nofollow">Discord</a>
        ) : null}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 first:mt-0">
      <h2 className="text-h2 font-semibold mb-3">{title}</h2>
      {children}
    </section>
  );
}

function hashHue(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) & 0xffff;
  }
  return h % 360;
}
