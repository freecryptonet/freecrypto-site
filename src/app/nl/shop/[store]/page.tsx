import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStoreBySlug } from "@/lib/db";
import { renderMarkdown } from "@/lib/markdown";
import { isStoreIndexable, breadcrumbJsonLd, faqJsonLd, jsonLdScript, siteUrl, OG_IMAGE, TWITTER_IMAGE } from "@/lib/seo";
import { CashbackBadge } from "@/components/CashbackBadge";
import { StoreLogo } from "@/components/StoreLogo";
import { AAds } from "@/components/AAds";
import { nlCategoryLabel, nlCategorySlug, nlRate } from "@/lib/store-i18n";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ store: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { store } = await params;
  const s = await getStoreBySlug(store, "nl");
  if (!s || !s.has_nl) return { title: "Winkel niet gevonden", robots: { index: false, follow: false } };
  const indexable = isStoreIndexable(s);
  const rate = s.cashback_text ? ` — ${nlRate(s.cashback_text)}${s.cashback_kind === "discount" ? "" : " terug"}` : "";
  const title = `Bitcoin cashback bij ${s.name}${rate} (2026)`;
  const description = `Zo verdien je Bitcoin bij ${s.name} via Satsback — het actuele tarief, hoe de tracking werkt en of het de moeite waard is.`;
  const languages: Record<string, string> = { "nl-NL": siteUrl(`/nl/shop/${s.slug}`) };
  if (s.has_en) {
    languages["en"] = siteUrl(`/shop/${s.slug}`);
    languages["x-default"] = siteUrl(`/shop/${s.slug}`);
  } else {
    languages["x-default"] = siteUrl(`/nl/shop/${s.slug}`);
  }
  return {
    title,
    description,
    alternates: { canonical: `/nl/shop/${s.slug}`, languages },
    openGraph: { title, description, type: "article", url: siteUrl(`/nl/shop/${s.slug}`), locale: "nl_NL", images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", title, description, images: [TWITTER_IMAGE] },
    robots: indexable ? undefined : { index: false, follow: true },
  };
}

export default async function NlStorePage({ params }: PageProps) {
  const { store } = await params;
  const s = await getStoreBySlug(store, "nl");
  if (!s || !s.has_nl) notFound();

  const crumbs = breadcrumbJsonLd([
    { name: "Home", url: siteUrl("/") },
    { name: "Shoppen & verdienen", url: siteUrl("/nl/shop") },
    ...(s.category_slug && s.category_name
      ? [{
          name: nlCategoryLabel(s.category_slug, s.category_name),
          url: siteUrl(`/nl/shop/category/${nlCategorySlug(s.category_slug)}`),
        }]
      : []),
    { name: s.name, url: siteUrl(`/nl/shop/${s.slug}`) },
  ]);
  const faq = faqJsonLd(s.faqs);

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <nav className="mb-4 text-xs text-text-faint" aria-label="Kruimelpad">
        <Link href="/" className="hover:text-text-dim">Home</Link>
        <span className="mx-1.5">/</span>
        <Link href="/nl/shop" className="hover:text-text-dim">Shoppen &amp; verdienen</Link>
        {s.category_slug && s.category_name ? (
          <>
            <span className="mx-1.5">/</span>
            <Link href={`/nl/shop/category/${nlCategorySlug(s.category_slug)}`} className="hover:text-text-dim">
              {nlCategoryLabel(s.category_slug, s.category_name)}
            </Link>
          </>
        ) : null}
        <span className="mx-1.5">/</span>
        <span className="text-text-dim line-clamp-1">{s.name}</span>
      </nav>

      <header className="mb-6 flex items-center gap-4">
        <StoreLogo src={s.logo_url} name={s.name} slug={s.slug} size={56} />
        <div>
          <h1 className="text-h1-page font-bold tracking-tight">Bitcoin cashback bij {s.name}</h1>
          <div className="mt-2">
            <CashbackBadge text={s.cashback_text} kind={s.cashback_kind} lang="nl" />
          </div>
        </div>
      </header>

      {s.has_en ? (
        <p className="mb-4 text-xs text-text-faint">
          🇬🇧 <Link href={`/shop/${s.slug}`} className="text-accent hover:underline">Read in English</Link>
        </p>
      ) : null}

      <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(s.description_md) }} />

      <a
        href="/visit/satsback"
        rel="nofollow sponsored"
        className="my-6 inline-flex rounded-lg bg-accent px-5 py-3 text-sm font-medium text-ink"
      >
        Begin bij {s.name} — maak een gratis Satsback-account aan →
      </a>

      <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(s.how_it_works_md) }} />

      <div className="my-8 flex justify-center">
        <AAds zone="inline" />
      </div>

      <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(s.worth_it_md) }} />

      {s.faqs.length > 0 && (
        <section className="mt-10 border-t border-edge pt-8">
          <h2 className="mb-4 text-h2 font-semibold">Veelgestelde vragen</h2>
          <dl className="space-y-4">
            {s.faqs.map((f, i) => (
              <div key={i}>
                <dt className="font-semibold text-text">{f.question}</dt>
                <dd className="mt-1 text-sm text-text-dim" dangerouslySetInnerHTML={{ __html: renderMarkdown(f.answer_md) }} />
              </div>
            ))}
          </dl>
        </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(crumbs) }} />
      {faq && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(faq) }} />}
    </article>
  );
}
