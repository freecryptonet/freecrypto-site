import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listStores, listStoreCategories } from "@/lib/db";
import { CashbackBadge } from "@/components/CashbackBadge";
import { StoreLogo } from "@/components/StoreLogo";
import { AAds } from "@/components/AAds";
import { breadcrumbJsonLd, jsonLdScript, siteUrl, OG_IMAGE, TWITTER_IMAGE } from "@/lib/seo";
import { nlCategorySlug } from "@/lib/store-i18n";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function findCategory(slug: string) {
  const cats = await listStoreCategories("en");
  return cats.find((c) => c.slug === slug) ?? null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cat = await findCategory(slug);
  if (!cat) return { title: "Category not found", robots: { index: false, follow: false } };
  const title = `Best Stores for Bitcoin Cashback: ${cat.name} (2026)`;
  const description =
    cat.description || `Compare ${cat.name.toLowerCase()} stores that pay Bitcoin cashback via Satsback, ranked by rate.`;
  return {
    title,
    description,
    alternates: {
      canonical: `/shop/category/${cat.slug}`,
      languages: {
        "en": siteUrl(`/shop/category/${cat.slug}`),
        "nl-NL": siteUrl(`/nl/shop/category/${nlCategorySlug(cat.slug)}`),
        "x-default": siteUrl(`/shop/category/${cat.slug}`),
      },
    },
    openGraph: { title, description, type: "website", url: siteUrl(`/shop/category/${cat.slug}`), images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", title, description, images: [TWITTER_IMAGE] },
    robots: cat.store_count > 0 ? undefined : { index: false, follow: true },
  };
}

export default async function StoreCategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const cat = await findCategory(slug);
  if (!cat) notFound();

  const stores = await listStores({ categorySlug: cat.slug, sort: "rate", limit: 100, contentLang: "en" });

  return (
    <div className="mx-auto max-w-page px-4 py-8">
      <nav className="mb-4 text-xs text-text-faint" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-text-dim">Home</Link>
        <span className="mx-1.5">/</span>
        <Link href="/shop" className="hover:text-text-dim">Shop &amp; Earn</Link>
        <span className="mx-1.5">/</span>
        <span className="text-text-dim">{cat.name}</span>
      </nav>

      <header className="mb-6 max-w-3xl">
        <h1 className="text-h1-page font-bold tracking-tight">Best stores for Bitcoin cashback: {cat.name}</h1>
        {cat.description ? <p className="mt-2 text-sm text-text-dim">{cat.description}</p> : null}
        <p className="mt-2 text-sm text-text-dim">
          Every store below pays you back in Bitcoin when you shop through Satsback, ranked by the
          rate they advertise. Percentage rates reward bigger baskets; fixed sats and discount codes
          are best on a single planned purchase. Rates change — the figure shown is the current
          &ldquo;up to&rdquo; ceiling.
        </p>
      </header>

      <div className="mb-8 flex justify-center">
        <AAds zone="leaderboard" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-edge text-left text-xs text-text-faint">
              <th className="py-2 pr-4 font-medium">Store</th>
              <th className="py-2 pr-4 font-medium">Bitcoin reward</th>
              <th className="py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {stores.map((s) => (
              <tr key={s.id} className="border-b border-edge/50">
                <td className="py-3 pr-4">
                  <Link href={`/shop/${s.slug}`} className="flex items-center gap-3 hover:text-accent">
                    <StoreLogo src={s.logo_url} name={s.name} slug={s.slug} size={28} />
                    <span className="font-medium text-text">{s.name}</span>
                  </Link>
                </td>
                <td className="py-3 pr-4">
                  <CashbackBadge text={s.cashback_text} kind={s.cashback_kind} />
                </td>
                <td className="py-3 text-right">
                  <Link href={`/shop/${s.slug}`} className="text-xs text-accent hover:underline">Details →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: "Home", url: siteUrl("/") },
              { name: "Shop & Earn", url: siteUrl("/shop") },
              { name: cat.name, url: siteUrl(`/shop/category/${cat.slug}`) },
            ]),
          ),
        }}
      />
    </div>
  );
}
