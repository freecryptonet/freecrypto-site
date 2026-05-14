import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuideBySlug, listGuides } from "@/lib/db";
import { renderMarkdown } from "@/lib/markdown";
import { breadcrumbJsonLd, jsonLdScript, siteUrl } from "@/lib/seo";
import { timeAgo } from "@/lib/format";
import { AAds } from "@/components/AAds";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const g = await getGuideBySlug(slug);
  if (!g) return { title: "Guide not found" };
  return {
    title: g.title,
    description: g.excerpt ?? undefined,
    alternates: { canonical: `/guides/${g.slug}` },
    openGraph: {
      title: g.title,
      description: g.excerpt ?? undefined,
      type: "article",
      url: siteUrl(`/guides/${g.slug}`),
      publishedTime: g.published_at?.toISOString(),
      modifiedTime: g.updated_at.toISOString(),
    },
  };
}

export default async function GuidePage({ params }: PageProps) {
  const { slug } = await params;
  const g = await getGuideBySlug(slug);
  if (!g) notFound();

  const more = (await listGuides(8)).filter((m) => m.slug !== g.slug).slice(0, 3);

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: g.title,
    description: g.excerpt ?? undefined,
    datePublished: g.published_at?.toISOString(),
    dateModified: g.updated_at.toISOString(),
    author: { "@type": "Organization", name: "freecrypto.net editorial" },
    publisher: {
      "@type": "Organization",
      name: "freecrypto.net",
      url: siteUrl("/"),
    },
    mainEntityOfPage: siteUrl(`/guides/${g.slug}`),
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <nav className="text-xs text-text-faint mb-4" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-text-dim">Home</Link>
        <span className="mx-1.5">/</span>
        <Link href="/guides" className="hover:text-text-dim">Guides</Link>
        <span className="mx-1.5">/</span>
        <span className="text-text-dim line-clamp-1">{g.title}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-h1-page font-bold tracking-tight">{g.title}</h1>
        <div className="mt-3 text-xs text-text-faint flex items-center gap-3">
          <span>Updated {timeAgo(g.updated_at)}</span>
        </div>
      </header>

      <div
        className="prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(g.body_md) }}
      />

      <div className="my-10 flex justify-center">
        <AAds zone="leaderboard" />
      </div>

      {more.length > 0 && (
        <section className="mt-12 border-t border-edge pt-8">
          <h2 className="text-h2 font-semibold mb-4">More guides</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {more.map((m) => (
              <Link
                key={m.id}
                href={`/guides/${m.slug}`}
                className="card p-4 hover:border-accent/60 transition-colors"
              >
                <div className="font-semibold text-sm">{m.title}</div>
                {m.excerpt ? (
                  <p className="text-xs text-text-dim mt-1 line-clamp-2">{m.excerpt}</p>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: "Home", url: siteUrl("/") },
              { name: "Guides", url: siteUrl("/guides") },
              { name: g.title, url: siteUrl(`/guides/${g.slug}`) },
            ]),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(article) }}
      />
    </article>
  );
}
