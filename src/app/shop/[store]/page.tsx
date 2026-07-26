import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStoreBySlug } from "@/lib/db";
import { renderMarkdown } from "@/lib/markdown";
import { isStoreIndexable, breadcrumbJsonLd, faqJsonLd, jsonLdScript, siteUrl } from "@/lib/seo";
import { CashbackBadge } from "@/components/CashbackBadge";
import { StoreLogo } from "@/components/StoreLogo";
import { AAds } from "@/components/AAds";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ store: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { store } = await params;
  const s = await getStoreBySlug(store);
  if (!s) return { title: "Store not found", robots: { index: false, follow: false } };
  const indexable = isStoreIndexable(s);
  const rate = s.cashback_text ? ` — ${s.cashback_kind === "discount" ? s.cashback_text : `${s.cashback_text} back`}` : "";
  const title = `Earn Bitcoin at ${s.name}${rate} (2026)`;
  const description = `How to earn Bitcoin at ${s.name} via Satsback — the current rate, how the tracking works, and whether it's worth it.`;
  return {
    title,
    description,
    alternates: { canonical: `/shop/${s.slug}` },
    openGraph: { title, description, type: "article", url: siteUrl(`/shop/${s.slug}`) },
    twitter: { card: "summary_large_image", title, description },
    robots: indexable ? undefined : { index: false, follow: true },
  };
}

export default async function StorePage({ params }: PageProps) {
  const { store } = await params;
  const s = await getStoreBySlug(store);
  if (!s) notFound();

  const crumbs = breadcrumbJsonLd([
    { name: "Home", url: siteUrl("/") },
    { name: "Shop & Earn", url: siteUrl("/shop") },
    { name: s.name, url: siteUrl(`/shop/${s.slug}`) },
  ]);
  const faq = faqJsonLd(s.faqs);

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <nav className="mb-4 text-xs text-text-faint" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-text-dim">Home</Link>
        <span className="mx-1.5">/</span>
        <Link href="/shop" className="hover:text-text-dim">Shop &amp; Earn</Link>
        {s.category_slug && s.category_name ? (
          <>
            <span className="mx-1.5">/</span>
            <Link href={`/shop/category/${s.category_slug}`} className="hover:text-text-dim">{s.category_name}</Link>
          </>
        ) : null}
        <span className="mx-1.5">/</span>
        <span className="text-text-dim line-clamp-1">{s.name}</span>
      </nav>

      <header className="mb-6 flex items-center gap-4">
        <StoreLogo src={s.logo_url} name={s.name} slug={s.slug} size={56} />
        <div>
          <h1 className="text-h1-page font-bold tracking-tight">Earn Bitcoin at {s.name}</h1>
          <div className="mt-2">
            <CashbackBadge text={s.cashback_text} kind={s.cashback_kind} />
          </div>
        </div>
      </header>

      <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(s.description_md) }} />

      <a
        href="/visit/satsback"
        rel="nofollow sponsored"
        className="my-6 inline-flex rounded-lg bg-accent px-5 py-3 text-sm font-medium text-ink"
      >
        Start earning at {s.name} — create a free Satsback account →
      </a>

      <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(s.how_it_works_md) }} />

      <div className="my-8 flex justify-center">
        <AAds zone="inline" />
      </div>

      <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(s.worth_it_md) }} />

      {s.faqs.length > 0 && (
        <section className="mt-10 border-t border-edge pt-8">
          <h2 className="mb-4 text-h2 font-semibold">Frequently asked questions</h2>
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
