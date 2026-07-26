import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listStores, listStoreCategories } from "@/lib/db";
import { CashbackBadge } from "@/components/CashbackBadge";
import { StoreLogo } from "@/components/StoreLogo";
import { AAds } from "@/components/AAds";
import { breadcrumbJsonLd, jsonLdScript, siteUrl } from "@/lib/seo";
import { nlCategoryLabel, enCategorySlugFromNl } from "@/lib/store-i18n";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// `slug` here is the Dutch URL slug (e.g. "elektronica"); the DB uses the
// English category slug, so translate before looking up.
async function findCategory(nlSlug: string) {
  const enSlug = enCategorySlugFromNl(nlSlug);
  if (!enSlug) return null;
  const cats = await listStoreCategories("nl");
  return cats.find((c) => c.slug === enSlug) ?? null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cat = await findCategory(slug);
  if (!cat) return { title: "Categorie niet gevonden", robots: { index: false, follow: false } };
  const label = nlCategoryLabel(cat.slug, cat.name);
  const title = `Beste winkels voor Bitcoin cashback: ${label} (2026)`;
  const description = `Vergelijk ${label.toLowerCase()}-winkels die Bitcoin cashback geven via Satsback, gerangschikt op tarief.`;
  return {
    title,
    description,
    alternates: {
      canonical: `/nl/shop/category/${slug}`,
      languages: { "nl-NL": siteUrl(`/nl/shop/category/${slug}`), "en": siteUrl(`/shop/category/${cat.slug}`) },
    },
    openGraph: { title, description, type: "website", url: siteUrl(`/nl/shop/category/${slug}`), locale: "nl_NL" },
    robots: cat.store_count > 0 ? undefined : { index: false, follow: true },
  };
}

export default async function NlStoreCategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const cat = await findCategory(slug);
  if (!cat) notFound();
  const label = nlCategoryLabel(cat.slug, cat.name);

  const stores = await listStores({ categorySlug: cat.slug, sort: "rate", limit: 100, contentLang: "nl" });

  return (
    <div className="mx-auto max-w-page px-4 py-8">
      <nav className="mb-4 text-xs text-text-faint" aria-label="Kruimelpad">
        <Link href="/" className="hover:text-text-dim">Home</Link>
        <span className="mx-1.5">/</span>
        <Link href="/nl/shop" className="hover:text-text-dim">Shoppen &amp; verdienen</Link>
        <span className="mx-1.5">/</span>
        <span className="text-text-dim">{label}</span>
      </nav>

      <header className="mb-6 max-w-3xl">
        <h1 className="text-h1-page font-bold tracking-tight">Beste winkels voor Bitcoin cashback: {label}</h1>
        <p className="mt-2 text-sm text-text-dim">
          Elke winkel hieronder betaalt je in Bitcoin wanneer je via Satsback shopt, gerangschikt op
          het geadverteerde tarief. Procentuele tarieven belonen grotere bestellingen; vaste sats en
          kortingscodes zijn het best voor één geplande aankoop. Tarieven wijzigen — het getoonde
          bedrag is het actuele &ldquo;tot&rdquo;-maximum.
        </p>
      </header>

      <div className="mb-8 flex justify-center">
        <AAds zone="leaderboard" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-edge text-left text-xs text-text-faint">
              <th className="py-2 pr-4 font-medium">Winkel</th>
              <th className="py-2 pr-4 font-medium">Bitcoin-beloning</th>
              <th className="py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {stores.map((s) => (
              <tr key={s.id} className="border-b border-edge/50">
                <td className="py-3 pr-4">
                  <Link href={`/nl/shop/${s.slug}`} className="flex items-center gap-3 hover:text-accent">
                    <StoreLogo src={s.logo_url} name={s.name} slug={s.slug} size={28} />
                    <span className="font-medium text-text">{s.name}</span>
                  </Link>
                </td>
                <td className="py-3 pr-4">
                  <CashbackBadge text={s.cashback_text} kind={s.cashback_kind} lang="nl" />
                </td>
                <td className="py-3 text-right">
                  <Link href={`/nl/shop/${s.slug}`} className="text-xs text-accent hover:underline">Details →</Link>
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
              { name: "Shoppen & verdienen", url: siteUrl("/nl/shop") },
              { name: label, url: siteUrl(`/nl/shop/category/${slug}`) },
            ]),
          ),
        }}
      />
    </div>
  );
}
