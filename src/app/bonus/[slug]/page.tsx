import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BONUS_OFFERS, getBonusOffer } from "@/lib/bonuses";
import { AAds } from "@/components/AAds";
import { breadcrumbJsonLd, jsonLdScript, siteUrl, OG_IMAGE, TWITTER_IMAGE } from "@/lib/seo";

export const dynamic = "force-static";

export function generateStaticParams() {
  return BONUS_OFFERS.map((o) => ({ slug: o.slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const o = getBonusOffer(slug);
  if (!o) return { title: "Bonus not found", robots: { index: false, follow: false } };
  const title = `${o.name} Sign-Up Bonus — ${o.reward} (2026)`;
  const description = `How the ${o.name} referral bonus works: ${o.reward} ${o.rewardNote}. The real requirement, who it suits, the catch, and how to claim it.`;
  return {
    title,
    description,
    alternates: { canonical: `/bonus/${o.slug}` },
    openGraph: { title, description, type: "article", url: siteUrl(`/bonus/${o.slug}`), images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", title, description, images: [TWITTER_IMAGE] },
  };
}

export default async function BonusDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const o = getBonusOffer(slug);
  if (!o) notFound();

  const others = BONUS_OFFERS.filter((x) => x.slug !== o.slug);

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${o.name} sign-up bonus`,
    description: o.summary,
    author: { "@type": "Organization", name: "freecrypto.net editorial" },
    publisher: { "@type": "Organization", name: "freecrypto.net", url: siteUrl("/") },
    mainEntityOfPage: siteUrl(`/bonus/${o.slug}`),
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <nav className="mb-4 text-xs text-text-faint" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-text-dim">Home</Link>
        <span className="mx-1.5">/</span>
        <Link href="/bonus" className="hover:text-text-dim">Bonuses</Link>
        <span className="mx-1.5">/</span>
        <span className="text-text-dim">{o.name}</span>
      </nav>

      <header className="mb-6">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ background: o.accent }} aria-hidden />
          <span className="text-xs uppercase tracking-widest text-text-faint">{o.geo}</span>
        </div>
        <h1 className="mt-2 text-h1-page font-bold tracking-tight">{o.name} sign-up bonus</h1>
        <p className="mt-2 max-w-2xl text-text-dim">{o.tagline}</p>
        <div className="mt-4 inline-flex flex-col rounded-lg border border-edge bg-ink-soft/50 px-4 py-3">
          <span className="font-mono text-lg text-accent">{o.reward}</span>
          <span className="text-xs text-text-faint">{o.rewardNote}</span>
        </div>
      </header>

      <a
        href={`/visit/${o.visitCode}`}
        rel="nofollow sponsored"
        className="mb-8 inline-flex rounded-lg bg-accent px-5 py-3 text-sm font-medium text-ink"
      >
        Claim the {o.name} bonus →
      </a>

      <div className="space-y-8">
        <section>
          <h2 className="mb-2 text-h2 font-semibold">What you get</h2>
          <p className="text-sm text-text-dim">{o.summary}</p>
          <p className="mt-3 text-sm text-text-dim">
            <span className="font-medium text-text">The requirement: </span>
            {o.requirement}
          </p>
        </section>

        <div className="flex justify-center">
          <AAds zone="inline" />
        </div>

        <section>
          <h2 className="mb-3 text-h2 font-semibold">How to claim it</h2>
          <ol className="space-y-2">
            {o.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-text-dim">
                <span className="font-mono text-accent">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-text">Good for</h3>
            <p className="mt-1 text-sm text-text-dim">{o.goodFor}</p>
          </div>
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-text">Watch out</h3>
            <p className="mt-1 text-sm text-text-dim">{o.watchOut}</p>
          </div>
        </section>

        <a
          href={`/visit/${o.visitCode}`}
          rel="nofollow sponsored"
          className="inline-flex rounded-lg bg-accent px-5 py-3 text-sm font-medium text-ink"
        >
          Open {o.name} and claim your bonus →
        </a>

        <section className="border-t border-edge pt-6">
          <h2 className="mb-3 text-h2 font-semibold">Other bonuses</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {others.map((x) => (
              <Link key={x.slug} href={`/bonus/${x.slug}`} className="card p-4 transition-colors hover:border-accent/60">
                <div className="font-semibold text-text">{x.name}</div>
                <div className="mt-1 font-mono text-xs text-accent">{x.reward}</div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd([
        { name: "Home", url: siteUrl("/") },
        { name: "Bonuses", url: siteUrl("/bonus") },
        { name: o.name, url: siteUrl(`/bonus/${o.slug}`) },
      ])) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(article) }} />
    </article>
  );
}
